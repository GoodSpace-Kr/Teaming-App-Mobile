import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getGifticons,
  GifticonItem,
  getUserInfo,
  UserInfo,
} from '../../../src/services/api';

const { width } = Dimensions.get('window');

export default function GifticonScreen() {
  const [gifticons, setGifticons] = useState<GifticonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 방 등급별 기프티콘 정보 (create-team.tsx에서 가져온 정보)
  const roomTypes = [
    {
      id: 'basic',
      name: 'Basic Room',
      benefit: '메가커피 아이스 아메리카노 1개',
      logo: require('../../../assets/images/(makeTeam)/mega.png'),
      color: '#FFFFFF',
    },
    {
      id: 'standard',
      name: 'Standard Room',
      benefit: '스타벅스 아이스 아메리카노 1개',
      logo: require('../../../assets/images/(makeTeam)/starbucks.png'),
      color: '#FFFFFF',
    },
    {
      id: 'elite',
      name: 'Elite Room',
      benefit: '스타벅스 아이스 아메리카노 1개 + 프렌치 크루아상',
      logo: require('../../../assets/images/(makeTeam)/starbucks.png'),
      color: '#FFD700',
    },
  ];

  // 기프티콘 데이터 로드
  const fetchGifticons = async () => {
    try {
      setIsLoading(true);

      // 먼저 사용자 정보 가져오기
      const userData = await getUserInfo();
      setUserInfo(userData);

      // 사용자 ID로 기프티콘 조회
      const gifticonData = await getGifticons(1);
      setGifticons(gifticonData);

      console.log('기프티콘 데이터 로드 완료:', gifticonData);
    } catch (error) {
      console.error('기프티콘 데이터 로드 실패:', error);
      Alert.alert('오류', '기프티콘 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 화면 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      fetchGifticons();
    }, [])
  );

  const handleBackPress = () => {
    router.back();
  };

  // 방 등급에 따른 기프티콘 정보 가져오기
  const getGifticonInfo = (grade: string) => {
    return (
      roomTypes.find((room) => room.id === grade.toLowerCase()) || roomTypes[0]
    );
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    try {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}.${month}.${day}`;
    } catch (error) {
      return dateStr;
    }
  };

  // 기프티콘 카드 컴포넌트
  const GifticonCard = ({ gifticon }: { gifticon: GifticonItem }) => {
    const gifticonInfo = getGifticonInfo(gifticon.grade);
    const expirationDate = formatDate(gifticon.expirationDateStr);

    return (
      <View style={styles.gifticonCard}>
        <View style={styles.gifticonHeader}>
          <View style={styles.brandLogo}>
            <Image source={gifticonInfo.logo} style={styles.brandLogoImage} />
          </View>
          <View style={styles.gifticonInfo}>
            <Text style={styles.itemName}>
              {gifticonInfo.benefit.split(' ')[0]}{' '}
              {gifticonInfo.benefit.split(' ')[1]}
            </Text>
            <Text style={styles.itemDetails}>{gifticonInfo.benefit}</Text>
          </View>
        </View>

        <View style={styles.gifticonDates}>
          <Text style={styles.dateText}>
            받은 날짜: {formatDate('20240908')}
          </Text>
          <Text style={styles.dateText}>유효기간: {expirationDate}</Text>
        </View>

        <View style={styles.barcodeContainer}>
          <Text style={styles.barcodeText}>바코드: {gifticon.code}</Text>
        </View>

        <TouchableOpacity style={styles.useButton}>
          <Text style={styles.useButtonText}>사용하기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 상단 네비게이션 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 기프티콘</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 기프티콘 목록 */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>기프티콘을 불러오는 중...</Text>
          </View>
        ) : gifticons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="gift-outline" size={64} color="#666666" />
            <Text style={styles.emptyTitle}>보유한 기프티콘이 없습니다</Text>
          </View>
        ) : (
          gifticons.map((gifticon, index) => (
            <GifticonCard
              key={`${gifticon.code}-${index}`}
              gifticon={gifticon}
            />
          ))
        )}
      </ScrollView>

      {/* 하단 안내 메시지 */}
      {gifticons.length > 0 && (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            팀플 벌칙으로 받은 기프티콘입니다. 바코드를 매장에서 제시하여
            사용하세요.
          </Text>
        </View>
      )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  gifticonCard: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  gifticonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandLogoImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  gifticonInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  gifticonDates: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 2,
  },
  barcodeContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  barcodeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  useButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121216',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },
  footerText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
  },
});
