import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Divider,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { Store, Employee } from "../../../lib/types";
import { People as PeopleIcon } from "@mui/icons-material";

interface WizardStepReviewProps {
  data: {
    store: Partial<Store>;
    workingHours: {
      openingHour: string;
      closingHour: string;
    };
    employees: Partial<Employee>[];
  };
  onUpdate: (data: any) => void;
  onBack: () => void;
  onComplete: () => void;
  onSampleData: () => void;
  isSubmitting?: boolean;
}

function WizardStepReview({
  data,
  onBack,
  onComplete,
  onSampleData,
  isSubmitting = false,
}: WizardStepReviewProps) {
  const { store, workingHours, employees } = data;

  // 결측치 확인
  const hasStoreData = store && store.name && store.address;
  const hasWorkingHours =
    workingHours && workingHours.openingHour && workingHours.closingHour;
  const hasEmployees = employees && employees.length > 0;

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        설정 내용을 확인해주세요
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        입력한 정보를 검토하고 설정을 완료합니다. 모든 정보는 나중에 설정
        메뉴에서 변경할 수 있습니다.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardHeader
              title="매장 정보"
              titleTypographyProps={{ variant: "subtitle1" }}
              sx={{ pb: 1 }}
            />
            <Divider />
            <CardContent>
              {hasStoreData ? (
                <>
                  <Typography variant="body1" fontWeight="bold">
                    {store.name}
                  </Typography>
                  <Typography variant="body2">주소: {store.address}</Typography>
                  <Typography variant="body2">
                    전화번호: {store.phoneNumber}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2">
                    영업시간: {workingHours.openingHour} -{" "}
                    {workingHours.closingHour}
                  </Typography>
                  <Typography variant="body2">
                    기본 시급: {store.baseHourlyRate?.toLocaleString()}원
                  </Typography>
                  <Typography variant="body2">
                    주휴수당 기준: 주 {store.weeklyHolidayHoursThreshold}시간
                    이상
                  </Typography>
                </>
              ) : (
                <Typography color="error">
                  매장 정보가 완전하지 않습니다.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardHeader
              title="직원 정보"
              titleTypographyProps={{ variant: "subtitle1" }}
              avatar={<PeopleIcon color="primary" />}
              sx={{ pb: 1 }}
            />
            <Divider />
            <CardContent>
              {hasEmployees ? (
                <List dense disablePadding>
                  {employees.map((employee, index) => (
                    <React.Fragment key={employee.id || index}>
                      <ListItem disablePadding sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={employee.name}
                          secondary={
                            <>
                              {employee.role} ·{" "}
                              {employee.hourlyRate?.toLocaleString()}원/시간
                              <br />
                              {employee.phoneNumber}
                            </>
                          }
                        />
                      </ListItem>
                      {index < employees.length - 1 && (
                        <Divider component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="error">등록된 직원이 없습니다.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 5,
          bgcolor: "background.default",
          p: 3,
          textAlign: "center",
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          설정이 모두 완료되었습니다!
        </Typography>
        <Typography sx={{ mb: 3 }}>
          이제 다음 중 하나를 선택하여 시작할 수 있습니다:
        </Typography>

        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={onComplete}
              disabled={isSubmitting}
              size="large"
              fullWidth
              sx={{ py: 1.5 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              ) : null}
              기본 설정으로 시작하기
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={onSampleData}
              disabled={isSubmitting}
              size="large"
              fullWidth
              sx={{ py: 1.5 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              ) : null}
              샘플 데이터로 시작하기
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-start" }}>
        <Button variant="outlined" onClick={onBack} disabled={isSubmitting}>
          이전
        </Button>
      </Box>
    </Box>
  );
}

export default WizardStepReview;
