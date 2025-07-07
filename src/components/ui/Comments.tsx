'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from './button';
import { Card } from './card';

interface CommentUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser | null;
  replies: Comment[];
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
}

interface CommentsProps {
  postId: string;
  initialCount?: number;
}

// 用户头像组件 - 提取到外部避免重新创建
const UserAvatar = React.memo(({ user }: { user: CommentUser | null }) => {
  if (!user) return null;

  return (
    <div className="flex items-center space-x-2">
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.username}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
          <span className="text-sm font-medium text-gray-600">
            {user.username[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <span className="text-sm font-medium text-gray-900">{user.username}</span>
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

// 回复表单组件 - 独立出来避免重渲染
const ReplyForm = React.memo(
  ({
    commentId,
    username,
    onSubmit,
    onCancel,
    isSubmitting,
  }: {
    commentId: string;
    username?: string;
    onSubmit: (commentId: string, content: string) => void;
    onCancel: () => void;
    isSubmitting: boolean;
  }) => {
    const [content, setContent] = useState('');

    const handleSubmit = useCallback(() => {
      if (content.trim()) {
        onSubmit(commentId, content.trim());
        setContent('');
      }
    }, [commentId, content, onSubmit]);

    const handleCancel = useCallback(() => {
      setContent('');
      onCancel();
    }, [onCancel]);

    return (
      <div className="mt-3 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`回复 ${username}...`}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={3}
          autoFocus
        />
        <div className="flex space-x-2">
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            size="sm"
          >
            {isSubmitting ? '提交中...' : '回复'}
          </Button>
          <Button onClick={handleCancel} variant="outline" size="sm">
            取消
          </Button>
        </div>
      </div>
    );
  }
);

ReplyForm.displayName = 'ReplyForm';

// 单个评论组件 - 使用 memo 优化
const CommentItem = React.memo(
  ({
    comment,
    replyingTo,
    onReply,
    onCancelReply,
    onSubmitReply,
    isSubmitting,
    session,
    onLike,
    liking,
  }: {
    comment: Comment;
    replyingTo: string | null;
    onReply: (commentId: string) => void;
    onCancelReply: () => void;
    onSubmitReply: (commentId: string, content: string) => void;
    isSubmitting: boolean;
    session: ReturnType<typeof useSession>['data'];
    onLike: (commentId: string, isLiked: boolean) => void;
    liking: boolean;
  }) => {
    const handleReplyClick = useCallback(() => {
      onReply(comment.id);
    }, [comment.id, onReply]);

    return (
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <UserAvatar user={comment.user} />
          <div className="flex-1">
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: zhCN,
              })}
            </div>
            <div className="mt-1 text-gray-800">{comment.content}</div>

            <div className="mt-2 flex items-center space-x-4">
              <button
                className={`text-sm ${comment.isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-600`}
                disabled={liking}
                onClick={() => onLike(comment.id, !!comment.isLiked)}
              >
                {comment.isLiked ? '❤️' : '🤍'} {comment.likesCount}
              </button>
              {session && (
                <button
                  onClick={handleReplyClick}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  回复
                </button>
              )}
            </div>

            {/* 回复表单 */}
            {replyingTo === comment.id && (
              <ReplyForm
                commentId={comment.id}
                username={comment.user?.username}
                onSubmit={onSubmitReply}
                onCancel={onCancelReply}
                isSubmitting={isSubmitting}
              />
            )}

            {/* 回复列表 */}
            {comment.replies.length > 0 && (
              <div className="mt-4 space-y-3 border-l-2 border-gray-100 pl-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start space-x-3">
                    <UserAvatar user={reply.user} />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(reply.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </div>
                      <div className="mt-1 text-gray-800">{reply.content}</div>
                      <div className="mt-2">
                        <button
                          className={`text-sm ${reply.isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-600`}
                          disabled={liking}
                          onClick={() => onLike(reply.id, !!reply.isLiked)}
                        >
                          {reply.isLiked ? '❤️' : '🤍'} {reply.likesCount}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CommentItem.displayName = 'CommentItem';

export function Comments({ postId, initialCount = 0 }: CommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(initialCount);
  const [liking, setLiking] = useState<{ [id: string]: boolean }>({});

  // 获取评论点赞状态
  const fetchLikeStatus = useCallback(async (commentId: string) => {
    try {
      const res = await fetch(
        `/api/likes?targetType=COMMENT&targetId=${commentId}`
      );
      const data = await res.json();
      if (data.success) {
        return { isLiked: data.data.isLiked, likesCount: data.data.count };
      }
    } catch {}
    return { isLiked: false, likesCount: 0 };
  }, []);

  // 加载评论并获取点赞状态
  const loadComments = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        const response = await fetch(
          `/api/comments?postId=${postId}&page=${pageNum}&limit=10`
        );
        const data = await response.json();
        if (data.success) {
          let newComments = data.data.comments;
          // 获取每条评论和回复的点赞状态
          if (session?.user?.id) {
            newComments = await Promise.all(
              newComments.map(async (c: Comment) => {
                const like = await fetchLikeStatus(c.id);
                const replies = await Promise.all(
                  (c.replies || []).map(async (r: Comment) => {
                    const rlike = await fetchLikeStatus(r.id);
                    return { ...r, ...rlike };
                  })
                );
                return { ...c, ...like, replies };
              })
            );
          }
          setComments((prev) =>
            append ? [...prev, ...newComments] : newComments
          );
          setTotalComments(data.data.pagination.total);
          setHasMore(pageNum < data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error('加载评论失败:', error);
      } finally {
        setLoading(false);
      }
    },
    [postId, session, fetchLikeStatus]
  );

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // 点赞/取消点赞
  const handleLike = useCallback(
    async (commentId: string, isLiked: boolean) => {
      if (!session) {
        alert('请先登录');
        return;
      }
      if (liking[commentId]) return;
      setLiking((l) => ({ ...l, [commentId]: true }));
      // 乐观UI
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId)
            return {
              ...c,
              isLiked: !isLiked,
              likesCount: c.likesCount + (isLiked ? -1 : 1),
            };
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    isLiked: !isLiked,
                    likesCount: r.likesCount + (isLiked ? -1 : 1),
                  }
                : r
            ),
          };
        })
      );
      try {
        const method = isLiked ? 'DELETE' : 'POST';
        const res = await fetch('/api/likes', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType: 'COMMENT', targetId: commentId }),
        });
        const data = await res.json();
        if (!data.success) throw new Error();
      } catch {
        // 回滚
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId)
              return {
                ...c,
                isLiked,
                likesCount: c.likesCount + (isLiked ? 1 : -1),
              };
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId
                  ? {
                      ...r,
                      isLiked,
                      likesCount: r.likesCount + (isLiked ? 1 : -1),
                    }
                  : r
              ),
            };
          })
        );
        alert('操作失败');
      } finally {
        setLiking((l) => ({ ...l, [commentId]: false }));
      }
    },
    [session, liking]
  );

  // 提交新评论
  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || !session) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content: newComment.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        // 重新加载评论列表
        loadComments();
      } else {
        alert(data.error || '评论失败');
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      alert('评论失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [newComment, session, postId, loadComments]);

  // 提交回复
  const handleSubmitReply = useCallback(
    async (parentId: string, content: string) => {
      if (!content.trim() || !session) return;

      setSubmitting(true);
      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId,
            content: content.trim(),
            parentId,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setReplyingTo(null);
          // 重新加载评论列表
          loadComments();
        } else {
          alert(data.error || '回复失败');
        }
      } catch (error) {
        console.error('提交回复失败:', error);
        alert('回复失败，请重试');
      } finally {
        setSubmitting(false);
      }
    },
    [session, postId, loadComments]
  );

  // 开始回复
  const handleReply = useCallback((commentId: string) => {
    setReplyingTo(commentId);
  }, []);

  // 取消回复
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // 加载更多评论
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadComments(nextPage, true);
  }, [page, loadComments]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          评论 ({totalComments})
        </h3>
      </div>

      {/* 评论表单 */}
      {session ? (
        <div className="mb-6 space-y-4">
          <div className="flex items-start space-x-3">
            <UserAvatar user={session.user as CommentUser} />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={4}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? '提交中...' : '发表评论'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-gray-600">
            <a href="/auth/login" className="text-blue-600 hover:text-blue-800">
              登录
            </a>{' '}
            后参与评论讨论
          </p>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replyingTo={replyingTo}
                onReply={handleReply}
                onCancelReply={handleCancelReply}
                onSubmitReply={handleSubmitReply}
                isSubmitting={submitting}
                session={session}
                onLike={handleLike}
                liking={!!liking[comment.id]}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button onClick={loadMore} variant="outline" disabled={loading}>
                  {loading ? '加载中...' : '加载更多评论'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500">
            还没有评论，来发表第一条评论吧！
          </div>
        )}
      </div>
    </Card>
  );
}
