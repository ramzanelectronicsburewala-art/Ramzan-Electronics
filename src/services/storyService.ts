import { collection, doc, getDocs, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import { Story } from '../types';
import { SEED_STORIES } from './seedData';
import { filterActiveStories } from '../utils/socialLogic';

const LOCAL_STORIES_KEY = 'pulse_local_stories';
const VIEWED_STORIES_KEY = 'pulse_viewed_stories';

function getLocalStories(): Story[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalStories(stories: Story[]) {
  localStorage.setItem(LOCAL_STORIES_KEY, JSON.stringify(stories));
}

export function getViewedStoryIds(): string[] {
  try {
    const raw = localStorage.getItem(VIEWED_STORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const storyService = {
  async getStories(): Promise<Story[]> {
    const local = getLocalStories();
    try {
      const snap = await getDocs(collection(db, 'stories'));
      const dbStories: Story[] = [];
      snap.forEach((d) => {
        dbStories.push({ id: d.id, ...(d.data() as Omit<Story, 'id'>) });
      });

      if (dbStories.length > 0) {
        const merged = [...dbStories, ...local, ...SEED_STORIES];
        const unique = Array.from(new Map(merged.map((s) => [s.id, s])).values());
        return filterActiveStories(unique);
      }
    } catch {
      // Fallback to local & seed
    }

    const merged = [...local, ...SEED_STORIES];
    const unique = Array.from(new Map(merged.map((s) => [s.id, s])).values());
    return filterActiveStories(unique);
  },

  async createStory(storyData: Omit<Story, 'id' | 'viewers' | 'expiresAt' | 'createdAt'>): Promise<Story> {
    const id = `story-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();

    const newStory: Story = {
      ...storyData,
      id,
      viewers: [],
      createdAt: now.toISOString(),
      expiresAt,
    };

    const current = getLocalStories();
    saveLocalStories([newStory, ...current]);

    try {
      await setDoc(doc(db, 'stories', id), {
        authorId: newStory.authorId,
        authorUsername: newStory.authorUsername,
        authorDisplayName: newStory.authorDisplayName,
        authorAvatar: newStory.authorAvatar,
        mediaUrl: newStory.mediaUrl || '',
        text: newStory.text || '',
        backgroundGradient: newStory.backgroundGradient || 'from-indigo-600 to-purple-800',
        viewers: [],
        createdAt: newStory.createdAt,
        expiresAt: newStory.expiresAt,
      });
    } catch (e) {
      console.warn('Story saved locally:', e);
    }

    return newStory;
  },

  async markAsViewed(storyId: string, userId: string): Promise<void> {
    const viewed = getViewedStoryIds();
    if (!viewed.includes(storyId)) {
      viewed.push(storyId);
      localStorage.setItem(VIEWED_STORIES_KEY, JSON.stringify(viewed));
    }

    try {
      await updateDoc(doc(db, 'stories', storyId), {
        viewers: arrayUnion(userId),
      });
    } catch {
      // Offline fallback
    }
  },
};
