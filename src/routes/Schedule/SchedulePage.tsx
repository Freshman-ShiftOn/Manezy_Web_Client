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
} from "@mui/icons-material";
import ShiftDialog from "./ShiftDialog";
import RequestManagement from "./RequestManagement";
import OptimalScheduling from "./OptimalScheduling";
import { v4 as uuidv4 } from "uuid";

// 사용자 정의 CSS 스타일
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
    requiredStaff?: number;
    shiftType?: "open" | "middle" | "close";
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

// 페이지 탭 타입
type SchedulePageTab = "calendar" | "requests" | "optimal";

// ShiftEvent와 SimpleShiftEvent 간 변환 유틸리티 함수
const toShiftEvent = (event: SimpleShiftEvent): any => {
  return {
    ...event,
    extendedProps: {
      ...event.extendedProps,
      shiftType: event.extendedProps?.shiftType || "middle",
      requiredStaff: event.extendedProps?.requiredStaff || 1,
    },
  };
};

const toSimpleShiftEvent = (event: any): SimpleShiftEvent => {
  return {
    ...event,
    extendedProps: {
      ...event.extendedProps,
    },
  };
};

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const calendarRef = useRef<any>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 탭 상태 추가
  const [activeTab, setActiveTab] = useState<SchedulePageTab>("calendar");
  const [selectedShiftId, setSelectedShiftId] = useState<string | undefined>(
    undefined
  );

  const [viewType, setViewType] = useState<"timeGridWeek" | "dayGridMonth">(
    "timeGridWeek"
  );
  const [events, setEvents] = useState<SimpleShiftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployeeIds, setFilteredEmployeeIds] = useState<string[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showInfoAlert, setShowInfoAlert] = useState(true);
  const [showInfoIcon, setShowInfoIcon] = useState(false); // 정보 아이콘 표시 상태 추가

  // 이벤트 관련 상태 추가
  const [selectedEvent, setSelectedEvent] = useState<SimpleShiftEvent | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(false);

  // 템플릿 관련 상태 추가
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>(
    DEFAULT_SHIFT_TEMPLATES
  );
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ShiftTemplate | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);

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

        // 멀티플 직원 표시를 위한 제목 생성
        let displayTitle = "미배정";
        if (employeeNames.length > 0) {
          if (employeeNames.length === 1) {
            displayTitle = employeeNames[0];
          } else {
            displayTitle = `${employeeNames[0]} 외 ${
              employeeNames.length - 1
            }명`;
          }
        }

        // 기본 required staff가 없으면 shift type에 따라 기본값 설정
        let defaultRequiredStaff = 1;
        if (shift.shiftType === "open") defaultRequiredStaff = 1;
        else if (shift.shiftType === "middle") defaultRequiredStaff = 2;
        else if (shift.shiftType === "close") defaultRequiredStaff = 2;

        return {
          id: shift.id,
          title: displayTitle,
          start: shift.start,
          end: shift.end,
          backgroundColor: getEmployeeColor(shift.employeeIds?.[0]),
          borderColor: getEmployeeColor(shift.employeeIds?.[0]),
          textColor: "#FFFFFF",
          extendedProps: {
            employeeIds: shift.employeeIds || [],
            employeeNames: employeeNames,
            note: shift.note,
            requiredStaff: shift.requiredStaff || defaultRequiredStaff,
            shiftType: shift.shiftType || "middle",
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
    setShowSidePanel(false); // 항상 닫힌 상태로 시작
  }, [isMobile]);

  // 스크롤 안내 상태 추가
  const [showScrollGuide, setShowScrollGuide] = useState(true);

  // 스크롤 안내 숨기기 타이머
  useEffect(() => {
    if (showScrollGuide) {
      const timer = setTimeout(() => {
        setShowScrollGuide(false);
      }, 5000); // 5초 후 안내 숨기기

      return () => clearTimeout(timer);
    }
  }, [showScrollGuide]);

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

  // 알바생 드래그 시작 핸들러 추가
  const handleEmployeeDragStart = (e: React.DragEvent, employeeId: string) => {
    e.dataTransfer.setData("employeeId", employeeId);
    // 시각적 드래그 효과 설정
    e.dataTransfer.effectAllowed = "copy";
  };

  // 캘린더에 드래그 드롭 핸들러
  const handleCalendarDrop = (info: any) => {
    // 드롭된 위치와 시간 정보
    const dropDate = info.date;

    // 드래그된 직원 ID 가져오기
    const employeeId = info.jsEvent.dataTransfer.getData("employeeId");
    if (!employeeId) return;

    // 해당 시간에 가장 가까운 이벤트 찾기 (3시간 이내)
    const nearestEvent = findNearestEvent(dropDate);

    if (nearestEvent) {
      // 이벤트에 직원 배정
      handleAssignEmployee(nearestEvent.id, employeeId);
    } else {
      // 새 이벤트 생성 가능성도 있지만 여기서는 생략
      console.log("드롭 위치 근처에 이벤트가 없습니다.");
    }
  };

  // 가장 가까운 이벤트 찾기 헬퍼 함수
  const findNearestEvent = (date: Date) => {
    const targetTime = date.getTime();
    let nearestEvent = null;
    let minTimeDiff = Infinity;

    for (const event of events) {
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();

      // 이벤트 시간 범위 내에 드롭된 경우
      if (targetTime >= eventStart && targetTime <= eventEnd) {
        return event;
      }

      // 아닌 경우, 가장 가까운 이벤트 찾기
      const diffStart = Math.abs(targetTime - eventStart);
      const diffEnd = Math.abs(targetTime - eventEnd);
      const minDiff = Math.min(diffStart, diffEnd);

      // 3시간(10800000ms) 이내의 가장 가까운 이벤트
      if (minDiff < 10800000 && minDiff < minTimeDiff) {
        minTimeDiff = minDiff;
        nearestEvent = event;
      }
    }

    return nearestEvent;
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
          requiredStaff: 1,
          shiftType: "middle",
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
    setSelectedShiftId(eventData.id);
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

  // 대타 요청 핸들러
  const handleSubstituteRequest = (
    event: SimpleShiftEvent,
    isHighPriority: boolean = false
  ) => {
    // 근무 블록 정보 가져오기
    const targetShift = shifts.find((shift) => shift.id === event.id);
    if (!targetShift || !targetShift.employeeIds?.length) return;

    // 대타 요청 정보 구성
    const requesterId = targetShift.employeeIds[0]; // 첫 번째 알바생을 요청자로 설정
    const now = new Date().toISOString();

    // 이벤트 수정 (대타 요청 마크)
    const updatedEvent = {
      ...event,
      extendedProps: {
        ...event.extendedProps,
        isSubstituteRequest: true,
        isHighPriority,
      },
    };

    // 이벤트 업데이트
    handleSaveShift(updatedEvent);

    // 대화상자 닫기
    setIsDialogOpen(false);
  };

  // 이벤트 내용 렌더링 함수
  const renderEventContent = (eventInfo: any) => {
    const employeeIds = eventInfo.event.extendedProps.employeeIds || [];
    const employeeNames = eventInfo.event.extendedProps.employeeNames || [];
    const requiredStaff = eventInfo.event.extendedProps.requiredStaff || 1;
    const shiftType = eventInfo.event.extendedProps.shiftType || "middle";
    const view = calendarRef.current?.getApi()?.view?.type;

    let shiftLabel = "";
    if (shiftType === "open") shiftLabel = "오픈";
    else if (shiftType === "middle") shiftLabel = "미들";
    else if (shiftType === "close") shiftLabel = "마감";

    // 주간 뷰에서 이벤트 렌더링
    if (view === "timeGridWeek") {
      return (
        <>
          <div
            className="fc-event-main-wrapper"
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              padding: "4px 6px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2px",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shiftLabel}
              </span>
              <span
                style={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  padding: "0px 4px",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  whiteSpace: "nowrap",
                  fontWeight: "bold",
                }}
              >
                {employeeIds.length}/{requiredStaff}
              </span>
            </div>

            <div
              style={{ fontSize: "0.75rem", opacity: 0.9, marginBottom: "3px" }}
            >
              {eventInfo.timeText}
            </div>

            {employeeIds.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  overflow: "hidden",
                  flex: 1,
                }}
              >
                {employeeIds.slice(0, 3).map((id: string, index: number) => {
                  const employee = employees.find((e) => e.id === id);
                  return employee ? (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.75rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        backgroundColor: "rgba(255,255,255,0.15)",
                        padding: "2px 4px",
                        borderRadius: "3px",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: getEmployeeColor(id),
                          display: "inline-block",
                          boxShadow: "0 0 0 1px rgba(255,255,255,0.5)",
                        }}
                      ></span>
                      <span>{employee.name}</span>
                    </div>
                  ) : null;
                })}
                {employeeIds.length > 3 && (
                  <div
                    style={{
                      fontSize: "0.7rem",
                      opacity: 0.9,
                      fontStyle: "italic",
                      textAlign: "center",
                      backgroundColor: "rgba(255,255,255,0.15)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    외 {employeeIds.length - 3}명...
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      );
    }

    // 월간 뷰에서 이벤트 렌더링 (모든 이름 표시 및 시간 정보 추가)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "2px 4px",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1px",
          }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shiftLabel}
          </span>
          <span
            style={{
              backgroundColor: "rgba(255,255,255,0.3)",
              padding: "0px 4px",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: "bold",
            }}
          >
            {employeeIds.length}/{requiredStaff}
          </span>
        </div>

        {/* 시간 정보 추가 */}
        <div
          style={{
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.9)",
            marginBottom: "1px",
            whiteSpace: "nowrap",
          }}
        >
          {format(new Date(eventInfo.event.start), "HH:mm")} -{" "}
          {format(new Date(eventInfo.event.end), "HH:mm")}
        </div>

        {employeeIds.length > 0 && (
          <div
            style={{
              fontSize: "0.73rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              opacity: 0.95,
              display: "flex",
              flexDirection: "column",
              gap: "1px",
            }}
          >
            {/* 모든 이름 표시 */}
            {employeeIds.map((id: string, index: number) => {
              const employee = employees.find((e) => e.id === id);
              return employee ? (
                <span
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    fontSize: "0.7rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: getEmployeeColor(id),
                      display: "inline-block",
                    }}
                  ></span>
                  {employee.name}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
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

  // 캘린더 참조 객체 지우기
  useEffect(() => {
    return () => {
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        if (api) {
          try {
            api.destroy();
          } catch (err) {
            console.error("캘린더 클린업 오류:", err);
          }
        }
      }
    };
  }, [calendarRef]);

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

  // 템플릿 로딩 함수
  const loadTemplatesFromStorage = useCallback(() => {
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
  }, []);

  // 템플릿 로딩
  useEffect(() => {
    loadTemplatesFromStorage();
  }, [loadTemplatesFromStorage]);

  // 템플릿 관리 다이얼로그 컴포넌트
  const TemplateManagerDialog = () => {
    const [templates, setTemplates] = useState<ShiftTemplate[]>([
      ...shiftTemplates,
    ]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingTemplate, setEditingTemplate] =
      useState<ShiftTemplate | null>(null);

    const handleEditTemplate = (index: number) => {
      setEditingIndex(index);
      setEditingTemplate({ ...templates[index] });
    };

    const handleUpdateTemplate = () => {
      if (editingIndex !== null && editingTemplate) {
        const updatedTemplates = [...templates];
        updatedTemplates[editingIndex] = editingTemplate;
        setTemplates(updatedTemplates);
        setEditingIndex(null);
        setEditingTemplate(null);
      }
    };

    const handleAddTemplate = () => {
      const newTemplate: ShiftTemplate = {
        id: `template-${Date.now()}`,
        name: "새 템플릿",
        type: "middle",
        startTime: "12:00",
        endTime: "17:00",
        requiredStaff: 1,
        color: "#2196F3",
      };

      setTemplates([...templates, newTemplate]);
      setEditingIndex(templates.length);
      setEditingTemplate(newTemplate);
    };

    const handleDeleteTemplate = (index: number) => {
      const updatedTemplates = [...templates];
      updatedTemplates.splice(index, 1);
      setTemplates(updatedTemplates);

      if (editingIndex === index) {
        setEditingIndex(null);
        setEditingTemplate(null);
      }
    };

    const handleTemplateFieldChange = (
      field: keyof ShiftTemplate,
      value: any
    ) => {
      if (editingTemplate) {
        setEditingTemplate({
          ...editingTemplate,
          [field]: value,
        });
      }
    };

    return (
      <Dialog
        open={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          근무 템플릿 관리
          <IconButton
            aria-label="close"
            onClick={() => setIsTemplateManagerOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 2, height: "450px" }}>
            {/* 왼쪽: 템플릿 목록 */}
            <Box sx={{ width: "40%", borderRight: "1px solid #eee", pr: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="subtitle1">템플릿 목록</Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={handleAddTemplate}
                >
                  추가
                </Button>
              </Box>

              <List sx={{ overflow: "auto", maxHeight: "370px" }}>
                {templates.map((template, index) => (
                  <ListItemButton
                    key={template.id}
                    selected={editingIndex === index}
                    onClick={() => handleEditTemplate(index)}
                    sx={{ position: "relative", pr: 6 }}
                  >
                    <ListItemText
                      primary={template.name}
                      secondary={`${template.startTime} - ${template.endTime}`}
                    />
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(index);
                      }}
                      sx={{ position: "absolute", right: 8 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                ))}
              </List>
            </Box>

            {/* 오른쪽: 템플릿 편집 */}
            <Box sx={{ width: "60%", pl: 2 }}>
              {editingTemplate ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    템플릿 편집
                  </Typography>

                  <TextField
                    label="템플릿 이름"
                    fullWidth
                    margin="normal"
                    value={editingTemplate.name}
                    onChange={(e) =>
                      handleTemplateFieldChange("name", e.target.value)
                    }
                  />

                  <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                    <TextField
                      label="시작 시간"
                      type="time"
                      value={editingTemplate.startTime}
                      onChange={(e) =>
                        handleTemplateFieldChange("startTime", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="종료 시간"
                      type="time"
                      value={editingTemplate.endTime}
                      onChange={(e) =>
                        handleTemplateFieldChange("endTime", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  <TextField
                    label="필요 인원"
                    type="number"
                    margin="normal"
                    value={editingTemplate.requiredStaff}
                    onChange={(e) =>
                      handleTemplateFieldChange(
                        "requiredStaff",
                        parseInt(e.target.value)
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                  />

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">템플릿 유형</Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Button
                        variant={
                          editingTemplate.type === "open"
                            ? "contained"
                            : "outlined"
                        }
                        onClick={() =>
                          handleTemplateFieldChange("type", "open")
                        }
                        sx={{
                          bgcolor:
                            editingTemplate.type === "open"
                              ? "#4CAF50"
                              : "transparent",
                          color:
                            editingTemplate.type === "open"
                              ? "white"
                              : "inherit",
                        }}
                      >
                        오픈
                      </Button>
                      <Button
                        variant={
                          editingTemplate.type === "middle"
                            ? "contained"
                            : "outlined"
                        }
                        onClick={() =>
                          handleTemplateFieldChange("type", "middle")
                        }
                        sx={{
                          bgcolor:
                            editingTemplate.type === "middle"
                              ? "#2196F3"
                              : "transparent",
                          color:
                            editingTemplate.type === "middle"
                              ? "white"
                              : "inherit",
                        }}
                      >
                        미들
                      </Button>
                      <Button
                        variant={
                          editingTemplate.type === "close"
                            ? "contained"
                            : "outlined"
                        }
                        onClick={() =>
                          handleTemplateFieldChange("type", "close")
                        }
                        sx={{
                          bgcolor:
                            editingTemplate.type === "close"
                              ? "#9C27B0"
                              : "transparent",
                          color:
                            editingTemplate.type === "close"
                              ? "white"
                              : "inherit",
                        }}
                      >
                        마감
                      </Button>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3 }}
                    onClick={handleUpdateTemplate}
                  >
                    적용
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography color="textSecondary">
                    왼쪽에서 템플릿을 선택하거나 새 템플릿을 추가하세요
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTemplateManagerOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSaveTemplates(templates)}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // 탭 변경 핸들러
  const handleTabChange = (
    _: React.SyntheticEvent,
    newValue: SchedulePageTab
  ) => {
    setActiveTab(newValue);
  };

  // 직원 배정 핸들러 (최적 스케줄링에서 사용)
  const handleAssignEmployee = (shiftId: string, employeeId: string) => {
    // 해당 shift 이벤트 찾기
    const shiftEvent = events.find((event) => event.id === shiftId);

    if (shiftEvent) {
      // 이벤트 복사본 생성
      const updatedEvent = { ...shiftEvent };

      // 직원 ID 추가
      updatedEvent.extendedProps = {
        ...updatedEvent.extendedProps,
        employeeIds: [
          ...(updatedEvent.extendedProps?.employeeIds || []),
          employeeId,
        ],
      };

      // 직원 이름 가져오기
      const employee = employees.find((emp) => emp.id === employeeId);
      if (employee) {
        updatedEvent.extendedProps = {
          ...updatedEvent.extendedProps,
          employeeNames: [
            ...(updatedEvent.extendedProps?.employeeNames || []),
            employee.name,
          ],
        };

        // 첫 번째 직원이면 타이틀 업데이트
        if (!updatedEvent.extendedProps?.employeeIds?.length) {
          updatedEvent.title = employee.name;
        }

        // 배경색 업데이트
        updatedEvent.backgroundColor = getEmployeeColor(employeeId);
        updatedEvent.borderColor = getEmployeeColor(employeeId);
      }

      // 이벤트 저장
      handleSaveShift(updatedEvent);
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

  // 알림창 닫기 핸들러 (정보 아이콘 표시)
  const handleCloseInfoAlert = () => {
    setShowInfoAlert(false);
    setShowInfoIcon(true); // 알림창 닫으면 정보 아이콘 표시
  };

  // 정보 아이콘 클릭 핸들러
  const handleInfoIconClick = () => {
    setShowInfoAlert(true);
    setShowInfoIcon(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
        position: "relative",
        overflow: "auto", // 전체 페이지 스크롤 가능
        backgroundColor: "#f9fafb",
        px: 0.25, // 0.5에서 0.25로 줄이기 - 50% 감소
      }}
    >
      {/* 상단 탭 메뉴 - sticky 위치 제거하여 스크롤과 함께 이동하게 함 */}
      <Paper sx={{ mb: 0, borderRadius: 0 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              py: 2,
            },
          }}
        >
          <Tab
            icon={<CalendarIcon />}
            iconPosition="start"
            label="근무 일정"
            value="calendar"
          />
          <Tab
            icon={<InboxIcon />}
            iconPosition="start"
            label="요청 관리"
            value="requests"
          />
          <Tab
            icon={<AutoAwesomeIcon />}
            iconPosition="start"
            label="최적 스케줄링"
            value="optimal"
          />
        </Tabs>
      </Paper>

      {/* 탭 콘텐츠 */}
      {activeTab === "calendar" && (
        <Box
          sx={{
            display: "flex",
            height: "auto",
            position: "relative",
            overflow: "visible",
            maxWidth: "100%", // 전체 너비 최대화
            mx: -1, // -0.75에서 -1로 더 줄이기
            px: 0.15, // 0.25에서 0.15로 줄이기
          }}
        >
          {/* 사이드 패널 */}
          {showSidePanel && (
            <Paper
              sx={{
                width: 230, // 더 줄임
                minWidth: 230, // 더 줄임
                display: "flex",
                flexDirection: "column",
                borderRadius: 1,
                borderRight: "1px solid rgba(0, 0, 0, 0.08)",
                overflow: "hidden",
                mr: 0.25, // 마진 더 줄임
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                marginTop: "4px",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                  bgcolor: "rgba(0, 0, 0, 0.02)",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  알바생 필터
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setFilteredEmployeeIds(employees.map((e) => e.id))
                    }
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
                  label={
                    <Typography variant="body2">미배정 근무만 보기</Typography>
                  }
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  * 알바생을 클릭하면 해당 알바생의 근무만 표시됩니다
                </Typography>
              </Box>

              <List
                sx={{
                  width: "100%",
                  overflowY: "auto",
                  p: 1,
                  flex: 1,
                }}
              >
                {employees.map((employee) => (
                  <ListItem key={employee.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      dense
                      draggable
                      onDragStart={(e) =>
                        handleEmployeeDragStart(e, employee.id)
                      }
                      onClick={() => handleEmployeeFilter(employee.id)}
                      sx={{
                        borderRadius: 1,
                        py: 1,
                        bgcolor: filteredEmployeeIds.includes(employee.id)
                          ? `${getEmployeeColor(employee.id)}22`
                          : "transparent",
                        cursor: "pointer",
                        "&:hover": {
                          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                          "& .drag-indicator": {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            bgcolor: getEmployeeColor(employee.id),
                            borderRadius: "50%",
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={employee.name}
                        secondary={
                          <Box
                            component="span"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              {employee.role || "일반 직원"}
                            </Typography>
                            <Typography
                              className="drag-indicator"
                              variant="caption"
                              sx={{
                                fontSize: "0.7rem",
                                ml: 1,
                                color: "text.secondary",
                                opacity: 0,
                                transition: "opacity 0.2s",
                              }}
                            >
                              (드래그하여 배정)
                            </Typography>
                          </Box>
                        }
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: filteredEmployeeIds.includes(employee.id)
                            ? 600
                            : 400,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>

              <Box
                sx={{
                  p: 2,
                  borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                  bgcolor: "rgba(0, 0, 0, 0.02)",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  미배정 근무
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {unassignedShifts.length}개의 미배정 근무가 있습니다.
                </Typography>
              </Box>

              <List
                sx={{
                  width: "100%",
                  overflowY: "auto",
                  p: 1,
                  flex: 1,
                  maxHeight: "40%",
                }}
              >
                {unassignedShifts.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="미배정 근무가 없습니다"
                      primaryTypographyProps={{
                        variant: "body2",
                        align: "center",
                        color: "text.secondary",
                      }}
                    />
                  </ListItem>
                ) : (
                  unassignedShifts.map((shift) => {
                    const startDate = new Date(shift.start);
                    const endDate = new Date(shift.end);
                    const formattedDate = format(startDate, "M/d (E)");
                    const formattedTime = `${format(
                      startDate,
                      "HH:mm"
                    )} - ${format(endDate, "HH:mm")}`;
                    const shiftType =
                      shift.extendedProps?.shiftType || "middle";
                    let shiftTypeText = "";
                    if (shiftType === "open") shiftTypeText = "오픈";
                    else if (shiftType === "middle") shiftTypeText = "미들";
                    else if (shiftType === "close") shiftTypeText = "마감";

                    return (
                      <ListItem key={shift.id} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          dense
                          onClick={() => {
                            setSelectedEvent(shift);
                            setIsNewEvent(false);
                            setIsDialogOpen(true);
                          }}
                          sx={{
                            borderRadius: 1,
                            py: 1,
                            borderLeft: "3px solid #AAAAAA",
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography variant="body2" fontWeight={500}>
                                  {formattedDate}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    bgcolor: "action.hover",
                                    px: 1,
                                    borderRadius: 1,
                                  }}
                                >
                                  {shiftTypeText}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" display="block">
                                {formattedTime}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })
                )}
              </List>
            </Paper>
          )}

          {/* 메인 콘텐츠 영역 (캘린더) */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <Box
              sx={{
                mb: 0.5, // 2에서 0.5로 마진 줄이기
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
                backgroundColor: "white",
                padding: 1, // 1.5에서 1로 패딩 줄이기
                borderRadius: 1,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                position: "relative", // 정보 아이콘 위치 지정을 위함
              }}
            >
              <Box sx={{ display: "flex", gap: 1, mr: "auto" }}>
                <Button
                  size="small"
                  variant={
                    viewType === "timeGridWeek" ? "contained" : "outlined"
                  }
                  onClick={() => handleViewChange("timeGridWeek")}
                  sx={{
                    fontWeight: viewType === "timeGridWeek" ? 600 : 400,
                    boxShadow: viewType === "timeGridWeek" ? 1 : 0,
                  }}
                >
                  주간
                </Button>
                <Button
                  size="small"
                  variant={
                    viewType === "dayGridMonth" ? "contained" : "outlined"
                  }
                  onClick={() => handleViewChange("dayGridMonth")}
                  sx={{
                    fontWeight: viewType === "dayGridMonth" ? 600 : 400,
                    boxShadow: viewType === "dayGridMonth" ? 1 : 0,
                  }}
                >
                  월간
                </Button>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                {/* 정보 아이콘 - 알림창이 닫혔을 때만 표시 */}
                {showInfoIcon && (
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleInfoIconClick}
                    sx={{ mr: 0.2 }}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => setIsTemplateManagerOpen(true)}
                  startIcon={<SettingsIcon />}
                  sx={{ fontWeight: 600 }}
                >
                  근무 템플릿 관리
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => setShowSidePanel(!showSidePanel)}
                  sx={{ fontWeight: 600 }}
                  startIcon={showSidePanel ? <ChevronLeft /> : <ChevronRight />}
                >
                  {showSidePanel ? "패널 닫기" : "패널 열기"}
                </Button>
              </Box>
            </Box>

            <Alert
              severity="info"
              sx={{
                mb: 0.5, // 2에서 0.5로 마진 줄이기
                display: showInfoAlert ? "flex" : "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                py: 0.5, // 알림창 패딩 줄이기
                "& .MuiAlert-message": {
                  py: 0.5, // 알림 메시지 패딩 줄이기
                },
              }}
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
              <AlertTitle>알바 스케줄 관리 안내</AlertTitle>
              <Typography variant="body2">
                • <strong>알바생 필터:</strong> 알바생을 클릭하여 특정 알바생의
                근무만 표시하거나 숨길 수 있습니다.
                <br />• <strong>드래그 앤 드롭:</strong> 알바생을 달력의 근무
                시간에 끌어다 놓아 쉽게 배정할 수 있습니다.
                <br />• <strong>근무 템플릿 관리:</strong> 버튼을 클릭하여
                반복되는 근무 패턴을 설정하세요.
                <br />• <strong>미배정 근무(회색):</strong> 아직 알바생이
                배정되지 않은 근무 시간입니다.
                <br />• <strong>인력 부족 근무(주황색):</strong> 필요 인원보다
                적게 배정된 근무 시간입니다.
                <br />• <strong>배정 완료 근무(초록색):</strong> 필요 인원이
                모두 채워진 근무 시간입니다.
              </Typography>
            </Alert>

            <Paper
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                display: "flex",
                p: 0, // 패딩 제거
                position: "relative",
                width: "100%",
                "& .fc": {
                  ...schedulerStyles,
                  height: "100%",
                  width: "100%",
                },
                "& .fc-view-harness": {
                  height: "auto !important",
                  minHeight: "500px",
                  width: "100%",
                },
                "& .fc-scroller": {
                  height: "auto !important",
                  overflow: "visible !important",
                },
                "& .fc-toolbar-title": {
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#333",
                },
                "& .fc-toolbar": {
                  padding: "0 0.1rem", // 패딩 줄이기
                },
                "& .fc-button-primary": {
                  backgroundColor: "#3f51b5",
                  borderColor: "#3f51b5",
                },
                "& .fc-button-primary:not(:disabled):hover": {
                  backgroundColor: "#303f9f",
                  borderColor: "#303f9f",
                },
                "& .fc-button-primary:not(:disabled).fc-button-active": {
                  backgroundColor: "#303f9f",
                  borderColor: "#303f9f",
                },
                "& .fc-button-primary:disabled": {
                  backgroundColor: "#9fa8da",
                  borderColor: "#9fa8da",
                },
                // 추가 스타일
                "& .fc-daygrid-event": {
                  padding: "1px",
                  borderRadius: "3px",
                  margin: "2px 0",
                },
                "& .fc-daygrid-event-dot": {
                  display: "none", // 월간 뷰의 점(dot) 숨기기
                },
                "& .fc-daygrid-day-number": {
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  color: "#333",
                },
                "& .fc-daygrid-day-frame": {
                  minHeight: "120px", // 월간 뷰 셀 최소 높이
                },
                "& .fc-col-header": {
                  position: "sticky", // 헤더를 고정
                  top: 0, // 상단에 고정
                  zIndex: 5, // 다른 요소 위에 표시되도록 z-index 설정
                  backgroundColor: "#fff", // 배경색 설정
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)", // 그림자 효과 추가
                },
                boxShadow: 2,
              }}
            >
              {/* 스크롤 안내 */}
              {showScrollGuide && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    bgcolor: "rgba(0,0,0,0.7)",
                    color: "white",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    zIndex: 10,
                    display: { xs: "flex", md: "none" },
                    alignItems: "center",
                    gap: 1,
                    boxShadow: 2,
                  }}
                >
                  <Typography variant="body2">스크롤하여 더 보기</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setShowScrollGuide(false)}
                    sx={{ color: "white", p: 0.2 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={viewType}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "",
                }}
                height="auto"
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelInterval="01:00"
                slotMinTime={store?.openingHour || "09:00:00"}
                slotMaxTime={store?.closingHour || "22:00:00"}
                events={filteredEvents}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={10} // 8에서 10으로 증가
                weekends={true}
                eventOverlap={true} // 이벤트 겹침 허용
                eventMaxStack={8} // 6에서 8로 최대 겹침 개수 증가
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                navLinks={true}
                nowIndicator={true}
                editable={true}
                droppable={true}
                drop={handleCalendarDrop}
                dayHeaderFormat={{ weekday: "short", day: "numeric" }}
                eventClassNames={(arg) => {
                  // 직원 배정 상태에 따른 클래스 추가
                  const employeeIds = arg.event.extendedProps.employeeIds || [];
                  const requiredStaff =
                    arg.event.extendedProps.requiredStaff || 1;
                  let classes = [];

                  if (employeeIds.length === 0) {
                    classes.push("unassigned-shift");
                  } else if (employeeIds.length < requiredStaff) {
                    classes.push("understaffed-shift");
                  } else {
                    classes.push("fully-staffed-shift");
                  }

                  // 겹치는 상황 처리를 위한 추가 클래스
                  const currentView = viewType;
                  if (currentView === "timeGridWeek") {
                    classes.push("week-view-event");
                  } else {
                    classes.push("month-view-event");
                  }

                  return classes;
                }}
                eventContent={renderEventContent}
                // 추가 캘린더 설정
                slotLabelFormat={{
                  hour: "2-digit",
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
                  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                  startTime: store?.openingHour || "09:00",
                  endTime: store?.closingHour || "22:00",
                }}
                views={{
                  timeGridWeek: {
                    titleFormat: {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    },
                    slotEventOverlap: true, // 이벤트 겹침 허용으로 변경
                  },
                  dayGridMonth: {
                    titleFormat: { year: "numeric", month: "long" },
                  },
                }}
                dayCellClassNames="day-cell"
                slotLabelClassNames="slot-label"
                dayHeaderClassNames="day-header"
                expandRows={true}
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
        </Box>
      )}

      {/* 요청 관리 탭 */}
      {activeTab === "requests" && (
        <Box sx={{ height: "calc(100% - 49px)", p: 0 }}>
          <RequestManagement />
        </Box>
      )}

      {/* 최적 스케줄링 탭 */}
      {activeTab === "optimal" && (
        <Box sx={{ height: "calc(100% - 49px)", p: 0 }}>
          <OptimalScheduling
            onAssignEmployee={handleAssignEmployee}
            selectedShiftId={selectedShiftId}
          />
        </Box>
      )}

      {/* 근무 일정 수정 다이얼로그 */}
      {isDialogOpen && selectedEvent && (
        <ShiftDialog
          eventData={toShiftEvent(selectedEvent)}
          isNew={isNewEvent}
          employees={employees}
          onClose={handleCloseDialog}
          onSave={(event) => handleSaveShift(toSimpleShiftEvent(event))}
          onSubstituteRequest={(event, isHighPriority) =>
            handleSubstituteRequest(toSimpleShiftEvent(event), isHighPriority)
          }
          onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
        />
      )}

      {/* 템플릿 관리 다이얼로그 렌더링 */}
      <TemplateManagerDialog />
    </Box>
  );
};

export default SchedulePage;
