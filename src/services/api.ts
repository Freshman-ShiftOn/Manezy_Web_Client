import {
  Employee,
  Store,
  SetupWizardState,
  Shift,
  SubstituteRequest,
  ScheduleChangeRequest,
  ShiftApprovalRequest,
  EmployeeNotification,
  EmployeeAvailability,
} from "../lib/types";
import { isValidJWTFormat } from "./auth";

// 로컬 스토리지 키
export const LS_KEYS = {
  STORE: "manezy_store",
  EMPLOYEES: "manezy_employees",
  SHIFTS: "manezy_shifts",
  SETUP_COMPLETE: "manezy_setup_complete",
  SUBSTITUTE_REQUESTS: "manezy_substitute_requests",
  SCHEDULE_CHANGE_REQUESTS: "manezy_schedule_change_requests",
  SHIFT_APPROVAL_REQUESTS: "manezy_shift_approval_requests",
  EMPLOYEE_NOTIFICATIONS: "manezy_employee_notifications",
  EMPLOYEE_AVAILABILITIES: "manezy_employee_availabilities",
  AUTH_TOKEN: "manezy_auth_token",
  REMEMBERED_EMAIL: "manezy_remembered_email",
};

// 지연 시간 시뮬레이션 (ms)
const DELAY = 300;

// 성공 응답 시뮬레이션
const simulateResponse = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), DELAY);
  });
};

// 에러 응답 시뮬레이션
const simulateError = (message: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), DELAY);
  });
};

// UUID 생성 헬퍼
const generateId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// 초기 설정 저장
export const saveStoreSetup = async (
  data: SetupWizardState
): Promise<Store> => {
  try {
    // ID가 없으면 생성
    const completeStoreInfo: Store = {
      id: data.storeInfo.id || generateId(),
      name: data.storeInfo.name || "",
      address: data.storeInfo.address || "",
      phoneNumber: data.storeInfo.phoneNumber || "",
      baseHourlyRate: data.storeInfo.baseHourlyRate || 9620, // 기본 최저시급
      openingHour: data.workingHours.openingHour,
      closingHour: data.workingHours.closingHour,
    };

    // 지점 정보 저장
    localStorage.setItem(LS_KEYS.STORE, JSON.stringify(completeStoreInfo));

    // 알바생 정보 저장
    const completeEmployees = data.employees.map((emp) => ({
      id: emp.id || generateId(),
      name: emp.name || "",
      phoneNumber: emp.phoneNumber || "",
      email: emp.email || "",
      hourlyRate: emp.hourlyRate || completeStoreInfo.baseHourlyRate,
      role: emp.role || "",
      status: emp.status || "active",
      bankAccount: emp.bankAccount || "",
      birthDate: emp.birthDate || "",
    }));

    localStorage.setItem(LS_KEYS.EMPLOYEES, JSON.stringify(completeEmployees));

    // 설정 완료 표시
    localStorage.setItem(LS_KEYS.SETUP_COMPLETE, "true");

    return simulateResponse(completeStoreInfo);
  } catch (error) {
    return simulateError("Store setup failed");
  }
};

// 지점 정보 조회
export const getStoreInfo = async (): Promise<Store | null> => {
  try {
    const storeData = localStorage.getItem(LS_KEYS.STORE);
    if (!storeData) return simulateResponse(null);

    return simulateResponse(JSON.parse(storeData));
  } catch (error) {
    return simulateResponse(null);
  }
};

// 알바생 목록 조회
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const employeesData = localStorage.getItem(LS_KEYS.EMPLOYEES);
    if (!employeesData) return simulateResponse([]);

    return simulateResponse(JSON.parse(employeesData));
  } catch (error) {
    return simulateResponse([]);
  }
};

// 알바생 추가
export const addEmployee = async (employee: Employee): Promise<Employee> => {
  try {
    const employeesData = localStorage.getItem(LS_KEYS.EMPLOYEES) || "[]";
    const employees: Employee[] = JSON.parse(employeesData);

    // 신규 ID 생성
    if (!employee.id) {
      employee.id = Date.now().toString();
    }

    employees.push(employee);
    localStorage.setItem(LS_KEYS.EMPLOYEES, JSON.stringify(employees));

    return simulateResponse(employee);
  } catch (error) {
    return simulateError("Failed to add employee");
  }
};

// 알바생 수정
export const updateEmployee = async (employee: Employee): Promise<Employee> => {
  try {
    const employeesData = localStorage.getItem(LS_KEYS.EMPLOYEES) || "[]";
    let employees: Employee[] = JSON.parse(employeesData);

    employees = employees.map((e) => (e.id === employee.id ? employee : e));

    localStorage.setItem(LS_KEYS.EMPLOYEES, JSON.stringify(employees));

    return simulateResponse(employee);
  } catch (error) {
    return simulateError("Failed to update employee");
  }
};

// 알바생 삭제
export const deleteEmployee = async (id: string): Promise<boolean> => {
  try {
    const employeesData = localStorage.getItem(LS_KEYS.EMPLOYEES) || "[]";
    let employees: Employee[] = JSON.parse(employeesData);

    employees = employees.filter((e) => e.id !== id);

    localStorage.setItem(LS_KEYS.EMPLOYEES, JSON.stringify(employees));

    return simulateResponse(true);
  } catch (error) {
    return simulateError("Failed to delete employee");
  }
};

// 초기 설정 완료 여부 확인
export const hasInitialSetup = async (): Promise<boolean> => {
  const setupComplete = localStorage.getItem(LS_KEYS.SETUP_COMPLETE);
  const storeData = localStorage.getItem(LS_KEYS.STORE);

  return simulateResponse(!!setupComplete && !!storeData);
};

// 설정 데이터 초기화 (개발용)
export const resetSetupData = (): void => {
  localStorage.removeItem(LS_KEYS.STORE);
  localStorage.removeItem(LS_KEYS.EMPLOYEES);
  localStorage.removeItem(LS_KEYS.SHIFTS);
  localStorage.removeItem(LS_KEYS.SETUP_COMPLETE);
};

