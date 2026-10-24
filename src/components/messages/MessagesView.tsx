import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Smile,
  Search,
  CheckCheck,
  ArrowLeft,
  Sparkles,
  User as UserIcon,
  Circle,
} from 'lucide-react';
import { Conversation, Message, UserProfile } from '../../types';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../utils/textUtils';

interface MessagesViewProps {
  onSelectUser: (userId: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onSelectUser }) => {
  const { userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<UserProfile[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile) {
      chatService.getConversations(userProfile.userId).then((list) => {
        setConversations(list);
        if (list.length > 0 && !activeConversation) {
          setActiveConversation(list[0]);
        }
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (!activeConversation) return;

    const unsubscribe = chatService.subscribeMessages(activeConversation.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });

    return () => unsubscribe();
  }, [activeConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || !userProfile) return;

    const textToSend = inputText.trim();
    setInputText('');

    await chatService.sendMessage(activeConversation.id, userProfile.userId, textToSend);

    // Update conversation preview
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              lastMessage: textToSend,
              lastSenderId: userProfile.userId,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const handleStartConversationWithUser = async (targetUser: UserProfile) => {
    if (!userProfile) return;
    const conv = await chatService.getOrCreateConversation(userProfile, targetUser);
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id);
      return exists ? prev : [conv, ...prev];
    });
    setActiveConversation(conv);
    setShowNewChatModal(false);
  };

  const getPartner = (conv: Conversation) => {
    if (!userProfile) return null;
    const partnerId = conv.participantIds.find((id) => id !== userProfile.userId);
    if (!partnerId) return null;
    return conv.participantDetails?.[partnerId] || {
      username: 'creator',
      displayName: 'Creator',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    };
  };

  return (
    <div className="max-w-5xl mx-auto h-[86vh] my-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex">
      {/* Left Column: Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Direct Messages</h2>
            <p className="text-xs text-zinc-500">@{userProfile?.username}</p>
          </div>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 rounded-xl bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No messages yet. Start a new chat with a creator!
            </div>
          ) : (
            conversations.map((conv) => {
              const partner = getPartner(conv);
              const isSelected = activeConversation?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-800/80'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={partner?.avatarUrl}
                      alt={partner?.username}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {partner?.displayName}
                      </p>
                      <span className="text-[10px] text-zinc-400">
                        {formatRelativeTime(conv.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {conv.lastSenderId === userProfile?.userId ? 'You: ' : ''}
                      {conv.lastMessage}
                    </p>
                  </div>

                  {conv.unreadCount && conv.unreadCount > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Chat Stream */}
      <div
        className={`flex-1 flex flex-col ${
          !activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            {(() => {
              const partner = getPartner(activeConversation);
              return (
                <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-1.5 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <img
                      src={partner?.avatarUrl}
                      alt={partner?.username}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-300 dark:ring-zinc-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {partner?.displayName}
                      </p>
                      <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                        <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                        <span>Online now</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50">
              {messages.map((msg) => {
                const isMe = msg.senderId === userProfile?.userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="break-words">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-zinc-400 mt-0.5 px-1">
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 py-2.5 px-4 rounded-full bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                aria-label="Send message"
                className="p-2.5 rounded-full bg-pink-500 text-white disabled:opacity-40 hover:bg-pink-600 transition-colors shadow-md shadow-pink-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
            <div className="w-16 h-16 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center mb-3">
              <Send className="w-7 h-7" />
            </div>
            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Your Messages</p>
            <p className="text-xs text-zinc-400 mt-1">Select a conversation or start a new chat</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Start New Message</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => {
                  setSearchUserQuery(e.target.value);
                  userService.searchUsers(e.target.value).then(setSearchedUsers);
                }}
                placeholder="Search creator..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {searchedUsers.map((u) => (
                <div
                  key={u.userId}
                  onClick={() => handleStartConversationWithUser(u)}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <img
                    src={u.avatarUrl}
                    alt={u.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{u.displayName}</p>
                    <p className="text-[10px] text-zinc-500">@{u.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
