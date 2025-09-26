import apiClient from './api';
import {
  CreateTaskRequest,
  CreateTaskResponse,
  Task,
  TaskWithMembers,
  TaskListResponse,
  TaskDetailResponse,
  TaskSubmissionRequest,
  TaskSubmissionResponse,
  TaskCancelRequest,
  TaskCancelResponse,
  TaskMember,
} from '@/src/types/task';

/**
 * 과제 관리 서비스
 * 과제 생성, 조회, 제출, 취소 기능 제공
 */
export class TaskService {
  /**
   * 과제 생성
   * @param roomId 채팅방 ID
   * @param taskData 과제 생성 데이터
   * @returns 생성된 과제 정보
   */
  static async createTask(
    roomId: number,
    taskData: CreateTaskRequest
  ): Promise<CreateTaskResponse> {
    try {
      console.log('🚀 과제 생성 API 요청:', { roomId, taskData });

      const response = await apiClient.post<CreateTaskResponse>(
        `/rooms/${roomId}/assignments`,
        taskData
      );

      console.log('✅ 과제 생성 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 과제 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 과제 목록 조회
   * @param roomId 채팅방 ID
   * @returns 과제 목록
   */
  static async getTasks(roomId: number): Promise<Task[]> {
    try {
      console.log('🚀 과제 목록 조회 API 요청:', { roomId });

      const response = await apiClient.get<Task[]>(
        `/rooms/${roomId}/assignments`
      );

      console.log('✅ 과제 목록 조회 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 과제 목록 조회 실패:', error);
      console.error('❌ API 에러:', error.response?.data);
      console.error('❌ 에러 상태:', error.response?.status);
      console.error('❌ 에러 헤더:', error.response?.headers);
      throw error;
    }
  }

  /**
   * 과제 상세 조회
   * @param taskId 과제 ID
   * @returns 과제 상세 정보
   */
  static async getTaskDetail(taskId: number): Promise<TaskDetailResponse> {
    try {
      console.log('🚀 과제 상세 조회 API 요청:', { taskId });

      const response = await apiClient.get<TaskDetailResponse>(
        `/assignments/${taskId}`
      );

      console.log('✅ 과제 상세 조회 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 과제 상세 조회 실패:', error);
      console.error('❌ API 에러:', error.response?.data);
      console.error('❌ 에러 상태:', error.response?.status);
      console.error('❌ 에러 헤더:', error.response?.headers);
      throw error;
    }
  }

  /**
   * 과제 제출
   * @param roomId 채팅방 ID
   * @param submissionData 제출 데이터
   * @returns 제출 결과
   */
  static async submitTask(
    roomId: number,
    submissionData: TaskSubmissionRequest
  ): Promise<TaskSubmissionResponse> {
    try {
      console.log('🚀 과제 제출 API 요청:', { roomId, submissionData });

      const response = await apiClient.post<TaskSubmissionResponse>(
        `/rooms/${roomId}/assignments/submit`,
        {
          assignmentId: submissionData.taskId,
          description: submissionData.content,
          fileIds: submissionData.fileIds || [],
        }
      );

      console.log('✅ 과제 제출 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 과제 제출 실패:', error);
      throw error;
    }
  }

  /**
   * 과제 취소 (팀장만 가능)
   * @param cancelData 취소 데이터
   * @returns 취소 결과
   */
  static async cancelTask(
    cancelData: TaskCancelRequest
  ): Promise<TaskCancelResponse> {
    try {
      console.log('🚀 과제 취소 API 요청:', cancelData);

      const response = await apiClient.post<TaskCancelResponse>(
        `/assignments/${cancelData.taskId}/cancel`,
        {
          reason: cancelData.reason || '',
        }
      );

      console.log('✅ 과제 취소 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 과제 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 과제 삭제 (팀장만 가능)
   * @param roomId 채팅방 ID
   * @param assignmentId 과제 ID
   * @returns 삭제 결과
   */
  static async deleteTask(
    roomId: number,
    assignmentId: number
  ): Promise<{ message: string }> {
    try {
      console.log('🚀 과제 삭제 API 요청:', { roomId, assignmentId });

      const response = await apiClient.delete<{ message: string }>(
        `/rooms/${roomId}/assignments/${assignmentId}`
      );

      console.log('✅ 과제 삭제 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 과제 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 날짜를 ISO 8601 형식으로 변환
   * @param date Date 객체 또는 날짜 문자열
   * @returns ISO 8601 형식의 날짜 문자열
   */
  static formatDateToISO(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString();
  }

  /**
   * ISO 8601 형식의 날짜를 사용자 친화적 형식으로 변환
   * @param isoDate ISO 8601 형식의 날짜 문자열
   * @returns 사용자 친화적 날짜 문자열
   */
  static formatDateFromISO(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 백엔드 Task를 UI용 TaskWithMembers로 변환
   * @param task 백엔드에서 받은 Task
   * @param memberMap 멤버 ID -> 멤버 정보 매핑
   * @returns UI에서 사용할 TaskWithMembers
   */
  static transformTaskForUI(
    task: Task,
    memberMap: Map<number, TaskMember>
  ): TaskWithMembers {
    const assignedMembers: TaskMember[] = task.assignedMemberIds.map((id) => {
      const member = memberMap.get(id);
      if (member) {
        // 제출 여부 확인
        const hasSubmitted = task.submissions.some(
          (submission) => submission.submitterId === id
        );
        const submission = task.submissions.find(
          (submission) => submission.submitterId === id
        );

        return {
          ...member,
          hasSubmitted,
          submittedAt: submission ? submission.createdAt : undefined,
        };
      }

      // 멤버 정보가 없는 경우 기본값
      return {
        id,
        name: `사용자 ${id}`,
        hasSubmitted: false,
      };
    });

    return {
      ...task,
      id: task.assignmentId, // UI에서 사용하는 id 필드
      assignedMembers,
      createdBy: '팀장', // TODO: 실제 생성자 정보 가져오기
      createdAt: new Date().toISOString(), // TODO: 실제 생성일 가져오기
    };
  }

  /**
   * 과제 상태 계산
   * @param task 과제 정보
   * @returns 상태 정보
   */
  static getTaskStatus(task: Task | TaskWithMembers) {
    const totalMembers = task.assignedMemberIds.length;
    const submittedMembers = task.submissions.length;

    if (submittedMembers === 0) {
      return { text: '미시작', color: '#FF3B30', progress: 0 };
    } else if (submittedMembers === totalMembers) {
      return { text: '완료', color: '#4CAF50', progress: 100 };
    } else {
      return {
        text: `${submittedMembers}/${totalMembers} 제출`,
        color: '#FF9500',
        progress: (submittedMembers / totalMembers) * 100,
      };
    }
  }

  /**
   * 마감일까지 남은 시간 계산
   * @param dueDate 마감일 (ISO 8601 형식)
   * @returns 남은 시간 정보
   */
  static getTimeUntilDue(dueDate: string): {
    isOverdue: boolean;
    timeLeft: string;
    color: string;
  } {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return {
        isOverdue: true,
        timeLeft: '마감됨',
        color: '#FF3B30',
      };
    } else if (diffDays === 0) {
      return {
        isOverdue: false,
        timeLeft: '오늘 마감',
        color: '#FF9500',
      };
    } else if (diffDays === 1) {
      return {
        isOverdue: false,
        timeLeft: '내일 마감',
        color: '#FF9500',
      };
    } else {
      return {
        isOverdue: false,
        timeLeft: `${diffDays}일 남음`,
        color: '#4CAF50',
      };
    }
  }
}
