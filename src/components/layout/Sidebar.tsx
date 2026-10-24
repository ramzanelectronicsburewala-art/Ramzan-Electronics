import React from 'react';
import {
  Home,
  Film,
  Compass,
  MessageCircle,
  Bell,
  PlusSquare,
  User,
  ShieldAlert,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export type NavTab =
  | 'feed'
  | 'reels'
  | 'explore'
  | 'messages'
  | 'notifications'
  | 'profile'
  | 'admin'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreate: () => void;
  onOpenGuide: () => void;
  unreadMessagesCount: number;
  unreadNotifsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  onOpenGuide,
  unreadMessagesCount,
  unreadNotifsCount,
}) => {
  const { userProfile, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 select-none z-30 transition-colors">
      {/* Top Logo & Navigation */}
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div
          onClick={() => onSelectTab('feed')}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer group"
          role="button"
          aria-label="Pulse Home"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-500 bg-clip-text text-transparent">
              Pulse
            </span>
            <span className="text-[10px] uppercase tracking-widest block font-semibold text-zinc-400">
              Social Reels
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
          <button
            onClick={() => onSelectTab('feed')}
            className={`flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
              currentTab === 'feed'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-pink-600 dark:text-pink-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => onSelectTab('reels')}
            className={`flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-sm transition-all relative ${
              currentTab === 'reels'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-pink-600 dark:text-pink-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Film className="w-5 h-5 shrink-0" />
            <span>Shorts & Reels</span>
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-500 uppercase tracking-wider">
              Hot
            </span>
          </button>

          <button
            onClick={() => onSelectTab('explore')}
            className={`flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
              currentTab === 'explore'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-pink-600 dark:text-pink-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Compass className="w-5 h-5 shrink-0" />
            <span>Explore</span>
          </button>

          <button
            onClick={() => onSelectTab('messages')}
            className={`flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-sm transition-all relative ${
              currentTab === 'messages'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-pink-600 dark:text-pink-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span>Messages</span>
            {unreadMessagesCount > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('notifications')}
            className={`flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-sm transition-all relative ${
              currentTab === 'notifications'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-pink-600 dark:text-pink-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Bell className="w-5 h-5 shrink-0" />
            <span>Notifications</span>
            {unreadNotifsCount > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-4 px-3.5 py-3 mt-1 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 shadow-md shadow-pink-500/20 hover:opacity-95 transition-all"
          >
            <PlusSquare className="w-5 h-5 shrink-0" />
            <span className="font-semibold">Create Post</span>
          </button>

          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
              currentTab === 'profile'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-pink-600 dark:text-pink-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span>Profile</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
                currentTab === 'admin'
                  ? 'bg-zinc-100 dark:bg-zinc-900 text-amber-500 font-semibold'
                  : 'text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-500'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Admin & Safety</span>
            </button>
          )}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <HelpCircle className="w-4 h-4 shrink-0 text-indigo-500" />
          <span>Hosting & Setup Guide</span>
        </button>

        <button
          onClick={toggleTheme}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          aria-label="Toggle dark/light theme"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <span className="text-[10px] font-semibold text-zinc-400">Toggle</span>
        </button>

        {userProfile && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 mt-1">
            <div
              onClick={() => onSelectTab('profile')}
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
            >
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.username}
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-zinc-300 dark:ring-zinc-700"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {userProfile.displayName}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">@{userProfile.username}</p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
