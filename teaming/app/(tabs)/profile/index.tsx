import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function MyPageScreen() {
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
    router.push('/(tabs)/profile/account-info');
  };

  const handleLogout = () => {
    console.log('로그아웃');
  };

  const handleWithdraw = () => {
    console.log('탈퇴하기');
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
            <Image
              source={require('@/assets/images/(myPage)/myCat.jpeg')}
              style={styles.profileImage}
            />
            <View style={styles.profileImageBorder} />
          </View>
          <Text style={styles.userName}>권민석님</Text>
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

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons
              name="desktop"
              size={20}
              color="#FFFFFF"
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>로그아웃</Text>
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
});
