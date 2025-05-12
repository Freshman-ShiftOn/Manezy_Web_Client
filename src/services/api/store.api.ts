import { apiClient } from './client';
import { Store, SetupWizardState, Employee, Shift, EmployeeNotification, ScheduleChangeRequest, ShiftApprovalRequest, SubstituteRequest, EmployeeAvailability, SimpleStore } from '../../lib/types';
import { LS_KEYS } from './constants';

// export interface Store {
//   id: string;
//   name: string;
//   address: string;
//   phoneNumber: string;
//   baseHourlyRate: number; // 기본 시급
//   openingHour: string; // '09:00'
//   closingHour: string; // '22:00'
//   weeklyHolidayHoursThreshold?: number; // 주휴수당 계산 기준 시간 (주당) - Optional 추가
//   // 추가 정보는 필요에 따라 확장
// }

export const storeApi = {
    // 매장 관련
    createStore: async (data: SetupWizardState): Promise<Store> => {
        const requestBody = {
            name: data.storeInfo.name,
            adress: data.storeInfo.address,
            dial_numbers: data.storeInfo.phoneNumber,
            basic_cost: data.storeInfo.baseHourlyRate.toString(),
            weekly_allowance: data.storeInfo.weeklyHolidayHoursThreshold?.toString() || "15",
            images: "", // 기본값으로 빈 문자열
            contents: "" // 기본값으로 빈 문자열
        };
        
        console.log("createStore 요청:", {
            url: '/branch/create-branch',
            method: 'POST',
            headers: apiClient.defaults.headers,
            body: requestBody
        });

        const response = await apiClient.post('/branch/create-branch', requestBody);
        
        console.log("createStore 응답: ", response.data);

        // API 응답을 Store 타입으로 변환
        const storeData: Store = {
            id: response.data.id.toString(),
            name: response.data.name,
            address: response.data.adress,
            phoneNumber: response.data.dial_numbers,
            baseHourlyRate: parseInt(response.data.basic_cost),
            openingHour: data.workingHours.openingHour,
            closingHour: data.workingHours.closingHour,
            weeklyHolidayHoursThreshold: parseInt(response.data.weekly_allowance)
        };
        
        localStorage.setItem(LS_KEYS.STORE, JSON.stringify(storeData));
        localStorage.setItem(LS_KEYS.SETUP_COMPLETE, "true");
        
        return storeData;
    },

    // 가입한 매장 목록 조회
    getMyStores: async (): Promise<SimpleStore[]> => {
        try {
            console.log("getMyStores 요청:", {
                url: '/branch/list',
                method: 'GET',
                headers: apiClient.defaults.headers
            });

            const response = await apiClient.get('/branch/list');
            console.log("getMyStores 응답: ", response.data);

            // 매장이 1개 이상이면 첫 번째 매장 정보를 localStorage에 저장
            if (Array.isArray(response.data) && response.data.length > 0) {
                const firstStore = response.data[0];
                localStorage.setItem("selectedBranchId", firstStore.id.toString());
                localStorage.setItem("selectedBranchName", firstStore.name);
            }

            return response.data;
        } catch (error) {
            console.error('Failed to get my stores:', error);
            return [];
        }
    },

    // 현재 선택된 매장 정보 조회
    getStore: async (): Promise<Store | null> => {
        try {
            const branchId = localStorage.getItem("selectedBranchId");
            if (!branchId) {
                console.error("No branchId found in localStorage");
                return null;
            }
            const response = await apiClient.get(`/branch/${branchId}/profile`);
            return response.data;
        } catch (error) {
            console.error('Failed to get store info:', error);
            return null;
        }
    },

    // 매장 정보 수정
    updateStore: async (storeId: string, data: Partial<Store>): Promise<Store> => {
        const response = await apiClient.put(`/stores/${storeId}`, data);
        return response.data;
    },

    // 매장 삭제
    deleteStore: async (storeId: string): Promise<void> => {
        await apiClient.delete(`/stores/${storeId}`);
    },

    // 초기 설정 완료 여부 확인
    hasInitialSetup: async (): Promise<boolean> => {
        try {
        const response = await apiClient.get('/branch/list');
        return (response.data.length > 0)? true : false;
        } catch (error) {
        return false;
        }
    },

    // 직원 관련
    getEmployees: async (): Promise<Employee[]> => {
        const response = await apiClient.get('/employees');
        return response.data;
    },

    addEmployee: async (employee: Partial<Employee>): Promise<Employee> => {
        const response = await apiClient.post('/employees', employee);
        return response.data;
    },

    updateEmployee: async (employeeId: string, data: Partial<Employee>): Promise<Employee> => {
        const response = await apiClient.put(`/employees/${employeeId}`, data);
        return response.data;
    },

    deleteEmployee: async (employeeId: string): Promise<void> => {
        await apiClient.delete(`/employees/${employeeId}`);
    },

    // 근무 관련
    getShifts: async (): Promise<Shift[]> => {
        const response = await apiClient.get('/shifts');
        return response.data;
    },

    saveShift: async (shift: Partial<Shift>): Promise<Shift> => {
        const response = await apiClient.post('/shifts', shift);
        return response.data;
    },

    deleteShift: async (shiftId: string): Promise<void> => {
        await apiClient.delete(`/shifts/${shiftId}`);
    },

    // 알림 관련
    getEmployeeNotifications: async (): Promise<EmployeeNotification[]> => {
        const response = await apiClient.get('/notifications');
        return response.data;
    },

    createNotification: async (notification: Partial<EmployeeNotification>): Promise<EmployeeNotification> => {
        const response = await apiClient.post('/notifications', notification);
        return response.data;
    },

    markNotificationAsRead: async (notificationId: string): Promise<void> => {
        await apiClient.put(`/notifications/${notificationId}/read`);
    },

    // 근무 변경 요청 관련
    getScheduleChangeRequests: async (): Promise<ScheduleChangeRequest[]> => {
        const response = await apiClient.get('/schedule-change-requests');
        return response.data;
    },

    createScheduleChangeRequest: async (request: Partial<ScheduleChangeRequest>): Promise<ScheduleChangeRequest> => {
        const response = await apiClient.post('/schedule-change-requests', request);
        return response.data;
    },

    updateScheduleChangeRequest: async (requestId: string, data: Partial<ScheduleChangeRequest>): Promise<ScheduleChangeRequest> => {
        const response = await apiClient.put(`/schedule-change-requests/${requestId}`, data);
        return response.data;
    },

    // 근무 승인 요청 관련
    getShiftApprovalRequests: async (): Promise<ShiftApprovalRequest[]> => {
        const response = await apiClient.get('/shift-approval-requests');
        return response.data;
    },

    createShiftApprovalRequest: async (request: Partial<ShiftApprovalRequest>): Promise<ShiftApprovalRequest> => {
        const response = await apiClient.post('/shift-approval-requests', request);
        return response.data;
    },

    updateShiftApprovalRequest: async (requestId: string, data: Partial<ShiftApprovalRequest>): Promise<ShiftApprovalRequest> => {
        const response = await apiClient.put(`/shift-approval-requests/${requestId}`, data);
        return response.data;
    },

    // 대체 근무 요청 관련
    getSubstituteRequests: async (): Promise<SubstituteRequest[]> => {
        const response = await apiClient.get('/substitute-requests');
        return response.data;
    },

    createSubstituteRequest: async (request: Partial<SubstituteRequest>): Promise<SubstituteRequest> => {
        const response = await apiClient.post('/substitute-requests', request);
        return response.data;
    },

    updateSubstituteRequest: async (requestId: string, data: Partial<SubstituteRequest>): Promise<SubstituteRequest> => {
        const response = await apiClient.put(`/substitute-requests/${requestId}`, data);
        return response.data;
    },

    // 직원 가용성 관련
    getEmployeeAvailabilities: async (): Promise<EmployeeAvailability[]> => {
        const response = await apiClient.get('/employee-availabilities');
        return response.data;
    },

    saveEmployeeAvailability: async (availability: Partial<EmployeeAvailability>): Promise<EmployeeAvailability> => {
        const response = await apiClient.post('/employee-availabilities', availability);
        return response.data;
    },

    // 추천 직원 조회
    getRecommendedEmployees: async (shiftId: string): Promise<Employee[]> => {
        const response = await apiClient.get(`/shifts/${shiftId}/recommended-employees`);
        return response.data;
    },

    // 더미 데이터 생성
    generateDummyData: async (): Promise<void> => {
        await apiClient.post('/generate-dummy-data');
    },

    // 설정 데이터 초기화
    resetSetupData: async (): Promise<void> => {
        await apiClient.post('/reset-setup-data');
    }
}; 