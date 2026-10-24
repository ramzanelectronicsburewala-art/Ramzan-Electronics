import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Report, UserProfile } from '../types';
import { SEED_REPORTS } from './seedData';
import { postService } from './postService';

const LOCAL_REPORTS_KEY = 'pulse_local_reports';

function getLocalReports(): Report[] {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const moderationService = {
  async getReports(): Promise<Report[]> {
    const local = getLocalReports();
    try {
      const snap = await getDocs(collection(db, 'reports'));
      const list: Report[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Report, 'id'>) }));
      if (list.length > 0) return list;
    } catch {
      // Fallback
    }

    const merged = [...local, ...SEED_REPORTS];
    return Array.from(new Map(merged.map((r) => [r.id, r])).values());
  },

  async submitReport(data: Omit<Report, 'id' | 'status' | 'createdAt'>): Promise<Report> {
    const id = `rep-${Date.now()}`;
    const report: Report = {
      ...data,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const local = getLocalReports();
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify([report, ...local]));

    try {
      await setDoc(doc(db, 'reports', id), report);
    } catch {
      // Offline fallback
    }

    return report;
  },

  async updateReportStatus(reportId: string, status: 'resolved' | 'dismissed'): Promise<void> {
    const local = getLocalReports();
    const target = local.find((r) => r.id === reportId);
    if (target) {
      target.status = status;
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(local));
    }

    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
    } catch {
      // Offline fallback
    }
  },

  async takeDownContent(report: Report): Promise<void> {
    if (report.targetType === 'post') {
      await postService.deletePost(report.targetId);
    }
    await this.updateReportStatus(report.id, 'resolved');
  },
};
