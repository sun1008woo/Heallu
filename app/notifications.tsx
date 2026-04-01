import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
} from '@/lib/follow-notification-storage';
import { Notification } from '@/lib/follow-notification-types';

export default function NotificationsScreen() {
  const colors = useColors();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const notifs = await getNotifications();
      setNotifications(notifs);
      const unread = await getUnreadNotificationCount();
      setUnreadCount(unread);
    } catch (error) {
      console.error('알림 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    await loadNotifications();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
    await loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'routine_shared':
        return '📋';
      case 'user_followed':
        return '👤';
      default:
        return '🔔';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => !item.read && handleMarkAsRead(item.id)}
      style={({ pressed }) => [
        {
          backgroundColor: item.read ? colors.surface : '#FFF3E0',
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: item.read ? colors.border : colors.primary,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Text style={{ fontSize: 24 }}>{getNotificationIcon(item.type)}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: item.read ? '500' : '700',
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            {item.message}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
            }}
          >
            {new Date(item.createdAt).toLocaleString('ko-KR')}
          </Text>
        </View>
        <Pressable
          onPress={() => handleDeleteNotification(item.id)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: 18 }}>✕</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-4">
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
            알림
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
                {unreadCount}개
              </Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllAsRead}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 16,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' }}>
              모두 읽음으로 표시
            </Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.muted }}>로드 중...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: colors.muted, marginBottom: 8 }}>🔔</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            알림이 없습니다
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            팔로우한 사용자의 새로운 루틴이 여기에 표시됩니다
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </ScreenContainer>
  );
}
