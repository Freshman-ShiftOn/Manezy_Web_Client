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
  Avatar,
  Chip,
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
  addHours,
} from "date-fns";
import { alpha } from "@mui/material/styles";

// 사용자 정의 CSS 스타일 (시간 가시성 개선)
const schedulerStyles = {
  ".fc-event": {
    borderWidth: "1px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    margin: "1px 0",
    overflow: "hidden",
    minHeight: "42px",
  },
  ".unassigned-shift": {
    opacity: 0.85,
    backgroundColor: "#AAAAAA !important",
    color: "#FFFFFF !important",
    borderLeft: "3px solid #888888 !important",
  },
  ".understaffed-shift": { borderLeft: "3px solid #FB8C00 !important" },
  ".fully-staffed-shift": { borderLeft: "3px solid #4CAF50 !important" },
  ".week-view-event": { borderRadius: "4px !important", zIndex: 1 },
  ".month-view-event": { borderRadius: "3px !important", margin: "1px 0" },
  ".fc-timegrid-slot": {
    height: "2.4em", // 높이 미세 조정 (더 많은 시간 표시)
    borderBottom: "1px solid #eaedf1", // *** 구분선 색상 변경 및 명확화 ***
  },
  ".fc-timegrid-slot.fc-timegrid-slot-minor": {
    // 30분 단위 구분선
    borderBottomStyle: "dotted", // 점선으로 변경
  },
  ".fc-timegrid-slot-label": {
    fontSize: "0.75rem",
    color: "#333", // 색상 진하게
    fontWeight: "500", // 굵기 유지
    padding: "0 4px", // 좌우 패딩 추가
    textAlign: "right", // 오른쪽 정렬
  },
  ".fc-timegrid-slot-label-frame": {
    alignItems: "center", // 세로 중앙 정렬 (FullCalendar v6+)
  },
  ".fc-timegrid-event-harness": { margin: "0 !important" },
  ".fc-timegrid-col-events": { margin: "0 0.5%", width: "99% !important" },
  ".fc-timegrid-event": {
    padding: "1px",
    minWidth: "auto !important",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    border: "1px solid rgba(0,0,0,0.08)",
  },
  ".fc-timegrid-event-harness:nth-child(3n+1)": {
    left: "0% !important",
    right: "auto !important",
    width: "80% !important",
  },
  ".fc-timegrid-event-harness:nth-child(3n+2)": {
    left: "6% !important",
    right: "auto !important",
    width: "80% !important",
  },
  ".fc-timegrid-event-harness:nth-child(3n)": {
    left: "12% !important",
    right: "auto !important",
    width: "80% !important",
  },
  ".fc-timegrid-event-harness-inset.fc-timegrid-event-harness": { zIndex: 2 },
  ".fc-timegrid-event-harness:only-child": {
    left: "10% !important",
    right: "auto !important",
    width: "80% !important",
  },
  ".fc-col-header-cell": { backgroundColor: "#f8f9fa", fontWeight: "600" },
  ".fc-day-sun .fc-col-header-cell-cushion": { color: "#e53935" },
  ".fc-day-sat .fc-col-header-cell-cushion": { color: "#1e88e5" },
  ".fc-view-harness": { width: "100%" },
  ".fc-timegrid-col-frame": { minWidth: "120px" },
  ".fc-col-header": {
    position: "sticky",
    top: 0,
    zIndex: 5,
    backgroundColor: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
};

// 알바생별 색상 팔레트
const EMPLOYEE_COLORS = [
  "#4285F4",
  "#EA4335",
  "#FBBC05",
  "#34A853",
  "#8E24AA",
  "#16A2B8",
  "#F6BF26",
  "#F57C00",
  "#1E88E5",
  "#6E85B7",
];

// FullCalendar 이벤트 타입 (CalendarEvent 사용)
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: any;
}

