import AsyncStorage from '@react-native-async-storage/async-storage';
import { Follow, Notification, User } from './follow-notification-types';

const CURRENT_USER_ID = 'current-user'; // 현재 사용자 ID (실제로는 인증 시스템에서 가져옴)
const FOLLOWS_KEY = 'follows';
const NOTIFICATIONS_KEY = 'notifications';
const USERS_KEY = 'users';

/**
 * 현재 사용자 ID 설정
 */
export async function setCurrentUserId(userId: string) {
  await AsyncStorage.setItem('currentUserId', userId);
}

/**
 * 현재 사용자 ID 조회
 */
export async function getCurrentUserId(): Promise<string> {
  const userId = await AsyncStorage.getItem('currentUserId');
  return userId || CURRENT_USER_ID;
}

/**
 * 사용자 생성 또는 업데이트
 */
export async function saveUser(user: User): Promise<void> {
  const users = await AsyncStorage.getItem(USERS_KEY);
  const userList: User[] = users ? JSON.parse(users) : [];
  
  const index = userList.findIndex(u => u.id === user.id);
  if (index >= 0) {
    userList[index] = user;
  } else {
    userList.push(user);
  }
  
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(userList));
}

/**
 * 사용자 조회
 */
export async function getUser(userId: string): Promise<User | null> {
  const users = await AsyncStorage.getItem(USERS_KEY);
  if (!users) return null;
  
  const userList: User[] = JSON.parse(users);
  return userList.find(u => u.id === userId) || null;
}

/**
 * 팔로우
 */
export async function followUser(followingId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();
  
  // 이미 팔로우하는지 확인
  const follows = await AsyncStorage.getItem(FOLLOWS_KEY);
  const followList: Follow[] = follows ? JSON.parse(follows) : [];
  
  const alreadyFollowing = followList.some(
    f => f.userId === currentUserId && f.followingId === followingId
  );
  
  if (!alreadyFollowing) {
    const newFollow: Follow = {
      id: `${currentUserId}-${followingId}-${Date.now()}`,
      userId: currentUserId,
      followingId,
      createdAt: Date.now(),
    };
    
    followList.push(newFollow);
    await AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify(followList));
    
    // 팔로우 알림 생성
    const followingUser = await getUser(followingId);
    if (followingUser) {
      await createNotification({
        id: `notif-${Date.now()}`,
        userId: followingId,
        fromUserId: currentUserId,
        fromUserName: '사용자',
        type: 'user_followed',
        message: `${followingUser.name}님이 팔로우했습니다.`,
        read: false,
        createdAt: Date.now(),
      });
    }
  }
}

/**
 * 언팔로우
 */
export async function unfollowUser(followingId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();
  
  const follows = await AsyncStorage.getItem(FOLLOWS_KEY);
  if (!follows) return;
  
  const followList: Follow[] = JSON.parse(follows);
  const filtered = followList.filter(
    f => !(f.userId === currentUserId && f.followingId === followingId)
  );
  
  await AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify(filtered));
}

/**
 * 팔로우 여부 확인
 */
export async function isFollowing(followingId: string): Promise<boolean> {
  const currentUserId = await getCurrentUserId();
  
  const follows = await AsyncStorage.getItem(FOLLOWS_KEY);
  if (!follows) return false;
  
  const followList: Follow[] = JSON.parse(follows);
  return followList.some(
    f => f.userId === currentUserId && f.followingId === followingId
  );
}

/**
 * 팔로우 목록 조회
 */
export async function getFollowing(): Promise<User[]> {
  const currentUserId = await getCurrentUserId();
  
  const follows = await AsyncStorage.getItem(FOLLOWS_KEY);
  if (!follows) return [];
  
  const followList: Follow[] = JSON.parse(follows);
  const followingIds = followList
    .filter(f => f.userId === currentUserId)
    .map(f => f.followingId);
  
  const users = await AsyncStorage.getItem(USERS_KEY);
  if (!users) return [];
  
  const userList: User[] = JSON.parse(users);
  return userList.filter(u => followingIds.includes(u.id));
}

/**
 * 팔로워 목록 조회
 */
export async function getFollowers(): Promise<User[]> {
  const currentUserId = await getCurrentUserId();
  
  const follows = await AsyncStorage.getItem(FOLLOWS_KEY);
  if (!follows) return [];
  
  const followList: Follow[] = JSON.parse(follows);
  const followerIds = followList
    .filter(f => f.followingId === currentUserId)
    .map(f => f.userId);
  
  const users = await AsyncStorage.getItem(USERS_KEY);
  if (!users) return [];
  
  const userList: User[] = JSON.parse(users);
  return userList.filter(u => followerIds.includes(u.id));
}

/**
 * 팔로워 수 조회
 */
export async function getFollowersCount(userId: string): Promise<number> {
  const follows = await AsyncStorage.getItem(FOLLOWS_KEY);
  if (!follows) return 0;
  
  const followList: Follow[] = JSON.parse(follows);
  return followList.filter(f => f.followingId === userId).length;
}

/**
 * 팔로잉 수 조회
 */
export async function getFollowingCount(userId: string): Promise<number> {
  const follows = await AsyncStorage.getItem(FOLLOWS_KEY);
  if (!follows) return 0;
  
  const followList: Follow[] = JSON.parse(follows);
  return followList.filter(f => f.userId === userId).length;
}

/**
 * 알림 생성
 */
export async function createNotification(notification: Notification): Promise<void> {
  const notifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  const notificationList: Notification[] = notifications ? JSON.parse(notifications) : [];
  
  notificationList.push(notification);
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationList));
}

/**
 * 알림 목록 조회
 */
export async function getNotifications(): Promise<Notification[]> {
  const currentUserId = await getCurrentUserId();
  
  const notifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  if (!notifications) return [];
  
  const notificationList: Notification[] = JSON.parse(notifications);
  return notificationList
    .filter(n => n.userId === currentUserId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * 읽지 않은 알림 수
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter(n => !n.read).length;
}

/**
 * 알림 읽음 표시
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  if (!notifications) return;
  
  const notificationList: Notification[] = JSON.parse(notifications);
  const notification = notificationList.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationList));
  }
}

/**
 * 모든 알림 읽음 표시
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const notifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  if (!notifications) return;
  
  const notificationList: Notification[] = JSON.parse(notifications);
  const currentUserId = await getCurrentUserId();
  
  notificationList.forEach(n => {
    if (n.userId === currentUserId) {
      n.read = true;
    }
  });
  
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationList));
}

/**
 * 알림 삭제
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const notifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
  if (!notifications) return;
  
  const notificationList: Notification[] = JSON.parse(notifications);
  const filtered = notificationList.filter(n => n.id !== notificationId);
  
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
}

/**
 * 루틴 공유 알림 생성 (팔로워들에게)
 */
export async function notifyFollowersAboutRoutineShare(
  routineId: string,
  routineName: string,
  creatorName: string
): Promise<void> {
  const currentUserId = await getCurrentUserId();
  const followers = await getFollowers();
  
  for (const follower of followers) {
    await createNotification({
      id: `notif-${Date.now()}-${follower.id}`,
      userId: follower.id,
      fromUserId: currentUserId,
      fromUserName: creatorName,
      type: 'routine_shared',
      routineId,
      routineName,
      message: `${creatorName}님이 "${routineName}" 루틴을 공유했습니다.`,
      read: false,
      createdAt: Date.now(),
    });
  }
}
