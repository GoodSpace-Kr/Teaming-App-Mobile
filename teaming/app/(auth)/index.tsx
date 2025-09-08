import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const handleSocialLogin = (provider: string) => {
    console.log(`${provider} 로그인 시도`);
    // TODO: 실제 소셜 로그인 구현
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 배경 그라데이션 */}
      <LinearGradient
        colors={['#000000', '#1a1a2e', '#16213e']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 상단 로고 섹션 */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.appName}>Teaming</Text>
        </View>

        {/* 메인 헤더 섹션 */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Teaming</Text>
          <Text style={styles.subtitle}>For Your Team</Text>
          <Text style={styles.description}>
            효율적인 협업으로 과제와 발표를 더 빠르고 똑똑하게.
          </Text>
        </View>

        {/* 통계 섹션 */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>👥</Text>
            </View>
            <Text style={styles.statNumber}>100 팀</Text>
            <Text style={styles.statLabel}>만들어진 팀</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>👤</Text>
            </View>
            <Text style={styles.statNumber}>999명</Text>
            <Text style={styles.statLabel}>가입한 이용자</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statIconText}>🎯</Text>
            </View>
            <Text style={styles.statNumber}>2팀</Text>
            <Text style={styles.statLabel}>완수한 팀</Text>
          </View>
        </View>

        {/* 사용자 후기 섹션 */}
        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>함께한 사람들의 목소리</Text>

          <View style={styles.reviewsContainer}>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewIcon}>😊</Text>
                <View style={styles.reviewUserInfo}>
                  <Text style={styles.reviewUserName}>정상화님</Text>
                  <Text style={styles.reviewUserSchool}>
                    성공회대학교 IT융합자율학부
                  </Text>
                </View>
              </View>
              <Text style={styles.reviewText}>
                믿고쓰는 티밍이네요.. 모르는 사람들과 협업하는데 큰 도움이 되는
                것 같아요.
              </Text>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewIcon}>😊</Text>
                <View style={styles.reviewUserInfo}>
                  <Text style={styles.reviewUserName}>권민석님</Text>
                  <Text style={styles.reviewUserSchool}>숭실대학교 컴</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>
                과제할때, 결과물을 공유 사람들의 강제성을 어떻게
              </Text>
            </View>
          </View>
        </View>

        {/* 소셜 로그인 버튼 섹션 */}
        <View style={styles.socialLoginSection}>
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={() => handleSocialLogin('kakao')}
          >
            <Image
              source={require('../../assets/images/(social)/Kakao.png')}
              style={styles.socialIcon}
            />
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

  // 로고 섹션
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 헤더 섹션
  headerSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },

  // 통계 섹션
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 50,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconText: {
    fontSize: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },

  // 후기 섹션
  reviewsSection: {
    marginBottom: 50,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  reviewsContainer: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reviewUserSchool: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  reviewText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },

  // 소셜 로그인 섹션
  socialLoginSection: {
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
});
