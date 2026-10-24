import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Conversation, Message, UserProfile } from '../types';
import { SEED_CONVERSATIONS } from './seedData';

const LOCAL_MESSAGES_KEY = 'pulse_local_messages';

function getLocalMessages(): Record<string, Message[]> {
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const chatService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const snap = await getDocs(collection(db, 'conversations'));
      const list: Conversation[] = [];
      snap.forEach((d) => {
        const data = d.data() as Conversation;
        if (data.participantIds && data.participantIds.includes(userId)) {
          list.push({ ...data, id: d.id });
        }
      });
      if (list.length > 0) return list;
    } catch {
      // Fallback
    }

    return SEED_CONVERSATIONS;
  },

  async getOrCreateConversation(currentUser: UserProfile, targetUser: UserProfile): Promise<Conversation> {
    const sortedIds = [currentUser.userId, targetUser.userId].sort();
    const convId = `conv_${sortedIds[0]}_${sortedIds[1]}`;

    const convRef = doc(db, 'conversations', convId);
    try {
      const snap = await getDoc(convRef);
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as Omit<Conversation, 'id'>) };
      }
    } catch {
      // Offline fallback
    }

    const newConv: Conversation = {
      id: convId,
      participantIds: [currentUser.userId, targetUser.userId],
      participantDetails: {
        [currentUser.userId]: {
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
        },
        [targetUser.userId]: {
          username: targetUser.username,
          displayName: targetUser.displayName,
          avatarUrl: targetUser.avatarUrl,
        },
      },
      lastMessage: 'Conversation started',
      lastSenderId: currentUser.userId,
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
    };

    try {
      await setDoc(convRef, newConv);
    } catch {
      // Offline
    }

    return newConv;
  },

  subscribeMessages(conversationId: string, onUpdate: (messages: Message[]) => void): () => void {
    const localStore = getLocalMessages();
    const initial = localStore[conversationId] || [
      {
        id: `m-init-1`,
        conversationId,
        senderId: 'user-aura-maya',
        text: 'Hey! Loved your recent post!',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        readBy: [],
      },
      {
        id: `m-init-2`,
        conversationId,
        senderId: 'current-user',
        text: 'Thanks Maya! Excited to share more content here.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        readBy: [],
      },
    ];

    onUpdate(initial);

    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const list: Message[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Message, 'id'>) }));
          if (list.length > 0) {
            onUpdate(list);
          }
        },
        (err) => {
          console.warn('Realtime message subscription using local cache:', err);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  },

  async sendMessage(conversationId: string, senderId: string, text: string, mediaUrl?: string): Promise<Message> {
    const msgId = `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: Message = {
      id: msgId,
      conversationId,
      senderId,
      text,
      mediaUrl,
      createdAt: new Date().toISOString(),
      readBy: [senderId],
    };

    // Save locally
    const local = getLocalMessages();
    if (!local[conversationId]) local[conversationId] = [];
    local[conversationId].push(newMsg);
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(local));

    try {
      await setDoc(doc(db, 'conversations', conversationId, 'messages', msgId), newMsg);
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: text || (mediaUrl ? 'Sent media' : ''),
        lastSenderId: senderId,
        updatedAt: newMsg.createdAt,
      });
    } catch (e) {
      console.warn('Message saved in local state:', e);
    }

    return newMsg;
  },
};
