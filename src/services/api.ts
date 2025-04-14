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
