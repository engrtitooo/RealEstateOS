'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation({ currentStep }: { currentStep?: string }) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="w-full border-b border-white/10 bg-[#0c0f19] backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <span className="font-display font-bold text-xl">RealEstateOS</span>
                </Link>

                <div className="flex items-center gap-1">
                    <Link
                        href="/design-home"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/design-home')
                                ? 'bg-primary-500/10 text-primary-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Floor Plan Design
                    </Link>
                    <Link
                        href="/virtual-staging"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/virtual-staging')
                                ? 'bg-primary-500/10 text-primary-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Virtual Staging
                    </Link>
                </div>
            </div>
        </nav>
    );
}
