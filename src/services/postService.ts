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
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Post, Comment } from '../types';
import { SEED_POSTS, SEED_COMMENTS } from './seedData';

// Local storage key for offline or cached user contributions
const LOCAL_POSTS_KEY = 'pulse_local_posts';
const LOCAL_LIKES_KEY = 'pulse_local_likes';
const LOCAL_SAVES_KEY = 'pulse_local_saves';
const LOCAL_COMMENTS_KEY = 'pulse_local_comments';

function getLocalPosts(): Post[] {
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPosts(posts: Post[]) {
  localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
}

function getLocalLikes(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_LIKES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getLocalSaves(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_SAVES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getLocalComments(): Record<string, Comment[]> {
  try {
    const raw = localStorage.getItem(LOCAL_COMMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const postService = {
  async getAllPosts(): Promise<Post[]> {
    const localLikes = getLocalLikes();
    const localSaves = getLocalSaves();
    const customLocalPosts = getLocalPosts();

    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const firestorePosts: Post[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Post, 'id'>;
        firestorePosts.push({
          id: docSnap.id,
          ...data,
          isLiked: !!localLikes[docSnap.id],
          isSaved: !!localSaves[docSnap.id],
        });
      });

      if (firestorePosts.length > 0) {
        // Merge with seed posts to ensure vibrant experience
        const merged = [...firestorePosts];
        SEED_POSTS.forEach((seed) => {
          if (!merged.some((p) => p.id === seed.id)) {
            merged.push({
              ...seed,
              isLiked: !!localLikes[seed.id],
              isSaved: !!localSaves[seed.id],
            });
          }
        });
        return merged;
      }
    } catch (e) {
      console.warn('Firestore fetch falling back to seed & local cache:', e);
    }

    // Fallback: merge seed posts with user-created local posts
    const all = [...customLocalPosts, ...SEED_POSTS];
    const unique = Array.from(new Map(all.map((p) => [p.id, p])).values());
    return unique.map((p) => ({
      ...p,
      isLiked: !!localLikes[p.id],
      isSaved: !!localSaves[p.id],
    }));
  },

  async getReels(): Promise<Post[]> {
    const posts = await this.getAllPosts();
    return posts.filter((p) => p.type === 'video');
  },

  async getFeedPosts(): Promise<Post[]> {
    const posts = await this.getAllPosts();
    return posts.filter((p) => p.type === 'image' || p.aspectRatio !== '9:16');
  },

  async createPost(postData: Omit<Post, 'id' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'viewsCount' | 'createdAt'>): Promise<Post> {
    const id = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newPost: Post = {
      ...postData,
      id,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 1,
      createdAt: new Date().toISOString(),
      isLiked: false,
      isSaved: false,
    };

    // Save locally first for instant UI response
    const current = getLocalPosts();
    saveLocalPosts([newPost, ...current]);

    try {
      await setDoc(doc(db, 'posts', id), {
        authorId: newPost.authorId,
        authorUsername: newPost.authorUsername,
        authorDisplayName: newPost.authorDisplayName,
        authorAvatar: newPost.authorAvatar,
        type: newPost.type,
        mediaUrl: newPost.mediaUrl,
        thumbnailUrl: newPost.thumbnailUrl || newPost.mediaUrl,
        aspectRatio: newPost.aspectRatio || (newPost.type === 'video' ? '9:16' : '1:1'),
        caption: newPost.caption,
        tags: newPost.tags,
        location: newPost.location || '',
        audioTrack: newPost.audioTrack || '',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 1,
        createdAt: newPost.createdAt,
      });
    } catch (e) {
      console.warn('Post created in local state, Firestore sync deferred:', e);
    }

    return newPost;
  },

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const localLikes = getLocalLikes();
    const currentlyLiked = !!localLikes[postId];
    const newLikedState = !currentlyLiked;

    localLikes[postId] = newLikedState;
    localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(localLikes));

    // Try updating Firestore
    try {
      const likeDocRef = doc(db, 'posts', postId, 'likes', userId);
      const postDocRef = doc(db, 'posts', postId);

      if (newLikedState) {
        await setDoc(likeDocRef, { userId, createdAt: new Date().toISOString() });
        await updateDoc(postDocRef, { likesCount: increment(1) });
      } else {
        await deleteDoc(likeDocRef);
        await updateDoc(postDocRef, { likesCount: increment(-1) });
      }
    } catch (e) {
      console.warn('Like state synced locally:', e);
    }

    return { liked: newLikedState, count: newLikedState ? 1 : -1 };
  },

  async toggleSave(postId: string): Promise<boolean> {
    const localSaves = getLocalSaves();
    const currentlySaved = !!localSaves[postId];
    const newSaved = !currentlySaved;

    localSaves[postId] = newSaved;
    localStorage.setItem(LOCAL_SAVES_KEY, JSON.stringify(localSaves));
    return newSaved;
  },

  async incrementViews(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { viewsCount: increment(1) });
    } catch {
      // Non-critical metric
    }
  },

  async getComments(postId: string): Promise<Comment[]> {
    const localComments = getLocalComments();
    const cached = localComments[postId] || [];
    const seed = SEED_COMMENTS[postId] || [];

    try {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const snap = await getDocs(query(commentsRef, orderBy('createdAt', 'desc')));
      const fromDb: Comment[] = [];
      snap.forEach((d) => {
        fromDb.push({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) });
      });

      if (fromDb.length > 0) {
        return [...fromDb, ...cached.filter((c) => !fromDb.some((f) => f.id === c.id))];
      }
    } catch (e) {
      console.warn('Comments fetched from seed/local state:', e);
    }

    return [...cached, ...seed];
  },

  async addComment(postId: string, commentData: Omit<Comment, 'id' | 'likesCount' | 'createdAt'>): Promise<Comment> {
    const id = `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newComment: Comment = {
      ...commentData,
      id,
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Save locally
    const local = getLocalComments();
    if (!local[postId]) local[postId] = [];
    local[postId].unshift(newComment);
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(local));

    try {
      await setDoc(doc(db, 'posts', postId, 'comments', id), {
        postId,
        authorId: newComment.authorId,
        authorUsername: newComment.authorUsername,
        authorAvatar: newComment.authorAvatar,
        text: newComment.text,
        likesCount: 0,
        createdAt: newComment.createdAt,
      });

      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1),
      });
    } catch (e) {
      console.warn('Comment saved locally:', e);
    }

    return newComment;
  },

  async deletePost(postId: string): Promise<void> {
    const current = getLocalPosts();
    saveLocalPosts(current.filter((p) => p.id !== postId));

    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (e) {
      console.warn('Post deleted from local state:', e);
    }
  },
};
