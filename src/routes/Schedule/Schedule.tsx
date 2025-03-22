import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import { getEmployees } from "../../services/api";
import { Employee } from "../../lib/types";
import WeeklyScheduleManager from "./components/WeeklyScheduleManager";
import TemplateManagerDialog from "./TemplateManagerDialog";
import {
  Settings as SettingsIcon,
  Restore as RestoreIcon,
} from "@mui/icons-material";

// 모의 직원 데이터
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    name: "김지은",
    email: "jieun.kim@example.com",
    phoneNumber: "010-1234-5678",
    role: "매니저",
    status: "active",
    hourlyRate: 12000,
  },
  {
    id: "emp-2",
    name: "박민우",
    email: "minwoo.park@example.com",
    phoneNumber: "010-2345-6789",
    role: "바리스타",
    status: "active",
    hourlyRate: 10000,
  },
  {
    id: "emp-3",
    name: "정도윤",
    email: "doyoon.jung@example.com",
    phoneNumber: "010-3456-7890",
    role: "매니저",
    status: "active",
    hourlyRate: 12000,
  },
  {
    id: "emp-4",
    name: "한수정",
    email: "sujeong.han@example.com",
    phoneNumber: "010-4567-8901",
    role: "바리스타",
    status: "active",
    hourlyRate: 10000,
  },
  {
    id: "emp-5",
    name: "이지원",
    email: "jiwon.lee@example.com",
    phoneNumber: "010-5678-9012",
    role: "캐셔",
    status: "active",
    hourlyRate: 9500,
  },
  {
    id: "emp-6",
    name: "최서연",
    email: "seoyeon.choi@example.com",
    phoneNumber: "010-6789-0123",
    role: "서빙",
    status: "active",
    hourlyRate: 9500,
  },
  {
    id: "emp-7",
    name: "윤하은",
    email: "haeun.yoon@example.com",
    phoneNumber: "010-7890-1234",
    role: "주방",
    status: "active",
    hourlyRate: 10000,
  },
  {
    id: "emp-8",
    name: "강태현",
    email: "taehyun.kang@example.com",
    phoneNumber: "010-8901-2345",
    role: "주방",
    status: "active",
    hourlyRate: 10000,
  },
  {
    id: "emp-9",
    name: "임지현",
    email: "jihyun.im@example.com",
    phoneNumber: "010-9012-3456",
    role: "서빙",
    status: "active",
    hourlyRate: 9500,
  },
];

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

// 샘플 스케줄 생성 타입
interface ScheduleItem {
  id: string;
  day: number; // 0-6 (일요일-토요일)
  shiftType: string;
  position: string;
  employeeId: string | null;
}

