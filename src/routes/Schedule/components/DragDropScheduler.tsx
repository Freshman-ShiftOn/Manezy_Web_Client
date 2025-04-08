import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  DragIndicator as DragIndicatorIcon,
} from "@mui/icons-material";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Shift, Employee } from "../../../lib/types";

// 드래그 앤 드롭 스케줄러 타입
interface ScheduleShift {
  id: string;
  day: string; // 요일 ID (monday, tuesday 등)
  timeSlot: string; // 시간대 ID
  startTime: string;
  endTime: string;
  color: string;
  employees: {
    id: string;
    name: string;
    role: string;
    avatarColor?: string;
  }[];
  maxEmployees?: number;
  requiredRoles?: {
    [role: string]: number;
  };
}

// 컴포넌트 props 타입
interface DragDropSchedulerProps {
  employees: Employee[];
  onSaveSchedule: (schedule: ScheduleShift[]) => void;
  initialSchedule: Shift[];
}

// 요일 배열
const DAYS_OF_WEEK = [
  { id: "monday", name: "월요일" },
  { id: "tuesday", name: "화요일" },
  { id: "wednesday", name: "수요일" },
  { id: "thursday", name: "목요일" },
  { id: "friday", name: "금요일" },
  { id: "saturday", name: "토요일" },
  { id: "sunday", name: "일요일" },
];

// 기본 교대시간
const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  {
    id: "open",
    name: "오픈",
    startTime: "09:00",
    endTime: "13:00",
    color: "#4CAF50",
    requiredStaff: 3,
  },
  {
    id: "middle",
    name: "미들",
    startTime: "12:00",
    endTime: "18:00",
    color: "#2196F3",
    requiredStaff: 2,
  },
  {
    id: "close",
    name: "마감",
    startTime: "17:00",
    endTime: "22:00",
    color: "#9C27B0",
    requiredStaff: 3,
  },
];

// 시간대 타입 정의
interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  requiredStaff?: number; // 필요한 직원 수 옵션 추가
}

// 스케줄 타입 정의
interface ScheduleEntry {
  employeeId: string;
  employeeName: string;
  timeSlotId: string;
  position?: string;
  day: string;
}

// 포지션별 스타일과 색상 설정
const POSITION_COLORS: Record<string, string> = {
  매니저: "#FF6F00",
  바리스타: "#1976D2",
  서빙: "#388E3C",
  캐셔: "#7B1FA2",
  주방: "#D32F2F",
  일반: "#546E7A",
};

// 유틸리티 함수 내부 정의
const getAvatarColor = (name: string) => {
  const colors = [
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#673AB7",
    "#3F51B5",
    "#2196F3",
    "#03A9F4",
    "#00BCD4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getDayNumberFromKey = (dayKey: string): number => {
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return dayMap[dayKey] ?? 1; // 기본값 월요일
};

const getDayKeyFromNumber = (dayNumber: number): string => {
  const dayMap: Record<number, string> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };
  return dayMap[dayNumber] ?? "monday"; // 기본값 월요일
};

// 타입 정의 수정 (ScheduleShiftEmployee를 사용하도록 통일)
interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  requiredStaff?: number;
}

interface ScheduleShiftEmployee {
  // Schedule.tsx와 일치하도록 수정 (avatarColor 필수 아님)
  id: string;
  name: string;
  role: string;
  avatarColor?: string;
}

interface ScheduleShift {
  id: string;
  day: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  color: string;
  employees: ScheduleShiftEmployee[];
  maxEmployees?: number;
  requiredRoles?: Record<string, number>;
}

// 컴포넌트 props 타입
interface DragDropSchedulerProps {
  employees: Employee[];
  onSaveSchedule: (schedule: ScheduleShift[]) => void;
  initialSchedule: Shift[];
}

