export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl: string;
  bio?: string;
  website?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  isSuspended?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate?: boolean;
  createdAt: string;
}

export interface UserPrivateInfo {
  email: string;
  blockedUserIds: string[];
  savedPostIds: string[];
  allowDirectMessages: 'everyone' | 'following' | 'none';
  allowComments: 'everyone' | 'following' | 'none';
}

export type PostType = 'image' | 'video';

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  authorVerified?: boolean;
  type: PostType;
  mediaUrl: string;
  thumbnailUrl?: string;
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9';
  caption: string;
  tags: string[];
  location?: string;
  audioTrack?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorAvatar: string;
  authorVerified?: boolean;
  text: string;
  likesCount: number;
  parentCommentId?: string | null;
  createdAt: string;
  isLiked?: boolean;
}

export interface Story {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar: string;
  mediaUrl?: string;
  text?: string;
  backgroundGradient?: string;
  viewers: string[];
  expiresAt: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantDetails: Record<string, {
    username: string;
    displayName: string;
    avatarUrl: string;
  }>;
  lastMessage: string;
  lastSenderId: string;
  updatedAt: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  createdAt: string;
  readBy: string[];
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'system';

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  actorUsername: string;
  actorAvatar: string;
  type: NotificationType;
  targetPostId?: string;
  text?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'post' | 'user' | 'comment';
  targetId: string;
  targetDetails?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}
