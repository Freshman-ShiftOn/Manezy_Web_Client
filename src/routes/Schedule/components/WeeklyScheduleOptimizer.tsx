import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  Card,
  TextField,
  CardContent,
  CardHeader,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import {
  AutoAwesome as AutoAwesomeIcon,
  Compare as CompareIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarMonthIcon,
  PlaylistAdd as PlaylistAddIcon,
  Assessment as AssessmentIcon,
  AutoFixHigh as AutoFixHighIcon,
} from "@mui/icons-material";
import { Employee } from "../../../lib/types";
import { format, addDays, startOfWeek, parse } from "date-fns";
import { ko } from "date-fns/locale";
import { getShifts } from "../../../services/api";

// 시프트 타입 정의
type ShiftType = "open" | "middle" | "close";

// 요일 및 시간대 정의
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const SHIFT_TIMES: Record<ShiftType, string> = {
  open: "오픈 (08:00-13:00)",
  middle: "미들 (13:00-18:00)",
  close: "마감 (18:00-23:00)",
};

// 실제 시간 정보
const SHIFT_TIME_DETAILS: Record<ShiftType, { start: string; end: string }> = {
  open: { start: "08:00", end: "13:00" },
  middle: { start: "13:00", end: "18:00" },
  close: { start: "18:00", end: "23:00" },
};

// 선호도 색상
const PREFERENCE_COLORS = {
  preferred: "#4CAF50", // 녹색 (선호)
  available: "#2196F3", // 파란색 (가능)
  unavailable: "#F44336", // 빨간색 (불가능)
};

// 스케줄 아이템 타입 정의
interface ScheduleItem {
  id: string;
  day: number; // 0-6 (일요일-토요일)
  shiftType: ShiftType;
  employeeId: string | null;
}

// 최적화된 스케줄 아이템 타입 정의
interface OptimizedScheduleItem extends ScheduleItem {
  score: number;
  reason: string;
}

interface WeeklyScheduleOptimizerProps {
  employees: Employee[];
  onApplySchedule: (schedule: ScheduleItem[]) => void;
}

