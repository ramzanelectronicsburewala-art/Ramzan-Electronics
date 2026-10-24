import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Notification } from '../types';
import { SEED_NOTIFICATIONS } from './seedData';

const LOCAL_NOTIFS_KEY = 'pulse_local_notifications';

function getLocalNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const notificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    const local = getLocalNotifications();
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      const list: Notification[] = [];
      snap.forEach((d) => {
        const data = d.data() as Notification;
        if (data.recipientId === userId) {
          list.push({ ...data, id: d.id });
        }
      });
      if (list.length > 0) return list;
    } catch {
      // Fallback
    }

    const merged = [...local, ...SEED_NOTIFICATIONS];
    return Array.from(new Map(merged.map((n) => [n.id, n])).values());
  },

  async markAllAsRead(userId: string): Promise<void> {
    const local = getLocalNotifications();
    const updated = local.map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(updated));
  },

  async createNotification(notifData: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Promise<Notification> {
    const id = `notif-${Date.now()}`;
    const newNotif: Notification = {
      ...notifData,
      id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const local = getLocalNotifications();
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify([newNotif, ...local]));

    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
    } catch {
      // Offline fallback
    }

    return newNotif;
  },
};
