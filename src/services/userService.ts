import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';
import { SEED_USERS } from './seedData';

const LOCAL_FOLLOWS_KEY = 'pulse_local_follows';
const LOCAL_BLOCKED_KEY = 'pulse_local_blocked';

function getLocalFollows(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_FOLLOWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getLocalBlockedUsers(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_BLOCKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const userService = {
  async getUser(userId: string): Promise<UserProfile | null> {
    const seed = SEED_USERS.find((u) => u.userId === userId);
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch {
      // Return seed if available
    }
    return seed || null;
  },

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      if (list.length > 0) {
        // Merge with seed users
        const merged = [...list];
        SEED_USERS.forEach((s) => {
          if (!merged.some((u) => u.userId === s.userId)) {
            merged.push(s);
          }
        });
        return merged;
      }
    } catch {
      // Return seed users
    }
    return SEED_USERS;
  },

  async searchUsers(queryStr: string): Promise<UserProfile[]> {
    if (!queryStr.trim()) return [];
    const normalized = queryStr.toLowerCase().trim().replace(/^@/, '');
    const all = await this.getAllUsers();
    return all.filter(
      (u) =>
        u.username.toLowerCase().includes(normalized) ||
        u.displayName.toLowerCase().includes(normalized) ||
        (u.bio && u.bio.toLowerCase().includes(normalized))
    );
  },

  async isFollowing(followerId: string, targetUserId: string): Promise<boolean> {
    const local = getLocalFollows();
    const key = `${followerId}_${targetUserId}`;
    if (local[key] !== undefined) return local[key];

    try {
      const followDoc = await getDoc(doc(db, 'follows', key));
      return followDoc.exists();
    } catch {
      return false;
    }
  },

  async toggleFollow(followerId: string, targetUserId: string): Promise<boolean> {
    const local = getLocalFollows();
    const key = `${followerId}_${targetUserId}`;
    const willFollow = !local[key];
    local[key] = willFollow;
    localStorage.setItem(LOCAL_FOLLOWS_KEY, JSON.stringify(local));

    try {
      const followRef = doc(db, 'follows', key);
      const followerRef = doc(db, 'users', followerId);
      const targetRef = doc(db, 'users', targetUserId);

      if (willFollow) {
        await setDoc(followRef, { followerId, followingId: targetUserId, createdAt: new Date().toISOString() });
        await updateDoc(targetRef, { followersCount: increment(1) });
        await updateDoc(followerRef, { followingCount: increment(1) });
      } else {
        await deleteDoc(followRef);
        await updateDoc(targetRef, { followersCount: increment(-1) });
        await updateDoc(followerRef, { followingCount: increment(-1) });
      }
    } catch (e) {
      console.warn('Follow state stored locally:', e);
    }

    return willFollow;
  },

  toggleBlockUser(targetUserId: string): boolean {
    const blocked = getLocalBlockedUsers();
    const index = blocked.indexOf(targetUserId);
    let isBlocked = false;
    if (index >= 0) {
      blocked.splice(index, 1);
      isBlocked = false;
    } else {
      blocked.push(targetUserId);
      isBlocked = true;
    }
    localStorage.setItem(LOCAL_BLOCKED_KEY, JSON.stringify(blocked));
    return isBlocked;
  },
};
