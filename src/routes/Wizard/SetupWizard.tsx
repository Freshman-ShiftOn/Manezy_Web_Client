import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Container } from "@mui/material";
import Wizard from "./Wizard";
import { hasInitialSetup } from "../../services/api";

/**
 * 초기 설정 마법사 래퍼 컴포넌트
 * 초기 설정 상태를 확인하고 이미 설정되어 있으면 대시보드로 리디렉션합니다.
 */
function SetupWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // 초기 설정 상태 확인
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const isSetup = await hasInitialSetup();
        setInitialized(isSetup);
        setLoading(false);

        // 이미 설정되어 있으면 대시보드로 리디렉션
        if (isSetup) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Failed to check setup status:", error);
        setLoading(false);
      }
    };

    checkSetup();
  }, [navigate]);

  // 로딩 중 표시
  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <CircularProgress />
          <Box sx={{ mt: 2 }}>로딩 중...</Box>
        </Box>
      </Container>
    );
  }

  // 이미 초기화된 경우 대시보드로 리디렉션
  if (initialized) {
    return <Navigate to="/dashboard" replace />;
  }

  // 마법사 렌더링
  return <Wizard />;
}

export default SetupWizard;
