import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import KakaoLoginWebView from '../../src/components/KakaoLoginWebView';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKakaoWebView, setShowKakaoWebView] = useState(false);

  const handleLogin = () => {
    console.log('로그인 시도:', { email, password });
    // TODO: 실제 로그인 로직 구현
  };

  const handleRegister = () => {
    router.push('/(auth)/register');
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'kakao') {
      await handleKakaoLogin();
    } else {
      console.log(`${provider} 로그인 시도`);
      Alert.alert('알림', `${provider} 로그인은 준비 중입니다.`);
    }
  };

  const handleKakaoLogin = () => {
    setShowKakaoWebView(true);
  };

  const handleKakaoLoginSuccess = async (result: any) => {
    try {
      console.log('✅ 카카오 로그인 성공:', result);

      // WebView 닫기
      setShowKakaoWebView(false);

      // 메인 화면으로 이동 (토큰은 이미 WebView에서 저장됨)
      router.replace('/(tabs)');
    } catch (error) {
      console.error('로그인 성공 처리 에러:', error);
      Alert.alert('오류', '로그인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleKakaoLoginError = (error: string) => {
    console.error('❌ 카카오 로그인 에러:', error);
    setShowKakaoWebView(false);
    Alert.alert('로그인 실패', error);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 상단 헤더 (뒤로가기 + 제목) */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>로그인</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 입력 필드 섹션 */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="이메일 주소"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="비밀번호 입력"
              placeholderTextColor="#999999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* 버튼 섹션 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>회원가입</Text>
          </TouchableOpacity>
        </View>

        {/* 구분선 섹션 */}
        <View style={styles.dividerSection}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 소셜 로그인 섹션 */}
        <View style={styles.socialSection}>
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={() => handleSocialLogin('kakao')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Image
                source={require('../../assets/images/(social)/Kakao.png')}
                style={styles.socialIcon}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={() => handleSocialLogin('apple')}
          >
            <Image
              source={require('../../assets/images/(social)/Apple.png')}
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => handleSocialLogin('google')}
          >
            <Image
              source={require('../../assets/images/(social)/Google.png')}
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.naverButton]}
            onPress={() => handleSocialLogin('naver')}
          >
            <Image
              source={require('../../assets/images/(social)/Naver.png')}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 카카오 로그인 WebView 모달 */}
      <Modal
        visible={showKakaoWebView}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowKakaoWebView(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>카카오 로그인</Text>
            <View style={styles.placeholder} />
          </View>
          <KakaoLoginWebView
            onLoginSuccess={handleKakaoLoginSuccess}
            onLoginError={handleKakaoLoginError}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // 헤더 섹션
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 50,
    marginTop: 40,
    paddingHorizontal: 0,
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },

  // 입력 필드 섹션
  inputSection: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },

  // 버튼 섹션
  buttonSection: {
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#325DB1',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },

  // 구분선 섹션
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  dividerText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginHorizontal: 16,
  },

  // 소셜 로그인 섹션
  socialSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  googleButton: {
    backgroundColor: '#EA4335',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  socialIcon: {
    width: 32,
    height: 32,
  },

  // WebView 모달 스타일
  webViewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
});
