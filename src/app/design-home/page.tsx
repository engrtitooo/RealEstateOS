'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type {
    StyleType,
    AnalyzePlanResponse,
    FloorPlanAnalysis,
    GeneratedRoom,
    ListingDescription
} from '@/types/project';

const styles: { value: StyleType; label: string }[] = [
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'scandinavian', label: 'Scandinavian' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'bohemian', label: 'Bohemian' },
    { value: 'coastal', label: 'Coastal' },
];

type WorkflowStep = 'upload' | 'analyzing' | 'generating' | 'complete';

export default function DesignHomePage() {
    const [selectedStyle, setSelectedStyle] = useState<StyleType>('modern');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');
    const [analysis, setAnalysis] = useState<FloorPlanAnalysis | null>(null);
    const [overview3d, setOverview3d] = useState<string | null>(null);
    const [generatedRooms, setGeneratedRooms] = useState<GeneratedRoom[]>([]);
    const [description, setDescription] = useState<ListingDescription | null>(null);
    const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleFileChange = useCallback((file: File) => {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            setError('Please upload an image or PDF file');
            return;
        }
        setImageFile(file);
        setError(null);
        setWorkflowStep('upload');
        setAnalysis(null);
        setOverview3d(null);
        setGeneratedRooms([]);
        setDescription(null);

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

    const handleGenerate = async () => {
        if (!imageFile || !imagePreview) {
            setError('Please upload a floor plan first');
            return;
        }

        setError(null);
        setWorkflowStep('analyzing');

        try {
            // Step 1: Analyze the floor plan
            const base64Data = imagePreview.split(',')[1];

            const analyzeResponse = await fetch('/api/analyze-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    floorPlanBase64: base64Data,
                    style: selectedStyle,
                    mimeType: imageFile.type,
                }),
            });

            const analyzeData: AnalyzePlanResponse = await analyzeResponse.json();

            if (!analyzeData.success || !analyzeData.data) {
                throw new Error(analyzeData.error || 'Failed to analyze floor plan');
            }

            setAnalysis(analyzeData.data);
            setWorkflowStep('generating');

            // Step 2: Generate 3D overview
            const overviewResponse = await fetch('/api/generate-overview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    overviewPrompt: analyzeData.data.overviewPrompt,
                    designSystem: analyzeData.data.designSystem,
                }),
            });

            const overviewData = await overviewResponse.json();
            if (overviewData.success && overviewData.imageUrl) {
                setOverview3d(overviewData.imageUrl);
            }

            // Step 3: Generate room images one by one
            const rooms: GeneratedRoom[] = [];
            for (let i = 0; i < analyzeData.data.rooms.length; i++) {
                setCurrentRoomIndex(i);
                const room = analyzeData.data.rooms[i];

                const roomResponse = await fetch('/api/generate-room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: room.name,
                        designSystem: analyzeData.data.designSystem,
                        approxSize: room.approxSize,
                        function: room.function,
                    }),
                });

                const roomData = await roomResponse.json();
                if (roomData.success && roomData.imageUrl) {
                    rooms.push({
                        name: room.name,
                        imageUrl: roomData.imageUrl,
                        prompt: roomData.prompt,
                    });
                    setGeneratedRooms([...rooms]);
                }
            }

            // Step 4: Generate listing description
            const descResponse = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rooms: analyzeData.data.rooms,
                    designSystem: analyzeData.data.designSystem,
                    layoutSummary: analyzeData.data.layoutSummary || 'Well-designed home layout',
                    style: selectedStyle,
                }),
            });

            const descData = await descResponse.json();
            if (descData.success && descData.description) {
                setDescription(descData.description);
            }

            setWorkflowStep('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setWorkflowStep('upload');
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleReset = () => {
        setImageFile(null);
        setImagePreview(null);
        setWorkflowStep('upload');
        setAnalysis(null);
        setOverview3d(null);
        setGeneratedRooms([]);
        setDescription(null);
        setError(null);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#0c0f19] via-[#141928] to-[#1a1f35]">
            {/* Header */}
            <header className="glass-dark sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="text-xl font-display font-bold gradient-text">RealEstateOS</span>
                    </Link>
                    <h1 className="text-lg font-semibold text-gray-300">Design a Whole Home</h1>
                </div>
            </header>

            {workflowStep === 'upload' ? (
                /* Upload View */
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-display font-bold mb-3">Upload Your Floor Plan</h2>
                        <p className="text-gray-400">Transform a 2D floor plan into a complete design package</p>
                    </div>

                    <div className="glass-card rounded-2xl p-8 space-y-8">
                        {/* Upload Zone */}
                        <div
                            className={`dropzone ${isDragging ? 'drag-over' : ''} ${imagePreview ? 'has-file' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onClick={() => document.getElementById('floor-plan-input')?.click()}
                        >
                            {imagePreview ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Floor plan preview" className="max-h-80 mx-auto rounded-lg" />
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
                                <div className="py-12">
                                    <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    <p className="text-gray-400 mb-2">Drag and drop your floor plan here</p>
                                    <p className="text-gray-500 text-sm">Supports images and PDFs</p>
                                </div>
                            )}
                            <input
                                id="floor-plan-input"
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                            />
                        </div>

                        {/* Style Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-3">Select Design Style</label>
                            <div className="grid grid-cols-4 gap-3">
                                {styles.map((style) => (
                                    <button
                                        key={style.value}
                                        onClick={() => setSelectedStyle(style.value)}
                                        className={`p-3 rounded-xl text-center transition-all ${selectedStyle === style.value
                                            ? 'bg-accent-500/20 border-2 border-accent-500'
                                            : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                                            }`}
                                    >
                                        <p className="font-semibold text-sm">{style.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!imageFile}
                            className={`w-full btn-primary py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 ${!imageFile ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Generate Complete Design
                        </button>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            ) : workflowStep === 'analyzing' || workflowStep === 'generating' ? (
                /* Loading View */
                <div className="max-w-2xl mx-auto px-6 py-24 text-center">
                    <div className="spinner w-16 h-16 mx-auto mb-8" />
                    <h2 className="text-2xl font-display font-bold mb-4">
                        {workflowStep === 'analyzing' ? 'Analyzing Floor Plan...' : 'Generating Designs...'}
                    </h2>
                    <p className="text-gray-400 mb-8">
                        {workflowStep === 'analyzing'
                            ? 'AI is detecting rooms and creating a design system'
                            : `Creating room ${currentRoomIndex + 1} of ${analysis?.rooms.length || 0}`
                        }
                    </p>

                    {analysis && (
                        <div className="glass-card rounded-2xl p-6 text-left">
                            <h3 className="font-semibold mb-3">Detected Rooms:</h3>
                            <div className="flex flex-wrap gap-2">
                                {analysis.rooms.map((room, i) => (
                                    <span
                                        key={i}
                                        className={`px-3 py-1 rounded-full text-sm ${i < generatedRooms.length
                                            ? 'bg-green-500/20 text-green-400'
                                            : i === currentRoomIndex
                                                ? 'bg-primary-500/20 text-primary-400'
                                                : 'bg-white/10 text-gray-400'
                                            }`}
                                    >
                                        {room.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Results Dashboard */
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column - Overview & Rooms */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* 3D Overview */}
                            {overview3d && (
                                <div className="glass-card rounded-2xl p-6">
                                    <h2 className="text-xl font-display font-bold mb-4">3D Home Overview</h2>
                                    <img src={overview3d} alt="3D Overview" className="w-full rounded-xl" />
                                </div>
                            )}

                            {/* Room Grid */}
                            <div className="glass-card rounded-2xl p-6">
                                <h2 className="text-xl font-display font-bold mb-4">Staged Rooms</h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {generatedRooms.map((room, i) => (
                                        <div key={i} className="rounded-xl overflow-hidden bg-white/5">
                                            <img src={room.imageUrl} alt={room.name} className="w-full aspect-video object-cover" />
                                            <div className="p-3">
                                                <p className="font-semibold">{room.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Listing Copy */}
                        <div className="space-y-6">
                            {description && (
                                <div className="glass-card rounded-2xl p-6 sticky top-24">
                                    <h2 className="text-xl font-display font-bold mb-4">Listing Copy</h2>

                                    {/* Headline */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm text-gray-400">Headline</label>
                                            <button
                                                onClick={() => copyToClipboard(description.headline, 'headline')}
                                                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                                            >
                                                {copiedField === 'headline' ? 'Copied!' : 'Copy'}
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-lg font-semibold">{description.headline}</p>
                                    </div>

                                    {/* Full Description */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm text-gray-400">Full Description</label>
                                            <button
                                                onClick={() => copyToClipboard(description.full, 'full')}
                                                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                                            >
                                                {copiedField === 'full' ? 'Copied!' : 'Copy'}
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-gray-300 text-sm whitespace-pre-line">{description.full}</p>
                                    </div>

                                    {/* Short Blurb */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm text-gray-400">Short Blurb (for ads)</label>
                                            <button
                                                onClick={() => copyToClipboard(description.short, 'short')}
                                                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                                            >
                                                {copiedField === 'short' ? 'Copied!' : 'Copy'}
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-gray-300 text-sm">{description.short}</p>
                                    </div>

                                    <button
                                        onClick={handleReset}
                                        className="w-full btn-secondary py-3 rounded-xl"
                                    >
                                        Design Another Home
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
