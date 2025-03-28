import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  DragIndicator as DragIndicatorIcon,
} from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Employee } from "../../../lib/types";

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
  initialSchedule?: ScheduleShift[];
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
const DEFAULT_TIME_SLOTS = [
  {
    id: "morning",
    name: "오픈",
    startTime: "09:00",
    endTime: "15:00",
    color: "#4CAF50",
  },
  {
    id: "afternoon",
    name: "미들",
    startTime: "15:00",
    endTime: "17:00",
    color: "#2196F3",
  },
  {
    id: "evening",
    name: "마감",
    startTime: "17:00",
    endTime: "22:00",
    color: "#9C27B0",
  },
];

// 아바타 색상 생성
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

// 시간대 타입 정의
interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
}

// 스케줄 타입 정의
interface ScheduleEntry {
  employeeId: string;
  employeeName: string;
  timeSlotId: string;
  position?: string;
  day: string;
}

// 교대 시간 관리 다이얼로그
const TimeSlotManagerDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  timeSlots: TimeSlot[];
  onSave: (timeSlots: TimeSlot[]) => void;
}> = ({ open, onClose, timeSlots, onSave }) => {
  const [localTimeSlots, setLocalTimeSlots] = useState([...timeSlots]);
  const [newSlot, setNewSlot] = useState({
    id: "",
    name: "",
    startTime: "09:00",
    endTime: "17:00",
    color: "#2196F3",
  });
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  // 다이얼로그가 열릴 때마다 상태 초기화
  useEffect(() => {
    if (open) {
      setLocalTimeSlots([...timeSlots]);
      setNewSlot({
        id: "",
        name: "",
        startTime: "09:00",
        endTime: "17:00",
        color: "#2196F3",
      });
      setEditingSlot(null);
    }
  }, [open, timeSlots]);

  const handleAddTimeSlot = () => {
    if (!newSlot.id || !newSlot.name) {
      alert("ID와 이름을 입력해주세요");
      return;
    }

    if (localTimeSlots.some((slot) => slot.id === newSlot.id)) {
      alert("이미 존재하는 ID입니다");
      return;
    }

    setLocalTimeSlots([...localTimeSlots, { ...newSlot }]);
    setNewSlot({
      id: "",
      name: "",
      startTime: "09:00",
      endTime: "17:00",
      color: "#2196F3",
    });
  };

  const handleEditTimeSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setNewSlot({ ...slot });
  };

  const handleUpdateTimeSlot = () => {
    if (!editingSlot) return;

    const updatedSlots = localTimeSlots.map((slot) =>
      slot.id === editingSlot.id ? { ...newSlot } : slot
    );

    setLocalTimeSlots(updatedSlots);
    setEditingSlot(null);
    setNewSlot({
      id: "",
      name: "",
      startTime: "09:00",
      endTime: "17:00",
      color: "#2196F3",
    });
  };

  const handleSave = () => {
    onSave(localTimeSlots);
    onClose();
  };

  const handleRemoveTimeSlot = (slotId: string) => {
    if (
      window.confirm(
        "이 시간대를 삭제하시겠습니까? 이미 배정된 직원들이 모두 제거됩니다."
      )
    ) {
      setLocalTimeSlots(localTimeSlots.filter((slot) => slot.id !== slotId));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">시간대 관리</Typography>
          <Tooltip title="교대 시간대를 추가하거나 수정할 수 있습니다">
            <IconButton size="small">
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          교대 시간대를 추가하거나 삭제할 수 있습니다. 이미 사용 중인 시간대를
          삭제하면 해당 시간대에 배정된 직원들도 모두 제거됩니다.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="ID"
              fullWidth
              size="small"
              value={newSlot.id}
              onChange={(e) => setNewSlot({ ...newSlot, id: e.target.value })}
              placeholder="morning, afternoon 등"
              disabled={!!editingSlot}
              helperText={editingSlot ? "ID는 수정할 수 없습니다" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              label="이름"
              fullWidth
              size="small"
              value={newSlot.name}
              onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
              placeholder="오픈, 미들, 마감 등"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="시작 시간"
              fullWidth
              size="small"
              value={newSlot.startTime}
              onChange={(e) =>
                setNewSlot({ ...newSlot, startTime: e.target.value })
              }
              placeholder="HH:MM"
              type="time"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="종료 시간"
              fullWidth
              size="small"
              value={newSlot.endTime}
              onChange={(e) =>
                setNewSlot({ ...newSlot, endTime: e.target.value })
              }
              placeholder="HH:MM"
              type="time"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="색상"
              fullWidth
              size="small"
              value={newSlot.color}
              onChange={(e) =>
                setNewSlot({ ...newSlot, color: e.target.value })
              }
              placeholder="#RRGGBB"
              InputProps={{
                startAdornment: (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: newSlot.color,
                      borderRadius: 1,
                      mr: 1,
                    }}
                  />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            {editingSlot ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleUpdateTimeSlot}
                fullWidth
                color="primary"
              >
                시간대 수정
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddTimeSlot}
                fullWidth
                color="primary"
              >
                시간대 추가
              </Button>
            )}
          </Grid>
        </Grid>

        <Typography variant="subtitle1" gutterBottom>
          현재 시간대 목록
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>시간</TableCell>
                <TableCell>색상</TableCell>
                <TableCell align="right">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localTimeSlots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell>{slot.id}</TableCell>
                  <TableCell>{slot.name}</TableCell>
                  <TableCell>
                    {slot.startTime} - {slot.endTime}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: slot.color,
                        borderRadius: 1,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditTimeSlot(slot)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveTimeSlot(slot.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" color="primary" onClick={handleSave}>
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DragDropScheduler: React.FC<DragDropSchedulerProps> = ({
  employees,
  onSaveSchedule,
  initialSchedule = [],
}) => {
  const [schedule, setSchedule] = useState<ScheduleShift[]>(
    initialSchedule.length > 0 ? initialSchedule : []
  );
  const [draggedEmployee, setDraggedEmployee] = useState<{
    employee: Employee;
    role: string;
    timeSlot: string;
  } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");

  // 시간대 관리 다이얼로그 상태
  const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(
    DEFAULT_TIME_SLOTS.map((slot) => ({
      id: slot.id,
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      color: slot.color,
    }))
  );

  // 템플릿 관리 상태
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<
    {
      id: string;
      name: string;
      schedule: ScheduleShift[];
    }[]
  >([
    {
      id: "default",
      name: "기본 템플릿",
      schedule: [],
    },
  ]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // 초기화
  useEffect(() => {
    if (initialSchedule && initialSchedule.length > 0) {
      setSchedule(initialSchedule);
    } else {
      createEmptySchedule();
    }

    // 로컬 스토리지에서 템플릿 불러오기
    const savedTemplates = localStorage.getItem("scheduleTemplates");
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error("템플릿 불러오기 실패", e);
      }
    }
  }, []);

  // 빈 스케줄 생성
  const createEmptySchedule = () => {
    const newSchedule: ScheduleShift[] = [];

    // 각 요일과 시간대에 대한 빈 교대 항목 생성
    DAYS_OF_WEEK.forEach((day) => {
      timeSlots.forEach((slot) => {
        newSchedule.push({
          id: `${day.id}-${slot.id}`,
          day: day.id,
          timeSlot: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          color: slot.color,
          employees: [],
          maxEmployees: 3,
          requiredRoles: {
            매니저: 1,
            바리스타: 1,
            서빙: 1,
          },
        });
      });
    });

    setSchedule(newSchedule);
  };

  // 드래그 종료 시 핸들러
  const handleDragEnd = (result: any) => {
    // 유효하지 않은 드래그 결과면 무시
    if (!result.destination) return;
    if (
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    const { source, destination, draggableId } = result;

    try {
      // 직원 목록에서 드래그한 경우
      if (
        source.droppableId === "employeeList" &&
        destination.droppableId !== "employeeList"
      ) {
        // 직원 찾기
        const employee = employees.find((emp) => emp.id === draggableId);
        if (!employee) return;

        // 대상 교대 찾기
        const targetShift = schedule.find(
          (shift) => shift.id === destination.droppableId
        );

        if (targetShift) {
          // 이미 배정된 직원인지 확인
          const exists = targetShift.employees.some(
            (emp) => emp.id === employee.id
          );

          if (exists) {
            alert("이미 해당 교대에 배정된 직원입니다.");
            return;
          }

          // 최대 직원 수 확인
          if (
            targetShift.maxEmployees &&
            targetShift.employees.length >= targetShift.maxEmployees
          ) {
            alert(
              `이 교대에는 최대 ${targetShift.maxEmployees}명까지 배정할 수 있습니다.`
            );
            return;
          }

          // 직원 추가
          const updatedSchedule = schedule.map((shift) => {
            if (shift.id === targetShift.id) {
              return {
                ...shift,
                employees: [
                  ...shift.employees,
                  {
                    id: employee.id,
                    name: employee.name,
                    role: employee.role || "일반",
                    avatarColor: getAvatarColor(employee.name),
                  },
                ],
              };
            }
            return shift;
          });

          setSchedule(updatedSchedule);
        }
        return;
      }

      // 교대 간 직원 이동 (시프트 내에서의 드래그)
      if (
        source.droppableId !== "employeeList" &&
        destination.droppableId !== "employeeList" &&
        source.droppableId !== destination.droppableId
      ) {
        const sourceShift = schedule.find(
          (shift) => shift.id === source.droppableId
        );
        const destShift = schedule.find(
          (shift) => shift.id === destination.droppableId
        );

        if (!sourceShift || !destShift) return;

        // 드래그한 직원 찾기
        const employeeToMove = sourceShift.employees.find(
          (emp) => emp.id === draggableId
        );
        if (!employeeToMove) return;

        // 최대 직원 수 확인
        if (
          destShift.maxEmployees &&
          destShift.employees.length >= destShift.maxEmployees
        ) {
          alert(
            `이 교대에는 최대 ${destShift.maxEmployees}명까지 배정할 수 있습니다.`
          );
          return;
        }

        // 직원 이동 (소스에서 제거, 대상에 추가)
        const updatedSchedule = schedule.map((shift) => {
          if (shift.id === sourceShift.id) {
            return {
              ...shift,
              employees: shift.employees.filter(
                (emp) => emp.id !== draggableId
              ),
            };
          }
          if (shift.id === destShift.id) {
            return {
              ...shift,
              employees: [...shift.employees, employeeToMove],
            };
          }
          return shift;
        });

        setSchedule(updatedSchedule);
        return;
      }

      // 같은 교대 내에서 직원 순서 변경
      if (
        source.droppableId === destination.droppableId &&
        source.droppableId !== "employeeList"
      ) {
        const shiftId = source.droppableId;
        const shift = schedule.find((s) => s.id === shiftId);

        if (!shift) return;

        // 직원 순서 재배열
        const newEmployees = [...shift.employees];
        const [movedEmployee] = newEmployees.splice(source.index, 1);
        newEmployees.splice(destination.index, 0, movedEmployee);

        // 스케줄 업데이트
        const updatedSchedule = schedule.map((s) => {
          if (s.id === shiftId) {
            return {
              ...s,
              employees: newEmployees,
            };
          }
          return s;
        });

        setSchedule(updatedSchedule);
        return;
      }

      // 직원 목록 내에서 순서 변경은 처리하지 않음 (필요 시 구현)
    } catch (error) {
      console.error("드래그 앤 드롭 처리 중 오류 발생:", error);
    }
  };

  // 직원 배정 추가
  const handleAddAssignment = () => {
    if (!selectedEmployee || !selectedTimeSlot || !selectedDay) {
      alert("직원, 시간대, 요일을 모두 선택해주세요.");
      return;
    }

    // 선택된 직원 정보 찾기
    const employee = employees.find((emp) => emp.id === selectedEmployee);
    if (!employee) return;

    // 이미 해당 요일, 시간대에 동일한 직원이 배정되어 있는지 확인
    const exists = schedule.some(
      (shift) =>
        shift.day === selectedDay &&
        shift.timeSlot === selectedTimeSlot &&
        shift.employees.some((emp) => emp.id === selectedEmployee)
    );

    if (exists) {
      alert("이미 해당 요일과 시간대에 배정된 직원입니다.");
      return;
    }

    // 해당 요일과 시간대의 교대 찾기
    const targetShift = schedule.find(
      (shift) =>
        shift.day === selectedDay && shift.timeSlot === selectedTimeSlot
    );

    if (!targetShift) {
      alert("해당 시간대가 존재하지 않습니다.");
      return;
    }

    // 최대 직원 수 확인
    if (
      targetShift.maxEmployees &&
      targetShift.employees.length >= targetShift.maxEmployees
    ) {
      alert(
        `이 교대에는 최대 ${targetShift.maxEmployees}명까지 배정할 수 있습니다.`
      );
      return;
    }

    // 필수 포지션 확인
    if (targetShift.requiredRoles) {
      const currentRoles = targetShift.employees.reduce((acc, emp) => {
        acc[emp.role] = (acc[emp.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const requiredRole = selectedPosition || employee.role;
      if (targetShift.requiredRoles[requiredRole]) {
        const currentCount = currentRoles[requiredRole] || 0;
        if (currentCount >= targetShift.requiredRoles[requiredRole]) {
          alert(
            `이 교대에는 ${requiredRole} 포지션이 이미 충분히 배정되어 있습니다.`
          );
          return;
        }
      }
    }

    // 새로운 직원 배정 추가
    const updatedSchedule = schedule.map((shift) => {
      if (shift.id === targetShift.id) {
        return {
          ...shift,
          employees: [
            ...shift.employees,
            {
              id: employee.id,
              name: employee.name,
              role: selectedPosition || employee.role || "일반",
              avatarColor: getAvatarColor(employee.name),
            },
          ],
        };
      }
      return shift;
    });

    setSchedule(updatedSchedule);

    // 선택 초기화
    setSelectedEmployee("");
    setSelectedTimeSlot("");
    setSelectedDay("");
    setSelectedPosition("");
  };

  // 교대에서 직원 제거
  const handleRemoveEmployee = (shiftId: string, employeeId: string) => {
    const updatedSchedule = schedule.map((shift) => {
      if (shift.id === shiftId) {
        return {
          ...shift,
          employees: shift.employees.filter((emp) => emp.id !== employeeId),
        };
      }
      return shift;
    });

    setSchedule(updatedSchedule);
  };

  // 요일별 시간대 렌더링
  const renderDay = (dayIndex: number) => {
    const day = DAYS_OF_WEEK[dayIndex];
    const dayId = day.id;
    const dayName = day.name;

    // 해당 요일의 시간대 찾기
    const dayShifts = schedule.filter((shift) => shift.day === dayId);

    // 시간대 순서대로 정렬
    const sortedShifts = [...dayShifts].sort((a, b) => {
      const aSlot = timeSlots.findIndex((slot) => slot.id === a.timeSlot);
      const bSlot = timeSlots.findIndex((slot) => slot.id === b.timeSlot);
      return aSlot - bSlot;
    });

    return (
      <Paper elevation={1} sx={{ p: 2, height: "100%" }}>
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            color:
              dayIndex === 5 || dayIndex === 6 ? "error.main" : "text.primary",
            fontWeight: "bold",
          }}
        >
          {dayName}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {sortedShifts.map((shift) => {
          // 시간대 정보 찾기
          const timeSlotInfo = timeSlots.find(
            (slot) => slot.id === shift.timeSlot
          );
          const timeSlotName = timeSlotInfo
            ? timeSlotInfo.name
            : shift.timeSlot;
          const startTime = timeSlotInfo
            ? timeSlotInfo.startTime
            : shift.startTime;
          const endTime = timeSlotInfo ? timeSlotInfo.endTime : shift.endTime;
          const color = timeSlotInfo ? timeSlotInfo.color : shift.color;

          return (
            <Box key={shift.id} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                  bgcolor: `${color}20`,
                  p: 1,
                  borderRadius: 1,
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                  {timeSlotName}
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ ml: 1, color: "text.secondary" }}
                  >
                    ({startTime} - {endTime})
                  </Typography>
                </Typography>
                <Box>
                  <Chip
                    size="small"
                    label={`${shift.employees.length}/${
                      shift.maxEmployees || "∞"
                    }`}
                    color={
                      shift.maxEmployees &&
                      shift.employees.length >= shift.maxEmployees
                        ? "success"
                        : "default"
                    }
                    sx={{ ml: 1 }}
                  />
                </Box>
              </Box>

              <Droppable droppableId={shift.id}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      minHeight: 50,
                      bgcolor: snapshot.isDraggingOver
                        ? "action.hover"
                        : "background.paper",
                      border: "1px dashed",
                      borderColor: snapshot.isDraggingOver
                        ? "primary.main"
                        : "divider",
                      borderRadius: 1,
                      p: 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {shift.employees.length === 0 ? (
                      <Typography
                        color="text.secondary"
                        align="center"
                        sx={{ py: 1 }}
                      >
                        직원을 여기로 드래그하세요
                      </Typography>
                    ) : (
                      shift.employees.map((employee, index) => (
                        <Draggable
                          key={employee.id}
                          draggableId={employee.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              elevation={snapshot.isDragging ? 3 : 1}
                              sx={{
                                p: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                bgcolor: snapshot.isDragging
                                  ? "action.hover"
                                  : "background.paper",
                                cursor: "grab",
                                "&:hover": {
                                  bgcolor: "action.hover",
                                },
                                transition: "all 0.2s ease-in-out",
                                mb: 1,
                                "&:last-child": { mb: 0 },
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: getAvatarColor(employee.name),
                                  width: 32,
                                  height: 32,
                                  border: "2px solid",
                                  borderColor: "background.paper",
                                }}
                              >
                                {employee.name.charAt(0)}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
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
                                    display: "block",
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
                                color="error"
                                onClick={() =>
                                  handleRemoveEmployee(shift.id, employee.id)
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Paper>
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
      </Paper>
    );
  };

  // 직원 목록 렌더링
  const renderEmployeeList = () => {
    const roleGroups: Record<string, Employee[]> = {};

    // 역할별로 직원 그룹화
    employees.forEach((employee) => {
      const role = employee.role || "미정";
      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      roleGroups[role].push(employee);
    });

    return (
      <Paper elevation={1} sx={{ p: 2, height: "100%" }}>
        <Droppable droppableId="employeeList">
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps}>
              {Object.entries(roleGroups).map(([role, groupEmployees]) => (
                <Box key={role} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      mb: 1,
                      bgcolor: "action.hover",
                      p: 0.5,
                      pl: 1,
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="subtitle2">
                      {role} ({groupEmployees.length}명)
                    </Typography>
                    <Chip
                      size="small"
                      label={`${groupEmployees.length}명`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  {groupEmployees.map((employee, index) => (
                    <Draggable
                      key={employee.id}
                      draggableId={employee.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          elevation={snapshot.isDragging ? 3 : 1}
                          sx={{
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            bgcolor: snapshot.isDragging
                              ? "action.hover"
                              : "background.paper",
                            cursor: "grab",
                            "&:hover": {
                              bgcolor: "action.hover",
                            },
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(employee.name),
                              width: 32,
                              height: 32,
                              border: "2px solid",
                              borderColor: "background.paper",
                            }}
                          >
                            {employee.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
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
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {employee.role}
                            </Typography>
                          </Box>
                          <Tooltip title="드래그하여 교대에 배정">
                            <DragIndicatorIcon
                              fontSize="small"
                              color="action"
                              sx={{
                                opacity: 0.5,
                                transition: "opacity 0.2s ease-in-out",
                              }}
                            />
                          </Tooltip>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                </Box>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Paper>
    );
  };

  // 시간대 관리
  const handleOpenTimeSlotDialog = () => {
    setTimeSlotDialogOpen(true);
  };

  const handleCloseTimeSlotDialog = () => {
    setTimeSlotDialogOpen(false);
  };

  const handleSaveTimeSlots = (newTimeSlots: TimeSlot[]) => {
    setTimeSlots(newTimeSlots);

    // 기존 시간대 매핑을 업데이트
    const updatedSchedule = [...schedule];

    // 삭제된 시간대에 배정된 직원들을 제거하는 로직
    const timeSlotIds = newTimeSlots.map((slot) => slot.id);

    const filteredSchedule = updatedSchedule.filter((shift) =>
      timeSlotIds.includes(shift.timeSlot)
    );

    // 시간대 정보(시작 시간, 종료 시간, 색상) 업데이트
    filteredSchedule.forEach((shift) => {
      const matchingTimeSlot = newTimeSlots.find(
        (slot) => slot.id === shift.timeSlot
      );
      if (matchingTimeSlot) {
        shift.startTime = matchingTimeSlot.startTime;
        shift.endTime = matchingTimeSlot.endTime;
        shift.color = matchingTimeSlot.color;
      }
    });

    setSchedule(filteredSchedule);
  };

  // 템플릿 대화상자 열기
  const handleOpenTemplateDialog = () => {
    setTemplateDialogOpen(true);
    setTemplateName("");
  };

  // 템플릿 대화상자 닫기
  const handleCloseTemplateDialog = () => {
    setTemplateDialogOpen(false);
  };

  // 현재 스케줄을 템플릿으로 저장
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    const newTemplateId = `template-${Date.now()}`;
    const newTemplates = [
      ...templates,
      {
        id: newTemplateId,
        name: templateName,
        schedule: [...schedule],
      },
    ];

    setTemplates(newTemplates);
    localStorage.setItem("scheduleTemplates", JSON.stringify(newTemplates));
    setTemplateDialogOpen(false);
    setTemplateName("");
  };

  // 템플릿 불러오기
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    if (
      window.confirm(
        "기존 스케줄이 모두 삭제되고 선택한 템플릿으로 대체됩니다. 계속하시겠습니까?"
      )
    ) {
      setSchedule([...template.schedule]);
      setSelectedTemplate("");
    }
  };

  // 템플릿 삭제
  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      const newTemplates = templates.filter((t) => t.id !== templateId);
      setTemplates(newTemplates);
      localStorage.setItem("scheduleTemplates", JSON.stringify(newTemplates));
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">주간 스케줄 작성</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={createEmptySchedule}
            sx={{ mr: 1 }}
          >
            초기화
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={handleOpenTimeSlotDialog}
            sx={{ mr: 1 }}
          >
            시간대 관리
          </Button>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleOpenTemplateDialog}
            sx={{ mr: 1 }}
          >
            템플릿 관리
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => onSaveSchedule(schedule)}
          >
            저장
          </Button>
        </Box>
      </Box>

      {/* 템플릿 불러오기 선택 UI */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControl fullWidth size="small" sx={{ flex: 1 }}>
            <InputLabel>템플릿 불러오기</InputLabel>
            <Select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              label="템플릿 불러오기"
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={() => handleLoadTemplate(selectedTemplate)}
            disabled={!selectedTemplate}
          >
            불러오기
          </Button>
        </Box>
      </Paper>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={3}>
          {/* 왼쪽: 직원 목록 */}
          <Grid item xs={12} md={3}>
            <Box sx={{ position: "sticky", top: 20 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  bgcolor: "background.paper",
                  p: 2,
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <Typography variant="h6">직원 목록</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    size="small"
                    label={`총 ${employees.length}명`}
                    color="primary"
                    variant="outlined"
                  />
                  <Tooltip title="직원을 교대로 드래그하여 배정할 수 있습니다">
                    <IconButton size="small">
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {renderEmployeeList()}
            </Box>
          </Grid>

          {/* 오른쪽: 스케줄 */}
          <Grid item xs={12} md={9}>
            <Typography variant="h6" gutterBottom>
              주간 스케줄
            </Typography>
            <Grid container spacing={2}>
              {DAYS_OF_WEEK.map((day, index) => (
                <Grid item xs={12} md={6} lg={4} key={day.id}>
                  {renderDay(index)}
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </DragDropContext>

      {/* 시간대 관리 다이얼로그 */}
      <TimeSlotManagerDialog
        open={timeSlotDialogOpen}
        onClose={handleCloseTimeSlotDialog}
        timeSlots={timeSlots}
        onSave={handleSaveTimeSlots}
      />

      {/* 템플릿 관리 다이얼로그 */}
      <Dialog
        open={templateDialogOpen}
        onClose={handleCloseTemplateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">템플릿 관리</Typography>
            <Tooltip title="자주 사용하는 스케줄 패턴을 템플릿으로 저장하고 불러올 수 있습니다">
              <IconButton size="small">
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            현재 스케줄을 템플릿으로 저장하거나 저장된 템플릿을 관리할 수
            있습니다.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              새 템플릿 저장
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="템플릿 이름"
                fullWidth
                size="small"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="예: 주말 스케줄, 성수기 스케줄 등"
              />
              <Button
                variant="contained"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
              >
                저장
              </Button>
            </Box>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            저장된 템플릿
          </Typography>
          {templates.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              저장된 템플릿이 없습니다.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>이름</TableCell>
                    <TableCell align="right">관리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => handleLoadTemplate(template.id)}
                          sx={{ mr: 1 }}
                        >
                          불러오기
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DragDropScheduler;
