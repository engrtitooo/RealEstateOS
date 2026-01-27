/**
 * RealEstateOS Core Types
 * TypeScript interfaces for the AI-powered real estate staging platform
 */

// ============================================
// Design System Types
// ============================================

export interface DesignSystem {
    flooring: string;
    wallColorPalette: string[];
    lightingTemperature: string;
    lightingStyle: string;
    furnitureAesthetic: string;
    materialMood: string[];
    overallStyle: StyleType;
}

export type StyleType =
    | 'modern'
    | 'classic'
    | 'luxury'
    | 'minimalist'
    | 'scandinavian'
    | 'industrial'
    | 'bohemian'
    | 'coastal'
    | 'traditional'
    | 'contemporary';

// ============================================
// Room Types
// ============================================

export interface Room {
    name: string;
    function: RoomFunction;
    approxSize: 'small' | 'medium' | 'large';
}

export type RoomFunction =
    | 'sleeping'
    | 'cooking'
    | 'living'
    | 'dining'
    | 'bathing'
    | 'working'
    | 'storage'
    | 'utility'
    | 'entertainment'
    | 'outdoor';

export interface GeneratedRoom {
    name: string;
    imageUrl: string;
    prompt?: string;
}

// ============================================
// Listing Description Types
// ============================================

export interface ListingDescription {
    headline: string;
    full: string;
    short: string;
}

// ============================================
// Analysis Types
// ============================================

export interface FloorPlanAnalysis {
    overviewPrompt: string;
    rooms: Room[];
    designSystem: DesignSystem;
    layoutSummary?: string;
}

// ============================================
// Project Session Types
// ============================================

export interface SingleRoomResult {
    type: 'single_room';
    originalImageUrl: string;
    stagedImageUrl: string;
    caption?: string;
    style: StyleType;
}

export interface FullPlanResult {
    type: 'full_plan';
    floorPlanUrl: string;
    overview3d: string;
    rooms: GeneratedRoom[];
    description: ListingDescription;
    designSystem: DesignSystem;
}

export interface ProjectSession {
    id: string;
    type: 'single_room' | 'full_plan';
    style: StyleType;
    createdAt: Date;
    updatedAt: Date;
    status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'error';
    result: SingleRoomResult | FullPlanResult | null;
    error?: string;
}

// ============================================
// API Request/Response Types
// ============================================

// POST /api/analyze-plan
export interface AnalyzePlanRequest {
    floorPlanBase64: string;
    style: StyleType;
    mimeType: string;
}

export interface AnalyzePlanResponse {
    success: boolean;
    data?: FloorPlanAnalysis;
    error?: string;
}

// POST /api/generate-room
export interface GenerateRoomRequest {
    roomName: string;
    designSystem: DesignSystem;
    approxSize: 'small' | 'medium' | 'large';
    function: RoomFunction;
    floorPlanBase64?: string; // Optional for backward compatibility, but required for plan-driven flow
}

export interface GenerateRoomResponse {
    success: boolean;
    imageUrl?: string;
    prompt?: string;
    error?: string;
}

// POST /api/stage-photo
export interface StagePhotoRequest {
    photoBase64: string;
    style: StyleType;
    mimeType: string;
    generateCaption?: boolean;
}

export interface StagePhotoResponse {
    success: boolean;
    imageUrl?: string;
    caption?: string;
    error?: string;
}

// POST /api/generate-description
export interface GenerateDescriptionRequest {
    rooms: Room[];
    designSystem: DesignSystem;
    layoutSummary: string;
    style: StyleType;
}

export interface GenerateDescriptionResponse {
    success: boolean;
    description?: ListingDescription;
    error?: string;
}

// POST /api/generate-overview
export interface GenerateOverviewRequest {
    overviewPrompt: string;
    designSystem: DesignSystem;
    floorPlanBase64?: string; // Optional for backward compatibility, but required for plan-driven flow
}

export interface GenerateOverviewResponse {
    success: boolean;
    imageUrl?: string;
    error?: string;
}
