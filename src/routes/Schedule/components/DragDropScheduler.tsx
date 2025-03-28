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
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

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
  initialSchedule?: any[]; // 다양한 초기 데이터 형식 허용
  templates?: any[]; // 템플릿 데이터
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
    id: "open",
    name: "오픈",
    startTime: "09:00",
    endTime: "15:00",
    color: "#4CAF50",
  },
  {
    id: "middle",
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
const POSITION_COLORS = {
  매니저: "#FF5252",
  바리스타: "#4CAF50",
  서빙: "#2196F3",
  캐셔: "#FF9800",
  주방: "#9C27B0",
  일반: "#757575",
};

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
  templates = [],
}) => {
  const theme = useTheme();

  // 요일 번호에서 요일 ID로 변환하는 함수
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
    return dayMap[dayNumber] || "monday";
  };

  // 요일 ID에서 요일 번호로 변환하는 함수
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
    return dayMap[dayKey] || 1;
  };

  // 시간대 초기화 (템플릿에서 가져옴)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    // 템플릿이 제공된 경우 템플릿에서 시간대 정보 추출
    if (templates && templates.length > 0) {
      return templates.map((template) => ({
        id: template.type,
        name: template.name,
        startTime: template.startTime,
        endTime: template.endTime,
        color: template.color,
      }));
    }
    // 기본 시간대 사용
    return DEFAULT_TIME_SLOTS;
  });

  // 스케줄 상태 초기화
  const [schedule, setSchedule] = useState<ScheduleShift[]>(() => {
    // 초기 스케줄 데이터가 제공된 경우 변환 필요
    if (initialSchedule && initialSchedule.length > 0) {
      // 요일-시간대별 그룹화를 위한 맵
      const groupedByDayAndShift = new Map();

      // 모든 요일과 시간대 조합에 대해 기본 교대 정보 생성
      DAYS_OF_WEEK.forEach((day) => {
        timeSlots.forEach((slot) => {
          const mapKey = `${day.id}-${slot.id}`;

          // 요일에 적용 가능한 템플릿 찾기 (함수 정의 전이므로 인라인으로 처리)
          const dayNum = getDayNumberFromKey(day.id);
          const applicableTemplate = templates.find(
            (t) =>
              t.type === slot.id &&
              (!t.applicableDays ||
                t.applicableDays.length === 0 ||
                t.applicableDays.includes(dayNum))
          );

          const timeSlotInfo = applicableTemplate ||
            timeSlots.find((ts) => ts.id === slot.id) || {
              startTime: "09:00",
              endTime: "17:00",
              color: "#2196F3",
            };

          // 템플릿에 requiredPositions이 있으면 사용, 없으면 기본값 사용
          const requiredPositions = timeSlotInfo.requiredPositions || {
            매니저: 1,
            바리스타: 1,
            서빙: 1,
          };

          // 기본 교대 정보 설정
          groupedByDayAndShift.set(mapKey, {
            id: mapKey,
            day: day.id,
            timeSlot: slot.id,
            startTime: timeSlotInfo.startTime,
            endTime: timeSlotInfo.endTime,
            color: timeSlotInfo.color,
            employees: [],
            maxEmployees: timeSlotInfo.requiredStaff || 3,
            requiredRoles: requiredPositions,
          });
        });
      });

      // 초기 데이터에서 직원 배정 정보 추출
      initialSchedule.forEach((item) => {
        const dayKey = getDayKeyFromNumber(item.day);
        const timeSlotKey = item.shiftType || "open";
        const mapKey = `${dayKey}-${timeSlotKey}`;

        // 직원이 할당된 경우만 직원 목록에 추가
        if (item.employeeId && groupedByDayAndShift.has(mapKey)) {
          const employee = employees.find((emp) => emp.id === item.employeeId);
          if (employee) {
            const shift = groupedByDayAndShift.get(mapKey);
            shift.employees.push({
              id: employee.id,
              name: employee.name,
              role: employee.role || "일반",
              avatarColor: getAvatarColor(employee.name),
            });
            groupedByDayAndShift.set(mapKey, shift);
          }
        }
      });

      return Array.from(groupedByDayAndShift.values());
    }

    // 초기 데이터가 없으면 빈 배열 반환
    return [];
  });

  const [draggedEmployee, setDraggedEmployee] = useState<{
    employee: Employee;
    role: string;
    timeSlot: string;
  } | null>(null);

  // 템플릿 관리 상태
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateName, setTemplateName] = useState("");

  // 로컬 템플릿 상태 (부모 컴포넌트에서 받아온 templates와 구분)
  const [localTemplates, setLocalTemplates] = useState<
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

  // 시간대 관리 다이얼로그 상태
  const [timeSlotDialogOpen, setTimeSlotDialogOpen] = useState(false);

  // 직원 역할별 그룹화
  const employeesByRole = employees.reduce((acc, emp) => {
    const role = emp.role || "일반";
    if (!acc[role]) acc[role] = [];
    acc[role].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  // 역할 순서 정의
  const ROLE_ORDER = ["매니저", "바리스타", "서빙", "캐셔", "주방", "일반"];

  // 역할 정렬
  const sortedRoles = Object.keys(employeesByRole).sort((a, b) => {
    const indexA = ROLE_ORDER.indexOf(a);
    const indexB = ROLE_ORDER.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // 템플릿이 변경될 때 시간대 정보 업데이트
  useEffect(() => {
    if (schedule.length > 0 && templates.length > 0) {
      updateTimeSlotInfo();
    }
  }, [templates]); // eslint-disable-line react-hooks/exhaustive-deps

  // 초기화
  useEffect(() => {
    if (initialSchedule && initialSchedule.length > 0) {
      // 초기화는 useState에서 처리
    } else {
      createEmptySchedule();
    }

    // 로컬 스토리지에서 템플릿 로드
    try {
      const savedTemplates = localStorage.getItem("scheduleTemplates");
      if (savedTemplates) {
        setLocalTemplates(JSON.parse(savedTemplates));
      }
    } catch (error) {
      console.error("템플릿 로드 오류:", error);
    }
  }, [initialSchedule]); // eslint-disable-line react-hooks/exhaustive-deps

  // 빈 스케줄 생성
  const createEmptySchedule = () => {
    const newSchedule: ScheduleShift[] = [];

    // 각 요일과 시간대에 대한 빈 교대 항목 생성
    DAYS_OF_WEEK.forEach((day) => {
      timeSlots.forEach((slot) => {
        // 요일별 적용 가능한 템플릿 찾기
        const applicableTemplate = findApplicableTemplate(day.id, slot.id);

        // 적용 가능한 템플릿이 있으면 그 정보 사용, 없으면 기본 시간대 정보 사용
        const slotInfo = applicableTemplate || slot;

        // 템플릿에 requiredPositions이 있으면 사용, 없으면 기본값 사용
        const requiredPositions = slotInfo.requiredPositions || {
          매니저: 1,
          바리스타: 1,
          서빙: 1,
        };

        newSchedule.push({
          id: `${day.id}-${slot.id}`,
          day: day.id,
          timeSlot: slot.id,
          startTime: slotInfo.startTime,
          endTime: slotInfo.endTime,
          color: slotInfo.color,
          employees: [], // 항상 빈 배열로 초기화
          maxEmployees: slotInfo.requiredStaff || 3,
          requiredRoles: requiredPositions,
        });
      });
    });

    setSchedule(newSchedule);
  };

  // 드래그 종료 시 핸들러
  const handleDragEnd = (result: any) => {
    console.log("Drag ended with result:", result);

    // 유효하지 않은 드래그 결과면 무시
    if (!result.destination) {
      console.log("No destination, ignoring drag");
      return;
    }
    if (
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    ) {
      console.log("Dropped at the same position, ignoring drag");
      return;
    }

    const { source, destination, draggableId } = result;
    console.log(
      `Dragging from ${source.droppableId} to ${destination.droppableId}`
    );
    console.log(`DraggableId: ${draggableId}`);

    try {
      // 직원 목록에서 드래그한 경우
      if (
        source.droppableId === "employees-list" &&
        destination.droppableId !== "employees-list"
      ) {
        console.log("Dragging employee from list to schedule");
        // 직원 찾기
        const employeeId = draggableId.replace("employee-", "");
        const employee = employees.find((emp) => emp.id === employeeId);
        if (!employee) {
          console.log(`Employee with id ${employeeId} not found`);
          return;
        }
        console.log(`Found employee: ${employee.name}`);

        // 대상 교대 찾기
        const targetShift = schedule.find(
          (shift) => shift.id === destination.droppableId
        );

        if (targetShift) {
          console.log(
            `Found target shift: ${targetShift.day}-${targetShift.timeSlot}`
          );
          // 이미 배정된 직원인지 확인
          const exists = targetShift.employees.some(
            (emp) => emp.id === employee.id
          );

          if (exists) {
            console.log("Employee already assigned to this shift");
            alert("이미 해당 교대에 배정된 직원입니다.");
            return;
          }

          // 최대 직원 수 확인
          if (
            targetShift.maxEmployees &&
            targetShift.employees.length >= targetShift.maxEmployees
          ) {
            console.log(
              `Shift already has maximum employees (${targetShift.maxEmployees})`
            );
            alert(
              `이 교대에는 최대 ${targetShift.maxEmployees}명까지 배정할 수 있습니다.`
            );
            return;
          }

          console.log(
            `Adding employee ${employee.name} to shift ${targetShift.id}`
          );
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
          console.log("Schedule updated successfully");
        } else {
          console.log(
            `Target shift with id ${destination.droppableId} not found`
          );
        }
        return;
      }

      // 교대 간 직원 이동 (시프트 내에서의 드래그)
      if (
        source.droppableId !== "employees-list" &&
        destination.droppableId !== "employees-list" &&
        source.droppableId !== destination.droppableId
      ) {
        const sourceShift = schedule.find(
          (shift) => shift.id === source.droppableId
        );
        const destShift = schedule.find(
          (shift) => shift.id === destination.droppableId
        );

        if (!sourceShift || !destShift) return;

        // 드래그한 직원 ID 추출
        const employeeId = draggableId.replace(
          `shift-${source.droppableId}-`,
          ""
        );

        // 드래그한 직원 찾기
        const employeeToMove = sourceShift.employees.find(
          (emp) => emp.id === employeeId
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
              employees: shift.employees.filter((emp) => emp.id !== employeeId),
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
        source.droppableId !== "employees-list"
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
    } catch (error) {
      console.error("드래그 앤 드롭 처리 중 오류 발생:", error);
    }
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

  // 특정 교대 시간대의 직원 목록 가져오기
  const getShiftEmployees = (dayId: string, timeSlotId: string) => {
    const shift = schedule.find(
      (s) => s.day === dayId && s.timeSlot === timeSlotId
    );
    return shift ? shift.employees : [];
  };

  // 스케줄 저장
  const handleSaveSchedule = () => {
    onSaveSchedule(schedule);
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

  // 템플릿 저장
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert("템플릿 이름을 입력하세요");
      return;
    }

    const newTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      schedule: [...schedule],
    };

    const newTemplates = [...localTemplates, newTemplate];
    setLocalTemplates(newTemplates);
    setTemplateDialogOpen(false);
    setTemplateName("");

    // 로컬 스토리지에 템플릿 저장
    try {
      localStorage.setItem("scheduleTemplates", JSON.stringify(newTemplates));
    } catch (error) {
      console.error("템플릿 저장 오류:", error);
    }
  };

  // 템플릿 불러오기
  const handleLoadTemplate = (templateId: string) => {
    const template = localTemplates.find((t) => t.id === templateId);
    if (template && template.schedule.length > 0) {
      if (
        window.confirm(
          "현재 스케줄을 템플릿으로 대체하시겠습니까? 저장되지 않은 변경사항은 손실됩니다."
        )
      ) {
        setSchedule([...template.schedule]);
      }
    } else {
      alert("템플릿에 저장된 스케줄이 없습니다.");
    }
  };

  // 템플릿 삭제
  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      const newTemplates = localTemplates.filter((t) => t.id !== templateId);
      setLocalTemplates(newTemplates);
      localStorage.setItem("scheduleTemplates", JSON.stringify(newTemplates));
    }
  };

  // 각 시간대의 정보를 업데이트하는 함수 추가
  const updateTimeSlotInfo = () => {
    console.log("Templates to apply:", templates); // 로그 추가
    const updatedSchedule = schedule.map((shift) => {
      const dayNum = getDayNumberFromKey(shift.day);
      console.log(
        `Checking for day ${shift.day}, number: ${dayNum}, timeSlot: ${shift.timeSlot}`
      ); // 로그 추가

      // 해당 요일의 해당 시간대에 맞는 템플릿 찾기
      const applicableTemplate = templates.find((template) => {
        const isCorrectType = template.type === shift.timeSlot;
        const isApplicableDay =
          !template.applicableDays ||
          template.applicableDays.length === 0 ||
          template.applicableDays.includes(dayNum);

        console.log(
          `Template ${template.name}, type: ${
            template.type
          }, days: ${JSON.stringify(
            template.applicableDays
          )}, isCorrectType: ${isCorrectType}, isApplicableDay: ${isApplicableDay}`
        ); // 로그 추가

        return isCorrectType && isApplicableDay;
      });

      if (applicableTemplate) {
        console.log(
          `Found template for ${shift.day}-${shift.timeSlot}: ${applicableTemplate.name}`
        ); // 로그 추가
        return {
          ...shift,
          startTime: applicableTemplate.startTime,
          endTime: applicableTemplate.endTime,
          color: applicableTemplate.color,
          maxEmployees: applicableTemplate.requiredStaff || shift.maxEmployees,
          requiredRoles:
            applicableTemplate.requiredPositions || shift.requiredRoles,
        };
      }

      console.log(`No template found for ${shift.day}-${shift.timeSlot}`); // 로그 추가
      return shift;
    });

    setSchedule(updatedSchedule);
  };

  // 특정 요일의 시간대에 가장 적합한 템플릿을 찾는 함수
  const findApplicableTemplate = (dayId: string, timeSlotId: string) => {
    const dayNum = getDayNumberFromKey(dayId);
    const foundTemplate = templates.find((template) => {
      const isCorrectType = template.type === timeSlotId;
      const isApplicableDay =
        !template.applicableDays ||
        template.applicableDays.length === 0 ||
        template.applicableDays.includes(dayNum);
      return isCorrectType && isApplicableDay;
    });
    return foundTemplate;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "calc(100vh - 200px)",
      }}
    >
      {/* 컨트롤 버튼 영역 */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleOpenTemplateDialog}
          >
            템플릿 불러오기
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={handleOpenTimeSlotDialog}
          >
            시간대 관리
          </Button>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={createEmptySchedule}
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

      {/* 주간 스케줄 영역 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              overflow: "auto",
              flexGrow: 1,
              gap: 2,
            }}
          >
            {/* 왼쪽: 직원 목록 - 화면 왼쪽에 고정된 패널 */}
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
                직원 목록
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  총 {employees.length}명
                </Typography>
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                직원을 시간표로 드래그하세요
              </Typography>

              <Box
                sx={{
                  flexGrow: 1,
                  overflow: "auto",
                  pb: 2,
                }}
              >
                <Droppable droppableId="employees-list">
                  {(provided, snapshot) => (
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
                                POSITION_COLORS[
                                  role as keyof typeof POSITION_COLORS
                                ] || POSITION_COLORS.일반
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
                              index={roleIndex * 100 + index}
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
                                    boxShadow: 1,
                                    bgcolor: snapshot.isDragging
                                      ? alpha(theme.palette.primary.main, 0.1)
                                      : "white",
                                    "&:hover": {
                                      bgcolor: alpha(
                                        theme.palette.primary.main,
                                        0.05
                                      ),
                                    },
                                    borderLeft: `3px solid ${
                                      POSITION_COLORS[
                                        role as keyof typeof POSITION_COLORS
                                      ] || POSITION_COLORS.일반
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
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 500 }}
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

            {/* 오른쪽: 스케줄 영역 */}
            <Box
              sx={{
                flexGrow: 1,
                overflowX: "auto",
                overflowY: "auto",
                // 스크롤바 스타일링
                "&::-webkit-scrollbar": {
                  height: "8px",
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  bgcolor: "action.hover",
                },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "grey.400",
                  borderRadius: "4px",
                },
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(200px, 1fr))",
                  gap: 2,
                  minWidth: "1400px",
                }}
              >
                {/* 요일별 칼럼 */}
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

                      {/* 시간대 목록 */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {timeSlots.map((timeSlot) => {
                          const shiftId = `${day.id}-${timeSlot.id}`;
                          const shiftEmployees = getShiftEmployees(
                            day.id,
                            timeSlot.id
                          );
                          const maxEmployees = timeSlot.requiredStaff || 3; // 동적 최대 직원 수 설정

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
                                        ? alpha(timeSlot.color, 0.1)
                                        : alpha(
                                            theme.palette.background.default,
                                            0.5
                                          ),
                                      border: "1px solid",
                                      borderColor: alpha(timeSlot.color, 0.3),
                                      borderRadius: "0 0 4px 4px",
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
                                                "&:hover": {
                                                  boxShadow: 2,
                                                },
                                                borderLeft: `3px solid ${
                                                  POSITION_COLORS[
                                                    employee.role as keyof typeof POSITION_COLORS
                                                  ] || POSITION_COLORS.일반
                                                }`,
                                              }}
                                            >
                                              <Avatar
                                                sx={{
                                                  width: 24,
                                                  height: 24,
                                                  mr: 1,
                                                  bgcolor: getAvatarColor(
                                                    employee.name
                                                  ),
                                                  fontSize: "0.75rem",
                                                }}
                                              >
                                                {employee.name.charAt(0)}
                                              </Avatar>
                                              <Box sx={{ flexGrow: 1 }}>
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    fontWeight: 500,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  {employee.name}
                                                </Typography>
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                  sx={{
                                                    display: "block",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  {employee.role || "일반"}
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
        </Box>
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
          {localTemplates.length === 0 ? (
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
                  {localTemplates.map((template) => (
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
