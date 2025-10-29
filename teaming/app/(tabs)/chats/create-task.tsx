import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TaskService } from '@/src/services/taskService';
import { CreateTaskRequest } from '@/src/types/task';
import { getUserInfo } from '@/src/services/api';

const { width } = Dimensions.get('window');

interface TeamMember {
  id: number;
  name: string;
  avatar: any;
  isSelected: boolean;
}

export default function CreateTaskScreen() {
  const { roomId, members } = useLocalSearchParams<{
    roomId: string;
    members?: string;
  }>();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('09');
  const [selectedDay, setSelectedDay] = useState('07');
  const [selectedTime, setSelectedTime] = useState('07:00');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // 현재 사용자 정보 로드
  useEffect(() => {
    const loadCurrentUserInfo = async () => {
      try {
        const userInfo = await getUserInfo();
        setCurrentUserName(userInfo.name);
        console.log('👤 create-task 현재 사용자 정보:', userInfo);
      } catch (error) {
        console.error('❌ 현재 사용자 정보 로드 실패:', error);
      }
    };

    loadCurrentUserInfo();
  }, []);

  // 팀 멤버 정보 로드 (상단메뉴에서 전달받은 정보만 사용)
  useEffect(() => {
    const loadTeamMembers = () => {
      if (!roomId) return;

      try {
        setIsLoading(true);

        // 1. 먼저 전달받은 members 정보가 있는지 확인
        if (members && members.trim() !== '') {
          try {
            const membersData = JSON.parse(decodeURIComponent(members));
            console.log('📋 과제 생성 - 파싱된 members 데이터:', membersData);

            if (Array.isArray(membersData) && membersData.length > 0) {
              const teamMembersData: TeamMember[] = membersData.map(
                (member: any) => ({
                  id: member.memberId,
                  name:
                    member.roomRole === 'LEADER'
                      ? `${member.name}(팀장)`
                      : member.name,
                  avatar: member.avatarUrl
                    ? { uri: member.avatarUrl }
                    : member.avatarKey
                    ? { uri: member.avatarKey }
                    : getDefaultAvatar(member.memberId),
                  isSelected: false,
                })
              );
              setTeamMembers(teamMembersData);
              console.log(
                '✅ 과제 생성 - 팀 멤버 데이터 설정 완료:',
                teamMembersData
              );
              setIsLoading(false);
              return;
            } else {
              console.warn('⚠️ members 데이터가 빈 배열이거나 유효하지 않음');
              throw new Error('Invalid members data');
            }
          } catch (parseError) {
            console.error('❌ members 파싱 실패:', parseError);
            console.log('🔄 기본 멤버 정보로 폴백');
            // 기본 멤버 정보 사용하도록 계속 진행
          }
        } else {
          console.warn('⚠️ members 파라미터가 없거나 비어있음');
        }

        // 2. members 정보가 없는 경우 기본 멤버 정보 사용
        console.warn('⚠️ members 정보가 없음 - 기본 멤버 정보 사용');
        setTeamMembers([
          {
            id: 1,
            name: '최순조(팀장)',
            avatar: require('../../../assets/images/(chattingRoom)/choi.png'),
            isSelected: false,
          },
          {
            id: 2,
            name: '권민석',
            avatar: require('../../../assets/images/(chattingRoom)/me.png'),
            isSelected: false,
          },
          {
            id: 3,
            name: '정치학존잘남',
            avatar: require('../../../assets/images/(chattingRoom)/politicMan.png'),
            isSelected: false,
          },
          {
            id: 4,
            name: '팀플하기싫다',
            avatar: require('../../../assets/images/(chattingRoom)/noTeample.png'),
            isSelected: false,
          },
        ]);
      } catch (error) {
        console.error('❌ 팀 정보 로드 실패:', error);
        // 에러 발생 시 기본 멤버 정보 사용
        setTeamMembers([
          {
            id: 1,
            name: '최순조(팀장)',
            avatar: require('../../../assets/images/(chattingRoom)/choi.png'),
            isSelected: false,
          },
          {
            id: 2,
            name: '권민석',
            avatar: require('../../../assets/images/(chattingRoom)/me.png'),
            isSelected: false,
          },
          {
            id: 3,
            name: '정치학존잘남',
            avatar: require('../../../assets/images/(chattingRoom)/politicMan.png'),
            isSelected: false,
          },
          {
            id: 4,
            name: '팀플하기싫다',
            avatar: require('../../../assets/images/(chattingRoom)/noTeample.png'),
            isSelected: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamMembers();
  }, [roomId, members]);

  // 기본 아바타 매핑 함수
  const getDefaultAvatar = (memberId: number) => {
    const avatars = [
      require('../../../assets/images/(chattingRoom)/choi.png'),
      require('../../../assets/images/(chattingRoom)/me.png'),
      require('../../../assets/images/(chattingRoom)/politicMan.png'),
      require('../../../assets/images/(chattingRoom)/noTeample.png'),
    ];
    return avatars[memberId % avatars.length];
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleMemberToggle = (memberId: number) => {
    setTeamMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? { ...member, isSelected: !member.isSelected }
          : member
      )
    );
  };

  const handleCreateTask = async () => {
    // roomId 검증
    if (!roomId) {
      Alert.alert('오류', '채팅방 정보를 찾을 수 없습니다.');
      return;
    }

    const roomIdNumber = Number(roomId);
    if (isNaN(roomIdNumber)) {
      Alert.alert('오류', '유효하지 않은 채팅방 ID입니다.');
      return;
    }

    // 입력값 검증
    if (!taskTitle.trim()) {
      Alert.alert('오류', '과제 제목을 입력해주세요.');
      return;
    }

    if (!taskDescription.trim()) {
      Alert.alert('오류', '과제 설명을 입력해주세요.');
      return;
    }

    const selectedMembers = teamMembers.filter((member) => member.isSelected);
    if (selectedMembers.length === 0) {
      Alert.alert('오류', '과제를 할당할 팀원을 선택해주세요.');
      return;
    }

    try {
      setIsCreating(true);

      // 날짜/시간을 ISO 8601 형식으로 변환
      const dueDate = new Date();
      dueDate.setFullYear(2025);
      dueDate.setMonth(parseInt(selectedMonth) - 1);
      dueDate.setDate(parseInt(selectedDay));
      dueDate.setHours(parseInt(selectedTime.split(':')[0]));
      dueDate.setMinutes(parseInt(selectedTime.split(':')[1]));
      dueDate.setSeconds(0);
      dueDate.setMilliseconds(0);

      const taskData: CreateTaskRequest = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        assignedMemberIds: selectedMembers.map((member) => member.id),
        due: TaskService.formatDateToISO(dueDate),
      };

      console.log('🚀 과제 생성 요청:', taskData);
      console.log('🚀 roomId:', roomId, 'roomIdNumber:', roomIdNumber);

      const response = await TaskService.createTask(roomIdNumber, taskData);

      console.log('✅ 과제 생성 성공:', response);

      Alert.alert(
        '과제 생성 완료',
        `"${taskTitle}" 과제가 성공적으로 생성되었습니다.`,
        [
          {
            text: '확인',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ 과제 생성 실패:', error);
      Alert.alert(
        '과제 생성 실패',
        `과제 생성 중 오류가 발생했습니다.\n${
          error.message || '알 수 없는 오류'
        }`
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setShowMonthPicker(false);
  };

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
    setShowDayPicker(false);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowTimePicker(false);
  };

  const monthOptions = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
  ];
  const dayOptions = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );
  const timeOptions = Array.from(
    { length: 24 },
    (_, i) => String(i).padStart(2, '0') + ':00'
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>과제 생성하기</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>팀 정보를 불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 과제 제목 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>과제 제목</Text>
            <TextInput
              style={styles.textInput}
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="과제 제목을 입력하세요"
              placeholderTextColor="#666666"
              multiline
            />
          </View>

          {/* 과제 설명 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>과제 설명</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="과제 설명을 입력하세요"
              placeholderTextColor="#666666"
              multiline
              numberOfLines={4}
            />
          </View>
          {/* 제한시간 설정 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>제한시간 설정</Text>
            <View style={styles.timeContainer}>
              <View style={styles.timeRow}>
                <Text style={styles.yearText}>2025</Text>
                <View style={styles.timeSelector}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowMonthPicker(!showMonthPicker)}
                  >
                    <Text style={styles.timeText}>{selectedMonth}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666666" />
                  </TouchableOpacity>
                  <Text style={styles.timeLabel}>월</Text>
                  {showMonthPicker && (
                    <View style={styles.pickerContainer}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {monthOptions.map((month) => (
                          <TouchableOpacity
                            key={month}
                            style={styles.pickerItem}
                            onPress={() => handleMonthSelect(month)}
                          >
                            <Text style={styles.pickerText}>{month}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <View style={styles.timeSelector}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowDayPicker(!showDayPicker)}
                  >
                    <Text style={styles.timeText}>{selectedDay}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666666" />
                  </TouchableOpacity>
                  <Text style={styles.timeLabel}>일</Text>
                  {showDayPicker && (
                    <View style={styles.pickerContainer}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {dayOptions.map((day) => (
                          <TouchableOpacity
                            key={day}
                            style={styles.pickerItem}
                            onPress={() => handleDaySelect(day)}
                          >
                            <Text style={styles.pickerText}>{day}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.timeRow}>
                <View style={styles.timeSelector}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowTimePicker(!showTimePicker)}
                  >
                    <Text style={styles.timeText}>{selectedTime}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666666" />
                  </TouchableOpacity>
                  <Text style={styles.timeLabel}>시간</Text>
                  {showTimePicker && (
                    <View style={styles.pickerContainer}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {timeOptions.map((time) => (
                          <TouchableOpacity
                            key={time}
                            style={styles.pickerItem}
                            onPress={() => handleTimeSelect(time)}
                          >
                            <Text style={styles.pickerText}>{time}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
          {/* 팀원 역할부여 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>팀원 역할부여</Text>
            {teamMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberItem}
                onPress={() => handleMemberToggle(member.id)}
              >
                <Image source={member.avatar} style={styles.memberAvatar} />
                <Text style={styles.memberName}>{member.name}</Text>
                <View
                  style={[
                    styles.checkbox,
                    member.isSelected && styles.checkboxSelected,
                  ]}
                >
                  {member.isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* 과제 생성 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            isCreating && styles.createButtonDisabled,
          ]}
          onPress={handleCreateTask}
          disabled={isCreating}
        >
          {isCreating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.createButtonText}>생성 중...</Text>
            </View>
          ) : (
            <Text style={styles.createButtonText}>과제 생성</Text>
          )}
        </TouchableOpacity>
      </View>
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
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#121216',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#292929',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#121216',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#292929',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 15,
    marginRight: 12,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeContainer: {
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292929',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  yearText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#333333',
    borderRadius: 8,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292929',
  },
  timeText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 8,
  },
  pickerContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292929',
    maxHeight: 120,
    zIndex: 9999,
    elevation: 5,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },
  pickerText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#000000',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 12,
  },
});
