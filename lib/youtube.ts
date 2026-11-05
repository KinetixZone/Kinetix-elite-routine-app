/**
 * Utility for robust YouTube URL parsing and embed link formatting.
 * Supports standard watch URLs, short links (youtu.be), Shorts, and direct embeds.
 */

export function getYoutubeVideoId(url: string | undefined | null): string | null {
  if (!url) return null;
  const clean = url.trim();

  // Pattern matching watch?v=, youtu.be/, /embed/, /v/, /shorts/
  const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback: If 11 chars directly passed as ID
  if (/^[\w-]{11}$/.test(clean)) {
    return clean;
  }

  return null;
}

export function getYoutubeEmbedUrl(url: string | undefined | null, autoPlay: boolean = false): string | undefined {
  if (!url) return undefined;
  
  const videoId = getYoutubeVideoId(url);
  if (videoId) {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1'
    });
    if (autoPlay) {
      params.set('autoplay', '1');
    }
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  // If already an embed or non-youtube direct video URL
  if (url.includes('/embed/') || url.endsWith('.mp4') || url.endsWith('.webm')) {
    return url;
  }

  return url;
}

export function getYoutubeThumbnail(url: string | undefined | null): string | null {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function isYouTubeUrl(url: string | undefined | null): boolean {
  return !!getYoutubeVideoId(url);
}
