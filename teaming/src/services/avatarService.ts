import apiClient from './api';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * 아바타 업로드 관련 타입 정의
 */
export interface AvatarUploadIntentRequest {
  contentType: string;
  byteSize: number;
  ownerType: 'USER' | 'ROOM';
}

export interface AvatarUploadIntentResponse {
  key: string;
  bucket: string;
  url: string;
  requiredHeaders: {
    [key: string]: string;
  };
}

export interface AvatarUploadCompleteRequest {
  key: string;
  width: number;
  height: number;
  ownerType: 'USER' | 'ROOM';
}

export interface AvatarUploadCompleteResponse {
  avatarKey: string;
  avatarVersion: number;
  publicUrl: string;
}

/**
 * 아바타 업로드 서비스
 * S3 업로드를 위한 3단계 프로세스 구현
 */
export class AvatarService {
  /**
   * 2단계: 아바타 업로드 의도 등록 (Presigned PUT URL 발급)
   * @param fileInfo 파일 정보
   * @returns Presigned URL과 key
   */
  static async getUploadIntent(
    fileInfo: AvatarUploadIntentRequest
  ): Promise<AvatarUploadIntentResponse> {
    try {
      console.log('🚀 아바타 업로드 의도 등록:', fileInfo);

      const response = await apiClient.post<AvatarUploadIntentResponse>(
        '/users/me/avatar/intent',
        fileInfo
      );

      console.log('✅ 아바타 업로드 의도 등록 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 아바타 업로드 의도 등록 실패:', error);
      throw error;
    }
  }

  /**
   * 3단계: S3에 실제 파일 업로드
   * @param presignedUrl Presigned PUT URL
   * @param fileUri 로컬 파일 URI
   * @param contentType 파일 타입
   * @param requiredHeaders 필요한 헤더들
   * @returns 업로드 성공 여부
   */
  static async uploadToS3(
    presignedUrl: string,
    fileUri: string,
    contentType: string,
    requiredHeaders: { [key: string]: string }
  ): Promise<boolean> {
    try {
      console.log('🚀 S3 아바타 업로드 시작:', {
        presignedUrl,
        fileUri,
        contentType,
        requiredHeaders,
      });

      // 파일을 Blob으로 변환
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // S3에 PUT 요청 (필요한 헤더들 포함)
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': contentType,
          ...requiredHeaders,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
      }

      console.log('✅ S3 아바타 업로드 성공');
      return true;
    } catch (error: any) {
      console.error('❌ S3 아바타 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 4단계: 아바타 업로드 완료 확인
   * @param key S3 파일 키
   * @param width 이미지 너비
   * @param height 이미지 높이
   * @param ownerType 소유자 타입
   * @returns 아바타 정보
   */
  static async completeUpload(
    key: string,
    width: number,
    height: number,
    ownerType: 'USER' | 'ROOM'
  ): Promise<AvatarUploadCompleteResponse> {
    try {
      console.log('🚀 아바타 업로드 완료 확인:', { key, width, height });

      const response = await apiClient.post<AvatarUploadCompleteResponse>(
        '/users/me/avatar/complete',
        { key, width, height, ownerType }
      );

      console.log('✅ 아바타 업로드 완료 확인 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 아바타 업로드 완료 확인 실패:', error);
      throw error;
    }
  }

  /**
   * 이미지 크기 조정 및 최적화
   * @param imageUri 원본 이미지 URI
   * @returns 최적화된 이미지 정보
   */
  static async optimizeImage(imageUri: string): Promise<{
    uri: string;
    width: number;
    height: number;
    size: number;
  }> {
    try {
      console.log('🚀 이미지 최적화 시작:', imageUri);

      // 이미지 크기 조정 (최대 512x512)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 512, height: 512 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // 파일 크기 계산
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();
      const size = blob.size;

      console.log('✅ 이미지 최적화 완료:', {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        size,
      });

      return {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        size,
      };
    } catch (error) {
      console.error('❌ 이미지 최적화 실패:', error);
      throw error;
    }
  }

  /**
   * 전체 아바타 업로드 프로세스 (4단계 통합)
   * @param imageUri 로컬 이미지 URI
   * @param ownerType 소유자 타입 (USER: 사용자 아바타, ROOM: 채팅방 이미지)
   * @returns 아바타 정보
   */
  static async uploadAvatar(
    imageUri: string,
    ownerType: 'USER' | 'ROOM' = 'USER'
  ): Promise<AvatarUploadCompleteResponse> {
    try {
      console.log('🚀 아바타 업로드 프로세스 시작:', imageUri);

      // 이미지 최적화
      const optimizedImage = await this.optimizeImage(imageUri);

      // 1단계: 업로드 의도 등록
      const intentResponse = await this.getUploadIntent({
        contentType: 'image/jpeg',
        byteSize: optimizedImage.size,
        ownerType: ownerType,
      });

      console.log(
        '🔍 서버에서 받은 requiredHeaders:',
        intentResponse.requiredHeaders
      );

      // 2단계: S3에 파일 업로드
      await this.uploadToS3(
        intentResponse.url,
        optimizedImage.uri,
        'image/jpeg',
        intentResponse.requiredHeaders
      );

      // 3단계: 업로드 완료 확인
      const completeResponse = await this.completeUpload(
        intentResponse.key,
        optimizedImage.width,
        optimizedImage.height,
        ownerType
      );

      console.log('✅ 아바타 업로드 프로세스 완료:', completeResponse);
      return completeResponse;
    } catch (error: any) {
      console.error('❌ 아바타 업로드 프로세스 실패:', error);
      throw error;
    }
  }
}
