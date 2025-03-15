import React, { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  IconButton,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from "@mui/material";

import {
  getEmployees,
  getStoreInfo,
  getShifts,
  saveShift,
} from "../../services/api";
import { Employee, Store, Shift } from "../../lib/types";
import { useNavigate } from "react-router-dom";
import { format, differenceInHours } from "date-fns";
import {
  FilterAlt,
  PersonAdd,
  Assignment,
  AssignmentInd,
  MoreVert,
} from "@mui/icons-material";
import ShiftDialog from "./ShiftDialog";
import { v4 as uuidv4 } from "uuid";

// 간소화된 이벤트 타입
interface SimpleShiftEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
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

const SimpleSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const calendarRef = useRef<any>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [viewType, setViewType] = useState<"timeGridWeek" | "dayGridMonth">(
    "timeGridWeek"
  );
  const [events, setEvents] = useState<SimpleShiftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployeeIds, setFilteredEmployeeIds] = useState<string[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(!isMobile);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // 이벤트 관련 상태 추가
  const [selectedEvent, setSelectedEvent] = useState<SimpleShiftEvent | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(false);

  // 간소화된 알바생 색상 변환 함수
  const getEmployeeColor = useCallback(
    (employeeId?: string): string => {
      if (!employeeId) return "#CCCCCC"; // 미배정은 회색

      const index = employees.findIndex((e) => e.id === employeeId);
      if (index === -1) return "#CCCCCC";

      return EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length];
    },
    [employees]
  );

  // 매장 및 직원 정보 로드
  useEffect(() => {
    let isMounted = true;

    const loadStoreAndEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        // 매장 정보 로드
        let storeData;
        try {
          storeData = await getStoreInfo();
          if (!isMounted) return;

          if (!storeData || !storeData.id) {
            setError(
              "매장 정보를 불러올 수 없습니다. 매장 설정을 먼저 완료해주세요."
            );
            setLoading(false);
            return;
          }
          setStore(storeData);
        } catch (err) {
          console.error("Store data error:", err);
          if (!isMounted) return;

          setError(
            "매장 정보를 불러올 수 없습니다. 매장 설정을 먼저 완료해주세요."
          );
          setLoading(false);
          return;
        }

        // 직원 정보 로드
        try {
          const employeesData = await getEmployees();
          if (!isMounted) return;

          setEmployees(employeesData || []);
          if (employeesData && employeesData.length > 0) {
            setFilteredEmployeeIds(employeesData.map((emp) => emp.id));
          }
        } catch (err) {
          console.error("Employee data error:", err);
          if (!isMounted) return;

          setEmployees([]);
          setFilteredEmployeeIds([]);
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading store/employee data:", err);
        if (isMounted) {
          setError("기본 데이터를 불러오는 중 오류가 발생했습니다.");
          setLoading(false);
        }
      }
    };

    loadStoreAndEmployees();

    return () => {
      isMounted = false;
    };
  }, []); // 의존성 배열을 비워 마운트 시 한 번만 실행

  // 근무 일정 데이터 로드 (별도의 useEffect로 분리)
  useEffect(() => {
    let isMounted = true;

    const loadShifts = async () => {
      if (loading || !store) return; // 기본 데이터가 로드되지 않았으면 실행하지 않음

      try {
        // 로딩 상태 설정 (근무 일정만 로딩 중)
        setLoading(true);

        // 근무 일정 로드
        const shiftsData = await getShifts();
        if (!isMounted) return;

        setShifts(shiftsData || []);

        // 이벤트 데이터 가공
        processShiftsToEvents(shiftsData || []);
      } catch (err) {
        console.error("Shifts data error:", err);
        if (isMounted) {
          // 근무 일정 로드 실패해도 빈 배열로 설정
          setShifts([]);
          processShiftsToEvents([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadShifts();

    return () => {
      isMounted = false;
    };
  }, [store, employees]); // store와 employees가 변경될 때만 근무 일정 로드

  // 근무 일정을 이벤트로 가공하는 함수
  const processShiftsToEvents = useCallback(
    (shiftsData: Shift[]) => {
      if (!employees.length) return;

      const simpleEvents = shiftsData.map((shift: Shift) => {
        // 직원 이름 구하기
        const employeeNames = (shift.employeeIds || []).map((id: string) => {
          const employee = employees.find((e) => e.id === id);
          return employee ? employee.name : "미배정";
        });

        return {
          id: shift.id,
          title: employeeNames.length > 0 ? employeeNames[0] : "미배정",
          start: shift.start,
          end: shift.end,
          backgroundColor: getEmployeeColor(shift.employeeIds?.[0]),
          borderColor: getEmployeeColor(shift.employeeIds?.[0]),
          textColor: "#FFFFFF",
          extendedProps: {
            employeeIds: shift.employeeIds || [],
            employeeNames: employeeNames,
            note: shift.note,
            recurring: shift.isRecurring
              ? {
                  frequency: "weekly" as const,
                  daysOfWeek: [new Date(shift.start).getDay()],
                }
              : undefined,
          },
        };
      });

      setEvents(simpleEvents);
    },
    [employees, getEmployeeColor]
  );

  // shifts 또는 employees가 변경될 때 이벤트 데이터 갱신
  useEffect(() => {
    processShiftsToEvents(shifts);
  }, [shifts, processShiftsToEvents]);

  // 페이지 초기 로드시 모바일 여부에 따라 사이드패널 설정
  useEffect(() => {
    setShowSidePanel(!isMobile);
  }, [isMobile]);

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

  // 필터링된 이벤트
  const filteredEvents = React.useMemo(() => {
    let filtered = events;

    // 직원 필터 적용
    if (filteredEmployeeIds.length > 0) {
      filtered = filtered.filter((event) => {
        // 미배정 이벤트는 항상 표시
        if (!event.extendedProps?.employeeIds?.length) return true;

        return event.extendedProps.employeeIds.some((id: string) =>
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

    return filtered;
  }, [events, filteredEmployeeIds, showUnassignedOnly]);

  // 미배정 근무 블록 목록
  const unassignedShifts = React.useMemo(() => {
    return events.filter(
      (event) =>
        !event.extendedProps?.employeeIds?.length ||
        event.extendedProps.employeeIds.length === 0
    );
  }, [events]);

  // 날짜 선택 이벤트 핸들러 - 새 근무 추가
  const handleDateSelect = (selectInfo: any) => {
    // 업무 시간 외 선택 방지
    if (store) {
      const startDate = new Date(selectInfo.start);
      const endDate = new Date(selectInfo.end);

      // 시작시간 제한 (오픈 시간 이전이면 오픈 시간으로 설정)
      const openingHour = parseInt(store.openingHour?.split(":")[0] || "9", 10);
      if (startDate.getHours() < openingHour) {
        startDate.setHours(openingHour, 0, 0);
      }

      // 종료시간 제한 (마감 시간 이후면 마감 시간으로 설정)
      const closingHour = parseInt(
        store.closingHour?.split(":")[0] || "22",
        10
      );
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
      const newEvent: SimpleShiftEvent = {
        id: uuidv4(),
        title: "새 근무",
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: "#CCCCCC",
        borderColor: "#CCCCCC",
        textColor: "#000000",
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
    const eventData = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      backgroundColor: clickInfo.event.backgroundColor,
      borderColor: clickInfo.event.borderColor,
      textColor: clickInfo.event.textColor,
      extendedProps: clickInfo.event.extendedProps,
    };

    setSelectedEvent(eventData);
    setIsNewEvent(false);
    setIsDialogOpen(true);
  };

  // 이벤트 드래그 핸들러
  const handleEventDrop = (dropInfo: any) => {
    // 드래그앤드롭으로 이벤트 이동 시
    const updatedEvent = {
      id: dropInfo.event.id,
      title: dropInfo.event.title,
      start: dropInfo.event.startStr,
      end: dropInfo.event.endStr,
      backgroundColor: dropInfo.event.backgroundColor,
      borderColor: dropInfo.event.borderColor,
      textColor: dropInfo.event.textColor,
      extendedProps: dropInfo.event.extendedProps,
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
      id: resizeInfo.event.id,
      title: resizeInfo.event.title,
      start: resizeInfo.event.startStr,
      end: resizeInfo.event.endStr,
      backgroundColor: resizeInfo.event.backgroundColor,
      borderColor: resizeInfo.event.borderColor,
      textColor: resizeInfo.event.textColor,
      extendedProps: resizeInfo.event.extendedProps,
    };

    // 이벤트 업데이트 API 호출
    saveShiftToApi(updatedEvent);

    // UI 이벤트 업데이트
    setEvents((prev) =>
      prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
    );
  };

  // 근무 일정 저장 핸들러
  const handleSaveShift = (shiftEvent: SimpleShiftEvent) => {
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
  const saveShiftToApi = async (shiftEvent: SimpleShiftEvent) => {
    try {
      // 매장 ID가 없으면 기본값 's1' 사용 (첫 번째 매장 ID)
      const storeId = store?.id || "s1";

      const result = await saveShift({
        id: shiftEvent.id,
        storeId: storeId,
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

      console.log("근무 일정 저장 성공:", result);

      // 저장 후 shifts 상태 업데이트 (대신 API 호출을 다시 하지 않음)
      const updatedShift = {
        id: shiftEvent.id,
        storeId: storeId,
        title: shiftEvent.title,
        start: shiftEvent.start,
        end: shiftEvent.end,
        employeeIds: shiftEvent.extendedProps?.employeeIds || [],
        isRecurring: !!shiftEvent.extendedProps?.recurring,
        note: shiftEvent.extendedProps?.note,
      };

      setShifts((prevShifts) => {
        const index = prevShifts.findIndex((s) => s.id === updatedShift.id);
        if (index >= 0) {
          // 기존 shift 업데이트
          const newShifts = [...prevShifts];
          newShifts[index] = updatedShift as Shift;
          return newShifts;
        } else {
          // 새 shift 추가
          return [...prevShifts, updatedShift as Shift];
        }
      });
    } catch (err) {
      console.error("Error saving shift:", err);
    }
  };

  // 다이얼로그 닫기 핸들러
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // 대타 요청 처리
  const handleSubstituteRequest = (
    event: SimpleShiftEvent,
    isHighPriority: boolean = false
  ) => {
    // 대타 요청 상태 토글
    const isRequestActive = event.extendedProps?.isSubstituteRequest;

    const updatedEvent: SimpleShiftEvent = {
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
    return (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="caption" fontWeight="bold">
          {eventInfo.event.title}
        </Typography>
        <Typography variant="caption" display="block">
          {format(new Date(eventInfo.event.start), "HH:mm")} -{" "}
          {format(new Date(eventInfo.event.end), "HH:mm")}
        </Typography>
      </Box>
    );
  };

  // 뷰 타입 변경 핸들러
  const handleViewChange = (viewType: string) => {
    if (viewType === "timeGridWeek" || viewType === "dayGridMonth") {
      setViewType(viewType);
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(viewType);
      }
    }
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
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6">스케줄 정보를 불러오는 중입니다...</Typography>
        <Typography variant="body2" color="text.secondary">
          잠시만 기다려주세요. 첫 로딩은 시간이 조금 더 걸릴 수 있습니다.
        </Typography>
      </Box>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          스케줄 페이지 로딩 중 오류가 발생했습니다. 다음 중 하나를
          시도해보세요:
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="페이지 새로고침"
              secondary="브라우저 캐시를 비우고 다시 시도합니다."
            />
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              size="small"
            >
              새로고침
            </Button>
          </ListItem>
          {error.includes("매장 정보") && (
            <ListItem>
              <ListItemText
                primary="지점 설정으로 이동"
                secondary="매장 정보를 설정해야 스케줄 관리가 가능합니다."
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/settings")}
                size="small"
              >
                설정으로 이동
              </Button>
            </ListItem>
          )}
        </List>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 64px)",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f9fafb",
      }}
    >
      {/* 왼쪽 사이드패널 */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        PaperProps={{
          sx: {
            width: 280,
            position: "static",
            height: "100%",
            borderRight: "none",
            boxShadow: showSidePanel ? theme.shadows[2] : "none",
            marginLeft: 0,
            marginRight: 1.5,
          },
        }}
        sx={{
          width: showSidePanel ? 280 : 0,
          flexShrink: 0,
          transition: "width 0.3s ease",
          "& .MuiDrawer-paper": {
            width: 280,
            boxSizing: "border-box",
            height: "100%",
            overflow: "auto",
            position: "relative",
            backgroundColor: "background.paper",
            boxShadow: "none",
            zIndex: theme.zIndex.drawer,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            스케줄 관리
          </Typography>

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
                onClick={() => navigate("/employees")}
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
        </Box>
      </Drawer>

      {/* 메인 콘텐츠 영역 (캘린더) */}
      <Box
        sx={{
          flexGrow: 1,
          p: 0,
          height: "100%",
          overflow: "auto",
          width: {
            xs: "100%",
            sm: `calc(100% - ${showSidePanel ? "282px" : "0px"})`,
          },
          ml: showSidePanel ? 0 : { xs: 0, sm: 2 },
          backgroundColor: "white",
          borderRadius: showSidePanel ? 0 : "8px 0 0 0",
          boxShadow: showSidePanel ? "none" : theme.shadows[1],
          transition:
            "width 0.3s ease, margin-left 0.3s ease, border-radius 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        {/* 상단 액션 버튼들 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            flexWrap: { xs: "wrap", sm: "nowrap" },
            gap: 1,
            background: showSidePanel
              ? "linear-gradient(90deg, rgba(249,250,251,1) 0%, rgba(255,255,255,1) 100%)"
              : "white",
            transition: "background 0.3s ease",
            height: "56px",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={viewType === "timeGridWeek" ? "contained" : "outlined"}
              size="small"
              onClick={() => handleViewChange("timeGridWeek")}
            >
              주간
            </Button>
            <Button
              variant={viewType === "dayGridMonth" ? "contained" : "outlined"}
              size="small"
              onClick={() => handleViewChange("dayGridMonth")}
            >
              월간
            </Button>
          </Box>

          <Box>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={showSidePanel ? null : <FilterAlt />}
              onClick={() => setShowSidePanel(!showSidePanel)}
              sx={{
                borderRadius: "20px",
                px: 2,
                transition: "all 0.2s ease",
                borderColor: "rgba(0, 0, 0, 0.12)",
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                },
              }}
            >
              {isMobile ? (
                <>{showSidePanel ? "닫기" : "필터"}</>
              ) : (
                <>{showSidePanel ? "사이드패널 닫기" : "사이드패널 열기"}</>
              )}
            </Button>
          </Box>
        </Box>

        {/* 캘린더 */}
        <Paper
          elevation={0}
          sx={{
            height: "calc(100% - 56px)",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            border: "none",
            borderRadius: 0,
            "& .fc": {
              height: "100%",
              fontFamily: theme.typography.fontFamily,
            },
            "& .fc-view-harness": {
              height: "auto !important",
              flex: 1,
            },
            "& .fc-scroller": {
              height: "auto !important",
            },
            "& .fc-theme-standard .fc-scrollgrid": {
              borderColor: "rgba(0, 0, 0, 0.08)",
            },
            "& .fc-theme-standard td, & .fc-theme-standard th": {
              borderColor: "rgba(0, 0, 0, 0.08)",
            },
            "& .fc-event": {
              cursor: "pointer",
              borderRadius: "4px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              margin: "2px 1px",
            },
            "& .fc-day-today": {
              backgroundColor: "rgba(66, 133, 244, 0.05) !important",
            },
            "& .fc-col-header-cell": {
              backgroundColor: "rgba(0, 0, 0, 0.02)",
              padding: "6px 0",
            },
          }}
        >
          <FullCalendar
            key={`calendar-${events.length}`} // 이벤트 수가 변경될 때마다 캘린더 컴포넌트 재생성
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            events={filteredEvents}
            eventContent={renderEventContent}
            height="100%"
            nowIndicator={true}
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            firstDay={0}
            locale="ko"
            dayHeaderFormat={{ weekday: "short", day: "numeric" }}
            editable={true}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            viewDidMount={() => {
              // 캘린더 초기화 후 크기 업데이트
              setTimeout(() => {
                if (calendarRef.current) {
                  try {
                    const api = calendarRef.current.getApi();
                    api.updateSize();
                  } catch (err) {
                    console.error("캘린더 업데이트 오류:", err);
                  }
                }
              }, 100);
            }}
            datesSet={() => {
              // 날짜 변경 시 캘린더 크기 업데이트
              if (calendarRef.current) {
                try {
                  const calendarApi = calendarRef.current.getApi();
                  calendarApi.updateSize();
                } catch (err) {
                  console.error("날짜 변경 시 업데이트 오류:", err);
                }
              }
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

export default SimpleSchedulePage;
