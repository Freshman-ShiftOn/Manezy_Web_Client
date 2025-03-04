import { Employee, Store, SetupWizardState, Shift } from "../lib/types";

// 로컬 스토리지 키
const LS_KEYS = {
  STORE: "manezy_store",
  EMPLOYEES: "manezy_employees",
  SHIFTS: "manezy_shifts",
  SETUP_COMPLETE: "manezy_setup_complete",
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

    if (!shift.id) {
      console.error("근무 ID가 없습니다");
      return simulateError("근무 ID가 없습니다");
    }

    if (!shift.storeId) {
      console.error("매장 ID가 없습니다");
      // ID가 없을 경우 's1' 기본값 사용
      shift.storeId = "s1";
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
