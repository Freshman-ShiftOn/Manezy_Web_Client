import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Save as SaveIcon,
  // RefreshIcon 등 필요시 추가
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
} from "@mui/icons-material";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { Employee } from "../../../lib/types"; // 경로 확인 필요
import { produce } from "immer";

// --- 타입 정의 (TimeSlot 정의 복원) ---
interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  requiredStaff?: number;
}

// ScheduleShiftEmployee 타입 정의 수정 (필수 속성 포함)
interface ScheduleShiftEmployee {
  id: string;
  name: string;
  role: string;
  avatarColor?: string;
}

interface WeeklyPlanShift {
  id: string; // 요일-시간대 ID (e.g., monday-open)
  dayOfWeek: string; // "monday", "tuesday", ...
  timeSlot: string; // "open", "middle", ...
  startTime: string;
  endTime: string;
  color: string;
  employees: ScheduleShiftEmployee[];
  maxEmployees?: number;
  requiredRoles?: Record<string, number>;
}

interface WeeklyPlannerProps {
  employees: Employee[];
  // initialPlan?: WeeklyPlanShift[]; // 추후 로드 기능 구현 시 사용
  onSavePlan: (plan: WeeklyPlanShift[]) => void;
}

// --- 상수 정의 (DragDropScheduler와 공유 가능) ---
const DAYS_OF_WEEK = [
  /* ... 월~일 */
];
const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  /* ... 오픈/미들/마감 */
];
const POSITION_COLORS: Record<string, string> = {
  /* ... 역할별 색상 */
};

