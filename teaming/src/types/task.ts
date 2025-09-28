// 과제 관련 타입 정의

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignedMemberIds: number[];
  due: string; // ISO 8601 형식 (예: "2025-09-24T12:06:40.615Z")
}

export interface CreateTaskResponse {
  taskId: number;
  message: string;
}

export interface TaskFile {
  fileId: number;
  fileName: string;
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'OTHER';
  mimeType: string;
  fileSize: number;
}

export interface TaskSubmission {
  submitterId: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  files: TaskFile[];
}

export interface Task {
  assignmentId: number;
  title: string;
  description: string;
  assignedMemberIds: number[];
  due: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  submissions: TaskSubmission[];
}

// UI에서 사용할 확장된 Task 타입
export interface TaskWithMembers extends Task {
  assignedMembers: TaskMember[];
  createdBy: string;
  createdAt: string;
  isLeader?: boolean;
}

export interface TaskMember {
  id: number;
  name: string;
  avatarUrl?: string;
  hasSubmitted: boolean;
  submittedAt?: string;
}

export interface TaskSubmissionRequest {
  taskId: number;
  content: string;
  fileIds?: number[]; // 첨부 파일 ID들
}

export interface TaskSubmissionResponse {
  submissionId: number;
  message: string;
}

export interface TaskCancelRequest {
  taskId: number;
  reason?: string;
}

export interface TaskCancelResponse {
  message: string;
}

export interface TaskListResponse {
  tasks: Task[];
  totalCount: number;
}

export interface TaskDetailResponse extends Task {
  // 상세 조회 시 추가 정보가 있을 수 있음
}

// 홈화면에서 사용할 간단한 과제 정보
export interface AssignmentSummary {
  assignmentId: number;
  roomId: number;
  title: string;
  description: string;
  due: string; // ISO 8601 형식
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}
