import {
  Store,
  Employee,
  Availability,
  Shift,
  SubstituteRequest,
  PayrollItem,
} from "./types";

// 목업 데이터 저장소
let mockStores: Store[] = [
  {
    id: "s1",
    name: "카페 성수점",
    address: "서울시 성동구 성수동 123-45",
    phoneNumber: "02-1234-5678",
    baseHourlyRate: 9860, // 기본 시급
    openingHour: "09:00",
    closingHour: "22:00",
  },
];

let mockEmployees: Employee[] = [
  {
    id: "e1",
    name: "김알바",
    phoneNumber: "010-1234-5678",
    email: "alba1@example.com",
    hourlyRate: 9860,
    role: "바리스타",
    status: "active",
    bankAccount: "국민은행 123-456-789012",
    birthDate: "2000-01-01",
  },
  {
    id: "e2",
    name: "이직원",
    phoneNumber: "010-8765-4321",
    email: "alba2@example.com",
    hourlyRate: 10000,
    role: "홀서빙",
    status: "active",
    bankAccount: "신한은행 987-654-321098",
    birthDate: "1998-05-15",
  },
  {
    id: "e3",
    name: "박신입",
    phoneNumber: "010-4567-8901",
    hourlyRate: 9860,
    status: "pending",
  },
];

// 알바생들의 가능 근무시간
let mockAvailabilities: Availability[] = [
  {
    employeeId: "e1",
    dayOfWeek: 1, // 월요일
    startTime: "09:00",
    endTime: "15:00",
    isRecurring: true,
  },
  {
    employeeId: "e1",
    dayOfWeek: 3, // 수요일
    startTime: "09:00",
    endTime: "15:00",
    isRecurring: true,
  },
  {
    employeeId: "e1",
    dayOfWeek: 5, // 금요일
    startTime: "09:00",
    endTime: "15:00",
    isRecurring: true,
  },
  {
    employeeId: "e2",
    dayOfWeek: 2, // 화요일
    startTime: "10:00",
    endTime: "18:00",
    isRecurring: true,
  },
  {
    employeeId: "e2",
    dayOfWeek: 4, // 목요일
    startTime: "10:00",
    endTime: "18:00",
    isRecurring: true,
  },
  {
    employeeId: "e2",
    dayOfWeek: 6, // 토요일
    startTime: "12:00",
    endTime: "20:00",
    isRecurring: true,
  },
];

// 근무 스케줄
let mockShifts: Shift[] = [
  {
    id: "sh1",
    storeId: "s1",
    title: "오픈 근무",
    start: "2025-03-10T09:00:00",
    end: "2025-03-10T15:00:00",
    employeeIds: ["e1"],
    isRecurring: true,
    recurringPattern: {
      frequency: "weekly",
      daysOfWeek: [1, 3, 5], // 월, 수, 금
      endDate: "2025-06-30",
    },
  },
  {
    id: "sh2",
    storeId: "s1",
    title: "마감 근무",
    start: "2025-03-10T15:00:00",
    end: "2025-03-10T22:00:00",
    employeeIds: ["e2"],
    isRecurring: true,
    recurringPattern: {
      frequency: "weekly",
      daysOfWeek: [1, 3, 5], // 월, 수, 금
      endDate: "2025-06-30",
    },
  },
  {
    id: "sh3",
    storeId: "s1",
    title: "주말 근무",
    start: "2025-03-14T12:00:00",
    end: "2025-03-14T20:00:00",
    employeeIds: ["e1", "e2"], // 두 명 동시 근무
    isRecurring: true,
    recurringPattern: {
      frequency: "weekly",
      daysOfWeek: [5], // 금요일
      endDate: "2025-06-30",
    },
  },
];

// 대타 요청
let mockSubstituteRequests: SubstituteRequest[] = [
  {
    id: "sr1",
    shiftId: "sh1",
    requesterId: "e1",
    status: "pending",
    reason: "개인 사정으로 근무 불가",
    createdAt: "2025-03-05T10:30:00",
    updatedAt: "2025-03-05T10:30:00",
  },
];

// 급여 항목
let mockPayrollItems: PayrollItem[] = [
  {
    id: "p1",
    employeeId: "e1",
    storeId: "s1",
    year: 2025,
    month: 2, // 3월
    workedHours: 72,
    baseAmount: 709920, // 72시간 * 9860원
    additionalPay: 50000, // 추가 수당
    deduction: 0,
    tax: 35000,
    finalAmount: 724920, // 총액
    isPaid: false,
    note: "",
  },
  {
    id: "p2",
    employeeId: "e2",
    storeId: "s1",
    year: 2025,
    month: 2, // 3월
    workedHours: 64,
    baseAmount: 640000, // 64시간 * 10000원
    additionalPay: 0,
    deduction: 20000, // 공제
    tax: 31000,
    finalAmount: 589000, // 총액
    isPaid: false,
    note: "지각 공제 20,000원",
  },
];