// 근무 일정 조회
export const getShifts = async (): Promise<Shift[]> => {
  try {
    const shiftsData = localStorage.getItem(LS_KEYS.SHIFTS);
    if (!shiftsData) return simulateResponse([]);

    return simulateResponse(JSON.parse(shiftsData));
  } catch (error) {
    return simulateResponse([]);
  }
};

// 근무 일정 저장
export const saveShift = async (shift: Shift): Promise<Shift> => {
  try {
    console.log("API - 근무 일정 저장 시작:", shift);

    // 데이터 유효성 검증
    if (!shift.id) {
      console.error("근무 ID가 없습니다");
      return simulateError("근무 ID가 없습니다");
    }

    // 지점 정보 확인
    if (!shift.storeId) {
      console.error("매장 ID가 없습니다");

      // 지점 정보 확인
      const storeInfo = await getStoreInfo();
      if (storeInfo && storeInfo.id) {
        console.log("지점 정보에서 ID 가져옴:", storeInfo.id);
        shift.storeId = storeInfo.id;
      } else {
        // 테스트용으로 's1' 기본값 사용하지만 실제로는 오류 처리 필요
        console.warn("지점 정보가 없어 기본값 's1' 사용 (테스트용)");
        shift.storeId = "s1";
      }
    }

    const shiftsData = localStorage.getItem(LS_KEYS.SHIFTS) || "[]";
    let shifts: Shift[] = JSON.parse(shiftsData);

    // 기존 일정 업데이트 또는 새 일정 추가
    const existingIndex = shifts.findIndex((s) => s.id === shift.id);

    if (existingIndex >= 0) {
      shifts[existingIndex] = shift;
      console.log("기존 근무 업데이트:", shift.id);
    } else {
      shifts.push(shift);
      console.log("새 근무 추가:", shift.id);
    }

    localStorage.setItem(LS_KEYS.SHIFTS, JSON.stringify(shifts));
    console.log("근무 일정 저장 완료");

    return simulateResponse(shift);
  } catch (error) {
    console.error("근무 일정 저장 오류:", error);
    return simulateError("근무 일정 저장에 실패했습니다");
  }
};

// 근무 일정 삭제
export const deleteShift = async (id: string): Promise<boolean> => {
  try {
    const shiftsData = localStorage.getItem(LS_KEYS.SHIFTS) || "[]";
    let shifts: Shift[] = JSON.parse(shiftsData);

    shifts = shifts.filter((s) => s.id !== id);

    localStorage.setItem(LS_KEYS.SHIFTS, JSON.stringify(shifts));

    return simulateResponse(true);
  } catch (error) {
    return simulateError("근무 일정 삭제에 실패했습니다");
  }
};

// 지점 정보 업데이트
export const updateStoreInfo = async (storeData: Store): Promise<Store> => {
  try {
    const existingStoreData = localStorage.getItem(LS_KEYS.STORE);
    let existingStore: Store | null = null;

    if (existingStoreData) {
      existingStore = JSON.parse(existingStoreData);
    }

    // 기존 데이터와 병합
    const updatedStore: Store = {
      ...(existingStore || {}),
      ...storeData,
      id: storeData.id || existingStore?.id || generateId(),
    };

    // 로컬 스토리지에 저장
    localStorage.setItem(LS_KEYS.STORE, JSON.stringify(updatedStore));

    return simulateResponse(updatedStore);
  } catch (error) {
    return simulateError("Failed to update store info");
  }
};

// ====================== 알바생앱 연동 API ======================

// 대타 요청 목록 조회
export const getSubstituteRequests = async (): Promise<SubstituteRequest[]> => {
  try {
    const requestsData = localStorage.getItem(LS_KEYS.SUBSTITUTE_REQUESTS);
    if (!requestsData) return simulateResponse([]);

    return simulateResponse(JSON.parse(requestsData));
  } catch (error) {
    console.error("대타 요청 조회 오류:", error);
    return simulateResponse([]);
  }
};

// 대타 요청 생성
export const createSubstituteRequest = async (
  request: Omit<SubstituteRequest, "id" | "createdAt" | "updatedAt">
): Promise<SubstituteRequest> => {
  try {
    const requestsData =
      localStorage.getItem(LS_KEYS.SUBSTITUTE_REQUESTS) || "[]";
    const requests: SubstituteRequest[] = JSON.parse(requestsData);

    const now = new Date().toISOString();

    const newRequest: SubstituteRequest = {
      ...request,
      id: `sub-req-${generateId()}`,
      createdAt: now,
      updatedAt: now,
    };

    requests.push(newRequest);
    localStorage.setItem(LS_KEYS.SUBSTITUTE_REQUESTS, JSON.stringify(requests));

    return simulateResponse(newRequest);
  } catch (error) {
    console.error("대타 요청 생성 오류:", error);
    return simulateError("대타 요청 생성에 실패했습니다");
  }
};

