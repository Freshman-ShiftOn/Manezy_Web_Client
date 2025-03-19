import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Container,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  AutoAwesome as AutoAwesomeIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarViewWeek as CalendarViewWeekIcon,
} from "@mui/icons-material";
import { format, getDay, addDays, isSameDay } from "date-fns";
import {
  getEmployees,
  getEmployeeAvailabilities,
  getRecommendedEmployees,
  saveShift,
  getShifts,
  generateDummyData,
} from "../../services/api";
import { Employee, EmployeeAvailability, Shift } from "../../lib/types";

// 컴포넌트 가져오기
import AvailabilityHeatmap from "./components/AvailabilityHeatmap";
import StaffingSummary from "./components/StaffingSummary";
import OptimizationControls, {
  OptimizationSettings,
} from "./components/OptimizationControls";
import ScheduleComparison, {
  ScheduleChange,
} from "./components/ScheduleComparison";
import WeeklyScheduleOptimizer from "./components/WeeklyScheduleOptimizer";

// 요일 이름 (한글)
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 가용시간 선호도에 따른 색상
const PREFERENCE_COLORS = {
  preferred: "#4CAF50", // 녹색 (선호)
  available: "#2196F3", // 파란색 (가능)
  unavailable: "#F44336", // 빨간색 (불가능)
};

// 추천 점수 레벨
const SCORE_LEVELS = [
  { min: 80, color: "#4CAF50", label: "최적" },
  { min: 60, color: "#8BC34A", label: "좋음" },
  { min: 40, color: "#FFC107", label: "보통" },
  { min: 20, color: "#FF9800", label: "낮음" },
  { min: 0, color: "#F44336", label: "매우 낮음" },
];

interface OptimalSchedulingProps {
  onAssignEmployee: (shiftId: string, employeeId: string) => void;
  selectedShiftId?: string;
}

interface EmployeeAvailabilityData {
  id: string;
  name: string;
  availability: {
    [day: number]: {
      slots: number[];
    };
  };
}

// 탭 타입 정의
type TabValue = "weekly" | "availability" | "optimization";

