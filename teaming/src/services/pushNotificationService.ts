// pushNotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import apiClient from './api';

// 알림 핸들러 설정 (앱이 포그라운드에 있을 때 알림 처리)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Expo Push Token 가져오기
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // 권한 요청
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('⚠️ 알림 권한이 거부되었습니다.');
      return null;
    }

    // 토큰 발급
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'c1659b8c-dd11-4e9b-8169-a8bb552dca70', // app.json의 projectId
    });

    console.log('✅ Expo Push Token 발급 성공:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('❌ Expo Push Token 발급 실패:', error);
    return null;
  }
}

/**
 * 서버에 Push Token 등록
 */
export async function registerPushToken(): Promise<boolean> {
  try {
    console.log('📱 Push Token 등록 시작...');

    const token = await getExpoPushToken();
    if (!token) {
      console.log('⚠️ Push Token을 가져올 수 없어 등록을 건너뜁니다.');
      return false;
    }

    await apiClient.post('/push/tokens', { token });
    console.log('✅ Push Token 등록 성공');
    return true;
  } catch (error: any) {
    console.error('❌ Push Token 등록 실패:', error);
    // 네트워크 오류 등은 조용히 처리 (앱 동작에 영향 없도록)
    if (__DEV__) {
      console.error('상세 에러:', error.response?.data || error.message);
    }
    return false;
  }
}

/**
 * 서버에서 Push Token 삭제
 */
export async function unregisterPushToken(): Promise<boolean> {
  try {
    console.log('📱 Push Token 삭제 시작...');

    const token = await getExpoPushToken();
    if (!token) {
      // 토큰이 없으면 이미 삭제된 것으로 간주
      console.log('⚠️ Push Token이 없어 삭제를 건너뜁니다.');
      return true;
    }

    // JWT 없어도 요청 가능하므로 직접 axios 호출
    await apiClient.delete('/push/tokens', { data: { token } });
    console.log('✅ Push Token 삭제 성공');
    return true;
  } catch (error: any) {
    console.error('❌ Push Token 삭제 실패:', error);
    // 네트워크 오류 등은 조용히 처리
    if (__DEV__) {
      console.error('상세 에러:', error.response?.data || error.message);
    }
    return false;
  }
}

/**
 * 알림 수신 리스너 설정
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * 알림 클릭 리스너 설정
 */
export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * 배지 카운트 초기화
 */
export async function clearBadgeCount(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('❌ 배지 카운트 초기화 실패:', error);
  }
}
