import apiClient from './api';
import {
  FileUploadIntentRequest,
  FileUploadIntentResponse,
  FileUploadCompleteRequest,
  FileUploadCompleteResponse,
  FileDownloadUrlResponse,
  UploadProgress,
  FileItem,
  RoomFileResponse,
} from '@/src/types/file';

/**
 * 파일 업로드 서비스
 * S3 업로드를 위한 3단계 프로세스 구현
 */
export class FileService {
  /**
   * 1단계: 파일 업로드 의도 등록
   * @param roomId 채팅방 ID
   * @param fileInfo 파일 정보
   * @returns Presigned URL과 key
   */
  static async getUploadIntent(
    roomId: number,
    fileInfo: FileUploadIntentRequest
  ): Promise<FileUploadIntentResponse> {
    try {
      console.log('🚀 파일 업로드 의도 등록:', { roomId, fileInfo });

      const response = await apiClient.post<FileUploadIntentResponse>(
        `/files/intent/${roomId}`,
        fileInfo,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ 파일 업로드 의도 등록 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 파일 업로드 의도 등록 실패:', error);
      console.error('에러 상태:', error.response?.status);
      console.error('에러 데이터:', error.response?.data);
      throw error;
    }
  }

  /**
   * 2단계: S3에 실제 파일 업로드
   * @param presignedUrl Presigned PUT URL
   * @param fileUri 로컬 파일 URI
   * @param contentType 파일 타입
   * @param onProgress 업로드 진행률 콜백
   * @returns 업로드 성공 여부
   */
  static async uploadToS3(
    presignedUrl: string,
    fileUri: string,
    contentType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<boolean> {
    try {
      console.log('🚀 S3 파일 업로드 시작:', {
        presignedUrl,
        fileUri,
        contentType,
      });

      // 파일을 Blob으로 변환
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // S3에 PUT 요청 (Content-Type만 포함)
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (!uploadResponse.ok) {
        console.error('❌ S3 업로드 실패 응답:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          headers: Object.fromEntries(uploadResponse.headers.entries()),
        });
        throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
      }

      console.log('✅ S3 파일 업로드 성공');
      return true;
    } catch (error: any) {
      console.error('❌ S3 파일 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 3단계: 파일 업로드 완료 확인
   * @param roomId 채팅방 ID
   * @param key S3 파일 키
   * @returns 파일 ID
   */
  static async completeUpload(
    roomId: number,
    key: string
  ): Promise<FileUploadCompleteResponse> {
    try {
      console.log('🚀 파일 업로드 완료 확인:', { roomId, key });

      const response = await apiClient.post<FileUploadCompleteResponse>(
        `/files/complete/${roomId}`,
        { key },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ 파일 업로드 완료 확인 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 파일 업로드 완료 확인 실패:', error);
      console.error('에러 상태:', error.response?.status);
      console.error('에러 데이터:', error.response?.data);
      throw error;
    }
  }

  /**
   * 파일 다운로드 URL 발급
   * @param fileId 파일 ID
   * @returns 다운로드 URL과 만료시간
   */
  static async getDownloadUrl(
    fileId: number
  ): Promise<FileDownloadUrlResponse> {
    try {
      console.log('🚀 파일 다운로드 URL 발급:', { fileId });

      const response = await apiClient.post<FileDownloadUrlResponse>(
        `/files/download-url/${fileId}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ 파일 다운로드 URL 발급 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 파일 다운로드 URL 발급 실패:', error);
      console.error('에러 상태:', error.response?.status);
      console.error('에러 데이터:', error.response?.data);
      throw error;
    }
  }

  /**
   * 전체 파일 업로드 프로세스 (3단계 통합)
   * @param roomId 채팅방 ID
   * @param fileUri 로컬 파일 URI
   * @param fileName 파일명
   * @param contentType 파일 타입
   * @param fileSize 파일 크기
   * @param onProgress 업로드 진행률 콜백
   * @returns 파일 ID
   */
  static async uploadFile(
    roomId: number,
    fileUri: string,
    fileName: string,
    contentType: string,
    fileSize: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<number> {
    try {
      console.log('🚀 파일 업로드 프로세스 시작:', {
        roomId,
        fileName,
        contentType,
        fileSize,
      });

      // 1단계: 업로드 의도 등록
      const intentResponse = await this.getUploadIntent(roomId, {
        fileName,
        contentType,
        size: fileSize,
      });

      // 2단계: S3에 파일 업로드
      await this.uploadToS3(
        intentResponse.url,
        fileUri,
        contentType,
        onProgress
      );

      // 3단계: 업로드 완료 확인
      const completeResponse = await this.completeUpload(
        roomId,
        intentResponse.key
      );

      console.log('✅ 파일 업로드 프로세스 완료:', completeResponse.fileId);
      return completeResponse.fileId;
    } catch (error: any) {
      console.error('❌ 파일 업로드 프로세스 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 다운로드
   * @param fileId 파일 ID
   * @returns 다운로드 가능한 URL
   */
  static async downloadFile(fileId: number): Promise<string> {
    try {
      console.log('🚀 파일 다운로드 시작:', { fileId });

      const downloadResponse = await this.getDownloadUrl(fileId);

      console.log('✅ 파일 다운로드 URL 획득:', downloadResponse.url);
      return downloadResponse.url;
    } catch (error: any) {
      console.error('❌ 파일 다운로드 실패:', error);
      throw error;
    }
  }

  /**
   * 자료실 파일 목록 조회
   * @param roomId 채팅방 ID
   * @returns 파일 목록
   */
  static async getRoomFiles(roomId: number): Promise<RoomFileResponse[]> {
    try {
      console.log('🚀 자료실 파일 목록 조회:', { roomId });

      const response = await apiClient.get<RoomFileResponse[]>(
        `/rooms/${roomId}/files`
      );

      console.log('✅ 자료실 파일 목록 조회 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 자료실 파일 목록 조회 실패:', error);
      console.error('에러 상태:', error.response?.status);
      console.error('에러 데이터:', error.response?.data);
      throw error;
    }
  }

  /**
   * 파일 크기 포맷팅
   * @param bytes 바이트 크기
   * @returns 포맷된 크기 문자열
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 파일 타입에 따른 아이콘 반환
   * @param contentType MIME 타입
   * @returns 아이콘 이름
   */
  static getFileIcon(contentType: string): string {
    const iconMap: { [key: string]: string } = {
      'application/pdf': 'document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'easel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'document-text',
      'application/x-hwp': 'document-text',
      'text/plain': 'document-text',
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'video/mp4': 'videocam',
      'video/avi': 'videocam',
      'video/mov': 'videocam',
    };
    return iconMap[contentType] || 'document';
  }

  /**
   * 파일 타입에 따른 색상 반환
   * @param contentType MIME 타입
   * @returns 색상 코드
   */
  static getFileIconColor(contentType: string): string {
    const colorMap: { [key: string]: string } = {
      'application/pdf': '#FF3B30',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        '#FF9500',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '#007AFF',
      'application/x-hwp': '#34C759',
      'text/plain': '#8E8E93',
      'image/jpeg': '#FF2D92',
      'image/png': '#FF2D92',
      'image/gif': '#FF2D92',
      'video/mp4': '#AF52DE',
      'video/avi': '#AF52DE',
      'video/mov': '#AF52DE',
    };
    return colorMap[contentType] || '#8E8E93';
  }

  /**
   * 백엔드 API 응답을 FileItem 형태로 변환
   * @param roomFile 백엔드 파일 응답
   * @returns FileItem 형태의 파일 정보
   */
  static convertRoomFileToFileItem(roomFile: RoomFileResponse): FileItem {
    return {
      id: roomFile.fileId.toString(),
      name: roomFile.name,
      size: roomFile.byteSize,
      type: roomFile.mimeType,
      uploadedBy: `사용자 ${roomFile.uploaderId}`, // TODO: 실제 사용자명으로 교체 필요
      uploadedAt: '방금 전', // TODO: 실제 업로드 시간으로 교체 필요
      fileIcon: this.getFileIconByType(roomFile.type),
      fileId: roomFile.fileId,
    };
  }

  /**
   * 백엔드 파일 타입을 MIME 타입으로 변환
   * @param fileType 백엔드 파일 타입
   * @returns MIME 타입
   */
  static convertFileTypeToMimeType(fileType: string): string {
    const typeMap: { [key: string]: string } = {
      IMAGE: 'image/jpeg',
      VIDEO: 'video/mp4',
      AUDIO: 'audio/mpeg',
      DOCUMENT: 'application/pdf',
      OTHER: 'application/octet-stream',
    };
    return typeMap[fileType] || 'application/octet-stream';
  }

  /**
   * 백엔드 파일 타입에 따른 아이콘 반환
   * @param fileType 백엔드 파일 타입
   * @returns 아이콘 이름
   */
  static getFileIconByType(fileType: string): string {
    const iconMap: { [key: string]: string } = {
      IMAGE: 'image',
      VIDEO: 'videocam',
      AUDIO: 'musical-notes',
      DOCUMENT: 'document',
      OTHER: 'document',
    };
    return iconMap[fileType] || 'document';
  }

  /**
   * 백엔드 파일 타입에 따른 색상 반환
   * @param fileType 백엔드 파일 타입
   * @returns 색상 코드
   */
  static getFileIconColorByType(fileType: string): string {
    const colorMap: { [key: string]: string } = {
      IMAGE: '#FF2D92',
      VIDEO: '#AF52DE',
      AUDIO: '#FF9500',
      DOCUMENT: '#007AFF',
      OTHER: '#8E8E93',
    };
    return colorMap[fileType] || '#8E8E93';
  }
}
