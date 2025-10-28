// 파일 업로드 관련 타입 정의

export interface FileUploadIntentRequest {
  fileName: string;
  contentType: string;
  size: number;
}

export interface FileUploadIntentResponse {
  key: string;
  url: string;
}

export interface FileUploadCompleteRequest {
  key: string;
}

export interface FileUploadCompleteResponse {
  fileId: number;
}

export interface FileDownloadUrlResponse {
  url: string;
  expiresAtEpochSeconds: number;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  fileIcon: string;
  fileId?: number; // 서버에서 받은 실제 fileId
  uploadedByAvatar?: string; // 업로더 아바타 URL
}

// 백엔드 API 응답 타입
export interface RoomFileResponse {
  fileId: number;
  uploaderId: number;
  sortOrder: number;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
  mimeType: string;
  byteSize: number;
  width?: number;
  height?: number;
  durationMs?: number;
  previewUrl: string;
  thumbnailUrl: string;
  downloadUrl: string;
  antiVirusScanStatus: 'PENDING' | 'CLEAN' | 'INFECTED';
  transcodeStatus: 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED';
  ready: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
