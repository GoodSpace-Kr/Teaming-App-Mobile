// GoogleLoginWebView.tsx
import React, { useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import apiClient from '../services/api';

interface Props {
  onLoginSuccess: (result: any) => void;
  onLoginError: (error: string) => void;
}

const WEB_CLIENT_ID =
  '493606706524-foagvto20di0rvi5qbu8q42qdhhlooe7.apps.googleusercontent.com'; // 새로 생성된 Web Client ID
const REDIRECT_URI = 'https://auth.expo.io/@staralstjr/teaming'; // Google 콘솔에 '정확히' 등록된 값

export default function GoogleLoginWebView({
  onLoginSuccess,
  onLoginError,
}: Props) {
  const sentRef = useRef(false);

  // CSRF 방지용 state (서버도 동일성 검사하면 더 안전)
  const state = useMemo(() => Math.random().toString(36).slice(2), []);

  const AUTH_URL = useMemo(() => {
    const base = 'https://accounts.google.com/o/oauth2/v2/auth';
    const qs =
      `response_type=code` + // 원래대로 code로 변경
      `&client_id=${encodeURIComponent(WEB_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${encodeURIComponent('openid profile email')}` +
      `&access_type=offline` + // access_type=offline 복원
      `&prompt=select_account` +
      `&state=${encodeURIComponent(state)}`;
    const url = `${base}?${qs}`;
    console.log('🔗 구글 OAuth URL 생성됨:', url);
    console.log('🔗 Client ID:', WEB_CLIENT_ID);
    console.log('🔗 Redirect URI:', REDIRECT_URI);
    console.log('🔗 State:', state);
    return url;
  }, [state]);

  const INJECTED = `
    (function() {
      console.log('🔍 Injected JS 실행됨');
      console.log('🔍 현재 URL:', window.location.href);
      
      function postIfCode(url) {
        try {
          console.log('🔍 URL 분석 시작:', url);
          var u = new URL(url);
          var code = u.searchParams.get('code');
          var state = u.searchParams.get('state');
          var error = u.searchParams.get('error');
          var errorDescription = u.searchParams.get('error_description');
          
          console.log('🔍 파싱된 파라미터들:');
          console.log('  - code:', code ? code.substring(0, 10) + '...' : 'null');
          console.log('  - state:', state);
          console.log('  - error:', error);
          console.log('  - errorDescription:', errorDescription);
          console.log('  - origin:', u.origin);
          
          // Google가 리다이렉트하는 정확한 호스트로 제한 (중복/오탐 방지)
          if (u.origin === 'https://auth.expo.io') {
            console.log('✅ 올바른 origin 확인됨');
            if (error) {
              console.log('❌ 에러 발견, 메시지 전송:', error);
              window.ReactNativeWebView.postMessage(JSON.stringify({ url, error, errorDescription, state }));
            } else if (code) {
              console.log('✅ 코드 발견, 메시지 전송');
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                url, 
                code, 
                state 
              }));
            } else {
              console.log('⚠️ 코드도 에러도 없음');
            }
          } else {
            console.log('⚠️ 다른 origin:', u.origin);
          }
        } catch (e) {
          console.error('❌ URL 파싱 에러:', e);
        }
      }
      
      postIfCode(window.location.href);
      var pushState = history.pushState;
      var replaceState = history.replaceState;
      history.pushState = function() { 
        console.log('🔍 pushState 호출됨');
        pushState.apply(this, arguments); 
        postIfCode(location.href); 
      };
      history.replaceState = function() { 
        console.log('🔍 replaceState 호출됨');
        replaceState.apply(this, arguments); 
        postIfCode(location.href); 
      };
      window.addEventListener('popstate', function(){ 
        console.log('🔍 popstate 이벤트 발생');
        postIfCode(location.href); 
      });
    })();
  `;

  const onMessage = async (event: any) => {
    if (sentRef.current) return; // 한 번만 전송
    sentRef.current = true;

    try {
      console.log('🔍 WebView 메시지 수신:', event.nativeEvent.data);
      const payload = JSON.parse(event.nativeEvent.data);
      const {
        url,
        code,
        state: returnedState,
        error,
        errorDescription,
      } = payload || {};

      console.log('🔗 redirected URL:', url);
      console.log('📊 받은 데이터 전체:', payload);
      console.log(
        '✅ code:',
        code?.slice(0, 10),
        '..., len=',
        String(code || '').length
      );
      console.log('✅ state match:', returnedState === state);
      console.log('✅ error:', error);
      console.log('✅ errorDescription:', errorDescription);

      // 에러가 있는 경우 처리
      if (error) {
        console.error('❌ OAuth 에러 발생!');
        console.error('❌ 에러 코드:', error);
        console.error('❌ 에러 설명:', errorDescription);
        console.error('❌ 전체 URL:', url);
        onLoginError(
          `${error}${errorDescription ? `: ${errorDescription}` : ''}`
        );
        return;
      }

      if (!code) {
        console.error('❌ 인증 코드가 없습니다!');
        console.error('❌ 받은 데이터:', payload);
        onLoginError('인증 코드를 받지 못했습니다.');
        return;
      }

      // 서버에 code + redirectUri 전달 (백엔드 API 스펙에 맞춤)
      const body = { code, redirectUri: REDIRECT_URI };
      console.log('📤 POST /api/auth/app/google 요청 시작');
      console.log('📤 전송할 데이터:', body);

      const res = await apiClient.post('/api/auth/app/google', body);
      console.log('✅ 서버 응답 성공!');
      console.log('✅ 응답 상태:', res.status);
      console.log('✅ 응답 데이터:', res.data);

      if (res.data?.accessToken) {
        console.log('✅ 로그인 성공! 토큰 저장 중...');
        // 토큰 저장
        const { saveTokens } = await import('../services/tokenManager');
        await saveTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user,
        });

        onLoginSuccess(res.data);
      } else {
        console.error('❌ 서버 응답에 액세스 토큰이 없습니다!');
        console.error('❌ 서버 응답:', res.data);
        onLoginError(res.data?.message || '로그인에 실패했습니다.');
      }
    } catch (e: any) {
      console.error('❌ handleMessage 에러 발생!');
      console.error('❌ 에러 타입:', typeof e);
      console.error('❌ 에러 메시지:', e?.message || e);
      console.error('❌ 에러 스택:', e?.stack);
      console.error('❌ 전체 에러 객체:', e);

      // API 에러인 경우 더 자세한 정보 출력
      if (e?.response) {
        console.error('❌ API 에러 응답:');
        console.error('❌ 상태 코드:', e.response.status);
        console.error('❌ 응답 데이터:', e.response.data);
        console.error('❌ 응답 헤더:', e.response.headers);
      }

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
        onNavigationStateChange={(nav) => {
          console.log('➡️ WebView 네비게이션:', nav.url);
          console.log('➡️ 로딩 상태:', nav.loading);
          console.log('➡️ 제목:', nav.title);
        }}
        onError={(e) => {
          console.error('❌ WebView 에러 발생!');
          console.error('❌ 에러 코드:', e.nativeEvent.code);
          console.error('❌ 에러 설명:', e.nativeEvent.description);
          console.error('❌ 에러 URL:', e.nativeEvent.url);
          console.error('❌ 전체 에러:', e.nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView HTTP 에러!');
          console.error('❌ HTTP 상태 코드:', nativeEvent.statusCode);
          console.error('❌ 에러 URL:', nativeEvent.url);
          console.error('❌ 에러 설명:', nativeEvent.description);
        }}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
