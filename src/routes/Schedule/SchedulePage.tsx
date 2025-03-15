import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Alert,
  useTheme,
  TextField,
  IconButton,
  Drawer,
  FormControlLabel,
  CircularProgress,
  useMediaQuery,
  Divider,
  Tooltip,
  Checkbox,
} from "@mui/material";
import {
  CalendarMonth,
  ViewWeek,
  AccessTime,
  MoreVert,
  PersonAdd,
  AssignmentLate,
  Assignment,
  NotificationsActive,
  FilterAlt,
  AssignmentInd,
  Settings as SettingsIcon,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addDays,
  format,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parseISO,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  set,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startOfDay,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addHours,
  differenceInHours,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getHours,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addMinutes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isWithinInterval,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSameDay,
} from "date-fns";

// 컴포넌트 내부 에러 처리를 위한 ErrorBoundary 클래스 추가
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("캘린더 렌더링 오류:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

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

// 캘린더를 개별 컴포넌트로 분리하여 렌더링 최적화
const ScheduleCalendar: React.FC<{
  calendarRef: React.RefObject<any>;
  viewType: "timeGridWeek" | "dayGridMonth";
  events: ShiftEvent[];
  isMobile: boolean;
  showSidePanel: boolean;
  theme: any;
  onDateSelect: (selectInfo: any) => void;
  onEventClick: (clickInfo: any) => void;
  onEventDrop: (dropInfo: any) => void;
  onEventResize: (resizeInfo: any) => void;
  renderEventContent: (eventInfo: any) => React.ReactNode;
}> = React.memo(
  ({
    calendarRef,
    viewType,
    events,
    isMobile,
    showSidePanel,
    theme,
    onDateSelect,
    onEventClick,
    onEventDrop,
    onEventResize,
    renderEventContent,
  }) => {
    // React.useEffect 사용하여 클린업 함수 추가
    React.useEffect(() => {
      return () => {
        // 컴포넌트 언마운트 시 클린업
        if (calendarRef.current) {
          try {
            const api = calendarRef.current.getApi();
            api.destroy();
          } catch (err) {
            console.error("캘린더 클린업 오류:", err);
          }
        }
      };
    }, [calendarRef]);

    return (
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={viewType}
        headerToolbar={{
          left: isMobile ? "prev,next" : "prev,next today",
          center: "title",
          right: "",
        }}
        editable={true}
        droppable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={isMobile ? 2 : true}
        select={onDateSelect}
        eventClick={onEventClick}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        eventContent={renderEventContent}
        events={events}
        slotMinTime={"08:00:00"}
        slotMaxTime={"21:30:00"}
        height="auto"
        firstDay={0}
        weekNumbers={false}
        nowIndicator={true}
        allDaySlot={false}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        slotDuration="00:30:00"
        snapDuration="00:15:00"
        scrollTime="09:30:00"
        businessHours={{
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: "09:00",
          endTime: "18:00",
        }}
        viewDidMount={(view) => {
          // 캘린더 초기화 문제 해결을 위한 안전한 업데이트
          if (calendarRef.current) {
            try {
              const calendarApi = calendarRef.current.getApi();

              // 즉시 한번, 그리고 약간의 지연 후 한번 더 크기 업데이트
              calendarApi.updateSize();

              // 스케줄링 충돌이나 타이밍 문제를 해결하기 위해 setTimeout 사용
              setTimeout(() => {
                try {
                  if (calendarRef.current) {
                    const api = calendarRef.current.getApi();
                    api.updateSize();

                    // 가시성 문제 확인
                    if (view.el) {
                      view.el.style.visibility = "visible";
                    }
                  }
                } catch (err) {
                  console.error("캘린더 지연 업데이트 오류:", err);
                }
              }, 300);
            } catch (err) {
              console.error("캘린더 초기화 오류:", err);
            }
          }
        }}
        datesSet={() => {
          // 날짜 변경 시 캘린더 크기 업데이트
          try {
            if (calendarRef.current) {
              const calendarApi = calendarRef.current.getApi();
              calendarApi.updateSize();
            }
          } catch (err) {
            console.error("날짜 변경 시 캘린더 업데이트 오류:", err);
          }
        }}
        views={{
          dayGridMonth: {
            dayMaxEventRows: isMobile ? 2 : 4,
            fixedWeekCount: false,
            showNonCurrentDates: true,
          },
          timeGridWeek: {
            dayHeaderFormat: { weekday: "short", day: "numeric" },
            slotLabelFormat: {
              hour: "numeric",
              minute: "2-digit",
              omitZeroMinute: false,
              hour12: false,
            },
            slotLabelInterval: "01:00",
            slotEventOverlap: false,
            expandRows: true,
            dayHeaderContent: (args) => {
              const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
              const dayOfWeek = args.date.getDay();
              const weekday = weekdayNames[dayOfWeek];
              const day = args.date.getDate();
              const className =
                dayOfWeek === 0
                  ? "fc-day-sun"
                  : dayOfWeek === 6
                  ? "fc-day-sat"
                  : "";
              return {
                html: `<div class="fc-day-header ${className}">${weekday}<br/>${day}</div>`,
              };
            },
          },
        }}
        dayCount={7}
        eventClassNames={(arg) => {
          const classes = [];

          if (!arg.event.extendedProps?.employeeIds?.length) {
            classes.push("fc-event-unassigned");
          }

          if (arg.event.extendedProps?.isSubstituteRequest) {
            classes.push("fc-event-substitute-requested");

            if (arg.event.extendedProps?.isHighPriority) {
              classes.push("fc-event-high-priority");
            }
          }

          return classes;
        }}
      />
    );
  }
);

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const calendarRef = useRef<any>(null); // Add ref for direct calendar control
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

  // 알바생 ID에 따른 색상 반환 (useCallback으로 메모이제이션)
  const getEmployeeColor = useCallback(
    (employeeId?: string): string => {
      if (!employeeId) return EMPLOYEE_COLORS[EMPLOYEE_COLORS.length - 1];

      const index = employees.findIndex((e) => e.id === employeeId);
      if (index === -1) return EMPLOYEE_COLORS[EMPLOYEE_COLORS.length - 1];

      return EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length];
    },
    [employees]
  );

  // 매장과 알바생 정보 로드 (의존성 배열 수정)
  useEffect(() => {
    let isMounted = true; // 마운트 상태 추적용 플래그

    const loadData = async () => {
      try {
        if (!isMounted) return; // 이미 언마운트된 경우 함수 종료

        setLoading(true);
        setError(null); // 에러 상태 초기화

        // 매장 정보 로드
        let storeData;
        try {
          storeData = await getStoreInfo();
          console.log("매장 정보 로드:", storeData);

          if (!isMounted) return; // 비동기 작업 중 컴포넌트가 언마운트됐는지 확인

          if (!storeData || !storeData.id) {
            console.error("매장 정보가 없거나 ID가 없습니다.");
            setError(
              "매장 정보를 불러올 수 없습니다. 매장 설정을 먼저 완료해주세요."
            );
            setLoading(false);
            return;
          }

          setStore(storeData);
        } catch (storeErr) {
          console.error("매장 정보 로드 오류:", storeErr);
          if (!isMounted) return;

          setError(
            "매장 정보를 불러올 수 없습니다. 매장 설정을 먼저 완료해주세요."
          );
          setLoading(false);
          return;
        }

        // 직원 정보 로드
        let employeesData = [];
        try {
          employeesData = await getEmployees();
          console.log("직원 정보 로드:", employeesData);

          if (!isMounted) return;

          setEmployees(employeesData || []);

          // 기본적으로 모든 알바생 필터에 포함
          setFilteredEmployeeIds((employeesData || []).map((emp) => emp.id));
        } catch (empErr) {
          console.error("직원 정보 로드 오류:", empErr);
          // 오류가 발생해도 빈 배열로 계속 진행
          if (!isMounted) return;

          employeesData = [];
          setEmployees([]);
          setFilteredEmployeeIds([]);
        }

        // 근무 일정 로드
        let shifts = [];
        try {
          shifts = await getShifts();
          console.log("근무 일정 로드:", shifts);

          if (!isMounted) return;
        } catch (shiftErr) {
          console.error("근무 일정 로드 오류:", shiftErr);
          if (!isMounted) return;

          shifts = []; // 기본값 설정
        }

        // 가상의 가능 시간 데이터 생성 (실제로는 API에서 가져와야 함)
        const availabilityData: Availability[] = (employeesData || []).flatMap(
          (emp) =>
            Array.from({ length: 7 }, (_, i) => ({
              employeeId: emp.id,
              dayOfWeek: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
              startTime: i % 2 === 0 ? "09:00" : "14:00",
              endTime: i % 2 === 0 ? "15:00" : "22:00",
              isRecurring: true,
              exceptionDates: [],
            }))
        );

        if (!isMounted) return;
        setEmployeeAvailability(availabilityData);

        // 대타 요청 상태를 포함하도록 업데이트 (데모용 데이터)
        const processedEvents = (shifts || []).map((shift: Shift) => {
          // 임의로 일부 근무를 대타 요청 상태로 설정 (데모용)
          const hasSubRequest = Math.random() > 0.8;
          const isHighPriority = hasSubRequest && Math.random() > 0.5;

          // 직원 이름 찾기를 위한 안전한 방법
          const employeeNames = (shift.employeeIds || []).map((id: string) => {
            const employee = (employeesData || []).find((e) => e.id === id);
            return employee ? employee.name : "Unknown";
          });

          return {
            id: shift.id,
            title: shift.title || "",
            start: shift.start,
            end: shift.end,
            color: getEmployeeColor(shift.employeeIds?.[0]),
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
              isSubstituteRequest: hasSubRequest,
              isHighPriority: isHighPriority,
              status: !shift.employeeIds?.length
                ? ("unassigned" as const)
                : hasSubRequest
                ? ("substitute-requested" as const)
                : ("assigned" as const),
            },
          } as ShiftEvent;
        });

        if (!isMounted) return;
        setEvents(processedEvents);
      } catch (err) {
        console.error("Error loading data:", err);
        if (!isMounted) return;

        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        // 모든 과정이 끝난 후 항상 로딩 상태 해제
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // 클린업 함수: 컴포넌트가 언마운트될 때 호출됨
    return () => {
      isMounted = false;
    };
  }, [getEmployeeColor]); // getEmployeeColor를 의존성 배열에 포함

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

    // 가능 시간 필터 적용은 유지하되 필터 적용 로직 개선
    if (
      availabilityFilter &&
      availabilityFilter.start &&
      availabilityFilter.end
    ) {
      const filterStartHour = parseInt(
        availabilityFilter.start.split(":")[0],
        10
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const filterStartMinute = parseInt(
        availabilityFilter.start.split(":")[1],
        10
      );
      const filterEndHour = parseInt(availabilityFilter.end.split(":")[0], 10);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const filterEndMinute = parseInt(
        availabilityFilter.end.split(":")[1],
        10
      );

      // 해당 시간에 근무 가능한 직원 찾기 (안전 수정)
      const availableEmployeeIds = employees
        .filter((emp) => {
          // 해당 직원의 가능 시간 확인 (안전하게 배열 체크)
          const hasAvailability = employeeAvailability.some(
            (avail) =>
              avail.employeeId === emp.id &&
              parseInt(avail.startTime.split(":")[0], 10) <= filterStartHour &&
              parseInt(avail.endTime.split(":")[0], 10) >= filterEndHour
          );
          return hasAvailability;
        })
        .map((emp) => emp.id);

      if (availableEmployeeIds.length > 0) {
        // 필터링된 직원 ID 업데이트
        setFilteredEmployeeIds(availableEmployeeIds);
      }
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

  // 알바생별 근무 시간 계산 (사용되지 않는 변수에 eslint 주석 추가)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // 매장 ID가 없으면 기본값 's1' 사용 (첫 번째 매장 ID)
      const storeId = store?.id || "s1";

      console.log("근무 일정 저장 시도:", {
        id: shiftEvent.id,
        storeId: storeId,
        employeeIds: shiftEvent.extendedProps?.employeeIds || [],
      });

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

  // 페이지 초기 로드시 모바일 여부에 따라 사이드패널 설정
  useEffect(() => {
    setShowSidePanel(!isMobile);
  }, [isMobile]);

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
                startIcon={<SettingsIcon />}
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
      {/* 왼쪽 사이드패널 (필터, 알바생 목록 등) */}
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
            marginRight: 1.5, // 캘린더와의 여백 추가
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
          p: 0,
          height: "100%",
          overflow: "auto",
          width: {
            xs: "100%",
            sm: `calc(100% - ${showSidePanel ? "282px" : "0px"})`, // 1.5rem 여백 포함
          },
          ml: showSidePanel ? 0 : { xs: 0, sm: 2 }, // 사이드패널 닫힐 때 왼쪽 여백 추가
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
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={handleViewChange}
            size={isMobile ? "small" : "medium"}
            aria-label="캘린더 보기 방식"
            sx={{
              "& .MuiToggleButton-root": {
                px: { xs: 1.5, sm: 2 },
                borderColor: "rgba(0, 0, 0, 0.08)",
                "&.Mui-selected": {
                  backgroundColor: theme.palette.primary.main,
                  color: "white",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.dark,
                  },
                },
              },
            }}
          >
            <ToggleButton value="timeGridWeek">
              <ViewWeek fontSize="small" sx={{ mr: isMobile ? 0.5 : 1 }} />
              {!isMobile && "주간"}
            </ToggleButton>
            <ToggleButton value="dayGridMonth">
              <CalendarMonth fontSize="small" sx={{ mr: isMobile ? 0.5 : 1 }} />
              {!isMobile && "월간"}
            </ToggleButton>
          </ToggleButtonGroup>

          <Box>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={showSidePanel ? <AccessTime /> : <FilterAlt />}
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
              width: "100%",
              fontFamily: theme.typography.fontFamily,
            },
            "& .fc-toolbar-title": {
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: 500,
              color: theme.palette.text.primary,
            },
            "& .fc-header-toolbar": {
              padding: "0.75rem 1.25rem",
              marginBottom: "0.5rem !important",
            },
            "& .fc-view-harness": {
              flex: 1,
              minHeight: 0,
              height: "calc(100% - 60px) !important", // 고정 높이 지정
              position: "relative",
            },
            "& .fc-scroller": {
              height: "auto !important", // 자동 높이로 수정
              overflow: "hidden auto", // 가로 스크롤 방지
            },
            "& .fc-view": {
              width: "100%", // 뷰 너비 최대화
              height: "auto !important", // 높이 자동 조정
              overflow: "visible", // 오버플로우 보이기
            },
            "& .fc-event": {
              cursor: "pointer",
              borderRadius: "4px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              margin: "2px 1px",
              padding: "1px 3px",
              fontSize: "0.75rem", // 폰트 크기 축소
            },
            "& .fc-theme-standard .fc-scrollgrid": {
              border: "1px solid rgba(0, 0, 0, 0.08)",
            },
            "& .fc-theme-standard td, & .fc-theme-standard th": {
              borderColor: "rgba(0, 0, 0, 0.08)",
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
            "& .fc .fc-dayGridMonth-view .fc-daygrid-body": {
              height: "auto !important",
            },
            "& .fc-day": {
              backgroundColor: "white",
            },
            "& .fc-day-today": {
              backgroundColor: "rgba(66, 133, 244, 0.05) !important",
            },
            "& .fc-col-header-cell": {
              backgroundColor: "rgba(0, 0, 0, 0.02)",
              padding: showSidePanel ? "6px 0" : "8px 0", // 사이드패널 상태에 따라 패딩 조정
              borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
              transition: "padding 0.3s ease",
            },
            "& .fc-col-header-cell-cushion": {
              padding: showSidePanel ? "8px 2px" : "12px 4px", // 사이드패널 상태에 따라 패딩 조정
              fontWeight: "bold",
              color: theme.palette.text.primary,
              textDecoration: "none !important",
              transition: "padding 0.3s ease",
            },
            "& .fc-col-header-cell.fc-day-sun .fc-col-header-cell-cushion": {
              color: "#E74C3C",
            },
            "& .fc-col-header-cell.fc-day-sat .fc-col-header-cell-cushion": {
              color: "#3498DB",
            },
            "& .fc-day-today .fc-col-header-cell-cushion": {
              backgroundColor: theme.palette.primary.main,
              color: "white",
              padding: "4px 8px",
              borderRadius: "12px",
              display: "inline-block",
            },
            "& .fc-scrollgrid": {
              border: "1px solid rgba(0, 0, 0, 0.08) !important",
              borderRadius: 0,
            },
            "& .fc-scrollgrid-section-header": {
              border: "none",
            },
            "& .fc-timegrid-slots": {
              borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            },
            "& .fc-timegrid-slot": {
              height: showSidePanel ? "22px !important" : "28px !important", // 사이드패널 상태에 따라 높이 조정
              borderColor: "rgba(0, 0, 0, 0.05)",
              transition: "height 0.3s ease",
            },
            "& .fc-timegrid-slot-lane": {
              borderColor: "rgba(0, 0, 0, 0.05)",
            },
            "& .fc-timegrid-slot-minor": {
              borderColor: "rgba(0, 0, 0, 0.03)",
            },
            "& .fc-timegrid-col-frame": {
              minWidth: showSidePanel ? "90px" : "150px", // 사이드패널 닫힐 때 더 넓게
              transition: "min-width 0.3s ease",
            },
            "& .fc-timegrid-cols": {
              width: "100% !important",
              height: "100% !important", // 높이 최대화
            },
            "& .fc-timegrid-col": {
              width: `calc(100% / 7) !important`, // 7일 표시를 위한 균등 너비
              minWidth: showSidePanel ? "90px" : "150px", // 사이드패널 닫힐 때 더 넓게
              transition: "min-width 0.3s ease",
            },
            "& .fc-timegrid-axis": {
              borderRight: "1px solid rgba(0, 0, 0, 0.08)",
              padding: "0 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              width: "65px !important", // 고정 너비로 설정
            },
            "& .fc-timegrid-slot-label": {
              fontSize: "0.75rem",
              color: theme.palette.text.secondary,
              borderColor: "rgba(0, 0, 0, 0.05)",
            },
            "& .fc-timegrid-slot-label-cushion": {
              fontSize: "0.75rem",
              fontWeight: 500,
            },
            "& .fc-day-header": {
              fontWeight: "bold",
              textAlign: "center",
              padding: "4px 0",
              fontSize: "0.9rem",
              lineHeight: 1.2,
            },
            "@media (max-width: 600px)": {
              "& .fc-toolbar": {
                flexDirection: "column",
                gap: "10px",
                padding: "0.5rem",
              },
              "& .fc-toolbar-title": {
                fontSize: "1rem",
              },
              "& .fc-col-header-cell-cushion": {
                padding: "8px 2px",
              },
              "& .fc-timegrid-col-frame": {
                minWidth: "70px",
              },
              "& .fc-timegrid-col": {
                minWidth: "70px",
              },
            },
          }}
        >
          <ErrorBoundary
            fallback={
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  p: 3,
                }}
              >
                <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
                  캘린더 렌더링 중 오류가 발생했습니다.
                </Alert>
                <Button
                  variant="contained"
                  onClick={() => window.location.reload()}
                  startIcon={<SettingsIcon />}
                >
                  페이지 새로고침
                </Button>
              </Box>
            }
          >
            {/* 캘린더 컴포넌트를 Suspense로 감싸기 */}
            <Suspense
              fallback={
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <CircularProgress size={40} thickness={4} />
                </Box>
              }
            >
              {/* 분리된 캘린더 컴포넌트로 교체 */}
              <ScheduleCalendar
                calendarRef={calendarRef}
                viewType={viewType}
                events={filteredEvents}
                isMobile={isMobile}
                showSidePanel={showSidePanel}
                theme={theme}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                renderEventContent={renderEventContent}
              />
            </Suspense>
          </ErrorBoundary>
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
