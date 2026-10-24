import React, { useState, useEffect } from 'react';
import { X, Heart, Send, MessageCircle } from 'lucide-react';
import { Comment } from '../../types';
import { postService } from '../../services/postService';
import { formatRelativeTime } from '../../utils/textUtils';
import { useAuth } from '../../context/AuthContext';

interface CommentsDrawerProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (newCount: number) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  postId,
  isOpen,
  onClose,
  onCommentCountChange,
}) => {
  const { userProfile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !postId) return;
    setLoading(true);
    postService.getComments(postId).then((res) => {
      setComments(res);
      setLoading(false);
    });
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !userProfile) return;

    setSubmitting(true);
    try {
      const added = await postService.addComment(postId, {
        postId,
        authorId: userProfile.userId,
        authorUsername: userProfile.username,
        authorAvatar: userProfile.avatarUrl,
        authorVerified: userProfile.isVerified,
        text: newText.trim(),
      });

      const updated = [added, ...comments];
      setComments(updated);
      setNewText('');
      if (onCommentCountChange) {
        onCommentCountChange(updated.length);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likesCount: isLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
          };
        }
        return c;
      })
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Comments ({comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comments"
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-xs text-zinc-400">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">No comments yet</p>
              <p className="text-xs text-zinc-400 mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 group">
                <img
                  src={comment.authorAvatar}
                  alt={comment.authorUsername}
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {comment.authorUsername}
                    </span>
                    {comment.authorVerified && (
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">
                        ✓
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 leading-relaxed break-words">
                    {comment.text}
                  </p>
                </div>

                <button
                  onClick={() => handleLikeComment(comment.id)}
                  aria-label="Like comment"
                  className="flex flex-col items-center gap-0.5 p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      comment.isLiked ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                  {comment.likesCount > 0 && (
                    <span className="text-[10px] font-medium">{comment.likesCount}</span>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Comment Input Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          {userProfile ? (
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.username}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 py-2 px-3 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <button
                type="submit"
                disabled={submitting || !newText.trim()}
                aria-label="Post comment"
                className="p-2 rounded-full bg-pink-500 text-white disabled:opacity-40 hover:bg-pink-600 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <p className="text-xs text-center text-zinc-500 py-1">
              Please sign in to join the conversation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
