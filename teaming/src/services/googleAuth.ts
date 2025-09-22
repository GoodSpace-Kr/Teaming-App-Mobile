// GoogleLoginAuthSession.tsx – 최종본
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import apiClient from '../services/api';

WebBrowser.maybeCompleteAuthSession(); // 앱 루트에서 1회가 이상적

const EXPO_REDIRECT = 'https://auth.expo.io/@staralstjr/teaming'; // 콘솔에 등록된 것과 동일
const WEB_CLIENT_ID =
  '493606706524-foagvto20di0rvi5qbu8q42qdhhlooe7.apps.googleusercontent.com'; // 새로 생성된 Web Client ID

// 타입 명시 추가 (onLoginSuccess, onLoginError)
interface GoogleLoginAuthSessionProps {
  onLoginSuccess: (data: any) => void;
  onLoginError: (error: string) => void;
}

export default function GoogleLoginAuthSession({
  onLoginSuccess,
  onLoginError,
}: GoogleLoginAuthSessionProps) {
  const once = useRef(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID, // 하나만 사용
    responseType: 'code',
    scopes: ['openid', 'profile', 'email'],
    redirectUri: EXPO_REDIRECT, // 요청/교환 둘 다 이 값으로 통일
    extraParams: { access_type: 'offline', prompt: 'select_account' },
  });

  useEffect(() => {
    if (request && !once.current) {
      once.current = true;
      // TS 에러나면 as any
      promptAsync({ useProxy: true } as any).catch((e) => {
        once.current = false;
        onLoginError(`구글 로그인 시작 실패: ${String(e)}`);
      });
    }
  }, [request]);

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const code = (response.params as any)?.code;
      if (!code) return onLoginError('인증 코드를 받지 못했습니다.');

      apiClient
        .post('/api/auth/app/google', { code, redirectUri: EXPO_REDIRECT })
        .then(async ({ data }) => {
          if (!data?.accessToken)
            return onLoginError(data?.message || '로그인 실패');
          const { saveTokens } = await import('../services/tokenManager');
          await saveTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
          });
          onLoginSuccess(data);
        })
        .catch((e) => onLoginError(e?.response?.data?.message || String(e)));
    } else if (response.type === 'error') {
      onLoginError(String((response as any).error));
    } else {
      onLoginError('사용자가 로그인을 취소했습니다.');
    }
  }, [response]);
}
