import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isLoggedIn } from '@/src/services/tokenManager';
import { registerPushToken } from '@/src/services/pushNotificationService';

import { HapticTab } from '@/components/HapticTab';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // 앱이 포그라운드로 올 때 Push Token 등록
  useEffect(() => {
    const checkAndRegisterToken = async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          console.log('📱 앱 재실행 감지, Push Token 등록 시도...');
          await registerPushToken();
        }
      } catch (error) {
        console.error('❌ Push Token 등록 실패:', error);
      }
    };

    // 앱이 마운트될 때 한 번 실행
    checkAndRegisterToken();

    // 앱이 포그라운드로 올 때마다 실행
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAndRegisterToken();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#121216',
          borderTopWidth: 0,
          height: 50 + Math.max(insets.bottom, 20),
          paddingBottom: Math.max(insets.bottom, 20),
          paddingTop: 20,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          elevation: 1000,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null, // 탭바에서 숨김
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: '채팅방',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
