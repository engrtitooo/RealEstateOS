'use client';

import { useState, useRef } from 'react';
import Navigation from '../../components/Navigation';
import { DesignSystem, StyleType } from '@/types/project';

// Default Modern Design System
const defaultDesign: DesignSystem = {
    overallStyle: 'modern',
    flooring: 'Light Oak',
    wallColorPalette: ['White', 'Light Grey'],
    lightingTemperature: 'Warm',
    lightingStyle: 'Recessed',
    furnitureAesthetic: 'Modern Minimalist',
    materialMood: ['Matte', 'Natural']
};

export default function VirtualStagingPage() {
    const [photo, setPhoto] = useState<string | null>(null);
    const [stagedImage, setStagedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [roomType, setRoomType] = useState('Living Room');
    const [style, setStyle] = useState('modern');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPhoto(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleStage = async () => {
        if (!photo) return;
        setIsGenerating(true);

        try {
            // Update design system with selected style
            const currentDesign = { ...defaultDesign, overallStyle: style as StyleType };

            const res = await fetch('/api/virtual-stage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoBase64: photo,
                    roomType,
                    designSystem: currentDesign
                })
            });

            const data = await res.json();
            if (data.success) {
                setStagedImage(data.imageUrl);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0c0f19] text-white">
            <Navigation currentStep="staging" />

            <main className="container mx-auto px-6 py-12">
                <h1 className="text-4xl font-display font-bold mb-8">Virtual Staging Studio</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Controls */}
                    <div className="space-y-8">
                        <div className="glass-card p-8 rounded-3xl">
                            <h2 className="text-xl font-semibold mb-4">1. Upload Empty Room</h2>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500 transition-colors"
                            >
                                {photo ? (
                                    <img src={photo} alt="Upload" className="max-h-64 mx-auto rounded-lg" />
                                ) : (
                                    <div className="text-gray-400">
                                        <p className="text-lg">Click to Upload Photo</p>
                                        <p className="text-sm">JPG/PNG supported</p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>

                        <div className="glass-card p-8 rounded-3xl">
                            <h2 className="text-xl font-semibold mb-4">2. Configuration</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Room Type</label>
                                    <select
                                        value={roomType}
                                        onChange={(e) => setRoomType(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-primary-500 outline-none"
                                    >
                                        <option>Living Room</option>
                                        <option>Bedroom</option>
                                        <option>Children's Room</option>
                                        <option>Dining Room</option>
                                        <option>Home Office</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Style</label>
                                    <select
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-primary-500 outline-none"
                                    >
                                        <option value="modern">Modern</option>
                                        <option value="minimalist">Minimalist</option>
                                        <option value="scandinavian">Scandinavian</option>
                                        <option value="luxury">Luxury</option>
                                        <option value="industrial">Industrial</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleStage}
                                disabled={!photo || isGenerating}
                                className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all ${!photo || isGenerating
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'btn-primary hover:shadow-lg hover:shadow-primary-500/25'
                                    }`}
                            >
                                {isGenerating ? 'Staging Room...' : 'Generate Staging'}
                            </button>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="glass-card p-8 rounded-3xl min-h-[600px] flex items-center justify-center">
                        {stagedImage ? (
                            <div className="space-y-4 w-full">
                                <h2 className="text-xl font-semibold">Staged Result</h2>
                                <img src={stagedImage} alt="Staged" className="w-full rounded-xl shadow-2xl" />
                                <a
                                    href={stagedImage}
                                    download={`staged-${roomType}.png`}
                                    className="block w-full text-center py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    Download Image
                                </a>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <p className="text-xl">Result will appear here</p>
                                <p className="text-sm">Upload a photo to begin</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
