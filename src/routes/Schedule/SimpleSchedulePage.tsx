import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { formatDate } from "@fullcalendar/core";

// --- CSS Imports for FullCalendar ---
import "@fullcalendar/common/main.css"; // Core CSS
import "@fullcalendar/daygrid/main.css"; // Day Grid CSS
import "@fullcalendar/timegrid/main.css"; // Time Grid CSS
// --- End CSS Imports ---

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
    requiredStaff: 1,
    color: "#4CAF50", // 초록색
  },
  {
    id: "template-middle",
    name: "미들",
    type: "middle",
    startTime: "12:00",
    endTime: "17:00",
    requiredStaff: 2,
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

// Define shift colors based on ShiftDialog.tsx
const SHIFT_COLORS = {
  open: "#4CAF50",
  middle: "#2196F3",
  close: "#9C27B0",
};

// Function to generate ISO date strings (adjust timezone as needed, here assuming local)
const createDateISO = (
  year: number,
  month: number,
  day: number,
  time: string
): string => {
  const [hour, minute] = time.split(":").map(Number);
  // Note: Month is 0-indexed in JavaScript Date objects
  const date = new Date(year, month - 1, day, hour, minute);
  // Basic check for invalid date (often happens with timezone shifts near DST changes if not careful)
  if (isNaN(date.getTime())) {
    console.error(`Invalid date created for ${year}-${month}-${day} ${time}`);
    // Fallback or throw error - returning an empty string might cause issues later
    // Consider using a library like date-fns or moment for robust date handling
    return new Date(year, month - 1, day).toISOString(); // Fallback to midnight UTC of the day
  }
  return date.toISOString();
};

const generatedShifts: Shift[] = [
  // Sunday, March 31, 2025
  {
    id: "shift_20250331_open",
    storeId: "store1",
    title: "오픈",
    start: createDateISO(2025, 3, 31, "08:00"),
    end: createDateISO(2025, 3, 31, "17:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "open",
    color: SHIFT_COLORS.open,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "open" },
  },
  {
    id: "shift_20250331_close",
    storeId: "store1",
    title: "마감",
    start: createDateISO(2025, 3, 31, "13:00"),
    end: createDateISO(2025, 3, 31, "22:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "close",
    color: SHIFT_COLORS.close,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "close" },
  },
  // Monday, April 1, 2025
  {
    id: "shift_20250401_open",
    storeId: "store1",
    title: "오픈",
    start: createDateISO(2025, 4, 1, "08:00"),
    end: createDateISO(2025, 4, 1, "17:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "open",
    color: SHIFT_COLORS.open,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "open" },
  },
  {
    id: "shift_20250401_close",
    storeId: "store1",
    title: "마감",
    start: createDateISO(2025, 4, 1, "13:00"),
    end: createDateISO(2025, 4, 1, "22:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "close",
    color: SHIFT_COLORS.close,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "close" },
  },
  // Tuesday, April 2, 2025
  {
    id: "shift_20250402_open",
    storeId: "store1",
    title: "오픈",
    start: createDateISO(2025, 4, 2, "08:00"),
    end: createDateISO(2025, 4, 2, "17:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "open",
    color: SHIFT_COLORS.open,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "open" },
  },
  {
    id: "shift_20250402_close",
    storeId: "store1",
    title: "마감",
    start: createDateISO(2025, 4, 2, "13:00"),
    end: createDateISO(2025, 4, 2, "22:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "close",
    color: SHIFT_COLORS.close,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "close" },
  },
  // Wednesday, April 3, 2025
  {
    id: "shift_20250403_open",
    storeId: "store1",
    title: "오픈",
    start: createDateISO(2025, 4, 3, "08:00"),
    end: createDateISO(2025, 4, 3, "17:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "open",
    color: SHIFT_COLORS.open,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "open" },
  },
  {
    id: "shift_20250403_close",
    storeId: "store1",
    title: "마감",
    start: createDateISO(2025, 4, 3, "13:00"),
    end: createDateISO(2025, 4, 3, "22:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "close",
    color: SHIFT_COLORS.close,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "close" },
  },
  // Thursday, April 4, 2025
  {
    id: "shift_20250404_open",
    storeId: "store1",
    title: "오픈",
    start: createDateISO(2025, 4, 4, "08:00"),
    end: createDateISO(2025, 4, 4, "17:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "open",
    color: SHIFT_COLORS.open,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "open" },
  },
  {
    id: "shift_20250404_close",
    storeId: "store1",
    title: "마감",
    start: createDateISO(2025, 4, 4, "13:00"),
    end: createDateISO(2025, 4, 4, "22:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "close",
    color: SHIFT_COLORS.close,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "close" },
  },
  // Friday, April 5, 2025
  {
    id: "shift_20250405_open",
    storeId: "store1",
    title: "오픈",
    start: createDateISO(2025, 4, 5, "08:00"),
    end: createDateISO(2025, 4, 5, "17:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "open",
    color: SHIFT_COLORS.open,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "open" },
  },
  {
    id: "shift_20250405_close",
    storeId: "store1",
    title: "마감",
    start: createDateISO(2025, 4, 5, "13:00"),
    end: createDateISO(2025, 4, 5, "22:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "close",
    color: SHIFT_COLORS.close,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "close" },
  },
  // Saturday, April 6, 2025
  {
    id: "shift_20250406_open",
    storeId: "store1",
    title: "오픈",
    start: createDateISO(2025, 4, 6, "08:00"),
    end: createDateISO(2025, 4, 6, "17:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "open",
    color: SHIFT_COLORS.open,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "open" },
  },
  {
    id: "shift_20250406_close",
    storeId: "store1",
    title: "마감",
    start: createDateISO(2025, 4, 6, "13:00"),
    end: createDateISO(2025, 4, 6, "22:00"),
    employeeIds: [],
    isRecurring: false,
    requiredStaff: 2,
    shiftType: "close",
    color: SHIFT_COLORS.close,
    extendedProps: { employeeIds: [], requiredStaff: 2, shiftType: "close" },
  },
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
  const [loading, setLoading] = useState(false);
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

  // 초기 데이터 로드: 오직 목업 데이터만 사용
  useEffect(() => {
    console.log("Loading ONLY generated mock shifts.");
    setLoading(true); // 로딩 시작

    // generatedShifts를 SimpleShiftEvent 형식으로 변환
    const calendarEvents = generatedShifts.map((shift): SimpleShiftEvent => {
      // 직원 이름 정보는 더 이상 가져오지 않음 (employees 데이터 로드 안 함)
      const employeeNames: string[] = []; // 빈 배열로 설정

      return {
        id: shift.id,
        title: shift.title || shift.shiftType || "근무",
        start: shift.start,
        end: shift.end,
        backgroundColor: shift.color || "#CCCCCC",
        borderColor: shift.color || "#CCCCCC",
        // 테마 의존성 없이 기본 대비 색상 설정 (흰색 또는 검은색)
        textColor: "#FFFFFF", // 항상 흰색 텍스트로 고정
        extendedProps: {
          employeeIds: shift.employeeIds,
          employeeNames: employeeNames, // 빈 배열
          note: shift.note,
          requiredStaff: shift.requiredStaff,
          shiftType: shift.shiftType,
        },
      };
    });

    // 디버깅을 위해 변환된 이벤트를 콘솔에 출력
    console.log("Converted calendar events:", calendarEvents);

    setEvents(calendarEvents); // 변환된 이벤트를 상태에 설정
    setShifts(generatedShifts); // 원본 목업 데이터도 상태에 설정
    setLoading(false); // 로딩 완료

    // 이전 API 호출 로직 완전 제거
    // const loadInitialData = async () => { ... }; loadInitialData(); 제거
  }, []); // 빈 의존성 배열로 설정하여 컴포넌트 마운트 시 한 번만 실행

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
  const filteredEvents = useMemo(() => {
    // 항상 빈 배열이 반환되지 않도록 보장
    if (events.length === 0) {
      // 이벤트가 없으면 하드코딩된 예제 이벤트 사용
      const exampleEvents: SimpleShiftEvent[] = [
        {
          id: "example1",
          title: "예제 오픈 근무",
          start: "2025-03-31T08:00:00",
          end: "2025-03-31T17:00:00",
          backgroundColor: "#4CAF50",
          borderColor: "#4CAF50",
          textColor: "#FFFFFF",
        },
        {
          id: "example2",
          title: "예제 마감 근무",
          start: "2025-03-31T13:00:00",
          end: "2025-03-31T22:00:00",
          backgroundColor: "#9C27B0",
          borderColor: "#9C27B0",
          textColor: "#FFFFFF",
        },
      ];
      return exampleEvents;
    }

    // 기존의 필터링 로직 적용
    return events.filter((event) => {
      // 1. 미배정 근무만 보기 필터
      if (showUnassignedOnly) {
        const hasEmployees =
          event.extendedProps?.employeeIds &&
          event.extendedProps.employeeIds.length > 0;
        if (hasEmployees) return false;
      }

      // 2. 직원별 필터 (선택된 직원만 표시)
      if (filteredEmployeeIds.length > 0 && event.extendedProps?.employeeIds) {
        // 선택된 직원이 이 이벤트에 배정된 경우만 표시
        return event.extendedProps.employeeIds.some((id) =>
          filteredEmployeeIds.includes(id)
        );
      }

      return true;
    });
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
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">근무 일정표</Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 4 }}>
        <div style={{ height: "70vh", width: "100%" }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            initialDate={"2025-03-01"}
            events={[
              // 3월
              { title: "오픈", start: "2025-03-01", color: "#4CAF50" },
              { title: "마감", start: "2025-03-01", color: "#9C27B0" },
              { title: "오픈", start: "2025-03-02", color: "#4CAF50" },
              { title: "마감", start: "2025-03-02", color: "#9C27B0" },
              { title: "오픈", start: "2025-03-03", color: "#4CAF50" },
              { title: "마감", start: "2025-03-03", color: "#9C27B0" },
              { title: "오픈", start: "2025-03-04", color: "#4CAF50" },
              { title: "마감", start: "2025-03-04", color: "#9C27B0" },
              { title: "오픈", start: "2025-03-05", color: "#4CAF50" },
              { title: "마감", start: "2025-03-05", color: "#9C27B0" },
              { title: "오픈", start: "2025-03-06", color: "#4CAF50" },
              { title: "마감", start: "2025-03-06", color: "#9C27B0" },
              { title: "오픈", start: "2025-03-10", color: "#4CAF50" },
              { title: "마감", start: "2025-03-10", color: "#9C27B0" },
              { title: "오픈", start: "2025-03-11", color: "#4CAF50" },
              { title: "마감", start: "2025-03-11", color: "#9C27B0" },

              // 4월
              { title: "오픈", start: "2025-04-01", color: "#4CAF50" },
              { title: "마감", start: "2025-04-01", color: "#9C27B0" },
              { title: "오픈", start: "2025-04-02", color: "#4CAF50" },
              { title: "마감", start: "2025-04-02", color: "#9C27B0" },
              { title: "오픈", start: "2025-04-03", color: "#4CAF50" },
              { title: "마감", start: "2025-04-03", color: "#9C27B0" },
              { title: "오픈", start: "2025-04-04", color: "#4CAF50" },
              { title: "마감", start: "2025-04-04", color: "#9C27B0" },
              { title: "오픈", start: "2025-04-05", color: "#4CAF50" },
              { title: "마감", start: "2025-04-05", color: "#9C27B0" },

              // 주간 상세 스케줄 (시간 포함)
              {
                title: "오픈 근무",
                start: "2025-03-31T08:00:00",
                end: "2025-03-31T16:00:00",
                color: "#4CAF50",
              },
              {
                title: "마감 근무",
                start: "2025-03-31T14:00:00",
                end: "2025-03-31T22:00:00",
                color: "#9C27B0",
              },
              {
                title: "오픈 근무",
                start: "2025-04-01T08:00:00",
                end: "2025-04-01T16:00:00",
                color: "#4CAF50",
              },
              {
                title: "마감 근무",
                start: "2025-04-01T14:00:00",
                end: "2025-04-01T22:00:00",
                color: "#9C27B0",
              },
            ]}
            height="100%"
            editable={false}
            selectable={true}
            eventDisplay="auto"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: false,
            }}
            locale="ko"
          />
        </div>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary">
          새 근무 추가
        </Button>
      </Box>
    </Box>
  );
};

export default SimpleSchedulePage;
