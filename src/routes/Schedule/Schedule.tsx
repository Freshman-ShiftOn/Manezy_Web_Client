import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  Button,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import { getEmployees } from "../../services/api";
import { Employee, Shift, Store } from "../../lib/types";
import WeeklyScheduleManager from "./components/WeeklyScheduleManager";
import DragDropScheduler from "./components/DragDropScheduler";
import ShiftDialog from "./ShiftDialog";
import mockData from "../../lib/mockData";

// 시간대 템플릿 타입 정의
interface ShiftTemplate {
  id: string;
  name: string;
  type: string | "open" | "middle" | "close";
  startTime: string; // 'HH:MM' 포맷
  endTime: string; // 'HH:MM' 포맷
  requiredStaff: number;
  color: string;
  requiredPositions?: Record<string, number>;
  dayVariations?: {
    [key: number]: {
      requiredStaff?: number;
      requiredPositions?: Record<string, number>;
    };
  };
}

// 기본 템플릿 정의
const DEFAULT_SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    id: "template-open",
    name: "오픈",
    type: "open",
    startTime: "09:00",
    endTime: "15:00",
    requiredStaff: 3,
    color: "#4CAF50", // 초록색
    requiredPositions: {
      매니저: 1,
      바리스타: 1,
      서빙: 1,
    },
  },
  {
    id: "template-middle",
    name: "미들",
    type: "middle",
    startTime: "15:00",
    endTime: "17:00",
    requiredStaff: 2,
    color: "#2196F3", // 파랑색
    requiredPositions: {
      바리스타: 1,
      캐셔: 1,
    },
  },
  {
    id: "template-close",
    name: "마감",
    type: "close",
    startTime: "17:00",
    endTime: "22:00",
    requiredStaff: 3,
    color: "#9C27B0", // 보라색
    requiredPositions: {
      매니저: 1,
      바리스타: 1,
      주방: 1,
    },
  },
];

// 모의 직원 데이터 제거 (useEffect에서 설정)
/*
const MOCK_EMPLOYEES: Employee[] = [
  // ...
];
*/

// ScheduleItem 타입 정의 제거
/*
interface ScheduleItem {
  employeeId: string;
  day: number;
  shiftType: string;
}
*/

// generateInitialSchedule 함수 제거 또는 수정 (여기서는 제거)
/*
const generateInitialSchedule = (employees: Employee[]): Shift[] => { // 타입을 Shift[]로 변경
  // ... Shift 객체를 생성하여 반환하는 로직 ...
  return []; // 예시
};
*/

interface ScheduleProps {
  onAssignEmployee?: (shiftId: string, employeeId: string) => void;
  selectedShiftId?: string;
}

const Schedule: React.FC<ScheduleProps> = ({
  onAssignEmployee,
  selectedShiftId,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialSchedule, setInitialSchedule] = useState<Shift[]>([]); // 타입을 Shift[]로 변경
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [schedule, setSchedule] = useState<Shift[]>(mockData.schedules); // 타입 명시

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        // API 호출 대신 실제 데이터 로딩 로직 구현 필요
        // 예시: const employeesData = await getEmployees();
        // setEmployees(employeesData);

        // 모의 데이터 사용 (임시)
        const mockEmployees: Employee[] = [
          {
            id: "emp-1",
            name: "김지은",
            phoneNumber: "010-1234-5678",
            role: "매니저",
            status: "active",
            hourlyRate: 12000,
          },
          {
            id: "emp-2",
            name: "박민우",
            phoneNumber: "010-2345-6789",
            role: "바리스타",
            status: "active",
            hourlyRate: 10000,
          },
          // ... 다른 직원들 ...
        ];
        setEmployees(mockEmployees);
        setInitialSchedule([]); // 초기 스케줄은 빈 배열
      } catch (err) {
        console.error("직원 데이터 로딩 오류:", err);
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  // schedule이 변경될 때 DragDropScheduler 업데이트
  useEffect(() => {
    // initialSchedule 업데이트 (필요한 경우)
    if (schedule.length > 0) {
      setInitialSchedule(schedule);
    }
  }, [schedule]);

  // 드래그 앤 드롭 스케줄 저장
  const handleDragDropScheduleSave = (dragDropSchedule: any) => {
    console.log("드래그 앤 드롭 스케줄 저장:", dragDropSchedule);
    setSchedule(dragDropSchedule);
    // TODO: 스케줄을 저장하는 API 호출 구현
  };

  const handleShiftClick = (shift: Shift) => {
    setCurrentShift(shift);
    setShowShiftDialog(true);
  };

  const handleShiftDialogClose = () => {
    setShowShiftDialog(false);
  };

  const handleShiftSave = (event: any) => {
    console.log("Shift saved:", event);
    // TODO: API로 근무 일정 저장 구현
    setShowShiftDialog(false);

    // DragDropScheduler에 반영할 수 있도록 스케줄 업데이트
    // 실제 구현에서는 API 응답으로 업데이트
  };

  const handleShiftDelete = (shiftId: string) => {
    console.log("Deleting shift:", shiftId);

    // UI에서 삭제된 근무 제거
    setSchedule((prevSchedule) =>
      prevSchedule.filter((shift) => shift.id !== shiftId)
    );

    // initialSchedule에서도 삭제
    setInitialSchedule((prevSchedule) =>
      prevSchedule.filter((shift) => shift.id !== shiftId)
    );

    // 대화상자 닫기
    setShowShiftDialog(false);

    // TODO: API로 근무 일정 삭제 구현
    // 예시: await deleteShift(shiftId);
  };

  const handleTemplateManagerOpen = () => {
    setShowTemplateDialog(true);
  };

  // 로딩 상태 표시
  if (loading && employees.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">주간 스케줄 관리</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* "샘플 직원 배정" 버튼 제거 */}
          {/* <Button
            variant="outlined"
            color="secondary"
            startIcon={<RestoreIcon />}
            onClick={regenerateInitialSchedule}
          >
            샘플 직원 배정
          </Button> */}
          {/* "근무 템플릿 관리" 버튼 제거 */}
          {/* <Button
            variant="outlined"
            color="primary"
            startIcon={<SettingsIcon />}
            onClick={handleTemplateManagerOpen}
          >
            근무 템플릿 관리
          </Button> */}
          {/* "시간대 추가" 버튼 제거 */}
          {/* <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddShift}
          >
            시간대 추가
          </Button> */}
        </Box>
      </Box>
      <Divider />
      <Box
        sx={{
          height: "calc(100% - 60px)", // 높이 조절
          display: "flex",
          flexDirection: "column",
          p: 2,
          overflow: "hidden", // 스크롤은 DragDropScheduler 내부에서 처리하도록 변경
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <DragDropScheduler
            key={`schedule-${initialSchedule.length}`}
            employees={employees}
            onSaveSchedule={handleDragDropScheduleSave}
            initialSchedule={initialSchedule}
          />
        )}
      </Box>

      {/* 템플릿 관리 대화상자 제거 */}
      {/* {showTemplateDialog && (...)} */}

      {/* ShiftDialog */}
      {showShiftDialog && currentShift && (
        <ShiftDialog
          eventData={currentShift}
          isNew={!currentShift.id || !currentShift.id.includes("shift-")}
          employees={employees}
          onClose={handleShiftDialogClose}
          onSave={handleShiftSave}
          onDelete={handleShiftDelete}
          // onOpenTemplateManager={handleTemplateManagerOpen} // 제거
        />
      )}
    </Paper>
  );
};

export default Schedule;
