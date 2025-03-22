import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ButtonGroup,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Update as UpdateIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { Employee } from "../../../lib/types";
import { format } from "date-fns";

// Employee 타입 확장 정의
interface EmployeeWithDetails {
  id: string;
  name: string;
  role?: string;
  positions: string[];
  availability?: {
    [day: number]: {
      [shift: string]: number;
    };
  };
}

// 시프트 타입 정의
type ShiftType = "open" | "middle" | "close" | string;

// 근무 템플릿 타입 정의
interface ShiftTemplate {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string; // 'HH:MM' 포맷
  endTime: string; // 'HH:MM' 포맷
  requiredStaff: number;
  color: string;
  requiredPositions?: {
    // 포지션별 필요 인원수 추가
    [position: string]: number;
  };
  dayVariations?: {
    // 요일별 변동 사항 추가
    [day: number]: {
      requiredStaff?: number;
      requiredPositions?: {
        [position: string]: number;
      };
    };
  };
}

// 요일 정의
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 포지션 목록
const POSITIONS = ["매니저", "바리스타", "서빙", "주방", "캐셔"];

// 스케줄 아이템 타입 정의
interface ScheduleItem {
  id: string;
  day: number; // 0-6 (일요일-토요일)
  shiftType: ShiftType;
  employeeId: string | null;
  position: string;
}

interface WeeklyScheduleManagerProps {
  employees: Employee[];
  onApplySchedule: (schedule: ScheduleItem[]) => void;
  templates?: ShiftTemplate[];
  initialSchedule?: ScheduleItem[];
}

