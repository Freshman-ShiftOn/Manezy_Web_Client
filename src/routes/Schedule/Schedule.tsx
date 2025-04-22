import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  ButtonGroup,
  Tooltip,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  AddCircleOutline as AddIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import ShiftDialog from "./ShiftDialog";
import {
  getEmployees,
  getShifts,
  saveShift,
  deleteShift,
} from "../../services/api";
import { Employee, Shift } from "../../lib/types";

// 지점 템플릿 정보 타입 정의
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

// ShiftEvent 타입 정의 (ShiftDialog에서 사용)
interface ShiftEvent {
  id: string;
  title?: string;
  start: string;
  end: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    employeeIds?: string[];
    requiredStaff?: number;
    shiftType?: "open" | "middle" | "close";
    repeatDays?: number[]; // 0: 일요일, 1: 월요일, ..., 6: 토요일
  };
}

// 모의 직원 데이터
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    name: "김지은",
    hourlyRate: 9860,
    role: "매니저",
    phoneNumber: "010-1234-5678",
    status: "active",
  },
  {
    id: "emp-2",
    name: "박민준",
    hourlyRate: 9620,
    role: "바리스타",
    phoneNumber: "010-2345-6789",
    status: "active",
  },
  {
    id: "emp-3",
    name: "정서연",
    hourlyRate: 9620,
    role: "바리스타",
    phoneNumber: "010-3456-7890",
    status: "active",
  },
  {
    id: "emp-4",
    name: "이도윤",
    hourlyRate: 9620,
    role: "홀",
    phoneNumber: "010-4567-8901",
    status: "active",
  },
  {
    id: "emp-5",
    name: "최하은",
    hourlyRate: 9620,
    role: "알바생",
    phoneNumber: "010-5678-9012",
    status: "active",
  },
];

interface ScheduleProps {
  onAssignEmployee?: (shiftId: string, employeeId: string) => void;
  selectedShiftId?: string;
}

const Schedule: React.FC<ScheduleProps> = ({
  onAssignEmployee,
  selectedShiftId,
}) => {
  const theme = useTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [currentShift, setCurrentShift] = useState<ShiftEvent | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  // 컴포넌트 마운트 시 직원 데이터 로드
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        if (data && data.length > 0) {
          setEmployees(data);
        } else {
          console.log("직원 데이터가 없어 목업 데이터를 사용합니다");
          setEmployees(MOCK_EMPLOYEES);
        }
      } catch (error) {
        console.error("직원 데이터 로드 실패:", error);
        setEmployees(MOCK_EMPLOYEES);
      }
    };

    const loadShifts = async () => {
      try {
        const data = await getShifts();
        if (data && data.length > 0) {
          setShifts(data);
        }
      } catch (error) {
        console.error("근무 일정 로드 실패:", error);
      }
    };

    loadEmployees();
    loadShifts();
  }, []);

  // 선택된 근무 ID가 변경되면 해당 근무를 찾아 대화상자 표시
  useEffect(() => {
    if (selectedShiftId) {
      const selectedShift = shifts.find(
        (shift) => shift.id === selectedShiftId
      );
      if (selectedShift) {
        // Shift를 ShiftEvent로 변환
        const shiftEvent: ShiftEvent = {
          id: selectedShift.id,
          title: selectedShift.title,
          start: selectedShift.start,
          end: selectedShift.end,
          color: selectedShift.color,
          extendedProps: {
            employeeIds: selectedShift.employeeIds || [],
            requiredStaff: selectedShift.extendedProps?.requiredStaff || 1,
            shiftType: selectedShift.extendedProps?.shiftType || "middle",
          },
        };
        setCurrentShift(shiftEvent);
        setShowShiftDialog(true);
      }
    }
  }, [selectedShiftId, shifts]);

  // 근무 일정 저장 처리
  const handleShiftSave = async (event: ShiftEvent) => {
    try {
      // ShiftEvent를 Shift로 변환
      const shiftData: Shift = {
        id: event.id,
        title: event.title || "",
        start: event.start,
        end: event.end,
        color: event.color,
        employeeIds: event.extendedProps?.employeeIds || [],
        storeId: "", // API가 필요에 따라 채움
        isRecurring: !!event.extendedProps?.repeatDays?.length, // repeatDays 배열이 있으면 반복
        extendedProps: {
          requiredStaff: event.extendedProps?.requiredStaff,
          shiftType: event.extendedProps?.shiftType,
        },
      };

      await saveShift(shiftData);

      // 성공 메시지 표시
      setSnackbarMessage("근무 일정이 저장되었습니다.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 근무 목록 갱신
      const updatedShifts = await getShifts();
      setShifts(updatedShifts);
    } catch (error) {
      console.error("근무 저장 실패:", error);
      setSnackbarMessage("근무 일정 저장에 실패했습니다.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }

    // 대화상자 닫기
    setShowShiftDialog(false);
  };

  // 근무 삭제 처리
  const handleShiftDelete = async (shiftId: string) => {
    try {
      await deleteShift(shiftId);

      // 성공 메시지 표시
      setSnackbarMessage("근무가 삭제되었습니다.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 근무 목록 갱신
      const updatedShifts = await getShifts();
      setShifts(updatedShifts);
    } catch (error) {
      console.error("근무 삭제 실패:", error);
      setSnackbarMessage("근무 삭제에 실패했습니다.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }

    // 대화상자 닫기
    setShowShiftDialog(false);
  };

  // 새 근무 추가 버튼 핸들러
  const handleAddShift = () => {
    // 새 근무 생성을 위한 기본값 설정
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);

    setCurrentShift({
      id: `temp-${Date.now()}`,
      start: now.toISOString(),
      end: oneHourLater.toISOString(),
      extendedProps: {
        employeeIds: [],
        requiredStaff: 1,
      },
    });
    setShowShiftDialog(true);
  };

  // 근무 대화상자 닫기 핸들러
  const handleShiftDialogClose = () => {
    setShowShiftDialog(false);
  };

  return (
    <Paper
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          근무 일정 관리
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddShift}
            sx={{ mr: 1 }}
          >
            새 근무 추가
          </Button>
          <IconButton
            onClick={async () => {
              const updatedShifts = await getShifts();
              setShifts(updatedShifts);
              setSnackbarMessage("근무 일정을 새로고침했습니다.");
              setSnackbarSeverity("info");
              setSnackbarOpen(true);
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* 근무 일정 캘린더 컴포넌트 자리 */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center", mt: 4 }}
        >
          캘린더 컴포넌트가 여기에 표시됩니다.
        </Typography>
      </Box>

      {/* ShiftDialog */}
      {showShiftDialog && currentShift && (
        <ShiftDialog
          eventData={currentShift}
          isNew={!currentShift.id || !currentShift.id.includes("shift-")}
          employees={employees}
          onClose={handleShiftDialogClose}
          onSave={handleShiftSave}
          onDelete={handleShiftDelete}
        />
      )}

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Schedule;
