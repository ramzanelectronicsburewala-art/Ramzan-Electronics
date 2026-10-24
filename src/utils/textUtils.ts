export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(tag => tag.slice(1).toLowerCase())));
}

export function extractMentions(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/@[a-zA-Z0-9_.]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(mention => mention.slice(1).toLowerCase())));
}

export function formatCompactNumber(num: number): string {
  if (num == null || isNaN(num)) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) {
    const k = (num / 1000).toFixed(1);
    return k.endsWith('.0') ? `${Math.floor(num / 1000)}K` : `${k}K`;
  }
  const m = (num / 1000000).toFixed(1);
  return m.endsWith('.0') ? `${Math.floor(num / 1000000)}M` : `${m}M`;
}

export function formatRelativeTime(isoString: string, currentTimestamp = Date.now()): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diffInSeconds = Math.max(0, Math.floor((currentTimestamp - date.getTime()) / 1000));

  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s`;
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 52) return `${weeks}w`;
  return `${Math.floor(weeks / 52)}y`;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}
