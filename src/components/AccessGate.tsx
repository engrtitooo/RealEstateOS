'use client';

import { useState, useEffect, ReactNode } from 'react';

interface AccessGateProps {
    children: ReactNode;
}

const ACCESS_STORAGE_KEY = 'realestateOS_access_verified';

export default function AccessGate({ children }: AccessGateProps) {
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(ACCESS_STORAGE_KEY);
        if (stored === 'true') {
            setIsVerified(true);
        } else {
            setIsVerified(false);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('Please enter an access code');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/verify-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim() }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem(ACCESS_STORAGE_KEY, 'true');
                setIsVerified(true);
            } else {
                setError(data.error || 'Invalid access code');
            }
        } catch {
            setError('Failed to verify. Please try again.');
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

    // Verified - show children
    if (isVerified) {
        return <>{children}</>;
    }

    // Not verified - show access code prompt
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0c0f19] via-[#141928] to-[#1a1f35] flex items-center justify-center p-6">
            <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <span className="text-2xl font-display font-bold gradient-text">RealEstateOS</span>
                </div>

                {/* Lock Icon */}
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-display font-bold mb-2">Protected Demo</h1>
                <p className="text-gray-400 mb-6">
                    Enter the access code to explore this AI-powered real estate platform.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Enter Access Code"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-center text-lg tracking-widest font-mono"
                        autoFocus
                        maxLength={20}
                    />

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner w-5 h-5" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                                <span>Unlock Access</span>
                            </>
                        )}
                    </button>
                </form>

                <p className="text-gray-500 text-xs mt-6">
                    For hackathon judges: Access code is provided in the submission notes.
                </p>
            </div>
        </div>
    );
}
