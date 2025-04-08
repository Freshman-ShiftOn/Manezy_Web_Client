/**
 * 스케줄 페이지 컴포넌트
 *
 * 이 파일은 원래 SimpleSchedulePage.tsx에서 리팩토링된 파일입니다.
 * 렌더링 성능 개선 및 템플릿 관리 기능이 추가되었습니다.
 *
 * 주요 기능:
 * - 주간/월간 근무 일정 표시
 * - 근무 템플릿 관리 (오픈/미들/마감)
 * - 알바생 필터링
 * - 미배정 근무 표시
 * - 드래그 앤 드롭으로 일정 조정
 * - 요청 관리 시스템
 * - 최적 스케줄링 추천
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Toolbar,
} from "@mui/material";
import {
  FilterAlt,
  PersonAdd,
  Assignment,
  AssignmentInd,
  MoreVert,
  Settings as SettingsIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  InboxRounded as InboxIcon,
  AutoAwesome as AutoAwesomeIcon,
  Work,
  ChevronLeft,
  ChevronRight,
  Info as InfoIcon,
  Edit as EditIcon,
  DragIndicator as DragIndicatorIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventContentArg } from "@fullcalendar/core";
import Schedule from "./Schedule";
import { v4 as uuidv4 } from "uuid";
import ShiftDialog from "./ShiftDialog";

import {
  getEmployees,
  getStoreInfo,
  getShifts,
  saveShift,
  deleteShift, // 삭제 API 추가
} from "../../services/api";
import { Employee, Store, Shift } from "../../lib/types";
import { useNavigate } from "react-router-dom";
import {
  format,
  differenceInHours,
  addDays,
  subWeeks,
  startOfWeek,
  endOfWeek,
  differenceInDays,
} from "date-fns";

// 사용자 정의 CSS 스타일 (복원 확인)
const schedulerStyles = {
  // 이벤트 기본 스타일
  ".fc-event": {
    borderWidth: "1px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    margin: "1px 0",
    overflow: "hidden",
    minHeight: "42px", // 최소 높이 설정
  },
  // 미배정 근무 스타일
  ".unassigned-shift": {
    opacity: 0.85,
    backgroundColor: "#AAAAAA !important",
    color: "#FFFFFF !important",
    borderLeft: "3px solid #888888 !important",
  },
  // 인원 부족 근무 스타일
  ".understaffed-shift": {
    borderLeft: "3px solid #FB8C00 !important",
  },
  // 인원 충족 근무 스타일
  ".fully-staffed-shift": {
    borderLeft: "3px solid #4CAF50 !important",
  },
  // 주간 뷰 이벤트 스타일
  ".week-view-event": {
    borderRadius: "4px !important",
    zIndex: 1,
  },
  // 월간 뷰 이벤트 스타일
  ".month-view-event": {
    borderRadius: "3px !important",
    margin: "1px 0",
  },
  // 주간 뷰 셀 스타일 개선
  ".fc-timegrid-slot": {
    height: "3.4em", // 슬롯 높이 약간 더 증가
  },
  // 오늘 날짜 강조
  ".fc-day-today": {
    backgroundColor: "rgba(66, 133, 244, 0.08) !important",
  },
  // 시간 라벨 스타일
  ".fc-timegrid-slot-label": {
    fontSize: "0.85rem",
    color: "#555",
    fontWeight: "500",
  },
  // 이벤트 간격 조정 및 겹침 개선
  ".fc-timegrid-event-harness": {
    margin: "0 !important", // 마진 제거하여 일관된 배치
  },
  // 이벤트 겹침 시 표시 개선
  ".fc-timegrid-col-events": {
    margin: "0 0.5%", // 마진 늘려서 배경이 더 보이게 조정
    width: "99% !important", // 너비 조정
  },
  // 이벤트 겹칠 때 그림자 효과로 구분감 주기
  ".fc-timegrid-event": {
    padding: "1px", // 패딩 약간 추가
    minWidth: "auto !important", // 최소 너비 자동 조정으로 변경
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    border: "1px solid rgba(0,0,0,0.08)",
  },
  // 개별 이벤트 위치 조정 - 세 개 이벤트가 각각 왼쪽, 중앙, 오른쪽에 위치하도록
  ".fc-timegrid-event-harness:nth-child(3n+1)": {
    left: "0% !important", // 첫 번째 이벤트는 왼쪽에 배치
    right: "auto !important",
    width: "80% !important", // 90%에서 80%로 너비 줄이기
  },
  ".fc-timegrid-event-harness:nth-child(3n+2)": {
    left: "6% !important", // 4%에서 6%로 증가 - 더 오른쪽으로 이동
    right: "auto !important",
    width: "80% !important", // 90%에서 80%로 너비 줄이기
  },
  ".fc-timegrid-event-harness:nth-child(3n)": {
    left: "12% !important", // 8%에서 12%로 증가 - 더 오른쪽으로 이동
    right: "auto !important",
    width: "80% !important", // 90%에서 80%로 너비 줄이기
  },
  // 두 개만 겹칠 때는 왼쪽/오른쪽으로 나누어 배치
  ".fc-timegrid-event-harness-inset.fc-timegrid-event-harness": {
    zIndex: 2, // 겹치는 이벤트가 잘 보이도록 z-index 설정
  },
  // 단일 이벤트일 때는 중앙에 배치
  ".fc-timegrid-event-harness:only-child": {
    left: "10% !important", // 중앙 정렬하여 배경이 더 보이게 함
    right: "auto !important",
    width: "80% !important", // 100%에서 80%로 너비 줄이기
  },
  // 열 헤더 강조
  ".fc-col-header-cell": {
    backgroundColor: "#f8f9fa",
    fontWeight: "600",
  },
  // 일요일 색상 조정
  ".fc-day-sun .fc-col-header-cell-cushion": {
    color: "#e53935",
  },
  // 토요일 색상 조정
  ".fc-day-sat .fc-col-header-cell-cushion": {
    color: "#1e88e5",
  },
  // 캘린더 넓게 표시
  ".fc-view-harness": {
    width: "100%",
  },
  // 컬럼 너비 최적화
  ".fc-timegrid-col-frame": {
    minWidth: "120px", // 최소 너비 설정
  },
  // 요일 헤더 고정을 위한 스타일
  ".fc-col-header": {
    position: "sticky", // 헤더를 고정
    top: 0, // 상단에 고정
    zIndex: 5, // 다른 요소 위에 표시되도록 z-index 설정
    backgroundColor: "#fff", // 배경색 설정
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)", // 그림자 효과 추가
  },
};

// 알바생별 색상 팔레트 (컴포넌트 외부 유지)
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

// 시간대 템플릿 타입 추가
interface ShiftTemplate {
  id: string;
  name: string;
  type: "open" | "middle" | "close";
  startTime: string; // 'HH:MM' 포맷
  endTime: string; // 'HH:MM' 포맷
  requiredStaff: number;
  color: string;
}

// 기본 템플릿 정의
const DEFAULT_SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    id: "template-open",
    name: "오픈",
    type: "open",
    startTime: "09:00",
    endTime: "13:00",
    requiredStaff: 2,
    color: "#4CAF50", // 초록색
  },
  {
    id: "template-middle",
    name: "미들",
    type: "middle",
    startTime: "12:00",
    endTime: "17:00",
    requiredStaff: 3,
    color: "#2196F3", // 파랑색
  },
  {
    id: "template-close",
    name: "마감",
    type: "close",
    startTime: "16:00",
    endTime: "21:00",
    requiredStaff: 2,
    color: "#9C27B0", // 보라색
  },
];

// ShiftEvent와 SimpleShiftEvent 간 변환 유틸리티 함수
const toShiftEvent = (event: any): any => {
  return {
    ...event,
    extendedProps: {
      ...event.extendedProps,
      shiftType: event.extendedProps?.shiftType || "middle",
      requiredStaff: event.extendedProps?.requiredStaff || 1,
    },
  };
};

// Shift -> SimpleShiftEvent 변환 함수 (임시 any 반환)
const toSimpleShiftEvent = (shift: Shift): any => {
  console.warn("toSimpleShiftEvent is deprecated and returns any.");
  // FullCalendar 이벤트 객체와 유사한 구조로 반환 (필요시 수정)
  return {
    id: shift.id,
    title: shift.title || shift.employeeIds?.join(", ") || "근무",
    start: shift.start,
    end: shift.end,
    extendedProps: {
      employeeIds: shift.employeeIds,
      shiftType: shift.shiftType,
      requiredStaff: shift.requiredStaff,
      note: shift.note,
    },
  };
};

// ScheduleShift 타입 정의 (DragDropScheduler가 사용할 타입)
interface ScheduleShift {
  id: string;
  day: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  color: string;
  employees: { id: string; name: string; role: string; avatarColor?: string }[];
  maxEmployees?: number;
  requiredRoles?: Record<string, number>;
}

// FullCalendar 이벤트 타입 정의 (SimpleShiftEvent 대체)
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: any; // 필요한 추가 정보
}

const drawerWidth = 260; // Drawer 너비 정의

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // md 브레이크포인트 사용

  const [selectedShiftId, setSelectedShiftId] = useState<string | undefined>(
    undefined
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployeeIds, setFilteredEmployeeIds] = useState<string[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(true); // 패널 상태 추가/복원
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showInfoAlert, setShowInfoAlert] = useState(true);
  const [showInfoIcon, setShowInfoIcon] = useState(false);

  // FullCalendar 관련 상태 복원
  const calendarRef = useRef<any>(null);
  const [viewType, setViewType] = useState<"timeGridWeek" | "dayGridMonth">(
    "timeGridWeek"
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]); // CalendarEvent 타입 사용

  // ShiftDialog 관련 상태 복원 (CalendarEvent 사용)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(false);

  // 알바생 색상 결정 로직 (useCallback 사용)
  const getEmployeeColor = useCallback(
    (employeeId: string | undefined): string => {
      if (!employeeId) return "#888888";
      const index = employees.findIndex((emp) => emp.id === employeeId);
      return EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length] || "#888888";
    },
    [employees] // employees 의존성 유지
  );

  // *** processShiftsToEvents: CalendarEvent 객체 생성 로직 상세 복원 ***
  const processShiftsToEvents = useCallback(
    (shiftsData: Shift[], employeesData: Employee[]) => {
      if (!employeesData || employeesData.length === 0) {
        console.warn("processShiftsToEvents: employeesData is empty or null.");
        setEvents([]); // 직원이 없으면 이벤트 비움
        return;
      }
      const colorMap = new Map<string, string>();
      employeesData.forEach((emp) =>
        colorMap.set(emp.id, getEmployeeColor(emp.id))
      );

      const mappedEvents = shiftsData.map((shift): CalendarEvent => {
        const assignedEmployees = employeesData.filter((emp) =>
          shift.employeeIds?.includes(emp.id)
        );
        const employeeNames = assignedEmployees.map((emp) => emp.name);

        // 제목 설정 (첫 직원 이름 + 인원 수 또는 근무 타입)
        let title = shift.shiftType || "근무"; // 기본값
        if (assignedEmployees.length > 0) {
          title = employeeNames[0];
          if (employeeNames.length > 1)
            title += ` 외 ${employeeNames.length - 1}명`;
        }

        // 색상 설정 (첫 직원 색상 또는 미배정 회색)
        const eventColor =
          assignedEmployees.length > 0
            ? colorMap.get(assignedEmployees[0].id)
            : "#AAAAAA";

        return {
          id: shift.id,
          title: title, // FullCalendar 내부 title prop으로 사용될 수 있음
          start: shift.start,
          end: shift.end,
          backgroundColor: eventColor,
          borderColor: eventColor,
          textColor: "#ffffff",
          extendedProps: {
            // 렌더링에 필요한 추가 정보 전달
            employeeIds: shift.employeeIds || [],
            employeeNames: employeeNames, // renderEventContent에서 사용
            note: shift.note,
            shiftType: shift.shiftType || "middle", // renderEventContent에서 사용
            requiredStaff: shift.requiredStaff || 1, // renderEventContent에서 사용
          },
        };
      });
      setEvents(mappedEvents);
      console.log("Shifts processed to events:", mappedEvents?.length);
    },
    [employees, getEmployeeColor]
  );

  // *** renderEventContent 함수 상세 복원 ***
  const renderEventContent = (eventInfo: EventContentArg): React.ReactNode => {
    const extendedProps = eventInfo.event.extendedProps || {};
    const employeeIds = extendedProps.employeeIds || [];
    const employeeNames = extendedProps.employeeNames || []; // employeeNames 사용
    const requiredStaff = extendedProps.requiredStaff || 1;
    const shiftType = extendedProps.shiftType || "middle";
    const view = calendarRef.current?.getApi()?.view?.type;

    let shiftLabel = "";
    if (shiftType === "open") shiftLabel = "오픈";
    else if (shiftType === "middle") shiftLabel = "미들";
    else if (shiftType === "close") shiftLabel = "마감";

    // 주간 뷰 렌더링
    if (view === "timeGridWeek") {
      return (
        <Box
          sx={{
            p: "4px 6px",
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
              mb: "2px",
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: "0.8rem",
                fontWeight: "bold",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {shiftLabel}
            </Typography>
            <Typography
              component="span"
              sx={{
                bgcolor: "rgba(255,255,255,0.3)",
                px: "4px",
                borderRadius: "4px",
                fontSize: "0.7rem",
                whiteSpace: "nowrap",
                fontWeight: "bold",
              }}
            >
              {employeeIds.length}/{requiredStaff}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", opacity: 0.9, mb: "3px" }}>
            {eventInfo.timeText}
          </Typography>
          {employeeNames.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                overflow: "hidden",
                flex: 1,
                mt: "2px",
              }}
            >
              {employeeNames.slice(0, 3).map((name: string, index: number) => {
                const empId = employeeIds[index]; // ID 가져오기
                return (
                  <Box
                    key={empId || index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.75rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        bgcolor: getEmployeeColor(empId),
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {name}
                    </Typography>
                  </Box>
                );
              })}
              {employeeNames.length > 3 && (
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    opacity: 0.9,
                    fontStyle: "italic",
                    textAlign: "center",
                    mt: "auto",
                    pt: "1px",
                  }}
                >
                  외 {employeeNames.length - 3}명...
                </Typography>
              )}
            </Box>
          )}
        </Box>
      );
    }

    // 월간 뷰 렌더링
    return (
      <Box
        sx={{
          p: "1px 3px",
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: "0.7rem",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shiftLabel}
          </Typography>
          <Typography
            component="span"
            sx={{
              bgcolor: "rgba(0,0,0,0.1)",
              color: "#333",
              px: "3px",
              borderRadius: "3px",
              fontSize: "0.6rem",
              fontWeight: "bold",
            }}
          >
            {employeeIds.length}/{requiredStaff}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: "0.65rem",
            color: "text.secondary",
            whiteSpace: "nowrap",
          }}
        >
          {format(new Date(eventInfo.event.start), "HH:mm")}-
          {format(new Date(eventInfo.event.end), "HH:mm")}
        </Typography>
        {employeeNames.length > 0 && (
          <Box
            sx={{
              fontSize: "0.7rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              opacity: 0.9,
              mt: "1px",
            }}
          >
            {employeeNames.slice(0, 1).map((name: string, index: number) => {
              const empId = employeeIds[index];
              return (
                <Typography
                  component="span"
                  key={empId || index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    fontSize: "0.65rem",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      bgcolor: getEmployeeColor(empId),
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {name}
                </Typography>
              );
            })}
            {employeeNames.length > 1 && (
              <Typography
                sx={{ fontSize: "0.6rem", opacity: 0.8, fontStyle: "italic" }}
              >
                외 {employeeNames.length - 1}명...
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  };

  // *** handleEventClick 함수 정의 ***
  const handleEventClick = (clickInfo: any) => {
    console.log("Event clicked:", clickInfo.event);
    const clickedEvent: CalendarEvent = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      backgroundColor: clickInfo.event.backgroundColor,
      borderColor: clickInfo.event.borderColor,
      textColor: clickInfo.event.textColor,
      extendedProps: clickInfo.event.extendedProps,
    };
    setSelectedEvent(clickedEvent);
    setIsNewEvent(false);
    setIsDialogOpen(true);
  };

  const handleSaveSchedule = (updatedSchedule: any) => {
    // 타입은 any 또는 ScheduleShift[] 등 확인 필요
    console.log("SchedulePage: Saving schedule...", updatedSchedule);
    alert("스케줄 저장 기능 구현 필요 (API 연동)");
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      console.log("loadData: Attempting...");
      try {
        setLoading(true);
        const [employeesData, shiftsData, storeData] = await Promise.all([
          getEmployees(),
          getShifts(),
          getStoreInfo(),
        ]);
        if (isMounted) {
          console.log(
            "loadData: Fetched employees:",
            employeesData?.length,
            "shifts:",
            shiftsData?.length
          );
          setEmployees(employeesData || []);
          setShifts(shiftsData || []);
          setStore(storeData);
          setFilteredEmployeeIds(employeesData?.map((e) => e.id) || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("loadData: Error loading data:", err);
          setError("데이터 로딩 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("loadData: Finished");
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 모바일에서는 기본적으로 패널 닫기
  useEffect(() => {
    if (isMobile) {
      setShowSidePanel(false);
    } else {
      setShowSidePanel(true);
    }
  }, [isMobile]);

  const handleEmployeeFilter = (employeeId: string) => {
    setFilteredEmployeeIds((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleEmployeeDragStart = (e: React.DragEvent, employeeId: string) => {
    e.dataTransfer.setData("employeeId", employeeId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleCopyLastWeek = useCallback(() => {
    const copiedShifts: Shift[] = shifts.map((shift) => {
      const newShift = { ...shift };
      const startDate = new Date(shift.start);
      const endDate = new Date(shift.end);
      startDate.setDate(startDate.getDate() + 7);
      endDate.setDate(endDate.getDate() + 7);
      newShift.start = startDate.toISOString();
      newShift.end = endDate.toISOString();
      newShift.id = uuidv4();
      return newShift;
    });
    const updatedShifts = [...shifts, ...copiedShifts];
    setShifts(updatedShifts);
    alert("지난 주 스케줄을 복사했습니다.");
  }, [shifts]);

  // ShiftDialog 닫기 핸들러 복원
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null); // 선택된 이벤트 초기화
  };

  // 근무 일정 저장 핸들러 (ShiftDialog의 onSave에서 호출됨)
  const handleSaveShift = async (updatedEventData: CalendarEvent) => {
    console.log("handleSaveShift: Received event data:", updatedEventData);
    setIsDialogOpen(false); // 다이얼로그 먼저 닫기

    try {
      // 1. CalendarEvent를 API가 요구하는 Shift 형식으로 변환 (예시)
      const shiftToSave: Partial<Shift> = {
        id: updatedEventData.id,
        start: updatedEventData.start,
        end: updatedEventData.end,
        employeeIds: updatedEventData.extendedProps?.employeeIds || [],
        requiredStaff: updatedEventData.extendedProps?.requiredStaff,
        shiftType: updatedEventData.extendedProps?.shiftType,
        note: updatedEventData.extendedProps?.note,
        // storeId 등 필요한 다른 정보 추가...
        storeId: store?.id || "s1", // 예시
        title: updatedEventData.title, // title 추가 (optional이므로 없어도 됨)
        isRecurring: false, // MVP에서는 반복 없음
      };

      // 2. API 호출하여 저장
      console.log("handleSaveShift: Calling saveShift API with:", shiftToSave);
      // const savedShift = await saveShift(shiftToSave as Shift); // 실제 API 호출 (타입 단언 필요할 수 있음)
      // console.log("handleSaveShift: API save result:", savedShift);

      // --- API 호출 성공 시 로컬 상태 업데이트 ---
      // 임시: API 호출 대신 로컬에서 바로 업데이트
      const savedShift = { ...shiftToSave /* ...API 응답 가정... */ } as Shift;

      // 3. 로컬 shifts 상태 업데이트
      setShifts((prevShifts) => {
        const index = prevShifts.findIndex((s) => s.id === savedShift.id);
        if (index !== -1) {
          // 기존 근무 수정
          const newShifts = [...prevShifts];
          newShifts[index] = savedShift;
          return newShifts;
        } else {
          // 새 근무 추가
          return [...prevShifts, savedShift];
        }
      });

      // 4. FullCalendar events 상태 업데이트 (processShiftsToEvents 재호출)
      // setShifts가 비동기일 수 있으므로 업데이트된 shifts를 직접 전달
      const updatedShiftsForEvents = isNewEvent
        ? [...shifts, savedShift]
        : shifts.map((s) => (s.id === savedShift.id ? savedShift : s));

      processShiftsToEvents(updatedShiftsForEvents, employees);

      console.log("handleSaveShift: Local state updated.");
      alert("근무 일정이 저장되었습니다."); // 임시 피드백
    } catch (error) {
      console.error("Error saving shift:", error);
      alert("근무 일정 저장 중 오류가 발생했습니다.");
    }
  };

  const handleCloseInfoAlert = () => {
    setShowInfoAlert(false);
    setShowInfoIcon(true);
  };

  const handleInfoIconClick = () => {
    setShowInfoAlert(true);
    setShowInfoIcon(false);
  };

  // --- FullCalendar 핸들러 정의 (복원/추가) ---
  const handleDateSelect = (selectInfo: any) => {
    console.log("Date selected:", selectInfo);
    // 새 이벤트 생성 로직 (ShiftDialog 열기)
    const newEvent: CalendarEvent = {
      id: uuidv4(),
      title: "새 근무",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      backgroundColor: "#CCCCCC",
      borderColor: "#CCCCCC",
      textColor: "#000000",
      extendedProps: { employeeIds: [], requiredStaff: 1, shiftType: "middle" },
    };
    setSelectedEvent(newEvent);
    setIsNewEvent(true);
    setIsDialogOpen(true);
  };

  const handleEventDrop = (dropInfo: any) => {
    console.log("Event dropped:", dropInfo);
    // 이벤트 드래그 & 드롭 (시간 변경) 처리 로직
    const updatedEvent: CalendarEvent = {
      id: dropInfo.event.id,
      title: dropInfo.event.title,
      start: dropInfo.event.startStr, // 변경된 시작 시간
      end: dropInfo.event.endStr, // 변경된 종료 시간
      backgroundColor: dropInfo.event.backgroundColor,
      borderColor: dropInfo.event.borderColor,
      textColor: dropInfo.event.textColor,
      extendedProps: dropInfo.event.extendedProps, // 기존 extendedProps 유지
    };
    handleSaveShift(updatedEvent);
  };

  const handleEventResize = (resizeInfo: any) => {
    console.log("Event resized:", resizeInfo);
    // 이벤트 크기 조절 (시간 변경) 처리 로직
    const updatedEvent: CalendarEvent = {
      id: resizeInfo.event.id,
      title: resizeInfo.event.title,
      start: resizeInfo.event.startStr, // 변경된 시작 시간
      end: resizeInfo.event.endStr, // 변경된 종료 시간
      backgroundColor: resizeInfo.event.backgroundColor,
      borderColor: resizeInfo.event.borderColor,
      textColor: resizeInfo.event.textColor,
      extendedProps: resizeInfo.event.extendedProps, // 기존 extendedProps 유지
    };
    handleSaveShift(updatedEvent);
  };

  // 직원 목록에서 캘린더로 드롭 핸들러
  const handleCalendarDrop = (dropInfo: any) => {
    console.log("Dropped onto calendar:", dropInfo);
    const employeeId = dropInfo.draggedEl.dataset.employeeId; // Draggable 요소에 data-employee-id 설정 필요
    const dropDate = dropInfo.date;

    if (!employeeId) return;

    // 가장 가까운 이벤트 찾아서 직원 추가 또는 새 이벤트 생성 로직
    console.log(`Assign employee ${employeeId} near ${dropDate}`);
    // TODO: findNearestEvent 및 handleAssignEmployee 로직 구현 또는 수정 필요
    alert("직원 드롭 기능 구현 필요");
  };

  // 뷰 타입 변경 핸들러
  const handleViewChange = (viewType: string) => {
    if (viewType === "timeGridWeek" || viewType === "dayGridMonth") {
      // setViewType(viewType); // viewType 상태 변수 다시 추가 필요
      if (calendarRef.current) {
        calendarRef.current.getApi().changeView(viewType);
      }
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* 사이드바 (열고 닫기 로직 적용) */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"} // 반응형 variant
        anchor="left"
        open={showSidePanel} // open 상태 연결
        onClose={() => setShowSidePanel(false)} // 모바일 배경 클릭 시 닫힘
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            position: "relative",
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Toolbar />
        <Divider />
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(0, 0, 0, 0.08)" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            직원 필터
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setFilteredEmployeeIds(employees.map((e) => e.id))}
              sx={{ fontSize: "0.75rem" }}
            >
              전체 선택
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setFilteredEmployeeIds([])}
              sx={{ fontSize: "0.75rem" }}
            >
              전체 해제
            </Button>
          </Box>
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
        </Box>
        <List sx={{ width: "100%", overflowY: "auto", p: 1, flexGrow: 1 }}>
          {employees.map((employee) => (
            <ListItem key={employee.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                dense
                draggable
                onDragStart={(e) => handleEmployeeDragStart(e, employee.id)}
                onClick={() => handleEmployeeFilter(employee.id)}
                selected={filteredEmployeeIds.includes(employee.id)}
                sx={{ borderRadius: 1, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor:
                        EMPLOYEE_COLORS[
                          employees.findIndex((e) => e.id === employee.id) %
                            EMPLOYEE_COLORS.length
                        ] || "#888888",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={employee.name}
                  secondary={employee.role || "일반"}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: filteredEmployeeIds.includes(employee.id)
                      ? 600
                      : 400,
                  }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
                <DragIndicatorIcon
                  fontSize="small"
                  sx={{
                    color: "action.disabled",
                    opacity: 0.5,
                    cursor: "grab",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {/* 모바일 닫기 버튼 (Optional) */}
        {isMobile && (
          <IconButton
            onClick={() => setShowSidePanel(false)}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <ChevronLeft />
          </IconButton>
        )}
      </Drawer>

      {/* 메인 컨텐츠 영역 (marginLeft 및 transition 적용) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          transition: theme.transitions.create("margin", {
            // 전환 효과
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: `-${drawerWidth}px`, // 기본적으로 닫힌 상태의 마진
          ...(showSidePanel &&
            !isMobile && {
              // 열렸을 때 마진 조정 (persistent variant)
              transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
              marginLeft: 0,
            }),
        }}
      >
        <Toolbar />
        {/* 상단 컨트롤 영역 (버튼 추가 및 배치 조정) */}
        <Box
          sx={{
            mb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            {" "}
            {/* 좌측 버튼 그룹: 주간/월간 */}
            <Button
              size="small"
              variant={viewType === "timeGridWeek" ? "contained" : "outlined"}
              onClick={() => handleViewChange("timeGridWeek")}
            >
              주간
            </Button>
            <Button
              size="small"
              variant={viewType === "dayGridMonth" ? "contained" : "outlined"}
              onClick={() => handleViewChange("dayGridMonth")}
            >
              월간
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {" "}
            {/* 우측 버튼 그룹 */}
            {/* 정보 아이콘 (필요시 주석 해제) */}
            {/* {showInfoIcon && ( 
                     <IconButton size="small" color="primary" onClick={handleInfoIconClick} sx={{ mr: 0.2 }}><InfoIcon fontSize="small" /></IconButton>
                 )} */}
            {/* --- 지난 주 복사 버튼 --- */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={handleCopyLastWeek}
              sx={{ fontWeight: 500 }}
            >
              지난 주 복사
            </Button>
            {/* 저장, 초기화 버튼 (임시) */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => alert("초기화 기능 구현 필요")}
            >
              초기화
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={() => alert("저장 기능 구현 필요")}
            >
              저장
            </Button>
            {/* --- 패널 열기/닫기 버튼 --- */}
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => setShowSidePanel(!showSidePanel)}
              sx={{ fontWeight: 500 }}
              startIcon={showSidePanel ? <ChevronLeft /> : <ChevronRight />}
            >
              {showSidePanel ? "패널 닫기" : "패널 열기"}
            </Button>
          </Box>
        </Box>

        {showInfoAlert && (
          <Alert
            severity="info"
            sx={{ mb: 1, flexShrink: 0 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleCloseInfoAlert}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            <AlertTitle>근무 캘린더 안내</AlertTitle>
            <Typography variant="body2">
              • <strong>알바생 필터:</strong> 알바생을 클릭하여 특정 알바생의
              근무만 표시하거나 숨길 수 있습니다.
              <br />• <strong>드래그 앤 드롭:</strong> 알바생을 달력의 근무
              시간에 끌어다 놓아 쉽게 배정할 수 있습니다.
              <br />• <strong>미배정 근무(회색):</strong> 아직 알바생이 배정되지
              않은 근무 시간입니다.
              <br />• <strong>인력 부족 근무(주황색):</strong> 필요 인원보다
              적게 배정된 근무 시간입니다.
              <br />• <strong>배정 완료 근무(초록색):</strong> 필요 인원이 모두
              채워진 근무 시간입니다.
            </Typography>
          </Alert>
        )}
        <Paper
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            p: 0,
            position: "relative",
            "& .fc": {
              ...schedulerStyles,
              height: "100%",
              width: "100%",
            },
            "& .fc-view-harness": {
              height: "auto !important",
              flexGrow: 1,
              overflow: "auto",
            },
            boxShadow: 2,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexGrow: 1,
              }}
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : (
            <Box sx={{ flexGrow: 1, position: "relative", height: "100%" }}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={viewType}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "",
                }}
                height="100%"
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelInterval="01:00"
                slotMinTime={store?.openingHour || "08:00:00"}
                slotMaxTime={store?.closingHour || "23:00:00"}
                events={events}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={5}
                weekends={true}
                eventOverlap={true}
                eventMaxStack={3}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                navLinks={true}
                nowIndicator={true}
                editable={true}
                droppable={true}
                drop={handleCalendarDrop}
                dayHeaderFormat={{
                  weekday: "short",
                  month: "numeric",
                  day: "numeric",
                  omitCommas: true,
                }}
                eventClassNames={(arg: EventContentArg): string[] => {
                  const extendedProps = arg.event.extendedProps || {};
                  const shiftType = extendedProps.shiftType || "middle";
                  if (shiftType === "open") return ["week-view-event"];
                  if (shiftType === "middle") return ["week-view-event"];
                  if (shiftType === "close") return ["week-view-event"];
                  return [];
                }}
                eventContent={renderEventContent}
                slotLabelFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: false,
                }}
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }}
                stickyHeaderDates={true}
                locale={"ko"}
                firstDay={1}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                  startTime: store?.openingHour || "08:00",
                  endTime: store?.closingHour || "23:00",
                }}
                views={{
                  timeGridWeek: {
                    titleFormat: {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    },
                    slotEventOverlap: true,
                  },
                  dayGridMonth: {
                    titleFormat: { year: "numeric", month: "long" },
                    dayMaxEvents: 3,
                  },
                }}
                dayCellClassNames="day-cell"
                slotLabelClassNames="slot-label"
                dayHeaderClassNames="day-header"
                expandRows={true}
              />
            </Box>
          )}
        </Paper>

        {/* ShiftDialog 렌더링 복원 */}
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
    </Box>
  );
};

export default SchedulePage;
