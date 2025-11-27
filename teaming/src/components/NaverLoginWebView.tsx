// NaverLoginWebView.tsx
import React, { useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import apiClient from '../services/api';
import { registerPushToken } from '../services/pushNotificationService';

interface Props {
  onLoginSuccess: (result: any) => void;
  onLoginError: (error: string) => void;
}

const CLIENT_ID = 'VYf9Phuf2zxzz4YhzLNl'; // 네이버 개발자센터에서 발급받은 Client ID
const REDIRECT_URI = 'https://auth.expo.io/@staralstjr/teaming'; // 네이버 콘솔에 등록된 값

export default function NaverLoginWebView({
  onLoginSuccess,
  onLoginError,
}: Props) {
  const sentRef = useRef(false);

  // CSRF 방지용 state (서버도 동일성 검사하면 더 안전)
  const state = useMemo(() => Math.random().toString(36).slice(2), []);

  const AUTH_URL = useMemo(() => {
    const base = 'https://nid.naver.com/oauth2.0/authorize';
    const qs =
      `response_type=code` +
      `&client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&state=${encodeURIComponent(state)}`;
    return `${base}?${qs}`;
  }, [state]);

  const INJECTED = `
    (function() {
      function postIfCode(url) {
        try {
          var u = new URL(url);
          var code = u.searchParams.get('code');
          var state = u.searchParams.get('state');
          var error = u.searchParams.get('error');
          var errorDescription = u.searchParams.get('error_description');
          
          // 네이버가 리다이렉트하는 정확한 호스트로 제한 (중복/오탐 방지)
          if (u.origin === 'https://auth.expo.io') {
            if (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ url, error, errorDescription, state }));
            } else if (code) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ url, code, state }));
            }
          }
        } catch (e) {}
      }
      postIfCode(window.location.href);
      var pushState = history.pushState;
      var replaceState = history.replaceState;
      history.pushState = function() { pushState.apply(this, arguments); postIfCode(location.href); };
      history.replaceState = function() { replaceState.apply(this, arguments); postIfCode(location.href); };
      window.addEventListener('popstate', function(){ postIfCode(location.href); });
    })();
  `;

  const onMessage = async (event: any) => {
    if (sentRef.current) return; // 한 번만 전송
    sentRef.current = true;

    try {
      const payload = JSON.parse(event.nativeEvent.data);
      const {
        url,
        code,
        state: returnedState,
        error,
        errorDescription,
      } = payload || {};
      console.log('🔗 redirected URL:', url);
      console.log(
        '✅ code:',
        code?.slice(0, 10),
        '..., len=',
        String(code || '').length
      );
      console.log('✅ state match:', returnedState === state);

      // 에러가 있는 경우 처리
      if (error) {
        console.error('❌ 네이버 OAuth 에러 발생!');
        console.error('❌ 에러 코드:', error);
        console.error('❌ 에러 설명:', errorDescription);
        onLoginError(
          `${error}${errorDescription ? `: ${errorDescription}` : ''}`
        );
        return;
      }

      if (!code) {
        onLoginError('인증 코드를 받지 못했습니다.');
        return;
      }

      // 서버에 code + redirectUri 전달 (백엔드 API 스펙에 맞춤)
      const body = { code, redirectUri: REDIRECT_URI };
      console.log('📤 POST /api/auth/app/naver', body);

      const res = await apiClient.post('/api/auth/app/naver', body);
      console.log('✅ server response:', res.data);

      if (res.data?.accessToken) {
        // 토큰 저장
        const { saveTokens } = await import('../services/tokenManager');
        await saveTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          loginType: 'naver',
          user: res.data.user,
        });

        // Push Token 등록
        await registerPushToken();

        onLoginSuccess(res.data);
      } else {
        onLoginError(res.data?.message || '로그인에 실패했습니다.');
      }
    } catch (e: any) {
      console.error('❌ handleMessage error:', e?.message || e);
      onLoginError('로그인 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: AUTH_URL }}
        injectedJavaScript={INJECTED}
        onMessage={onMessage}
        javaScriptEnabled
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        // 디버깅에 도움
        onNavigationStateChange={(nav) => console.log('➡️', nav.url)}
        onError={(e) => console.log('❌ WebView error:', e.nativeEvent)}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
