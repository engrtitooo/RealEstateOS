'use client';

import { useState, useEffect, ReactNode } from 'react';

interface AccessGateProps {
    children: ReactNode;
}

const ACCESS_STORAGE_KEY = 'realestateOS_access_verified';
const TOKEN_STORAGE_KEY = 'realestateOS_session_token';

export default function AccessGate({ children }: AccessGateProps) {
    const [isVerified, setIsVerified] = useState<boolean | null>(null);

    // Step state: 1 = Password Entry, 2 = Email 2FA Code Entry
    const [step, setStep] = useState<1 | 2>(1);

    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
    const [emailMasked, setEmailMasked] = useState<string>('your email');

    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check session on mount
    useEffect(() => {
        // 1. Invalidate legacy insecure auth states to force sign-in for returning users
        localStorage.removeItem(ACCESS_STORAGE_KEY);

        // 2. Check the real HttpOnly session cookie state via API
        fetch('/api/check-auth')
            .then(res => res.json())
            .then(data => {
                setIsVerified(!!data.authenticated);
            })
            .catch(() => {
                setIsVerified(false);
            });
    }, []);

    // Step 1: Submit Password
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter the application password');
            return;
        }

        setIsLoading(true);
        setError(null);
        setInfoMessage(null);

        try {
            const response = await fetch('/api/verify-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password.trim() }),
            });

            const data = await response.json();

            if (data.success && data.require2FA) {
                setTwoFactorToken(data.twoFactorToken);
                setEmailMasked(data.emailMasked || 'your admin email');
                setStep(2);
                setInfoMessage(`2FA verification code sent to ${data.emailMasked || 'your email'}`);
            } else {
                setError(data.error || 'Invalid application password');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Submit 6-digit 2FA Code
    const handle2FASubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode.trim() || !twoFactorToken) {
            setError('Please enter the 6-digit verification code');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    twoFactorToken,
                    code: otpCode.trim(),
                }),
            });

            const data = await response.json();

            if (data.success) {
                if (data.token) {
                    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
                }
                // Relying entirely on HttpOnly cookie set by the server for session state now
                setIsVerified(true);
            } else {
                setError(data.error || 'Invalid 2FA code');
            }
        } catch {
            setError('Failed to verify 2FA code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isVerified === null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0c0f19] via-[#141928] to-[#1a1f35] flex items-center justify-center">
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    // Verified - render application content
    if (isVerified) {
        return <>{children}</>;
    }

    // Not verified - show 2-step access prompt
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0c0f19] via-[#141928] to-[#1a1f35] flex items-center justify-center p-6">
            <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center border border-white/10 shadow-2xl">
                {/* Brand Header */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 011-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <span className="text-2xl font-display font-bold gradient-text">RealEstateOS</span>
                </div>

                {step === 1 ? (
                    /* Step 1: Master Password Entry */
                    <>
                        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
                            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-display font-bold mb-2 text-white">Protected Application</h1>
                        <p className="text-gray-400 text-sm mb-6">
                            Enter master application password to request 2FA email code.
                        </p>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Master Password"
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-center text-lg font-mono"
                                autoFocus
                            />

                            {error && (
                                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-lg">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner w-5 h-5" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <span>Continue with Password</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    /* Step 2: 2FA OTP Email Code Entry */
                    <>
                        <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-4 border border-accent-500/30">
                            <svg className="w-8 h-8 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-display font-bold mb-2 text-white">Two-Factor Authentication</h1>
                        <p className="text-gray-300 text-sm mb-4">
                            A 6-digit security code was dispatched to:
                        </p>
                        <p className="font-mono font-semibold text-primary-400 bg-primary-500/10 border border-primary-500/30 py-1.5 px-3 rounded-lg inline-block mb-6 text-sm">
                            {emailMasked}
                        </p>

                        {infoMessage && (
                            <p className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-lg mb-4">{infoMessage}</p>
                        )}

                        <form onSubmit={handle2FASubmit} className="space-y-4">
                            <input
                                type="text"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 text-center text-2xl tracking-[0.4em] font-mono"
                                autoFocus
                            />

                            {error && (
                                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-lg">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent-500/25"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner w-5 h-5" />
                                        <span>Verifying 2FA Code...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Verify & Unlock</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <button
                            onClick={() => {
                                setStep(1);
                                setError(null);
                                setInfoMessage(null);
                            }}
                            className="mt-4 text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-4"
                        >
                            ← Back to Password Entry
                        </button>
                    </>
                )}

                <p className="text-gray-500 text-xs mt-6 border-t border-white/5 pt-4">
                    Authorized Access Only • Protected by 2FA & API Key Encryption
                </p>
            </div>
        </div>
    );
}