// 지연 시뮬레이션
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// API 서비스
export const mockApi = {
  // 지점(매장) API
  stores: {
    // 지점 목록 조회
    async getStores(): Promise<Store[]> {
      await delay(300); // API 지연 시뮬레이션
      return [...mockStores];
    },

    // 지점 상세 조회
    async getStore(id: string): Promise<Store | null> {
      await delay(200);
      const store = mockStores.find((s) => s.id === id);
      return store ? { ...store } : null;
    },

    // 새 지점 생성
    async createStore(storeData: Omit<Store, "id">): Promise<Store> {
      await delay(500);
      const newStore: Store = {
        ...storeData,
        id: `s${mockStores.length + 1}`,
      };
      mockStores.push(newStore);
      return { ...newStore };
    },

    // 지점 정보 수정
    async updateStore(
      id: string,
      storeData: Partial<Store>
    ): Promise<Store | null> {
      await delay(400);
      const index = mockStores.findIndex((s) => s.id === id);
      if (index === -1) return null;

      mockStores[index] = { ...mockStores[index], ...storeData };
      return { ...mockStores[index] };
    },

    // 지점 삭제
    async deleteStore(id: string): Promise<boolean> {
      await delay(300);
      const initialLength = mockStores.length;
      mockStores = mockStores.filter((s) => s.id !== id);
      return mockStores.length < initialLength;
    },
  },

  // 알바생(직원) API
  employees: {
    // 알바생 목록 조회
    async getEmployees(storeId?: string): Promise<Employee[]> {
      await delay(300);
      // 실제 API에서는 storeId로 필터링 할 수 있을 것임
      return [...mockEmployees];
    },

    // 알바생 상세 조회
    async getEmployee(id: string): Promise<Employee | null> {
      await delay(200);
      const employee = mockEmployees.find((e) => e.id === id);
      return employee ? { ...employee } : null;
    },

    // 새 알바생 추가
    async createEmployee(
      employeeData: Omit<Employee, "id">
    ): Promise<Employee> {
      await delay(500);
      const newEmployee: Employee = {
        ...employeeData,
        id: `e${mockEmployees.length + 1}`,
      };
      mockEmployees.push(newEmployee);
      return { ...newEmployee };
    },

    // 알바생 정보 수정
    async updateEmployee(
      id: string,
      employeeData: Partial<Employee>
    ): Promise<Employee | null> {
      await delay(400);
      const index = mockEmployees.findIndex((e) => e.id === id);
      if (index === -1) return null;

      mockEmployees[index] = { ...mockEmployees[index], ...employeeData };
      return { ...mockEmployees[index] };
    },

    // 알바생 삭제
    async deleteEmployee(id: string): Promise<boolean> {
      await delay(300);
      const initialLength = mockEmployees.length;
      mockEmployees = mockEmployees.filter((e) => e.id !== id);
      return mockEmployees.length < initialLength;
    },

    // 알바생 상태 변경 (승인, 비활성화 등)
    async changeEmployeeStatus(
      id: string,
      status: Employee["status"]
    ): Promise<Employee | null> {
      await delay(300);
      const index = mockEmployees.findIndex((e) => e.id === id);
      if (index === -1) return null;

      mockEmployees[index].status = status;
      return { ...mockEmployees[index] };
    },
  },

  // 가능 근무시간 API
  availability: {
    // 알바생별 가능 근무시간 조회
    async getAvailabilityByEmployee(
      employeeId: string
    ): Promise<Availability[]> {
      await delay(300);
      return mockAvailabilities
        .filter((a) => a.employeeId === employeeId)
        .map((a) => ({ ...a }));
    },

    // 가능 근무시간 추가
    async createAvailability(
      data: Omit<Availability, "id">
    ): Promise<Availability> {
      await delay(400);
      const newAvailability: Availability = {
        ...data,
      };
      mockAvailabilities.push(newAvailability);
      return { ...newAvailability };
    },

    // 가능 근무시간 수정
    async updateAvailability(
      employeeId: string,
      dayOfWeek: number,
      data: Partial<Availability>
    ): Promise<Availability | null> {
      await delay(300);
      const index = mockAvailabilities.findIndex(
        (a) => a.employeeId === employeeId && a.dayOfWeek === dayOfWeek
      );
      if (index === -1) return null;

      mockAvailabilities[index] = { ...mockAvailabilities[index], ...data };
      return { ...mockAvailabilities[index] };
    },

    // 가능 근무시간 삭제
    async deleteAvailability(
      employeeId: string,
      dayOfWeek: number
    ): Promise<boolean> {
      await delay(300);
      const initialLength = mockAvailabilities.length;
      mockAvailabilities = mockAvailabilities.filter(
        (a) => !(a.employeeId === employeeId && a.dayOfWeek === dayOfWeek)
      );
      return mockAvailabilities.length < initialLength;
    },
  },

  // 근무 스케줄 API
  shifts: {
    // 스케줄 목록 조회 (날짜 범위로)
    async getShifts(
      storeId: string,
      startDate: string,
      endDate: string
    ): Promise<Shift[]> {
      await delay(400);
      return mockShifts
        .filter((s) => s.storeId === storeId)
        .map((s) => ({ ...s }));
    },

    // 스케줄 상세 조회
    async getShift(id: string): Promise<Shift | null> {
      await delay(200);
      const shift = mockShifts.find((s) => s.id === id);
      return shift ? { ...shift } : null;
    },

    // 새 스케줄 생성
    async createShift(shiftData: Omit<Shift, "id">): Promise<Shift> {
      await delay(500);
      const newShift: Shift = {
        ...shiftData,
        id: `sh${mockShifts.length + 1}`,
      };
      mockShifts.push(newShift);
      return { ...newShift };
    },

    // 스케줄 수정
    async updateShift(
      id: string,
      shiftData: Partial<Shift>
    ): Promise<Shift | null> {
      await delay(400);
      const index = mockShifts.findIndex((s) => s.id === id);
      if (index === -1) return null;

      mockShifts[index] = { ...mockShifts[index], ...shiftData };
      return { ...mockShifts[index] };
    },

    // 스케줄 삭제
    async deleteShift(id: string): Promise<boolean> {
      await delay(300);
      const initialLength = mockShifts.length;
      mockShifts = mockShifts.filter((s) => s.id !== id);
      return mockShifts.length < initialLength;
    },
  },

  // 대타 요청 API
  substituteRequests: {
    // 대타 요청 목록
    async getSubstituteRequests(
      storeId: string,
      status?: SubstituteRequest["status"]
    ): Promise<SubstituteRequest[]> {
      await delay(300);
      let requests = mockSubstituteRequests.map((r) => ({ ...r }));

      // 관련 근무가 해당 지점인 경우만 필터링
      requests = requests.filter((r) => {
        const shift = mockShifts.find((s) => s.id === r.shiftId);
        return shift && shift.storeId === storeId;
      });

      // 상태로 필터링 (지정된 경우)
      if (status) {
        requests = requests.filter((r) => r.status === status);
      }

      return requests;
    },

    // 새 대타 요청 생성
    async createSubstituteRequest(
      requestData: Omit<SubstituteRequest, "id" | "createdAt" | "updatedAt">
    ): Promise<SubstituteRequest> {
      await delay(500);
      const now = new Date().toISOString();
      const newRequest: SubstituteRequest = {
        ...requestData,
        id: `sr${mockSubstituteRequests.length + 1}`,
        createdAt: now,
        updatedAt: now,
      };
      mockSubstituteRequests.push(newRequest);
      return { ...newRequest };
    },

    // 대타 요청 상태 변경 (승인, 거절 등)
    async updateSubstituteRequestStatus(
      id: string,
      status: SubstituteRequest["status"],
      substituteId?: string
    ): Promise<SubstituteRequest | null> {
      await delay(400);
      const index = mockSubstituteRequests.findIndex((r) => r.id === id);
      if (index === -1) return null;

      mockSubstituteRequests[index].status = status;
      if (substituteId) {
        mockSubstituteRequests[index].substituteId = substituteId;
      }
      mockSubstituteRequests[index].updatedAt = new Date().toISOString();

      return { ...mockSubstituteRequests[index] };
    },
  },

  // 급여 관리 API
  payroll: {
    // 급여 목록 조회
    async getPayrollItems(
      storeId: string,
      year: number,
      month: number
    ): Promise<PayrollItem[]> {
      await delay(300);
      return mockPayrollItems
        .filter(
          (p) => p.storeId === storeId && p.year === year && p.month === month
        )
        .map((p) => ({ ...p }));
    },

    // 급여 항목 생성/수정
    async upsertPayrollItem(
      payrollData: Omit<PayrollItem, "id">
    ): Promise<PayrollItem> {
      await delay(500);

      const existingIndex = mockPayrollItems.findIndex(
        (p) =>
          p.employeeId === payrollData.employeeId &&
          p.storeId === payrollData.storeId &&
          p.year === payrollData.year &&
          p.month === payrollData.month
      );

      if (existingIndex !== -1) {
        // 기존 항목 업데이트
        mockPayrollItems[existingIndex] = {
          ...mockPayrollItems[existingIndex],
          ...payrollData,
        };
        return { ...mockPayrollItems[existingIndex] };
      } else {
        // 새 항목 생성
        const newPayrollItem: PayrollItem = {
          ...payrollData,
          id: `p${mockPayrollItems.length + 1}`,
        };
        mockPayrollItems.push(newPayrollItem);
        return { ...newPayrollItem };
      }
    },

    // 급여 지급 상태 변경
    async updatePaymentStatus(
      id: string,
      isPaid: boolean
    ): Promise<PayrollItem | null> {
      await delay(300);
      const index = mockPayrollItems.findIndex((p) => p.id === id);
      if (index === -1) return null;

      mockPayrollItems[index].isPaid = isPaid;
      return { ...mockPayrollItems[index] };
    },
  },
};

export default mockApi;
