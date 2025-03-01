// 지점(매장) 정보 타입
export interface Store {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  baseHourlyRate: number; // 기본 시급
  openingHour: string; // '09:00'
  closingHour: string; // '22:00'
  // 추가 정보는 필요에 따라 확장
}

// 알바생 정보 타입
export interface Employee {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  hourlyRate: number; // 시급 (기본 시급과 다를 수 있음)
  role?: string; // 직무 (바리스타, 홀서빙 등)
  status: "active" | "inactive" | "pending"; // 재직 중/휴직/승인 대기
  bankAccount?: string; // 계좌 정보
  birthDate?: string; // 생년월일
  // 추가 정보는 필요에 따라 확장
}

// 알바생 가능 근무시간 타입
export interface Availability {
  employeeId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0: 일요일, 1: 월요일, ...
  startTime: string; // '09:00'
  endTime: string; // '15:00'
  isRecurring: boolean; // 매주 반복
  exceptionDates?: string[]; // 예외 날짜들 (휴가 등)
}

// 근무 블록 (Shift) 타입
export interface Shift {
  id: string;
  storeId: string;
  title?: string; // 근무명 (오픈, 마감 등)
  start: string; // ISO 문자열 (날짜+시간)
  end: string; // ISO 문자열 (날짜+시간)
  employeeIds: string[]; // 배정된 알바생 ID 배열 (여러 명 가능)
  isRecurring: boolean; // 반복 여부
  recurringPattern?: {
    frequency: "weekly"; // 향후 'daily', 'monthly' 등 확장 가능
    daysOfWeek: number[]; // 반복할 요일 (0: 일요일, 1: 월요일, ...)
    endDate?: string; // 반복 종료일
  };
  color?: string; // 블록 색상
  note?: string; // 추가 메모
}

// 대타 요청 타입
export interface SubstituteRequest {
  id: string;
  shiftId: string;
  requesterId: string; // 요청한 알바생
  substituteId?: string; // 대타를 서는 알바생 (미정이면 null)
  status: "pending" | "accepted" | "rejected" | "cancelled";
  reason?: string; // 대타 요청 사유
  createdAt: string;
  updatedAt: string;
}

// 급여 항목 타입
export interface PayrollItem {
  id: string;
  employeeId: string;
  storeId: string;
  year: number;
  month: number;
  workedHours: number; // 근무 시간
  baseAmount: number; // 기본급 (시급 × 시간)
  additionalPay?: number; // 수당
  deduction?: number; // 공제
  tax?: number; // 세금
  finalAmount: number; // 최종 금액
  isPaid: boolean; // 지급 여부
  note?: string; // 메모
}

// 스토어 초기 설정 마법사 상태 관리용 타입
export interface SetupWizardState {
  step: number;
  storeInfo: Partial<Store>;
  employees: Partial<Employee>[];
  workingHours: {
    openingHour: string;
    closingHour: string;
  };
  initialSchedules: Partial<Shift>[];
}