const WeeklyScheduleOptimizer: React.FC<WeeklyScheduleOptimizerProps> = ({
  employees,
  onApplySchedule,
}) => {
  // 상태 관리
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleItem[]>([]);
  const [optimizedSchedule, setOptimizedSchedule] = useState<
    OptimizedScheduleItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingCurrentSchedule, setLoadingCurrentSchedule] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [activeView, setActiveView] = useState<"current" | "optimized">(
    "current"
  );
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [highlightDay, setHighlightDay] = useState<number | null>(null);
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [showDatePickerDialog, setShowDatePickerDialog] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    new Date()
  );

  // 최적화 설정
  const [optimizationSettings, setOptimizationSettings] = useState({
    equalDistribution: true,
    preferEmployeePreferences: true,
    minimumEmployeesPerShift: 2,
    maxShiftsPerEmployee: 5,
    requireSkillMatch: true,
    minimizeLaborCost: false,
  });

  // 최근 스케줄 저장
  const [recentSchedule, setRecentSchedule] = useState<ScheduleItem[]>([]);

  // 스케줄 적합도 관련 상태
  const [scheduleCompatibility, setScheduleCompatibility] =
    useState<number>(100);
  const [changedEmployees, setChangedEmployees] = useState<
    {
      id: string;
      name: string;
      changedDays: string[];
      impact: "high" | "low";
    }[]
  >([]);
  const [criticalTimeSlots, setCriticalTimeSlots] = useState<
    { day: number; shift: ShiftType; reason: string }[]
  >([]);

  // 직원 통보 다이얼로그 상태
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [affectedEmployees, setAffectedEmployees] = useState<
    { id: string; name: string; changes: string[] }[]
  >([]);

  // 초기화
  useEffect(() => {
    // 빈 주간 스케줄 생성
    createEmptySchedule();

    // 현재 근무 일정 불러오기
    loadCurrentSchedule();
  }, [employees]);

  // 빈 주간 스케줄 생성
  const createEmptySchedule = () => {
    const schedule: ScheduleItem[] = [];

    // 각 요일과 시프트 타입에 대한 아이템 생성
    DAYS_OF_WEEK.forEach((_, dayIndex) => {
      Object.keys(SHIFT_TIMES).forEach((shiftType) => {
        for (let i = 0; i < 2; i++) {
          // 각 시프트당 2명의 직원
          schedule.push({
            id: `${dayIndex}-${shiftType}-${i}`,
            day: dayIndex,
            shiftType: shiftType as ShiftType,
            employeeId: null,
          });
        }
      });
    });

    setCurrentSchedule(schedule);
  };

  // 현재 근무 일정 불러오기
  const loadCurrentSchedule = async () => {
    setLoadingCurrentSchedule(true);

    try {
      // API를 통해 현재 근무 일정 가져오기
      const shifts = await getShifts();

      // 이번 주 시작일 (일요일)
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });

      // 현재 스케줄 깊은 복사
      const updatedSchedule = [...currentSchedule];

      // 각 근무를 요일별, 시간대별로 분류하여 현재 스케줄에 반영
      shifts.forEach((shift) => {
        const shiftDate = new Date(shift.start);
        const dayDiff = Math.floor(
          (shiftDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff >= 0 && dayDiff < 7) {
          // 이번 주에 해당하는 근무만 처리
          const dayOfWeek = shiftDate.getDay(); // 0-6 (일-토)
          const startHour = shiftDate.getHours();
          let shiftType: ShiftType;

          // 시간대 결정
          if (startHour < 12) {
            shiftType = "open";
          } else if (startHour < 17) {
            shiftType = "middle";
          } else {
            shiftType = "close";
          }

          // 해당 요일과 시간대의 스케줄 항목 찾기
          const scheduleItems = updatedSchedule.filter(
            (item) => item.day === dayOfWeek && item.shiftType === shiftType
          );

          // 비어있는 슬롯에 직원 배정
          for (let item of scheduleItems) {
            if (!item.employeeId && shift.employeeId) {
              item.employeeId = shift.employeeId;
              break;
            }
          }
        }
      });

      // 데이터가 충분하지 않은 경우 샘플 데이터 생성
      const hasAnyAssignments = updatedSchedule.some((item) => item.employeeId);

      if (!hasAnyAssignments) {
        console.log("근무 데이터가 없어 샘플 스케줄을 생성합니다.");

        // 샘플 스케줄 생성
        const sampleSchedule = createSampleSchedule();

        // 현재 스케줄 및 최근 스케줄 상태 업데이트
        setCurrentSchedule(sampleSchedule);
        setRecentSchedule(sampleSchedule);
      } else {
        // 현재 스케줄 및 최근 스케줄 상태 업데이트
        setCurrentSchedule(updatedSchedule);
        setRecentSchedule(updatedSchedule);
      }
    } catch (error) {
      console.error("현재 근무 일정을 불러오는 데 실패했습니다:", error);

      // 에러 발생 시 샘플 스케줄 생성
      console.log("오류 발생으로 샘플 스케줄을 생성합니다.");
      const sampleSchedule = createSampleSchedule();
      setCurrentSchedule(sampleSchedule);
      setRecentSchedule(sampleSchedule);
    } finally {
      setLoadingCurrentSchedule(false);
    }
  };

  // 샘플 스케줄 생성 함수
  const createSampleSchedule = (): ScheduleItem[] => {
    const schedule: ScheduleItem[] = [];

    // 각 요일과 시프트 타입에 대한 아이템 생성
    DAYS_OF_WEEK.forEach((_, dayIndex) => {
      Object.keys(SHIFT_TIMES).forEach((shiftType) => {
        for (let i = 0; i < 2; i++) {
          // 각 시프트당 2명의 직원
          // 랜덤하게 직원 할당 (약 70% 확률로 직원 배정)
          const shouldAssign = Math.random() < 0.7;
          const randomEmployeeIndex = shouldAssign
            ? Math.floor(Math.random() * employees.length)
            : -1;

          schedule.push({
            id: `${dayIndex}-${shiftType}-${i}`,
            day: dayIndex,
            shiftType: shiftType as ShiftType,
            employeeId:
              randomEmployeeIndex >= 0
                ? employees[randomEmployeeIndex].id
                : null,
          });
        }
      });
    });

    return schedule;
  };

  // 최근 스케줄을 기본 스케줄로 적용
  const applyRecentSchedule = () => {
    if (recentSchedule.length > 0) {
      setCurrentSchedule([...recentSchedule]);
      alert("최근 스케줄이 기본 주간 스케줄로 적용되었습니다.");
    } else {
      alert("적용할 최근 스케줄이 없습니다.");
    }
  };

  // 날짜 포맷
  const formatDate = (dayIndex: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // 이번 주 일요일

    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + dayIndex);

    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 시프트 타입별 스케줄 아이템 가져오기
  const getScheduleItems = (
    day: number,
    shiftType: ShiftType,
    schedule: ScheduleItem[]
  ) => {
    return schedule.filter(
      (item) => item.day === day && item.shiftType === shiftType
    );
  };

  // 직원 배정 핸들러
  const handleAssignEmployee = (
    scheduleItemId: string,
    employeeId: string | null
  ) => {
    const updatedSchedule = currentSchedule.map((item) =>
      item.id === scheduleItemId ? { ...item, employeeId } : item
    );

    setCurrentSchedule(updatedSchedule);
  };

  // 스케줄 최적화 핸들러
  const handleOptimizeSchedule = () => {
    setOptimizing(true);

    // 실제로는 API 호출이 필요하지만, 여기서는 예시로 더미 데이터 생성
    setTimeout(() => {
      const optimized = generateOptimizedSchedule();
      setOptimizedSchedule(optimized);
      setActiveView("optimized");
      setOptimizing(false);
    }, 2000);
  };

  // 최적화된 스케줄 생성 (더미 데이터)
  const generateOptimizedSchedule = (): OptimizedScheduleItem[] => {
    const schedule: OptimizedScheduleItem[] = [];

    // 최적화 시작점으로 현재 스케줄 사용
    currentSchedule.forEach((item) => {
      // 가용시간과 선호도에 따른 점수 계산 (실제로는 더 복잡한 알고리즘 필요)
      let score = Math.floor(Math.random() * 100); // 0-99 사이의 점수
      let reason = "";
      let employeeId = item.employeeId;

      // 문제가 있는 시간대인지 확인
      const isCriticalTimeSlot = criticalTimeSlots.some(
        (slot) => slot.day === item.day && slot.shift === item.shiftType
      );

      // 가용시간이 변경된 직원인지 확인
      const isChangedEmployee = employeeId
        ? changedEmployees.some((emp) => emp.id === employeeId)
        : false;

      // 문제가 있는 시간대거나 가용시간이 변경된 직원이면 재배정 고려
      if (isCriticalTimeSlot || isChangedEmployee) {
        // 해당 시간대에 적합한 직원 찾기
        const availableEmployees = employees.filter((emp) => {
          // 이미 같은 날에 같은 시프트에 배정되지 않은 직원
          const notAssigned = !currentSchedule.some(
            (s) =>
              s.id !== item.id &&
              s.day === item.day &&
              s.shiftType === item.shiftType &&
              s.employeeId === emp.id
          );

          // 가용시간이 변경된 직원인지 확인
          const hasChangedAvailability = changedEmployees.some(
            (changed) => changed.id === emp.id
          );

          // 해당 직원이 적합한지 판단
          return (
            notAssigned && (!hasChangedAvailability || Math.random() > 0.5)
          );
        });

        if (availableEmployees.length > 0) {
          // 가중치를 사용하여 가장 적합한 직원 선택
          const weights = availableEmployees.map(
            () => Math.random() * (isCriticalTimeSlot ? 2 : 1)
          );

          const totalWeight = weights.reduce((sum, w) => sum + w, 0);
          let selection = Math.random() * totalWeight;

          for (let i = 0; i < weights.length; i++) {
            selection -= weights[i];
            if (selection <= 0) {
              employeeId = availableEmployees[i].id;
              score = 75 + Math.floor(Math.random() * 25); // 75-99 사이
              reason = isCriticalTimeSlot
                ? "문제 시간대 최적화"
                : "가용시간 변경 반영";
              break;
            }
          }
        }
      }

      // 점수에 따른 이유 설정
      if (!reason) {
        if (score > 80) reason = "최적의 선택";
        else if (score > 60) reason = "좋은 선택";
        else if (score > 40) reason = "가능한 선택";
        else reason = "가능하지만 선호도 낮음";
      }

      schedule.push({
        ...item,
        employeeId,
        score,
        reason,
      });
    });

    return schedule;
  };

  // 적합도 분석 결과 렌더링
  const renderCompatibilityAnalysis = () => {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          스케줄 적합도 분석
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            전체 적합도:
          </Typography>
          <LinearProgress
            variant="determinate"
            value={scheduleCompatibility}
            sx={{
              flexGrow: 1,
              height: 10,
              borderRadius: 5,
              "& .MuiLinearProgress-bar": {
                bgcolor:
                  scheduleCompatibility > 70
                    ? "success.main"
                    : scheduleCompatibility > 40
                    ? "warning.main"
                    : "error.main",
              },
            }}
          />
          <Typography
            variant="h6"
            sx={{
              ml: 2,
              color:
                scheduleCompatibility > 70
                  ? "success.main"
                  : scheduleCompatibility > 40
                  ? "warning.main"
                  : "error.main",
            }}
          >
            {scheduleCompatibility}%
          </Typography>
        </Box>

        {changedEmployees.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              가용시간 변경된 직원 ({changedEmployees.length}명):
            </Typography>
            <List dense>
              {changedEmployees.map((emp) => (
                <ListItem key={emp.id}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          emp.impact === "high" ? "warning.main" : "info.main",
                      }}
                    >
                      {emp.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={emp.name}
                    secondary={`변경된 가용시간: ${emp.changedDays.join(
                      ", "
                    )} 요일`}
                  />
                  <Chip
                    label={emp.impact === "high" ? "영향 큼" : "영향 적음"}
                    color={emp.impact === "high" ? "warning" : "info"}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {criticalTimeSlots.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              문제가 있는 시간대 ({criticalTimeSlots.length}개):
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>요일</TableCell>
                    <TableCell>시간대</TableCell>
                    <TableCell>문제 원인</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {criticalTimeSlots.map((slot, index) => (
                    <TableRow key={index} sx={{ bgcolor: "error.light" }}>
                      <TableCell>{DAYS_OF_WEEK[slot.day]}</TableCell>
                      <TableCell>{SHIFT_TIMES[slot.shift]}</TableCell>
                      <TableCell>{slot.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {scheduleCompatibility < 70 && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            가용시간 변경으로 인해 현재 스케줄의 적합도가 낮습니다. 스케줄
            최적화를 권장합니다.
            <Button
              variant="contained"
              color="warning"
              size="small"
              sx={{ ml: 2 }}
              onClick={handleOptimizeSchedule}
            >
              스케줄 최적화
            </Button>
          </Alert>
        )}
      </Paper>
    );
  };

  // 최적 스케줄 적용 핸들러
  const handleApplyOptimizedSchedule = () => {
    setShowDatePickerDialog(true);
  };

  // 특정 날짜부터 스케줄 적용
  const handleApplyFromDate = () => {
    if (!selectedStartDate) return;

    // 선택한 날짜가 일요일이 아니면 해당 주의 일요일로 조정
    const adjustedDate = startOfWeek(selectedStartDate, { weekStartsOn: 0 });

    // 최적화된 스케줄을 현재 스케줄로 적용
    const updatedSchedule = currentSchedule.map((item) => {
      const optimizedItem = optimizedSchedule.find((o) => o.id === item.id);
      return optimizedItem
        ? { ...item, employeeId: optimizedItem.employeeId }
        : item;
    });

    setCurrentSchedule(updatedSchedule);
    setActiveView("current");

    // 특정 날짜부터의 적용 정보와 함께 스케줄 전달
    onApplySchedule(updatedSchedule);

    // 알림 표시
    alert(
      `${format(
        adjustedDate,
        "yyyy년 MM월 dd일"
      )}(일요일)부터 시작하는 주간 스케줄이 적용되었습니다.`
    );

    // 변경된 직원들 확인하고 통보 다이얼로그 표시
    showEmployeeNotificationDialog(updatedSchedule);

    // 대화상자 닫기
    setShowDatePickerDialog(false);
  };

  // 직원 통보 다이얼로그 표시
  const showEmployeeNotificationDialog = (updatedSchedule: ScheduleItem[]) => {
    // 변경된 근무 일정 확인
    const changes: {
      [employeeId: string]: { name: string; changes: string[] };
    } = {};

    updatedSchedule.forEach((item) => {
      const originalItem = currentSchedule.find((o) => o.id === item.id);

      // 직원 배정이 변경된 경우
      if (originalItem?.employeeId !== item.employeeId) {
        if (item.employeeId) {
          // 새로 배정된 직원
          const employee = employees.find((e) => e.id === item.employeeId);
          if (employee) {
            if (!changes[employee.id]) {
              changes[employee.id] = { name: employee.name, changes: [] };
            }
            changes[employee.id].changes.push(
              `${DAYS_OF_WEEK[item.day]} ${
                SHIFT_TIMES[item.shiftType]
              } 근무가 추가되었습니다.`
            );
          }
        }

        if (originalItem?.employeeId) {
          // 기존 배정이 취소된 직원
          const employee = employees.find(
            (e) => e.id === originalItem.employeeId
          );
          if (employee) {
            if (!changes[employee.id]) {
              changes[employee.id] = { name: employee.name, changes: [] };
            }
            changes[employee.id].changes.push(
              `${DAYS_OF_WEEK[item.day]} ${
                SHIFT_TIMES[item.shiftType]
              } 근무가 취소되었습니다.`
            );
          }
        }
      }
    });

    // 변경사항이 있는 직원 목록 생성
    const affected = Object.entries(changes).map(([id, info]) => ({
      id,
      name: info.name,
      changes: info.changes,
    }));

    if (affected.length > 0) {
      setAffectedEmployees(affected);
      setShowNotificationDialog(true);
    }
  };

  // 직원 통보 다이얼로그 렌더링
  const renderNotificationDialog = () => {
    return (
      <Dialog
        open={showNotificationDialog}
        onClose={() => setShowNotificationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>스케줄 변경 통보</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            다음 직원들에게 근무 일정 변경 사항을 통보합니다:
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>직원명</TableCell>
                  <TableCell>변경 사항</TableCell>
                  <TableCell>통보 방법</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {affectedEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>
                      <List dense disablePadding>
                        {employee.changes.map((change, index) => (
                          <ListItem key={index} dense disablePadding>
                            <ListItemText primary={change} />
                          </ListItem>
                        ))}
                      </List>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select defaultValue="all" size="small">
                          <MenuItem value="all">모든 방법</MenuItem>
                          <MenuItem value="app">앱 알림</MenuItem>
                          <MenuItem value="sms">SMS</MenuItem>
                          <MenuItem value="email">이메일</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotificationDialog(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              alert("직원들에게 통보가 발송되었습니다.");
              setShowNotificationDialog(false);
            }}
          >
            통보 발송
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // 스케줄 저장 핸들러
  const handleSaveSchedule = () => {
    onApplySchedule(currentSchedule);
    alert("기본 주간 스케줄이 저장되었습니다.");
  };

  // 스케줄 적합도 분석
  const analyzeScheduleCompatibility = () => {
    setLoading(true);

    // 실제로는 API 호출이 필요하지만, 예시로 더미 데이터 생성
    setTimeout(() => {
      // 직원들의 가용시간 변경 분석 (모의 데이터)
      const changedEmps = employees
        .filter(() => Math.random() > 0.7) // 30%의 직원만 변경되었다고 가정
        .map((emp) => ({
          id: emp.id,
          name: emp.name,
          changedDays: DAYS_OF_WEEK.filter(() => Math.random() > 0.5),
          impact: Math.random() > 0.5 ? "high" : ("low" as "high" | "low"),
        }));

      // 문제가 있는 시간대 (모의 데이터)
      const criticalSlots = [];
      for (let day = 0; day < 7; day++) {
        if (Math.random() > 0.7) {
          // 30% 확률로 각 날짜에 문제 시간대 생성
          const shiftType = ["open", "middle", "close"][
            Math.floor(Math.random() * 3)
          ] as ShiftType;
          const reasons = [
            "인원 부족",
            "직원 가용시간 충돌",
            "필수 인력 부족",
            "숙련자 부재",
          ];
          criticalSlots.push({
            day,
            shift: shiftType,
            reason: reasons[Math.floor(Math.random() * reasons.length)],
          });
        }
      }

      // 전체 적합도 점수 계산 (0-100)
      const compatibility = Math.max(
        0,
        100 - changedEmps.length * 5 - criticalSlots.length * 7
      );

      // 상태 업데이트
      setChangedEmployees(changedEmps);
      setCriticalTimeSlots(criticalSlots);
      setScheduleCompatibility(compatibility);
      setLoading(false);

      // 적합도가 낮으면 자동으로 최적화 제안
      if (compatibility < 70) {
        handleOptimizeSchedule();
      }
    }, 1500);
  };

  // 직원이 해당 요일에 가용한지 확인 (더미 데이터)
  const isEmployeeAvailable = (
    employeeId: string,
    day: number,
    shiftType: ShiftType
  ) => {
    // 실제로는 API를 통해 직원 가용 시간을 확인해야 함
    // 여기서는 예시로 랜덤 데이터 생성
    const availability = Math.random();
    if (availability > 0.8) return "preferred";
    if (availability > 0.3) return "available";
    return "unavailable";
  };

  // 직원 가용시간 뱃지 렌더링
  const renderAvailabilityBadge = (
    employeeId: string,
    day: number,
    shiftType: ShiftType
  ) => {
    const availability = isEmployeeAvailable(employeeId, day, shiftType);

    return (
      <Tooltip
        title={
          availability === "preferred"
            ? "선호 시간"
            : availability === "available"
            ? "가능 시간"
            : "불가능 시간"
        }
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: PREFERENCE_COLORS[availability],
            display: "inline-block",
            ml: 1,
          }}
        />
      </Tooltip>
    );
  };

  // 직원 선택 메뉴 렌더링
  const renderEmployeeSelect = (scheduleItem: ScheduleItem) => {
    return (
      <FormControl fullWidth size="small">
        <Select
          value={scheduleItem.employeeId || ""}
          onChange={(e) =>
            handleAssignEmployee(
              scheduleItem.id,
              e.target.value === "" ? null : e.target.value
            )
          }
          displayEmpty
          renderValue={(selected) => {
            if (!selected)
              return (
                <Typography variant="body2" color="text.secondary">
                  미배정
                </Typography>
              );
            const employee = employees.find((e) => e.id === selected);
            return (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2">{employee?.name}</Typography>
                {renderAvailabilityBadge(
                  selected,
                  scheduleItem.day,
                  scheduleItem.shiftType
                )}
              </Box>
            );
          }}
        >
          <MenuItem value="">
            <em>미배정</em>
          </MenuItem>
          {employees.map((employee) => (
            <MenuItem
              key={employee.id}
              value={employee.id}
              disabled={currentSchedule.some(
                (s) =>
                  s.id !== scheduleItem.id &&
                  s.day === scheduleItem.day &&
                  s.shiftType === scheduleItem.shiftType &&
                  s.employeeId === employee.id
              )}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <Typography variant="body2">{employee.name}</Typography>
                <Box sx={{ flexGrow: 1 }} />
                {renderAvailabilityBadge(
                  employee.id,
                  scheduleItem.day,
                  scheduleItem.shiftType
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  // 현재 스케줄 렌더링
  const renderCurrentSchedule = () => {
    return (
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ minHeight: "500px", maxHeight: "700px" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", width: "12%" }}>
                시간대
              </TableCell>
              {DAYS_OF_WEEK.map((day, index) => (
                <TableCell
                  key={day}
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor:
                      highlightDay === index
                        ? "action.selected"
                        : "transparent",
                  }}
                  onMouseEnter={() => setHighlightDay(index)}
                  onMouseLeave={() => setHighlightDay(null)}
                >
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(SHIFT_TIMES).map(([shiftKey, shiftLabel]) => (
              <TableRow key={shiftKey}>
                <TableCell sx={{ fontWeight: "bold" }}>{shiftLabel}</TableCell>
                {DAYS_OF_WEEK.map((_, dayIndex) => {
                  const scheduleItems = getScheduleItems(
                    dayIndex,
                    shiftKey as ShiftType,
                    currentSchedule
                  );

                  return (
                    <TableCell
                      key={dayIndex}
                      sx={{
                        p: 1,
                        bgcolor:
                          highlightDay === dayIndex
                            ? "action.selected"
                            : "transparent",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {scheduleItems.map((item) => (
                          <Box key={item.id}>{renderEmployeeSelect(item)}</Box>
                        ))}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // 최적화된 스케줄 렌더링
  const renderOptimizedSchedule = () => {
    return (
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ minHeight: "500px", maxHeight: "700px" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", width: "12%" }}>
                시간대
              </TableCell>
              {DAYS_OF_WEEK.map((day, index) => (
                <TableCell
                  key={day}
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor:
                      highlightDay === index
                        ? "action.selected"
                        : "transparent",
                  }}
                  onMouseEnter={() => setHighlightDay(index)}
                  onMouseLeave={() => setHighlightDay(null)}
                >
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(SHIFT_TIMES).map(([shiftKey, shiftLabel]) => (
              <TableRow key={shiftKey}>
                <TableCell sx={{ fontWeight: "bold" }}>{shiftLabel}</TableCell>
                {DAYS_OF_WEEK.map((_, dayIndex) => {
                  const scheduleItems = getScheduleItems(
                    dayIndex,
                    shiftKey as ShiftType,
                    optimizedSchedule
                  ) as OptimizedScheduleItem[];

                  return (
                    <TableCell
                      key={dayIndex}
                      sx={{
                        p: 1,
                        bgcolor:
                          highlightDay === dayIndex
                            ? "action.selected"
                            : "transparent",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {scheduleItems.map((item: OptimizedScheduleItem) => {
                          const employee = employees.find(
                            (e) => e.id === item.employeeId
                          );
                          const currentItem = currentSchedule.find(
                            (s) => s.id === item.id
                          );
                          const isChanged =
                            currentItem?.employeeId !== item.employeeId;

                          return (
                            <Box
                              key={item.id}
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                border: 1,
                                borderColor: isChanged
                                  ? "warning.main"
                                  : "divider",
                                bgcolor: isChanged
                                  ? "warning.light"
                                  : "background.paper",
                              }}
                            >
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                {item.employeeId ? (
                                  <>
                                    <Typography variant="body2">
                                      {employee?.name}
                                    </Typography>
                                    {renderAvailabilityBadge(
                                      item.employeeId,
                                      dayIndex,
                                      shiftKey as ShiftType
                                    )}
                                    <Box sx={{ flexGrow: 1 }} />
                                    <Tooltip title={`점수: ${item.score}/100`}>
                                      <Chip
                                        size="small"
                                        label={`${item.score}`}
                                        sx={{
                                          height: 20,
                                          "& .MuiChip-label": { px: 1 },
                                          bgcolor:
                                            item.score > 80
                                              ? "success.main"
                                              : item.score > 60
                                              ? "success.light"
                                              : item.score > 40
                                              ? "warning.light"
                                              : "error.light",
                                          color:
                                            item.score > 40
                                              ? "common.white"
                                              : "common.black",
                                        }}
                                      />
                                    </Tooltip>
                                  </>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    미배정
                                  </Typography>
                                )}
                              </Box>
                              {isChanged && (
                                <Box
                                  sx={{
                                    mt: 0.5,
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <InfoIcon
                                    color="warning"
                                    sx={{ fontSize: 16, mr: 0.5 }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    변경됨:{" "}
                                    {currentItem?.employeeId
                                      ? employees.find(
                                          (e) => e.id === currentItem.employeeId
                                        )?.name
                                      : "미배정"}
                                    →{" "}
                                    {item.employeeId
                                      ? employee?.name
                                      : "미배정"}
                                  </Typography>
                                </Box>
                              )}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.5 }}
                              >
                                {item.reason}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // 날짜 선택 대화상자 렌더링
  const renderDatePickerDialog = () => {
    return (
      <Dialog
        open={showDatePickerDialog}
        onClose={() => setShowDatePickerDialog(false)}
      >
        <DialogTitle>스케줄 적용 시작일 선택</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            생성된 주간 스케줄을 적용할 시작 날짜를 선택하세요. 시작일은
            자동으로 해당 주의 일요일로 조정됩니다.
          </DialogContentText>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="시작일 선택"
              value={selectedStartDate}
              onChange={(newDate) => setSelectedStartDate(newDate)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDatePickerDialog(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFromDate}
            disabled={!selectedStartDate}
          >
            적용하기
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // 최적화 설정 렌더링
  const renderOptimizationSettings = () => {
    return (
      <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
        <Typography variant="subtitle1" gutterBottom>
          스케줄 최적화 설정
        </Typography>

        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" gutterBottom>
            최적화 우선순위:
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <FormControl sx={{ minWidth: 120, flexGrow: 1 }}>
              <InputLabel id="equal-distribution-label">
                근무시간 균등 배분
              </InputLabel>
              <Select
                labelId="equal-distribution-label"
                value={
                  optimizationSettings.equalDistribution ? "true" : "false"
                }
                label="근무시간 균등 배분"
                onChange={(e) =>
                  setOptimizationSettings({
                    ...optimizationSettings,
                    equalDistribution: e.target.value === "true",
                  })
                }
                size="small"
              >
                <MenuItem value="true">높음</MenuItem>
                <MenuItem value="false">낮음</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120, flexGrow: 1 }}>
              <InputLabel id="prefer-employee-preferences-label">
                직원 선호도 반영
              </InputLabel>
              <Select
                labelId="prefer-employee-preferences-label"
                value={
                  optimizationSettings.preferEmployeePreferences
                    ? "true"
                    : "false"
                }
                label="직원 선호도 반영"
                onChange={(e) =>
                  setOptimizationSettings({
                    ...optimizationSettings,
                    preferEmployeePreferences: e.target.value === "true",
                  })
                }
                size="small"
              >
                <MenuItem value="true">높음</MenuItem>
                <MenuItem value="false">낮음</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120, flexGrow: 1 }}>
              <InputLabel id="minimize-labor-cost-label">
                인건비 최소화
              </InputLabel>
              <Select
                labelId="minimize-labor-cost-label"
                value={
                  optimizationSettings.minimizeLaborCost ? "true" : "false"
                }
                label="인건비 최소화"
                onChange={(e) =>
                  setOptimizationSettings({
                    ...optimizationSettings,
                    minimizeLaborCost: e.target.value === "true",
                  })
                }
                size="small"
              >
                <MenuItem value="true">높음</MenuItem>
                <MenuItem value="false">낮음</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            제약 조건:
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <FormControl sx={{ minWidth: 120, flexGrow: 1 }}>
              <InputLabel id="minimum-employees-per-shift-label">
                시간대별 최소 인원
              </InputLabel>
              <Select
                labelId="minimum-employees-per-shift-label"
                value={optimizationSettings.minimumEmployeesPerShift.toString()}
                label="시간대별 최소 인원"
                onChange={(e) =>
                  setOptimizationSettings({
                    ...optimizationSettings,
                    minimumEmployeesPerShift: Number(e.target.value),
                  })
                }
                size="small"
              >
                <MenuItem value="1">1명</MenuItem>
                <MenuItem value="2">2명</MenuItem>
                <MenuItem value="3">3명</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120, flexGrow: 1 }}>
              <InputLabel id="max-shifts-per-employee-label">
                직원별 최대 근무시간
              </InputLabel>
              <Select
                labelId="max-shifts-per-employee-label"
                value={optimizationSettings.maxShiftsPerEmployee.toString()}
                label="직원별 최대 근무시간"
                onChange={(e) =>
                  setOptimizationSettings({
                    ...optimizationSettings,
                    maxShiftsPerEmployee: Number(e.target.value),
                  })
                }
                size="small"
              >
                <MenuItem value="3">3시간</MenuItem>
                <MenuItem value="4">4시간</MenuItem>
                <MenuItem value="5">5시간</MenuItem>
                <MenuItem value="6">6시간</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={optimizationSettings.requireSkillMatch}
                onChange={(e) =>
                  setOptimizationSettings({
                    ...optimizationSettings,
                    requireSkillMatch: e.target.checked,
                  })
                }
                size="small"
              />
            }
            label="직무별 필요 역량 고려"
          />
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          주간 스케줄 최적화
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          요일별(일~토) 기본 스케줄을 생성하고, 특정 날짜부터 시작하는 주간
          스케줄에 적용할 수 있습니다.
        </Typography>
      </Box>

      {loadingCurrentSchedule ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            현재 스케줄 불러오는 중...
          </Typography>
        </Box>
      ) : (
        <>
          {renderOptimizationSettings()}

          <Box sx={{ mb: 2 }}>
            <Tabs
              value={activeView}
              onChange={(_, newValue) => setActiveView(newValue)}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab value="current" label="기본 주간 스케줄" />
              <Tab
                value="optimized"
                label="최적화된 스케줄"
                disabled={optimizedSchedule.length === 0}
              />
            </Tabs>
          </Box>

          <Box
            sx={{ mb: 2, flexGrow: 2, overflow: "auto", minHeight: "500px" }}
          >
            {activeView === "current"
              ? renderCurrentSchedule()
              : renderOptimizedSchedule()}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={createEmptySchedule}
                sx={{ mr: 1 }}
              >
                초기화
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<PlaylistAddIcon />}
                onClick={applyRecentSchedule}
                sx={{ mr: 1 }}
              >
                최근 스케줄 적용
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveSchedule}
              >
                기본 스케줄 저장
              </Button>
            </Box>

            <Box>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AssessmentIcon />}
                onClick={analyzeScheduleCompatibility}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                {loading ? "분석 중..." : "적합도 분석"}
              </Button>

              {activeView === "current" ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AutoFixHighIcon />}
                  onClick={handleOptimizeSchedule}
                  disabled={optimizing}
                >
                  {optimizing ? "최적화 중..." : "스케줄 최적화"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CalendarMonthIcon />}
                  onClick={handleApplyOptimizedSchedule}
                >
                  특정 날짜부터 적용하기
                </Button>
              )}
            </Box>
          </Box>
        </>
      )}

      {/* 날짜 선택 대화상자 */}
      {renderDatePickerDialog()}

      {/* 적합도 분석 결과 */}
      {renderCompatibilityAnalysis()}

      {/* 직원 통보 다이얼로그 */}
      {renderNotificationDialog()}
    </Box>
  );
};

export default WeeklyScheduleOptimizer;
