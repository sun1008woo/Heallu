import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const USER_EMAIL_KEY = 'user_email';

export interface StoredAuthToken {
  token: string;
  userId: string;
  email: string;
  expiresAt?: number;
}

/**
 * 인증 토큰을 로컬 저장소에 저장
 */
export async function saveAuthToken(authToken: StoredAuthToken): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, authToken.token],
      [USER_ID_KEY, authToken.userId],
      [USER_EMAIL_KEY, authToken.email],
    ]);
  } catch (error) {
    console.error('Failed to save auth token:', error);
    throw error;
  }
}

/**
 * 저장된 인증 토큰 조회
 */
export async function getStoredAuthToken(): Promise<StoredAuthToken | null> {
  try {
    const values = await AsyncStorage.multiGet([TOKEN_KEY, USER_ID_KEY, USER_EMAIL_KEY]);
    const token = values[0][1];
    const userId = values[1][1];
    const email = values[2][1];

    if (!token || !userId || !email) {
      return null;
    }

    return { token, userId, email };
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * 저장된 인증 토큰 삭제 (로그아웃)
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY, USER_EMAIL_KEY]);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
    throw error;
  }
}

/**
 * 토큰이 유효한지 확인
 */
export async function isTokenValid(): Promise<boolean> {
  try {
    const authToken = await getStoredAuthToken();
    if (!authToken) {
      return false;
    }

    // 토큰 만료 시간이 설정되어 있으면 확인
    if (authToken.expiresAt && authToken.expiresAt < Date.now()) {
      await clearAuthToken();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to validate token:', error);
    return false;
  }
}
