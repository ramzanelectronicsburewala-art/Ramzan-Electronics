import React, { useState } from 'react';
import {
  User,
  Shield,
  Moon,
  Sun,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Unlock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getLocalBlockedUsers, userService } from '../../services/userService';

export const SettingsView: React.FC = () => {
  const { userProfile, updateCurrentProfile, resetPassword } = useAuth();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [username, setUsername] = useState(userProfile?.username || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [website, setWebsite] = useState(userProfile?.website || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || '');

  // Privacy states
  const [isPrivate, setIsPrivate] = useState(userProfile?.isPrivate || false);
  const [allowDMs, setAllowDMs] = useState<'everyone' | 'following'>('everyone');

  const [blockedUsers, setBlockedUsers] = useState<string[]>(getLocalBlockedUsers());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      await updateCurrentProfile({
        displayName: displayName.trim(),
        username: username.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
        bio: bio.trim(),
        website: website.trim(),
        avatarUrl: avatarUrl.trim() || userProfile?.avatarUrl,
        isPrivate,
      });

      setStatusMessage('Profile updated successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!userProfile?.email) {
      setStatusMessage('No email attached to this demo account. Sign in with a real account to reset password.');
      return;
    }
    try {
      await resetPassword(userProfile.email);
      setStatusMessage(`Password reset link sent to ${userProfile.email}`);
    } catch {
      setStatusMessage('Failed to trigger reset email.');
    }
  };

  const handleUnblock = (userId: string) => {
    userService.toggleBlockUser(userId);
    setBlockedUsers(getLocalBlockedUsers());
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Account Settings & Privacy
        </h2>
        <p className="text-xs text-zinc-500 mb-6">
          Manage your public presence, preferences, safety controls and appearance
        </p>

        {statusMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Avatar edit */}
          <div className="flex items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <img
              src={avatarUrl || userProfile?.avatarUrl}
              alt="Avatar preview"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-pink-500"
            />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Avatar Image URL
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Username (@handle)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              maxLength={200}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself..."
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Website / Portfolio URL
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourportfolio.com"
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Appearance Section */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Theme & Appearance
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Mode (Default)</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Privacy & Safety Section */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Privacy & Controls
            </h3>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Private Account</p>
                <p className="text-[11px] text-zinc-500">Only approved followers can view your posts</p>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded text-pink-500 focus:ring-pink-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Password Recovery</p>
                <p className="text-[11px] text-zinc-500">Send password reset email to your registered address</p>
              </div>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Blocked Users */}
          {blockedUsers.length > 0 && (
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Blocked Users ({blockedUsers.length})
              </h3>
              <div className="space-y-1.5">
                {blockedUsers.map((uid) => (
                  <div
                    key={uid}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">User ID: {uid}</span>
                    <button
                      type="button"
                      onClick={() => handleUnblock(uid)}
                      className="text-pink-500 font-semibold hover:underline"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-pink-500/25 hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
