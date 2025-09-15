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
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TeamMember {
  id: number;
  name: string;
  avatar: any;
  isSelected: boolean;
}

export default function CreateTaskScreen() {
  const [taskTitle, setTaskTitle] = useState('자료조사 2명 과제부여');
  const [taskDescription, setTaskDescription] = useState(
    '자료조사를 하겠다고 한 2명에게 과제를 부여합니다.\n제한시간에 맞춰서 과제 제출해주시면 감사하겠습니다.'
  );
  const [selectedMonth, setSelectedMonth] = useState('09');
  const [selectedDay, setSelectedDay] = useState('07');
  const [selectedTime, setSelectedTime] = useState('07:00');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 1,
      name: '권민석',
      avatar: require('../../../assets/images/(chattingRoom)/me.png'),
      isSelected: false,
    },
    {
      id: 2,
      name: '정치학존잘남',
      avatar: require('../../../assets/images/(chattingRoom)/politicMan.png'),
      isSelected: false,
    },
    {
      id: 3,
      name: '팀플하기싫다',
      avatar: require('../../../assets/images/(chattingRoom)/noTeample.png'),
      isSelected: false,
    },
  ]);

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

  const handleCreateTask = () => {
    console.log('과제 생성하기');
    // TODO: 과제 생성 API 호출
    router.back();
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
      </ScrollView>

      {/* 과제 생성 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTask}
        >
          <Text style={styles.createButtonText}>과제 생성</Text>
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
    backgroundColor: '#1A1A1A',
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
});
