import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  sendEmailCode,
  verifyEmailCode,
} from '../../../src/services/emailAuth';
import {
  updateEmail,
  getUserInfo,
  UserInfo,
  updateName,
} from '../../../src/services/api';
import {
  getLoginType,
  LoginType,
  getAccessToken,
} from '../../../src/services/tokenManager';
import apiClient from '../../../src/services/api';
import { AvatarService } from '../../../src/services/avatarService';

export default function AccountInfoScreen() {
  const { userInfo: userInfoParam } = useLocalSearchParams<{
    userInfo?: string;
  }>();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState<string | any>(
    require('../../../assets/images/teaminglogo.png')
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  // 이메일 변경 관련 상태
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerificationMode, setIsEmailVerificationMode] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // 사용자 정보 로딩 상태
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

  // 닉네임 변경 관련 상태
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);

  // 로그인 타입 상태
  const [loginType, setLoginType] = useState<LoginType | null>(null);

  // 아바타 URL 가져오기
  const fetchAvatarUrl = async () => {
    try {
      setIsLoadingAvatar(true);
      const userResponse = await apiClient.get('/users/me');
      setAvatarUrl(userResponse.data.avatarUrl);
      console.log(
        '계정정보 화면 아바타 URL 로드:',
        userResponse.data.avatarUrl
      );
    } catch (error) {
      console.error('아바타 URL 가져오기 실패:', error);
      // 에러가 발생해도 기본 이미지 사용
    } finally {
      setIsLoadingAvatar(false);
    }
  };

  // 화면 진입 시 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoadingUserInfo(true);

        let userInfo: UserInfo;

        // 전달받은 사용자 정보가 있으면 사용, 없으면 API 호출
        if (userInfoParam) {
          try {
            userInfo = JSON.parse(userInfoParam);
            console.log('전달받은 사용자 정보 사용:', userInfo);
          } catch (parseError) {
            console.error('사용자 정보 파싱 실패:', parseError);
            userInfo = await getUserInfo();
          }
        } else {
          userInfo = await getUserInfo();
        }

        // 로그인 타입 가져오기
        const currentLoginType = await getLoginType();

        setEmail(userInfo.email);
        setNickname(userInfo.name);
        setLoginType(currentLoginType);

        // 아바타 URL 가져오기
        await fetchAvatarUrl();

        console.log('사용자 정보:', userInfo);
        console.log('로그인 타입:', currentLoginType);
      } catch (error: any) {
        console.error('사용자 정보 가져오기 실패:', error);
        Alert.alert('오류', '사용자 정보를 가져오는데 실패했습니다.');
      } finally {
        setIsLoadingUserInfo(false);
      }
    };

    fetchUserInfo();
  }, [userInfoParam]);

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
        const selectedImageUri = result.assets[0].uri;

        // 이미지 선택 후 즉시 S3에 업로드
        try {
          console.log('🚀 프로필 이미지 S3 업로드 시작');
          const avatarResult = await AvatarService.uploadAvatar(
            selectedImageUri,
            'USER'
          );
          console.log('✅ 프로필 이미지 S3 업로드 완료:', avatarResult);

          // 업로드 성공 시 로컬 상태 업데이트
          setProfileImage(selectedImageUri);

          // 아바타 URL 다시 가져오기
          await fetchAvatarUrl();

          Alert.alert('성공', '프로필 이미지가 업데이트되었습니다.');
        } catch (uploadError) {
          console.error('❌ 프로필 이미지 업로드 실패:', uploadError);
          Alert.alert('업로드 실패', '이미지 업로드 중 오류가 발생했습니다.');
        }
      }
    } catch (error) {
      console.error('❌ 이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  const handleChangeEmail = () => {
    // 이메일 변경 모드로 진입
    setIsEmailVerificationMode(true);
  };

  const handleSendVerificationCode = async () => {
    console.log('인증번호 발송 시도 - 새로운 이메일:', newEmail);
    console.log('이메일 유효성:', isEmailValid(newEmail));

    if (!newEmail.trim()) {
      Alert.alert('입력 오류', '새로운 이메일을 입력해주세요.');
      return;
    }

    if (!isEmailValid(newEmail)) {
      Alert.alert('입력 오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      setIsSendingCode(true);
      const result = await sendEmailCode(newEmail, false); // 이메일 변경이므로 새로운 이메일이므로 false

      if (result.success) {
        Alert.alert('성공', result.message || '인증 코드가 전송되었습니다.');
      } else {
        Alert.alert('오류', result.error || '인증 코드 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 코드 전송 에러:', error);
      Alert.alert('오류', '인증 코드 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) return;

    try {
      setIsVerifyingCode(true);
      const result = await verifyEmailCode(newEmail, verificationCode);

      if (result.success) {
        setIsEmailVerified(true);
        Alert.alert('성공', result.message || '이메일 인증이 완료되었습니다.');
      } else {
        Alert.alert('오류', result.error || '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('인증 코드 확인 에러:', error);
      Alert.alert('오류', '인증 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!isEmailVerified) {
      Alert.alert('인증 필요', '이메일 인증을 먼저 완료해주세요.');
      return;
    }

    try {
      setIsUpdatingEmail(true);

      await updateEmail({ email: newEmail });

      // 성공 시 이메일 업데이트
      setEmail(newEmail);
      setNewEmail('');
      setVerificationCode('');
      setIsEmailVerificationMode(false);
      setIsEmailVerified(false);

      Alert.alert('성공', '이메일이 성공적으로 변경되었습니다.');
    } catch (error: any) {
      console.error('이메일 변경 실패:', error);

      let errorMessage = '이메일 변경 중 오류가 발생했습니다.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = '입력한 이메일을 다시 확인해주세요.';
      } else if (error.response?.status === 409) {
        errorMessage = '이미 사용 중인 이메일입니다.';
      }

      Alert.alert('이메일 변경 실패', errorMessage);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleCancelEmailChange = () => {
    setNewEmail('');
    setVerificationCode('');
    setIsEmailVerificationMode(false);
    setIsEmailVerified(false);
  };

  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 소셜 로그인 사용자를 위한 뷰 렌더링
  const renderSocialLoginView = () => {
    const getSocialProviderInfo = (type: LoginType | null) => {
      switch (type) {
        case 'kakao':
          return {
            name: '카카오',
            icon: '💬',
            color: '#FEE500',
            textColor: '#000000',
          };
        case 'google':
          return {
            name: '구글',
            icon: '🔍',
            color: '#EA4335',
            textColor: '#FFFFFF',
          };
        case 'naver':
          return {
            name: '네이버',
            icon: 'N',
            color: '#03C75A',
            textColor: '#FFFFFF',
          };
        case 'apple':
          return {
            name: '애플',
            icon: '🍎',
            color: '#000000',
            textColor: '#FFFFFF',
          };
        default:
          return {
            name: '소셜',
            icon: '🔗',
            color: '#666666',
            textColor: '#FFFFFF',
          };
      }
    };

    const socialInfo = getSocialProviderInfo(loginType);

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 연결된 SNS 계정 */}
        <View style={styles.section}>
          <Text style={styles.label}>연결된 SNS 계정</Text>
          <View style={styles.socialAccountContainer}>
            <View
              style={[styles.socialIcon, { backgroundColor: socialInfo.color }]}
            >
              <Text
                style={[styles.socialIconText, { color: socialInfo.textColor }]}
              >
                {socialInfo.icon}
              </Text>
            </View>
            <View style={styles.socialInfo}>
              <Text style={styles.socialName}>{socialInfo.name}</Text>
              <Text style={styles.socialStatus}>연결됨</Text>
            </View>
            <View style={styles.connectedIcon}>
              <Ionicons name="link" size={16} color="#4CAF50" />
            </View>
          </View>
        </View>

        {/* 프로필 사진 변경 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필 사진 변경</Text>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleChangeProfileImage}
          >
            {isLoadingAvatar ? (
              <View style={styles.profileImageLoading}>
                <ActivityIndicator size="large" color="#4A90E2" />
              </View>
            ) : (
              <Image
                source={
                  avatarUrl
                    ? { uri: avatarUrl }
                    : typeof profileImage === 'string'
                    ? { uri: profileImage }
                    : profileImage
                }
                style={styles.profileImage}
                onError={() => {
                  console.log('아바타 이미지 로드 실패, 기본 이미지 사용');
                  setAvatarUrl(null);
                }}
              />
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="#000000" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 이메일 (읽기 전용) */}
        <View style={styles.section}>
          <Text style={styles.label}>
            이메일(아이디) <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.readOnlyInputContainer}>
            <Text style={styles.readOnlyText}>{email}</Text>
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyBadgeText}>소셜 계정</Text>
            </View>
          </View>
        </View>

        {/* 닉네임 */}
        <View style={styles.section}>
          <Text style={styles.label}>닉네임 (이름에서 변경)</Text>
          <View style={styles.inputRow}>
            {isLoadingUserInfo ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>
                  사용자 정보를 불러오는 중...
                </Text>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#666666"
              />
            )}
            <TouchableOpacity
              style={[
                styles.changeButton,
                {
                  opacity: isLoadingUserInfo || isUpdatingNickname ? 0.5 : 1,
                  backgroundColor: isUpdatingNickname ? '#333333' : '#FFFFFF',
                },
              ]}
              onPress={handleChangeNickname}
              disabled={isLoadingUserInfo || isUpdatingNickname}
            >
              {isUpdatingNickname ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.changeButtonText,
                    { color: isUpdatingNickname ? '#FFFFFF' : '#000000' },
                  ]}
                >
                  닉네임 변경
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            소셜로그인으로 가입하신 경우, 받아온 이름을 닉네임으로 변경할 수
            있습니다.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const handleChangePassword = () => {
    router.push('/(tabs)/profile/change-password');
  };

  const handleChangeNickname = async () => {
    if (!nickname.trim()) {
      Alert.alert('입력 오류', '닉네임을 입력해주세요.');
      return;
    }

    if (nickname.length < 2 || nickname.length > 12) {
      Alert.alert('입력 오류', '닉네임은 2~12자로 입력해주세요.');
      return;
    }

    try {
      setIsUpdatingNickname(true);

      console.log('updateName 함수 확인:', typeof updateName);
      console.log('닉네임 변경 시도:', nickname.trim());

      await updateName({ name: nickname.trim() });

      Alert.alert('성공', '닉네임이 성공적으로 변경되었습니다.');
    } catch (error: any) {
      console.error('닉네임 변경 실패:', error);

      let errorMessage = '닉네임 변경 중 오류가 발생했습니다.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = '입력한 닉네임을 다시 확인해주세요.';
      } else if (error.response?.status === 409) {
        errorMessage = '이미 사용 중인 닉네임입니다.';
      }

      Alert.alert('닉네임 변경 실패', errorMessage);
    } finally {
      setIsUpdatingNickname(false);
    }
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

      {loginType === 'email' ? (
        <>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* 프로필 사진 변경 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>프로필 사진 변경</Text>
              <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={handleChangeProfileImage}
              >
                {isLoadingAvatar ? (
                  <View style={styles.profileImageLoading}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                  </View>
                ) : (
                  <Image
                    source={
                      avatarUrl
                        ? { uri: avatarUrl }
                        : typeof profileImage === 'string'
                        ? { uri: profileImage }
                        : profileImage
                    }
                    style={styles.profileImage}
                    onError={() => {
                      console.log('아바타 이미지 로드 실패, 기본 이미지 사용');
                      setAvatarUrl(null);
                    }}
                  />
                )}
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

              {/* 현재 이메일 표시 */}
              <View style={styles.inputRow}>
                {isLoadingUserInfo ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.loadingText}>
                      사용자 정보를 불러오는 중...
                    </Text>
                  </View>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="이메일을 입력하세요"
                    placeholderTextColor="#666666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
                <TouchableOpacity
                  style={[
                    styles.changeButton,
                    { opacity: isLoadingUserInfo ? 0.5 : 1 },
                  ]}
                  onPress={handleChangeEmail}
                  disabled={isLoadingUserInfo}
                >
                  <Text style={styles.changeButtonText}>이메일 변경</Text>
                </TouchableOpacity>
              </View>

              {/* 이메일 변경 모드 */}
              {isEmailVerificationMode && (
                <View style={styles.emailChangeContainer}>
                  <Text style={styles.subLabel}>새로운 이메일</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      value={newEmail}
                      onChangeText={setNewEmail}
                      placeholder="새로운 이메일을 입력하세요"
                      placeholderTextColor="#666666"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={[
                        styles.verificationButton,
                        {
                          backgroundColor:
                            isEmailValid(newEmail) && !isSendingCode
                              ? '#39359F'
                              : '#333333',
                        },
                      ]}
                      onPress={handleSendVerificationCode}
                      disabled={!isEmailValid(newEmail) || isSendingCode}
                    >
                      {isSendingCode ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.verificationButtonText}>
                          인증번호 발송
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* 인증번호 입력 */}
                  {isEmailValid(newEmail) && (
                    <View style={styles.verificationCodeContainer}>
                      <Text style={styles.subLabel}>인증번호</Text>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={styles.input}
                          value={verificationCode}
                          onChangeText={setVerificationCode}
                          placeholder="인증번호를 입력하세요"
                          placeholderTextColor="#666666"
                          keyboardType="number-pad"
                        />
                        <TouchableOpacity
                          style={[
                            styles.verifyButton,
                            {
                              backgroundColor:
                                verificationCode.trim() && !isVerifyingCode
                                  ? '#39359F'
                                  : '#333333',
                            },
                          ]}
                          onPress={handleVerifyCode}
                          disabled={!verificationCode.trim() || isVerifyingCode}
                        >
                          {isVerifyingCode ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.verifyButtonText}>
                              인증 확인
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* 인증 완료 후 변경하기 버튼 */}
                  {isEmailVerified && (
                    <View style={styles.updateButtonContainer}>
                      <TouchableOpacity
                        style={[
                          styles.updateButton,
                          {
                            backgroundColor: !isUpdatingEmail
                              ? '#39359F'
                              : '#333333',
                          },
                        ]}
                        onPress={handleUpdateEmail}
                        disabled={isUpdatingEmail}
                      >
                        {isUpdatingEmail ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.updateButtonText}>변경하기</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelEmailChange}
                      >
                        <Text style={styles.cancelButtonText}>취소</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
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
                {isLoadingUserInfo ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.loadingText}>
                      사용자 정보를 불러오는 중...
                    </Text>
                  </View>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="닉네임을 입력하세요"
                    placeholderTextColor="#666666"
                  />
                )}
                <TouchableOpacity
                  style={[
                    styles.changeButton,
                    {
                      opacity:
                        isLoadingUserInfo || isUpdatingNickname ? 0.5 : 1,
                      backgroundColor: isUpdatingNickname
                        ? '#333333'
                        : '#FFFFFF',
                    },
                  ]}
                  onPress={handleChangeNickname}
                  disabled={isLoadingUserInfo || isUpdatingNickname}
                >
                  {isUpdatingNickname ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.changeButtonText,
                        { color: isUpdatingNickname ? '#FFFFFF' : '#000000' },
                      ]}
                    >
                      닉네임 변경
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </>
      ) : (
        renderSocialLoginView()
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

  // 이메일 변경 관련 스타일
  emailChangeContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#121216',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292929',
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  verificationButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  verificationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verificationCodeContainer: {
    marginTop: 16,
  },
  verifyButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  updateButtonContainer: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  updateButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#666666',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 로딩 관련 스타일
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginLeft: 8,
  },

  // 소셜 로그인 관련 스타일
  socialAccountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  socialIconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  socialInfo: {
    flex: 1,
  },
  socialName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  socialStatus: {
    fontSize: 14,
    color: '#4CAF50',
  },
  connectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readOnlyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  readOnlyBadge: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readOnlyBadgeText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    lineHeight: 16,
  },
  profileImageLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
