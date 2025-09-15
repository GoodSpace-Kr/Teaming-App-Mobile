import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FoundRoom {
  id: number;
  title: string;
  subtitle: string;
  members: any;
  memberCount: string;
  roomType: string;
  price: string;
  benefit: string;
}

export default function JoinTeamScreen() {
  const [roomCode, setRoomCode] = useState('');
  const [foundRoom, setFoundRoom] = useState<FoundRoom | null>(null);

  const handleBackPress = () => {
    router.back();
  };

  const handleSearch = () => {
    console.log('찾기 버튼 클릭:', roomCode);
    // TODO: 실제 검색 로직 구현
    // 임시로 더미 데이터 설정
    setFoundRoom({
      id: 1,
      title: '정치학 발표',
      subtitle: '정치학개론',
      members: require('../../../assets/images/(beforeLogin)/bluePeople.png'),
      memberCount: '2/4명',
      roomType: 'Basic Room',
      price: '각 2060원',
      benefit: '메가커피 아이스 아메리카노 1개',
    });
  };

  const handleEnter = () => {
    console.log('입장 버튼 클릭');
    // Modal 닫기
    router.dismiss();
    // 약간의 지연 후 채팅방 목록을 거쳐서 채팅방으로 이동 (팀원으로)
    setTimeout(() => {
      router.push('/(tabs)/chats');
      setTimeout(() => {
        router.push('/(tabs)/chats/chat-room/1?isLeader=false');
      }, 100);
    }, 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>초대코드 입력</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 티밍룸 번호 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>티밍룸 번호</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={roomCode}
              onChangeText={setRoomCode}
              placeholder="티밍룸 번호를 입력해주세요"
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>찾기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 찾은 룸 정보 */}
        {foundRoom && (
          <View style={styles.roomInfoCard}>
            <View style={styles.roomInfoHeader}>
              <Image source={foundRoom.members} style={styles.roomIcon} />
              <View style={styles.roomInfo}>
                <Text style={styles.roomTitle}>{foundRoom.title}</Text>
                <Text style={styles.roomSubtitle}>{foundRoom.subtitle}</Text>
              </View>
              <TouchableOpacity
                style={styles.enterButton}
                onPress={handleEnter}
              >
                <Text style={styles.enterButtonText}>입장</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.roomDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>팀원수 :</Text>
                <Text style={styles.detailValue}>{foundRoom.memberCount}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>방타입 :</Text>
                <Text style={styles.detailValue}>{foundRoom.roomType}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>가격 :</Text>
                <Text style={styles.detailValue}>{foundRoom.price}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>포함 혜택 :</Text>
                <Text style={styles.detailValue}>{foundRoom.benefit}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 정보 박스 */}
        <View style={styles.infoBox}>
          <View style={styles.infoBoxContent}>
            <Image
              source={require('../../../assets/images/(makeTeam)/light.png')}
              style={styles.lightIcon}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>
                방 입장 시, 팀원 수에 따라 해당 기프티콘을 결제해야 합니다.
              </Text>
              <Text style={styles.infoSubtitle}>
                만약 패널티를 받지 않는다면 이용 후 환불됩니다.{'\n'}(일정
                수수료제외)
              </Text>
            </View>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#121216',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  roomInfoCard: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 20,
    marginBottom: 30,
  },
  roomInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  roomIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roomSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  enterButton: {
    backgroundColor: '#121216',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  enterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  roomDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#121216',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
    marginBottom: 30,
  },
  infoBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightIcon: {
    width: 32,
    height: 32,
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
});