const OptimalScheduling: React.FC<OptimalSchedulingProps> = ({
  onAssignEmployee,
  selectedShiftId,
}) => {
  // 상태 관리
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availabilities, setAvailabilities] = useState<EmployeeAvailability[]>(
    []
  );
  const [recommendations, setRecommendations] = useState<
    { employeeId: string; score: number }[]
  >([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("weekly"); // 기본값을 주간 스케줄로 변경
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // 최적화 설정
  const [optimizationSettings, setOptimizationSettings] =
    useState<OptimizationSettings>({
      equalDistribution: 7,
      preferenceWeight: 8,
      minimumStaffing: 9,
      minimizeCost: 5,
      considerEmployeeRequests: true,
      respectWorkingHourLimits: true,
      maxShiftsPerDay: 2,
      minHoursBetweenShifts: 10,
    });

  // 최적화 결과
  const [optimizationResults, setOptimizationResults] = useState<
    ScheduleChange[]
  >([]);
  const [hasOptimizationResults, setHasOptimizationResults] = useState(false);

  // 초기 데이터 로딩
  useEffect(() => {
    // 더미 데이터 생성 (실제 앱에서는 제거)
    generateDummyData();

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 직원 및 가용시간 데이터 로드
        const [employeesData, availabilitiesData, shiftsData] =
          await Promise.all([
            getEmployees(),
            getEmployeeAvailabilities(),
            getShifts(),
          ]);

        setEmployees(employeesData);
        setAvailabilities(availabilitiesData);
        setShifts(shiftsData);

        // 선택된 근무가 있으면 추천 직원 로드
        if (selectedShiftId) {
          const shiftData = shiftsData.find((s) => s.id === selectedShiftId);
          if (shiftData) {
            setSelectedShift(shiftData);
            const recommendationsData = await getRecommendedEmployees(
              selectedShiftId
            );
            setRecommendations(recommendationsData);
          }
        }
      } catch (err) {
        console.error("데이터 로딩 오류:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [selectedShiftId]);

  // 선택된 근무 ID가 변경되면 추천 직원 업데이트
  useEffect(() => {
    if (selectedShiftId && shifts.length > 0) {
      const loadRecommendations = async () => {
        setLoading(true);

        try {
          const shiftData = shifts.find((s) => s.id === selectedShiftId);
          if (shiftData) {
            setSelectedShift(shiftData);
            const recommendationsData = await getRecommendedEmployees(
              selectedShiftId
            );
            setRecommendations(recommendationsData);
            setError(null);
          }
        } catch (err) {
          console.error("추천 직원 로딩 오류:", err);
          setError("추천 직원을 불러오는 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      };

      loadRecommendations();
    }
  }, [selectedShiftId, shifts]);

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setLoading(true);

    try {
      const [employeesData, availabilitiesData] = await Promise.all([
        getEmployees(),
        getEmployeeAvailabilities(),
      ]);

      setEmployees(employeesData);
      setAvailabilities(availabilitiesData);

      if (selectedShiftId) {
        const recommendationsData = await getRecommendedEmployees(
          selectedShiftId
        );
        setRecommendations(recommendationsData);
      }

      setError(null);
    } catch (err) {
      console.error("새로고침 오류:", err);
      setError("새로고침 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  // 알바생 가용시간 확인 핸들러
  const handleViewAvailability = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setShowAvailabilityDialog(true);
  };

  // 알바생 배정 핸들러
  const handleAssignEmployee = (employeeId: string) => {
    if (selectedShiftId) {
      onAssignEmployee(selectedShiftId, employeeId);
    }
  };

  // 주간 스케줄 적용 핸들러
  const handleWeeklyScheduleApply = (schedule: any[]) => {
    // 실제 구현에서는 API 호출을 통해 주간 스케줄을 저장
    console.log("주간 스케줄 적용:", schedule);
    // TODO: 주간 스케줄을 저장하는 API 호출 구현
  };

  // 가용성 데이터 변환
  const availabilityData = useMemo((): EmployeeAvailabilityData[] => {
    return employees.map((employee) => {
      const employeeAvailabilities = availabilities.filter(
        (a) => a.employeeId === employee.id
      );

      // 변환된 가용성 데이터
      const availability: { [day: number]: { slots: number[] } } = {};

      employeeAvailabilities.forEach((a) => {
        // 30분 단위로 슬롯 생성 (48개 슬롯, 0~47)
        const slots = Array(48).fill(0);

        if (a.startTime && a.endTime) {
          const [startHour, startMinute] = a.startTime.split(":").map(Number);
          const [endHour, endMinute] = a.endTime.split(":").map(Number);

          const startSlot = startHour * 2 + (startMinute >= 30 ? 1 : 0);
          const endSlot = endHour * 2 + (endMinute >= 30 ? 1 : 0);

          // 해당 시간대에 가용 상태 저장
          for (let i = startSlot; i < endSlot; i++) {
            if (a.preference === "preferred") {
              slots[i] = 3; // 선호
            } else if (a.preference === "available") {
              slots[i] = 2; // 가능
            } else if (a.preference === "unavailable") {
              slots[i] = 1; // 불가능
            }
          }
        }

        availability[a.dayOfWeek] = { slots };
      });

      return {
        id: employee.id,
        name: employee.name,
        availability,
      };
    });
  }, [employees, availabilities]);

  // 최적화 실행 핸들러
  const handleRunOptimization = () => {
    setOptimizationLoading(true);

    // 실제로는 API 호출이 필요하지만, 여기서는 예시로 더미 데이터 생성
    setTimeout(() => {
      // 현재 스케줄에서 변경사항 생성 (예시)
      const sampleChanges: ScheduleChange[] = [];
      const startDate = new Date();

      // 10개의 샘플 변경사항 생성
      for (let i = 0; i < 10; i++) {
        const employee =
          employees[Math.floor(Math.random() * employees.length)];
        const changeType = ["added", "removed", "modified"][
          Math.floor(Math.random() * 3)
        ] as "added" | "removed" | "modified";
        const impact = ["positive", "negative", "neutral"][
          Math.floor(Math.random() * 3)
        ] as "positive" | "negative" | "neutral";

        const shiftDate = addDays(startDate, Math.floor(Math.random() * 7));
        const startHour = 9 + Math.floor(Math.random() * 8); // 9AM - 4PM
        const endHour = startHour + 2 + Math.floor(Math.random() * 4); // 2-6 hours shift

        const originalStart =
          changeType === "added" ? null : new Date(shiftDate);
        const originalEnd = changeType === "added" ? null : new Date(shiftDate);
        const optimizedStart =
          changeType === "removed" ? null : new Date(shiftDate);
        const optimizedEnd =
          changeType === "removed" ? null : new Date(shiftDate);

        if (originalStart && originalEnd) {
          originalStart.setHours(startHour, 0, 0);
          originalEnd.setHours(endHour, 0, 0);
        }

        if (optimizedStart && optimizedEnd) {
          optimizedStart.setHours(
            changeType === "modified" ? startHour + 1 : startHour,
            0,
            0
          );
          optimizedEnd.setHours(
            changeType === "modified" ? endHour + 1 : endHour,
            0,
            0
          );
        }

        sampleChanges.push({
          id: `change-${i}`,
          employeeId: employee.id,
          employeeName: employee.name,
          original: {
            start: originalStart,
            end: originalEnd,
            position: "매장 직원",
          },
          optimized: {
            start: optimizedStart,
            end: optimizedEnd,
            position: "매장 직원",
          },
          changeType,
          impact,
          conflictReason:
            Math.random() > 0.8 ? "다른 근무와 시간 중복" : undefined,
        });
      }

      setOptimizationResults(sampleChanges);
      setHasOptimizationResults(true);
      setOptimizationLoading(false);

      // 자동으로 결과 비교 화면 표시
      setShowComparison(true);
    }, 2000);
  };

  // 최적화 설정 변경 핸들러
  const handleOptimizationSettingsChange = (settings: OptimizationSettings) => {
    setOptimizationSettings(settings);
  };

  // 결과 비교 핸들러
  const handleCompareResults = () => {
    setShowComparison(true);
  };

  // 설정 초기화 핸들러
  const handleResetSettings = () => {
    setOptimizationSettings({
      equalDistribution: 7,
      preferenceWeight: 8,
      minimumStaffing: 9,
      minimizeCost: 5,
      considerEmployeeRequests: true,
      respectWorkingHourLimits: true,
      maxShiftsPerDay: 2,
      minHoursBetweenShifts: 10,
    });
  };

  // 변경사항 적용 핸들러
  const handleApplyChanges = (selectedChanges: string[]) => {
    // 실제로는 API 호출하여 변경사항 적용
    console.log("적용할 변경사항:", selectedChanges);
    setShowComparison(false);

    // 적용 성공 메시지 표시 (실제로는 구현 필요)
    alert(`선택한 ${selectedChanges.length}개 변경사항이 적용되었습니다.`);
  };

  // 모든 변경사항 적용 핸들러
  const handleApplyAllChanges = () => {
    // 실제로는 API 호출하여 모든 변경사항 적용
    console.log("모든 변경사항 적용:", optimizationResults.length);
    setShowComparison(false);

    // 적용 성공 메시지 표시 (실제로는 구현 필요)
    alert(`${optimizationResults.length}개 모든 변경사항이 적용되었습니다.`);
  };

  // 가용시간 미니맵 렌더링
  const renderAvailabilityMinimap = (employeeId: string) => {
    const employeeAvailabilities = availabilities.filter(
      (a) => a.employeeId === employeeId
    );

    return (
      <Box sx={{ display: "flex", mt: 1, mb: 1 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const dayAvailability = employeeAvailabilities.find(
            (a) => a.dayOfWeek === day
          );

          // 해당 요일에 가용 정보가 없거나 불가능 상태이고 불가능 표시 옵션이 꺼져 있으면 회색으로 표시
          if (
            !dayAvailability ||
            (!showUnavailable && dayAvailability.preference === "unavailable")
          ) {
            return (
              <Box
                key={day}
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: "#E0E0E0",
                  mr: 0.5,
                  borderRadius: 0.5,
                }}
              />
            );
          }

          return (
            <Tooltip
              key={day}
              title={`${DAYS_OF_WEEK[day]}: ${dayAvailability.startTime}-${
                dayAvailability.endTime
              } (${
                dayAvailability.preference === "preferred"
                  ? "선호"
                  : dayAvailability.preference === "available"
                  ? "가능"
                  : "불가능"
              })`}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: PREFERENCE_COLORS[dayAvailability.preference],
                  mr: 0.5,
                  borderRadius: 0.5,
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  // 추천 점수에 따른 색상 및 라벨
  const getScoreInfo = (score: number) => {
    const level = SCORE_LEVELS.find((level) => score >= level.min);
    return level || SCORE_LEVELS[SCORE_LEVELS.length - 1];
  };

  // 현재 근무 요일
  const getShiftDay = (shift: Shift | null) => {
    if (!shift) return -1;
    return getDay(new Date(shift.start));
  };

  // 해당 요일에 직원이 근무 가능한지 확인
  const isEmployeeAvailable = (employeeId: string, dayOfWeek: number) => {
    const employeeAvailability = availabilities.find(
      (a) => a.employeeId === employeeId && a.dayOfWeek === dayOfWeek
    );

    return (
      employeeAvailability && employeeAvailability.preference !== "unavailable"
    );
  };

  // 추천 직원 목록 렌더링
  const renderRecommendations = () => {
    if (!selectedShift) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          근무를 선택하여 추천 직원을 확인하세요.
        </Alert>
      );
    }

    if (recommendations.length === 0) {
      return (
        <Alert severity="warning" sx={{ m: 2 }}>
          추천할 직원이 없습니다.
        </Alert>
      );
    }

    const shiftDay = getShiftDay(selectedShift);

    return (
      <List>
        {recommendations.map(({ employeeId, score }) => {
          const employee = employees.find((emp) => emp.id === employeeId);
          if (!employee) return null;

          const scoreInfo = getScoreInfo(score);
          const isAvailable = isEmployeeAvailable(employeeId, shiftDay);

          return (
            <Card
              key={employeeId}
              variant="outlined"
              sx={{
                mb: 1,
                borderLeft: 4,
                borderColor: scoreInfo.color,
                opacity: isAvailable ? 1 : 0.6,
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: scoreInfo.color }}>
                    {employee.name.charAt(0)}
                  </Avatar>
                }
                title={employee.name}
                subheader={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Chip
                      label={`${scoreInfo.label} (${score}점)`}
                      size="small"
                      sx={{
                        bgcolor: scoreInfo.color,
                        color: "white",
                        mr: 1,
                      }}
                    />
                    {!isAvailable && (
                      <Chip
                        icon={<WarningIcon />}
                        label="해당 요일 불가능"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
              />
              <CardContent sx={{ pt: 0, pb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {employee.role || "일반 근무자"}
                </Typography>
                {renderAvailabilityMinimap(employeeId)}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => handleViewAvailability(employeeId)}
                >
                  가용시간 보기
                </Button>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => handleAssignEmployee(employeeId)}
                  disabled={!isAvailable}
                  sx={{ ml: "auto" }}
                >
                  배정하기
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </List>
    );
  };

  // 전체 알바생 가용시간 렌더링
  const renderAvailabilityOverview = () => {
    if (employees.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          등록된 알바생이 없습니다.
        </Alert>
      );
    }

    return (
      <>
        <StaffingSummary data={availabilityData} />

        <AvailabilityHeatmap data={availabilityData} />
      </>
    );
  };

  // 최적화 기능 렌더링
  const renderOptimization = () => {
    return (
      <>
        <OptimizationControls
          settings={optimizationSettings}
          onSettingsChange={handleOptimizationSettingsChange}
          onRunOptimization={handleRunOptimization}
          onCompareResults={handleCompareResults}
          onReset={handleResetSettings}
          isLoading={optimizationLoading}
          hasResults={hasOptimizationResults}
        />

        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
          <Typography variant="subtitle1" gutterBottom>
            최적화 설명
          </Typography>
          <Typography variant="body2" paragraph>
            최적화 기능은 직원들의 선호도와 가용 시간, 매장의 필요 인력 등을
            고려하여 최적의 스케줄을 자동으로 생성합니다. 다양한 제약 조건과
            우선순위를 설정하여 효율적인 근무표를 만들 수 있습니다.
          </Typography>
          <Typography variant="body2">
            스케줄 최적화 과정에서 고려되는 요소:
          </Typography>
          <ul>
            <li>
              <Typography variant="body2">
                직원의 선호 시간대 및 가용 시간
              </Typography>
            </li>
            <li>
              <Typography variant="body2">근무 시간 분배의 균등성</Typography>
            </li>
            <li>
              <Typography variant="body2">
                직원별 주당 최대 근무 시간
              </Typography>
            </li>
            <li>
              <Typography variant="body2">휴가 및 요청 사항</Typography>
            </li>
            <li>
              <Typography variant="body2">시간대별 필요 인력</Typography>
            </li>
          </ul>
        </Paper>
      </>
    );
  };

  // 주간 스케줄 최적화 렌더링
  const renderWeeklySchedule = () => {
    if (employees.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          등록된 알바생이 없습니다.
        </Alert>
      );
    }

    return (
      <WeeklyScheduleOptimizer
        employees={employees}
        onApplySchedule={handleWeeklyScheduleApply}
      />
    );
  };

  // 가용시간 상세 대화상자 렌더링
  const renderAvailabilityDialog = () => {
    if (!selectedEmployee) return null;

    const employee = employees.find((emp) => emp.id === selectedEmployee);
    if (!employee) return null;

    const employeeAvailabilities = availabilities.filter(
      (a) => a.employeeId === selectedEmployee
    );

    return (
      <Dialog
        open={showAvailabilityDialog}
        onClose={() => setShowAvailabilityDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{employee.name}의 가용시간</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              요일별 가용시간
            </Typography>
            <Grid container spacing={1}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const dayAvailability = employeeAvailabilities.find(
                  (a) => a.dayOfWeek === day
                );

                let content;
                let color;

                if (!dayAvailability) {
                  content = "설정되지 않음";
                  color = "#E0E0E0";
                } else {
                  content = `${dayAvailability.startTime} - ${dayAvailability.endTime}`;
                  color = PREFERENCE_COLORS[dayAvailability.preference];
                }

                return (
                  <Grid item xs={12} key={day}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderLeft: 4,
                        borderColor: color,
                        bgcolor: "grey.50",
                      }}
                    >
                      <Typography variant="subtitle2">
                        {DAYS_OF_WEEK[day]}요일
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2">{content}</Typography>
                        {dayAvailability && (
                          <Chip
                            label={
                              dayAvailability.preference === "preferred"
                                ? "선호"
                                : dayAvailability.preference === "available"
                                ? "가능"
                                : "불가능"
                            }
                            size="small"
                            sx={{
                              bgcolor: color,
                              color: "white",
                            }}
                          />
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {selectedShift && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                선택된 근무 정보
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: "grey.50",
                  borderLeft: 4,
                  borderColor: "primary.main",
                }}
              >
                <Typography variant="subtitle2">
                  {format(
                    new Date(selectedShift.start),
                    "yyyy년 MM월 dd일 (eee)"
                  )}
                </Typography>
                <Typography variant="body2">
                  {format(new Date(selectedShift.start), "HH:mm")} -{" "}
                  {format(new Date(selectedShift.end), "HH:mm")}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">해당 요일 가용 상태:</Typography>
                  {(() => {
                    const shiftDay = getShiftDay(selectedShift);
                    const availability = employeeAvailabilities.find(
                      (a) => a.dayOfWeek === shiftDay
                    );

                    if (!availability) {
                      return (
                        <Chip
                          icon={<WarningIcon />}
                          label="설정되지 않음"
                          size="small"
                          color="default"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      );
                    }

                    return (
                      <Chip
                        icon={
                          availability.preference === "preferred" ? (
                            <CheckCircleIcon />
                          ) : availability.preference === "available" ? (
                            <CheckCircleIcon />
                          ) : (
                            <CancelIcon />
                          )
                        }
                        label={
                          availability.preference === "preferred"
                            ? "선호"
                            : availability.preference === "available"
                            ? "가능"
                            : "불가능"
                        }
                        size="small"
                        color={
                          availability.preference === "preferred"
                            ? "success"
                            : availability.preference === "available"
                            ? "primary"
                            : "error"
                        }
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    );
                  })()}
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAvailabilityDialog(false)}>닫기</Button>
          {selectedShift &&
            isEmployeeAvailable(
              selectedEmployee,
              getShiftDay(selectedShift)
            ) && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  handleAssignEmployee(selectedEmployee);
                  setShowAvailabilityDialog(false);
                }}
                startIcon={<ArrowForwardIcon />}
              >
                배정하기
              </Button>
            )}
        </DialogActions>
      </Dialog>
    );
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

  // 에러 상태 표시
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{ ml: 2 }}
        >
          다시 시도
        </Button>
      </Alert>
    );
  }

  return (
    <Paper elevation={0} sx={{ height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          px: 2,
        }}
      >
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            icon={<CalendarViewWeekIcon />}
            label="주간 스케줄 짜기"
            value="weekly"
          />
          <Tab
            icon={<PersonIcon />}
            label="전체 가용시간"
            value="availability"
          />
          <Tab
            icon={<EventIcon />}
            label="스케줄 적합도 분석"
            value="optimization"
          />
        </Tabs>

        <Box sx={{ flexGrow: 1 }} />

        <FormControlLabel
          control={
            <Switch
              checked={showUnavailable}
              onChange={(e) => setShowUnavailable(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2">불가능 시간 표시</Typography>}
          sx={{ mr: 1 }}
        />

        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 0, height: "calc(100% - 48px)", overflow: "auto" }}>
        {activeTab === "weekly" && (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <WeeklyScheduleOptimizer
              employees={employees}
              onApplySchedule={handleWeeklyScheduleApply}
            />
          </Box>
        )}
        {activeTab === "availability" && (
          <Box sx={{ p: 2 }}>{renderAvailabilityOverview()}</Box>
        )}
        {activeTab === "optimization" && (
          <Box sx={{ p: 2 }}>{renderOptimization()}</Box>
        )}
      </Box>

      {/* 가용시간 상세 대화상자 */}
      {renderAvailabilityDialog()}

      {/* 변경사항 비교 대화상자 */}
      {showComparison && (
        <ScheduleComparison
          changes={optimizationResults}
          onApply={handleApplyChanges}
          onApplyAll={handleApplyAllChanges}
          onCancel={() => setShowComparison(false)}
          isLoading={false}
        />
      )}
    </Paper>
  );
};

export default OptimalScheduling;