// --- 유틸리티 함수 (DragDropScheduler와 공유 가능) ---
const getAvatarColor = (name: string): string => {
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

// --- 컴포넌트 ---
const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  employees,
  onSavePlan,
  // initialPlan = [],
}) => {
  const theme = useTheme();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [plan, setPlan] = useState<WeeklyPlanShift[]>([]); // 주간 계획 상태

  // 빈 주간 계획 생성 함수
  const createEmptyPlan = useCallback(
    (currentTimeslots: TimeSlot[]): WeeklyPlanShift[] => {
      const newPlan: WeeklyPlanShift[] = [];
      DAYS_OF_WEEK.forEach((day) => {
        currentTimeslots.forEach((slot) => {
          newPlan.push({
            id: `${day.id}-${slot.id}`,
            dayOfWeek: day.id,
            timeSlot: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            color: slot.color,
            employees: [],
            maxEmployees: slot.requiredStaff || 3,
            requiredRoles: { 매니저: 1, 바리스타: 1 }, // 기본값
          });
        });
      });
      return newPlan;
    },
    []
  );

  // 초기 계획 설정 (추후 로드 로직 구현 시 활성화)
  useEffect(() => {
    // if (initialPlan && initialPlan.length > 0) {
    //   setPlan(initialPlan);
    // } else {
    setPlan(createEmptyPlan(timeSlots));
    // }
  }, [/*initialPlan,*/ timeSlots, createEmptyPlan]);

  // 직원 역할별 그룹화 (정의 복원)
  const employeesByRole = useMemo(
    (): Record<string, Employee[]> => // 반환 타입 명시
      employees.reduce((acc, emp) => {
        const role = emp.role || "일반";
        if (!acc[role]) acc[role] = [];
        acc[role].push(emp);
        return acc;
      }, {} as Record<string, Employee[]>), // 초기값 타입 단언 유지
    [employees]
  );

  // 역할 정렬 (반환 타입 string[] 명시 유지)
  const sortedRoles = useMemo((): string[] => {
    const ROLE_ORDER = ["매니저", "바리스타", "서빙", "캐셔", "주방", "일반"];
    // employeesByRole이 Record<string, Employee[]> 타입으로 명확해짐
    return Object.keys(employeesByRole).sort((a, b) => {
      const indexA = ROLE_ORDER.indexOf(a);
      const indexB = ROLE_ORDER.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [employeesByRole]);

  // 드래그 종료 핸들러 (setPlan 로직 수정)
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    )
      return;

    // 직원 목록 -> 계획
    if (
      source.droppableId === "employees-list" &&
      destination.droppableId !== "employees-list"
    ) {
      const employeeId = draggableId.replace("employee-", "");
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee) return;
      const targetShiftId = destination.droppableId;
      setPlan((prevPlan) =>
        prevPlan.map((shift) => {
          if (shift.id === targetShiftId) {
            if (shift.employees.some((emp) => emp.id === employeeId)) {
              alert("이미 배정된 직원입니다.");
              return shift;
            }
            if (
              shift.maxEmployees &&
              shift.employees.length >= shift.maxEmployees
            ) {
              alert(`최대 ${shift.maxEmployees}명까지 배정 가능합니다.`);
              return shift;
            }
            const newEmployeeEntry: ScheduleShiftEmployee = {
              id: employee.id,
              name: employee.name,
              role: employee.role || "일반",
              avatarColor: getAvatarColor(employee.name),
            };
            return {
              ...shift,
              employees: [...shift.employees, newEmployeeEntry],
            };
          }
          return shift;
        })
      );
    }
    // 계획 -> 계획 (다른 시간대) - map 반환 타입 수정
    else if (
      source.droppableId !== "employees-list" &&
      destination.droppableId !== "employees-list" &&
      source.droppableId !== destination.droppableId
    ) {
      const employeeId = draggableId.split("-").pop();
      if (!employeeId) return;
      const sourceShiftId = source.droppableId;
      const destShiftId = destination.droppableId;

      setPlan((prevPlan) => {
        console.log(
          "prevPlan type:",
          typeof prevPlan,
          "Is Array?",
          Array.isArray(prevPlan)
        ); // 타입 및 값 확인 로그
        if (!Array.isArray(prevPlan)) {
          console.error("prevPlan is not an array!", prevPlan);
          return []; // 비정상 상태면 빈 배열 반환
        }

        let employeeToMove: ScheduleShiftEmployee | null = null;
        let found = false;

        // 1. 소스에서 직원 제거 (planAfterRemoval 타입 명시)
        const planAfterRemoval: WeeklyPlanShift[] = prevPlan.map((shift) => {
          if (shift.id === sourceShiftId) {
            const empIndex = shift.employees.findIndex(
              (emp) => emp.id === employeeId
            );
            if (empIndex !== -1) {
              employeeToMove = shift.employees[empIndex];
              found = true;
              // filter가 새 배열을 반환하므로 불변성 유지됨
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

        if (!found || !employeeToMove) return prevPlan;

        let canAdd = true;
        // 2. 목적지에 직원 추가 시도 (planAfterAdditionOrKeep 타입 명시)
        const planAfterAdditionOrKeep: WeeklyPlanShift[] = planAfterRemoval.map(
          (shift) => {
            if (shift.id === destShiftId) {
              if (
                shift.maxEmployees &&
                shift.employees.length >= shift.maxEmployees
              ) {
                alert(`최대 ${shift.maxEmployees}명까지 배정 가능합니다.`);
                canAdd = false;
                return shift;
              }
              return {
                ...shift,
                employees: [...shift.employees, employeeToMove!],
              };
            }
            return shift;
          }
        );

        return canAdd ? planAfterAdditionOrKeep : planAfterRemoval;
      });
    }
    // 계획 -> 계획 (같은 시간대, 순서 변경)
    else if (
      source.droppableId === destination.droppableId &&
      source.droppableId !== "employees-list"
    ) {
      const shiftId = source.droppableId;
      setPlan((prevPlan) => {
        const targetShiftIndex = prevPlan.findIndex((s) => s.id === shiftId);
        if (targetShiftIndex === -1) return prevPlan;
        const targetShift = prevPlan[targetShiftIndex];
        const newEmployees = Array.from(targetShift.employees);
        const [movedEmployee] = newEmployees.splice(source.index, 1);
        newEmployees.splice(destination.index, 0, movedEmployee);
        const newPlan = [...prevPlan];
        newPlan[targetShiftIndex] = { ...targetShift, employees: newEmployees };
        return newPlan;
      });
    }
  };

  // 특정 시간대의 직원 목록 가져오기 (plan 사용)
  const getShiftEmployees = useCallback(
    (dayId: string, timeSlotId: string): ScheduleShiftEmployee[] => {
      const shift = plan.find(
        (s) => s.dayOfWeek === dayId && s.timeSlot === timeSlotId
      );
      return shift ? shift.employees : [];
    },
    [plan]
  );

  // 직원 제거 핸들러 (setPlan 로직 수정)
  const handleRemoveEmployee = (shiftId: string, employeeId: string) => {
    setPlan((prevPlan) =>
      prevPlan.map((shift) => {
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

  // 계획 저장 핸들러
  const handleSaveClick = () => {
    onSavePlan(plan);
    alert("주간 계획이 저장되었습니다."); // 임시
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">주간 스케줄 계획 짜기</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveClick}
        >
          계획 저장
        </Button>
        {/* 여기에 '이번 주 적용' 버튼 추가 예정 */}
      </Box>

      {/* DragDropContext 및 UI (DragDropScheduler와 거의 동일, 상태 변수 plan 사용) */}
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
          {/* 왼쪽: 직원 목록 (Droppable children 수정) */}
          <Paper /* ... */>
            <Droppable droppableId="employees-list">
              {(provided, snapshot) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {/* 직원 목록 렌더링 */}
                  {sortedRoles.map((role, roleIndex) => {
                    // 각 반복마다 JSX 요소를 명시적으로 반환
                    return (
                      <Box key={role} sx={{ mb: 2 }}>
                        {/* ... 역할 헤더 ... */}
                        <Box sx={{ bgcolor: "grey.100" /* ... */ }}>
                          <Typography variant="subtitle2">{role}</Typography>
                          <Typography variant="caption">
                            {employeesByRole[role].length}명
                          </Typography>
                        </Box>
                        {/* 직원 목록 Draggable */}
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
                                sx={
                                  {
                                    /* ... 직원 카드 styles ... */
                                  }
                                }
                              >
                                {/* ... 직원 카드 내용 ... */}
                                <Avatar
                                  sx={
                                    {
                                      /* ... */
                                    }
                                  }
                                >
                                  {employee.name.charAt(0)}
                                </Avatar>
                                <Box
                                  sx={
                                    {
                                      /* ... */
                                    }
                                  }
                                >
                                  <Typography /* ... */>
                                    {employee.name}
                                  </Typography>
                                  <Typography /* ... */>
                                    {employee.role || "일반"}
                                  </Typography>
                                </Box>
                                <DragIndicatorIcon /* ... */ />
                              </Box>
                            )}
                          </Draggable>
                        ))}
                      </Box>
                    );
                  })}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Paper>
          {/* 오른쪽: 주간 계획 표 (요일별) */}
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
                  <Paper sx={{ p: 2, height: "100%" }}>
                    <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                      {day.name}
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {timeSlots.map((timeSlot) => {
                        const shiftId = `${day.id}-${timeSlot.id}`;
                        const shiftEmployees = getShiftEmployees(
                          day.id,
                          timeSlot.id
                        );
                        const currentShift = plan.find((s) => s.id === shiftId);
                        const maxEmployees = currentShift?.maxEmployees || 3;
                        return (
                          <Box key={shiftId}>
                            {/* 시간대 헤더 */}
                            <Box /* ... */>
                              <Typography /* ... */>{timeSlot.name}</Typography>
                              <Typography /* ... */>
                                {shiftEmployees.length}/{maxEmployees}
                              </Typography>
                            </Box>
                            {/* Droppable 영역 */}
                            <Droppable droppableId={shiftId}>
                              {(provided, snapshot) => (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  sx={
                                    {
                                      /* ... styles ... */
                                    }
                                  }
                                >
                                  {shiftEmployees.length === 0 ? (
                                    <Typography /* ... */>
                                      직원을 여기로 드래그하세요
                                    </Typography>
                                  ) : (
                                    shiftEmployees.map((employee, index) => (
                                      <Draggable
                                        key={`${shiftId}-${employee.id}`}
                                        draggableId={`plan-${shiftId}-${employee.id}`}
                                        index={index}
                                      >
                                        {(provided, snapshot) => (
                                          <Box
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            sx={
                                              {
                                                /* ... styles ... */
                                              }
                                            }
                                          >
                                            {/* 직원 정보 + 삭제 버튼 */}
                                            <Avatar /* ... */ />
                                            <Box /* ... */>
                                              <Typography /* ... */>
                                                {employee.name}
                                              </Typography>
                                              <Typography /* ... */>
                                                {employee.role}
                                              </Typography>
                                            </Box>
                                            <IconButton
                                              onClick={() =>
                                                handleRemoveEmployee(
                                                  shiftId,
                                                  employee.id
                                                )
                                              }
                                            >
                                              <DeleteIcon />
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

export default WeeklyPlanner;
