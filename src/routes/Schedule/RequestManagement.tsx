import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Badge,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Done as DoneIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import {
  getSubstituteRequests,
  getScheduleChangeRequests,
  getShiftApprovalRequests,
  updateSubstituteRequest,
  updateScheduleChangeRequest,
  updateShiftApprovalRequest,
  generateDummyData,
  getEmployees,
  createNotification,
} from "../../services/api";
import {
  SubstituteRequest,
  ScheduleChangeRequest,
  ShiftApprovalRequest,
  Employee,
} from "../../lib/types";

// 요청 유형 타입
type RequestTab = "substitute" | "change" | "approval";

const RequestManagement: React.FC = () => {
  // 상태 관리
  const [activeTab, setActiveTab] = useState<RequestTab>("substitute");
  const [substituteRequests, setSubstituteRequests] = useState<
    SubstituteRequest[]
  >([]);
  const [changeRequests, setChangeRequests] = useState<ScheduleChangeRequest[]>(
    []
  );
  const [approvalRequests, setApprovalRequests] = useState<
    ShiftApprovalRequest[]
  >([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 대화상자 상태
  const [detailDialog, setDetailDialog] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState("");

  // 데이터 로딩
  useEffect(() => {
    // 더미 데이터 생성 (실제 앱에서는 제거)
    generateDummyData();

    const loadAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 직원 데이터 로드
        const employeesData = await getEmployees();
        setEmployees(employeesData);

        // 모든 요청 데이터 로드
        const [subReqs, changeReqs, approvalReqs] = await Promise.all([
          getSubstituteRequests(),
          getScheduleChangeRequests(),
          getShiftApprovalRequests(),
        ]);

        setSubstituteRequests(subReqs);
        setChangeRequests(changeReqs);
        setApprovalRequests(approvalReqs);
      } catch (err) {
        console.error("요청 데이터 로딩 오류:", err);
        setError("요청 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setLoading(true);

    try {
      const [subReqs, changeReqs, approvalReqs] = await Promise.all([
        getSubstituteRequests(),
        getScheduleChangeRequests(),
        getShiftApprovalRequests(),
      ]);

      setSubstituteRequests(subReqs);
      setChangeRequests(changeReqs);
      setApprovalRequests(approvalReqs);
      setError(null);
    } catch (err) {
      console.error("새로고침 오류:", err);
      setError("새로고침 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (_: React.SyntheticEvent, newValue: RequestTab) => {
    setActiveTab(newValue);
  };

  // 요청 상세 보기
  const handleViewDetail = (request: any) => {
    setSelectedRequest(request);
    setDetailDialog(true);
  };

  // 응답 다이얼로그 열기
  const handleOpenResponse = (request: any) => {
    setSelectedRequest(request);
    setResponseDialog(true);
  };

  // 응답 제출 핸들러
  const handleSubmitResponse = async (
    status: "accepted" | "approved" | "rejected"
  ) => {
    if (!selectedRequest) return;

    try {
      setLoading(true);

      if (activeTab === "substitute") {
        // 대타 요청의 경우 'approved'가 아닌 'accepted' 상태만 사용
        const substituteStatus: "accepted" | "rejected" =
          status === "approved"
            ? "accepted"
            : status === "rejected"
            ? "rejected"
            : "accepted";

        await updateSubstituteRequest(selectedRequest.id, {
          status: substituteStatus,
          responseMessage,
        });

        // 대타 요청 목록 업데이트
        setSubstituteRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id
              ? { ...req, status: substituteStatus, responseMessage }
              : req
          )
        );

        // 알림 생성
        await createNotification({
          employeeId: selectedRequest.requesterId,
          type: "substituteRequest",
          title:
            substituteStatus === "accepted"
              ? "대타 요청이 승인되었습니다"
              : "대타 요청이 거절되었습니다",
          message:
            responseMessage ||
            (substituteStatus === "accepted"
              ? "대타 요청이 승인되었습니다."
              : "대타 요청이 거절되었습니다."),
          relatedEntityId: selectedRequest.id,
        });
      } else if (activeTab === "change") {
        await updateScheduleChangeRequest(selectedRequest.id, {
          status:
            status === "accepted" || status === "approved"
              ? "approved"
              : "rejected",
          response: responseMessage,
        });

        // 스케줄 변경 요청 목록 업데이트
        setChangeRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id
              ? {
                  ...req,
                  status:
                    status === "accepted" || status === "approved"
                      ? "approved"
                      : "rejected",
                  response: responseMessage,
                }
              : req
          )
        );

        // 알림 생성
        await createNotification({
          employeeId: selectedRequest.employeeId,
          type: "scheduleChange",
          title:
            status === "accepted" || status === "approved"
              ? "스케줄 변경 요청이 승인되었습니다"
              : "스케줄 변경 요청이 거절되었습니다",
          message:
            responseMessage ||
            (status === "accepted" || status === "approved"
              ? "스케줄 변경 요청이 승인되었습니다."
              : "스케줄 변경 요청이 거절되었습니다."),
          relatedEntityId: selectedRequest.id,
        });
      } else if (activeTab === "approval") {
        await updateShiftApprovalRequest(selectedRequest.id, {
          status:
            status === "accepted" || status === "approved"
              ? "approved"
              : "rejected",
          note: responseMessage,
          approvedTime: new Date().toISOString(),
        });

        // 근무 승인 요청 목록 업데이트
        setApprovalRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id
              ? {
                  ...req,
                  status:
                    status === "accepted" || status === "approved"
                      ? "approved"
                      : "rejected",
                  note: responseMessage,
                  approvedTime: new Date().toISOString(),
                }
              : req
          )
        );

        // 알림 생성
        await createNotification({
          employeeId: selectedRequest.employeeId,
          type: "approval",
          title:
            status === "accepted" || status === "approved"
              ? "근무 승인 요청이 승인되었습니다"
              : "근무 승인 요청이 거절되었습니다",
          message:
            responseMessage ||
            (status === "accepted" || status === "approved"
              ? "근무 승인 요청이 승인되었습니다."
              : "근무 승인 요청이 거절되었습니다."),
          relatedEntityId: selectedRequest.id,
        });
      }
    } catch (err) {
      console.error("요청 응답 제출 오류:", err);
      setError("요청 응답을 제출하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setResponseDialog(false);
      setDetailDialog(false);
      setResponseMessage("");
    }
  };

  // 직원 이름 가져오기
  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return "알 수 없음";
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : "알 수 없음";
  };

  // 상태별 색상 및 텍스트
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "warning", text: "대기 중" };
      case "accepted":
      case "approved":
        return { color: "success", text: "승인됨" };
      case "rejected":
        return { color: "error", text: "거절됨" };
      case "cancelled":
        return { color: "default", text: "취소됨" };
      default:
        return { color: "default", text: "알 수 없음" };
    }
  };

  // 대타 요청 목록 렌더링
  const renderSubstituteRequests = () => {
    if (substituteRequests.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          대타 요청이 없습니다.
        </Alert>
      );
    }

    return (
      <List>
        {substituteRequests.map((request) => {
          const { color, text } = getStatusInfo(request.status);

          return (
            <Paper
              key={request.id}
              elevation={1}
              sx={{ mb: 1, borderRadius: 1 }}
            >
              <ListItem
                sx={{ borderLeft: 3, borderColor: `${color}.main` }}
                secondaryAction={
                  request.status === "pending" ? (
                    <Box>
                      <Button
                        color="success"
                        size="small"
                        onClick={() => handleOpenResponse(request)}
                        sx={{ mr: 1 }}
                      >
                        승인
                      </Button>
                      <Button
                        color="error"
                        size="small"
                        onClick={() => handleOpenResponse(request)}
                      >
                        거절
                      </Button>
                    </Box>
                  ) : (
                    <Chip
                      label={text}
                      color={color as any}
                      size="small"
                      variant="outlined"
                    />
                  )
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        {getEmployeeName(request.requesterId)}의 대타 요청
                      </Typography>
                      {request.substituteId && (
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          → {getEmployeeName(request.substituteId)}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        요청일:{" "}
                        {format(
                          new Date(request.createdAt),
                          "yyyy/MM/dd HH:mm"
                        )}
                      </Typography>
                      {request.reason && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          사유: {request.reason}
                        </Typography>
                      )}
                    </Box>
                  }
                  onClick={() => handleViewDetail(request)}
                  sx={{ cursor: "pointer" }}
                />
              </ListItem>
            </Paper>
          );
        })}
      </List>
    );
  };

  // 스케줄 변경 요청 목록 렌더링
  const renderChangeRequests = () => {
    if (changeRequests.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          스케줄 변경 요청이 없습니다.
        </Alert>
      );
    }

    return (
      <List>
        {changeRequests.map((request) => {
          const { color, text } = getStatusInfo(request.status);

          return (
            <Paper
              key={request.id}
              elevation={1}
              sx={{ mb: 1, borderRadius: 1 }}
            >
              <ListItem
                sx={{ borderLeft: 3, borderColor: `${color}.main` }}
                secondaryAction={
                  request.status === "pending" ? (
                    <Box>
                      <Button
                        color="success"
                        size="small"
                        onClick={() => handleOpenResponse(request)}
                        sx={{ mr: 1 }}
                      >
                        승인
                      </Button>
                      <Button
                        color="error"
                        size="small"
                        onClick={() => handleOpenResponse(request)}
                      >
                        거절
                      </Button>
                    </Box>
                  ) : (
                    <Chip
                      label={text}
                      color={color as any}
                      size="small"
                      variant="outlined"
                    />
                  )
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        {getEmployeeName(request.employeeId)}의{" "}
                        {request.requestType === "timeChange"
                          ? "시간 변경"
                          : request.requestType === "dateChange"
                          ? "날짜 변경"
                          : "취소"}{" "}
                        요청
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        현재:{" "}
                        {format(new Date(request.currentStart), "MM/dd HH:mm")}{" "}
                        ~ {format(new Date(request.currentEnd), "HH:mm")}
                      </Typography>
                      {request.requestedStart && request.requestedEnd && (
                        <Typography variant="caption" display="block">
                          변경:{" "}
                          {format(
                            new Date(request.requestedStart),
                            "MM/dd HH:mm"
                          )}{" "}
                          ~ {format(new Date(request.requestedEnd), "HH:mm")}
                        </Typography>
                      )}
                      {request.reason && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          사유: {request.reason}
                        </Typography>
                      )}
                    </Box>
                  }
                  onClick={() => handleViewDetail(request)}
                  sx={{ cursor: "pointer" }}
                />
              </ListItem>
            </Paper>
          );
        })}
      </List>
    );
  };

  // 근무 승인 요청 목록 렌더링
  const renderApprovalRequests = () => {
    if (approvalRequests.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          근무 승인 요청이 없습니다.
        </Alert>
      );
    }

    return (
      <List>
        {approvalRequests.map((request) => {
          const { color, text } = getStatusInfo(request.status);

          return (
            <Paper
              key={request.id}
              elevation={1}
              sx={{ mb: 1, borderRadius: 1 }}
            >
              <ListItem
                sx={{ borderLeft: 3, borderColor: `${color}.main` }}
                secondaryAction={
                  request.status === "pending" ? (
                    <Box>
                      <Button
                        color="success"
                        size="small"
                        onClick={() => handleOpenResponse(request)}
                        sx={{ mr: 1 }}
                      >
                        승인
                      </Button>
                      <Button
                        color="error"
                        size="small"
                        onClick={() => handleOpenResponse(request)}
                      >
                        거절
                      </Button>
                    </Box>
                  ) : (
                    <Chip
                      label={text}
                      color={color as any}
                      size="small"
                      variant="outlined"
                    />
                  )
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <TimeIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        {getEmployeeName(request.employeeId)}의 근무 승인 요청
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        근무 시간:{" "}
                        {format(
                          new Date(
                            request.actualStart || request.submittedTime
                          ),
                          "MM/dd HH:mm"
                        )}{" "}
                        ~
                        {request.actualEnd
                          ? format(new Date(request.actualEnd), " HH:mm")
                          : " (진행 중)"}
                      </Typography>
                      <Typography variant="caption" display="block">
                        요청일:{" "}
                        {format(
                          new Date(request.submittedTime),
                          "yyyy/MM/dd HH:mm"
                        )}
                      </Typography>
                    </Box>
                  }
                  onClick={() => handleViewDetail(request)}
                  sx={{ cursor: "pointer" }}
                />
              </ListItem>
            </Paper>
          );
        })}
      </List>
    );
  };

  // 로딩 상태 표시
  if (
    loading &&
    !substituteRequests.length &&
    !changeRequests.length &&
    !approvalRequests.length
  ) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{ ml: 2 }}
        >
          다시 시도
        </Button>
      </Alert>
    );
  }

  return (
    <Paper elevation={0} sx={{ height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          px: 2,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="요청 관리 탭"
        >
          <Tab
            label={
              <Badge
                badgeContent={
                  substituteRequests.filter((r) => r.status === "pending")
                    .length
                }
                color="error"
                max={99}
              >
                <Typography variant="body2">대타 요청</Typography>
              </Badge>
            }
            value="substitute"
          />
          <Tab
            label={
              <Badge
                badgeContent={
                  changeRequests.filter((r) => r.status === "pending").length
                }
                color="error"
                max={99}
              >
                <Typography variant="body2">스케줄 변경</Typography>
              </Badge>
            }
            value="change"
          />
          <Tab
            label={
              <Badge
                badgeContent={
                  approvalRequests.filter((r) => r.status === "pending").length
                }
                color="error"
                max={99}
              >
                <Typography variant="body2">근무 승인</Typography>
              </Badge>
            }
            value="approval"
          />
        </Tabs>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 0, height: "calc(100% - 48px)", overflow: "auto" }}>
        {activeTab === "substitute" && renderSubstituteRequests()}
        {activeTab === "change" && renderChangeRequests()}
        {activeTab === "approval" && renderApprovalRequests()}
      </Box>

      {/* 상세 보기 대화상자 */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {activeTab === "substitute" && "대타 요청 상세"}
          {activeTab === "change" && "스케줄 변경 요청 상세"}
          {activeTab === "approval" && "근무 승인 요청 상세"}
          <IconButton
            aria-label="close"
            onClick={() => setDetailDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedRequest && (
            <Box>
              {activeTab === "substitute" && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    {getEmployeeName(selectedRequest.requesterId)}의 대타 요청
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="body2" sx={{ mt: 2 }}>
                    <strong>요청 상태:</strong>{" "}
                    <Chip
                      label={getStatusInfo(selectedRequest.status).text}
                      color={getStatusInfo(selectedRequest.status).color as any}
                      size="small"
                    />
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>요청 일시:</strong>{" "}
                    {format(
                      new Date(selectedRequest.createdAt),
                      "yyyy/MM/dd HH:mm"
                    )}
                  </Typography>

                  {selectedRequest.substituteId && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>대타:</strong>{" "}
                      {getEmployeeName(selectedRequest.substituteId)}
                    </Typography>
                  )}

                  {selectedRequest.reason && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>요청 사유:</strong>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          mt: 0.5,
                        }}
                      >
                        {selectedRequest.reason}
                      </Box>
                    </Typography>
                  )}

                  {selectedRequest.responseMessage && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>응답 메시지:</strong>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          mt: 0.5,
                        }}
                      >
                        {selectedRequest.responseMessage}
                      </Box>
                    </Typography>
                  )}
                </>
              )}

              {activeTab === "change" && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    {getEmployeeName(selectedRequest.employeeId)}의 스케줄 변경
                    요청
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="body2" sx={{ mt: 2 }}>
                    <strong>요청 유형:</strong>{" "}
                    {selectedRequest.requestType === "timeChange"
                      ? "시간 변경"
                      : selectedRequest.requestType === "dateChange"
                      ? "날짜 변경"
                      : "취소"}
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>요청 상태:</strong>{" "}
                    <Chip
                      label={getStatusInfo(selectedRequest.status).text}
                      color={getStatusInfo(selectedRequest.status).color as any}
                      size="small"
                    />
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>요청 일시:</strong>{" "}
                    {format(
                      new Date(selectedRequest.createdAt),
                      "yyyy/MM/dd HH:mm"
                    )}
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 2 }}>
                    <strong>현재 근무 시간:</strong>
                    <br />
                    {format(
                      new Date(selectedRequest.currentStart),
                      "yyyy/MM/dd HH:mm"
                    )}{" "}
                    ~ {format(new Date(selectedRequest.currentEnd), "HH:mm")}
                  </Typography>

                  {selectedRequest.requestedStart &&
                    selectedRequest.requestedEnd && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>요청 근무 시간:</strong>
                        <br />
                        {format(
                          new Date(selectedRequest.requestedStart),
                          "yyyy/MM/dd HH:mm"
                        )}{" "}
                        ~{" "}
                        {format(
                          new Date(selectedRequest.requestedEnd),
                          "HH:mm"
                        )}
                      </Typography>
                    )}

                  {selectedRequest.reason && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>요청 사유:</strong>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          mt: 0.5,
                        }}
                      >
                        {selectedRequest.reason}
                      </Box>
                    </Typography>
                  )}

                  {selectedRequest.response && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>응답 메시지:</strong>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          mt: 0.5,
                        }}
                      >
                        {selectedRequest.response}
                      </Box>
                    </Typography>
                  )}
                </>
              )}

              {activeTab === "approval" && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    {getEmployeeName(selectedRequest.employeeId)}의 근무 승인
                    요청
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="body2" sx={{ mt: 2 }}>
                    <strong>요청 상태:</strong>{" "}
                    <Chip
                      label={getStatusInfo(selectedRequest.status).text}
                      color={getStatusInfo(selectedRequest.status).color as any}
                      size="small"
                    />
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>요청 일시:</strong>{" "}
                    {format(
                      new Date(selectedRequest.submittedTime),
                      "yyyy/MM/dd HH:mm"
                    )}
                  </Typography>

                  {selectedRequest.actualStart && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>실제 출근 시간:</strong>{" "}
                      {format(
                        new Date(selectedRequest.actualStart),
                        "yyyy/MM/dd HH:mm"
                      )}
                    </Typography>
                  )}

                  {selectedRequest.actualEnd && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>실제 퇴근 시간:</strong>{" "}
                      {format(
                        new Date(selectedRequest.actualEnd),
                        "yyyy/MM/dd HH:mm"
                      )}
                    </Typography>
                  )}

                  {selectedRequest.approvedTime && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>승인 일시:</strong>{" "}
                      {format(
                        new Date(selectedRequest.approvedTime),
                        "yyyy/MM/dd HH:mm"
                      )}
                    </Typography>
                  )}

                  {selectedRequest.note && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>메모:</strong>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          mt: 0.5,
                        }}
                      >
                        {selectedRequest.note}
                      </Box>
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>닫기</Button>
          {selectedRequest && selectedRequest.status === "pending" && (
            <>
              <Button
                color="success"
                onClick={() => handleOpenResponse(selectedRequest)}
                startIcon={<DoneIcon />}
              >
                승인
              </Button>
              <Button
                color="error"
                onClick={() => handleOpenResponse(selectedRequest)}
                startIcon={<CloseIcon />}
              >
                거절
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* 응답 대화상자 */}
      <Dialog
        open={responseDialog}
        onClose={() => setResponseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {activeTab === "substitute" && selectedRequest && (
            <>
              {getEmployeeName(selectedRequest.requesterId)}의 대타 요청에 응답
            </>
          )}
          {activeTab === "change" && selectedRequest && (
            <>
              {getEmployeeName(selectedRequest.employeeId)}의 스케줄 변경 요청에
              응답
            </>
          )}
          {activeTab === "approval" && selectedRequest && (
            <>
              {getEmployeeName(selectedRequest.employeeId)}의 근무 승인 요청에
              응답
            </>
          )}
        </DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="response"
            label="응답 메시지"
            fullWidth
            multiline
            rows={4}
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            placeholder="응답 메시지를 입력하세요 (선택 사항)"
            variant="outlined"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setResponseDialog(false)}>취소</Button>
          <Button
            color="success"
            onClick={() => handleSubmitResponse("accepted")}
            startIcon={<DoneIcon />}
          >
            승인
          </Button>
          <Button
            color="error"
            onClick={() => handleSubmitResponse("rejected")}
            startIcon={<CloseIcon />}
          >
            거절
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RequestManagement;
