import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLandingStats } from '../../src/hooks/useLandingStats';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { stats, loading } = useLandingStats();
  const insets = useSafeAreaInsets();

  const handleLoginPress = () => {
    console.log('로그인 버튼 눌림');
    router.push('/(auth)/login');
  };

  const handleRegisterPress = () => {
    console.log('회원가입 버튼 눌림');
    router.push('/(auth)/register');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 메인 고정 영역 */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top - 30,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {/* 상단 로고 섹션 */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/tmlogo.png')}
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

        {/* 배경 웨이브 이미지 */}
        <View style={styles.waveContainer} pointerEvents="none">
          <Image
            source={require('../../assets/images/(beforeLogin)/wave.png')}
            style={styles.waveImage}
            resizeMode="cover"
          />
        </View>

        {/* 통계 섹션 */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Image
                source={require('../../assets/images/(beforeLogin)/bluePeople.png')}
                style={styles.statIconImage}
              />
            </View>
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={styles.loadingIndicator}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.totalTeamCount}팀</Text>
            )}
            <Text style={styles.statLabel}>만들어진 팀</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Image
                source={require('../../assets/images/(beforeLogin)/image 15.png')}
                style={styles.statIconImage}
              />
            </View>
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={styles.loadingIndicator}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.totalUserCount}명</Text>
            )}
            <Text style={styles.statLabel}>가입한 이용자</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Image
                source={require('../../assets/images/(beforeLogin)/image 19.png')}
                style={styles.statIconImage}
              />
            </View>
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={styles.loadingIndicator}
              />
            ) : (
              <Text style={styles.statNumber}>{stats.completeTeamCount}팀</Text>
            )}
            <Text style={styles.statLabel}>완수한 팀</Text>
          </View>
        </View>

        {/* 후기 섹션 */}
        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>함께한 사람들의 목소리</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewsScrollContainer}
          >
            {/* ... 기존 리뷰 카드들 그대로 ... */}
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
                  <Text style={styles.reviewUserSchool}>
                    숭실대학교 컴퓨터공학과
                  </Text>
                </View>
              </View>
              <Text style={styles.reviewText}>
                과제할때, 결과물을 공유 사람들의 강제성을 어떻게 줘야할지
                고민이었는데 티밍이 도움이 되었어요.
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* 👇 로그인/회원가입 섹션 – 이제 ScrollView 안의 마지막 요소 */}
        <View style={styles.loginButtonSection}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLoginPress}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>

          <Text style={styles.divider}>/</Text>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegisterPress}
          >
            <Text style={styles.registerButtonText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // 로고 섹션
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
    zIndex: 10,
  },
  logo: {
    width: 40,
    height: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 헤더 섹션
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
    zIndex: 2,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    paddingHorizontal: 20,
  },

  // 웨이브 배경
  waveContainer: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    height: height * 0.6,
    zIndex: 0,
  },
  waveImage: {
    width: '100%',
    height: '100%',
    opacity: 1,
  },

  // 통계 섹션
  statsSection: {
    flexDirection: 'row',
    marginBottom: 30,
    marginTop: 20,
    zIndex: 1,
    paddingHorizontal: 1,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '32.2%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    marginBottom: 16,
  },
  statIconImage: {
    width: 50,
    height: 50,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingIndicator: {
    marginVertical: 10,
  },

  // 후기 섹션
  reviewsSection: {
    marginBottom: 30,
    zIndex: 2,
  },
  reviewsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 24,
    textAlign: 'left',
  },
  reviewsScrollContainer: {
    paddingRight: 20,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: width * 0.8,
    marginRight: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reviewUserSchool: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  reviewText: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 22,
  },

  // 로그인 버튼 섹션
  loginButtonSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 32,
  },
  loginButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  divider: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
  registerButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
