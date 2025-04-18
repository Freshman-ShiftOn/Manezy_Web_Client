import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Container,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Divider,
  FormHelperText,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { useNavigate } from "react-router-dom";
import { generateDummyData, LS_KEYS } from "../../services/api";
import { Store, Employee } from "../../lib/types";
import { isValid, parse, format } from "date-fns";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

// 직원 타입 옵션
const ROLE_OPTIONS = [
  { value: "매니저", label: "매니저" },
  { value: "바리스타", label: "바리스타" },
  { value: "알바생", label: "알바생" },
  { value: "주방", label: "주방" },
  { value: "홀", label: "홀" },
  { value: "기타", label: "기타" },
];

// 마법사 단계 정의
const STEPS = ["매장 기본 정보", "직원 등록", "설정 완료"];

// 기본 시급 설정 (2024년 기준)
const DEFAULT_HOURLY_RATE = 9860;

const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // 매장 정보 상태
  const [storeData, setStoreData] = useState<Partial<Store>>({
    name: "",
    address: "",
    phoneNumber: "",
    baseHourlyRate: DEFAULT_HOURLY_RATE,
    openingHour: "08:00",
    closingHour: "22:00",
    weeklyHolidayHoursThreshold: 15,
  });

  // 직원 목록 상태
  const [employees, setEmployees] = useState<Partial<Employee>[]>([
    {
      id: `emp-${Date.now()}`,
      name: "",
      phoneNumber: "",
      role: "바리스타",
      hourlyRate: DEFAULT_HOURLY_RATE,
      status: "active",
    },
  ]);

  // 영업 시간 선택을 위한 Date 객체
  const [openTime, setOpenTime] = useState<Date | null>(
    parse("08:00", "HH:mm", new Date())
  );
  const [closeTime, setCloseTime] = useState<Date | null>(
    parse("22:00", "HH:mm", new Date())
  );

  // 새로운 직원 등록을 위한 대화상자 상태
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({
    name: "",
    phoneNumber: "",
    role: "바리스타",
    hourlyRate: DEFAULT_HOURLY_RATE,
    status: "active",
  });
  const [editingEmployeeIndex, setEditingEmployeeIndex] = useState<
    number | null
  >(null);

  // 오류 및 알림 상태
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({
    store: {},
    employee: {},
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  // 매장 정보 입력 변경 핸들러
  const handleStoreInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setStoreData((prev) => ({
      ...prev,
      [name]:
        name === "baseHourlyRate" || name === "weeklyHolidayHoursThreshold"
          ? Number(value) || 0
          : value,
    }));

    // 오류 메시지 초기화
    if (errors.store[name]) {
      setErrors((prev) => ({
        ...prev,
        store: { ...prev.store, [name]: "" },
      }));
    }
  };

  // 영업 시간 변경 핸들러
  const handleTimeChange = (
    field: "openingHour" | "closingHour",
    newValue: Date | null
  ) => {
    if (newValue && isValid(newValue)) {
      const formattedTime = format(newValue, "HH:mm");
      if (field === "openingHour") {
        setOpenTime(newValue);
        setStoreData((prev) => ({ ...prev, openingHour: formattedTime }));
      } else {
        setCloseTime(newValue);
        setStoreData((prev) => ({ ...prev, closingHour: formattedTime }));
      }

      // 시간 오류 초기화
      if (errors.store.time && openTime && closeTime && openTime < closeTime) {
        setErrors((prev) => ({
          ...prev,
          store: { ...prev.store, time: "" },
        }));
      }
    }
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
    if (errors.employee[name]) {
      setErrors((prev) => ({
        ...prev,
        employee: { ...prev.employee, [name]: "" },
      }));
    }
  };

  // 직원 추가/편집 대화상자 열기
  const handleOpenEmployeeDialog = (index?: number) => {
    if (index !== undefined) {
      // 직원 편집 모드
      setCurrentEmployee({ ...employees[index] });
      setEditingEmployeeIndex(index);
    } else {
      // 직원 추가 모드
      setCurrentEmployee({
        id: `emp-${Date.now()}`,
        name: "",
        phoneNumber: "",
        role: "바리스타",
        hourlyRate: storeData.baseHourlyRate || DEFAULT_HOURLY_RATE,
        status: "active",
      });
      setEditingEmployeeIndex(null);
    }
    setEmployeeDialogOpen(true);
  };

  // 직원 추가/수정 대화상자 닫기
  const handleCloseEmployeeDialog = () => {
    setEmployeeDialogOpen(false);
    setErrors((prev) => ({ ...prev, employee: {} }));
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

    setErrors((prev) => ({
      ...prev,
      employee: newErrors,
    }));

    return Object.keys(newErrors).length === 0;
  };

  // 직원 추가 또는 수정 완료
  const handleSaveEmployee = () => {
    if (!validateEmployee()) return;

    if (editingEmployeeIndex !== null) {
      // 직원 정보 수정
      const updatedEmployees = [...employees];
      updatedEmployees[editingEmployeeIndex] = currentEmployee;
      setEmployees(updatedEmployees);
    } else {
      // 새 직원 추가
      setEmployees((prev) => [...prev, currentEmployee]);
    }

    handleCloseEmployeeDialog();
    setSnackbarMessage(
      editingEmployeeIndex !== null
        ? "직원 정보가 수정되었습니다."
        : "새 직원이 추가되었습니다."
    );
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // 직원 삭제
  const handleDeleteEmployee = (index: number) => {
    if (employees.length <= 1) {
      setSnackbarMessage("최소 한 명의 직원은 필요합니다.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const updatedEmployees = [...employees];
    updatedEmployees.splice(index, 1);
    setEmployees(updatedEmployees);

    setSnackbarMessage("직원이 삭제되었습니다.");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // 매장 정보 유효성 검사
  const validateStoreInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!storeData.name?.trim()) {
      newErrors.name = "매장 이름을 입력해주세요.";
    }

    if (!storeData.address?.trim()) {
      newErrors.address = "매장 주소를 입력해주세요.";
    }

    if (!storeData.phoneNumber?.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요.";
    }

    if (!storeData.baseHourlyRate || storeData.baseHourlyRate <= 0) {
      newErrors.baseHourlyRate = "올바른 기본 시급을 입력해주세요.";
    }

    if (!openTime || !closeTime) {
      newErrors.time = "영업 시작 및 종료 시간을 설정해주세요.";
    } else if (openTime >= closeTime) {
      newErrors.time = "종료 시간은 시작 시간보다 이후여야 합니다.";
    }

    setErrors((prev) => ({
      ...prev,
      store: newErrors,
    }));

    return Object.keys(newErrors).length === 0;
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (activeStep === 0) {
      // 매장 정보 유효성 검사
      if (!validateStoreInfo()) return;
    } else if (activeStep === 1) {
      // 직원 정보 유효성 검사
      if (employees.length === 0) {
        setSnackbarMessage("최소 한 명의 직원을 등록해주세요.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  // 이전 단계로 이동
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // 샘플 데이터 생성
  const handleGenerateSampleData = async () => {
    setLoading(true);
    try {
      await generateDummyData();
      setSnackbarMessage(
        "샘플 데이터가 생성되었습니다. 완료 후 대시보드로 이동합니다."
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 잠시 후 대시보드로 이동
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error generating sample data:", error);
      setSnackbarMessage("샘플 데이터 생성 중 오류가 발생했습니다.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  // 모든 설정 저장 및 완료
  const handleComplete = async () => {
    setLoading(true);
    try {
      // 매장 정보 저장
      const completeStore: Store = {
        id: `store-${Date.now()}`,
        name: storeData.name || "",
        address: storeData.address || "",
        phoneNumber: storeData.phoneNumber || "",
        baseHourlyRate: storeData.baseHourlyRate || DEFAULT_HOURLY_RATE,
        openingHour: storeData.openingHour || "08:00",
        closingHour: storeData.closingHour || "22:00",
        weeklyHolidayHoursThreshold:
          storeData.weeklyHolidayHoursThreshold || 15,
      };

      // 직원 정보 최종 수정
      const completeEmployees = employees.map((emp) => ({
        ...emp,
        id:
          emp.id ||
          `emp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      }));

      // localStorage에 저장
      localStorage.setItem(LS_KEYS.STORE, JSON.stringify(completeStore));
      localStorage.setItem(
        LS_KEYS.EMPLOYEES,
        JSON.stringify(completeEmployees)
      );
      localStorage.setItem(LS_KEYS.SETUP_COMPLETE, "true");

      setSnackbarMessage("매장 설정이 완료되었습니다. 대시보드로 이동합니다.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // 잠시 후 대시보드로 이동
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error saving setup:", error);
      setSnackbarMessage("설정 저장 중 오류가 발생했습니다.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  // 스낵바 닫기
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // 현재 단계에 따른 컨텐츠 렌더링
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="매장 이름"
                name="name"
                value={storeData.name}
                onChange={handleStoreInputChange}
                fullWidth
                required
                variant="filled"
                error={!!errors.store.name}
                helperText={errors.store.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="매장 주소"
                name="address"
                value={storeData.address}
                onChange={handleStoreInputChange}
                fullWidth
                required
                variant="filled"
                error={!!errors.store.address}
                helperText={errors.store.address}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="전화번호"
                name="phoneNumber"
                value={storeData.phoneNumber}
                onChange={handleStoreInputChange}
                fullWidth
                required
                variant="filled"
                error={!!errors.store.phoneNumber}
                helperText={errors.store.phoneNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="기본 시급"
                name="baseHourlyRate"
                type="number"
                value={storeData.baseHourlyRate}
                onChange={handleStoreInputChange}
                fullWidth
                required
                variant="filled"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₩</InputAdornment>
                  ),
                }}
                error={!!errors.store.baseHourlyRate}
                helperText={
                  errors.store.baseHourlyRate ||
                  "직원 등록 시 기본값으로 사용됩니다."
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="영업 시작 시간"
                  value={openTime}
                  onChange={(newValue) =>
                    handleTimeChange("openingHour", newValue)
                  }
                  ampm={false}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "filled",
                      required: true,
                      error: !!errors.store.time,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="영업 종료 시간"
                  value={closeTime}
                  onChange={(newValue) =>
                    handleTimeChange("closingHour", newValue)
                  }
                  ampm={false}
                  minTime={openTime || undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "filled",
                      required: true,
                      error: !!errors.store.time,
                    },
                  }}
                />
              </LocalizationProvider>
              {errors.store.time && (
                <FormHelperText error>{errors.store.time}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="주휴수당 기준 시간 (주당)"
                name="weeklyHolidayHoursThreshold"
                type="number"
                value={storeData.weeklyHolidayHoursThreshold}
                onChange={handleStoreInputChange}
                fullWidth
                required
                variant="filled"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">시간</InputAdornment>
                  ),
                }}
                helperText="주 15시간 이상 근무 시 주휴수당 지급 (일반적)"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle1">직원 목록</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenEmployeeDialog()}
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
              <List>
                {employees.map((employee, index) => (
                  <React.Fragment key={employee.id || index}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleOpenEmployeeDialog(index)}
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

            {/* 직원 추가/수정 대화상자 */}
            <Dialog
              open={employeeDialogOpen}
              onClose={handleCloseEmployeeDialog}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                {editingEmployeeIndex !== null
                  ? "직원 정보 수정"
                  : "새 직원 추가"}
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
                      error={!!errors.employee.name}
                      helperText={errors.employee.name}
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
                      error={!!errors.employee.phoneNumber}
                      helperText={errors.employee.phoneNumber}
                      margin="normal"
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
                      error={!!errors.employee.hourlyRate}
                      helperText={errors.employee.hourlyRate}
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
                <Button onClick={handleCloseEmployeeDialog} color="inherit">
                  취소
                </Button>
                <Button onClick={handleSaveEmployee} variant="contained">
                  저장
                </Button>
              </DialogActions>
            </Dialog>
          </>
        );

      case 2:
        return (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              설정이 모두 완료되었습니다!
            </Typography>
            <Typography sx={{ mb: 3 }}>
              이제 다음 중 하나를 선택하여 시작할 수 있습니다:
            </Typography>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleComplete}
                disabled={loading}
                size="large"
                sx={{ py: 1.5 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                ) : null}
                기본 설정으로 시작하기
              </Button>

              <Typography variant="body2" sx={{ my: 1 }}>
                또는
              </Typography>

              <Button
                variant="outlined"
                color="secondary"
                onClick={handleGenerateSampleData}
                disabled={loading}
                size="large"
                sx={{ py: 1.5 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                ) : null}
                샘플 데이터로 시작하기
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            매장 설정 마법사
          </Typography>
          <Typography align="center" color="text.secondary">
            새 매장을 설정하고 바로 시작해보세요
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>{renderStepContent()}</Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", pt: 2 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            이전
          </Button>

          {activeStep < STEPS.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              다음
            </Button>
          ) : null}
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SetupWizard;
