import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
  Alert,
  Snackbar,
  IconButton,
  Button,
} from "@mui/material";
import { Store, Employee, SetupWizardState } from "../../lib/types";
import WizardStepStoreInfo from "./WizardStepStoreInfo";
import WizardStepWorkingHours from "./WizardStepWorkingHours";
import WizardStepAddEmployees from "./WizardStepAddEmployees";
import WizardStepReview from "./WizardStepReview";
import { saveStoreSetup } from "../../services/api"; // 모킹 API 서비스
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";

// 스텝 이름
const steps = ["지점 정보", "영업 시간", "알바생 등록", "설정 검토"];

function Wizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewStoreMode = searchParams.get("mode") === "new-store";
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 위자드 데이터 상태
  const [wizardData, setWizardData] = useState<SetupWizardState>({
    step: 0,
    storeInfo: {},
    workingHours: {
      openingHour: "",
      closingHour: "",
    },
    employees: [],
    initialSchedules: [],
  });

  // 데이터 업데이트 핸들러
  const handleUpdate = (data: Partial<SetupWizardState>) => {
    setWizardData((prev) => ({
      ...prev,
      ...data,
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
      const newStep = Math.max(0, prev - 1);
      handleUpdate({ step: newStep });
      return newStep;
    });
  };

  // 설정 완료 핸들러
  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      // 최종 지점 설정 데이터 구성
      const finalStoreData: Partial<Store> = {
        ...wizardData.storeInfo,
        openingHour: wizardData.workingHours.openingHour,
        closingHour: wizardData.workingHours.closingHour,
      };

      // API 호출 (여기서는 모킹 API)
      await saveStoreSetup({
        step: activeStep,
        storeInfo: finalStoreData,
        employees: wizardData.employees,
        workingHours: wizardData.workingHours,
        initialSchedules: [],
      });

      // 성공 메시지 표시
      setSnackbar({
        open: true,
        message: isNewStoreMode
          ? "새 매장이 성공적으로 추가되었습니다!"
          : "지점 설정이 완료되었습니다!",
        severity: "success",
      });

      // 짧은 지연 후 대시보드로 이동
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Setup failed:", error);
      setSnackbar({
        open: true,
        message: "지점 설정 중 오류가 발생했습니다. 다시 시도해주세요.",
        severity: "error",
      });
      setIsSubmitting(false);
    }
  };

  // 현재 단계에 해당하는 컴포넌트 렌더링
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <WizardStepStoreInfo
            data={wizardData.storeInfo}
            onUpdate={(data) => handleUpdate({ storeInfo: data })}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <WizardStepWorkingHours
            data={wizardData.workingHours}
            onUpdate={(data) => handleUpdate({ workingHours: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <WizardStepAddEmployees
            data={{ employees: wizardData.employees }}
            onUpdate={(data) => handleUpdate({ employees: data.employees })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
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
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ my: 4 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              onClick={() => navigate("/dashboard")}
              sx={{ mr: 1 }}
              aria-label="뒤로 가기"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: "medium", mb: 0 }}
            >
              {isNewStoreMode ? "새 매장 추가" : "지점 설정 마법사"}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate("/dashboard")}
            startIcon={<CloseIcon />}
          >
            취소
          </Button>
        </Box>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          {isNewStoreMode
            ? "새로운 매장 정보를 입력하여 추가해주세요."
            : "마네지 시작을 위한 지점 설정을 완료해주세요."}
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {renderStep()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Wizard;
