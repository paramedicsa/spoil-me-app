import { FirebaseStorage } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { getDownloadURL, ref as sRef } from 'firebase/storage';
import React, { useEffect, useState } from 'react';

export const isHttpUrl = (s?: string) => !!s && /^https?:\/\//i.test(s);
export const isDataUrl = (s?: string) => !!s && s.startsWith('data:');
export const isBlobUrl = (s?: string) => !!s && s.startsWith('blob:');
export const isGsUrl = (s?: string) => !!s && s.startsWith('gs://');

export async function resolveImageSrc(raw: any): Promise<string | null> {
  if (!raw) return null;
  if (typeof raw === 'string') {
    if (isHttpUrl(raw) || isDataUrl(raw) || isBlobUrl(raw) || raw.startsWith('/')) return raw;

    if (isGsUrl(raw)) {
      const m = raw.match(/^gs:\/\/[^/]+\/(.+)$/);
      const path = m ? m[1] : raw;
      try {
        if (!storage) return null;
        const url = await getDownloadURL(sRef(storage, decodeURIComponent(path).replace(/^\//, '')));
        return url;
      } catch (err) {
        console.warn('Failed to resolve gs:// URL', raw, err);
        return null;
      }
    }

    try {
      if (!storage) return raw; // if no storage available, return raw string so UI may attempt to load
      const url = await getDownloadURL(sRef(storage, raw.replace(/^\//, '')));
      return url;
    } catch (err) {
      // Not resolvable
    }

    return raw;
  }

  if (typeof raw === 'object') {
    const path = raw.fullPath || raw.path || raw.name || null;
    if (path && storage) {
      try {
        const url = await getDownloadURL(sRef(storage, path.replace(/^\//, '')));
        return url;
      } catch (err) {
        console.warn('Failed to resolve storage object image path', raw, err);
        return null;
      }
    }
  }

  return null;
}

export function useResolvedImage(src?: any, fallback?: string) {
  const [resolved, setResolved] = useState<string | undefined>(fallback || undefined);

  useEffect(() => {
    let mounted = true;
    if (!src) {
      setResolved(fallback);
      return;
    }

    // If src is already a direct HTTP URL, use it immediately
    if (isHttpUrl(src) || isDataUrl(src) || isBlobUrl(src) || src.startsWith('/')) {
      setResolved(src);
      return;
    }

    // Only do async resolution for Firebase paths
    (async () => {
      try {
        const url = await resolveImageSrc(src);
        if (mounted) setResolved(url || fallback);
      } catch (e) {
        console.error('Error resolving image src', e);
        if (mounted) setResolved(fallback);
      }
    })();

    return () => { mounted = false; };
  }, [src, fallback]);

  return resolved;
}

export const ResolvedImage: React.FC<{ src?: any; alt?: string; className?: string; fallback?: string; onError?: (e: any) => void }> = ({ src, alt = '', className, fallback, onError }) => {
  const resolved = useResolvedImage(src, fallback || getFallbackImage(600));
  return (
    <img src={resolved} alt={alt} className={className} onError={(e) => {
      console.warn('❌ Image onError triggered for:', resolved);
      onError?.(e);
    }} />
  );
};

export const getFallbackImage = (width: number = 600, height?: number, text: string = 'No Image') => {
  const size = height ? `${width}x${height}` : width.toString();
  return `https://placehold.co/${size}/1a1a1a/D4AF37?text=${encodeURIComponent(text)}`;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;

  // 1. Check if we are already using the fallback to prevent infinite loops
  if (target.src.includes('placehold.co')) {
    console.warn("Fallback image also failed. Hiding element.");
    target.style.display = 'none'; // Give up
    return;
  }

  // 2. Log the error for debugging
  console.warn(`Image failed to load: ${target.src}. Switching to fallback.`);

  // 3. Switch to the working fallback service
  target.src = getFallbackImage(600, 600, 'Spoil Me Vintage');
};
