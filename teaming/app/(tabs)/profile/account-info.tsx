import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function AccountInfoScreen() {
  const [email, setEmail] = useState('minseok1582@daum.net');
  const [nickname, setNickname] = useState('권민석');
  const [profileImage, setProfileImage] = useState<string | any>(
    require('../../../assets/images/(chattingRoom)/me.png')
  );

  const handleBackPress = () => {
    router.back();
  };

  const handleChangeProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        allowsMultipleSelection: false, // 한 장만 선택 가능
      });

      if (!result.canceled && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  const handleChangeEmail = () => {
    Alert.alert('이메일 변경', '이메일 변경 기능은 준비 중입니다.');
  };

  const handleChangePassword = () => {
    router.push('/(tabs)/profile/change-password');
  };

  const handleChangeNickname = () => {
    Alert.alert('닉네임 변경', '닉네임 변경 기능은 준비 중입니다.');
  };

  const handleSave = () => {
    Alert.alert('저장', '계정정보가 저장되었습니다.');
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계정정보 변경</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 사진 변경 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필 사진 변경</Text>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleChangeProfileImage}
          >
            <Image
              source={
                typeof profileImage === 'string'
                  ? { uri: profileImage }
                  : profileImage
              }
              style={styles.profileImage}
            />
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="#000000" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 이메일 */}
        <View style={styles.section}>
          <Text style={styles.label}>
            이메일(아이디) <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일을 입력하세요"
              placeholderTextColor="#666666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleChangeEmail}
            >
              <Text style={styles.changeButtonText}>이메일 변경</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 비밀번호 */}
        <View style={styles.section}>
          <Text style={styles.label}>비밀번호</Text>
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={handleChangePassword}
          >
            <Text style={styles.passwordButtonText}>비밀번호 변경하기</Text>
          </TouchableOpacity>
        </View>

        {/* 닉네임 */}
        <View style={styles.section}>
          <Text style={styles.label}>닉네임</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor="#666666"
            />
            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleChangeNickname}
            >
              <Text style={styles.changeButtonText}>닉네임 변경</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장하기</Text>
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    position: 'relative',
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  required: {
    color: '#FF3B30',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
    paddingVertical: 8,
  },
  changeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  passwordButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  passwordButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#000000',
  },
  saveButton: {
    backgroundColor: '#CCCCCC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
