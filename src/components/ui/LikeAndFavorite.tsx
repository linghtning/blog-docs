'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './button';

interface LikeAndFavoriteProps {
  postId: string;
  initialLikes?: number;
  initialFavorites?: number;
  className?: string;
}

export function LikeAndFavorite({
  postId,
  initialLikes = 0,
  initialFavorites = 0,
  className = '',
}: LikeAndFavoriteProps) {
  const { data: session } = useSession();
  const [likes, setLikes] = useState(initialLikes);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likingLoading, setLikingLoading] = useState(false);
  const [favoritingLoading, setFavoritingLoading] = useState(false);

  // 检查当前用户的点赞和收藏状态
  useEffect(() => {
    if (session?.user?.id) {
      checkUserStatus();
    }
  }, [session, postId]);

  const checkUserStatus = async () => {
    try {
      // 并行检查点赞和收藏状态
      const [likesResponse, favoritesResponse] = await Promise.all([
        fetch(`/api/likes?targetType=POST&targetId=${postId}`),
        fetch(`/api/favorites?postId=${postId}`),
      ]);

      if (likesResponse.ok) {
        const likesData = await likesResponse.json();
        if (likesData.success) {
          setLikes(likesData.data.count);
          setIsLiked(likesData.data.isLiked);
        }
      }

      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        if (favoritesData.success) {
          setFavorites(favoritesData.data.count);
          setIsFavorited(favoritesData.data.isFavorited);
        }
      }
    } catch (error) {
      console.error('检查用户状态失败:', error);
    }
  };

  // 处理点赞
  const handleLike = async () => {
    if (!session) {
      alert('请先登录');
      return;
    }

    setLikingLoading(true);

    // 乐观更新
    const newIsLiked = !isLiked;
    const newLikes = newIsLiked ? likes + 1 : likes - 1;
    setIsLiked(newIsLiked);
    setLikes(newLikes);

    try {
      const method = newIsLiked ? 'POST' : 'DELETE';
      const response = await fetch('/api/likes', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType: 'POST',
          targetId: postId,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        // 如果请求失败，回滚状态
        setIsLiked(!newIsLiked);
        setLikes(likes);
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      // 回滚状态
      setIsLiked(!newIsLiked);
      setLikes(likes);
      alert('网络错误，请重试');
    } finally {
      setLikingLoading(false);
    }
  };

  // 处理收藏
  const handleFavorite = async () => {
    if (!session) {
      alert('请先登录');
      return;
    }

    setFavoritingLoading(true);

    // 乐观更新
    const newIsFavorited = !isFavorited;
    const newFavorites = newIsFavorited ? favorites + 1 : favorites - 1;
    setIsFavorited(newIsFavorited);
    setFavorites(newFavorites);

    try {
      const method = newIsFavorited ? 'POST' : 'DELETE';
      const response = await fetch('/api/favorites', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        // 如果请求失败，回滚状态
        setIsFavorited(!newIsFavorited);
        setFavorites(favorites);
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      // 回滚状态
      setIsFavorited(!newIsFavorited);
      setFavorites(favorites);
      alert('网络错误，请重试');
    } finally {
      setFavoritingLoading(false);
    }
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* 点赞按钮 */}
      <Button
        variant={isLiked ? 'default' : 'outline'}
        size="sm"
        onClick={handleLike}
        disabled={likingLoading}
        className="flex items-center space-x-2"
      >
        <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
        <span>{likes}</span>
        {likingLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
        )}
      </Button>

      {/* 收藏按钮 */}
      <Button
        variant={isFavorited ? 'default' : 'outline'}
        size="sm"
        onClick={handleFavorite}
        disabled={favoritingLoading}
        className="flex items-center space-x-2"
      >
        <span className="text-lg">{isFavorited ? '⭐' : '☆'}</span>
        <span>{favorites}</span>
        {favoritingLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
        )}
      </Button>
    </div>
  );
}

// 简化版本 - 仅显示统计数据的组件
export function LikeAndFavoriteStats({
  likes,
  favorites,
  className = '',
}: {
  likes: number;
  favorites: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center space-x-4 text-sm text-gray-500 ${className}`}
    >
      <span className="flex items-center space-x-1">
        <span>❤️</span>
        <span>{likes}</span>
      </span>
      <span className="flex items-center space-x-1">
        <span>⭐</span>
        <span>{favorites}</span>
      </span>
    </div>
  );
}
