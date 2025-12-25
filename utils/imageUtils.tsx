// Minimal image helpers used across the app. These replace the external
// `@repo/utils/imageUtils` re-export during migration to Supabase.
import React, { useEffect, useState } from 'react';

export type ResolvedImage = string;

export interface ResolvedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	src?: string | null;
	fallback?: string;
}

export const ResolvedImage: React.FC<ResolvedImageProps> = ({ src, fallback, alt, className, onError, ...rest }) => {
	const resolved = useResolvedImage(src || undefined, fallback);
	return (
		<img
			src={resolved || fallback || getFallbackImage()}
			alt={alt}
			className={className}
			onError={(e) => {
				try { handleImageError(e); } catch (_) {}
				if (onError) onError(e as any);
			}}
			{...rest}
		/>
	);
};

export function handleImageError(e: any) {
	// Replace broken images with a placeholder
	const target = e?.target as HTMLImageElement | null;
	if (target) target.src = getFallbackImage();
}

export function getFallbackImage(width = 600, height = 600, text?: string) {
	// Use an embedded SVG data URI as a fallback to avoid external DNS failures
	const label = text ? text : 'Image';
	const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='%23222' /><text x='50%' y='50%' font-family='Arial, Helvetica, sans-serif' font-size='20' fill='%23ccc' dominant-baseline='middle' text-anchor='middle'>${escapeXml(label)}</text></svg>`;
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function useResolvedImage(src?: string, fallback?: string) {
	const [resolved, setResolved] = useState<string | null>(null);
	useEffect(() => {
		if (!src) { setResolved(fallback || getFallbackImage()); return; }
		setResolved(src);
	}, [src, fallback]);
	return resolved;
}
