import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  FormHelperText,
  Paper,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Icon,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { Store } from "../../../lib/types";
import { isValid, parse, format } from "date-fns";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  BranchCreateRequest,
  createBranch,
  testAPIConnection,
  API_BASE_URL,
} from "../../../services/api";

interface WizardStepStoreInfoProps {
  data: Partial<Store>;
  onUpdate: (data: Partial<Store>) => void;
  onNext: () => void;
}

function WizardStepStoreInfo({
  data,
  onUpdate,
  onNext,
}: WizardStepStoreInfoProps) {
  const [storeData, setStoreData] = useState<
    Partial<Store> & { weeklyAllowanceEnabled?: boolean }
  >({
    ...data,
    weeklyAllowanceEnabled: data.weeklyHolidayHoursThreshold ? true : false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    checked: boolean;
    ok: boolean;
    message: string;
  }>({
    checked: false,
    ok: false,
    message: "",
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // 영업 시간 선택을 위한 Date 객체
  const [openTime, setOpenTime] = useState<Date | null>(
    parse(data.openingHour || "08:00", "HH:mm", new Date())
  );
  const [closeTime, setCloseTime] = useState<Date | null>(
    parse(data.closingHour || "22:00", "HH:mm", new Date())
  );

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

  // 입력값 변경 핸들러
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setStoreData((prev) => ({
      ...prev,
      [name]:
        name === "baseHourlyRate" || name === "weeklyHolidayHoursThreshold"
          ? Number(value) || 0
          : value,
    }));

    // 오류 메시지 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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
      if (errors.time && openTime && closeTime && openTime < closeTime) {
        setErrors((prev) => ({ ...prev, time: "" }));
      }
    }
  };

  // 주휴수당 토글 핸들러
  const handleWeeklyAllowanceToggle = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked;
    setStoreData((prev) => ({
      ...prev,
      weeklyAllowanceEnabled: checked,
      weeklyHolidayHoursThreshold: checked ? 15 : 0, // 활성화되면 기본값 15, 비활성화면 0
    }));
  };

  // API를 사용하여 지점 생성 및 유효성 검사
  const handleSubmit = async () => {
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // API 서버 연결 상태 재확인
    if (!apiStatus.checked || !apiStatus.ok) {
      const connectionTest = await testAPIConnection();
      if (!connectionTest.success) {
        setSnackbar({
          open: true,
          message: `API 서버(${API_BASE_URL})에 연결할 수 없습니다. 올바른 URL인지 확인하세요: https://crewezy.epicode.co.kr`,
          severity: "error",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // API로 전송할 데이터 포맷 변환
      const branchRequest: BranchCreateRequest = {
        id: 0, // 항상 0으로 설정
        name: storeData.name || "",
        adress: storeData.address || "", // 주의: API 스펙에 맞게 'adress'로 전송
        dial_numbers: storeData.phoneNumber || "",
        basic_cost: storeData.baseHourlyRate?.toString() || "9860",
        weekly_allowance: storeData.weeklyAllowanceEnabled === true, // 주휴수당 여부(불리언)
        images: "",
        contents: `${storeData.openingHour || "08:00"} - ${
          storeData.closingHour || "22:00"
        }`,
      };

      console.log("지점 생성 요청 데이터:", branchRequest);

      // 지점 생성 API 호출
      const response = await createBranch(branchRequest);
      console.log("Branch created successfully:", response);

      // 성공 알림
      setSnackbar({
        open: true,
        message: response.message || "지점이 성공적으로 생성되었습니다.",
        severity: "success",
      });

      // API 응답에서 ID 처리
      let branchId;
      if (typeof response === "number") {
        // 응답이 숫자인 경우 (ID 값)
        branchId = response;
      } else if (response && response.id) {
        // 응답이 객체이고 id 필드가 있는 경우
        branchId = response.id;
      } else {
        // 응답에 ID가 없는 경우 임시 ID 생성
        branchId = Date.now();
      }

      // 업데이트된 데이터 생성
      const updatedData = {
        ...storeData,
        branchId: branchId,
      };
      onUpdate(updatedData);

      console.log("저장된 지점 ID:", branchId);

      // 다음 단계로 이동
      setTimeout(() => {
        onNext();
      }, 1000);
    } catch (error) {
      console.error("Branch creation failed:", error);

      // 에러 메시지 처리
      let errorMessage = "지점 생성 중 오류가 발생했습니다.";
      let fieldError = null;

      if (error instanceof Error) {
        errorMessage = error.message;

        // 특정 필드 관련 오류인 경우, 해당 필드 에러 표시
        if (errorMessage.includes("동일한 이름의 지점")) {
          fieldError = {
            field: "name",
            message:
              "동일한 이름의 지점이 이미 존재합니다. 다른 이름을 입력해주세요.",
          };
          setErrors((prev) => ({
            ...prev,
            name: fieldError.message,
          }));
        }

        // 특정 상황별 힌트 추가
        if (errorMessage.includes("동일한 이름의 지점")) {
          errorMessage += " 하나의 계정으로 여러 지점을 관리하실 수 있습니다.";
        } else if (errorMessage.includes("API 경로를 찾을 수 없습니다")) {
          errorMessage =
            "API 서버 연결에 문제가 있습니다. 인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.";
        }
      }

      // 에러 알림
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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
          API 서버({API_BASE_URL})에 연결할 수 없습니다. 지점 등록이 실패할 수
          있습니다.
        </Alert>
      )}

      {/* 환영 메시지 카드 */}
      <Card
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          backgroundColor: "#f5f9ff",
          borderRadius: 2,
          border: "1px solid #c2e0ff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <StorefrontIcon sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
          <Typography variant="h5" color="primary.main" fontWeight="600">
            환영합니다!
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 1 }}>
          아직 등록된 지점이 없네요. 지금 바로 첫 번째 지점을 설정해 보세요!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          간단한 정보 입력만으로 매장 관리를 시작할 수 있습니다. 모든 정보는
          나중에 언제든지 수정할 수 있어요.
        </Typography>
      </Card>

      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, display: "flex", alignItems: "center" }}
      >
        매장 기본 정보
        <Tooltip title="입력하신 정보는 직원 관리, 급여 계산, 근무 스케줄 관리 등에 사용됩니다">
          <HelpOutlineIcon
            sx={{
              ml: 1,
              fontSize: 18,
              color: "text.secondary",
              cursor: "pointer",
            }}
          />
        </Tooltip>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        매장 운영에 필요한 기본 정보를 입력해주세요.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="매장 이름"
            name="name"
            value={storeData.name || ""}
            onChange={handleInputChange}
            fullWidth
            required
            variant="outlined"
            placeholder="예: 카페 마네지 강남점"
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="매장 주소"
            name="address"
            value={storeData.address || ""}
            onChange={handleInputChange}
            fullWidth
            required
            variant="outlined"
            placeholder="예: 서울시 강남구 테헤란로 123"
            error={!!errors.address}
            helperText={errors.address}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="전화번호"
            name="phoneNumber"
            value={storeData.phoneNumber || ""}
            onChange={handleInputChange}
            fullWidth
            required
            variant="outlined"
            placeholder="예: 02-1234-5678"
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="기본 시급"
            name="baseHourlyRate"
            type="number"
            value={storeData.baseHourlyRate || ""}
            onChange={handleInputChange}
            fullWidth
            required
            variant="outlined"
            placeholder="9860"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">₩</InputAdornment>
              ),
            }}
            error={!!errors.baseHourlyRate}
            helperText={
              errors.baseHourlyRate ||
              "직원 등록 시 기본값으로 사용됩니다. (최저시급: 9,860원)"
            }
          />
        </Grid>
      </Grid>

      <Typography
        variant="h6"
        sx={{
          mt: 4,
          mb: 2,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
        }}
      >
        영업 시간
        <Tooltip title="영업 시간은 직원 스케줄 관리와 주휴수당 계산에 사용됩니다">
          <HelpOutlineIcon
            sx={{
              ml: 1,
              fontSize: 18,
              color: "text.secondary",
              cursor: "pointer",
            }}
          />
        </Tooltip>
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label="영업 시작 시간"
              value={openTime}
              onChange={(newValue) => handleTimeChange("openingHour", newValue)}
              ampm={false}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                  required: true,
                  error: !!errors.time,
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
              onChange={(newValue) => handleTimeChange("closingHour", newValue)}
              ampm={false}
              minTime={openTime || undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                  required: true,
                  error: !!errors.time,
                },
              }}
            />
          </LocalizationProvider>
          {errors.time && <FormHelperText error>{errors.time}</FormHelperText>}
        </Grid>
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormControlLabel
              control={
                <Switch
                  checked={storeData.weeklyAllowanceEnabled === true}
                  onChange={handleWeeklyAllowanceToggle}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography variant="body1">주휴수당 지급</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {storeData.weeklyAllowanceEnabled
                      ? "주 15시간 이상 근무 시 주휴수당이 지급됩니다."
                      : "주휴수당을 지급하지 않습니다."}
                  </Typography>
                </Box>
              }
            />
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ mt: 5, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          size="large"
          sx={{ px: 4, py: 1 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "다음"}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default WizardStepStoreInfo;
