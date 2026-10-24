export function isStoryExpired(expiresAtIso: string, nowMs = Date.now()): boolean {
  if (!expiresAtIso) return true;
  const expiry = new Date(expiresAtIso).getTime();
  return isNaN(expiry) || expiry <= nowMs;
}

export function filterActiveStories<T extends { expiresAt: string }>(stories: T[], nowMs = Date.now()): T[] {
  return stories.filter(story => !isStoryExpired(story.expiresAt, nowMs));
}

export function calculateFollowStats(isCurrentlyFollowing: boolean, prevCount: number): number {
  if (isCurrentlyFollowing) {
    return Math.max(0, prevCount - 1);
  }
  return prevCount + 1;
}

export function sanitizeUsername(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 30);
}

export function calculateEngagementScore(likes: number, comments: number, views: number): number {
  return (likes * 2) + (comments * 3) + Math.floor(views * 0.1);
}
