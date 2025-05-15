import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Employee } from "../../../lib/types";
import {
  BranchWorkerRequest,
  createBranchWorker,
  testAPIConnection,
  API_BASE_URL,
} from "../../../services/api";

// 직원 타입 옵션
const ROLE_OPTIONS = [
  { value: "매니저", label: "매니저" },
  { value: "바리스타", label: "바리스타" },
  { value: "알바생", label: "알바생" },
  { value: "주방", label: "주방" },
  { value: "홀", label: "홀" },
  { value: "기타", label: "기타" },
];

interface WizardStepEmployeesProps {
  data: {
    employees: Partial<Employee>[];
    branchId?: number;
  };
  baseHourlyRate: number;
  onUpdate: (data: { employees: Partial<Employee>[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

function WizardStepEmployees({
  data,
  baseHourlyRate,
  onUpdate,
  onNext,
  onBack,
}: WizardStepEmployeesProps) {
  const [employees, setEmployees] = useState<Partial<Employee>[]>(
    data.employees || []
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({
    name: "",
    phoneNumber: "",
    email: "",
    role: "바리스타",
    hourlyRate: baseHourlyRate,
    status: "active",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiProcessing, setApiProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });
  const [apiStatus, setApiStatus] = useState<{
    checked: boolean;
    ok: boolean;
    message: string;
  }>({
    checked: false,
    ok: false,
    message: "",
  });

  // API 서버 연결 테스트
  useEffect(() => {
    const checkAPIConnection = async () => {
      const result = await testAPIConnection();
      setApiStatus({
        checked: true,
        ok: result.success,
        message: result.message,
      });

      if (!result.success) {
        console.warn("API 서버 연결 문제:", result.message);
        setSnackbar({
          open: true,
          message: `API 서버 연결 문제가 감지되었습니다: ${result.message}`,
          severity: "warning",
        });
      }
    };

    checkAPIConnection();
  }, []);

  // 직원 추가/편집 대화상자 열기
  const handleOpenDialog = (index?: number) => {
    if (index !== undefined) {
      // 직원 편집 모드
      setCurrentEmployee({ ...employees[index] });
      setEditingIndex(index);
    } else {
      // 직원 추가 모드
      setCurrentEmployee({
        id: `emp-${Date.now()}`,
        name: "",
        phoneNumber: "",
        email: "",
        role: "바리스타",
        hourlyRate: baseHourlyRate,
        status: "active",
      });
      setEditingIndex(null);
    }
    setDialogOpen(true);
  };

  // 직원 추가/수정 대화상자 닫기
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setErrors({});
  };

  // 직원 정보 입력 변경 핸들러
  const handleEmployeeInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setCurrentEmployee((prev) => ({
      ...prev,
      [name]: name === "hourlyRate" ? Number(value) || 0 : value,
    }));

    // 오류 메시지 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // 직원 정보 유효성 검사
  const validateEmployee = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentEmployee.name?.trim()) {
      newErrors.name = "직원 이름을 입력해주세요.";
    }

    if (!currentEmployee.phoneNumber?.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요.";
    }

    if (!currentEmployee.hourlyRate || currentEmployee.hourlyRate < 0) {
      newErrors.hourlyRate = "올바른 시급을 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 직원 추가 또는 수정 완료
  const handleSaveEmployee = async () => {
    if (!validateEmployee()) return;

    // API 서버 연결 확인
    if (!apiStatus.checked || !apiStatus.ok) {
      const connectionTest = await testAPIConnection();
      if (!connectionTest.success) {
        setSnackbar({
          open: true,
          message: `API 서버(${API_BASE_URL})에 연결할 수 없습니다. 올바른 URL인지 확인하세요: https://crewezy.epicode.co.kr`,
          severity: "error",
        });
        return; // 연결 실패시 API 호출 중단
      } else {
        setApiStatus({
          checked: true,
          ok: true,
          message: connectionTest.message,
        });
      }
    }

    setLoading(true);

    try {
      // 직원 정보를 API 형식으로 변환
      const workerRequest: BranchWorkerRequest = {
        branchId: data.branchId || 0, // 이전 단계에서 생성된 지점 ID
        email: currentEmployee.email || `${currentEmployee.name}@example.com`, // 이메일이 없으면 임시 생성
        name: currentEmployee.name || "",
        phoneNums: currentEmployee.phoneNumber || "", // 주의: API 스펙에 맞게 phoneNums 사용
        roles: currentEmployee.role || "알바생",
        status: currentEmployee.status || "active",
        cost: currentEmployee.hourlyRate || baseHourlyRate,
      };

      console.log("직원 등록 요청 데이터:", workerRequest);

      // API 호출
      const response = await createBranchWorker(workerRequest);
      console.log("Worker registered successfully:", response);

      // 임시 ID 생성 (응답에 ID가 없는 경우)
      const tempId =
        currentEmployee.id ||
        `worker-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 응답에서 받은 ID가 있으면 적용, 없으면 임시 ID 사용
      const workerWithId = {
        ...currentEmployee,
        workerId: response && response.id ? response.id : tempId,
      };

      const updatedEmployees = [...employees];

      if (editingIndex !== null) {
        // 직원 정보 수정
        updatedEmployees[editingIndex] = workerWithId;
      } else {
        // 새 직원 추가
        updatedEmployees.push(workerWithId);
      }

      setEmployees(updatedEmployees);
      onUpdate({ employees: updatedEmployees });

      handleCloseDialog();
      setSnackbar({
        open: true,
        message:
          response.message ||
          (editingIndex !== null
            ? "직원 정보가 수정되었습니다."
            : "새 직원이 추가되었습니다."),
        severity: "success",
      });
    } catch (error) {
      console.error("Worker registration failed:", error);

      // 에러 메시지 생성
      let errorMessage = "직원 등록 중 오류가 발생했습니다.";

      if (error instanceof Error) {
        if (error.message.includes("404")) {
          errorMessage =
            "API 경로를 찾을 수 없습니다 (404). 올바른 API URL인지 확인하세요: https://crewezy.epicode.co.kr/api/branch/workers";
        } else if (error.message.includes("CORS")) {
          errorMessage =
            "CORS 오류: API 서버 접근 권한이 없습니다. 개발자에게 문의하세요.";
        } else if (error.message.includes("서버 오류")) {
          errorMessage = error.message;
        } else if (error.message.includes("유효하지 않은 응답 형식")) {
          errorMessage =
            "서버에서 유효하지 않은 응답을 반환했습니다. API 서버를 확인해주세요.";
        } else {
          errorMessage = error.message;
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // 직원 삭제
  const handleDeleteEmployee = (index: number) => {
    if (employees.length <= 1) {
      setSnackbar({
        open: true,
        message: "최소 한 명의 직원은 필요합니다.",
        severity: "error",
      });
      return;
    }

    const updatedEmployees = [...employees];
    updatedEmployees.splice(index, 1);
    setEmployees(updatedEmployees);
    onUpdate({ employees: updatedEmployees });

    setSnackbar({
      open: true,
      message: "직원이 삭제되었습니다.",
      severity: "success",
    });
  };

  // 스낵바 닫기
  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 다음 단계로 이동 전 유효성 검사
  const handleNext = async () => {
    if (employees.length === 0) {
      setSnackbar({
        open: true,
        message: "최소 한 명의 직원을 등록해주세요.",
        severity: "error",
      });
      return;
    }

    // API 서버 연결 확인
    if (!apiStatus.checked || !apiStatus.ok) {
      const connectionTest = await testAPIConnection();
      if (!connectionTest.success) {
        setSnackbar({
          open: true,
          message: `API 서버(${API_BASE_URL})에 연결할 수 없습니다. 올바른 URL인지 확인하세요: https://crewezy.epicode.co.kr`,
          severity: "error",
        });
        return;
      } else {
        setApiStatus({
          checked: true,
          ok: true,
          message: connectionTest.message,
        });
      }
    }

    setApiProcessing(true);

    try {
      // 아직 API로 등록되지 않은 직원들을 등록
      const unregisteredEmployees = employees.filter((emp) => !emp.workerId);

      // 미등록 직원을 위한 추가 등록 시도
      if (unregisteredEmployees.length > 0) {
        console.log(
          `${unregisteredEmployees.length}명의 미등록 직원을 등록합니다.`
        );

        for (const employee of unregisteredEmployees) {
          const workerRequest: BranchWorkerRequest = {
            branchId: data.branchId || 0,
            email: employee.email || `${employee.name}@example.com`,
            name: employee.name || "",
            phoneNums: employee.phoneNumber || "", // 주의: API 스펙에 맞게 phoneNums 사용
            roles: employee.role || "알바생",
            status: employee.status || "active",
            cost: employee.hourlyRate || baseHourlyRate,
          };

          try {
            console.log("미등록 직원 등록 요청:", workerRequest);
            await createBranchWorker(workerRequest);
          } catch (workerError) {
            console.warn(
              `직원 '${employee.name}' 등록 실패, 계속 진행합니다:`,
              workerError
            );
            // 개별 직원 등록 실패는 무시하고 계속 진행
          }
        }
      }

      // 응답 성공 여부와 관계없이 다음 단계로 진행
      onNext();
    } catch (error) {
      console.error("Failed to register remaining workers:", error);

      let errorMessage = "일부 직원 등록에 실패했습니다. 다시 시도해주세요.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // 에러가 발생해도 사용자에게 계속 진행할 옵션 제공
      setSnackbar({
        open: true,
        message: `${errorMessage} 그래도 계속 진행하시겠습니까?`,
        severity: "warning",
      });

      // 실패했더라도 5초 후 자동 진행
      setTimeout(() => {
        onNext();
      }, 5000);
    } finally {
      setApiProcessing(false);
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      {!apiStatus.ok && apiStatus.checked && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={async () => {
                const result = await testAPIConnection();
                setApiStatus({
                  checked: true,
                  ok: result.success,
                  message: result.message,
                });
                setSnackbar({
                  open: true,
                  message: result.success
                    ? "서버 연결 확인 완료! 정상적으로 연결되었습니다."
                    : `서버 연결 실패: ${result.message}`,
                  severity: result.success ? "success" : "error",
                });
              }}
            >
              재시도
            </Button>
          }
        >
          API 서버({API_BASE_URL})에 연결할 수 없습니다. 직원 등록이 실패할 수
          있습니다.
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        직원 정보를 등록해주세요
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        매장에서 근무할 직원 정보를 입력합니다. 직원은 추후에도 추가/변경할 수
        있습니다.
      </Typography>

      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1">직원 목록</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          직원 추가
        </Button>
      </Box>

      {employees.length === 0 ? (
        <Typography
          sx={{ textAlign: "center", my: 4, color: "text.secondary" }}
        >
          등록된 직원이 없습니다. 직원을 추가해주세요.
        </Typography>
      ) : (
        <List sx={{ mb: 3 }}>
          {employees.map((employee, index) => (
            <React.Fragment key={employee.id || index}>
              {index > 0 && <Divider />}
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenDialog(index)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteEmployee(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={employee.name || "(이름 없음)"}
                  secondary={
                    <>
                      {employee.role} · {employee.hourlyRate}원/시간
                      <br />
                      {employee.phoneNumber}
                    </>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
        <Button variant="outlined" onClick={onBack} disabled={apiProcessing}>
          이전
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={apiProcessing}
        >
          {apiProcessing ? <CircularProgress size={24} /> : "다음"}
        </Button>
      </Box>

      {/* 직원 추가/수정 대화상자 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingIndex !== null ? "직원 정보 수정" : "새 직원 추가"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="이름"
                name="name"
                value={currentEmployee.name || ""}
                onChange={handleEmployeeInputChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="전화번호"
                name="phoneNumber"
                value={currentEmployee.phoneNumber || ""}
                onChange={handleEmployeeInputChange}
                fullWidth
                required
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="이메일"
                name="email"
                type="email"
                value={currentEmployee.email || ""}
                onChange={handleEmployeeInputChange}
                fullWidth
                margin="normal"
                placeholder="example@email.com"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="직무"
                name="role"
                value={currentEmployee.role || "바리스타"}
                onChange={handleEmployeeInputChange}
                fullWidth
                margin="normal"
                SelectProps={{
                  native: true,
                }}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="시급"
                name="hourlyRate"
                type="number"
                value={currentEmployee.hourlyRate || ""}
                onChange={handleEmployeeInputChange}
                fullWidth
                required
                error={!!errors.hourlyRate}
                helperText={errors.hourlyRate}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₩</InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            color="inherit"
            disabled={loading}
          >
            취소
          </Button>
          <Button
            onClick={handleSaveEmployee}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default WizardStepEmployees;
