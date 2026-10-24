import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHashtags, extractMentions, formatCompactNumber, formatRelativeTime, truncateText } from './textUtils';
import { validateUploadFile, formatFileSize, getMediaType } from './mediaUtils';
import { isStoryExpired, filterActiveStories, calculateFollowStats, sanitizeUsername, calculateEngagementScore } from './socialLogic';

test('extractHashtags extracts unique lowercase hashtags', () => {
  const text = 'Check out this awesome #sunset and #Vibes! Also #sunset again';
  const tags = extractHashtags(text);
  assert.deepEqual(tags, ['sunset', 'vibes']);
});

test('extractMentions extracts unique user handles', () => {
  const text = 'Hello @alex and @sarah_dev, cc: @alex';
  const mentions = extractMentions(text);
  assert.deepEqual(mentions, ['alex', 'sarah_dev']);
});

test('formatCompactNumber handles K and M rounding', () => {
  assert.equal(formatCompactNumber(450), '450');
  assert.equal(formatCompactNumber(1200), '1.2K');
  assert.equal(formatCompactNumber(10000), '10K');
  assert.equal(formatCompactNumber(2500000), '2.5M');
  assert.equal(formatCompactNumber(0), '0');
});

test('formatRelativeTime computes humanized intervals', () => {
  const now = 1700000000000;
  const fiveSecsAgo = new Date(now - 5000).toISOString();
  const tenMinsAgo = new Date(now - 10 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(now - 3 * 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(now - 2 * 86400 * 1000).toISOString();

  assert.equal(formatRelativeTime(fiveSecsAgo, now), '5s');
  assert.equal(formatRelativeTime(tenMinsAgo, now), '10m');
  assert.equal(formatRelativeTime(threeHoursAgo, now), '3h');
  assert.equal(formatRelativeTime(twoDaysAgo, now), '2d');
});

test('truncateText truncates cleanly with ellipsis', () => {
  assert.equal(truncateText('Short string', 20), 'Short string');
  assert.equal(truncateText('This is a longer caption for social media', 15), 'This is a longe...');
});

test('validateUploadFile catches oversized and invalid types', () => {
  const validImage = { name: 'photo.jpg', size: 1024 * 1024, type: 'image/jpeg' };
  assert.equal(validateUploadFile(validImage).valid, true);

  const oversizedImage = { name: 'photo.jpg', size: 15 * 1024 * 1024, type: 'image/jpeg' };
  assert.equal(validateUploadFile(oversizedImage).valid, false);

  const invalidExt = { name: 'script.exe', size: 500, type: 'application/octet-stream' };
  assert.equal(validateUploadFile(invalidExt).valid, false);
});

test('formatFileSize formats human readable bytes', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(1024), '1 KB');
  assert.equal(formatFileSize(5 * 1024 * 1024), '5 MB');
});

test('getMediaType detects image and video properly', () => {
  assert.equal(getMediaType('https://example.com/video.mp4'), 'video');
  assert.equal(getMediaType('video/mp4'), 'video');
  assert.equal(getMediaType('https://example.com/photo.webp'), 'image');
});

test('isStoryExpired verifies expiration timestamps', () => {
  const now = 1700000000000;
  const past = new Date(now - 1000).toISOString();
  const future = new Date(now + 3600000).toISOString();

  assert.equal(isStoryExpired(past, now), true);
  assert.equal(isStoryExpired(future, now), false);
});

test('filterActiveStories removes expired stories', () => {
  const now = 1700000000000;
  const stories = [
    { id: 1, expiresAt: new Date(now - 1000).toISOString() },
    { id: 2, expiresAt: new Date(now + 10000).toISOString() }
  ];
  const active = filterActiveStories(stories, now);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, 2);
});

test('calculateFollowStats toggles follow count safely', () => {
  assert.equal(calculateFollowStats(false, 10), 11);
  assert.equal(calculateFollowStats(true, 10), 9);
  assert.equal(calculateFollowStats(true, 0), 0);
});

test('sanitizeUsername sanitizes input', () => {
  assert.equal(sanitizeUsername('John_Doe.99!#$'), 'john_doe.99');
});

test('calculateEngagementScore calculates weighted score', () => {
  assert.equal(calculateEngagementScore(10, 5, 200), (10 * 2) + (5 * 3) + 20);
});
