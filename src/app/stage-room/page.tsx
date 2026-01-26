'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { StyleType, StagePhotoResponse } from '@/types/project';

const styles: { value: StyleType; label: string; description: string }[] = [
    { value: 'modern', label: 'Modern', description: 'Clean lines and contemporary aesthetics' },
    { value: 'classic', label: 'Classic', description: 'Timeless elegance and refined details' },
    { value: 'luxury', label: 'Luxury', description: 'Opulent materials and designer touches' },
    { value: 'minimalist', label: 'Minimalist', description: 'Serene and uncluttered spaces' },
    { value: 'scandinavian', label: 'Scandinavian', description: 'Light woods and cozy warmth' },
    { value: 'industrial', label: 'Industrial', description: 'Urban chic with raw materials' },
    { value: 'bohemian', label: 'Bohemian', description: 'Eclectic and artistic vibes' },
    { value: 'coastal', label: 'Coastal', description: 'Breezy beach-inspired serenity' },
];

export default function StageRoomPage() {
    const [selectedStyle, setSelectedStyle] = useState<StyleType>('modern');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [stagedResult, setStagedResult] = useState<{ imageUrl: string; caption?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }
        setImageFile(file);
        setError(null);
        setStagedResult(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileChange(file);
    }, [handleFileChange]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleStage = async () => {
        if (!imageFile || !imagePreview) {
            setError('Please upload an image first');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Extract base64 data from data URL
            const base64Data = imagePreview.split(',')[1];

            const response = await fetch('/api/stage-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoBase64: base64Data,
                    style: selectedStyle,
                    mimeType: imageFile.type,
                    generateCaption: true,
                }),
            });

            const data: StagePhotoResponse = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to stage photo');
            }

            setStagedResult({
                imageUrl: data.imageUrl!,
                caption: data.caption,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setImageFile(null);
        setImagePreview(null);
        setStagedResult(null);
        setError(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0c0f19] via-[#141928] to-[#1a1f35]">
            {/* Header */}
            <header className="glass-dark sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="text-xl font-display font-bold gradient-text">RealEstateOS</span>
                    </Link>
                    <h1 className="text-lg font-semibold text-gray-300">Stage a Room</h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Panel - Upload & Settings */}
                    <div className="space-y-6">
                        {/* Upload Zone */}
                        <div className="glass-card rounded-2xl p-6">
                            <h2 className="text-xl font-display font-bold mb-4">Upload Room Photo</h2>

                            <div
                                className={`dropzone ${isDragging ? 'drag-over' : ''} ${imagePreview ? 'has-file' : ''}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => document.getElementById('file-input')?.click()}
                            >
                                {imagePreview ? (
                                    <div className="relative">
                                        <img src={imagePreview} alt="Upload preview" className="max-h-64 mx-auto rounded-lg" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-8">
                                        <svg className="w-12 h-12 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-gray-400 mb-2">Drag and drop your room photo here</p>
                                        <p className="text-gray-500 text-sm">or click to browse</p>
                                    </div>
                                )}
                                <input
                                    id="file-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                                />
                            </div>
                        </div>

                        {/* Style Selector */}
                        <div className="glass-card rounded-2xl p-6">
                            <h2 className="text-xl font-display font-bold mb-4">Choose Style</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {styles.map((style) => (
                                    <button
                                        key={style.value}
                                        onClick={() => setSelectedStyle(style.value)}
                                        className={`p-4 rounded-xl text-left transition-all ${selectedStyle === style.value
                                                ? 'bg-primary-500/20 border-2 border-primary-500'
                                                : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                                            }`}
                                    >
                                        <p className="font-semibold text-sm mb-1">{style.label}</p>
                                        <p className="text-xs text-gray-400 hidden sm:block">{style.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleStage}
                            disabled={!imageFile || isLoading}
                            className={`w-full btn-primary py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 ${(!imageFile || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner w-6 h-6" />
                                    <span>Staging Room...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    <span>Stage This Room</span>
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Result */}
                    <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-xl font-display font-bold mb-4">Staged Result</h2>

                        {stagedResult ? (
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden">
                                    <img
                                        src={stagedResult.imageUrl}
                                        alt="Staged room"
                                        className="w-full"
                                    />
                                </div>

                                {stagedResult.caption && (
                                    <div className="p-4 rounded-xl bg-white/5">
                                        <p className="text-sm text-gray-400 mb-1">Listing Caption:</p>
                                        <p className="text-gray-200">{stagedResult.caption}</p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = stagedResult.imageUrl;
                                            link.download = 'staged-room.png';
                                            link.click();
                                        }}
                                        className="flex-1 btn-secondary py-3 rounded-xl flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 btn-secondary py-3 rounded-xl"
                                    >
                                        Stage Another
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p>Your staged result will appear here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
