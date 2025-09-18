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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function CreateTeamScreen() {
  const [roomTitle, setRoomTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [teamCount, setTeamCount] = useState(3);
  const [selectedRoom, setSelectedRoom] = useState('basic');
  const [emails, setEmails] = useState(['', '', '']);
  const [roomImage, setRoomImage] = useState<string | null>(null);

  const handleBackPress = () => {
    router.back();
  };

  const handleCreateRoom = () => {
    console.log('티밍룸 생성하기 버튼 클릭');
    // Modal 닫기
    router.dismiss();
    // 약간의 지연 후 채팅방 목록을 거쳐서 채팅방으로 이동 (팀장으로)
    setTimeout(() => {
      router.push('/(tabs)/chats');
      setTimeout(() => {
        router.push('/(tabs)/chats/chat-room/1?isLeader=true');
      }, 100);
    }, 100);
  };

  const handleSendInvite = (index: number) => {
    console.log(`초대코드 발송: ${emails[index]}`);
  };

  const handleEmailChange = (index: number, text: string) => {
    const newEmails = [...emails];
    newEmails[index] = text;
    setEmails(newEmails);
  };

  const handleSelectRoomImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        allowsMultipleSelection: false, // 한 장만 선택 가능
      });

      if (!result.canceled && result.assets.length > 0) {
        setRoomImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveRoomImage = () => {
    setRoomImage(null);
  };

  // 팀원수에 맞춰 이메일 배열 조정
  React.useEffect(() => {
    const newEmails = [...emails];
    while (newEmails.length < teamCount) {
      newEmails.push('');
    }
    while (newEmails.length > teamCount) {
      newEmails.pop();
    }
    setEmails(newEmails);
  }, [teamCount]);

  const roomTypes = [
    {
      id: 'basic',
      name: 'Basic Room',
      price: '2060',
      benefit: '메가커피 아이스 아메리카노 1개',
      logo: require('../../../assets/images/(makeTeam)/mega.png'),
      color: '#FFFFFF',
    },
    {
      id: 'standard',
      name: 'Standard Room',
      price: '4840',
      benefit: '스타벅스 아이스 아메리카노 1개',
      logo: require('../../../assets/images/(makeTeam)/starbucks.png'),
      color: '#FFFFFF',
    },
    {
      id: 'elite',
      name: 'Elite Room',
      price: '8240',
      benefit: '스타벅스 아이스 아메리카노 1개 + 프렌치 크루아상',
      logo: require('../../../assets/images/(makeTeam)/starbucks.png'),
      color: '#FFD700', // 네온 노란색/밝은 금색
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>팀플 만들기</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 티밍 룸 제목 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>티밍 룸 제목</Text>
          <TextInput
            style={styles.textInput}
            value={roomTitle}
            onChangeText={setRoomTitle}
            placeholder="팀플 제목을 입력해주세요"
            placeholderTextColor="#666666"
          />
        </View>

        {/* 채팅방 이미지 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>채팅방 이미지</Text>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleSelectRoomImage}
          >
            {roomImage ? (
              <Image source={{ uri: roomImage }} style={styles.roomImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color="#666666" />
                <Text style={styles.placeholderText}>이미지 선택</Text>
              </View>
            )}
          </TouchableOpacity>
          {roomImage && (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={handleRemoveRoomImage}
            >
              <Text style={styles.removeImageText}>이미지 제거</Text>
            </TouchableOpacity>
          )}
          {!roomImage && (
            <Text style={styles.imageInfoText}>
              💡 이미지를 선택하지 않을 시 기본 이미지로 생성됩니다.
            </Text>
          )}
        </View>

        {/* 부제목 및 한줄소개 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>부제목 및 한줄소개</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="팀플에 대한 간단한 소개를 입력해주세요"
            placeholderTextColor="#666666"
            multiline
          />
        </View>

        {/* 팀원 수 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>팀원 수</Text>
          <View style={styles.teamCountContainer}>
            <TouchableOpacity
              style={styles.countButton}
              onPress={() => setTeamCount(Math.max(1, teamCount - 1))}
            >
              <Ionicons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.countText}>{teamCount}</Text>
            <TouchableOpacity
              style={styles.countButton}
              onPress={() => setTeamCount(teamCount + 1)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 티밍룸 설정 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>티밍룸 설정</Text>
          <View style={styles.roomCardsContainer}>
            {roomTypes.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  room.id === 'elite'
                    ? styles.eliteRoomCard
                    : room.id === 'standard'
                    ? styles.standardRoomCard
                    : styles.roomCard,
                  selectedRoom === room.id && styles.selectedRoomCard,
                ]}
                onPress={() => setSelectedRoom(room.id)}
              >
                <View style={styles.roomCardContent}>
                  <View style={styles.roomInfo}>
                    <Text
                      style={[
                        styles.roomName,
                        room.id === 'elite' && styles.eliteRoomName,
                        room.id === 'standard' && styles.standardRoomName,
                      ]}
                    >
                      {room.name}
                    </Text>
                    <Text style={styles.roomPrice}>팀원당 {room.price}원</Text>
                    <Text style={styles.roomBenefit}>{room.benefit}</Text>
                  </View>
                  <View style={styles.roomLogo}>
                    <Image source={room.logo} style={styles.roomLogoImage} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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

        {/* 팀원 초대하기 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>팀원 초대하기</Text>
          {emails.slice(0, teamCount).map((email, index) => (
            <View key={index} style={styles.emailContainer}>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={(text) => handleEmailChange(index, text)}
                placeholder="팀원의 이메일을 입력해주세요"
                placeholderTextColor="#666666"
                keyboardType="email-address"
              />
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => handleSendInvite(index)}
              >
                <Text style={styles.inviteButtonText}>초대코드 발송</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 티밍룸 생성하기 버튼 */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateRoom}
        >
          <Text style={styles.createButtonText}>티밍룸 생성하기</Text>
        </TouchableOpacity>
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
  textInput: {
    backgroundColor: '#121216',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292929',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  teamCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 20,
  },
  roomCardsContainer: {
    gap: 12,
  },
  roomCard: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
  },
  eliteRoomCard: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  standardRoomCard: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    padding: 16,
    shadowColor: '#C0C0C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  eliteRoomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700', // 네온 노란색/밝은 금색
    marginBottom: 6,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  standardRoomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C0C0C0', // 네온 은색
    marginBottom: 6,
    textShadowColor: '#C0C0C0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  selectedRoomCard: {
    borderColor: '#4A90E2',
  },
  roomCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  roomPrice: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roomBenefit: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  roomLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  roomLogoImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
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
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailInput: {
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
  inviteButton: {
    backgroundColor: '#007AFF', // 홈화면과 동일한 색상
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#007AFF', // 홈화면과 동일한 색상
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
  },
  roomImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  removeImageButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292929',
  },
  removeImageText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  imageInfoText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
