import React from 'react';
import { Home, Film, PlusCircle, Compass, User } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface MobileNavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreate: () => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
}) => {
  const { userProfile } = useAuth();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-around"
      aria-label="Mobile Navigation"
    >
      <button
        onClick={() => onSelectTab('feed')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
          currentTab === 'feed'
            ? 'text-pink-600 dark:text-pink-400'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        aria-label="Feed"
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-0.5">Feed</span>
      </button>

      <button
        onClick={() => onSelectTab('reels')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
          currentTab === 'reels'
            ? 'text-pink-600 dark:text-pink-400'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        aria-label="Reels"
      >
        <Film className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-0.5">Reels</span>
      </button>

      <button
        onClick={onOpenCreate}
        className="flex flex-col items-center justify-center -mt-3"
        aria-label="Create Post or Reel"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/30 text-white active:scale-95 transition-transform">
          <PlusCircle className="w-6 h-6" />
        </div>
      </button>

      <button
        onClick={() => onSelectTab('explore')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
          currentTab === 'explore'
            ? 'text-pink-600 dark:text-pink-400'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        aria-label="Explore"
      >
        <Compass className="w-6 h-6" />
        <span className="text-[10px] font-medium mt-0.5">Explore</span>
      </button>

      <button
        onClick={() => onSelectTab('profile')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
          currentTab === 'profile'
            ? 'text-pink-600 dark:text-pink-400'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        aria-label="Profile"
      >
        {userProfile?.avatarUrl ? (
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.username}
            className={`w-6 h-6 rounded-full object-cover ring-2 ${
              currentTab === 'profile' ? 'ring-pink-500' : 'ring-transparent'
            }`}
          />
        ) : (
          <User className="w-6 h-6" />
        )}
        <span className="text-[10px] font-medium mt-0.5">Profile</span>
      </button>
    </nav>
  );
};
