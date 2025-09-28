import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logout as authLogout } from '../../../src/services/authService';
import {
  getUserInfo,
  UserInfo,
  logout,
  withdraw,
} from '../../../src/services/api';
import apiClient from '../../../src/services/api';

const { width } = Dimensions.get('window');

export default function MyPageScreen() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  // 아바타 URL 가져오기
  const fetchAvatarUrl = async () => {
    try {
      setIsLoadingAvatar(true);
      const userResponse = await apiClient.get('/users/me');
      setAvatarUrl(userResponse.data.avatarUrl);
      console.log('아바타 URL 로드:', userResponse.data.avatarUrl);
    } catch (error) {
      console.error('아바타 URL 가져오기 실패:', error);
      // 에러가 발생해도 기본 이미지 사용
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  // 프로필 탭이 포커스될 때마다 사용자 정보 가져오기
  useFocusEffect(
    useCallback(() => {
      const fetchUserInfo = async () => {
        try {
          setIsLoadingUserInfo(true);
          const userData = await getUserInfo();
          setUserInfo(userData);
          console.log('마이페이지 사용자 정보 로드:', userData);

          // 사용자 정보 로드 후 아바타 URL 가져오기
          await fetchAvatarUrl();
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
          // 에러가 발생해도 기본값으로 계속 진행
        } finally {
          setIsLoadingUserInfo(false);
        }
      };

      fetchUserInfo();
    }, [])
  );

  const handleBackPress = () => {
    router.back();
  };

  const handleTermsOfService = () => {
    router.push('/(tabs)/profile/terms-privacy?tab=terms');
  };

  const handlePersonalInfo = () => {
    router.push('/(tabs)/profile/terms-privacy?tab=privacy');
  };

  const handleVersionInfo = () => {
    console.log('버전정보');
  };

  const handleChangeAccountInfo = () => {
    if (userInfo) {
      router.push({
        pathname: '/(tabs)/profile/account-info',
        params: {
          userInfo: JSON.stringify(userInfo),
        },
      });
    } else {
      // 사용자 정보가 없으면 기본적으로 이동
      router.push('/(tabs)/profile/account-info');
    }
  };

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoggingOut(true);

            // 서버에 리프레시 토큰 만료 요청
            await logout();

            // 로컬 토큰 삭제 및 로그아웃 처리
            const success = await authLogout();

            if (success) {
              Alert.alert('성공', '로그아웃되었습니다.');
              router.replace('/(auth)');
            } else {
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          } catch (error) {
            console.error('로그아웃 에러:', error);
            Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleWithdraw = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말로 탈퇴하시겠습니까?\n\n탈퇴 시 모든 데이터가 삭제되며, 결제한 금액은 환불받을 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            try {
              // 서버에 회원 탈퇴 요청
              await withdraw();

              // 로컬 토큰 삭제 및 로그아웃 처리
              await authLogout();

              Alert.alert('탈퇴 완료', '회원 탈퇴가 완료되었습니다.');
              router.replace('/(auth)');
            } catch (error) {
              console.error('회원 탈퇴 에러:', error);
              Alert.alert('오류', '회원 탈퇴 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleGifticon = () => {
    router.push('/(tabs)/profile/gifticon');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 상단 네비게이션 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>마이페이지</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {isLoadingUserInfo || isLoadingAvatar ? (
              <View style={styles.profileImageLoading}>
                <ActivityIndicator size="large" color="#4A90E2" />
              </View>
            ) : (
              <Image
                source={
                  avatarUrl
                    ? { uri: avatarUrl }
                    : require('@/assets/images/(myPage)/myCat.jpeg')
                }
                style={styles.profileImage}
                onError={() => {
                  console.log('아바타 이미지 로드 실패, 기본 이미지 사용');
                  setAvatarUrl(null);
                }}
              />
            )}
            <View style={styles.profileImageBorder} />
          </View>
          {isLoadingUserInfo ? (
            <View style={styles.userNameLoading}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loadingText}>
                사용자 정보를 불러오는 중...
              </Text>
            </View>
          ) : (
            <Text style={styles.userName}>
              {userInfo?.name ? `${userInfo.name}님` : '사용자님'}
            </Text>
          )}
          <Text style={styles.welcomeMessage}>당신의 팀플을 응원해요 👋</Text>
        </View>

        {/* 설정 및 정보 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>설정 및 정보</Text>
          </View>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleTermsOfService}
          >
            <Ionicons
              name="document-text"
              size={20}
              color="#FFFFFF"
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>이용약관</Text>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePersonalInfo}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="people" size={20} color="#FFFFFF" />
              <Ionicons
                name="information"
                size={12}
                color="#FFFFFF"
                style={styles.smallIcon}
              />
            </View>
            <Text style={styles.menuText}>개인정보 수집 및 이용</Text>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={handleVersionInfo}
            disabled={true}
          >
            <Ionicons
              name="settings"
              size={20}
              color="#FFFFFF"
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>버전정보</Text>
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>v1.0.0</Text>
              <Ionicons name="chevron-forward" size={16} color="#666666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 기프티콘 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>기프티콘</Text>
          </View>
          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={handleGifticon}
          >
            <Ionicons
              name="gift"
              size={20}
              color="#FFFFFF"
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>내 기프티콘</Text>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* 계정 관리 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>계정 관리</Text>
          </View>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleChangeAccountInfo}
          >
            <Ionicons
              name="cube"
              size={20}
              color="#FFFFFF"
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>계정정보 변경</Text>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Ionicons
              name="desktop"
              size={20}
              color="#FFFFFF"
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>
              {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={handleWithdraw}
          >
            <Ionicons
              name="trash"
              size={20}
              color="#FF6B6B"
              style={styles.menuIcon}
            />
            <Text style={[styles.menuText, styles.dangerText]}>탈퇴하기</Text>
            <Ionicons name="chevron-forward" size={16} color="#666666" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImageBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#4A90E2',
    opacity: 0.3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#121216',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  menuIconContainer: {
    position: 'relative',
    marginRight: 8,
    marginLeft: -2,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 10,
  },
  smallIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: '500',
    textAlign: 'left',
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#888888',
    marginRight: 8,
    fontWeight: '500',
    textAlign: 'right',
  },
  dangerText: {
    color: '#FF6B6B',
  },
  profileImageLoading: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNameLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#B0B0B0',
    marginLeft: 8,
  },
});
