import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
} from "@mui/material";
import { Store, Employee } from "../../lib/types";
import StoreIcon from "@mui/icons-material/Store";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";

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
  isSubmitting?: boolean;
}

function WizardStepReview({
  data,
  onBack,
  onComplete,
  isSubmitting = false,
}: WizardStepReviewProps) {
  const { store, workingHours, employees } = data;

  // 결측치 확인
  const hasStoreData = store && store.name && store.address;
  const hasWorkingHours =
    workingHours && workingHours.openingHour && workingHours.closingHour;

  // 설정 완료 처리
  const handleComplete = () => {
    onComplete();
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
          설정 검토
        </Typography>
        <Typography variant="body1" sx={{ mb: 5 }}>
          입력하신 정보를 마지막으로 확인해주세요. 설정 완료 버튼을 누르면 지점
          설정이 완료됩니다.
        </Typography>

        <Grid container spacing={4}>
          {/* 지점 정보 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="지점 정보"
                avatar={
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <StoreIcon />
                  </Avatar>
                }
                action={
                  <Button size="small" onClick={onBack}>
                    수정
                  </Button>
                }
              />
              <Divider />
              <CardContent>
                {hasStoreData ? (
                  <List dense disablePadding>
                    <ListItem>
                      <ListItemText primary="지점명" secondary={store.name} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="주소" secondary={store.address} />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="전화번호"
                        secondary={store.phoneNumber || "미입력"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="기본 시급"
                        secondary={
                          store.baseHourlyRate
                            ? `₩${store.baseHourlyRate.toLocaleString()}`
                            : "미설정"
                        }
                      />
                    </ListItem>
                  </List>
                ) : (
                  <Typography color="error">
                    지점 정보가 입력되지 않았습니다
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 영업 시간 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="영업 시간"
                avatar={
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <AccessTimeIcon />
                  </Avatar>
                }
                action={
                  <Button size="small" onClick={onBack}>
                    수정
                  </Button>
                }
              />
              <Divider />
              <CardContent>
                {hasWorkingHours ? (
                  <Box sx={{ my: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      매일
                    </Typography>
                    <Typography variant="body1">
                      {workingHours.openingHour} - {workingHours.closingHour}
                    </Typography>
                  </Box>
                ) : (
                  <Typography color="error">
                    영업 시간이 설정되지 않았습니다
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  * 개별 요일별 영업시간은 설정 완료 후 변경 가능합니다
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 알바생 목록 */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="등록된 알바생"
                avatar={
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <PeopleIcon />
                  </Avatar>
                }
                action={
                  <Button size="small" onClick={onBack}>
                    수정
                  </Button>
                }
              />
              <Divider />
              <CardContent>
                {employees && employees.length > 0 ? (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {employees.map((employee, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {employee.name}
                            </Typography>
                            {employee.role && (
                              <Chip
                                label={employee.role}
                                size="small"
                                sx={{ mb: 1.5 }}
                              />
                            )}
                            <Typography variant="body2" color="text.secondary">
                              {employee.phoneNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {employee.email || "이메일 정보 없음"}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              시급: ₩{employee.hourlyRate?.toLocaleString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    등록된 알바생이 없습니다
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, display: "flex", justifyContent: "space-between" }}>
          <Button variant="outlined" onClick={onBack}>
            이전
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleComplete}
            disabled={isSubmitting}
            size="large"
          >
            {isSubmitting ? "처리 중..." : "설정 완료"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default WizardStepReview;
