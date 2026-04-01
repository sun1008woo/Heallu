/**
 * 팔로우 및 알림 시스템 데이터 타입
 */

export interface User {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  createdAt: number;
}

export interface Follow {
  id: string;
  userId: string;
  followingId: string; // 팔로우하는 사용자 ID
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string; // 알림을 받는 사용자
  fromUserId: string; // 알림을 보낸 사용자
  fromUserName: string;
  type: 'routine_shared' | 'user_followed'; // 알림 타입
  routineId?: string; // 공유된 루틴 ID
  routineName?: string; // 공유된 루틴 이름
  message: string;
  read: boolean;
  createdAt: number;
}

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  routinesCount: number;
  isFollowing?: boolean; // 현재 사용자가 이 사용자를 팔로우하는지 여부
}
