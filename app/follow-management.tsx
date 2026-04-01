import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  getFollowing,
  getFollowers,
  unfollowUser,
  isFollowing,
  getUser,
  saveUser,
  followUser,
} from '@/lib/follow-notification-storage';
import { User } from '@/lib/follow-notification-types';

export default function FollowManagementScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<'following' | 'followers'>('following');
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFollows = useCallback(async () => {
    setIsLoading(true);
    try {
      const followingList = await getFollowing();
      const followersList = await getFollowers();
      setFollowing(followingList);
      setFollowers(followersList);
    } catch (error) {
      console.error('팔로우 정보 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFollows();
    }, [loadFollows])
  );

  const handleUnfollow = async (userId: string) => {
    await unfollowUser(userId);
    await loadFollows();
  };

  const renderUserItem = ({ item, canUnfollow }: { item: User; canUnfollow: boolean }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 24 }}>👤</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
          {item.name}
        </Text>
        {item.bio && (
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {item.bio}
          </Text>
        )}
      </View>
      {canUnfollow && (
        <Pressable
          onPress={() => handleUnfollow(item.id)}
          style={({ pressed }) => ({
            backgroundColor: '#EF4444',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>언팔로우</Text>
        </Pressable>
      )}
    </View>
  );

  const currentList = tab === 'following' ? following : followers;

  return (
    <ScreenContainer className="p-4">
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 }}>
        팔로우 관리
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <Pressable
          onPress={() => setTab('following')}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: tab === 'following' ? colors.primary : colors.surface,
            borderRadius: 8,
            paddingVertical: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: tab === 'following' ? '#fff' : colors.foreground,
              textAlign: 'center',
            }}
          >
            팔로잉 ({following.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('followers')}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: tab === 'followers' ? colors.primary : colors.surface,
            borderRadius: 8,
            paddingVertical: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: tab === 'followers' ? '#fff' : colors.foreground,
              textAlign: 'center',
            }}
          >
            팔로워 ({followers.length})
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.muted }}>로드 중...</Text>
        </View>
      ) : currentList.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: colors.muted, marginBottom: 8 }}>👥</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            {tab === 'following' ? '팔로잉 중인 사용자가 없습니다' : '팔로워가 없습니다'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          renderItem={({ item }) =>
            renderUserItem({ item, canUnfollow: tab === 'following' })
          }
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </ScreenContainer>
  );
}
