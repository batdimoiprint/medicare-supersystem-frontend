import * as React from 'react';

export interface ChromaGridItem {
    image: string;
    title?: string | null;
    subtitle?: string | null;
    handle?: string | null;
    url?: string | null;
    borderColor?: string;
    gradient?: string;
    location?: string | null;
}

export interface ChromaGridProps {
    items?: ChromaGridItem[];
    className?: string;
    radius?: number;
    columns?: number;
    rows?: number;
    damping?: number;
    fadeOut?: number;
    ease?: string;
}

declare const ChromaGrid: React.FC<ChromaGridProps>;
export default ChromaGrid;
