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
  Snackbar,
  Alert as MuiAlert,
  AlertProps,
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
  deleteShift,
  createCalendarEvent,
  getBranchWorkers,
  getCalendarEvents,
} from "../../services/api";
import { Employee, Store, Shift, CalendarEventResponse } from "../../lib/types";
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
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";
import { alpha } from "@mui/material/styles";
import { useBranch } from "../../context/BranchContext";
import throttle from "lodash/throttle";

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
    paddingBottom: "10px",
    minWidth: "auto !important",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    border: "1px solid rgba(0,0,0,0.08)",
    cursor: "pointer",
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

// Alert 이름 변경
const CustomAlert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const calendarRef = useRef<any>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { selectedBranchId } = useBranch();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEmployeeIds, setFilteredEmployeeIds] = useState<string[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(false);
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(
    new Date()
  );
  const [lastLoadedBranchId, setLastLoadedBranchId] = useState<string | null>(
    null
  );
  const [lastLoadedDateString, setLastLoadedDateString] = useState<string>("");

  // Store date format as ref to avoid recalculations
  const formatDateForAPI = useCallback((date: Date) => {
    return format(date, "yyyy-MM-dd");
  }, []);

  // KEEP ONLY THIS VERSION - the standalone function that takes empList as parameter
  const getEmployeeColor = (
    employeeId: string | undefined,
    empList: Employee[]
  ): string => {
    if (!employeeId) return "#888888";
    const index = empList.findIndex((emp) => emp.id === employeeId);
    return EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length] || "#888888";
  };

  // *** Moved process logic directly into loadData to avoid circular dependencies ***
  const loadData = useCallback(
    async (forceReload: boolean = false) => {
      if (!selectedBranchId) {
        setError("브랜치가 선택되지 않았습니다. 먼저 브랜치를 선택해주세요.");
        setLoading(false);
        setEvents([]);
        setEmployees([]);
        return;
      }

      // Calculate current date range for querying
      const weekStartISO = startOfWeek(currentCalendarDate, {
        weekStartsOn: 1,
      });
      const weekEndISO = endOfWeek(currentCalendarDate, { weekStartsOn: 1 });
      const queryStartDate = formatDateForAPI(startOfDay(weekStartISO));
      const queryEndDate = formatDateForAPI(endOfDay(weekEndISO));

      // Create a unique string representing this data load to prevent unnecessary reloads
      const loadKey = `${selectedBranchId}-${queryStartDate}-${queryEndDate}`;

      // Skip duplicate loads unless forced
      if (
        !forceReload &&
        loadKey === lastLoadedDateString &&
        selectedBranchId === lastLoadedBranchId
      ) {
        console.log("Skipping duplicate data load:", loadKey);
        return;
      }

      console.log(
        `Loading data for branch: ${selectedBranchId}, range: ${queryStartDate} to ${queryEndDate}`
      );
      setLoading(true);
      setError(null);

      try {
        // Store info load
        const storeData = await getStoreInfo();
        setStore(storeData);

        // Employee data load
        let freshEmployees: Employee[] = [];
        try {
          const branchWorkersData = await getBranchWorkers(selectedBranchId);
          freshEmployees = branchWorkersData.map((worker) => ({
            id:
              worker.userId ||
              `temp-worker-${Math.random().toString(36).substring(2, 9)}`,
            name: worker.name,
            phoneNumber: worker.phoneNums || "",
            email: worker.email || "",
            hourlyRate:
              typeof worker.cost === "string"
                ? parseInt(worker.cost, 10)
                : worker.cost || 9860,
            role: worker.roles || "",
            status: (worker.status === "재직중" || worker.status === "active"
              ? "active"
              : "inactive") as "active" | "inactive" | "pending",
            workerId: worker.userId ? Number(worker.userId) : undefined,
          }));
        } catch (branchError) {
          console.error("Error loading branch workers:", branchError);
          freshEmployees = (await getEmployees()) || [];
        }
        setEmployees(freshEmployees);
        setFilteredEmployeeIds(freshEmployees.map((e) => e.id));

        // Calendar data load
        console.log(
          `Fetching calendar events for YYYY-MM-DD range: ${queryStartDate} to ${queryEndDate}`
        );
        const calendarApiEvents: CalendarEventResponse[] =
          await getCalendarEvents(
            selectedBranchId,
            queryStartDate,
            queryEndDate
          );

        // Add detailed debugging
        console.log(
          "RAW API calendar events:",
          JSON.stringify(calendarApiEvents, null, 2)
        );

        // Ensure proper date formatting for FullCalendar
        const mappedShifts: Shift[] = calendarApiEvents.map((apiEvent) => {
          // Make sure we have valid date strings for start/end times
          let startTime = apiEvent.startTime;
          let endTime = apiEvent.endTime;

          // Keep original date strings - don't convert to ISO format with Z
          // This preserves the intended date/time without timezone shifting

          const mappedShift: Shift = {
            id: apiEvent.id.toString(),
            storeId: apiEvent.branchId.toString(),
            start: startTime,
            end: endTime,
            employeeIds: apiEvent.workerId
              ? [apiEvent.workerId.toString()]
              : [],
            shiftType:
              apiEvent.workType && apiEvent.workType.length > 0
                ? (apiEvent.workType[0] as "open" | "middle" | "close")
                : "middle",
            title: apiEvent.workerName || `일정 #${apiEvent.id}`,
            isRecurring: !!apiEvent.repeatGroupId,
            requiredStaff: 1,
            note: `Input Type: ${apiEvent.inputType}`,
          };

          return mappedShift;
        });

        console.log("Mapped shifts:", mappedShifts);

        setShifts(mappedShifts);

        // *** Process shifts to events directly here (logic moved from processShiftsToEvents) ***
        if (!freshEmployees?.length && !mappedShifts?.length) {
          setEvents([]);
        } else {
          const mappedEvents = mappedShifts.map((shift): CalendarEvent => {
            const assignedEmployeesThisShift = freshEmployees.filter((emp) =>
              shift.employeeIds?.includes(emp.id)
            );
            const employeeNames = assignedEmployeesThisShift.map(
              (emp) => emp.name
            );

            let title = shift.title || shift.shiftType || "근무";
            if (
              assignedEmployeesThisShift.length > 0 &&
              assignedEmployeesThisShift[0]
            ) {
              title = employeeNames[0];
              if (employeeNames.length > 1) {
                title += ` 외 ${employeeNames.length - 1}명`;
              }
            } else if (shift.requiredStaff && shift.requiredStaff > 0) {
              title = `미배정 (${shift.requiredStaff}명 필요)`;
            }

            const eventColor =
              assignedEmployeesThisShift.length > 0 &&
              assignedEmployeesThisShift[0]
                ? getEmployeeColor(
                    assignedEmployeesThisShift[0].id,
                    freshEmployees
                  )
                : "#AAAAAA";

            // Make sure we validate the date format to avoid FullCalendar issues
            const startDate = shift.start ? new Date(shift.start) : new Date();
            const endDate = shift.end
              ? new Date(shift.end)
              : new Date(startDate.getTime() + 60 * 60 * 1000);

            const calendarEvent: CalendarEvent = {
              id: shift.id.toString(),
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
                isRecurring: shift.isRecurring,
              },
            };

            return calendarEvent;
          });

          console.log("Final calendar events:", mappedEvents);
          setEvents(mappedEvents);
        }

        // Record that we successfully loaded this data
        setLastLoadedBranchId(selectedBranchId);
        setLastLoadedDateString(loadKey);
      } catch (err) {
        console.error("loadData: Error loading data:", err);
        setError("데이터 로딩 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
        setEvents([]);
      } finally {
        setLoading(false);
        console.log("loadData: Finished");
      }
    },
    [selectedBranchId, formatDateForAPI]
  ); // *** REMOVED currentCalendarDate dependency

  // Initial data load
  useEffect(() => {
    loadData(true); // Force initial load
  }, [loadData]);

  // Update when calendar date changes, but throttled to prevent excessive API calls
  useEffect(() => {
    loadData(false); // Don't force reload for date changes
  }, [currentCalendarDate, loadData]);

  // Throttled handler for calendar navigation to prevent too many state updates
  const handleDatesSet = useCallback(
    throttle((arg: any) => {
      if (arg.view && arg.view.currentStart) {
        const newDate = new Date(arg.view.currentStart);

        // Check if date truly changed to a different day before setting state
        if (
          newDate.getFullYear() !== currentCalendarDate.getFullYear() ||
          newDate.getMonth() !== currentCalendarDate.getMonth() ||
          newDate.getDate() !== currentCalendarDate.getDate()
        ) {
          console.log("Calendar dates changed to:", newDate);
          setCurrentCalendarDate(newDate);
        }
      }
    }, 300),
    [currentCalendarDate]
  );

  const processShiftsToEvents = useCallback(
    (shiftsData: Shift[], currentEmployeesArg: Employee[]) => {
      if (!currentEmployeesArg?.length && !shiftsData?.length) {
        setEvents([]);
        return;
      }

      const getColorForProcessedEmployee = (
        empId: string | undefined
      ): string => {
        if (!empId) return "#AAAAAA";
        const index = currentEmployeesArg.findIndex((e) => e.id === empId);
        if (index === -1) return "#AAAAAA";
        return EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length] || "#AAAAAA";
      };

      const mappedEvents = shiftsData.map((shift): CalendarEvent => {
        const assignedEmployeesThisShift = currentEmployeesArg.filter((emp) =>
          shift.employeeIds?.includes(emp.id)
        );
        const employeeNames = assignedEmployeesThisShift.map((emp) => emp.name);

        let title = shift.title || shift.shiftType || "근무";
        if (
          assignedEmployeesThisShift.length > 0 &&
          assignedEmployeesThisShift[0]
        ) {
          title = employeeNames[0];
          if (employeeNames.length > 1) {
            title += ` 외 ${employeeNames.length - 1}명`;
          }
        } else if (shift.requiredStaff && shift.requiredStaff > 0) {
          title = `미배정 (${shift.requiredStaff}명 필요)`;
        }

        const eventColor =
          assignedEmployeesThisShift.length > 0 && assignedEmployeesThisShift[0]
            ? getColorForProcessedEmployee(assignedEmployeesThisShift[0].id)
            : "#AAAAAA";

        return {
          id: shift.id.toString(),
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
            isRecurring: shift.isRecurring,
          },
        };
      });
      setEvents(mappedEvents);
    },
    []
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
                      bgcolor: getEmployeeColor(empId, employees),
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

  const handleAddNewShift = () => {
    // 현재 날짜와 시간으로 기본값 설정
    const now = new Date();
    const start = new Date(now);
    start.setHours(9, 0, 0, 0); // 오전 9시로 설정
    const end = new Date(now);
    end.setHours(13, 0, 0, 0); // 오후 1시로 설정

    setSelectedEvent({
      id: uuidv4(),
      title: "새 근무",
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: "#4285F4",
      borderColor: "#4285F4",
      textColor: "#FFFFFF",
      extendedProps: {
        employeeIds: [],
        shiftType: "middle",
        requiredStaff: 1,
      },
    });
    setIsNewEvent(true);
    setIsDialogOpen(true);
  };

  const handleSaveShift = async (updatedEventData: CalendarEvent) => {
    try {
      setLoading(true);
      console.log("Saving shift...", updatedEventData);

      // Find if this is a new shift or an existing one
      const existingEvent = events.find((e) => e.id === updatedEventData.id);
      const isNew = !existingEvent;

      console.log("Saving single shift event:", updatedEventData.extendedProps);
      console.log("일정 시작 시간 (변환 전):", updatedEventData.start);
      console.log("일정 종료 시간 (변환 전):", updatedEventData.end);

      if (isNew) {
        // New shift - Send to the /api/calendar/{branchId}/owner endpoint
        if (selectedBranchId) {
          // Format worker IDs (must be numbers for API)
          const workerIds = updatedEventData.extendedProps.employeeIds.map(
            (id: string) => Number(id)
          );

          // 시간 문자열을 그대로 사용 (이미 ShiftDialog에서 올바른 형식으로 변환됨)
          const calendarRequest = {
            workerIds: workerIds,
            startTime: updatedEventData.start,
            endTime: updatedEventData.end,
            workType: [updatedEventData.extendedProps.shiftType || "middle"],
            inputType: 0, // Default value
          };

          console.log("Sending calendar creation request:", calendarRequest);

          // Call the API to create the calendar event
          await createCalendarEvent(selectedBranchId, calendarRequest);

          // Reload data to get the newly created shift
          await loadData(true);

          setSnackbarMessage("새 근무가 성공적으로 추가되었습니다.");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        } else {
          throw new Error("브랜치를 선택해주세요.");
        }
      } else {
        // For existing shifts, continue using the existing saveShift method
        if (store) {
          const shiftData: Shift = {
            id: updatedEventData.id,
            storeId: store.id,
            start: updatedEventData.start,
            end: updatedEventData.end,
            isRecurring: false,
            employeeIds: updatedEventData.extendedProps.employeeIds,
            shiftType: updatedEventData.extendedProps.shiftType,
            title: updatedEventData.title,
            requiredStaff: updatedEventData.extendedProps.requiredStaff,
          };

          await saveShift(shiftData);

          // Update local state
          const updatedShifts = shifts.map((s) =>
            s.id === shiftData.id ? shiftData : s
          );
          setShifts(updatedShifts);

          // Process shifts to create calendar events
          // Instead of using processShiftsToEvents which is now integrated into loadData,
          // we'll reload all data
          await loadData(true);

          setSnackbarMessage("근무가 수정되었습니다.");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        }
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save shift:", error);
      setSnackbarMessage(
        error instanceof Error
          ? error.message
          : "근무 저장 중 오류가 발생했습니다."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
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
    setSnackbarMessage("지난 주 스케줄을 복사했습니다.");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  }, [shifts]);

  const handleViewChange = (newViewType: "timeGridWeek" | "dayGridMonth") => {
    if (calendarRef.current) {
      console.log("캘린더 뷰 변경:", newViewType);
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newViewType);
      setViewType(newViewType); // 상태 업데이트
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    // 선택된 날짜 범위에서 이벤트 생성
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;

    // Format dates for API compatibility (YYYY-MM-DDTHH:MM:SS)
    const formatDateForCalendar = (date: Date) => {
      return format(date, "yyyy-MM-dd'T'HH:mm:ss");
    };

    // 새 이벤트 ID
    const eventId = uuidv4();

    const newEvent: CalendarEvent = {
      id: eventId,
      title: "새 근무",
      start: formatDateForCalendar(startDate),
      end: formatDateForCalendar(endDate),
      backgroundColor: "#4285F4",
      borderColor: "#4285F4",
      textColor: "#FFFFFF",
      extendedProps: {
        employeeIds: [],
        shiftType: "middle",
        requiredStaff: 1,
      },
    };

    // 이벤트 상태 업데이트
    setSelectedEvent(newEvent);
    setIsNewEvent(true);
    setIsDialogOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    console.log("Event clicked:", clickInfo.event);

    // 원래 이벤트의 시간을 가져옵니다
    const startDate = new Date(clickInfo.event.start);
    const endDate = new Date(clickInfo.event.end);

    // 날짜 포맷 함수
    const formatDateForCalendar = (date: Date) => {
      return format(date, "yyyy-MM-dd'T'HH:mm:ss");
    };

    const clickedEvent: CalendarEvent = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: formatDateForCalendar(startDate),
      end: formatDateForCalendar(endDate),
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

    // 날짜 변환 및 포맷팅
    const startDate = new Date(dropInfo.event.start);
    const endDate = new Date(dropInfo.event.end);

    const formatDateForCalendar = (date: Date) => {
      return format(date, "yyyy-MM-dd'T'HH:mm:ss");
    };

    const updatedEvent: CalendarEvent = {
      id: dropInfo.event.id,
      title: dropInfo.event.title,
      start: formatDateForCalendar(startDate),
      end: formatDateForCalendar(endDate),
      backgroundColor: dropInfo.event.backgroundColor,
      borderColor: dropInfo.event.borderColor,
      textColor: dropInfo.event.textColor,
      extendedProps: dropInfo.event.extendedProps,
    };
    handleSaveShift(updatedEvent);
  };

  const handleEventResize = (resizeInfo: any) => {
    console.log("Event resized:", resizeInfo);

    // 날짜 변환 및 포맷팅
    const startDate = new Date(resizeInfo.event.start);
    const endDate = new Date(resizeInfo.event.end);

    const formatDateForCalendar = (date: Date) => {
      return format(date, "yyyy-MM-dd'T'HH:mm:ss");
    };

    const updatedEvent: CalendarEvent = {
      id: resizeInfo.event.id,
      title: resizeInfo.event.title,
      start: formatDateForCalendar(startDate),
      end: formatDateForCalendar(endDate),
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
        updatedEvent.backgroundColor = getEmployeeColor(employeeId, employees);
        updatedEvent.borderColor = getEmployeeColor(employeeId, employees);
      }

      handleSaveShift(updatedEvent); // 저장 로직 호출
    } else {
      // 새 이벤트 생성 (ShiftDialog 열기)
      console.log("No nearby event found, creating new shift...");
      const startDate = new Date(dropDate);
      // 드롭된 시간을 기준으로 기본 근무 시간 설정 (예: 2시간)
      const endDate = addHours(startDate, 2);

      // Format dates for API compatibility
      const formatDateForCalendar = (date: Date) => {
        return format(date, "yyyy-MM-dd'T'HH:mm:ss");
      };

      // *** 시간 기준으로 자동 shiftType 결정 (handleDateSelect와 동일 로직) ***
      const startHour = startDate.getHours();
      let autoShiftType: "open" | "middle" | "close" = "middle";
      if (startHour < 12) autoShiftType = "open";
      else if (startHour >= 17) autoShiftType = "close";

      const newEvent: CalendarEvent = {
        id: uuidv4(),
        title: employees.find((e) => e.id === employeeId)?.name || "새 근무",
        start: formatDateForCalendar(startDate),
        end: formatDateForCalendar(endDate),
        backgroundColor: getEmployeeColor(employeeId, employees),
        borderColor: getEmployeeColor(employeeId, employees),
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

  // 스낵바 닫기 핸들러 (중괄호 확인)
  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  // 근무 삭제 처리 함수 추가
  const handleDeleteShift = async (shiftId: string) => {
    try {
      // API로 근무 일정 삭제 구현
      await deleteShift(shiftId);

      // UI에서 삭제된 근무 제거
      setEvents((prev) => prev.filter((event) => event.id !== shiftId));
      setShifts((prev) => prev.filter((shift) => shift.id !== shiftId));

      // 대화상자 닫기
      setIsDialogOpen(false);

      // 성공 메시지 표시
      setSnackbarMessage("근무가 성공적으로 삭제되었습니다.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      console.log("Shift deleted:", shiftId);
    } catch (error) {
      console.error("근무 삭제 오류:", error);
      setSnackbarMessage("근무 삭제 중 오류가 발생했습니다.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

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
                      bgcolor: getEmployeeColor(employee.id, employees),
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
              color="primary"
              onClick={() => handleViewChange("timeGridWeek")}
              sx={{
                minWidth: "80px",
                fontWeight: viewType === "timeGridWeek" ? 600 : 400,
              }}
            >
              주간
            </Button>
            <Button
              size="small"
              variant={viewType === "dayGridMonth" ? "contained" : "outlined"}
              color="primary"
              onClick={() => handleViewChange("dayGridMonth")}
              sx={{
                minWidth: "80px",
                fontWeight: viewType === "dayGridMonth" ? 600 : 400,
              }}
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
            "& .fc-dayGridMonth-view .fc-daygrid-day-frame": {
              minHeight: "80px",
              padding: "3px",
            },
            "& .fc-dayGridMonth-view .fc-daygrid-day-top": {
              justifyContent: "center",
              padding: "4px 0",
            },
            "& .fc-dayGridMonth-view .fc-daygrid-day-number": {
              fontSize: "0.85rem",
              fontWeight: 500,
            },
            "& .fc-dayGridMonth-view .fc-daygrid-event-harness": {
              margin: "1px 0",
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
                datesSet={handleDatesSet}
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
                  const currentView =
                    calendarRef.current?.getApi()?.view?.type || viewType;
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
            onDelete={handleDeleteShift}
          />
        )}
      </Box>

      {/* 스낵바 컴포넌트 (Alert -> CustomAlert 사용) */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
      >
        <CustomAlert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </CustomAlert>
      </Snackbar>
    </Box>
  );
};

export default SchedulePage;