// 시간대별 배정된 직원들의 초기 스케줄
const generateInitialSchedule = (employees: Employee[]): ScheduleItem[] => {
  if (!employees || employees.length === 0) return [];

  // 직원 ID를 역할별로 그룹화
  const roleMap: Record<string, string[]> = {};

  employees.forEach((emp) => {
    if (!emp.role) return;

    if (!roleMap[emp.role]) {
      roleMap[emp.role] = [];
    }
    roleMap[emp.role].push(emp.id);
  });

  const schedule: ScheduleItem[] = [];
  const days = [0, 1, 2, 3, 4, 5, 6]; // 일~토

  // 각 요일, 각 시간대에 대해 샘플 스케줄 생성
  days.forEach((day) => {
    // 오픈 (매니저 1명, 바리스타 1명, 서빙 1명)
    if (roleMap["매니저"] && roleMap["매니저"].length > 0) {
      schedule.push({
        id: `${day}-open-매니저-0-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        day,
        shiftType: "open",
        position: "매니저",
        employeeId: roleMap["매니저"][day % roleMap["매니저"].length],
      });
    }

    if (roleMap["바리스타"] && roleMap["바리스타"].length > 0) {
      schedule.push({
        id: `${day}-open-바리스타-0-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        day,
        shiftType: "open",
        position: "바리스타",
        employeeId: roleMap["바리스타"][day % roleMap["바리스타"].length],
      });
    }

    if (roleMap["서빙"] && roleMap["서빙"].length > 0) {
      schedule.push({
        id: `${day}-open-서빙-0-${Math.random().toString(36).substring(2, 9)}`,
        day,
        shiftType: "open",
        position: "서빙",
        employeeId: roleMap["서빙"][day % roleMap["서빙"].length],
      });
    }

    // 미들 (바리스타 1명, 캐셔 1명)
    if (roleMap["바리스타"] && roleMap["바리스타"].length > 0) {
      schedule.push({
        id: `${day}-middle-바리스타-0-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        day,
        shiftType: "middle",
        position: "바리스타",
        employeeId: roleMap["바리스타"][(day + 1) % roleMap["바리스타"].length],
      });
    }

    if (roleMap["캐셔"] && roleMap["캐셔"].length > 0) {
      schedule.push({
        id: `${day}-middle-캐셔-0-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        day,
        shiftType: "middle",
        position: "캐셔",
        employeeId: roleMap["캐셔"][day % roleMap["캐셔"].length],
      });
    }

    // 마감 (매니저 1명, 바리스타 1명, 주방 1명)
    if (roleMap["매니저"] && roleMap["매니저"].length > 0) {
      schedule.push({
        id: `${day}-close-매니저-0-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        day,
        shiftType: "close",
        position: "매니저",
        employeeId: roleMap["매니저"][(day + 1) % roleMap["매니저"].length],
      });
    }

    if (roleMap["바리스타"] && roleMap["바리스타"].length > 0) {
      schedule.push({
        id: `${day}-close-바리스타-0-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        day,
        shiftType: "close",
        position: "바리스타",
        employeeId: roleMap["바리스타"][(day + 2) % roleMap["바리스타"].length],
      });
    }

    if (roleMap["주방"] && roleMap["주방"].length > 0) {
      schedule.push({
        id: `${day}-close-주방-0-${Math.random().toString(36).substring(2, 9)}`,
        day,
        shiftType: "close",
        position: "주방",
        employeeId: roleMap["주방"][day % roleMap["주방"].length],
      });
    }
  });

  return schedule;
};

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
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>(
    DEFAULT_SHIFT_TEMPLATES
  );
  const [initialSchedule, setInitialSchedule] = useState<ScheduleItem[]>([]);

  // 초기 데이터 로딩
  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        // API 호출 대신 모의 데이터 사용
        //const employeesData = await getEmployees();
        setEmployees(MOCK_EMPLOYEES);
        // 초기 스케줄 생성
        setInitialSchedule(generateInitialSchedule(MOCK_EMPLOYEES));
      } catch (err) {
        console.error("직원 데이터 로딩 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
    loadTemplatesFromStorage();
  }, []);

  // 템플릿 로딩 함수
  const loadTemplatesFromStorage = () => {
    try {
      const savedTemplates = localStorage.getItem("shiftTemplates");
      if (savedTemplates) {
        setShiftTemplates(JSON.parse(savedTemplates));
      }
    } catch (error) {
      console.error("템플릿 로딩 오류:", error);
      // 오류 발생시 기본 템플릿 사용
      setShiftTemplates(DEFAULT_SHIFT_TEMPLATES);
    }
  };

  // 템플릿 저장 함수
  const handleSaveTemplates = (updatedTemplates: ShiftTemplate[]) => {
    setShiftTemplates(updatedTemplates);

    // 로컬 스토리지에 템플릿 저장
    try {
      localStorage.setItem("shiftTemplates", JSON.stringify(updatedTemplates));
    } catch (error) {
      console.error("템플릿 저장 오류:", error);
    }

    setIsTemplateManagerOpen(false);
  };

  // 주간 스케줄 적용 핸들러
  const handleWeeklyScheduleApply = (schedule: any[]) => {
    console.log("주간 스케줄 적용:", schedule);
    // TODO: 주간 스케줄을 저장하는 API 호출 구현
  };

  // 초기 샘플 스케줄 재생성
  const regenerateInitialSchedule = () => {
    if (
      window.confirm(
        "샘플 스케줄을 새로 생성하시겠습니까? 현재 진행 중인 스케줄 작업은 저장되지 않습니다."
      )
    ) {
      const newSchedule = generateInitialSchedule(employees);
      setInitialSchedule(newSchedule);
    }
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
        <Box>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<RestoreIcon />}
            onClick={regenerateInitialSchedule}
            sx={{ mr: 1 }}
          >
            샘플 직원 배정
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SettingsIcon />}
            onClick={() => setIsTemplateManagerOpen(true)}
          >
            근무 템플릿 관리
          </Button>
        </Box>
      </Box>
      <Divider />
      <Box
        sx={{
          height: "calc(100% - 60px)",
          display: "flex",
          flexDirection: "column",
          p: 2,
        }}
      >
        <WeeklyScheduleManager
          employees={employees}
          onApplySchedule={handleWeeklyScheduleApply}
          templates={shiftTemplates}
          initialSchedule={initialSchedule}
        />
      </Box>

      {/* 템플릿 관리 대화상자 */}
      {isTemplateManagerOpen && (
        <TemplateManagerDialog
          open={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
          templates={shiftTemplates}
          onSaveTemplates={handleSaveTemplates}
        />
      )}
    </Paper>
  );
};

export default Schedule;
