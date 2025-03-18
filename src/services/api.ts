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

// 더미 데이터 생성
export const generateDummyData = (): void => {
  try {
    // 메가커피 서울대점 생성
    const megacoffeeStore: Store = {
      id: "s1",
      name: "메가커피 서울대점",
      address: "서울시 관악구 봉천동 123-45 1층",
      phoneNumber: "02-1234-5678",
      baseHourlyRate: 9860, // 2023년도 기준 최저시급
      openingHour: "08:00",
      closingHour: "22:00",
    };
    localStorage.setItem(LS_KEYS.STORE, JSON.stringify(megacoffeeStore));

    // 설정 완료 표시
    localStorage.setItem(LS_KEYS.SETUP_COMPLETE, "true");

    // 알바생 9명 생성
    const dummyEmployees: Employee[] = [
      {
        id: "emp-1",
        name: "박민우",
        phoneNumber: "010-1111-2222",
        email: "minwoo@example.com",
        hourlyRate: 9860,
        role: "매니저",
        status: "active",
        bankAccount: "국민은행 123-456-789012",
        birthDate: "1996-03-15",
      },
      {
        id: "emp-2",
        name: "이서연",
        phoneNumber: "010-2222-3333",
        email: "seoyeon@example.com",
        hourlyRate: 9860,
        role: "주간 알바",
        status: "active",
        bankAccount: "신한은행 123-456-789012",
        birthDate: "2000-05-22",
      },
      {
        id: "emp-3",
        name: "최준영",
        phoneNumber: "010-3333-4444",
        email: "junyoung@example.com",
        hourlyRate: 9860,
        role: "주말 알바",
        status: "active",
        bankAccount: "우리은행 123-456-789012",
        birthDate: "2001-11-10",
      },
      {
        id: "emp-4",
        name: "한수정",
        phoneNumber: "010-4444-5555",
        email: "sujeong@example.com",
        hourlyRate: 10000, // 경력자라 시급 더 높음
        role: "주간 알바",
        status: "active",
        bankAccount: "하나은행 123-456-789012",
        birthDate: "1999-07-25",
      },
      {
        id: "emp-5",
        name: "정도윤",
        phoneNumber: "010-5555-6666",
        email: "doyoon@example.com",
        hourlyRate: 9860,
        role: "주말 알바",
        status: "active",
        bankAccount: "기업은행 123-456-789012",
        birthDate: "2002-01-30",
      },
      {
        id: "emp-6",
        name: "강하은",
        phoneNumber: "010-6666-7777",
        email: "haeun@example.com",
        hourlyRate: 9860,
        role: "오픈 알바",
        status: "active",
        bankAccount: "농협 123-456-789012",
        birthDate: "1997-09-12",
      },
      {
        id: "emp-7",
        name: "윤준호",
        phoneNumber: "010-7777-8888",
        email: "junho@example.com",
        hourlyRate: 9860,
        role: "마감 알바",
        status: "active",
        bankAccount: "신한은행 123-456-789012",
        birthDate: "2000-12-05",
      },
      {
        id: "emp-8",
        name: "김지은",
        phoneNumber: "010-8888-9999",
        email: "jieun@example.com",
        hourlyRate: 10200, // 경력 더 많음
        role: "바리스타",
        status: "active",
        bankAccount: "국민은행 123-456-789012",
        birthDate: "1998-04-18",
      },
      {
        id: "emp-9",
        name: "송민석",
        phoneNumber: "010-9999-0000",
        email: "minseok@example.com",
        hourlyRate: 9860,
        role: "주말 알바",
        status: "active",
        bankAccount: "우리은행 123-456-789012",
        birthDate: "1998-10-20",
      },
    ];
    localStorage.setItem(LS_KEYS.EMPLOYEES, JSON.stringify(dummyEmployees));

    // 현재 날짜를 기준으로 이번 주 월요일 구하기
    const today = new Date();
    const currentDay = today.getDay(); // 0: 일요일, 1: 월요일, ...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // 일요일이면 전주 월요일로
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + mondayOffset);
    thisMonday.setHours(0, 0, 0, 0);

    // 더미 근무 일정 생성
    const dummyShifts: Shift[] = [];

    // 다음 2주 동안의 더미 근무 일정 생성
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const shiftDate = new Date(thisMonday);
      shiftDate.setDate(thisMonday.getDate() + dayOffset);

      // 오픈 시프트 (08:00 - 14:00)
      const morningDate = new Date(shiftDate);
      morningDate.setHours(8, 0, 0, 0);
      const morningEndDate = new Date(shiftDate);
      morningEndDate.setHours(14, 0, 0, 0);

      dummyShifts.push({
        id: `shift-morning-${dayOffset}`,
        storeId: "s1",
        title: "오픈 시프트",
        start: morningDate.toISOString(),
        end: morningEndDate.toISOString(),
        // 평일에는 주간알바 + 오픈알바, 주말에는 주말알바 + 오픈알바
        employeeIds:
          dayOffset % 7 === 0 || dayOffset % 7 === 6
            ? ["emp-3", "emp-6"]
            : ["emp-4", "emp-6"],
        note: "오픈 준비 및 아침 피크타임 담당",
        isRecurring: false,
      });

      // 미들 시프트 (13:00 - 18:00)
      const middleDate = new Date(shiftDate);
      middleDate.setHours(13, 0, 0, 0);
      const middleEndDate = new Date(shiftDate);
      middleEndDate.setHours(18, 0, 0, 0);

      dummyShifts.push({
        id: `shift-middle-${dayOffset}`,
        storeId: "s1",
        title: "미들 시프트",
        start: middleDate.toISOString(),
        end: middleEndDate.toISOString(),
        // 평일에는 매니저 + 바리스타, 주말에는 주말알바 + 바리스타
        employeeIds:
          dayOffset % 7 === 0 || dayOffset % 7 === 6
            ? ["emp-5", "emp-8"]
            : ["emp-1", "emp-8"],
        note: "점심 피크타임 및 재고 관리",
        isRecurring: false,
      });

      // 클로징 시프트 (17:00 - 22:00)
      const eveningDate = new Date(shiftDate);
      eveningDate.setHours(17, 0, 0, 0);
      const eveningEndDate = new Date(shiftDate);
      eveningEndDate.setHours(22, 0, 0, 0);

      dummyShifts.push({
        id: `shift-evening-${dayOffset}`,
        storeId: "s1",
        title: "마감 시프트",
        start: eveningDate.toISOString(),
        end: eveningEndDate.toISOString(),
        // 평일에는 주간알바 + 마감알바, 주말에는 주말알바 + 마감알바
        employeeIds:
          dayOffset % 7 === 0 || dayOffset % 7 === 6
            ? ["emp-9", "emp-7"]
            : ["emp-2", "emp-7"],
        note: "저녁 피크타임 및 마감 담당",
        isRecurring: false,
      });
    }

    localStorage.setItem(LS_KEYS.SHIFTS, JSON.stringify(dummyShifts));

    // 더미 대타 요청 생성
    const nextWeekMonday = new Date(thisMonday);
    nextWeekMonday.setDate(thisMonday.getDate() + 7);

    const dummySubRequests: SubstituteRequest[] = [
      {
        id: "sub-req-1",
        shiftId: `shift-morning-7`,
        requesterId: "emp-3", // 최준영
        status: "pending",
        reason: "가족 행사로 인해 근무가 어렵습니다.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sub-req-2",
        shiftId: `shift-middle-8`,
        requesterId: "emp-8", // 김지은
        substituteId: "emp-4", // 한수정
        status: "accepted",
        reason: "병원 검진으로 인해 근무가 어렵습니다.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sub-req-3",
        shiftId: `shift-evening-5`,
        requesterId: "emp-2", // 이서연
        status: "pending",
        reason: "학교 시험으로 인해 근무가 어렵습니다.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(
      LS_KEYS.SUBSTITUTE_REQUESTS,
      JSON.stringify(dummySubRequests)
    );

    // 더미 스케줄 변경 요청 생성
    const nextSundayDate = new Date(thisMonday);
    nextSundayDate.setDate(thisMonday.getDate() + 13);

    const dummyScheduleRequests: ScheduleChangeRequest[] = [
      {
        id: "sch-req-1",
        employeeId: "emp-4", // 한수정
        shiftId: `shift-morning-3`,
        requestType: "timeChange",
        status: "pending",
        currentStart: new Date(
          thisMonday.getTime() + 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000
        ).toISOString(),
        currentEnd: new Date(
          thisMonday.getTime() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000
        ).toISOString(),
        requestedStart: new Date(
          thisMonday.getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
        ).toISOString(),
        requestedEnd: new Date(
          thisMonday.getTime() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000
        ).toISOString(),
        reason: "오전에 병원 진료가 있어 시간을 조정하고 싶습니다.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sch-req-2",
        employeeId: "emp-5", // 정도윤
        shiftId: `shift-middle-12`,
        requestType: "dateChange",
        status: "pending",
        currentStart: new Date(
          thisMonday.getTime() + 12 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000
        ).toISOString(),
        currentEnd: new Date(
          thisMonday.getTime() + 12 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000
        ).toISOString(),
        requestedStart: new Date(
          thisMonday.getTime() + 11 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000
        ).toISOString(),
        requestedEnd: new Date(
          thisMonday.getTime() + 11 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000
        ).toISOString(),
        reason: "주말에 집안 행사가 있어 금요일로 변경하고 싶습니다.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(
      LS_KEYS.SCHEDULE_CHANGE_REQUESTS,
      JSON.stringify(dummyScheduleRequests)
    );

    // 더미 근무 승인 요청 생성
    const dummyApprovalRequests: ShiftApprovalRequest[] = [
      {
        id: "app-req-1",
        employeeId: "emp-7", // 윤준호
        shiftId: `shift-evening-1`,
        status: "pending",
        submittedTime: new Date().toISOString(),
        actualStart: new Date(
          thisMonday.getTime() +
            1 * 24 * 60 * 60 * 1000 +
            17 * 60 * 5 * 60 * 1000
        ).toISOString(), // 5분 늦음
        actualEnd: new Date(
          thisMonday.getTime() +
            1 * 24 * 60 * 60 * 1000 +
            22 * 60 * 60 * 1000 +
            10 * 60 * 1000
        ).toISOString(), // 10분 늦음
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "app-req-2",
        employeeId: "emp-6", // 강하은
        shiftId: `shift-morning-2`,
        status: "pending",
        submittedTime: new Date().toISOString(),
        actualStart: new Date(
          thisMonday.getTime() +
            2 * 24 * 60 * 60 * 1000 +
            7 * 60 * 55 * 60 * 1000
        ).toISOString(), // 5분 일찍 옴
        actualEnd: new Date(
          thisMonday.getTime() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000
        ).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(
      LS_KEYS.SHIFT_APPROVAL_REQUESTS,
      JSON.stringify(dummyApprovalRequests)
    );

    // 더미 알림 생성
    const dummyNotifications: EmployeeNotification[] = [
      {
        id: "notif-1",
        employeeId: "emp-8", // 김지은
        type: "substituteRequest",
        title: "대타 요청이 수락되었습니다",
        message: "한수정님이 귀하의 대타 요청을 수락했습니다.",
        read: false,
        relatedEntityId: "sub-req-2",
        createdAt: new Date().toISOString(),
      },
      {
        id: "notif-2",
        employeeId: "emp-4", // 한수정
        type: "substituteRequest",
        title: "대타 요청 수락 완료",
        message: "김지은님의 대타 요청을 수락했습니다.",
        read: true,
        relatedEntityId: "sub-req-2",
        createdAt: new Date().toISOString(),
      },
      {
        id: "notif-3",
        employeeId: "emp-6", // 강하은
        type: "scheduleChange",
        title: "근무 일정이 변경되었습니다",
        message: "다음 주 화요일 근무 일정이 업데이트 되었습니다.",
        read: false,
        relatedEntityId: `shift-morning-9`,
        createdAt: new Date().toISOString(),
      },
      {
        id: "notif-4",
        employeeId: "emp-3", // 최준영
        type: "announcement",
        title: "주말 근무 알림",
        message: "이번 주 일요일 오픈 시프트가 예정되어 있습니다.",
        read: false,
        relatedEntityId: `shift-morning-6`,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(
      LS_KEYS.EMPLOYEE_NOTIFICATIONS,
      JSON.stringify(dummyNotifications)
    );

    // 더미 가능 시간 생성
    const dummyAvailabilities: EmployeeAvailability[] = [];

    // 각 직원별 가능 시간 설정
    // 김지은 (바리스타) - 경력직, 오전/오후 선호
    for (let day = 0; day <= 6; day++) {
      // 주중
      if (day >= 1 && day <= 5) {
        dummyAvailabilities.push({
          employeeId: "emp-8", // 김지은
          dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          startTime: "10:00",
          endTime: "19:00",
          isRecurring: true,
          preference: "preferred",
          exceptionDates: [],
        });
      }
      // 주말
      else {
        dummyAvailabilities.push({
          employeeId: "emp-8", // 김지은
          dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          startTime: "10:00",
          endTime: "19:00",
          isRecurring: true,
          preference: "available",
          exceptionDates: [],
        });
      }
    }

    // 한수정 (주간 알바) - 경력직, 주중 오전 선호
    for (let day = 0; day <= 6; day++) {
      // 주중
      if (day >= 1 && day <= 5) {
        dummyAvailabilities.push({
          employeeId: "emp-4", // 한수정
          dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          startTime: "08:00",
          endTime: "17:00",
          isRecurring: true,
          preference: "preferred",
          exceptionDates: [],
        });
      }
      // 주말
      else {
        dummyAvailabilities.push({
          employeeId: "emp-4", // 한수정
          dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          startTime: "09:00",
          endTime: "15:00",
          isRecurring: true,
          preference: "available",
          exceptionDates: [],
        });
      }
    }

    // 나머지 직원들 가능 시간 설정
    dummyEmployees.forEach((emp) => {
      // 이미 설정한 김지은, 한수정 제외
      if (emp.id === "emp-8" || emp.id === "emp-4") {
        return;
      }

      // 요일별 가능 시간 (0: 일요일, 1: 월요일, ...)
      for (let day = 0; day <= 6; day++) {
        // 주말(토, 일)과 평일 다르게 설정
        let preference: "preferred" | "available" | "unavailable";
        let startTime = "08:00";
        let endTime = "22:00";

        if (emp.role === "주말 알바") {
          // 주말 알바는 주말에 preferred, 평일에 unavailable
          preference = day === 0 || day === 6 ? "preferred" : "unavailable";
        } else if (emp.role === "주간 알바") {
          // 주간 알바는 평일 낮에 preferred
          preference = day >= 1 && day <= 5 ? "preferred" : "available";
          startTime = "08:00";
          endTime = "17:00";
        } else if (emp.role === "저녁 알바" || emp.role === "마감 알바") {
          // 저녁/마감 알바는 저녁에 preferred
          preference = day >= 1 && day <= 5 ? "preferred" : "available";
          startTime = "17:00";
          endTime = "22:00";
        } else if (emp.role === "오픈 알바") {
          // 오픈 알바는 아침에 preferred
          preference = day >= 1 && day <= 5 ? "preferred" : "available";
          startTime = "08:00";
          endTime = "14:00";
        } else if (emp.role === "매니저") {
          // 매니저는 모든 시간대 available
          preference = "available";
        } else {
          // 기본값
          preference =
            day >= 1 && day <= 5
              ? "available"
              : Math.random() > 0.5
              ? "available"
              : "unavailable";
        }

        dummyAvailabilities.push({
          employeeId: emp.id,
          dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          startTime,
          endTime,
          isRecurring: true,
          preference,
          exceptionDates: [],
        });
      }
    });

    localStorage.setItem(
      LS_KEYS.EMPLOYEE_AVAILABILITIES,
      JSON.stringify(dummyAvailabilities)
    );

    console.log("더미 데이터 생성 완료");
  } catch (error) {
    console.error("더미 데이터 생성 오류:", error);
  }
};
