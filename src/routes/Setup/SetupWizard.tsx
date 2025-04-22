import React, { useState, useEffect } from "react";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { generateDummyData, LS_KEYS, saveStoreSetup } from "../../services/api";
import { Store, Employee, SetupWizardState } from "../../lib/types";
import { isValid, parse, format } from "date-fns";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import WizardStepStoreInfo from "./WizardSteps/WizardStepStoreInfo";
import WizardStepEmployees from "./WizardSteps/WizardStepEmployees";
import WizardStepReview from "./WizardSteps/WizardStepReview";

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
  const [searchParams] = useSearchParams();
  const isNewStoreMode = searchParams.get("mode") === "new-store";
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 마법사 데이터 상태
  const [wizardData, setWizardData] = useState<SetupWizardState>({
    step: 0,
    storeInfo: {
      name: "",
      address: "",
      phoneNumber: "",
      baseHourlyRate: DEFAULT_HOURLY_RATE,
      openingHour: "08:00",
      closingHour: "22:00",
      weeklyHolidayHoursThreshold: 15,
    },
    workingHours: {
      openingHour: "08:00",
      closingHour: "22:00",
    },
    employees: [
      {
        id: `emp-${Date.now()}`,
        name: "",
        phoneNumber: "",
        role: "바리스타",
        hourlyRate: DEFAULT_HOURLY_RATE,
        status: "active",
      },
    ],
    initialSchedules: [],
  });

  // 오류 및 알림 상태
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  // 스토어가 이미 설정되어 있는지 확인
  useEffect(() => {
    const checkSetup = () => {
      try {
        const setupComplete = localStorage.getItem(LS_KEYS.SETUP_COMPLETE);
        const storeData = localStorage.getItem(LS_KEYS.STORE);

        // 이미 설정이 완료되었고 새 매장 모드가 아닌 경우 대시보드로 리디렉션
        if (setupComplete && storeData && !isNewStoreMode) {
          navigate("/dashboard");
          return;
        }

        // 이미 존재하는 매장 데이터가 있으면 로드
        if (storeData && isNewStoreMode) {
          const store = JSON.parse(storeData) as Store;
          setWizardData((prev) => ({
            ...prev,
            storeInfo: {
              ...store,
              id: undefined, // 새 매장이므로 ID 제거
              name: `${store.name} (추가 지점)`, // 기본 이름 제안
            },
            workingHours: {
              openingHour: store.openingHour,
              closingHour: store.closingHour,
            },
          }));
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error checking setup:", error);
        setSnackbarMessage("설정 확인 중 오류가 발생했습니다.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setIsInitialized(true);
      }
    };

    checkSetup();
  }, [navigate, isNewStoreMode]);

  // 데이터 업데이트 핸들러
  const handleUpdate = (data: Partial<SetupWizardState>) => {
    setWizardData((prev) => ({
      ...prev,
      ...data,
      step: activeStep,
    }));
  };

  // 다음 단계로 이동
  const handleNext = () => {
    setActiveStep((prev) => {
      const newStep = prev + 1;
      handleUpdate({ step: newStep });
      return newStep;
    });
  };

  // 이전 단계로 이동
  const handleBack = () => {
    setActiveStep((prev) => {
      const newStep = prev - 1;
      handleUpdate({ step: newStep });
      return newStep;
    });
  };

  // 샘플 데이터 생성
  const handleGenerateSampleData = async () => {
    setLoading(true);
    try {
      await generateDummyData();
      setSnackbarMessage(
        "샘플 데이터가 생성되었습니다. 대시보드로 이동합니다."
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
      // 매장 정보 최종 병합
      const finalStoreData: Partial<Store> = {
        ...wizardData.storeInfo,
        openingHour: wizardData.workingHours.openingHour,
        closingHour: wizardData.workingHours.closingHour,
      };

      // API 호출 (실제 저장)
      await saveStoreSetup({
        step: activeStep,
        storeInfo: finalStoreData,
        employees: wizardData.employees,
        workingHours: wizardData.workingHours,
        initialSchedules: [],
      });

      setSnackbarMessage(
        isNewStoreMode
          ? "새 매장이 성공적으로 추가되었습니다!"
          : "매장 설정이 완료되었습니다. 대시보드로 이동합니다."
      );
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
          <WizardStepStoreInfo
            data={wizardData.storeInfo}
            onUpdate={(storeInfo) => handleUpdate({ storeInfo })}
            onNext={handleNext}
          />
        );

      case 1:
        return (
          <WizardStepEmployees
            data={{ employees: wizardData.employees }}
            baseHourlyRate={
              wizardData.storeInfo.baseHourlyRate || DEFAULT_HOURLY_RATE
            }
            onUpdate={(data) => handleUpdate({ employees: data.employees })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 2:
        return (
          <WizardStepReview
            data={{
              store: wizardData.storeInfo,
              workingHours: wizardData.workingHours,
              employees: wizardData.employees,
            }}
            onUpdate={handleUpdate}
            onBack={handleBack}
            onComplete={handleComplete}
            onSampleData={handleGenerateSampleData}
            isSubmitting={loading}
          />
        );

      default:
        return null;
    }
  };

  // 초기화가 완료되지 않은 경우 로딩 표시
  if (!isInitialized) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>마법사 초기화 중...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            {isNewStoreMode ? "새 매장 추가 마법사" : "매장 설정 마법사"}
          </Typography>
          <Typography align="center" color="text.secondary">
            {isNewStoreMode
              ? "새로운 매장을 추가하고 설정해보세요"
              : "새 매장을 설정하고 바로 시작해보세요"}
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
