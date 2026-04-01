import { WorkoutRoutine } from "./routine-diet-types";

/**
 * 공유된 루틴의 메타데이터
 */
export interface SharedRoutineMetadata {
  id: string; // 고유 공유 ID
  routineId: string; // 원본 루틴 ID
  routineName: string; // 루틴 이름
  routineDescription: string; // 루틴 설명
  creatorName: string; // 생성자 이름
  createdAt: number; // 생성 시간
  shareCode: string; // 공유 코드 (짧은 링크용)
  routineData: WorkoutRoutine; // 루틴 전체 데이터
  downloadCount: number; // 다운로드 수
  rating: number; // 평점 (0-5)
  tags: string[]; // 태그 (예: "초급", "가슴", "4주")
}

/**
 * 공유 링크 정보
 */
export interface ShareLink {
  shortCode: string; // 짧은 코드 (예: "ABC123")
  fullUrl: string; // 전체 URL
  qrCodeData: string; // QR 코드 데이터 (base64)
  expiresAt?: number; // 만료 시간 (선택사항)
}

/**
 * 루틴 임포트 요청
 */
export interface RoutineImportRequest {
  shareCode: string; // 공유 코드
  importName?: string; // 임포트할 때 사용할 이름
}

/**
 * 루틴 익스포트 형식
 */
export interface RoutineExportData {
  version: string; // 내보내기 형식 버전
  exportedAt: number; // 내보낸 시간
  routine: WorkoutRoutine; // 루틴 데이터
  metadata: {
    creatorName: string;
    description: string;
    tags: string[];
  };
}
