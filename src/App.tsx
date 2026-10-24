import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { MobileNavbar } from './components/layout/MobileNavbar';
import { FeedView } from './components/feed/FeedView';
import { ReelsView } from './components/reels/ReelsView';
import { ExploreView } from './components/explore/ExploreView';
import { MessagesView } from './components/messages/MessagesView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CreateModal } from './components/create/CreateModal';
import { CreateStoryModal } from './components/stories/CreateStoryModal';
import { StoryViewerModal } from './components/stories/StoryViewerModal';
import { AuthModal } from './components/auth/AuthModal';
import { DeploymentGuideModal } from './components/common/DeploymentGuideModal';
import { Story, UserProfile, Post } from './types';
import { testFirestoreConnection } from './services/firebase';
import { notificationService } from './services/notificationService';
import { chatService } from './services/chatService';

function MainApp() {
  const { userProfile, loading, isAdmin } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [exploreTag, setExploreTag] = useState<string | undefined>(undefined);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Active Story viewer state
  const [activeStoryPayload, setActiveStoryPayload] = useState<{
    stories: Story[];
    index: number;
  } | null>(null);

  // Unread counters
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(2);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(1);

  // Test Firestore connection on app mount
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Update counters
  useEffect(() => {
    if (userProfile) {
      notificationService.getNotifications(userProfile.userId).then((list) => {
        setUnreadNotifsCount(list.filter((n) => !n.isRead).length);
      });
      chatService.getConversations(userProfile.userId).then((list) => {
        setUnreadMessagesCount(list.reduce((acc, c) => acc + (c.unreadCount || 0), 0));
      });
    }
  }, [userProfile]);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterTag = (tag: string) => {
    setExploreTag(tag);
    setCurrentTab('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartChatWithUser = (user: UserProfile) => {
    setCurrentTab('messages');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'profile') {
            setSelectedUserId(userProfile?.userId);
          }
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCreate={() => {
          if (!userProfile) {
            setShowAuthModal(true);
          } else {
            setShowCreateModal(true);
          }
        }}
        onOpenGuide={() => setShowGuideModal(true)}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotifsCount={unreadNotifsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0 overflow-x-hidden">
        {/* Mobile Header */}
        <MobileHeader
          onSelectTab={(tab) => {
            if (tab === 'profile') {
              setSelectedUserId(userProfile?.userId);
            }
            setCurrentTab(tab);
          }}
          onOpenGuide={() => setShowGuideModal(true)}
          unreadMessagesCount={unreadMessagesCount}
          unreadNotifsCount={unreadNotifsCount}
        />

        {/* Tab View Router */}
        <main className="flex-1 w-full" role="main">
          {currentTab === 'feed' && (
            <FeedView
              onOpenStory={(stories, index) => setActiveStoryPayload({ stories, index })}
              onOpenCreateStory={() => {
                if (!userProfile) setShowAuthModal(true);
                else setShowCreateStoryModal(true);
              }}
              onOpenCreatePost={() => {
                if (!userProfile) setShowAuthModal(true);
                else setShowCreateModal(true);
              }}
              onSelectUser={handleSelectUser}
              onFilterTag={handleFilterTag}
            />
          )}

          {currentTab === 'reels' && (
            <ReelsView
              onSelectUser={handleSelectUser}
              onFilterTag={handleFilterTag}
            />
          )}

          {currentTab === 'explore' && (
            <ExploreView
              initialTag={exploreTag}
              onSelectUser={handleSelectUser}
              onSelectReel={() => setCurrentTab('reels')}
            />
          )}

          {currentTab === 'messages' && (
            <MessagesView onSelectUser={handleSelectUser} />
          )}

          {currentTab === 'notifications' && (
            <NotificationsView
              onSelectUser={handleSelectUser}
              onSelectPost={() => setCurrentTab('feed')}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              userId={selectedUserId}
              onOpenSettings={() => setCurrentTab('settings')}
              onSelectReel={() => setCurrentTab('reels')}
              onStartChatWithUser={handleStartChatWithUser}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}

          {currentTab === 'admin' && <AdminDashboard />}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <MobileNavbar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'profile') {
              setSelectedUserId(userProfile?.userId);
            }
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenCreate={() => {
            if (!userProfile) setShowAuthModal(true);
            else setShowCreateModal(true);
          }}
        />
      </div>

      {/* Global Modals */}
      <CreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setCurrentTab('feed');
        }}
      />

      <CreateStoryModal
        isOpen={showCreateStoryModal}
        onClose={() => setShowCreateStoryModal(false)}
      />

      {activeStoryPayload && (
        <StoryViewerModal
          stories={activeStoryPayload.stories}
          initialIndex={activeStoryPayload.index}
          isOpen={!!activeStoryPayload}
          onClose={() => setActiveStoryPayload(null)}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <DeploymentGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