const drawerWidth = 260;

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const calendarRef = useRef<any>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEmployeeIds, setFilteredEmployeeIds] = useState<string[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(false); // 초기값을 항상 false로 설정
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [viewType, setViewType] = useState<"timeGridWeek" | "dayGridMonth">(
    "timeGridWeek"
  );
  const [showInfoAlert, setShowInfoAlert] = useState(true);
  const [showInfoIcon, setShowInfoIcon] = useState(false);
  const [showScrollGuide, setShowScrollGuide] = useState(true);

  // --- Helper Functions ---
  const getEmployeeColor = useCallback(
    (employeeId: string | undefined): string => {
      if (!employeeId) return "#888888";
      const index = employees.findIndex((emp) => emp.id === employeeId);
      return EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length] || "#888888";
    },
    [employees]
  );

  const processShiftsToEvents = useCallback(
    (shiftsData: Shift[], employeesData: Employee[]) => {
      if (!employeesData?.length) {
        setEvents([]);
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

        let title = shift.shiftType || "근무";
        if (assignedEmployees.length > 0) {
          title = employeeNames[0];
          if (employeeNames.length > 1)
            title += ` 외 ${employeeNames.length - 1}명`;
        }
        const eventColor =
          assignedEmployees.length > 0
            ? colorMap.get(assignedEmployees[0].id)
            : "#AAAAAA";

        return {
          id: shift.id,
          title: title,
          start: shift.start,
          end: shift.end,
          backgroundColor: eventColor,
          borderColor: eventColor,
          textColor: "#ffffff",
          extendedProps: {
            employeeIds: shift.employeeIds || [],
            employeeNames: employeeNames,
            note: shift.note,
            shiftType: shift.shiftType || "middle",
            requiredStaff: shift.requiredStaff || 1,
          },
        };
      });
      setEvents(mappedEvents);
    },
    [employees, getEmployeeColor]
  );

  const renderEventContent = (eventInfo: EventContentArg): React.ReactNode => {
    const extendedProps = eventInfo.event.extendedProps || {};
    const employeeIds = extendedProps.employeeIds || [];
    const employeeNames: string[] = extendedProps.employeeNames || [];
    const requiredStaff = extendedProps.requiredStaff || 1;
    const shiftType = extendedProps.shiftType || "middle";
    const view = calendarRef.current?.getApi()?.view?.type;

    let shiftLabel = "";
    if (shiftType === "open") shiftLabel = "오픈";
    else if (shiftType === "middle") shiftLabel = "미들";
    else if (shiftType === "close") shiftLabel = "마감";

    if (view === "timeGridWeek") {
      return (
        <Box
          sx={{
            p: "2px 4px",
            /* 패딩 조정 */ height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ /* ... */ mb: "1px" /* 마진 조정 */ }}>
            <Typography
              component="span"
              sx={{ fontSize: "0.75rem" /* 폰트 조정 */ /* ... */ }}
            >
              {shiftLabel}
            </Typography>
            <Typography
              component="span"
              sx={{ fontSize: "0.65rem" /* 폰트 조정 */ /* ... */ }}
            >
              {employeeIds.length}/{requiredStaff}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "0.7rem", /* 폰트 조정 */ opacity: 0.9 }}>
            {eventInfo.timeText}
          </Typography>
          {employeeNames.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                overflow: "hidden",
                flex: 1,
                mt: "1px",
              }}
            >
              {employeeNames.slice(0, 2).map((name: string, index: number) => {
                // 표시 직원 수 조정 (예: 2명)
                const empId = employeeIds[index];
                return (
                  <Box
                    key={empId || index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      fontSize: "0.7rem" /* 폰트 조정 */,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: "7px",
                        height: "7px" /* 크기 조정 */ /* ... */,
                      }}
                    />
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ lineHeight: 1.1 /* 줄간격 조정 */ }}
                    >
                      {name}
                    </Typography>
                  </Box>
                );
              })}
              {employeeNames.length > 2 && ( // 직원 수 조건 변경
                <Typography sx={{ fontSize: "0.65rem" /* ... */ }}>
                  외 {employeeNames.length - 2}명...
                </Typography>
              )}
            </Box>
          )}
        </Box>
      );
    }

    // 월간 뷰 렌더링 (상세 복원 및 오류 수정)
    return (
      <Box
        sx={{
          p: "1px 2px",
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
            {/* employeeNames 배열을 순회하며 이름 표시 */}
            {employeeNames.slice(0, 1).map((name: string, index: number) => {
              const empId = employeeIds[index]; // *** empId 변수 선언 확인 ***
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
                  {name} {/* *** name 변수 사용 확인 *** */}
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

  // --- Data Loading ---
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

  // --- Event Handlers ---
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

  const handleCloseInfoAlert = () => {
    setShowInfoAlert(false);
    setShowInfoIcon(true);
  };

  const handleInfoIconClick = () => {
    setShowInfoAlert(true);
    setShowInfoIcon(false);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveShift = async (updatedEventData: CalendarEvent) => {
    console.log("handleSaveShift: Received event data:", updatedEventData);
    setIsDialogOpen(false);

    try {
      const shiftToSave: Partial<Shift> = {
        id: updatedEventData.id,
        start: updatedEventData.start,
        end: updatedEventData.end,
        employeeIds: updatedEventData.extendedProps?.employeeIds || [],
        requiredStaff: updatedEventData.extendedProps?.requiredStaff,
        shiftType: updatedEventData.extendedProps?.shiftType,
        note: updatedEventData.extendedProps?.note,
        storeId: store?.id || "s1",
        title: updatedEventData.title,
        isRecurring: false,
      };

      console.log("handleSaveShift: Calling saveShift API with:", shiftToSave);
      const savedShift = { ...shiftToSave } as Shift;

      setShifts((prevShifts) => {
        const index = prevShifts.findIndex((s) => s.id === savedShift.id);
        if (index !== -1) {
          const newShifts = [...prevShifts];
          newShifts[index] = savedShift;
          return newShifts;
        } else {
          return [...prevShifts, savedShift];
        }
      });

      const updatedShiftsForEvents = isNewEvent
        ? [...shifts, savedShift]
        : shifts.map((s) => (s.id === savedShift.id ? savedShift : s));

      processShiftsToEvents(updatedShiftsForEvents, employees);

      console.log("handleSaveShift: Local state updated.");
      alert("근무 일정이 저장되었습니다.");
    } catch (error) {
      console.error("Error saving shift:", error);
      alert("근무 일정 저장 중 오류가 발생했습니다.");
    }
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

  const handleViewChange = (newViewType: string) => {
    if (newViewType === "timeGridWeek" || newViewType === "dayGridMonth") {
      if (calendarRef.current) {
        calendarRef.current.getApi().changeView(newViewType);
      }
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    const startDate = new Date(selectInfo.startStr);
    const endDate = new Date(selectInfo.endStr);
    // ... (기존 시간 유효성 검사 등)

    // 시작 시간 기준으로 자동 shiftType 결정
    const startHour = startDate.getHours();
    let autoShiftType: "open" | "middle" | "close" = "middle"; // 기본값 미들
    if (startHour < 12) autoShiftType = "open";
    else if (startHour >= 17) autoShiftType = "close";

    const newEvent: CalendarEvent = {
      id: uuidv4(),
      title: "새 근무",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      backgroundColor: "#CCCCCC",
      borderColor: "#CCCCCC",
      textColor: "#000000",
      extendedProps: {
        employeeIds: [],
        requiredStaff: 1,
        shiftType: autoShiftType, // 자동 결정된 타입 사용
      },
    };
    setSelectedEvent(newEvent);
    setIsNewEvent(true);
    setIsDialogOpen(true);
  };

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

  const handleEventDrop = (dropInfo: any) => {
    console.log("Event dropped:", dropInfo);
    const updatedEvent: CalendarEvent = {
      id: dropInfo.event.id,
      title: dropInfo.event.title,
      start: dropInfo.event.startStr,
      end: dropInfo.event.endStr,
      backgroundColor: dropInfo.event.backgroundColor,
      borderColor: dropInfo.event.borderColor,
      textColor: dropInfo.event.textColor,
      extendedProps: dropInfo.event.extendedProps,
    };
    handleSaveShift(updatedEvent);
  };

  const handleEventResize = (resizeInfo: any) => {
    console.log("Event resized:", resizeInfo);
    const updatedEvent: CalendarEvent = {
      id: resizeInfo.event.id,
      title: resizeInfo.event.title,
      start: resizeInfo.event.startStr,
      end: resizeInfo.event.endStr,
      backgroundColor: resizeInfo.event.backgroundColor,
      borderColor: resizeInfo.event.borderColor,
      textColor: resizeInfo.event.textColor,
      extendedProps: resizeInfo.event.extendedProps,
    };
    handleSaveShift(updatedEvent);
  };

  const findNearestEvent = (date: Date): CalendarEvent | null => {
    const targetTime = date.getTime();
    let nearestEvent: CalendarEvent | null = null;
    let minTimeDiff = 3 * 60 * 60 * 1000; // 3시간 범위 제한

    for (const event of events) {
      // filteredEvents 대신 전체 events 사용
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();

      // 드롭된 시간이 이벤트 범위 내에 있는지 확인
      if (targetTime >= eventStart && targetTime < eventEnd) {
        // 범위 내 가장 가까운 이벤트보다 더 가까우면 업데이트 (동일 시간대 여러개 방지)
        const diff = Math.min(targetTime - eventStart, eventEnd - targetTime);
        if (diff < minTimeDiff) {
          minTimeDiff = diff;
          nearestEvent = event;
        }
      }
    }
    // 범위 내 이벤트가 없다면, 시간상 가장 가까운 이벤트 (주석 처리된 이전 로직 참고)
    if (!nearestEvent) {
      // 필요 시 시간차 계산 로직 추가
    }
    return nearestEvent;
  };

  const handleCalendarDrop = (dropInfo: any) => {
    const employeeId = dropInfo.draggedEl.dataset.employeeId;
    const dropDate = dropInfo.date;
    if (!employeeId || !dropDate) return;

    const targetEvent = findNearestEvent(dropDate);

    if (targetEvent) {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) return;

      // 중복 및 최대 인원 체크
      if (targetEvent.extendedProps?.employeeIds?.includes(employeeId)) {
        alert("이미 배정된 직원입니다.");
        return;
      }
      const maxEmployees = targetEvent.extendedProps?.requiredStaff || 1; // 필요 인원을 최대로 간주
      if (targetEvent.extendedProps?.employeeIds?.length >= maxEmployees) {
        alert(`최대 ${maxEmployees}명까지 배정 가능합니다.`);
        return;
      }

      // 기존 이벤트 업데이트 (직원 추가)
      const updatedEvent: CalendarEvent = {
        ...targetEvent,
        extendedProps: {
          ...targetEvent.extendedProps,
          employeeIds: [
            ...(targetEvent.extendedProps?.employeeIds || []),
            employeeId,
          ],
          employeeNames: [
            ...(targetEvent.extendedProps?.employeeNames || []),
            employee.name,
          ],
        },
      };
      // 색상 업데이트 (첫 번째 직원 기준)
      if (updatedEvent.extendedProps.employeeIds.length === 1) {
        updatedEvent.backgroundColor = getEmployeeColor(employeeId);
        updatedEvent.borderColor = getEmployeeColor(employeeId);
      }

      handleSaveShift(updatedEvent); // 저장 로직 호출
    } else {
      // 새 이벤트 생성 (ShiftDialog 열기)
      console.log("No nearby event found, creating new shift...");
      const startDate = new Date(dropDate);
      // 드롭된 시간을 기준으로 기본 근무 시간 설정 (예: 2시간)
      const endDate = addHours(startDate, 2);

      // *** 시간 기준으로 자동 shiftType 결정 (handleDateSelect와 동일 로직) ***
      const startHour = startDate.getHours();
      let autoShiftType: "open" | "middle" | "close" = "middle";
      if (startHour < 12) autoShiftType = "open";
      else if (startHour >= 17) autoShiftType = "close";

      const newEvent: CalendarEvent = {
        id: uuidv4(),
        title: employees.find((e) => e.id === employeeId)?.name || "새 근무",
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: getEmployeeColor(employeeId),
        borderColor: getEmployeeColor(employeeId),
        textColor: "#ffffff",
        extendedProps: {
          employeeIds: [employeeId],
          employeeNames: [
            employees.find((e) => e.id === employeeId)?.name || "",
          ],
          requiredStaff: 1,
          shiftType: autoShiftType, // *** 자동 결정된 타입 사용 ***
        },
      };
      setSelectedEvent(newEvent);
      setIsNewEvent(true);
      setIsDialogOpen(true);
    }
  };

  // 필터링된 이벤트 계산
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (filteredEmployeeIds.length > 0) {
      filtered = filtered.filter((event) => {
        return event.extendedProps?.employeeIds?.some((id: string) =>
          filteredEmployeeIds.includes(id)
        );
      });
    }

    if (showUnassignedOnly) {
      filtered = filtered.filter(
        (event) =>
          !event.extendedProps?.employeeIds?.length ||
          event.extendedProps.employeeIds.length === 0
      );
    }
    console.log("Recalculated Filtered Events:", filtered?.length);
    return filtered;
  }, [events, filteredEmployeeIds, showUnassignedOnly]);

  // 미배정 근무 계산
  const unassignedShifts = useMemo(() => {
    return events.filter(
      (event) =>
        !event.extendedProps?.employeeIds ||
        event.extendedProps.employeeIds.length === 0
    );
  }, [events]);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={showSidePanel}
        onClose={() => setShowSidePanel(false)}
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1 }}
          >
            * 직원을 드래그하여 캘린더에 배정하세요.
          </Typography>
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
                sx={{
                  borderRadius: 1,
                  py: 0.8,
                  ...(filteredEmployeeIds.includes(employee.id) && {
                    backgroundColor: alpha(theme.palette.primary.light, 0.15),
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.light, 0.25),
                    },
                  }),
                  "&:hover .drag-indicator": { opacity: 0.7 },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: getEmployeeColor(employee.id),
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={employee.name}
                  secondary={employee.role || "일반"}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: filteredEmployeeIds.includes(employee.id)
                      ? 500
                      : 400,
                  }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
                <DragIndicatorIcon
                  fontSize="small"
                  className="drag-indicator"
                  sx={{
                    color: "action.disabled",
                    opacity: 0,
                    cursor: "grab",
                    transition: "opacity 0.2s",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {isMobile && (
          <IconButton
            onClick={() => setShowSidePanel(false)}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <ChevronLeft />
          </IconButton>
        )}
      </Drawer>

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
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: `-${drawerWidth}px`,
          ...(showSidePanel &&
            !isMobile && {
              transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
              marginLeft: 0,
            }),
        }}
      >
        <Box
          sx={{
            mb: 2,
            px: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
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
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={handleCopyLastWeek}
              sx={{ fontWeight: 500 }}
            >
              지난 주 복사
            </Button>
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
              <IconButton size="small" onClick={handleCloseInfoAlert}>
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            <AlertTitle>근무 캘린더 안내</AlertTitle>
            <Typography variant="body2">...</Typography>
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
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            m: 1,
            "& .fc": { ...schedulerStyles, height: "100%", width: "100%" },
            "& .fc-view-harness": {
              height: "auto !important",
              flexGrow: 1,
              overflow: "auto",
            },
            [`& .fc-timegrid-event-harness > .fc-timegrid-event.fc-event-mirror .fc-event-main,
              & .fc-daygrid-event.fc-event-mirror .fc-event-main`]: {
              fontSize: 0,
              color: "transparent",
            },
            "& .fc-timegrid-event.fc-event-mirror .fc-event-time": {
              display: "none",
            },
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
            <Alert severity="error" sx={{ m: 2, width: "calc(100% - 32px)" }}>
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
                slotMinTime={"07:00:00"}
                slotMaxTime={"24:00:00"}
                events={filteredEvents}
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
                  const employeeIds = extendedProps.employeeIds || [];
                  const requiredStaff = extendedProps.requiredStaff || 1;
                  let classes: string[] = [];
                  if (employeeIds.length === 0)
                    classes.push("unassigned-shift");
                  else if (employeeIds.length < requiredStaff)
                    classes.push("understaffed-shift");
                  else classes.push("fully-staffed-shift");
                  const currentView = viewType;
                  if (currentView === "timeGridWeek")
                    classes.push("week-view-event");
                  else classes.push("month-view-event");
                  return classes;
                }}
                eventContent={renderEventContent}
                slotLabelFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: false,
                  omitZeroMinute: false,
                  meridiem: false,
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
