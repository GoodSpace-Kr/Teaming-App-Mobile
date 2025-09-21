// KakaoLoginWebView.tsx
import React, { useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import apiClient from '../services/api';

interface Props {
  onLoginSuccess: (result: any) => void;
  onLoginError: (error: string) => void;
}

const REST_API_KEY = 'bab0d232a194e56bd4920ba68c04e3e6'; // Kakao REST API Key (네이티브/JS키 아님)
const REDIRECT_URI = 'https://auth.expo.io/@staralstjr/teaming'; // Kakao 콘솔에 '정확히' 등록된 값

export default function KakaoLoginWebView({
  onLoginSuccess,
  onLoginError,
}: Props) {
  const sentRef = useRef(false);

  // CSRF 방지용 state (서버도 동일성 검사하면 더 안전)
  const state = useMemo(() => Math.random().toString(36).slice(2), []);

  const AUTH_URL = useMemo(() => {
    const base = 'https://kauth.kakao.com/oauth/authorize';
    const qs =
      `response_type=code` +
      `&client_id=${encodeURIComponent(REST_API_KEY)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=login`; // 항상 계정 선택하고 싶으면
    return `${base}?${qs}`;
  }, [state]);

  const INJECTED = `
    (function() {
      function postIfCode(url) {
        try {
          var u = new URL(url);
          var code = u.searchParams.get('code');
          var state = u.searchParams.get('state');
          // Kakao가 리다이렉트하는 정확한 호스트로 제한 (중복/오탐 방지)
          if (code && u.origin === 'https://auth.expo.io') {
            window.ReactNativeWebView.postMessage(JSON.stringify({ url, code, state }));
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
      const { url, code, state: returnedState } = payload || {};
      console.log('🔗 redirected URL:', url);
      console.log(
        '✅ code:',
        code?.slice(0, 10),
        '..., len=',
        String(code || '').length
      );
      console.log('✅ state match:', returnedState === state);

      if (!code) {
        onLoginError('인증 코드를 받지 못했습니다.');
        return;
      }

      // 서버에 code + redirectUri 전달 (백엔드 API 스펙에 맞춤)
      const body = { code, redirectUri: REDIRECT_URI };
      console.log('📤 POST /api/auth/app/kakao', body);

      const res = await apiClient.post('/api/auth/app/kakao', body);
      console.log('✅ server response:', res.data);

      if (res.data?.accessToken) {
        // 토큰 저장
        const { saveTokens } = await import('../services/tokenManager');
        await saveTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user,
        });

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
