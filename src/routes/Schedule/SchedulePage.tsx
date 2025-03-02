import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  TextField,
  IconButton,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
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
  AssignmentLate,
  Assignment,
  NotificationsActive,
  FilterAlt,
  AssignmentInd,
} from "@mui/icons-material";
import ShiftDialog from "./ShiftDialog";
import {
  getEmployees,
  getStoreInfo,
  getShifts,
  saveShift,
} from "../../services/api";
import { Employee, Store, Shift, Availability } from "../../lib/types";
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
  getHours,
  addMinutes,
  parse,
  isWithinInterval,
  isSameDay,
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
    isSubstituteRequest?: boolean;
    isHighPriority?: boolean;
    status?: "unassigned" | "assigned" | "substitute-requested";
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
  const calendarRef = useRef<any>(null); // Add ref for direct calendar control

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

  // 추가된 상태
  const [availabilityFilter, setAvailabilityFilter] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [employeeAvailability, setEmployeeAvailability] = useState<
    Availability[]
  >([]);

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

        // 가상의 가능 시간 데이터 생성 (실제로는 API에서 가져와야 함)
        const availabilityData: Availability[] = employeesData.flatMap((emp) =>
          Array.from({ length: 7 }, (_, i) => ({
            employeeId: emp.id,
            dayOfWeek: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            startTime: i % 2 === 0 ? "09:00" : "14:00",
            endTime: i % 2 === 0 ? "15:00" : "22:00",
            isRecurring: true,
            exceptionDates: [],
          }))
        );

        setEmployeeAvailability(availabilityData);

        // 대타 요청 상태를 포함하도록 업데이트 (데모용 데이터)
        setEvents(
          shifts.map((shift: Shift) => {
            // 임의로 일부 근무를 대타 요청 상태로 설정 (데모용)
            const hasSubRequest = Math.random() > 0.8;
            const isHighPriority = hasSubRequest && Math.random() > 0.5;

            return {
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
                isSubstituteRequest: hasSubRequest,
                isHighPriority: isHighPriority,
                status: !shift.employeeIds?.length
                  ? "unassigned"
                  : hasSubRequest
                  ? "substitute-requested"
                  : "assigned",
              },
            };
          })
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

  // 필터링된 이벤트
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // 직원 필터 적용
    if (filteredEmployeeIds.length > 0) {
      filtered = filtered.filter((event) => {
        // 미배정 이벤트는 항상 표시
        if (!event.extendedProps?.employeeIds?.length) return true;

        return event.extendedProps.employeeIds.some((id) =>
          filteredEmployeeIds.includes(id)
        );
      });
    }

    // 미배정 근무만 보기 필터
    if (showUnassignedOnly) {
      filtered = filtered.filter(
        (event) =>
          !event.extendedProps?.employeeIds?.length ||
          event.extendedProps.employeeIds.length === 0
      );
    }

    // 가능 시간 필터 적용
    if (
      availabilityFilter &&
      availabilityFilter.start &&
      availabilityFilter.end
    ) {
      const filterStartHour = parseInt(
        availabilityFilter.start.split(":")[0],
        10
      );
      const filterStartMinute = parseInt(
        availabilityFilter.start.split(":")[1],
        10
      );
      const filterEndHour = parseInt(availabilityFilter.end.split(":")[0], 10);
      const filterEndMinute = parseInt(
        availabilityFilter.end.split(":")[1],
        10
      );

      // 해당 시간에 근무 가능한 직원 찾기
      const availableEmployeeIds = employees
        .filter((emp) => {
          // 해당 직원의 가능 시간 확인
          return employeeAvailability.some(
            (avail) =>
              avail.employeeId === emp.id &&
              parseInt(avail.startTime.split(":")[0], 10) <= filterStartHour &&
              parseInt(avail.endTime.split(":")[0], 10) >= filterEndHour
          );
        })
        .map((emp) => emp.id);

      // 필터링된 직원 ID 업데이트
      setFilteredEmployeeIds(availableEmployeeIds);
    }

    return filtered;
  }, [
    events,
    filteredEmployeeIds,
    availabilityFilter,
    employeeAvailability,
    employees,
    showUnassignedOnly,
  ]);

  // 미배정 근무 블록 목록
  const unassignedShifts = useMemo(() => {
    return events.filter(
      (event) =>
        !event.extendedProps?.employeeIds?.length ||
        event.extendedProps.employeeIds.length === 0
    );
  }, [events]);

  // 대타 요청이 있는 근무 목록
  const substituteRequestShifts = useMemo(() => {
    return events
      .filter((event) => event.extendedProps?.isSubstituteRequest === true)
      .sort((a, b) => {
        // 우선순위가 높은 요청을 먼저 표시
        if (
          a.extendedProps?.isHighPriority &&
          !b.extendedProps?.isHighPriority
        ) {
          return -1;
        }
        if (
          !a.extendedProps?.isHighPriority &&
          b.extendedProps?.isHighPriority
        ) {
          return 1;
        }
        return 0;
      });
  }, [events]);

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

  // 가능 시간 필터 변경 처리
  const handleAvailabilityFilterChange = (
    key: "start" | "end",
    value: string
  ) => {
    setAvailabilityFilter((prev) => ({
      ...(prev || { start: "09:00", end: "18:00" }),
      [key]: value,
    }));
  };

  // 필터 초기화
  const resetFilters = () => {
    setAvailabilityFilter(null);
    setFilteredEmployeeIds(employees.map((emp) => emp.id));
    setShowUnassignedOnly(false);
  };

  // 뷰 타입 변경 핸들러
  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    newView: "timeGridWeek" | "dayGridMonth" | null
  ) => {
    if (newView) {
      setViewType(newView);
      // Directly control the calendar API to change view
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(newView);
      }
    }
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

      // 새 이벤트 생성
      const newEvent: ShiftEvent = {
        id: uuidv4(),
        title: "",
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        extendedProps: {
          employeeIds: [],
          employeeNames: [],
          status: "unassigned",
        },
      };

      setSelectedEvent(newEvent);
      setIsNewEvent(true);
      setIsDialogOpen(true);
    }
  };

  // 이벤트 클릭 핸들러
  const handleEventClick = (clickInfo: any) => {
    // 이벤트 클릭 시 상세 정보 표시
    setSelectedEvent({
      ...clickInfo.event.toPlainObject(),
      extendedProps: clickInfo.event.extendedProps || {},
    });
    setIsNewEvent(false);
    setIsDialogOpen(true);
  };

  // 이벤트 드래그 핸들러
  const handleEventDrop = (dropInfo: any) => {
    // 드래그앤드롭으로 이벤트 이동 시
    const updatedEvent = {
      ...dropInfo.event.toPlainObject(),
      start: dropInfo.event.start.toISOString(),
      end: dropInfo.event.end.toISOString(),
      extendedProps: dropInfo.event.extendedProps || {},
    };

    // 이벤트 업데이트 API 호출
    saveShiftToApi(updatedEvent);

    // UI 이벤트 업데이트
    setEvents((prev) =>
      prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
    );
  };

  // 이벤트 리사이즈 핸들러
  const handleEventResize = (resizeInfo: any) => {
    // 이벤트 크기 조절 시
    const updatedEvent = {
      ...resizeInfo.event.toPlainObject(),
      start: resizeInfo.event.start.toISOString(),
      end: resizeInfo.event.end.toISOString(),
      extendedProps: resizeInfo.event.extendedProps || {},
    };

    // 이벤트 업데이트 API 호출
    saveShiftToApi(updatedEvent);

    // UI 이벤트 업데이트
    setEvents((prev) =>
      prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
    );
  };

  // 근무 일정 저장 핸들러
  const handleSaveShift = (shiftEvent: ShiftEvent) => {
    // 새 이벤트인 경우 추가
    if (isNewEvent) {
      setEvents((prev) => [...prev, shiftEvent]);
    } else {
      // 기존 이벤트 업데이트
      setEvents((prev) =>
        prev.map((ev) => (ev.id === shiftEvent.id ? shiftEvent : ev))
      );
    }

    // 이벤트 저장 API 호출
    saveShiftToApi(shiftEvent);

    // 대화상자 닫기
    setIsDialogOpen(false);
  };

  // API에 근무 일정 저장
  const saveShiftToApi = async (shiftEvent: ShiftEvent) => {
    try {
      await saveShift({
        id: shiftEvent.id,
        storeId: store?.id || "",
        title: shiftEvent.title,
        start: shiftEvent.start,
        end: shiftEvent.end,
        employeeIds: shiftEvent.extendedProps?.employeeIds || [],
        isRecurring: !!shiftEvent.extendedProps?.recurring,
        recurringPattern: shiftEvent.extendedProps?.recurring
          ? {
              frequency: "weekly",
              daysOfWeek: shiftEvent.extendedProps?.recurring?.daysOfWeek || [],
            }
          : undefined,
        note: shiftEvent.extendedProps?.note,
      });
    } catch (err) {
      console.error("Error saving shift:", err);
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

  // 대타 요청 처리
  const handleSubstituteRequest = (
    event: ShiftEvent,
    isHighPriority: boolean = false
  ) => {
    // 대타 요청 상태 토글
    const isRequestActive = event.extendedProps?.isSubstituteRequest;

    // 명시적으로 ShiftEvent 타입을 지정하여 타입 오류 해결
    const updatedEvent: ShiftEvent = {
      ...event,
      extendedProps: {
        ...event.extendedProps,
        isSubstituteRequest: !isRequestActive,
        isHighPriority: !isRequestActive ? isHighPriority : false,
        status: !isRequestActive ? "substitute-requested" : "assigned",
      },
    };

    // 이벤트 업데이트
    setEvents((prev) =>
      prev.map((ev) => (ev.id === event.id ? updatedEvent : ev))
    );

    // API 저장
    saveShiftToApi(updatedEvent);
  };

  // 이벤트 렌더링 커스터마이징
  const renderEventContent = (eventInfo: any) => {
    const isSubRequest = eventInfo.event.extendedProps.isSubstituteRequest;
    const isHighPriority = eventInfo.event.extendedProps.isHighPriority;
    const isUnassigned = !eventInfo.event.extendedProps.employeeIds?.length;

    return (
      <Box sx={{ p: 0.5, width: "100%", overflow: "hidden" }}>
        {/* 제목 및 아이콘 */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          {isSubRequest && (
            <Tooltip title={isHighPriority ? "긴급 대타 요청" : "대타 요청"}>
              <Box component="span" mr={0.5}>
                {isHighPriority ? (
                  <NotificationsActive
                    fontSize="small"
                    color="error"
                    sx={{ animation: "pulse 1.5s infinite" }}
                  />
                ) : (
                  <AssignmentLate fontSize="small" color="warning" />
                )}
              </Box>
            </Tooltip>
          )}

          {isUnassigned && (
            <Tooltip title="미배정 근무">
              <Box component="span" mr={0.5}>
                <Assignment fontSize="small" color="disabled" />
              </Box>
            </Tooltip>
          )}

          <Typography
            variant="caption"
            sx={{
              fontWeight: isHighPriority ? "bold" : "normal",
              color: isHighPriority ? "error.main" : "inherit",
            }}
          >
            {eventInfo.event.title || (isUnassigned ? "미배정 근무" : "근무")}
          </Typography>
        </Box>

        {/* 시간 */}
        <Typography variant="caption" display="block">
          {format(new Date(eventInfo.event.start), "HH:mm")} -{" "}
          {format(new Date(eventInfo.event.end), "HH:mm")}
        </Typography>

        {/* 알바생 이름 */}
        {eventInfo.event.extendedProps.employeeNames?.map(
          (name: string, idx: number) => (
            <Typography key={idx} variant="caption" display="block" noWrap>
              {name}
            </Typography>
          )
        )}
      </Box>
    );
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
      {/* 왼쪽 사이드패널 (필터, 알바생 목록 등) */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={showSidePanel}
        sx={{
          width: showSidePanel ? 280 : 0,
          flexShrink: 0,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          "& .MuiDrawer-paper": {
            width: 280,
            boxSizing: "border-box",
            height: "100%",
            overflow: "auto",
            position: "relative",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            스케줄 관리
          </Typography>

          {/* 가능 시간 필터 */}
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              <FilterAlt
                fontSize="small"
                sx={{ verticalAlign: "middle", mr: 0.5 }}
              />
              가능 시간 필터
            </Typography>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={5}>
                <TextField
                  label="시작"
                  type="time"
                  size="small"
                  fullWidth
                  value={availabilityFilter?.start || "09:00"}
                  onChange={(e) =>
                    handleAvailabilityFilterChange("start", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={2} sx={{ textAlign: "center", pt: 2 }}>
                <Typography variant="body2">~</Typography>
              </Grid>
              <Grid item xs={5}>
                <TextField
                  label="종료"
                  type="time"
                  size="small"
                  fullWidth
                  value={availabilityFilter?.end || "18:00"}
                  onChange={(e) =>
                    handleAvailabilityFilterChange("end", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button size="small" onClick={resetFilters} variant="outlined">
                필터 초기화
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 미배정 근무만 보기 */}
          <FormControlLabel
            control={
              <Checkbox
                checked={showUnassignedOnly}
                onChange={(e) => setShowUnassignedOnly(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">미배정 근무만 보기</Typography>}
          />

          <Divider sx={{ my: 2 }} />

          {/* 알바생 필터 */}
          <Typography variant="subtitle2" gutterBottom>
            <PersonAdd
              fontSize="small"
              sx={{ verticalAlign: "middle", mr: 0.5 }}
            />
            알바생 필터
          </Typography>
          <List sx={{ pt: 0 }}>
            {employees.map((employee) => (
              <ListItem key={employee.id} disablePadding>
                <ListItemButton
                  dense
                  onClick={() => handleEmployeeFilter(employee.id)}
                  selected={filteredEmployeeIds.includes(employee.id)}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: getEmployeeColor(employee.id),
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={employee.name}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondary={employee.role || "일반 근무자"}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {employees.length === 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              등록된 알바생이 없습니다
              <Button
                variant="text"
                size="small"
                onClick={handleGoToEmployees}
                sx={{ ml: 1 }}
              >
                알바생 등록
              </Button>
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 미배정 근무 블록 목록 */}
          <Typography variant="subtitle2" gutterBottom>
            <Assignment
              fontSize="small"
              sx={{ verticalAlign: "middle", mr: 0.5 }}
            />
            미배정 근무 ({unassignedShifts.length})
          </Typography>

          {unassignedShifts.length > 0 ? (
            <List sx={{ pt: 0 }}>
              {unassignedShifts.map((shift) => (
                <ListItem
                  key={shift.id}
                  sx={{
                    bgcolor: "grey.100",
                    borderRadius: 1,
                    mb: 1,
                    p: 1,
                  }}
                >
                  <ListItemText
                    primary={format(new Date(shift.start), "M.d (eee) HH:mm")}
                    secondary={format(new Date(shift.end), "HH:mm")}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedEvent(shift);
                      setIsNewEvent(false);
                      setIsDialogOpen(true);
                    }}
                  >
                    <AssignmentInd fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="success" sx={{ mt: 1 }}>
              모든 근무가 배정되었습니다.
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 대타 요청 목록 */}
          <Typography variant="subtitle2" gutterBottom>
            <AssignmentLate
              fontSize="small"
              sx={{ verticalAlign: "middle", mr: 0.5 }}
            />
            대타 요청 ({substituteRequestShifts.length})
          </Typography>

          {substituteRequestShifts.length > 0 ? (
            <List sx={{ pt: 0 }}>
              {substituteRequestShifts.map((shift) => (
                <ListItem
                  key={shift.id}
                  sx={{
                    bgcolor: shift.extendedProps?.isHighPriority
                      ? "error.light"
                      : "warning.light",
                    borderRadius: 1,
                    mb: 1,
                    p: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {shift.extendedProps?.isHighPriority && (
                          <NotificationsActive
                            fontSize="small"
                            color="error"
                            sx={{ mr: 0.5 }}
                          />
                        )}
                        <Typography variant="body2">
                          {format(new Date(shift.start), "M.d (eee) HH:mm")}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {format(new Date(shift.end), "HH:mm")}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {shift.extendedProps?.employeeNames?.[0]}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedEvent(shift);
                      setIsNewEvent(false);
                      setIsDialogOpen(true);
                    }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="success" sx={{ mt: 1 }}>
              대타 요청이 없습니다.
            </Alert>
          )}
        </Box>
      </Drawer>

      {/* 메인 콘텐츠 영역 (캘린더) */}
      <Box
        sx={{
          flexGrow: 1,
          p: 3,
          height: "100%",
          overflow: "auto",
          width: "100%",
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginLeft: showSidePanel ? "280px" : 0,
        }}
      >
        {/* 상단 액션 버튼들 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="timeGridWeek">
              <ViewWeek fontSize="small" sx={{ mr: 1 }} />
              주간
            </ToggleButton>
            <ToggleButton value="dayGridMonth">
              <CalendarMonth fontSize="small" sx={{ mr: 1 }} />
              월간
            </ToggleButton>
          </ToggleButtonGroup>

          <Box>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<AccessTime />}
              onClick={() => setShowSidePanel(!showSidePanel)}
              sx={{ mr: 1 }}
            >
              {showSidePanel ? "사이드패널 닫기" : "사이드패널 열기"}
            </Button>
          </Box>
        </Box>

        {/* 캘린더 */}
        <Paper
          elevation={1}
          sx={{
            height: "calc(100% - 50px)",
            width: "100%", // Ensure full width
            "& .fc": {
              height: "100%",
              width: "100%", // Ensure full width
            },
            "& .fc-event": {
              cursor: "pointer",
            },
            "& .fc-event-unassigned": {
              backgroundColor: "#E0E0E0",
              borderColor: "#9E9E9E",
            },
            "& .fc-event-substitute-requested": {
              borderLeft: "4px solid orange",
            },
            "& .fc-event-high-priority": {
              borderLeft: "4px solid red",
              animation: "pulse 1.5s infinite",
            },
            // Add transitions for smooth view changes
            "& .fc-view-harness": {
              transition: "height 0.3s ease",
            },
            // Ensure proper height for month view
            "& .fc .fc-dayGridMonth-view .fc-daygrid-body": {
              height: "auto !important",
            },
            // Improve mobile responsiveness
            "@media (max-width: 600px)": {
              "& .fc-toolbar": {
                flexDirection: "column",
                gap: "10px",
              },
            },
          }}
        >
          <FullCalendar
            ref={calendarRef} // Add ref for direct control
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={viewType}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            // 편집 가능한 기능들
            editable={true}
            droppable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            // 사용자 상호작용 핸들러
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventContent={renderEventContent}
            // 이벤트 데이터
            events={filteredEvents}
            // 시간 표시 설정
            slotMinTime={store?.openingHour || "09:00:00"}
            slotMaxTime={store?.closingHour || "23:00:00"}
            // Fixed height for various views to ensure smooth transitions
            height="100%"
            // Animation settings
            firstDay={1}
            weekNumbers={false}
            nowIndicator={true}
            // View-specific settings
            views={{
              dayGridMonth: {
                dayMaxEventRows: 4,
              },
              timeGridWeek: {
                dayHeaderFormat: { weekday: "short" },
              },
            }}
            eventClassNames={(arg) => {
              const classes = [];

              if (!arg.event.extendedProps.employeeIds?.length) {
                classes.push("fc-event-unassigned");
              }

              if (arg.event.extendedProps.isSubstituteRequest) {
                classes.push("fc-event-substitute-requested");

                if (arg.event.extendedProps.isHighPriority) {
                  classes.push("fc-event-high-priority");
                }
              }

              return classes;
            }}
            // CSS 커스텀 설정
            businessHours={{
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // 0=Sunday, 1=Monday, etc.
              startTime: store?.openingHour || "09:00",
              endTime: store?.closingHour || "23:00",
            }}
          />
        </Paper>
      </Box>

      {/* 근무 일정 수정 다이얼로그 */}
      {isDialogOpen && selectedEvent && (
        <ShiftDialog
          eventData={selectedEvent}
          isNew={isNewEvent}
          employees={employees}
          onClose={handleCloseDialog}
          onSave={handleSaveShift}
          onSubstituteRequest={handleSubstituteRequest}
        />
      )}
    </Box>
  );
};

export default SchedulePage;

// If you still get "not a module" errors, you can add this line:
// export {};
