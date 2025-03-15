import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Container, Typography } from "@mui/material";
import Wizard from "./Wizard";
import { hasInitialSetup, getStoreInfo } from "../../services/api";

/**
 * 초기 설정 마법사 래퍼 컴포넌트
 * 초기 설정 상태를 확인하고 이미 설정되어 있으면 대시보드로 리디렉션합니다.
 */
function SetupWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // 초기 설정 상태 재확인
  useEffect(() => {
    const checkSetup = async () => {
      try {
        setLoading(true);
        const isSetup = await hasInitialSetup();

        if (isSetup) {
          // 지점 정보 유효성 추가 확인
          const storeInfo = await getStoreInfo();
          if (storeInfo && storeInfo.id) {
            console.log("이미 지점 설정이 완료되었습니다:", storeInfo);
            setInitialized(true);
            setLoading(false);
            return;
          }
        }

        // 지점 설정이 필요한 경우
        setInitialized(false);
        setLoading(false);
      } catch (error) {
        console.error("지점 설정 상태 확인 실패:", error);
        setInitialized(false);
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
          <Box sx={{ mt: 2 }}>지점 설정 상태 확인 중...</Box>
        </Box>
      </Container>
    );
  }

  // 이미 초기화된 경우 대시보드로 리디렉션
  if (initialized) {
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
          <Typography variant="h5" gutterBottom>
            이미 지점 설정이 완료되었습니다
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              잠시 후 대시보드로 이동합니다...
            </Typography>
          </Box>
          {/* 대시보드로 리다이렉트 */}
          {setTimeout(() => navigate("/dashboard"), 2000) && null}
        </Box>
      </Container>
    );
  }

  // 마법사 렌더링
  return (
    <Container maxWidth="md">
      <Wizard />
    </Container>
  );
}

export default SetupWizard;