// 대타 요청 상태 업데이트
export const updateSubstituteRequest = async (
  requestId: string,
  updates: Partial<SubstituteRequest>
): Promise<SubstituteRequest> => {
  try {
    const requestsData =
      localStorage.getItem(LS_KEYS.SUBSTITUTE_REQUESTS) || "[]";
    let requests: SubstituteRequest[] = JSON.parse(requestsData);

    const index = requests.findIndex((req) => req.id === requestId);
    if (index === -1) {
      return simulateError("요청을 찾을 수 없습니다");
    }

    requests[index] = {
      ...requests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(LS_KEYS.SUBSTITUTE_REQUESTS, JSON.stringify(requests));

    return simulateResponse(requests[index]);
  } catch (error) {
    console.error("대타 요청 업데이트 오류:", error);
    return simulateError("대타 요청 업데이트에 실패했습니다");
  }
};

// 스케줄 변경 요청 목록 조회
export const getScheduleChangeRequests = async (): Promise<
  ScheduleChangeRequest[]
> => {
  try {
    const requestsData = localStorage.getItem(LS_KEYS.SCHEDULE_CHANGE_REQUESTS);
    if (!requestsData) return simulateResponse([]);

    return simulateResponse(JSON.parse(requestsData));
  } catch (error) {
    console.error("스케줄 변경 요청 조회 오류:", error);
    return simulateResponse([]);
  }
};

// 스케줄 변경 요청 생성
export const createScheduleChangeRequest = async (
  request: Omit<ScheduleChangeRequest, "id" | "createdAt" | "updatedAt">
): Promise<ScheduleChangeRequest> => {
  try {
    const requestsData =
      localStorage.getItem(LS_KEYS.SCHEDULE_CHANGE_REQUESTS) || "[]";
    const requests: ScheduleChangeRequest[] = JSON.parse(requestsData);

    const now = new Date().toISOString();

    const newRequest: ScheduleChangeRequest = {
      ...request,
      id: `sch-req-${generateId()}`,
      createdAt: now,
      updatedAt: now,
    };

    requests.push(newRequest);
    localStorage.setItem(
      LS_KEYS.SCHEDULE_CHANGE_REQUESTS,
      JSON.stringify(requests)
    );

    return simulateResponse(newRequest);
  } catch (error) {
    console.error("스케줄 변경 요청 생성 오류:", error);
    return simulateError("스케줄 변경 요청 생성에 실패했습니다");
  }
};

// 스케줄 변경 요청 상태 업데이트
export const updateScheduleChangeRequest = async (
  requestId: string,
  updates: Partial<ScheduleChangeRequest>
): Promise<ScheduleChangeRequest> => {
  try {
    const requestsData =
      localStorage.getItem(LS_KEYS.SCHEDULE_CHANGE_REQUESTS) || "[]";
    let requests: ScheduleChangeRequest[] = JSON.parse(requestsData);

    const index = requests.findIndex((req) => req.id === requestId);
    if (index === -1) {
      return simulateError("요청을 찾을 수 없습니다");
    }

    requests[index] = {
      ...requests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      LS_KEYS.SCHEDULE_CHANGE_REQUESTS,
      JSON.stringify(requests)
    );

    return simulateResponse(requests[index]);
  } catch (error) {
    console.error("스케줄 변경 요청 업데이트 오류:", error);
    return simulateError("스케줄 변경 요청 업데이트에 실패했습니다");
  }
};

// 근무 승인 요청 목록 조회
export const getShiftApprovalRequests = async (): Promise<
  ShiftApprovalRequest[]
> => {
  try {
    const requestsData = localStorage.getItem(LS_KEYS.SHIFT_APPROVAL_REQUESTS);
    if (!requestsData) return simulateResponse([]);

    return simulateResponse(JSON.parse(requestsData));
  } catch (error) {
    console.error("근무 승인 요청 조회 오류:", error);
    return simulateResponse([]);
  }
};

// 근무 승인 요청 생성
export const createShiftApprovalRequest = async (
  request: Omit<ShiftApprovalRequest, "id" | "createdAt" | "updatedAt">
): Promise<ShiftApprovalRequest> => {
  try {
    const requestsData =
      localStorage.getItem(LS_KEYS.SHIFT_APPROVAL_REQUESTS) || "[]";
    const requests: ShiftApprovalRequest[] = JSON.parse(requestsData);

    const now = new Date().toISOString();

    const newRequest: ShiftApprovalRequest = {
      ...request,
      id: `app-req-${generateId()}`,
      createdAt: now,
      updatedAt: now,
    };

    requests.push(newRequest);
    localStorage.setItem(
      LS_KEYS.SHIFT_APPROVAL_REQUESTS,
      JSON.stringify(requests)
    );

    return simulateResponse(newRequest);
  } catch (error) {
    console.error("근무 승인 요청 생성 오류:", error);
    return simulateError("근무 승인 요청 생성에 실패했습니다");
  }
};

// 근무 승인 요청 상태 업데이트
export const updateShiftApprovalRequest = async (
  requestId: string,
  updates: Partial<ShiftApprovalRequest>
): Promise<ShiftApprovalRequest> => {
  try {
    const requestsData =
      localStorage.getItem(LS_KEYS.SHIFT_APPROVAL_REQUESTS) || "[]";
    let requests: ShiftApprovalRequest[] = JSON.parse(requestsData);

    const index = requests.findIndex((req) => req.id === requestId);
    if (index === -1) {
      return simulateError("요청을 찾을 수 없습니다");
    }

    requests[index] = {
      ...requests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      LS_KEYS.SHIFT_APPROVAL_REQUESTS,
      JSON.stringify(requests)
    );

    return simulateResponse(requests[index]);
  } catch (error) {
    console.error("근무 승인 요청 업데이트 오류:", error);
    return simulateError("근무 승인 요청 업데이트에 실패했습니다");
  }
};

// 알바생앱 알림 목록 조회
export const getEmployeeNotifications = async (
  employeeId?: string
): Promise<EmployeeNotification[]> => {
  try {
    const notificationsData = localStorage.getItem(
      LS_KEYS.EMPLOYEE_NOTIFICATIONS
    );
    if (!notificationsData) return simulateResponse([]);

    let notifications: EmployeeNotification[] = JSON.parse(notificationsData);

    // 특정 알바생의 알림만 필터링
    if (employeeId) {
      notifications = notifications.filter(
        (notification) => notification.employeeId === employeeId
      );
    }

    return simulateResponse(notifications);
  } catch (error) {
    console.error("알림 조회 오류:", error);
    return simulateResponse([]);
  }
};

// 알림 생성
export const createNotification = async (
  notification: Omit<EmployeeNotification, "id" | "createdAt" | "read">
): Promise<EmployeeNotification> => {
  try {
    const notificationsData =
      localStorage.getItem(LS_KEYS.EMPLOYEE_NOTIFICATIONS) || "[]";
    const notifications: EmployeeNotification[] = JSON.parse(notificationsData);

    const newNotification: EmployeeNotification = {
      ...notification,
      id: `notif-${generateId()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    notifications.push(newNotification);
    localStorage.setItem(
      LS_KEYS.EMPLOYEE_NOTIFICATIONS,
      JSON.stringify(notifications)
    );

    return simulateResponse(newNotification);
  } catch (error) {
    console.error("알림 생성 오류:", error);
    return simulateError("알림 생성에 실패했습니다");
  }
};

// 알림 읽음 표시
export const markNotificationAsRead = async (
  notificationId: string
): Promise<boolean> => {
  try {
    const notificationsData =
      localStorage.getItem(LS_KEYS.EMPLOYEE_NOTIFICATIONS) || "[]";
    let notifications: EmployeeNotification[] = JSON.parse(notificationsData);

    const index = notifications.findIndex(
      (notification) => notification.id === notificationId
    );
    if (index === -1) {
      return simulateError("알림을 찾을 수 없습니다");
    }

    notifications[index].read = true;
    localStorage.setItem(
      LS_KEYS.EMPLOYEE_NOTIFICATIONS,
      JSON.stringify(notifications)
    );

    return simulateResponse(true);
  } catch (error) {
    console.error("알림 읽음 표시 오류:", error);
    return simulateError("알림 읽음 표시에 실패했습니다");
  }
};

// 알바생 가능 시간 목록 조회
export const getEmployeeAvailabilities = async (
  employeeId?: string
): Promise<EmployeeAvailability[]> => {
  try {
    const availabilitiesData = localStorage.getItem(
      LS_KEYS.EMPLOYEE_AVAILABILITIES
    );
    if (!availabilitiesData) return simulateResponse([]);

    let availabilities: EmployeeAvailability[] = JSON.parse(availabilitiesData);

    // 특정 알바생의 가능 시간만 필터링
    if (employeeId) {
      availabilities = availabilities.filter(
        (availability) => availability.employeeId === employeeId
      );
    }

    return simulateResponse(availabilities);
  } catch (error) {
    console.error("가능 시간 조회 오류:", error);
    return simulateResponse([]);
  }
};

// 알바생 가능 시간 저장
export const saveEmployeeAvailability = async (
  availability: EmployeeAvailability
): Promise<EmployeeAvailability> => {
  try {
    const availabilitiesData =
      localStorage.getItem(LS_KEYS.EMPLOYEE_AVAILABILITIES) || "[]";
    let availabilities: EmployeeAvailability[] = JSON.parse(availabilitiesData);

    // 기존 항목 찾기 (같은 직원 ID와 요일)
    const index = availabilities.findIndex(
      (a) =>
        a.employeeId === availability.employeeId &&
        a.dayOfWeek === availability.dayOfWeek
    );

    if (index >= 0) {
      // 기존 항목 업데이트
      availabilities[index] = availability;
    } else {
      // 새 항목 추가
      availabilities.push(availability);
    }

    localStorage.setItem(
      LS_KEYS.EMPLOYEE_AVAILABILITIES,
      JSON.stringify(availabilities)
    );

    return simulateResponse(availability);
  } catch (error) {
    console.error("가능 시간 저장 오류:", error);
    return simulateError("가능 시간 저장에 실패했습니다");
  }
};

// 최적 근무자 추천
export const getRecommendedEmployees = async (
  shiftId: string
): Promise<{ employeeId: string; score: number }[]> => {
  try {
    // 더미 데이터 생성 (실제로는 알고리즘 적용)
    const shiftsData = localStorage.getItem(LS_KEYS.SHIFTS) || "[]";
    const employeesData = localStorage.getItem(LS_KEYS.EMPLOYEES) || "[]";
    const availabilitiesData =
      localStorage.getItem(LS_KEYS.EMPLOYEE_AVAILABILITIES) || "[]";

    const shifts: Shift[] = JSON.parse(shiftsData);
    const employees: Employee[] = JSON.parse(employeesData);
    const availabilities: EmployeeAvailability[] =
      JSON.parse(availabilitiesData);

    // 해당 근무 찾기
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) {
      return simulateError("근무를 찾을 수 없습니다");
    }

    // 현재 배정된 직원 ID들
    const assignedEmployeeIds = shift.employeeIds || [];

    // 추천 목록 생성 (배정되지 않은 모든 직원)
    const recommendations = employees
      .filter((emp) => !assignedEmployeeIds.includes(emp.id))
      .map((emp) => {
        // 임의의 점수 생성 (실제로는 적합도 계산)
        const score = Math.floor(Math.random() * 100);
        return { employeeId: emp.id, score };
      })
      .sort((a, b) => b.score - a.score); // 높은 점수 순으로 정렬

    return simulateResponse(recommendations);
  } catch (error) {
    console.error("추천 직원 조회 오류:", error);
    return simulateError("추천 직원 조회에 실패했습니다");
  }
};

// 더미 데이터 생성 함수
export const generateDummyData = (forceReset = false): void => {
  console.log("Generating dummy data with improved schedule...");
  const now = new Date();

  // --- 매장 정보 (기본값 또는 가져오기) ---
  let storeInfo: Store = {
    id: "s1",
    name: "메가커피 서울대점",
    address: "서울 관악구 관악로 1",
    phoneNumber: "02-880-5114",
    baseHourlyRate: 9860,
    openingHour: "08:00",
    closingHour: "22:00",
  };
  try {
    const existingStore = localStorage.getItem(LS_KEYS.STORE);
    if (existingStore && !forceReset) {
      storeInfo = JSON.parse(existingStore);
      console.log("Using existing store info:", storeInfo);
    } else {
      localStorage.setItem(LS_KEYS.STORE, JSON.stringify(storeInfo));
      console.log("Setting default store info:", storeInfo);
    }
  } catch (e) {
    console.error("Error handling store info:", e);
    localStorage.setItem(LS_KEYS.STORE, JSON.stringify(storeInfo));
  }

  // --- 직원 정보 (기본값 또는 가져오기) ---
  let employees: Employee[] = [
    {
      id: "e1",
      name: "박민우",
      role: "매니저",
      hourlyRate: 11000,
      email: "parkmw@example.com",
      phoneNumber: "010-1111-2222",
      status: "active",
      bankAccount: "카카오뱅크 3333-01-1234567",
      birthDate: "1995-03-15",
    },
    {
      id: "e2",
      name: "이서연",
      role: "주간 알바",
      hourlyRate: 9860,
      email: "leesy@example.com",
      phoneNumber: "010-2222-3333",
      status: "active",
      bankAccount: "신한은행 110-123-456789",
      birthDate: "2000-08-20",
    },
    {
      id: "e3",
      name: "최준영",
      role: "주말 알바",
      hourlyRate: 9860,
      email: "choijy@example.com",
      phoneNumber: "010-3333-4444",
      status: "active",
      bankAccount: "국민은행 123-45-678901",
      birthDate: "2002-01-10",
    },
    {
      id: "e4",
      name: "김지은",
      role: "바리스타",
      hourlyRate: 10000,
      email: "kimje@example.com",
      phoneNumber: "010-4444-5555",
      status: "active",
      bankAccount: "우리은행 1002-123-456789",
      birthDate: "1998-11-25",
    },
    {
      id: "e5",
      name: "정도윤",
      role: "주말 알바",
      hourlyRate: 9860,
      email: "jungdy@example.com",
      phoneNumber: "010-5555-6666",
      status: "active",
      bankAccount: "하나은행 456-789012-345",
      birthDate: "2003-05-01",
    },
    {
      id: "e6",
      name: "강하은",
      role: "오픈 알바",
      hourlyRate: 9860,
      email: "kanghe@example.com",
      phoneNumber: "010-6666-7777",
      status: "active",
      bankAccount: "기업은행 012-345678-01-011",
      birthDate: "2001-09-12",
    },
    {
      id: "e7",
      name: "윤준호",
      role: "마감 알바",
      hourlyRate: 9860,
      email: "yoonjh@example.com",
      phoneNumber: "010-7777-8888",
      status: "active",
      bankAccount: "농협 302-1234-5678-91",
      birthDate: "1999-07-07",
    },
    {
      id: "e8",
      name: "송민석",
      role: "주말 알바",
      hourlyRate: 9860,
      email: "songms@example.com",
      phoneNumber: "010-8888-9999",
      status: "active",
      bankAccount: "새마을금고 9002-1234-5678-1",
      birthDate: "2000-04-18",
    },
  ];
  try {
    const existingEmployees = localStorage.getItem(LS_KEYS.EMPLOYEES);
    if (existingEmployees && !forceReset) {
      employees = JSON.parse(existingEmployees);
      console.log("Using existing employees:", employees.length);
    } else {
      localStorage.setItem(LS_KEYS.EMPLOYEES, JSON.stringify(employees));
      console.log("Setting default employees:", employees.length);
    }
  } catch (e) {
    console.error("Error handling employees:", e);
    localStorage.setItem(LS_KEYS.EMPLOYEES, JSON.stringify(employees));
  }

  // --- 근무 일정 생성 (현실적인 카페 스케줄 반영) ---
  const shifts: Shift[] = [];
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const [hours, minutes] = (timeStr || "00:00").split(":").map(Number);
    return { hours, minutes };
  };

  const openingTime = parseTime(storeInfo.openingHour || "08:00");
  const closingTime = parseTime(storeInfo.closingHour || "22:00");

  let employeeRotationIndex = 0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0: Sun, 6: Sat
    const dateStr = d.toISOString().split("T")[0];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const todaysShifts: Partial<Shift>[] = []; // Use Partial<Shift> initially

    // Define shift slots for the day
    const slots: {
      startH: number;
      startM: number;
      endH: number;
      endM: number;
      type: string;
      title: string;
      staffNeeded: number;
    }[] = [];

    // 1. Open Shift
    slots.push({
      startH: 8,
      startM: 0,
      endH: 15,
      endM: 0,
      type: "open",
      title: "오픈조",
      staffNeeded: 1,
    });

    // 2. Middle Shift
    slots.push({
      startH: 11,
      startM: 0,
      endH: 18,
      endM: 0,
      type: "middle",
      title: "미들조",
      staffNeeded: isWeekend ? 1 : 1,
    }); // 평일 1, 주말 1 (스윙 별도 추가)

    // 3. Swing Shift (Weekends only for peak time)
    if (isWeekend) {
      slots.push({
        startH: 12,
        startM: 0,
        endH: 17,
        endM: 0,
        type: "swing",
        title: "스윙조 (주말 피크)",
        staffNeeded: 1,
      });
    }

    // 4. Close Shift
    slots.push({
      startH: 15,
      startM: 0,
      endH: 22,
      endM: 0,
      type: "close",
      title: "마감조",
      staffNeeded: 1,
    });

    // Assign employees to slots
    const dailyAssigned = new Set<string>(); // Prevent assigning same person twice on the same day

    for (const slot of slots) {
      for (let i = 0; i < slot.staffNeeded; i++) {
        let assigned = false;
        let attempts = 0;
        while (!assigned && attempts < employees.length) {
          const currentEmployee =
            employees[employeeRotationIndex % employees.length];
          employeeRotationIndex++;
          attempts++;

          if (!dailyAssigned.has(currentEmployee.id)) {
            const shiftStart = new Date(d);
            shiftStart.setHours(slot.startH, slot.startM, 0, 0);
            const shiftEnd = new Date(d);
            shiftEnd.setHours(slot.endH, slot.endM, 0, 0);

            // Create the shift object matching the Shift type
            const newShift: Shift = {
              id: `${dateStr}-${currentEmployee.id}-${
                slot.type
              }-${i}-${Math.random().toString(16).slice(2)}`,
              storeId: storeInfo.id,
              start: shiftStart.toISOString(),
              end: shiftEnd.toISOString(),
              employeeIds: [currentEmployee.id],
              isRecurring: false,
              // Optional fields:
              title: `${currentEmployee.name} - ${slot.title}`,
              shiftType: slot.type as "open" | "middle" | "close", // Assert type if needed or handle 'swing'
              note: isWeekend ? "주말 근무" : "평일 근무",
              // requiredStaff: slot.staffNeeded // Add if needed in Shift type
            };

            shifts.push(newShift);
            dailyAssigned.add(currentEmployee.id);
            assigned = true;
          }
        }
        if (!assigned) {
          console.warn(
            `Could not find available employee for ${slot.title} on ${dateStr}`
          );
          // Optionally create an unassigned shift here if needed
        }
      }
    }
  }

  // --- Save generated shifts (Existing try-catch block) ---
  try {
    localStorage.setItem(LS_KEYS.SHIFTS, JSON.stringify(shifts));
    console.log("Generated realistic shifts:", shifts.length);
  } catch (e) {
    console.error("Error saving generated shifts:", e);
  }

  // --- 설정 완료 플래그 (기존과 동일) ---
  if (!localStorage.getItem(LS_KEYS.SETUP_COMPLETE) || forceReset) {
    localStorage.setItem(LS_KEYS.SETUP_COMPLETE, "true");
    console.log("Setup complete flag set.");
  }

  // --- 기타 더미 데이터 초기화 (기존과 동일) ---
  if (!localStorage.getItem(LS_KEYS.SUBSTITUTE_REQUESTS) || forceReset) {
    localStorage.setItem(LS_KEYS.SUBSTITUTE_REQUESTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(LS_KEYS.SCHEDULE_CHANGE_REQUESTS) || forceReset) {
    localStorage.setItem(LS_KEYS.SCHEDULE_CHANGE_REQUESTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(LS_KEYS.SHIFT_APPROVAL_REQUESTS) || forceReset) {
    localStorage.setItem(LS_KEYS.SHIFT_APPROVAL_REQUESTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(LS_KEYS.EMPLOYEE_NOTIFICATIONS) || forceReset) {
    localStorage.setItem(LS_KEYS.EMPLOYEE_NOTIFICATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(LS_KEYS.EMPLOYEE_AVAILABILITIES) || forceReset) {
    localStorage.setItem(LS_KEYS.EMPLOYEE_AVAILABILITIES, JSON.stringify([]));
  }

  console.log("Dummy data generation finished.");
};

// ====================== Branch API ======================

// API 베이스 URL (환경에 따라 변경 가능)
export const API_BASE_URL = "https://crewezy.epicode.co.kr"; // 끝에 슬래시(/)가 없어야 함

// CORS 이슈 대응을 위한 설정
export const API_CONFIG = {
  USE_PROXY: false, // 프록시 사용 여부
  PROXY_URL: "https://cors-anywhere.herokuapp.com/", // CORS 프록시 URL
  MAX_RETRIES: 3, // 최대 재시도 횟수
  TIMEOUT: 10000, // API 요청 타임아웃 (밀리초)
  FALLBACK_URL: "https://epicode.co.kr", // 대체 도메인 (기본 URL이 동작하지 않을 경우)
};

// API 호출 유틸리티 함수
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
) => {
  try {
    // 기본 헤더 설정
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // 인증 토큰 추가 (있는 경우)
    try {
      const token = localStorage.getItem(LS_KEYS.AUTH_TOKEN);
      if (token) {
        // 토큰 형식 확인
        if (isValidJWTFormat(token)) {
          headers["Authorization"] = `Bearer ${token}`;
        } else {
          console.warn("유효하지 않은 형식의 토큰이 로컬 스토리지에 있습니다.");
          // 토큰을 제거하고 로그인 페이지로 리디렉션
          localStorage.removeItem(LS_KEYS.AUTH_TOKEN);
          throw new Error(
            "인증 토큰이 유효하지 않습니다. 다시 로그인해주세요."
          );
        }
      }
    } catch (tokenError) {
      console.error("토큰 처리 중 오류:", tokenError);
      // 토큰 오류는 API 호출에 영향을 주지 않지만, 로그인이 필요한 API는 실패할 것임
    }

    // endpoint가 슬래시로 시작하는지 확인
    const formattedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

    // API 호출
    let url = `${API_BASE_URL}${formattedEndpoint}`;
    // CORS 프록시 사용 (필요한 경우)
    if (API_CONFIG.USE_PROXY) {
      url = `${API_CONFIG.PROXY_URL}${url}`;
    }

    console.log(`API call to: ${url}`, {
      method: options.method || "GET",
      retry:
        retryCount > 0
          ? `시도 ${retryCount + 1}/${API_CONFIG.MAX_RETRIES + 1}`
          : "첫 시도",
    });

    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const fetchOptions = {
      ...options,
      headers,
      signal: controller.signal,
    };

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // HTML 응답 체크 (404 또는 500 에러시 HTML이 반환될 수 있음)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      console.error(
        `서버가 HTML을 반환했습니다. 상태 코드: ${response.status}`
      );
      const htmlContent = await response.text();
      console.error("HTML 응답 내용:", htmlContent.substring(0, 200) + "...");

      // 404 오류의 경우 재시도 (다른 URL 형식으로)
      if (response.status === 404 && retryCount < API_CONFIG.MAX_RETRIES) {
        // URL 변형 시도 목록
        const urlVariations = [
          // 첫 번째 시도: 슬래시 없는 버전
          endpoint.startsWith("/") ? endpoint.substring(1) : endpoint,

          // 두 번째 시도: API 경로 변형
          endpoint.includes("/api/")
            ? endpoint.replace("/api/", "/")
            : `api${endpoint}`,

          // 세 번째 시도: 전체 URL 형식 (HTTPS)
          `https://crewezy.epicode.co.kr${formattedEndpoint}`,

          // 네 번째 시도: HTTP로 시도
          `http://crewezy.epicode.co.kr${formattedEndpoint}`,

          // 다섯 번째 시도: epicode.co.kr 도메인으로 시도
          `https://epicode.co.kr${formattedEndpoint}`,
        ];

        // 이전 시도와 다른 URL 선택
        const variationIndex = retryCount % urlVariations.length;
        const nextEndpoint = urlVariations[variationIndex];

        console.log(
          `재시도 중 (${retryCount + 1}/${
            API_CONFIG.MAX_RETRIES
          }): ${nextEndpoint}`
        );
        return apiCall(nextEndpoint, options, retryCount + 1);
      }

      throw new Error(
        `서버 오류: ${response.status} - API 엔드포인트가 잘못되었습니다.`
      );
    }

    // 응답이 JSON이 아닌 경우 처리
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("서버 응답이 JSON이 아님:", text.substring(0, 200));
      throw new Error("서버에서 유효하지 않은 응답 형식을 반환했습니다.");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API 요청 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API 호출 오류 (${endpoint}):`, error);

    // 오류 유형별 처리
    if (error instanceof SyntaxError) {
      console.error("JSON 파싱 오류 - 서버에서 HTML이 반환되었을 수 있습니다.");
    } else if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      // CORS 또는 네트워크 오류
      console.error("네트워크 오류 또는 CORS 문제가 발생했습니다.");

      // 재시도 (다른 URL 형식으로)
      if (retryCount < API_CONFIG.MAX_RETRIES) {
        console.log(
          `API 호출 재시도 중 (${retryCount + 1}/${API_CONFIG.MAX_RETRIES})...`
        );

        // URL 변형 시도
        const urlVariations = [
          // 첫 번째 시도: HTTP로 시도
          endpoint.includes("https://")
            ? endpoint.replace("https://", "http://")
            : endpoint,

          // 두 번째 시도: 다른 도메인 형식 시도
          `https://epicode.co.kr/api/branch${
            endpoint.includes("/branch") ? "" : "/branch"
          }${
            endpoint.includes("/create-branch") || endpoint.includes("/workers")
              ? ""
              : endpoint
          }`,
        ];

        const variationIndex = retryCount % urlVariations.length;
        const nextEndpoint = urlVariations[variationIndex];

        return apiCall(nextEndpoint, options, retryCount + 1);
      }

      throw new Error(
        "서버 연결 실패: 네트워크 연결을 확인하거나 CORS 설정이 필요할 수 있습니다."
      );
    } else if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("API 요청 시간 초과");
    }

    throw error;
  }
};

// Branch 생성 API
export interface BranchCreateRequest {
  id?: number;
  name: string;
  adress: string;
  dial_numbers: string;
  basic_cost: string;
  weekly_allowance: boolean;
  images?: string;
  contents?: string;
}

// Branch 생성
export const createBranch = async (data: BranchCreateRequest): Promise<any> => {
  try {
    // API 요청 전에 정확한 형식으로 변환
    const requestData = {
      id: 0,
      name: data.name,
      adress: data.adress,
      dial_numbers: data.dial_numbers,
      basic_cost: data.basic_cost,
      weekly_allowance: data.weekly_allowance === true,
      images: data.images || "",
      contents: data.contents || "",
    };

    console.log("Sending branch creation request:", requestData);
    const url = `${API_BASE_URL}/api/branch/create-branch`;
    console.log("Request URL:", url);

    // JWT 토큰 가져오기
    const authToken = getAuthToken();
    console.log("Auth token 확인됨");

    // 로그인/회원가입과 동일한 URL 구조 사용
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestData),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;

      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // JSON이 아니면 텍스트로 처리
        errorData = { message: errorText || "서버 오류" };
      }

      console.error("API error response:", errorData);

      // 상태 코드에 따른 오류 메시지 처리
      let errorMessage;

      switch (response.status) {
        case 400:
          // 입력 데이터 오류
          if (errorData.message?.includes("중복")) {
            errorMessage =
              "동일한 이름의 지점이 이미 등록되어 있습니다. 다른 이름으로 시도해주세요.";
          } else if (errorData.message?.includes("유효하지 않은")) {
            errorMessage =
              "유효하지 않은 데이터입니다. 입력 정보를 다시 확인해주세요.";
          } else {
            errorMessage = errorData.message || "입력 정보에 오류가 있습니다.";
          }
          break;
        case 401:
          errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
          // 토큰 관련 디버깅 정보 추가
          console.error(
            "Auth 401 error - Token:",
            authToken?.substring(0, 10) + "..."
          );
          break;
        case 403:
          errorMessage = "지점 생성 권한이 없습니다.";
          break;
        case 404:
          errorMessage =
            "API 경로를 찾을 수 없습니다. 서비스 담당자에게 문의해주세요.";
          break;
        case 409:
          errorMessage =
            "동일한 이름의 지점이 이미 등록되어 있습니다. 다른 이름으로 시도해주세요.";
          break;
        case 500:
          errorMessage =
            "서버 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          break;
        default:
          errorMessage =
            errorData.message || `지점 생성 실패 (${response.status})`;
      }

      throw new Error(errorMessage);
    }

    // 빈 응답 처리
    const responseText = await response.text();
    let responseData = {};

    if (responseText && responseText.trim() !== "") {
      try {
        responseData = JSON.parse(responseText);
        console.log("API success response:", responseData);
      } catch (parseError) {
        console.warn("응답을 JSON으로 파싱할 수 없습니다:", responseText);
        // 성공 응답을 가정하고 최소한의 데이터 제공
        responseData = {
          success: true,
          message:
            "지점이 생성되었지만 서버가 상세 정보를 반환하지 않았습니다.",
        };
      }
    } else {
      console.log("서버가 빈 응답을 반환했지만 상태 코드는 성공(200)입니다.");
      // 빈 응답이지만 성공으로 처리
      responseData = {
        success: true,
        message: "지점이 생성되었습니다. (빈 응답)",
      };
    }

    return responseData;
  } catch (error) {
    console.error("Branch creation error:", error);
    throw error;
  }
};

// Branch Worker 생성 API
export interface BranchWorkerRequest {
  branchId: number;
  email: string;
  name: string;
  phoneNums: string;
  roles: string;
  status: string;
  cost: number;
}

// Branch Worker 생성
export const createBranchWorker = async (
  data: BranchWorkerRequest
): Promise<any> => {
  try {
    // API 요청 전에 정확한 형식으로 변환
    const requestData = {
      branchId: data.branchId,
      email: data.email,
      name: data.name,
      phoneNums: data.phoneNums,
      roles: data.roles,
      status: data.status,
      cost: data.cost,
    };

    console.log("Sending worker creation request:", requestData);
    const url = `${API_BASE_URL}/api/branch/workers`;
    console.log("Request URL:", url);

    // JWT 토큰 가져오기
    const authToken = getAuthToken();

    // 로그인/회원가입과 동일한 URL 구조 사용
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestData),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "서버 오류" }));
      console.error("API error response:", errorData);
      throw new Error(
        errorData.message || `근무자 등록 실패 (${response.status})`
      );
    }

    // 빈 응답 처리
    const responseText = await response.text();
    let responseData = {};

    if (responseText && responseText.trim() !== "") {
      try {
        responseData = JSON.parse(responseText);
        console.log("API success response:", responseData);
      } catch (parseError) {
        console.warn("응답을 JSON으로 파싱할 수 없습니다:", responseText);
        // 성공 응답을 가정하고 최소한의 데이터 제공
        responseData = {
          success: true,
          message:
            "근무자가 등록되었지만 서버가 상세 정보를 반환하지 않았습니다.",
        };
      }
    } else {
      console.log("서버가 빈 응답을 반환했지만 상태 코드는 성공(200)입니다.");
      // 빈 응답이지만 성공으로 처리
      responseData = {
        success: true,
        message: "근무자가 등록되었습니다. (빈 응답)",
      };
    }

    return responseData;
  } catch (error) {
    console.error("Branch worker creation error:", error);
    throw error;
  }
};

// Branch Workers 조회 API
interface BranchWorker {
  name: string;
  email: string;
  phoneNums: string;
  roles: string;
  status: string;
  cost: number;
}

// Branch Workers 조회
export const getBranchWorkers = async (
  branchId: number | string
): Promise<BranchWorker[]> => {
  try {
    console.log(`Fetching workers for branch ID: ${branchId}`);
    const url = `${API_BASE_URL}/api/branch/${branchId}/workers`;
    console.log("Request URL:", url);

    // JWT 토큰 가져오기
    const authToken = getAuthToken();

    // GET 요청 생성
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "서버 오류" }));
      console.error("API error response:", errorData);
      throw new Error(
        errorData.message || `근무자 조회 실패 (${response.status})`
      );
    }

    // 응답 처리
    const responseText = await response.text();
    let responseData: BranchWorker[] = [];

    if (responseText && responseText.trim() !== "") {
      try {
        responseData = JSON.parse(responseText);
        console.log("Workers fetched successfully:", responseData);
      } catch (parseError) {
        console.warn("응답을 JSON으로 파싱할 수 없습니다:", responseText);
        // 빈 배열 반환
        responseData = [];
      }
    }

    return responseData;
  } catch (error) {
    console.error("Branch workers fetch error:", error);
    throw error;
  }
};

// API 서버 연결 테스트
export const testAPIConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log(`Testing API connection to ${API_BASE_URL}`);

    // GET 요청으로 API 서버 접근성 테스트
    const url = API_BASE_URL;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3초 타임아웃

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        success: true, // 어떤 응답이든 서버가 살아있다는 의미
        message: `API 서버 연결 성공 (응답 코드: ${response.status})`,
      };
    } catch (primaryError) {
      console.error("기본 URL 연결 실패, 대체 URL 시도:", primaryError);

      // 대체 URL 시도
      if (API_CONFIG.FALLBACK_URL) {
        try {
          console.log(`Trying fallback URL ${API_CONFIG.FALLBACK_URL}`);
          const fallbackResponse = await fetch(API_CONFIG.FALLBACK_URL, {
            method: "GET",
            cache: "no-cache",
            signal: AbortSignal.timeout(3000),
          });

          return {
            success: true,
            message: `기본 API 서버 접속 실패, 대체 서버 연결 성공 (응답 코드: ${fallbackResponse.status})`,
          };
        } catch (fallbackError) {
          console.error("대체 URL도 실패:", fallbackError);
          throw primaryError; // 원래 오류로 돌아가서 처리
        }
      } else {
        throw primaryError;
      }
    }
  } catch (error) {
    console.error("API 서버 연결 테스트 실패:", error);

    let errorMessage = "API 서버에 연결할 수 없습니다.";
    if (error instanceof DOMException && error.name === "AbortError") {
      errorMessage = "API 서버 응답 시간 초과: 서버가 응답하지 않습니다.";
    } else if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      errorMessage =
        "CORS 오류 또는 네트워크 연결 문제: API 서버에 접근할 수 없습니다.";
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// JWT 토큰 가져오기 및 검증하는 유틸리티 함수
export const getAuthToken = (): string => {
  const authToken = localStorage.getItem(LS_KEYS.AUTH_TOKEN);

  if (!authToken || !isValidJWTFormat(authToken)) {
    console.error("Invalid JWT token format:", authToken);
    throw new Error("인증 토큰이 유효하지 않습니다. 다시 로그인해주세요.");
  }

  return authToken;
};
