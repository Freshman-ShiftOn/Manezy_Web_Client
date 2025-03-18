import React, { useState, useEffect } from "react";
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
} from "@mui/icons-material";
import { format, getDay } from "date-fns";
import {
  getEmployees,
  getEmployeeAvailabilities,
  getRecommendedEmployees,
  saveShift,
  getShifts,
  generateDummyData,
} from "../../services/api";
import { Employee, EmployeeAvailability, Shift } from "../../lib/types";

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
  const [activeTab, setActiveTab] = useState<"recommendation" | "availability">(
    "recommendation"
  );
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

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
  const handleTabChange = (
    _: React.SyntheticEvent,
    newValue: "recommendation" | "availability"
  ) => {
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
      <List>
        {employees.map((employee) => (
          <Card key={employee.id} variant="outlined" sx={{ mb: 1 }}>
            <CardHeader
              avatar={<Avatar>{employee.name.charAt(0)}</Avatar>}
              title={employee.name}
              subheader={employee.role || "일반 근무자"}
            />
            <CardContent sx={{ pt: 0, pb: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                가용시간 요약
              </Typography>
              {renderAvailabilityMinimap(employee.id)}
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={() => handleViewAvailability(employee.id)}
              >
                상세 보기
              </Button>
              {selectedShift && (
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => handleAssignEmployee(employee.id)}
                  disabled={
                    !isEmployeeAvailable(
                      employee.id,
                      getShiftDay(selectedShift)
                    )
                  }
                  sx={{ ml: "auto" }}
                >
                  배정하기
                </Button>
              )}
            </CardActions>
          </Card>
        ))}
      </List>
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
            icon={<AutoAwesomeIcon />}
            label="추천 알바생"
            value="recommendation"
            disabled={!selectedShift}
          />
          <Tab
            icon={<PersonIcon />}
            label="전체 가용시간"
            value="availability"
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

      {selectedShift && (
        <Paper
          elevation={0}
          sx={{
            mx: 2,
            mt: 2,
            p: 1,
            bgcolor: "primary.light",
            color: "primary.contrastText",
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <EventIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle2">
              {format(new Date(selectedShift.start), "yyyy년 MM월 dd일 (eee)")}
            </Typography>
            <TimeIcon sx={{ ml: 2, mr: 1 }} />
            <Typography variant="subtitle2">
              {format(new Date(selectedShift.start), "HH:mm")} -{" "}
              {format(new Date(selectedShift.end), "HH:mm")}
            </Typography>
          </Box>
        </Paper>
      )}

      <Box sx={{ p: 0, height: "calc(100% - 48px)", overflow: "auto" }}>
        <Box sx={{ p: 2 }}>
          {activeTab === "recommendation" && renderRecommendations()}
          {activeTab === "availability" && renderAvailabilityOverview()}
        </Box>
      </Box>

      {/* 가용시간 상세 대화상자 */}
      {renderAvailabilityDialog()}
    </Paper>
  );
};

export default OptimalScheduling;