const WeeklyScheduleManager: React.FC<WeeklyScheduleManagerProps> = ({
  employees: initialEmployees,
  onApplySchedule,
  templates = [],
  initialSchedule = [],
}) => {
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [currentSchedule, setCurrentSchedule] =
    useState<ScheduleItem[]>(initialSchedule);
  const [recentSchedule, setRecentSchedule] = useState<ScheduleItem[]>([]);
  const [loadingCurrentSchedule, setLoadingCurrentSchedule] = useState(false);
  const [showDatePickerDialog, setShowDatePickerDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [highlightDay, setHighlightDay] = useState<number | null>(null);
  const [scheduleStartDate, setScheduleStartDate] = useState<Date | null>(
    new Date()
  );

  // 템플릿에서 시간 정보 가져오기 (템플릿이 없으면 기본값 사용)
  const shiftTimes = React.useMemo(() => {
    const defaultShiftTimes: Record<ShiftType, string> = {
      open: "오픈 (09:00-15:00)",
      middle: "미들 (15:00-17:00)",
      close: "마감 (17:00-22:00)",
    };

    if (templates.length === 0) return defaultShiftTimes;

    const result: Record<ShiftType, string> = { ...defaultShiftTimes };
    templates.forEach((template) => {
      result[
        template.type
      ] = `${template.name} (${template.startTime}-${template.endTime})`;
    });

    return result;
  }, [templates]);

  // 초기 데이터 설정
  useEffect(() => {
    // 초기 직원 데이터 변환 (Employee 타입을 EmployeeWithDetails로 확장)
    const enhancedEmployees = initialEmployees.map((emp) => ({
      ...emp,
      positions: emp.role ? [emp.role] : ["일반"], // role을 positions 배열로 변환
      availability: {},
    })) as EmployeeWithDetails[];

    setEmployees(enhancedEmployees);

    // 샘플 스케줄 생성
    if (currentSchedule.length === 0) {
      createEmptySchedule();
    }
  }, [initialEmployees]);

  // initialSchedule이 변경될 때 스케줄 업데이트
  useEffect(() => {
    if (initialSchedule && initialSchedule.length > 0) {
      setCurrentSchedule(initialSchedule);
    }
  }, [initialSchedule]);

  // Mock API 호출 함수 - 실제 구현에서는 axios 등을 사용할 것
  const loadCurrentSchedule = async () => {
    setLoadingCurrentSchedule(true);
    try {
      // 실제로는 API 호출
      // 여기서는 샘플 데이터로 대체
      setTimeout(() => {
        if (currentSchedule.length === 0) {
          createEmptySchedule();
        }
        setLoadingCurrentSchedule(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading current schedule:", error);
      setLoadingCurrentSchedule(false);
    }
  };

  // 최근 스케줄 불러오기 - Mock
  const loadRecentSchedule = async () => {
    // 실제로는 API 호출
    // 여기서는 현재 스케줄을 복사하여 사용
    setRecentSchedule([...currentSchedule]);
  };

  // 최근 스케줄 적용하기
  const applyRecentSchedule = () => {
    if (recentSchedule.length === 0) {
      alert("적용할 최근 스케줄이 없습니다.");
      return;
    }

    setCurrentSchedule(recentSchedule);
    alert("최근 스케줄이 적용되었습니다.");
  };

  // 빈 스케줄 생성
  const createEmptySchedule = () => {
    if (
      currentSchedule.length > 0 &&
      !window.confirm("현재 스케줄을 모두 지우고 새로 시작하시겠습니까?")
    ) {
      return;
    }

    const emptySchedule: ScheduleItem[] = [];

    // 각 요일 및 시간대별로 빈 스케줄 항목 생성
    DAYS_OF_WEEK.forEach((_, dayIndex) => {
      Object.keys(shiftTimes).forEach((shiftType) => {
        const shiftKey = shiftType as ShiftType;

        // 해당 시프트 템플릿 찾기
        const template = templates.find((t) => t.type === shiftKey);
        if (!template) return; // 템플릿이 없으면 건너뜀

        // 해당 요일에 대한 변동 사항 확인
        const dayVariation = template.dayVariations?.[dayIndex];

        // 필요 포지션 및 인원수 결정
        let requiredPositions: Record<string, number> = {};

        if (template.requiredPositions) {
          // 기본 필요 포지션 설정
          requiredPositions = { ...template.requiredPositions };

          // 요일별 변동 사항이 있다면 적용
          if (dayVariation?.requiredPositions) {
            // 요일별 설정이 있는 포지션만 덮어쓰기
            Object.entries(dayVariation.requiredPositions).forEach(
              ([pos, count]) => {
                requiredPositions[pos] = count;
              }
            );
          }
        } else {
          // 템플릿에 필요 포지션이 정의되지 않았으면 기본 포지션 사용
          POSITIONS.forEach((pos) => {
            requiredPositions[pos] = 1;
          });
        }

        // 필요한 포지션별로 빈 스케줄 항목 생성
        Object.entries(requiredPositions).forEach(([position, count]) => {
          // 각 포지션별 필요 인원수만큼 항목 생성
          for (let i = 0; i < count; i++) {
            emptySchedule.push({
              id: `${dayIndex}-${shiftKey}-${position}-${i}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              day: dayIndex,
              shiftType: shiftKey,
              position,
              employeeId: null,
            });
          }
        });
      });
    });

    setCurrentSchedule(emptySchedule);
  };

  // 템플릿이 변경될 때 스케줄 재생성
  useEffect(() => {
    if (templates.length > 0 && currentSchedule.length === 0) {
      // 기존 스케줄이 없을 때만 자동 생성
      createEmptySchedule();
    }
  }, [templates]);

  // 스케줄 적용하기
  const applyScheduleToDate = async () => {
    if (!selectedDate) {
      alert("날짜를 선택해주세요.");
      return;
    }

    try {
      // 실제로는 API 호출
      // const response = await axios.post("/api/schedules/apply", {
      //   startDate: selectedDate,
      //   schedule: currentSchedule,
      // });

      // API 호출 대신 props로 전달된 콜백 함수 호출
      onApplySchedule(currentSchedule);

      setShowDatePickerDialog(false);
      setShowNotificationDialog(true);
      alert("스케줄이 성공적으로 적용되었습니다.");
    } catch (error) {
      console.error("Error applying schedule:", error);
      alert("스케줄 적용에 실패했습니다.");
    }
  };

  // 스케줄 항목 클릭 시 직원 변경
  const handleScheduleItemClick = (item: ScheduleItem) => {
    // 직원 선택 대화상자 표시
    const currentEmployeeId = item.employeeId;

    // 해당 포지션에 배정 가능한 직원 필터링
    const availableEmployees = employees.filter((employee) =>
      employee.positions.includes(item.position)
    );

    if (availableEmployees.length === 0) {
      alert(`${item.position} 포지션에 배정 가능한 직원이 없습니다.`);
      return;
    }

    // 직원 선택 대화상자 표시
    const employee = window.prompt(
      `${DAYS_OF_WEEK[item.day]} ${shiftTimes[item.shiftType]} ${
        item.position
      } 담당자 변경\n\n이름을 입력하거나 번호를 선택하세요:\n${availableEmployees
        .map((e, i) => `${i + 1}. ${e.name}`)
        .join("\n")}\n\n0. 배정 취소`,
      currentEmployeeId
        ? employees.find((e) => e.id === currentEmployeeId)?.name
        : ""
    );

    if (employee === null) return; // 취소됨

    if (employee === "0" || employee.trim() === "") {
      // 배정 취소
      setCurrentSchedule((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, employeeId: null } : s))
      );
      return;
    }

    // 번호로 선택된 경우
    if (/^\d+$/.test(employee)) {
      const index = parseInt(employee) - 1;
      if (
        index >= 0 &&
        index < availableEmployees.length &&
        availableEmployees[index]
      ) {
        setCurrentSchedule((prev) =>
          prev.map((s) =>
            s.id === item.id
              ? { ...s, employeeId: availableEmployees[index].id }
              : s
          )
        );
        return;
      }
    }

    // 이름으로 선택된 경우
    const foundEmployee = availableEmployees.find(
      (e) => e.name === employee.trim()
    );
    if (foundEmployee) {
      setCurrentSchedule((prev) =>
        prev.map((s) =>
          s.id === item.id ? { ...s, employeeId: foundEmployee.id } : s
        )
      );
    } else {
      alert(
        `'${employee}'에 해당하는 직원을 찾을 수 없습니다. 목록에서 선택해주세요.`
      );
    }
  };

  // 특정 일자, 시간대, 포지션에 해당하는 스케줄 항목 가져오기
  const getScheduleItems = (
    day: number,
    shiftType: ShiftType,
    scheduleSource: ScheduleItem[] = currentSchedule
  ) => {
    return scheduleSource.filter(
      (item) => item.day === day && item.shiftType === shiftType
    );
  };

  // 직원의 특정 일자, 시간대 가용성 표시
  const renderAvailabilityBadge = (
    employeeId: string,
    day: number,
    shiftType: ShiftType
  ) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return null;

    const availability = employee.availability?.[day]?.[shiftType];

    if (availability === undefined) return null;

    let color: "success" | "warning" | "error" = "success";
    let label = "선호";

    if (availability === 0) {
      color = "error";
      label = "불가";
    } else if (availability === 1) {
      color = "warning";
      label = "가능";
    }

    return (
      <Chip
        label={label}
        color={color}
        size="small"
        sx={{ ml: 1, height: 20, "& .MuiChip-label": { px: 1 } }}
      />
    );
  };

  // 템플릿에 따른 셀 배경색 가져오기
  const getShiftBackgroundColor = (shiftType: ShiftType): string => {
    const template = templates.find((t) => t.type === shiftType);
    return template ? `${template.color}10` : "transparent"; // 10% 투명도의 템플릿 색상 반환
  };

  // 요일별 헤더 색상 설정
  const getDayHeaderColor = (dayIndex: number): string => {
    // 일요일(0)과 토요일(6)은 특별 색상, 나머지는 일반 색상
    if (dayIndex === 0) return "rgba(244, 67, 54, 0.1)"; // 일요일: 빨간색 계열
    if (dayIndex === 6) return "rgba(33, 150, 243, 0.1)"; // 토요일: 파란색 계열
    return "background.paper"; // 나머지 요일
  };

  // 현재 스케줄 렌더링
  const renderCurrentSchedule = () => {
    return (
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          maxHeight: "calc(100vh - 280px)",
          overflowY: "auto",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  width: "12%",
                  backgroundColor: "background.paper",
                  zIndex: 1200,
                }}
              >
                시간대
              </TableCell>
              {DAYS_OF_WEEK.map((day, index) => (
                <TableCell
                  key={day}
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: getDayHeaderColor(index),
                    color:
                      index === 0
                        ? "error.main"
                        : index === 6
                        ? "primary.main"
                        : "inherit",
                    bgcolor:
                      highlightDay === index
                        ? "action.selected"
                        : getDayHeaderColor(index),
                    zIndex: 1100,
                  }}
                  onMouseEnter={() => setHighlightDay(index)}
                  onMouseLeave={() => setHighlightDay(null)}
                >
                  {day}
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    {scheduleStartDate && formatDate(index, scheduleStartDate)}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(shiftTimes).map(([shiftKey, shiftLabel]) => (
              <TableRow key={shiftKey}>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    borderLeft: `4px solid ${getShiftColor(
                      shiftKey as ShiftType
                    )}`,
                  }}
                >
                  {shiftLabel}
                </TableCell>
                {DAYS_OF_WEEK.map((_, dayIndex) => {
                  const scheduleItems = getScheduleItems(
                    dayIndex,
                    shiftKey as ShiftType
                  );

                  return (
                    <TableCell
                      key={dayIndex}
                      sx={{
                        p: 1,
                        bgcolor:
                          highlightDay === dayIndex
                            ? "action.selected"
                            : getShiftBackgroundColor(shiftKey as ShiftType),
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {scheduleItems.map((item) => {
                          const employee = employees.find(
                            (e) => e.id === item.employeeId
                          );

                          return (
                            <Box
                              key={item.id}
                              onClick={() => handleScheduleItemClick(item)}
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                border: 1,
                                borderColor: item.employeeId
                                  ? "primary.main"
                                  : "divider",
                                bgcolor: item.employeeId
                                  ? "rgba(33, 150, 243, 0.05)"
                                  : "background.paper",
                                cursor: "pointer",
                                "&:hover": {
                                  bgcolor: "action.hover",
                                  boxShadow: 1,
                                },
                                transition: "all 0.2s",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={
                                    item.employeeId ? "bold" : "normal"
                                  }
                                  color={
                                    item.employeeId
                                      ? "primary.main"
                                      : "text.secondary"
                                  }
                                >
                                  {item.employeeId
                                    ? employee?.name
                                    : "클릭하여 배정"}
                                </Typography>
                                {item.employeeId &&
                                  renderAvailabilityBadge(
                                    item.employeeId,
                                    dayIndex,
                                    shiftKey as ShiftType
                                  )}
                              </Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "block",
                                  mt: 0.5,
                                  bgcolor: "rgba(0,0,0,0.04)",
                                  p: 0.5,
                                  borderRadius: 0.5,
                                  textAlign: "center",
                                }}
                              >
                                {item.position}
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

  // 템플릿 색상 가져오기
  const getShiftColor = (shiftType: ShiftType): string => {
    const template = templates.find((t) => t.type === shiftType);
    if (template) return template.color;

    // 기본 색상
    switch (shiftType) {
      case "open":
        return "#4CAF50";
      case "middle":
        return "#2196F3";
      case "close":
        return "#9C27B0";
      default:
        return "#757575";
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dayOffset: number, startDate: Date = new Date()) => {
    const date = new Date(startDate);
    const dayDiff = dayOffset - date.getDay();
    date.setDate(date.getDate() + dayDiff);
    return format(date, "MM/dd");
  };

  // 날짜 선택 대화상자 렌더링
  const renderDatePickerDialog = () => {
    return (
      <Dialog
        open={showDatePickerDialog}
        onClose={() => setShowDatePickerDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>시작 날짜 선택</DialogTitle>
        <DialogContent>
          <DialogContentText>
            선택한 날짜부터 시작하는 주간 스케줄에 적용됩니다.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="시작 날짜"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                slotProps={{
                  textField: { fullWidth: true, variant: "outlined" },
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDatePickerDialog(false)}>취소</Button>
          <Button
            onClick={applyScheduleToDate}
            color="primary"
            disabled={!selectedDate}
          >
            적용하기
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // 직원 변경 알림 대화상자 렌더링
  const renderEmployeeNotificationDialog = () => {
    return (
      <Dialog
        open={showNotificationDialog}
        onClose={() => setShowNotificationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>스케줄 변경 알림</DialogTitle>
        <DialogContent>
          <DialogContentText>
            직원들에게 변경된 스케줄을 알릴 방법을 선택하세요.
          </DialogContentText>

          <List sx={{ mt: 2 }}>
            <ListItem
              sx={{ cursor: "pointer" }}
              onClick={() => {
                setShowNotificationDialog(false);
                alert("이메일로 알림이 전송되었습니다.");
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <EmailIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="이메일 전송"
                secondary="모든 직원에게 변경된 스케줄 내용을 이메일로 알립니다."
              />
            </ListItem>

            <ListItem
              sx={{ cursor: "pointer" }}
              onClick={() => {
                setShowNotificationDialog(false);
                alert("SMS로 알림이 전송되었습니다.");
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "success.main" }}>
                  <SmsIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="SMS 전송"
                secondary="모든 직원에게 스케줄 변경 내용을 SMS로 알립니다."
              />
            </ListItem>

            <ListItem
              sx={{ cursor: "pointer" }}
              onClick={() => {
                setShowNotificationDialog(false);
                alert("앱 푸시 알림이 전송되었습니다.");
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <NotificationsIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="앱 푸시 알림"
                secondary="직원용 앱을 통해 스케줄 변경 알림을 전송합니다."
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotificationDialog(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          요일별(일~토) 기본 스케줄을 생성하고, 인원 배치를 계획하여 실제
          스케줄에 적용할 수 있습니다. 각 직원의 포지션과 가용 시간을 고려하여
          효율적인 스케줄을 만드세요.
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
          <Box
            sx={{
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <ButtonGroup size="small" variant="outlined">
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadCurrentSchedule}
                disabled={loadingCurrentSchedule}
              >
                새로고침
              </Button>
              <Button
                startIcon={<UpdateIcon />}
                onClick={applyRecentSchedule}
                disabled={recentSchedule.length === 0}
              >
                최근 계획 불러오기
              </Button>
            </ButtonGroup>
            <Box>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={createEmptySchedule}
                sx={{ mr: 1 }}
              >
                초기화
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => setShowDatePickerDialog(true)}
              >
                일정에 적용하기
              </Button>
            </Box>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              mb: 1.5,
              p: 1.5,
              backgroundColor: "rgba(33, 150, 243, 0.08)",
              borderColor: "rgba(33, 150, 243, 0.2)",
            }}
          >
            <Typography variant="body2">
              <strong>사용 방법:</strong> 각 셀을 클릭하여 담당 직원을
              배정하세요. 필요한 포지션별로 셀이 생성됩니다. 오른쪽 일정
              적용하기 버튼으로 계획된 스케줄을 실제 근무표에 반영할 수
              있습니다.
            </Typography>
          </Paper>

          <Box
            sx={{ mb: 2, flexGrow: 2, overflow: "auto", minHeight: "500px" }}
          >
            {renderCurrentSchedule()}
          </Box>
        </>
      )}

      {/* 날짜 선택 대화상자 */}
      {renderDatePickerDialog()}

      {/* 직원 변경 알림 대화상자 */}
      {renderEmployeeNotificationDialog()}
    </Box>
  );
};

export default WeeklyScheduleManager;
