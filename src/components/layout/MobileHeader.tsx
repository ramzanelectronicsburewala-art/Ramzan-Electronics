import React from 'react';
import { Flame, MessageCircle, Bell, HelpCircle, Moon, Sun } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

interface MobileHeaderProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenGuide: () => void;
  unreadMessagesCount: number;
  unreadNotifsCount: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onSelectTab,
  onOpenGuide,
  unreadMessagesCount,
  unreadNotifsCount,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
      <div
        onClick={() => onSelectTab('feed')}
        className="flex items-center gap-2 cursor-pointer"
        role="button"
        aria-label="Pulse Home"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md shadow-pink-500/25">
          <Flame className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="text-xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-500 bg-clip-text text-transparent">
          Pulse
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
        </button>

        <button
          onClick={onOpenGuide}
          aria-label="Deployment guide"
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors"
        >
          <HelpCircle className="w-5 h-5 text-indigo-500" />
        </button>

        <button
          onClick={() => onSelectTab('notifications')}
          aria-label="Notifications"
          className="p-2 relative text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-white dark:ring-zinc-950" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('messages')}
          aria-label="Direct messages"
          className="p-2 relative text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-white dark:ring-zinc-950" />
          )}
        </button>
      </div>
    </header>
  );
};