// --- 컴포넌트 ---
const DragDropScheduler: React.FC<DragDropSchedulerProps> = ({
  employees,
  onSaveSchedule,
  initialSchedule,
}) => {
  const theme = useTheme();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [schedule, setSchedule] = useState<ScheduleShift[]>([]);
  const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState(false);

  // 직원 역할별 그룹화 (정의 복원)
  const employeesByRole = useMemo(
    () =>
      employees.reduce((acc, emp) => {
        const role = emp.role || "일반";
        if (!acc[role]) acc[role] = [];
        acc[role].push(emp);
        return acc;
      }, {} as Record<string, Employee[]>),
    [employees]
  );

  // 역할 정렬 (정의 복원)
  const sortedRoles = useMemo(() => {
    const ROLE_ORDER = ["매니저", "바리스타", "서빙", "캐셔", "주방", "일반"];
    return Object.keys(employeesByRole).sort((a, b) => {
      const indexA = ROLE_ORDER.indexOf(a);
      const indexB = ROLE_ORDER.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [employeesByRole]);

  // 빈 스케줄 생성 함수 (useCallback 유지)
  const createEmptySchedule = useCallback(
    (currentTimeslots: TimeSlot[]): ScheduleShift[] => {
      const newSchedule: ScheduleShift[] = [];
      DAYS_OF_WEEK.forEach((day) => {
        currentTimeslots.forEach((slot) => {
          const slotInfo = slot;
          const requiredPositions = { 매니저: 1, 바리스타: 1 }; // 기본값
          newSchedule.push({
            id: `${day.id}-${slot.id}`,
            day: day.id,
            timeSlot: slot.id,
            startTime: slotInfo.startTime,
            endTime: slotInfo.endTime,
            color: slotInfo.color,
            employees: [],
            maxEmployees: slotInfo.requiredStaff || 3, // 옵셔널이므로 기본값 처리 유지
            requiredRoles: requiredPositions, // 옵셔널이므로 할당
          });
        });
      });
      return newSchedule;
    },
    []
  );

  // 초기 스케줄 설정 및 변환 로직 수정
  useEffect(() => {
    const emptySchedule = createEmptySchedule(timeSlots);

    if (initialSchedule && initialSchedule.length > 0 && employees.length > 0) {
      const scheduleMap = new Map<string, ScheduleShift>();
      emptySchedule.forEach((shift) =>
        scheduleMap.set(shift.id, { ...shift, employees: [] })
      );

      initialSchedule.forEach((shiftData) => {
        const startDate = new Date(shiftData.start);
        const dayKey = getDayKeyFromNumber(startDate.getDay());

        let timeSlotId: string | undefined = undefined; // 타입 명시 및 초기화

        // 1. shiftType (open | middle | close) 확인
        if (
          shiftData.shiftType &&
          timeSlots.some((ts) => ts.id === shiftData.shiftType)
        ) {
          timeSlotId = shiftData.shiftType;
        }
        // 2. shiftType 없으면 시작 시간으로 시간대 ID 추정
        else {
          const startTimeStr = startDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const matchedSlot = timeSlots.find(
            (ts) => ts.startTime === startTimeStr
          );
          if (matchedSlot) {
            timeSlotId = matchedSlot.id;
          }
        }

        // 시간대 ID를 찾은 경우에만 처리
        if (timeSlotId) {
          const shiftId = `${dayKey}-${timeSlotId}`;

          if (scheduleMap.has(shiftId)) {
            const existingShift = scheduleMap.get(shiftId)!;
            const shiftEmployees: ScheduleShiftEmployee[] = [];

            shiftData.employeeIds.forEach((empId) => {
              const employee = employees.find((e) => e.id === empId);
              if (employee) {
                shiftEmployees.push({
                  id: employee.id,
                  name: employee.name,
                  role: employee.role || "일반",
                  avatarColor: getAvatarColor(employee.name),
                });
              }
            });

            const currentEmployeeIds = new Set(
              existingShift.employees.map((e) => e.id)
            );
            shiftEmployees.forEach((newEmp) => {
              if (!currentEmployeeIds.has(newEmp.id)) {
                existingShift.employees.push(newEmp);
              }
            });

            existingShift.maxEmployees =
              shiftData.requiredStaff || existingShift.maxEmployees;
            scheduleMap.set(shiftId, existingShift);
          } else {
            console.warn(
              `Shift with id ${shiftId} not found in base schedule map`
            );
          }
        } else {
          console.warn(
            `Could not determine valid timeSlotId for shift: ${shiftData.id}, start: ${shiftData.start}`
          );
        }
      });
      setSchedule(Array.from(scheduleMap.values()));
    } else {
      setSchedule(emptySchedule);
    }
  }, [initialSchedule, employees, timeSlots, createEmptySchedule]);

  // 드래그 종료 핸들러
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // 직원 목록 -> 스케줄
    if (
      source.droppableId === "employees-list" &&
      destination.droppableId !== "employees-list"
    ) {
      const employeeId = draggableId.replace("employee-", "");
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee) return;

      const targetShiftId = destination.droppableId;
      setSchedule((prevSchedule) => {
        const newSchedule = [...prevSchedule];
        const targetShiftIndex = newSchedule.findIndex(
          (s) => s.id === targetShiftId
        );
        if (targetShiftIndex === -1) return prevSchedule;

        const targetShift = newSchedule[targetShiftIndex];

        if (targetShift.employees.some((emp) => emp.id === employeeId)) {
          alert("이미 배정된 직원입니다.");
          return prevSchedule;
        }
        if (
          targetShift.maxEmployees &&
          targetShift.employees.length >= targetShift.maxEmployees
        ) {
          alert(`최대 ${targetShift.maxEmployees}명까지 배정 가능합니다.`);
          return prevSchedule;
        }

        newSchedule[targetShiftIndex] = {
          ...targetShift,
          employees: [
            ...targetShift.employees,
            {
              id: employee.id,
              name: employee.name,
              role: employee.role || "일반",
              avatarColor: getAvatarColor(employee.name),
            },
          ],
        };
        return newSchedule;
      });
    }
    // 스케줄 -> 스케줄 (다른 시간대)
    else if (
      source.droppableId !== "employees-list" &&
      destination.droppableId !== "employees-list" &&
      source.droppableId !== destination.droppableId
    ) {
      const employeeId = draggableId.split("-").pop();
      if (!employeeId) return;

      const sourceShiftId = source.droppableId;
      const destShiftId = destination.droppableId;
      let employeeToMove: ScheduleShiftEmployee | null = null;

      setSchedule((prevSchedule) => {
        // 1. 소스에서 직원 찾아서 제거 (새 배열 생성)
        let found = false;
        const scheduleAfterRemoval = prevSchedule.map((shift) => {
          if (shift.id === sourceShiftId) {
            const empIndex = shift.employees.findIndex(
              (emp) => emp.id === employeeId
            );
            if (empIndex !== -1) {
              employeeToMove = shift.employees[empIndex];
              found = true;
              return {
                ...shift,
                employees: shift.employees.filter(
                  (emp) => emp.id !== employeeId
                ),
              };
            }
          }
          return shift;
        });

        if (!found || !employeeToMove) return prevSchedule; // 이동할 직원 못 찾으면 원본 반환

        // 2. 목적지에 직원 추가 시도 (새 배열 생성)
        let addedSuccessfully = false;
        const scheduleAfterAddition = scheduleAfterRemoval.map((shift) => {
          if (shift.id === destShiftId) {
            if (
              shift.maxEmployees &&
              shift.employees.length >= shift.maxEmployees
            ) {
              alert(`최대 ${shift.maxEmployees}명까지 배정 가능합니다.`);
              return shift; // 추가 실패 시 변경 없음 (제거된 상태 유지됨 - 개선 필요)
            }
            addedSuccessfully = true;
            return {
              ...shift,
              employees: [...shift.employees, employeeToMove!], // employeeToMove는 null 아님
            };
          }
          return shift;
        });

        // 추가에 성공한 경우만 상태 업데이트
        return addedSuccessfully ? scheduleAfterAddition : scheduleAfterRemoval;
      });
    }
    // 스케줄 -> 스케줄 (같은 시간대, 순서 변경)
    else if (
      source.droppableId === destination.droppableId &&
      source.droppableId !== "employees-list"
    ) {
      // ... (기존 순서 변경 로직 유지 - map 사용)
      const shiftId = source.droppableId;
      setSchedule((prevSchedule) => {
        const targetShiftIndex = prevSchedule.findIndex(
          (s) => s.id === shiftId
        );
        if (targetShiftIndex === -1) return prevSchedule;

        const targetShift = prevSchedule[targetShiftIndex];
        const newEmployees = Array.from(targetShift.employees);
        const [movedEmployee] = newEmployees.splice(source.index, 1);
        newEmployees.splice(destination.index, 0, movedEmployee);

        const newSchedule = [...prevSchedule];
        newSchedule[targetShiftIndex] = {
          ...targetShift,
          employees: newEmployees,
        };
        return newSchedule;
      });
    }
  };

  // 특정 시간대의 직원 목록 가져오기 (정의 복원)
  const getShiftEmployees = useCallback(
    (dayId: string, timeSlotId: string): ScheduleShiftEmployee[] => {
      const shift = schedule.find(
        (s) => s.day === dayId && s.timeSlot === timeSlotId
      );
      return shift ? shift.employees : [];
    },
    [schedule]
  );

  // 직원 제거 핸들러 (정의 복원)
  const handleRemoveEmployee = (shiftId: string, employeeId: string) => {
    setSchedule((prevSchedule) =>
      prevSchedule.map((shift) => {
        if (shift.id === shiftId) {
          return {
            ...shift,
            employees: shift.employees.filter((emp) => emp.id !== employeeId),
          };
        }
        return shift;
      })
    );
  };

  // 스케줄 저장 함수
  const handleSaveSchedule = () => {
    onSaveSchedule(schedule);
    alert("스케줄이 저장되었습니다.");
  };

  // 초기화 함수
  const handleResetSchedule = () => {
    if (
      window.confirm(
        "현재 스케줄을 초기화하시겠습니까? 저장되지 않은 변경사항은 사라집니다."
      )
    ) {
      setSchedule(createEmptySchedule(timeSlots));
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "calc(100vh - 160px)",
      }}
    >
      {/* 컨트롤 버튼 영역 */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleResetSchedule}
          >
            초기화
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveSchedule}
          >
            저장
          </Button>
        </Box>
      </Box>

      {/* 주간 스케줄 영역 (DragDropContext 내부에 children 복원) */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            flexGrow: 1,
            gap: 2,
          }}
        >
          {/* 왼쪽: 직원 목록 */}
          <Paper
            elevation={1}
            sx={{
              width: 260,
              flexShrink: 0,
              p: 2,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Typography variant="h6" gutterBottom>
              직원 목록 ({employees.length}명)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
              직원을 시간표로 드래그하세요
            </Typography>
            <Box sx={{ flexGrow: 1, overflow: "auto", pb: 2 }}>
              <Droppable droppableId="employees-list">
                {(provided) => (
                  <Box {...provided.droppableProps} ref={provided.innerRef}>
                    {sortedRoles.map((role, roleIndex) => (
                      <Box key={role} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            bgcolor: "grey.100",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            mb: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderLeft: `4px solid ${
                              POSITION_COLORS[role] || POSITION_COLORS.일반
                            }`,
                          }}
                        >
                          <Typography variant="subtitle2">{role}</Typography>
                          <Typography variant="caption">
                            {employeesByRole[role].length}명
                          </Typography>
                        </Box>
                        {employeesByRole[role].map((employee, index) => (
                          <Draggable
                            key={employee.id}
                            draggableId={`employee-${employee.id}`}
                            index={roleIndex * 1000 + index}
                          >
                            {(provided, snapshot) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                  p: 1,
                                  borderRadius: 1,
                                  boxShadow: snapshot.isDragging ? 3 : 1,
                                  bgcolor: snapshot.isDragging
                                    ? alpha(theme.palette.primary.light, 0.2)
                                    : "white",
                                  "&:hover": {
                                    bgcolor: alpha(
                                      theme.palette.grey[100],
                                      0.7
                                    ),
                                  },
                                  borderLeft: `3px solid ${
                                    POSITION_COLORS[employee.role || "일반"] ||
                                    POSITION_COLORS.일반
                                  }`,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    mr: 1,
                                    bgcolor: getAvatarColor(employee.name),
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {employee.name.charAt(0)}
                                </Avatar>
                                <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 500,
                                      whiteSpace: "nowrap",
                                      textOverflow: "ellipsis",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {employee.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {employee.role || "일반"}
                                  </Typography>
                                </Box>
                                <DragIndicatorIcon
                                  fontSize="small"
                                  sx={{
                                    color: "action.disabled",
                                    opacity: 0.5,
                                    cursor: "grab",
                                  }}
                                />
                              </Box>
                            )}
                          </Draggable>
                        ))}
                      </Box>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Box>
          </Paper>

          {/* 오른쪽: 스케줄 표 */}
          <Box sx={{ flexGrow: 1, overflowX: "auto", overflowY: "auto" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(200px, 1fr))",
                gap: 2,
                minWidth: "1400px",
              }}
            >
              {DAYS_OF_WEEK.map((day) => (
                <Box key={day.id}>
                  <Paper
                    sx={{
                      p: 2,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography
                      variant="h6"
                      align="center"
                      sx={{
                        mb: 2,
                        color:
                          day.id === "saturday" || day.id === "sunday"
                            ? "error.main"
                            : "text.primary",
                      }}
                    >
                      {day.name}
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {timeSlots.map((timeSlot) => {
                        const shiftId = `${day.id}-${timeSlot.id}`;
                        const currentShift = schedule.find(
                          (s) => s.id === shiftId
                        );
                        const shiftEmployees = getShiftEmployees(
                          day.id,
                          timeSlot.id
                        );
                        const maxEmployees = currentShift?.maxEmployees || 3;
                        return (
                          <Box key={shiftId}>
                            <Box
                              sx={{
                                p: 1,
                                bgcolor: alpha(timeSlot.color, 0.1),
                                borderBottom: `1px solid ${alpha(
                                  timeSlot.color,
                                  0.3
                                )}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderLeft: `4px solid ${timeSlot.color}`,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: "bold",
                                  color: timeSlot.color,
                                }}
                              >
                                {timeSlot.name}
                              </Typography>
                              <Typography variant="caption">
                                {timeSlot.startTime}-{timeSlot.endTime} (
                                {shiftEmployees.length}/{maxEmployees})
                              </Typography>
                            </Box>
                            <Droppable droppableId={shiftId}>
                              {(provided, snapshot) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  sx={{
                                    minHeight: "100px",
                                    p: 1,
                                    bgcolor: snapshot.isDraggingOver
                                      ? alpha(timeSlot.color, 0.2)
                                      : alpha(
                                          theme.palette.background.default,
                                          0.5
                                        ),
                                    border: "1px solid",
                                    borderColor: alpha(timeSlot.color, 0.3),
                                    borderRadius: "0 0 4px 4px",
                                    transition: "background-color 0.2s ease",
                                  }}
                                >
                                  {shiftEmployees.length === 0 ? (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: "text.secondary",
                                        textAlign: "center",
                                        py: 2,
                                        fontStyle: "italic",
                                      }}
                                    >
                                      직원을 여기로 드래그하세요
                                    </Typography>
                                  ) : (
                                    shiftEmployees.map((employee, index) => (
                                      <Draggable
                                        key={`${shiftId}-${employee.id}`}
                                        draggableId={`shift-${shiftId}-${employee.id}`}
                                        index={index}
                                      >
                                        {(provided, snapshot) => (
                                          <Box
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              p: 1,
                                              mb: 1,
                                              borderRadius: 1,
                                              boxShadow: snapshot.isDragging
                                                ? 3
                                                : 1,
                                              bgcolor: "white",
                                              "&:hover": { boxShadow: 2 },
                                              borderLeft: `3px solid ${
                                                POSITION_COLORS[
                                                  employee.role
                                                ] || POSITION_COLORS.일반
                                              }`,
                                            }}
                                          >
                                            <Avatar
                                              sx={{
                                                width: 24,
                                                height: 24,
                                                mr: 1,
                                                bgcolor: employee.avatarColor,
                                                fontSize: "0.75rem",
                                              }}
                                            >
                                              {employee.name.charAt(0)}
                                            </Avatar>
                                            <Box
                                              sx={{
                                                flexGrow: 1,
                                                overflow: "hidden",
                                              }}
                                            >
                                              <Typography
                                                variant="body2"
                                                sx={{
                                                  fontWeight: 500,
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                }}
                                              >
                                                {employee.name}
                                              </Typography>
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                }}
                                              >
                                                {employee.role}
                                              </Typography>
                                            </Box>
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                handleRemoveEmployee(
                                                  shiftId,
                                                  employee.id
                                                )
                                              }
                                              sx={{ p: 0.5 }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        )}
                                      </Draggable>
                                    ))
                                  )}
                                  {provided.placeholder}
                                </Box>
                              )}
                            </Droppable>
                          </Box>
                        );
                      })}
                    </Box>
                  </Paper>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DragDropContext>
    </Box>
  );
};

export default DragDropScheduler;
