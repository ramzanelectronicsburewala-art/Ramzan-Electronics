import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Film,
  TrendingUp,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  BadgeCheck,
  Ban,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Report, UserProfile } from '../../types';
import { moderationService } from '../../services/moderationService';
import { userService } from '../../services/userService';
import { postService } from '../../services/postService';
import { formatRelativeTime, formatCompactNumber } from '../../utils/textUtils';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalPostsCount, setTotalPostsCount] = useState<number>(0);
  const [totalReelsCount, setTotalReelsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    const [fetchedReports, fetchedUsers, allPosts] = await Promise.all([
      moderationService.getReports(),
      userService.getAllUsers(),
      postService.getAllPosts(),
    ]);

    setReports(fetchedReports);
    setUsers(fetchedUsers);
    setTotalPostsCount(allPosts.length);
    setTotalReelsCount(allPosts.filter((p) => p.type === 'video').length);
    setLoading(false);
  };

  const handleDismissReport = async (reportId: string) => {
    await moderationService.updateReportStatus(reportId, 'dismissed');
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'dismissed' } : r))
    );
  };

  const handleTakedownContent = async (report: Report) => {
    await moderationService.takeDownContent(report);
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: 'resolved' } : r))
    );
  };

  const handleToggleVerified = (targetUserId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.userId === targetUserId ? { ...u, isVerified: !u.isVerified } : u))
    );
  };

  const handleToggleSuspension = (targetUserId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.userId === targetUserId ? { ...u, isSuspended: !u.isSuspended } : u))
    );
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Access Restricted</h2>
        <p className="text-xs text-zinc-500 mt-1">
          This dashboard requires administrator privileges. Please switch to the Admin demo account or log in with verified admin credentials.
        </p>
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              Pulse Trust & Safety Console
            </h1>
            <p className="text-xs text-zinc-500">
              Community moderation, report resolution, analytics, and creator governance
            </p>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Creators</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{users.length}</p>
          <span className="text-[10px] text-emerald-500 font-semibold">+18% this month</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Reels</span>
            <Film className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{totalReelsCount}</p>
          <span className="text-[10px] text-pink-500 font-semibold">9:16 Short format</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Feed Posts</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{totalPostsCount}</p>
          <span className="text-[10px] text-zinc-400">Photos & Videos</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Reports</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">{pendingReports.length}</p>
          <span className="text-[10px] text-zinc-400">Needs review</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Moderation Queue ({pendingReports.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          User Governance ({users.length})
        </button>
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              No reports in moderation queue. Everything is clean! ✨
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        report.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          : report.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {report.status}
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                      Target: {report.targetType}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {formatRelativeTime(report.createdAt)} ago
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-rose-500">
                    Reason: {report.reason}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {report.targetDetails}
                  </p>
                </div>

                {report.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDismissReport(report.id)}
                      className="px-3.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Dismiss (Keep)</span>
                    </button>

                    <button
                      onClick={() => handleTakedownContent(report)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Takedown</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: User Governance */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by handle or display name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredUsers.map((u) => (
              <div
                key={u.userId}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl}
                    alt={u.username}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <span>{u.displayName}</span>
                      {u.isVerified && (
                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">
                          ✓
                        </span>
                      )}
                      {u.isSuspended && (
                        <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 rounded font-bold">
                          Suspended
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      @{u.username} • {formatCompactNumber(u.followersCount)} followers • {u.postsCount} posts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVerified(u.userId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                      u.isVerified
                        ? 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'
                        : 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>{u.isVerified ? 'Verified' : 'Verify'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleSuspension(u.userId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                      u.isSuspended
                        ? 'bg-rose-500 text-white'
                        : 'border border-rose-300 dark:border-rose-900/50 text-rose-500 hover:bg-rose-500/10'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{u.isSuspended ? 'Suspended' : 'Suspend'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
