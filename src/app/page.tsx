'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSignInClick = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <main className="min-h-screen animated-gradient">
            {/* Coming Soon Toast */}
            <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-primary-500/30">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-white">Coming Soon!</p>
                        <p className="text-sm text-gray-400">User accounts launching soon. Enjoy the full demo!</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="text-xl font-display font-bold gradient-text">RealEstateOS</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
                        <button onClick={handleSignInClick} className="btn-secondary text-sm py-2 px-4">Sign In</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />

                <div className={`max-w-7xl mx-auto text-center relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm text-gray-300">Powered by Google Gemini AI</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
                        Transform Properties with
                        <span className="block gradient-text">AI-Powered Staging</span>
                    </h1>

                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
                        From empty rooms to stunning staged spaces. From floor plans to complete design concepts.
                        Create professional listings in minutes with the power of AI.
                    </p>

                    {/* CTA Cards */}
                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {/* Stage a Room Card */}
                        <Link href="/stage-room" className="group glass-card rounded-2xl p-8 text-left card-hover">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-display font-bold mb-3">Stage a Room</h3>
                            <p className="text-gray-400 mb-6">
                                Upload a photo of an empty room and watch AI transform it into a professionally staged space while preserving the exact camera angle and room geometry.
                            </p>
                            <div className="flex items-center text-primary-400 font-semibold group-hover:gap-3 gap-2 transition-all">
                                <span>Get Started</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </Link>

                        {/* Design a Whole Home Card */}
                        <Link href="/design-home" className="group glass-card rounded-2xl p-8 text-left card-hover">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-display font-bold mb-3">Design a Whole Home</h3>
                            <p className="text-gray-400 mb-6">
                                Upload a 2D floor plan and get a complete design package: 3D overview, staged room renders, and MLS-ready listing copy.
                            </p>
                            <div className="flex items-center text-accent-400 font-semibold group-hover:gap-3 gap-2 transition-all">
                                <span>Get Started</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-display font-bold mb-4">Why Choose RealEstateOS?</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Powered by Google's most advanced AI models for photorealistic results
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                ),
                                title: 'Lightning Fast',
                                description: 'Generate complete staging packages in minutes, not hours. AI processes your images instantly.',
                            },
                            {
                                icon: (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                ),
                                title: 'Structure Preserving',
                                description: 'Our AI maintains exact room geometry, camera angles, and architectural features.',
                            },
                            {
                                icon: (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                ),
                                title: 'MLS-Ready Copy',
                                description: 'Professional listing descriptions crafted by AI, ready for immediate use.',
                            },
                        ].map((feature, i) => (
                            <div key={i} className="glass-card rounded-2xl p-8 card-hover">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-6 text-primary-400">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-900/20 to-transparent" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-display font-bold mb-4">How It Works</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Three simple steps to transform your property listings
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Upload', description: 'Upload your room photo or floor plan in seconds' },
                            { step: '02', title: 'Customize', description: 'Choose your preferred design style from our curated options' },
                            { step: '03', title: 'Generate', description: 'Get photorealistic results and professional copy instantly' },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className="text-8xl font-display font-bold text-primary-500/10 absolute -top-4 -left-2">
                                    {item.step}
                                </div>
                                <div className="relative z-10 pt-12">
                                    <h3 className="text-2xl font-display font-bold mb-3">{item.title}</h3>
                                    <p className="text-gray-400">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="font-display font-bold">RealEstateOS</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Built for the Gemini Hackathon • Powered by Google AI
                    </p>
                </div>
            </footer>
        </main>
    );
}
