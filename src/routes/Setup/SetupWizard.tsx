import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Button,
  Typography,
  Snackbar,
  Alert,
  StepButton,
  useTheme,
  useMediaQuery,
  styled,
  Grid,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Store, Employee } from "../../lib/types";
import { LS_KEYS } from "../../services/api";
import WizardStepStoreInfo from "./WizardSteps/WizardStepStoreInfo";
import WizardStepEmployees from "./WizardSteps/WizardStepEmployees";
import WizardStepComplete from "./WizardSteps/WizardStepComplete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// 스타일링된 컴포넌트
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(1.5),
  boxShadow: "0px 3px 15px rgba(0, 0, 0, 0.08)",
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(5),
  overflow: "hidden",
}));

const WizardHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(2),
  },
}));

const StepperContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(3),
  },
}));

// 스텝 정의
const steps = [
  {
    label: "매장 정보",
    description: "기본 매장 정보를 설정합니다.",
  },
  {
    label: "직원 등록",
    description: "직원 정보를 등록합니다.",
  },
  {
    label: "설정 완료",
    description: "지점 설정이 완료되었습니다.",
  },
];

export default function SetupWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "info" | "success" | "error" | "warning",
  });
  const [storeData, setStoreData] = useState<Partial<Store>>({});
  const [employees, setEmployees] = useState<Partial<Employee>[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // LS_KEYS.STORE에서 기존 데이터 로드
  useEffect(() => {
    const storedData = localStorage.getItem(LS_KEYS.STORE);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setStoreData(parsedData);
      } catch (e) {
        console.error("Store data parsing failed:", e);
      }
    }
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step: number) => {
    if (step < activeStep) {
      setActiveStep(step);
    }
  };

  const handleStoreUpdate = (data: Partial<Store>) => {
    setStoreData(data);
    localStorage.setItem(LS_KEYS.STORE, JSON.stringify(data));
  };

  const handleEmployeesUpdate = (data: { employees: Partial<Employee>[] }) => {
    setEmployees(data.employees);
  };

  const handleSetupComplete = () => {
    localStorage.setItem(LS_KEYS.SETUP_COMPLETE, "true");
    setSnackbar({
      open: true,
      message: "설정이 성공적으로 완료되었습니다.",
      severity: "success",
    });

    // 잠시 후 대시보드로 이동
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <WizardStepStoreInfo
            data={storeData}
            onUpdate={handleStoreUpdate}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <WizardStepEmployees
            data={{ employees: employees }}
            baseHourlyRate={storeData.baseHourlyRate || 9860}
            onUpdate={handleEmployeesUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <WizardStepComplete
            storeData={storeData}
            employees={employees}
            onComplete={handleSetupComplete}
          />
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <Container maxWidth="md">
      <WizardHeader>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="600"
          sx={{ mb: 1, pt: 3 }}
        >
          지점 설정 마법사
        </Typography>
        <Typography variant="body1" color="text.secondary">
          매장을 관리하기 위한 기본 정보를 설정합니다. 이 정보는 나중에 변경할
          수 있습니다.
        </Typography>
      </WizardHeader>

      <StepperContainer>
        {isMobile ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
              p: 2,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography variant="body1" fontWeight={500}>
              {`${activeStep + 1} / ${steps.length}: ${
                steps[activeStep].label
              }`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {steps[activeStep].description}
            </Typography>
          </Box>
        ) : (
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.label} completed={activeStep > index}>
                <StepButton
                  onClick={() => handleStepClick(index)}
                  disabled={index > activeStep}
                >
                  <StepLabel
                    StepIconProps={{
                      icon:
                        activeStep > index ? (
                          <CheckCircleIcon color="primary" />
                        ) : (
                          index + 1
                        ),
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={500}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </StepButton>
              </Step>
            ))}
          </Stepper>
        )}
      </StepperContainer>

      <StyledPaper elevation={1}>{getStepContent(activeStep)}</StyledPaper>

      {activeStep !== 0 && activeStep !== 2 && (
        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 4 }}>
          <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
            이전
          </Button>
        </Box>
      )}

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
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
