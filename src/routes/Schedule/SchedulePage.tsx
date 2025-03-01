import React, { useState, useEffect, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DateSelectArg } from "@fullcalendar/core";

import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Badge,
  Card,
  CardContent,
  Tooltip,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Drawer,
  FormGroup,
  ListItemButton,
  ListItemIcon,
  Alert,
  useTheme,
} from "@mui/material";
import {
  CalendarMonth,
  ViewWeek,
  AccessTime,
  MoreVert,
  CalendarViewMonth,
  CalendarViewWeek,
  PersonAdd,
  PersonRemove,
} from "@mui/icons-material";
import ShiftDialog from "./ShiftDialog";
import {
  getEmployees,
  getStoreInfo,
  getShifts,
  saveShift,
} from "../../services/api";
import { Employee, Store, Shift } from "../../lib/types";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  addDays,
  format,
  parseISO,
  set,
  startOfDay,
  addHours,
  differenceInHours,
} from "date-fns";

// 근무 이벤트 데이터 구조
interface ShiftEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string;
  color?: string;
  extendedProps?: {
    employeeIds?: string[];
    employeeNames?: string[];
    note?: string;
    recurring?: {
      frequency: "weekly";
      daysOfWeek?: number[];
      endDate?: string;
    };
  };
}

// 알바생별 색상 팔레트 (최대 10명)
const EMPLOYEE_COLORS = [
  "#4285F4", // 파랑
  "#EA4335", // 빨강
  "#FBBC05", // 노랑
  "#34A853", // 초록
  "#8E24AA", // 보라
  "#16A2B8", // 청록
  "#F6BF26", // 황금
  "#F57C00", // 주황
  "#1E88E5", // 하늘
  "#6E85B7", // 남색
];

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [viewType, setViewType] = useState<"timeGridWeek" | "dayGridMonth">(
    "timeGridWeek"
  );
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ShiftEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployeeIds, setFilteredEmployeeIds] = useState<string[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(true);

  // 매장과 알바생 정보 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const storeData = await getStoreInfo();
        const employeesData = await getEmployees();

        setStore(storeData);
        setEmployees(employeesData);

        // 기본적으로 모든 알바생 필터에 포함
        setFilteredEmployeeIds(employeesData.map((emp) => emp.id));

        // 근무 일정 로드
        const shifts = await getShifts();
        setEvents(
          shifts.map((shift: Shift) => ({
            id: shift.id,
            title: shift.title || "",
            start: shift.start,
            end: shift.end,
            color: getEmployeeColor(shift.employeeIds?.[0]),
            extendedProps: {
              employeeIds: shift.employeeIds,
              employeeNames: shift.employeeIds?.map(
                (id: string) =>
                  employeesData.find((e) => e.id === id)?.name || "Unknown"
              ),
              note: shift.note,
              recurring: shift.isRecurring
                ? {
                    frequency: "weekly",
                    daysOfWeek: [new Date(shift.start).getDay()],
                  }
                : undefined,
            },
          }))
        );

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // 알바생 ID에 따른 색상 반환
  const getEmployeeColor = useCallback(
    (employeeId?: string): string => {
      if (!employeeId) return EMPLOYEE_COLORS[EMPLOYEE_COLORS.length - 1];

      const index = employees.findIndex((e) => e.id === employeeId);
      if (index === -1) return EMPLOYEE_COLORS[EMPLOYEE_COLORS.length - 1];

      return EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length];
    },
    [employees]
  );

  // 특정 직원의 이벤트만 필터링
  const filteredEvents = useMemo(() => {
    if (filteredEmployeeIds.length === 0) return events;

    return events.filter((event) => {
      if (!event.extendedProps?.employeeIds?.length) return true;
      return event.extendedProps.employeeIds.some((id) =>
        filteredEmployeeIds.includes(id)
      );
    });
  }, [events, filteredEmployeeIds]);

  // 알바생별 근무 시간 계산
  const employeeHours = useMemo(() => {
    return employees.map((employee) => {
      const employeeEvents = events.filter((event) =>
        event.extendedProps?.employeeIds?.includes(employee.id)
      );

      const totalHours = employeeEvents.reduce((total, event) => {
        const hours = differenceInHours(
          new Date(event.end),
          new Date(event.start)
        );
        return total + hours;
      }, 0);

      return {
        employee,
        totalHours,
        shiftsCount: employeeEvents.length,
        color: getEmployeeColor(employee.id),
      };
    });
  }, [employees, events, getEmployeeColor]);

  // 직원 필터 토글
  const handleEmployeeFilter = (employeeId: string) => {
    setFilteredEmployeeIds((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  // 뷰 타입 변경 핸들러
  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    newView: "timeGridWeek" | "dayGridMonth" | null
  ) => {
    if (newView) setViewType(newView);
  };

  // 날짜 선택 이벤트 핸들러
  const handleDateSelect = (selectInfo: any) => {
    // 업무 시간 외 선택 방지
    if (store) {
      const startDate = new Date(selectInfo.start);
      const endDate = new Date(selectInfo.end);

      // 시작시간 제한 (오픈 시간 이전이면 오픈 시간으로 설정)
      const openingHour = parseInt(store.openingHour.split(":")[0], 10);
      if (startDate.getHours() < openingHour) {
        startDate.setHours(openingHour, 0, 0);
      }

      // 종료시간 제한 (마감 시간 이후면 마감 시간으로 설정)
      const closingHour = parseInt(store.closingHour.split(":")[0], 10);
      if (
        endDate.getHours() > closingHour ||
        (endDate.getHours() === closingHour && endDate.getMinutes() > 0)
      ) {
        endDate.setHours(closingHour, 0, 0);
      }

      // 유효한 선택 확인 (시작시간이 종료시간보다 이전이어야 함)
      if (startDate >= endDate) {
        console.log("Invalid time selection");
        return;
      }

      const newEvent: ShiftEvent = {
        id: uuidv4(),
        title: "새 근무 일정",
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        extendedProps: {
          employeeIds: [],
          employeeNames: [],
        },
      };

      setSelectedEvent(newEvent);
      setIsNewEvent(true);
      setIsDialogOpen(true);
    }
  };

  // 이벤트 클릭 핸들러
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;

    const shiftEvent: ShiftEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      color: event.backgroundColor,
      extendedProps: {
        ...event.extendedProps,
      },
    };

    setSelectedEvent(shiftEvent);
    setIsNewEvent(false);
    setIsDialogOpen(true);
  };

  // 이벤트 드래그 핸들러
  const handleEventDrop = (dropInfo: any) => {
    const { event } = dropInfo;
    const updatedEvent: ShiftEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      color: event.backgroundColor,
      extendedProps: event.extendedProps,
    };

    // 업무 시간 외 배치 방지
    if (store) {
      const startDate = new Date(updatedEvent.start);
      const endDate = new Date(updatedEvent.end);
      const openingHour = parseInt(store.openingHour.split(":")[0], 10);
      const closingHour = parseInt(store.closingHour.split(":")[0], 10);

      if (
        startDate.getHours() < openingHour ||
        endDate.getHours() > closingHour ||
        (endDate.getHours() === closingHour && endDate.getMinutes() > 0)
      ) {
        dropInfo.revert();
        return;
      }
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );

    saveShiftToApi(updatedEvent);
  };

  // 이벤트 리사이즈 핸들러
  const handleEventResize = (resizeInfo: any) => {
    const { event } = resizeInfo;
    const updatedEvent: ShiftEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      color: event.backgroundColor,
      extendedProps: event.extendedProps,
    };

    // 업무 시간 외 리사이즈 방지
    if (store) {
      const startDate = new Date(updatedEvent.start);
      const endDate = new Date(updatedEvent.end);
      const openingHour = parseInt(store.openingHour.split(":")[0], 10);
      const closingHour = parseInt(store.closingHour.split(":")[0], 10);

      if (
        startDate.getHours() < openingHour ||
        endDate.getHours() > closingHour ||
        (endDate.getHours() === closingHour && endDate.getMinutes() > 0)
      ) {
        resizeInfo.revert();
        return;
      }
    }

    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );

    saveShiftToApi(updatedEvent);
  };

  // 근무 일정 저장 핸들러
  const handleSaveShift = (shiftEvent: ShiftEvent) => {
    if (isNewEvent) {
      // 새 이벤트 추가
      setEvents((prev) => [...prev, shiftEvent]);
    } else {
      // 기존 이벤트 수정
      setEvents((prev) =>
        prev.map((e) => (e.id === shiftEvent.id ? shiftEvent : e))
      );
    }

    saveShiftToApi(shiftEvent);
    setIsDialogOpen(false);
  };

  // API로 근무 정보 저장
  const saveShiftToApi = async (shiftEvent: ShiftEvent) => {
    try {
      const shiftData: Shift = {
        id: shiftEvent.id,
        storeId: store?.id || "",
        title: shiftEvent.title,
        start: shiftEvent.start,
        end: shiftEvent.end,
        employeeIds: shiftEvent.extendedProps?.employeeIds || [],
        isRecurring: !!shiftEvent.extendedProps?.recurring,
        note: shiftEvent.extendedProps?.note || "",
        recurringPattern: shiftEvent.extendedProps?.recurring
          ? {
              frequency: "weekly",
              daysOfWeek: shiftEvent.extendedProps.recurring.daysOfWeek || [],
              endDate: shiftEvent.extendedProps.recurring.endDate,
            }
          : undefined,
      };

      await saveShift(shiftData);
    } catch (err) {
      console.error("Error saving shift:", err);
      setError("근무 일정을 저장하는 중 오류가 발생했습니다.");
    }
  };

  // 다이얼로그 닫기 핸들러
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // 알바생 페이지로 이동
  const handleGoToEmployees = () => {
    navigate("/employees");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/setup")}
          sx={{ mt: 2 }}
        >
          지점 정보 설정하기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
      {/* 메인 캘린더 영역 */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: "auto" }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h5" component="h1">
              {store?.name} 근무 일정
            </Typography>

            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={handleViewChange}
              aria-label="calendar view"
              size="small"
            >
              <ToggleButton value="timeGridWeek" aria-label="week">
                <CalendarViewWeek fontSize="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  주간
                </Typography>
              </ToggleButton>
              <ToggleButton value="dayGridMonth" aria-label="month">
                <CalendarViewMonth fontSize="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  월간
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            initialView={viewType}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={filteredEvents}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            height="auto"
            allDaySlot={false}
            slotMinTime={store?.openingHour || "09:00:00"}
            slotMaxTime={store?.closingHour || "23:00:00"}
            eventContent={(eventInfo) => {
              const employeeNames =
                eventInfo.event.extendedProps.employeeNames || [];
              return (
                <Box sx={{ p: 0.5, overflow: "hidden" }}>
                  <Typography variant="subtitle2" noWrap>
                    {eventInfo.event.title}
                  </Typography>
                  {employeeNames.length > 0 && (
                    <Typography variant="caption" noWrap>
                      {employeeNames.join(", ")}
                    </Typography>
                  )}
                </Box>
              );
            }}
          />
        </Paper>
      </Box>

      {/* 사이드 패널 */}
      <Box
        component={Paper}
        sx={{
          width: 280,
          flexShrink: 0,
          overflowY: "auto",
          borderLeft: `1px solid ${theme.palette.divider}`,
          display: showSidePanel ? "block" : "none",
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" component="h2">
            알바생 정보
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() =>
                  setFilteredEmployeeIds(employees.map((e) => e.id))
                }
              >
                전체 선택
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => setFilteredEmployeeIds([])}
              >
                전체 해제
              </Button>
            </Grid>
          </Grid>

          {employees.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                등록된 알바생이 없습니다
              </Typography>
              <Button
                startIcon={<PersonAdd />}
                variant="contained"
                size="small"
                onClick={handleGoToEmployees}
                sx={{ mt: 1 }}
              >
                알바생 등록하기
              </Button>
            </Box>
          ) : (
            <List dense disablePadding>
              {employeeHours.map(
                ({ employee, totalHours, shiftsCount, color }) => (
                  <ListItemButton
                    key={employee.id}
                    dense
                    onClick={() => handleEmployeeFilter(employee.id)}
                    selected={filteredEmployeeIds.includes(employee.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      backgroundColor: filteredEmployeeIds.includes(employee.id)
                        ? `${color}20`
                        : "transparent",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox
                        checked={filteredEmployeeIds.includes(employee.id)}
                        disableRipple
                        sx={{
                          color,
                          "&.Mui-checked": {
                            color,
                          },
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {employee.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {totalHours}시간 / {shiftsCount}회
                        </Typography>
                      }
                    />
                  </ListItemButton>
                )
              )}
            </List>
          )}
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            지점 정보
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            영업시간: {store?.openingHour} - {store?.closingHour}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            기본 시급: {store?.baseHourlyRate?.toLocaleString()}원
          </Typography>
        </Box>
      </Box>

      {/* 근무 일정 다이얼로그 */}
      {isDialogOpen && selectedEvent && (
        <ShiftDialog
          eventData={selectedEvent}
          isNew={isNewEvent}
          employees={employees}
          onClose={handleCloseDialog}
          onSave={handleSaveShift}
        />
      )}
    </Box>
  );
};

export default SchedulePage;

// If you still get "not a module" errors, you can add this line:
// export {};
