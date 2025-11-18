import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { sendEmailCode, verifyEmailCode } from '../../src/services/emailAuth';
import { signUp, SignUpRequest } from '../../src/services/api';
import { saveTokens } from '../../src/services/tokenManager';
import { AvatarService } from '../../src/services/avatarService';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadComplete, setAvatarUploadComplete] = useState(false);

  const totalSteps = 6;

  // 완료 화면에서 아바타 업로드 처리
  const handleAvatarUpload = useCallback(async () => {
    if (!profileImage || avatarUploadComplete || isUploadingAvatar) return;

    try {
      setIsUploadingAvatar(true);
      console.log('🚀 완료 화면에서 프로필 이미지 S3 업로드 시작');

      const avatarResult = await AvatarService.uploadAvatar(profileImage);
      console.log('✅ 프로필 이미지 S3 업로드 완료:', avatarResult);

      setAvatarUploadComplete(true);
    } catch (uploadError) {
      console.error('❌ 프로필 이미지 업로드 실패:', uploadError);
      // 업로드 실패해도 사용자 경험을 해치지 않음
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [profileImage, avatarUploadComplete, isUploadingAvatar]);

  // 완료 화면에서 아바타 업로드 자동 시작 (한 번만 실행)
  useEffect(() => {
    if (
      currentStep === 6 &&
      profileImage &&
      !avatarUploadComplete &&
      !isUploadingAvatar
    ) {
      handleAvatarUpload();
    }
  }, [currentStep]); // currentStep만 의존성으로 설정

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      // 마지막 단계에서 회원가입 API 호출
      if (currentStep === 5) {
        await handleSignUp();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleSignUp = async () => {
    try {
      setIsSigningUp(true);

      // 먼저 기본 아바타로 회원가입
      const signUpData: SignUpRequest = {
        email,
        password,
        name: nickname,
        avatarKey: 'default_avatar',
        avatarVersion: 0,
      };

      console.log('회원가입 데이터:', signUpData);

      const response = await signUp(signUpData);

      // 토큰 저장
      await saveTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        loginType: 'email',
      });

      console.log('회원가입 성공, 토큰 저장 완료');

      // 다음 단계로 이동 (완료 화면)
      setCurrentStep(6);
    } catch (error: any) {
      console.error('회원가입 실패:', error);

      let errorMessage = '회원가입 중 오류가 발생했습니다.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = '입력한 정보를 다시 확인해주세요.';
      } else if (error.response?.status === 409) {
        errorMessage = '이미 가입된 이메일입니다.';
      }

      Alert.alert('회원가입 실패', errorMessage);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
  };

  const handleSendVerification = async () => {
    if (!isEmailValid) return;

    try {
      setIsSendingCode(true);
      const result = await sendEmailCode(email, false); // 신규 가입이므로 false

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
      const result = await verifyEmailCode(email, verificationCode);

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

  const handleSelectImage = async () => {
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

  const isEmailValid = email.includes('@') && email.includes('.');
  const isVerificationCodeValid = verificationCode.length >= 4;

  // 비밀번호 조건 검사 함수들
  const isValidLengthAndComposition = (pwd: string) => {
    return (
      pwd.length >= 8 &&
      /[A-Za-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[^A-Za-z0-9]/.test(pwd)
    );
  };

  const containsSequential = (text: string) => {
    const chars = Array.from(text).map((char) => char.charCodeAt(0));
    if (chars.length < 3) return false;

    for (let i = 0; i < chars.length - 2; i++) {
      if (chars[i] + 1 === chars[i + 1] && chars[i + 1] + 1 === chars[i + 2]) {
        return true;
      }
    }
    return false;
  };

  const containsRepeated = (text: string) => {
    const chars = Array.from(text);
    if (chars.length < 3) return false;

    for (let i = 0; i < chars.length - 2; i++) {
      if (chars[i] === chars[i + 1] && chars[i] === chars[i + 2]) {
        return true;
      }
    }
    return false;
  };

  const isNotSequentialOrRepeated = (pwd: string) => {
    return !containsSequential(pwd) && !containsRepeated(pwd);
  };

  const isNotEmailLike = (pwd: string) => {
    return !pwd.includes('@');
  };

  const isPasswordValid = (pwd: string) => {
    return (
      pwd.length >= 8 &&
      /[A-Za-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[^A-Za-z0-9]/.test(pwd) &&
      !pwd.includes('@') &&
      !containsSequential(pwd) &&
      !containsRepeated(pwd)
    );
  };

  const isPasswordMatch = password === confirmPassword && password.length > 0;
  const isNicknameValid = nickname.length >= 2 && nickname.length <= 12;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // 환영 화면
      case 2:
        return isEmailValid && isEmailVerified; // 이메일 인증 완료
      case 3:
        return isPasswordValid(password) && isPasswordMatch; // 비밀번호 설정
      case 4:
        return isNicknameValid; // 닉네임 설정
      case 5:
        return true; // 프로필 사진 (선택사항)
      case 6:
        return false; // 완료 화면 (버튼 비활성화)
      default:
        return false;
    }
  };

  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View key={index} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                {
                  backgroundColor: index < currentStep ? '#39359F' : '#FFFFFF',
                },
              ]}
            />
            {index < totalSteps - 1 && (
              <View
                style={[
                  styles.progressLine,
                  {
                    backgroundColor:
                      index < currentStep - 1 ? '#39359F' : '#333333',
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderWelcomeCard = () => (
    <View style={styles.card}>
      {renderProgressIndicator()}
      <Text style={styles.cardTitle}>Teaming에 오신 것을 환영합니다!</Text>
      <Text style={styles.cardDescription}>
        간단한 회원가입을 통해 회원가입을 완료해보세요.
      </Text>
      <View style={styles.stepsList}>
        <Text style={styles.stepItem}>✓ 이메일 인증</Text>
        <Text style={styles.stepItem}>✓ 비밀번호 설정</Text>
        <Text style={styles.stepItem}>✓ 닉네임 설정</Text>
        <Text style={styles.stepItem}>✓ 프로필 사진(선택사항)</Text>
      </View>
    </View>
  );

  const renderEmailVerificationCard = () => (
    <View style={styles.card}>
      {renderProgressIndicator()}
      <Text style={styles.cardTitle}>이메일 인증</Text>
      <Text style={styles.cardDescription}>
        사용하실 이메일 주소를 입력해주세요.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="example@gmail.com"
        placeholderTextColor="#888888"
        value={email}
        onChangeText={handleEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[
          styles.verificationButton,
          {
            backgroundColor:
              isEmailValid && !isSendingCode ? '#39359F' : '#333333',
          },
        ]}
        onPress={handleSendVerification}
        disabled={!isEmailValid || isSendingCode}
      >
        {isSendingCode ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.verificationButtonText}>인증번호 발송</Text>
        )}
      </TouchableOpacity>

      {isEmailValid && (
        <View style={styles.verificationCodeContainer}>
          <TextInput
            style={styles.input}
            placeholder="인증번호 입력"
            placeholderTextColor="#888888"
            value={verificationCode}
            onChangeText={setVerificationCode}
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
              <Text style={styles.verifyButtonText}>인증 확인</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isEmailVerified && (
        <Text style={styles.verificationSuccessText}>
          ✓ 이메일 인증이 완료되었습니다.
        </Text>
      )}
    </View>
  );

  const renderPasswordCard = () => (
    <View style={styles.card}>
      {renderProgressIndicator()}
      <Text style={styles.cardTitle}>비밀번호 설정</Text>
      <Text style={styles.cardDescription}>
        안전한 비밀번호를 설정해주세요.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="비밀번호 (8자 이상)"
        placeholderTextColor="#888888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호 재확인"
        placeholderTextColor="#888888"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <View style={styles.passwordRequirements}>
        <Text
          style={[
            styles.requirementItem,
            {
              color: isValidLengthAndComposition(password)
                ? '#FFFFFF'
                : '#CCCCCC',
            },
          ]}
        >
          ✓ 영문, 숫자, 특수문자 포함 8자 이상
        </Text>
        <Text
          style={[
            styles.requirementItem,
            {
              color: isNotSequentialOrRepeated(password)
                ? '#FFFFFF'
                : '#CCCCCC',
            },
          ]}
        >
          ✓ 연속문자 불가
        </Text>
        <Text
          style={[
            styles.requirementItem,
            { color: isNotEmailLike(password) ? '#FFFFFF' : '#CCCCCC' },
          ]}
        >
          ✓ 이메일(아이디) 불가
        </Text>
      </View>
    </View>
  );

  const renderNicknameCard = () => (
    <View style={styles.card}>
      {renderProgressIndicator()}
      <Text style={styles.cardTitle}>닉네임 설정</Text>
      <Text style={styles.cardDescription}>
        팀원이 알아볼 수 있게 해주세요!
      </Text>

      <TextInput
        style={styles.input}
        placeholder="닉네임 입력"
        placeholderTextColor="#888888"
        value={nickname}
        onChangeText={setNickname}
        maxLength={12}
      />

      <View style={styles.nicknameRequirements}>
        <Text
          style={[
            styles.requirementItem,
            { color: isNicknameValid ? '#FFFFFF' : '#CCCCCC' },
          ]}
        >
          ✓ 2~12자로 입력해주세요
        </Text>
        <Text
          style={[
            styles.requirementItem,
            { color: isNicknameValid ? '#FFFFFF' : '#CCCCCC' },
          ]}
        >
          ✓ 한글 영문 숫자 가능합니다.
        </Text>
      </View>
    </View>
  );

  const renderProfileCard = () => (
    <View style={styles.card}>
      {renderProgressIndicator()}
      <Text style={styles.cardTitle}>프로필 사진</Text>
      <Text style={styles.cardDescription}>
        프로필에 사용할 사진을 선택해주세요.
      </Text>

      <View style={styles.profileImageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Image
              source={require('../../assets/images/(register)/person.png')}
              style={styles.profileImageIcon}
            />
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.selectImageButton}
          onPress={handleSelectImage}
        >
          <Text style={styles.selectImageButtonText}>
            {profileImage ? '사진 변경하기' : '사진 선택하기'}
          </Text>
        </TouchableOpacity>

        {profileImage && (
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setProfileImage(null)}
          >
            <Text style={styles.removeImageButtonText}>사진 제거</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.optionalText}>
        💡 사진은 선택사항입니다. 프로필 사진은 추후에 설정 가능합니다.
      </Text>
    </View>
  );

  const renderCompletionCard = () => (
    <View style={styles.completionCard}>
      {renderProgressIndicator()}
      <View style={styles.completionIcon}>
        <Image
          source={require('../../assets/images/(register)/boom.png')}
          style={styles.completionImage}
        />
      </View>
      <Text style={styles.completionTitle}>회원가입 완료!</Text>
      <Text style={styles.completionMessage}>
        새로운 회원님, Teaming에 가입해주셔서 감사합니다!
      </Text>

      {/* 아바타 업로드 상태 표시 */}
      {profileImage && (
        <View style={styles.avatarUploadStatus}>
          {isUploadingAvatar && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#514EAC" />
              <Text style={styles.uploadingText}>
                프로필 이미지 업로드 중...
              </Text>
            </View>
          )}
          {avatarUploadComplete && (
            <Text style={styles.uploadCompleteText}>
              ✅ 프로필 이미지 업로드 완료!
            </Text>
          )}
        </View>
      )}

      <Text style={styles.completionSubMessage}>
        이제 모든 기능을 이용하실 수 있습니다.
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => {
          console.log('시작하기 버튼 눌림');
          Alert.alert('시작하기 버튼 눌림');
          router.replace('/(tabs)');
        }}
      >
        <Text style={styles.startButtonText}>시작하기</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentCard = () => {
    switch (currentStep) {
      case 1:
        return renderWelcomeCard();
      case 2:
        return renderEmailVerificationCard();
      case 3:
        return renderPasswordCard();
      case 4:
        return renderNicknameCard();
      case 5:
        return renderProfileCard();
      case 6:
        return renderCompletionCard();
      default:
        return renderWelcomeCard();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <View style={styles.headerSection}>
          {currentStep === 1 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          <Text style={styles.title}>회원가입</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 메인 카드 */}
        {renderCurrentCard()}

        {/* 네비게이션 버튼 */}
        {currentStep < totalSteps && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={styles.previousButton}
              onPress={() => {
                console.log('이전 버튼 눌림');
                Alert.alert('이전 버튼 눌림');
                handlePrevious();
              }}
              disabled={currentStep === 1}
            >
              <Text
                style={[
                  styles.previousButtonText,
                  { color: currentStep === 1 ? '#666666' : '#FFFFFF' },
                ]}
              >
                이전
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextButton,
                {
                  backgroundColor:
                    canProceed() && !isSigningUp ? '#39359F' : '#333333',
                },
              ]}
              onPress={() => {
                console.log('다음 버튼 눌림');
                Alert.alert('다음 버튼 눌림');
                handleNext();
              }}
              disabled={!canProceed() || isSigningUp}
            >
              {isSigningUp ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.nextButtonText}>
                  {currentStep === totalSteps ? '완료' : '다음'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // 헤더 섹션
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 0,
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },

  // 진행 표시기
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    width: 20,
    height: 2,
    marginHorizontal: 4,
  },

  // 카드 스타일
  card: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 24,
    marginBottom: 30,
    minHeight: 300,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // 환영 화면
  stepsList: {
    marginTop: 20,
  },
  stepItem: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },

  // 입력 필드
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
  },

  // 인증번호 발송 버튼
  verificationButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  verificationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 인증코드 컨테이너
  verificationCodeContainer: {
    marginBottom: 16,
  },
  verifyButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verificationSuccessText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
  },

  // 비밀번호 요구사항
  passwordRequirements: {
    marginTop: 8,
  },
  nicknameRequirements: {
    marginTop: 8,
  },
  requirementItem: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },

  // 프로필 사진
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  profileImageIcon: {
    width: 60,
    height: 60,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  selectImageButton: {
    backgroundColor: '#514EAC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectImageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeImageButton: {
    backgroundColor: '#666666',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  removeImageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionalText: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },

  // 완료 화면
  completionCard: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 24,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  completionIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  completionImage: {
    width: 80,
    height: 80,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  completionMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  completionSubMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  // 네비게이션 버튼
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previousButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 80,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  startButton: {
    backgroundColor: '#39359F',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 아바타 업로드 상태 스타일
  avatarUploadStatus: {
    marginVertical: 16,
    alignItems: 'center',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#514EAC',
  },
  uploadingText: {
    fontSize: 14,
    color: '#514EAC',
    marginLeft: 8,
    fontWeight: '500',
  },
  uploadCompleteText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
});
