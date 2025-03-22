import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Avatar,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from "@mui/material";
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { format, getDay } from "date-fns";
import {
  getEmployees,
  getEmployeeAvailabilities,
  getRecommendedEmployees,
  createSubstituteRequest,
} from "../../../services/api";
import { Employee, EmployeeAvailability, Shift } from "../../../lib/types";

// 요일 이름 (한글)
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 가용시간 선호도에 따른 색상
const PREFERENCE_COLORS = {
  preferred: "#4CAF50", // 녹색 (선호)
  available: "#2196F3", // 파란색 (가능)
  unavailable: "#F44336", // 빨간색 (불가능)
};

// 추천 점수 레벨
const SCORE_LEVELS = [
  { min: 80, color: "#4CAF50", label: "최적" },
  { min: 60, color: "#8BC34A", label: "좋음" },
  { min: 40, color: "#FFC107", label: "보통" },
  { min: 20, color: "#FF9800", label: "낮음" },
  { min: 0, color: "#F44336", label: "매우 낮음" },
];

interface SubstituteAssignerProps {
  shiftId?: string;
  shift?: Shift;
  originalEmployeeId?: string;
  onAssigned?: () => void;
  onClose?: () => void;
}

const SubstituteAssigner: React.FC<SubstituteAssignerProps> = ({
  shiftId,
  shift,
  originalEmployeeId,
  onAssigned,
  onClose,
}) => {
  // 상태 관리
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availabilities, setAvailabilities] = useState<EmployeeAvailability[]>(
    []
  );
  const [recommendations, setRecommendations] = useState<
    { employeeId: string; score: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [requestReason, setRequestReason] = useState("");
  const [requestingSubstitute, setRequestingSubstitute] = useState(false);

  // 초기 데이터 로딩
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 직원 및 가용시간 데이터 로드
        const [employeesData, availabilitiesData] = await Promise.all([
          getEmployees(),
          getEmployeeAvailabilities(),
        ]);

        setEmployees(employeesData);
        setAvailabilities(availabilitiesData);

        // 추천 직원 로드
        if (shiftId) {
          const recommendationsData = await getRecommendedEmployees(shiftId);
          // 원래 배정된 직원은 제외
          setRecommendations(
            recommendationsData.filter(
              (rec) => rec.employeeId !== originalEmployeeId
            )
          );
        }
      } catch (err) {
        console.error("데이터 로딩 오류:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [shiftId, originalEmployeeId]);

  // 추천 점수에 따른 색상 및 라벨
  const getScoreInfo = (score: number) => {
    const level = SCORE_LEVELS.find((level) => score >= level.min);
    return level || SCORE_LEVELS[SCORE_LEVELS.length - 1];
  };

  // 현재 근무 요일
  const getShiftDay = (shift: Shift | null | undefined) => {
    if (!shift) return -1;
    return getDay(new Date(shift.start));
  };

  // 해당 요일에 직원이 근무 가능한지 확인
  const isEmployeeAvailable = (employeeId: string, dayOfWeek: number) => {
    const employeeAvailability = availabilities.find(
      (a) => a.employeeId === employeeId && a.dayOfWeek === dayOfWeek
    );

    return (
      employeeAvailability && employeeAvailability.preference !== "unavailable"
    );
  };

  // 대타 요청 다이얼로그 열기
  const handleOpenRequestDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setShowRequestDialog(true);
  };

  // 대타 요청 보내기
  const handleSendSubstituteRequest = async () => {
    if (!shiftId || !selectedEmployeeId || !originalEmployeeId) return;

    setRequestingSubstitute(true);

    try {
      // 대타 요청 생성
      await createSubstituteRequest({
        shiftId,
        requesterId: originalEmployeeId,
        substituteId: selectedEmployeeId,
        status: "pending",
        reason: requestReason,
      });

      // 대화상자 닫고 상태 초기화
      setShowRequestDialog(false);
      setRequestReason("");
      setSelectedEmployeeId(null);

      // 완료 콜백
      if (onAssigned) onAssigned();
      if (onClose) onClose();

      alert(
        `대타 요청이 ${
          employees.find((e) => e.id === selectedEmployeeId)?.name
        }님에게 전송되었습니다.`
      );
    } catch (err) {
      console.error("대타 요청 생성 오류:", err);
      setError("대타 요청을 생성하는 데 실패했습니다.");
    } finally {
      setRequestingSubstitute(false);
    }
  };

  // 가용시간 미니맵 렌더링
  const renderAvailabilityMinimap = (employeeId: string) => {
    const employeeAvailabilities = availabilities.filter(
      (a) => a.employeeId === employeeId
    );

    return (
      <Box sx={{ display: "flex", mt: 1, mb: 1 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const dayAvailability = employeeAvailabilities.find(
            (a) => a.dayOfWeek === day
          );

          // 해당 요일에 가용 정보가 없으면 회색으로 표시
          if (!dayAvailability) {
            return (
              <Box
                key={day}
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: "#E0E0E0",
                  mr: 0.5,
                  borderRadius: 0.5,
                }}
              />
            );
          }

          return (
            <Tooltip
              key={day}
              title={`${DAYS_OF_WEEK[day]}: ${dayAvailability.startTime}-${
                dayAvailability.endTime
              } (${
                dayAvailability.preference === "preferred"
                  ? "선호"
                  : dayAvailability.preference === "available"
                  ? "가능"
                  : "불가능"
              })`}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: PREFERENCE_COLORS[dayAvailability.preference],
                  mr: 0.5,
                  borderRadius: 0.5,
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  // 추천 직원 목록 렌더링
  const renderRecommendations = () => {
    if (!shift) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          근무를 선택하여 추천 직원을 확인하세요.
        </Alert>
      );
    }

    if (recommendations.length === 0) {
      return (
        <Alert severity="warning" sx={{ m: 2 }}>
          추천할 직원이 없습니다.
        </Alert>
      );
    }

    const shiftDay = getShiftDay(shift);

    return (
      <List>
        {recommendations.map(({ employeeId, score }) => {
          const employee = employees.find((emp) => emp.id === employeeId);
          if (!employee) return null;

          const scoreInfo = getScoreInfo(score);
          const isAvailable = isEmployeeAvailable(employeeId, shiftDay);

          return (
            <Card
              key={employeeId}
              variant="outlined"
              sx={{
                mb: 1,
                borderLeft: 4,
                borderColor: scoreInfo.color,
                opacity: isAvailable ? 1 : 0.6,
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: scoreInfo.color }}>
                    {employee.name.charAt(0)}
                  </Avatar>
                }
                title={employee.name}
                subheader={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Chip
                      label={`${scoreInfo.label} (${score}점)`}
                      size="small"
                      sx={{
                        bgcolor: scoreInfo.color,
                        color: "white",
                        mr: 1,
                      }}
                    />
                    {!isAvailable && (
                      <Chip
                        icon={<WarningIcon />}
                        label="해당 요일 불가능"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
              />
              <CardContent sx={{ pt: 0, pb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {employee.role || "일반 근무자"}
                </Typography>
                {renderAvailabilityMinimap(employeeId)}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => handleOpenRequestDialog(employeeId)}
                  disabled={!isAvailable}
                  endIcon={<SendIcon />}
                >
                  대타 요청하기
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </List>
    );
  };

  // 대타 요청 다이얼로그 렌더링
  const renderRequestDialog = () => {
    const employee = employees.find((emp) => emp.id === selectedEmployeeId);
    if (!employee) return null;

    return (
      <Dialog
        open={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>대타 요청하기</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">근무 정보</Typography>
            {shift && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AccessTimeIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="body2">
                    {format(
                      new Date(shift.start),
                      "yyyy년 MM월 dd일 (eee) HH:mm"
                    )}{" "}
                    ~{format(new Date(shift.end), "HH:mm")}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <PersonIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="body2">
                    원래 배정:{" "}
                    {employees.find((e) => e.id === originalEmployeeId)?.name ||
                      "미배정"}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">대타 직원</Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Avatar sx={{ mr: 1 }}>{employee.name.charAt(0)}</Avatar>
              <Typography>{employee.name}</Typography>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="요청 사유"
            multiline
            rows={3}
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
            placeholder="대타를 요청하는 사유를 입력하세요"
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRequestDialog(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendSubstituteRequest}
            disabled={requestingSubstitute || !requestReason.trim()}
            startIcon={
              requestingSubstitute ? <CircularProgress size={20} /> : null
            }
          >
            {requestingSubstitute ? "요청 중..." : "대타 요청 보내기"}
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
          height: "300px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Typography variant="subtitle1" gutterBottom>
          대타 요청 안내
        </Typography>
        <Typography variant="body2" paragraph>
          선택한 근무 시간에 대해 적합한 대타 직원을 추천해드립니다. 점수가 높은
          직원일수록 해당 시간대에 더 적합한 대타입니다.
        </Typography>
        <Typography variant="body2">고려되는 요소:</Typography>
        <ul>
          <li>
            <Typography variant="body2">
              직원의 선호 시간대 및 가용 시간
            </Typography>
          </li>
          <li>
            <Typography variant="body2">근무 경험 및 역량</Typography>
          </li>
          <li>
            <Typography variant="body2">최근 근무 빈도 및 시간</Typography>
          </li>
        </ul>
      </Paper>

      <Typography variant="h6" gutterBottom>
        대타 추천 목록
      </Typography>
      {renderRecommendations()}
      {renderRequestDialog()}
    </Box>
  );
};

export default SubstituteAssigner;
