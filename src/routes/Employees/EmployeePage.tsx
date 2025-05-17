// src/routes/Employees/EmployeePage.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Button,
  TextField,
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  TableContainer,
  ChipProps,
  Snackbar,
  InputAdornment,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Payment as PaymentIcon,
  SwapHoriz as SwapHorizIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  RefreshOutlined as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  PersonOutlined as StaffIcon,
  Settings as SettingsIcon,
  Coffee as CoffeeIcon,
  Restaurant as RestaurantIcon,
  LocalCafe as LocalCafeIcon,
  RoomService as RoomServiceIcon,
  Person as UserIcon,
  Group as GroupIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import {
  getBranchWorkers,
  createBranchWorker,
  updateBranchWorker,
  deleteBranchWorker,
  LS_KEYS,
} from "../../services/api";
import { useBranch } from "../../context/BranchContext";
import { alpha } from "@mui/material/styles";

// 서버에서 받아오는 직원 인터페이스 정의
interface BranchWorker {
  name: string;
  email: string;
  phoneNums: string;
  roles: string;
  status: string;
  cost: number;
  userId?: string; // 삭제 시 필요할 수 있음
}

function EmployeePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 브랜치 컨텍스트에서 현재 선택된 브랜치 정보 가져오기
  const {
    selectedBranchId,
    currentBranch,
    isLoading: branchLoading,
  } = useBranch();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<BranchWorker>>({
    name: "",
    phoneNums: "",
    email: "",
    cost: 9620,
    roles: "바리스타",
    status: "active",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | undefined>(
    undefined
  );

  // 상세 정보 팝업 상태
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<BranchWorker | null>(
    null
  );

  // 삭제 확인 팝업 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<BranchWorker | null>(
    null
  );

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const [apiWorkers, setApiWorkers] = useState<BranchWorker[]>([]);
  const [apiWorkerLoading, setApiWorkerLoading] = useState(false);

  // 관리자(사장)와 일반 직원 분리
  const [managerData, setManagerData] = useState<BranchWorker | null>(null);
  const [staffData, setStaffData] = useState<BranchWorker[]>([]);

  // 상태 필터링을 위한 상태 추가 (전체/재직 중만 유지)
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 필터링된 직원 데이터
  const filteredStaffData = useMemo(() => {
    if (statusFilter === "all") return staffData;
    return staffData.filter((worker) => worker.status === statusFilter);
  }, [staffData, statusFilter]);

  // 상태별 직원 수 계산 (전체/재직 중만 유지)
  const statusCount = useMemo(() => {
    const counts = {
      all: staffData.length,
      active: staffData.filter((worker) => worker.status === "active").length,
    };
    return counts;
  }, [staffData]);

  // 기본 역할 목록 및 커스텀 역할 상태 관리
  const [roles, setRoles] = useState<string[]>([
    "사장",
    "매니저",
    "바리스타",
    "홀 서빙",
    "주방",
    "일반 직원",
  ]);

  // 역할 관리 모달 상태
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // 사용 가능한 아이콘과 색상 목록 제거

  // 브랜치 직원 데이터 로드
  const loadBranchWorkers = async (branchId: number | string) => {
    if (!branchId) return;

    setApiWorkerLoading(true);
    console.group("직원 목록 로드");
    console.log(
      `브랜치 ID ${branchId}의 직원 목록 로드 중... (타입: ${typeof branchId})`
    );

    try {
      // 인증 토큰 확인
      const token = localStorage.getItem(LS_KEYS.AUTH_TOKEN);
      if (!token) {
        throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
      }

      const workers = await getBranchWorkers(branchId);
      console.log(`브랜치 ID ${branchId}의 직원 목록:`, workers);
      setApiWorkers(workers);

      // 관리자와 일반 직원 분리
      const manager = workers.find(
        (worker) => worker.roles === "사장" || worker.roles === "매니저"
      );
      const staff = workers.filter(
        (worker) => worker.roles !== "사장" && worker.roles !== "매니저"
      );

      console.log("관리자:", manager || "없음");
      console.log("일반 직원:", staff.length, "명");

      setManagerData(manager || null);
      setStaffData(staff);

      setLoading(false);
      setApiWorkerLoading(false);
      setError(null);

      setSnackbar({
        open: true,
        message: `${currentBranch?.name || `브랜치(ID: ${branchId})`}의 직원 ${
          workers.length
        }명을 불러왔습니다.`,
        severity: "success",
      });
    } catch (apiError: any) {
      console.error(`브랜치 ID ${branchId}의 직원 목록 로드 실패:`, apiError);
      setLoading(false);
      setApiWorkerLoading(false);

      // 더 자세한 에러 메시지 표시
      const errorMessage =
        apiError.message || "직원 목록을 불러오는데 실패했습니다.";
      setError(errorMessage);

      // 인증 오류인 경우 로그인 관련 안내 메시지
      const isAuthError =
        errorMessage.includes("인증") ||
        errorMessage.includes("로그인") ||
        errorMessage.includes("토큰");

      setSnackbar({
        open: true,
        message: isAuthError
          ? "인증이 필요합니다. 로그인 페이지로 이동하세요."
          : errorMessage,
        severity: "error",
      });
    } finally {
      console.groupEnd();
    }
  };

  // 선택된 브랜치가 변경될 때마다 직원 목록 다시 불러오기
  useEffect(() => {
    console.log(
      "EmployeePage - 브랜치 변경 감지:",
      selectedBranchId,
      "로딩 상태:",
      branchLoading
    );

    if (selectedBranchId && !branchLoading) {
      // 문자열로 브랜치 ID 처리
      const branchIdStr = String(selectedBranchId);
      console.log(`브랜치 ID ${branchIdStr}의 직원 목록 로드 시작`);

      // 인증 토큰 디버깅
      try {
        const authToken = localStorage.getItem("manezy_auth_token");
        console.log("인증 토큰 상태:", authToken ? "존재함" : "없음");
        if (authToken) {
          console.log(
            "토큰 형식 검사:",
            authToken.split(".").length === 3
              ? "유효한 JWT 형식"
              : "유효하지 않은 형식"
          );
        }
      } catch (e) {
        console.error("토큰 확인 중 오류:", e);
      }

      // 직원 로딩 시도
      loadBranchWorkers(branchIdStr).catch((err) => {
        console.error("직원 로드 중 캐치된 오류:", err);
        setError(err.message || "직원 목록을 불러오는데 실패했습니다.");
        setSnackbar({
          open: true,
          message: err.message || "직원 목록을 불러오는데 실패했습니다.",
          severity: "error",
        });
      });
    }
  }, [selectedBranchId, branchLoading]);

  // 직원 추가 다이얼로그 열기
  const handleOpenDialog = () => {
    // 직원 추가 모드 (신규)
    setIsEditing(false);
    setEditingUserId(undefined);
    setNewEmployee({
      name: "",
      phoneNums: "",
      email: "",
      cost: 9620,
      roles: "바리스타",
      status: "active",
    });
    setDialogOpen(true);
  };

  // 사장 정보 수정 다이얼로그 열기
  const handleEditManager = () => {
    if (!managerData) return;

    setIsEditing(true);
    setEditingUserId(managerData.userId);
    setNewEmployee({
      name: managerData.name,
      phoneNums: managerData.phoneNums,
      email: managerData.email,
      cost: managerData.cost,
      roles: managerData.roles,
      status: managerData.status,
    });
    setDialogOpen(true);
  };

  // 직원 수정 다이얼로그 열기
  const handleEditEmployee = (employee: BranchWorker) => {
    // 인증 토큰 확인
    const token = localStorage.getItem(LS_KEYS.AUTH_TOKEN);
    if (!token) {
      setSnackbar({
        open: true,
        message: "인증 토큰이 없습니다. 로그인이 필요합니다.",
        severity: "error",
      });
      setError("인증 토큰이 없습니다. 로그인이 필요합니다.");
      return;
    }

    // 직원 수정 모드
    setIsEditing(true);
    setEditingUserId(employee.userId);
    setNewEmployee({
      name: employee.name,
      phoneNums: employee.phoneNums,
      email: employee.email,
      cost: employee.cost,
      roles: employee.roles,
      status: employee.status,
    });
    setDialogOpen(true);
  };

  // 시급 입력 핸들러 - 입력 UX 개선
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 현재 입력 값 (콤마가 있으면 제거)
    const rawValue = e.target.value.replace(/,/g, "");

    // 숫자만 허용하되, 빈 값도 허용
    if (rawValue !== "" && !/^\d*$/.test(rawValue)) {
      return; // 숫자가 아닌 경우 무시
    }

    // 빈 값이면 0으로 설정하여 텍스트 필드에 빈 값으로 표시
    if (!rawValue) {
      setNewEmployee({
        ...newEmployee,
        cost: 0, // 임시로 0 설정 (UI에는 빈 값으로 표시)
      });
      return;
    }

    // 숫자로 변환
    const numValue = parseInt(rawValue, 10);

    setNewEmployee({
      ...newEmployee,
      cost: numValue,
    });
  };

  // 시급을 통화 형식으로 포맷팅하는 함수
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("ko-KR") + "원";
  };

  // 포맷팅된 시급을 보여주는 함수 (화면에 표시용)
  const formatDisplayCost = (amount: number): string => {
    return amount.toLocaleString("ko-KR");
  };

  // 연락처 유효성 검사 함수
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // 한국 전화번호 형식 (010-XXXX-XXXX 또는 010XXXXXXXX 등)
    const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
    return phoneRegex.test(phoneNumber);
  };

  // 직원 추가/수정 핸들러
  const handleSaveEmployee = async () => {
    try {
      console.group("직원 저장 처리");
      console.log("저장 중인 직원 데이터:", newEmployee);
      console.log("수정 모드:", isEditing);
      console.log("브랜치 ID:", selectedBranchId);

      if (isEditing) {
        console.log("수정 중인 직원 ID:", editingUserId);
      }

      // 필수 필드 검증
      if (!newEmployee.name || !newEmployee.phoneNums) {
        console.warn("필수 필드 누락:", {
          name: newEmployee.name,
          phoneNums: newEmployee.phoneNums,
        });
        setSnackbar({
          open: true,
          message: "이름과 연락처는 필수 입력 항목입니다.",
          severity: "error",
        });
        console.groupEnd();
        return;
      }

      // 연락처 유효성 검사
      if (!validatePhoneNumber(newEmployee.phoneNums)) {
        console.warn("연락처 형식 오류:", newEmployee.phoneNums);
        setSnackbar({
          open: true,
          message: "유효한 연락처 형식이 아닙니다. (예: 010-1234-5678)",
          severity: "error",
        });
        console.groupEnd();
        return;
      }

      // 시급 유효성 검사 (입력된 경우 최저시급 이상인지 확인)
      if (newEmployee.cost > 0 && newEmployee.cost < 9620) {
        console.warn("최저시급 미만:", newEmployee.cost);
        setSnackbar({
          open: true,
          message: "시급은 최저시급(9,620원) 이상이어야 합니다.",
          severity: "error",
        });
        console.groupEnd();
        return;
      }

      if (!selectedBranchId) {
        console.warn("브랜치 ID 누락");
        setSnackbar({
          open: true,
          message: "브랜치가 선택되지 않았습니다.",
          severity: "error",
        });
        console.groupEnd();
        return;
      }

      // 인증 토큰 확인
      const token = localStorage.getItem(LS_KEYS.AUTH_TOKEN);
      if (!token) {
        setSnackbar({
          open: true,
          message: "인증 토큰이 없습니다. 로그인이 필요합니다.",
          severity: "error",
        });
        setError("인증 토큰이 없습니다. 로그인이 필요합니다.");
        console.groupEnd();
        return;
      }

      setApiWorkerLoading(true);

      // 시급 유효성 확인
      const finalCost = newEmployee.cost > 0 ? newEmployee.cost : 9620; // 빈 값이나 0인 경우 최저시급 사용

      if (isEditing) {
        // 기존 직원 수정 - userId 추가
        console.log(`직원 ${editingUserId} 정보 수정 시도`);

        // userId가 없으면 에러 표시
        if (!editingUserId) {
          console.error("수정 시 userId 누락");
          setSnackbar({
            open: true,
            message: "직원 ID가 누락되었습니다. 직원 정보를 다시 불러오세요.",
            severity: "error",
          });
          setApiWorkerLoading(false);
          console.groupEnd();
          return;
        }

        const updateData = {
          id: Number(editingUserId), // 서버 요구사항: ID를 숫자로 변환하여 추가
          name: newEmployee.name || "",
          phoneNums: newEmployee.phoneNums || "",
          email: newEmployee.email || "",
          cost: finalCost,
          roles: newEmployee.roles || "바리스타",
          status: newEmployee.status || "active",
          userId: editingUserId, // userId 추가
        };

        console.log("API 요청 데이터:", updateData);

        try {
          const updateResult = await updateBranchWorker(
            selectedBranchId,
            updateData
          );
          console.log("직원 정보 수정 응답:", updateResult);
        } catch (updateError: any) {
          console.error("직원 정보 수정 API 오류:", updateError);
          throw updateError; // 상위 catch 블록으로 전파
        }

        setSnackbar({
          open: true,
          message: `${
            newEmployee.roles === "사장" || newEmployee.roles === "매니저"
              ? "관리자"
              : "직원"
          } 정보가 수정되었습니다.`,
          severity: "success",
        });
      } else {
        // 새 직원 추가 - 기존 코드 유지
        const createData = {
          branchId: selectedBranchId,
          name: newEmployee.name || "",
          phoneNums: newEmployee.phoneNums || "",
          email: newEmployee.email || "",
          cost: finalCost,
          roles: newEmployee.roles || "바리스타",
          status: newEmployee.status || "active",
        };

        console.log("새 직원 추가 요청 데이터:", createData);

        try {
          const createResult = await createBranchWorker(createData);
          console.log("직원 추가 응답:", createResult);
        } catch (createError: any) {
          console.error("직원 추가 API 오류:", createError);
          throw createError; // 상위 catch 블록으로 전파
        }

        setSnackbar({
          open: true,
          message: "새 직원이 추가되었습니다.",
          severity: "success",
        });
      }

      // 직원 목록 새로고침
      console.log("직원 목록 새로고침 요청");
      await loadBranchWorkers(selectedBranchId);
      setDialogOpen(false);
      console.log("직원 저장 처리 완료");
      console.groupEnd();
    } catch (err: any) {
      console.error("직원 저장 중 오류:", err);
      setApiWorkerLoading(false);
      setSnackbar({
        open: true,
        message: err.message || "직원 정보 저장 중 오류가 발생했습니다.",
        severity: "error",
      });
      console.groupEnd();
    }
  };

  // 직원 삭제 확인 다이얼로그 열기
  const handleConfirmDelete = (employee: BranchWorker) => {
    console.group("직원 삭제 다이얼로그");
    console.log("삭제 예정 직원:", employee);
    console.log("직원 ID:", employee.userId);
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
    console.groupEnd();
  };

  // 직원 삭제 핸들러
  const handleDeleteEmployee = async () => {
    console.group("직원 삭제 처리");

    if (!employeeToDelete || !selectedBranchId || !employeeToDelete.userId) {
      console.error("삭제 필수 정보 누락:", {
        employeeToDelete: !!employeeToDelete,
        selectedBranchId,
        userId: employeeToDelete?.userId,
      });
      setSnackbar({
        open: true,
        message: "삭제할 직원 정보가 잘못되었습니다.",
        severity: "error",
      });
      console.groupEnd();
      return;
    }

    try {
      setApiWorkerLoading(true);
      console.log(
        `직원 삭제 시도: ${employeeToDelete.name}, ID: ${employeeToDelete.userId}`
      );
      console.log("브랜치 ID:", selectedBranchId);

      let result = false;
      try {
        result = await deleteBranchWorker(
          selectedBranchId,
          employeeToDelete.userId
        );
        console.log("삭제 API 응답:", result);
      } catch (deleteError: any) {
        console.error("삭제 API 호출 실패:", deleteError);
        // 디버깅 정보 더 자세히 기록
        console.error(
          "삭제 요청 URL:",
          `API_BASE_URL/api/branch/${selectedBranchId}/${employeeToDelete.userId}`
        );
        throw new Error(deleteError.message || "삭제 API 호출 실패"); // 상세 오류 메시지 포함
      }

      if (result) {
        // 직원 목록 새로고침
        console.log("직원 삭제 성공, 목록 새로고침");
        await loadBranchWorkers(selectedBranchId);

        setSnackbar({
          open: true,
          message: `${employeeToDelete.name} 직원이 삭제되었습니다.`,
          severity: "success",
        });
      } else {
        throw new Error(
          "직원 삭제 실패: 서버에서 성공 응답을 받지 못했습니다."
        );
      }
    } catch (error: any) {
      console.error("직원 삭제 중 오류 발생:", error);
      setSnackbar({
        open: true,
        message:
          error.message ||
          "직원 삭제 중 오류가 발생했습니다. 다시 시도해주세요.",
        severity: "error",
      });
    } finally {
      setApiWorkerLoading(false);
      setDeleteDialogOpen(false);
      console.log("직원 삭제 처리 종료");
      console.groupEnd();
    }
  };

  // 알바생 상태에 따른 색상 반환 (반환 타입 명시)
  const getStatusColor = (status: string): ChipProps["color"] => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      default:
        return "default";
    }
  };

  // 알바생 상태에 따른 한글 이름 반환
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "active":
        return "재직 중";
      case "inactive":
        return "퇴직/휴직";
      default:
        return status; // 서버에서 온 상태값 그대로 표시
    }
  };

  // 상세 정보 팝업 열기
  const handleOpenDetails = (employee: BranchWorker) => {
    setSelectedEmployee(employee);
    setDetailsOpen(true);
  };

  // 수동으로 직원 목록 새로고침
  const handleRefreshWorkers = () => {
    if (selectedBranchId) {
      loadBranchWorkers(selectedBranchId);
    } else {
      setSnackbar({
        open: true,
        message: "선택된 브랜치가 없습니다. 먼저 브랜치를 선택해주세요.",
        severity: "warning",
      });
    }
  };

  // 역할 수정 시작 핸들러
  const handleStartEditRole = (roleName: string) => {
    setEditingRole(roleName);
    setNewRoleName(roleName);
  };

  // 역할 수정 저장 핸들러
  const handleSaveEditRole = () => {
    if (newRoleName.trim() === "" || !editingRole) return;

    // 이름이 바뀌었고, 새 이름이 이미 존재하는 경우
    if (editingRole !== newRoleName && roles.includes(newRoleName)) {
      setSnackbar({
        open: true,
        message: `'${newRoleName}' 역할이 이미 존재합니다.`,
        severity: "warning",
      });
      return;
    }

    const updatedRoles = [...roles];
    const editIndex = updatedRoles.indexOf(editingRole);

    if (editIndex >= 0) {
      updatedRoles[editIndex] = newRoleName;
    }

    setRoles(updatedRoles);
    setEditingRole(null);
    setNewRoleName("");

    setSnackbar({
      open: true,
      message: `'${newRoleName}' 역할이 업데이트되었습니다.`,
      severity: "success",
    });
  };

  // 새 역할 추가 핸들러
  const handleAddRole = () => {
    if (newRoleName.trim() === "") return;

    // 이미 있는 역할인지 확인
    if (roles.includes(newRoleName)) {
      setSnackbar({
        open: true,
        message: `'${newRoleName}' 역할이 이미 존재합니다.`,
        severity: "warning",
      });
      return;
    }

    // 새 역할 추가
    setRoles([...roles, newRoleName]);
    setNewRoleName("");

    setSnackbar({
      open: true,
      message: `'${newRoleName}' 역할이 추가되었습니다.`,
      severity: "success",
    });
  };

  // 역할 삭제 핸들러
  const handleDeleteRole = (roleName: string) => {
    // 기본 역할 확인
    const isDefaultRole = [
      "사장",
      "매니저",
      "바리스타",
      "홀 서빙",
      "주방",
      "일반 직원",
    ].includes(roleName);

    // 현재 사용 중인 역할인지 확인
    const isRoleInUse = staffData.some((worker) => worker.roles === roleName);

    if (isRoleInUse) {
      setSnackbar({
        open: true,
        message: `'${roleName}' 역할은 현재 사용 중이므로 삭제할 수 없습니다.`,
        severity: "error",
      });
      return;
    }

    // 기본 역할은 삭제 불가
    if (isDefaultRole) {
      setSnackbar({
        open: true,
        message: "기본 역할은 삭제할 수 없습니다.",
        severity: "error",
      });
      return;
    }

    const updatedRoles = roles.filter((role) => role !== roleName);
    setRoles(updatedRoles);

    setSnackbar({
      open: true,
      message: `'${roleName}' 역할이 삭제되었습니다.`,
      severity: "success",
    });
  };

  // 역할에 대한 칩 컴포넌트 생성 (간소화된 버전)
  const RoleChip = ({ role }: { role: string }) => {
    return <Chip label={role} size="small" variant="outlined" />;
  };

  if (loading && branchLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          직원 관리
        </Typography>

        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshWorkers}
            sx={{ mr: 1 }}
          >
            새로고침
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            disabled={!selectedBranchId}
          >
            직원 추가
          </Button>
        </Box>
      </Box>

      {currentBranch && (
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{ mb: 3, color: "text.secondary" }}
        >
          {currentBranch.name} (ID: {selectedBranchId})
        </Typography>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                // 인증 관련 오류인 경우 로그인 페이지로 이동
                if (error.includes("인증") || error.includes("로그인")) {
                  window.location.href = "/login";
                } else {
                  setError(null);
                  if (selectedBranchId) {
                    handleRefreshWorkers();
                  }
                }
              }}
            >
              {error.includes("인증") || error.includes("로그인")
                ? "로그인 페이지로 이동"
                : "다시 시도"}
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {apiWorkerLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            직원 정보를 처리 중입니다...
          </Typography>
        </Box>
      ) : (
        <>
          {/* 사장(관리자) 정보 섹션 - 간략화된 버전 */}
          {managerData && (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <AdminIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  관리자 정보
                </Typography>
              </Box>

              <Paper sx={{ mb: 4, p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        이름
                      </Typography>
                      <Typography variant="body1">
                        {managerData.name}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        역할
                      </Typography>
                      <Chip
                        label={managerData.roles}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        이메일
                      </Typography>
                      <Typography variant="body1">
                        {managerData.email}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        연락처
                      </Typography>
                      <Typography variant="body1">
                        {managerData.phoneNums}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        height: "100%",
                        alignItems: "center",
                      }}
                    >
                      <Tooltip title="관리자 정보 수정">
                        <IconButton
                          onClick={handleEditManager}
                          size="small"
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}

          {/* 섹션 구분선 */}
          <Divider sx={{ my: 4 }} />

          {/* 직원 관리 섹션 헤더 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <StaffIcon sx={{ mr: 1, color: "info.main" }} />
              <Typography variant="h6" sx={{ mb: 0 }}>
                일반 직원 관리
              </Typography>
            </Box>
          </Box>

          {/* 상태별 직원 수 요약 - 간략화된 버전 */}
          {staffData.length > 0 && (
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <Chip
                label={`전체: ${statusCount.all}명`}
                onClick={() => setStatusFilter("all")}
                variant={statusFilter === "all" ? "filled" : "outlined"}
                sx={{ fontWeight: statusFilter === "all" ? "bold" : "normal" }}
              />
              <Chip
                label={`재직 중: ${statusCount.active}명`}
                color="success"
                onClick={() => setStatusFilter("active")}
                variant={statusFilter === "active" ? "filled" : "outlined"}
                sx={{
                  fontWeight: statusFilter === "active" ? "bold" : "normal",
                }}
              />
            </Box>
          )}

          {/* 일반 직원 목록 섹션 */}
          {statusFilter !== "all" && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              현재 재직 중인 직원만 표시하고 있습니다.
            </Typography>
          )}

          {staffData && staffData.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>이름</TableCell>
                    <TableCell>역할</TableCell>
                    <TableCell>이메일</TableCell>
                    <TableCell>연락처</TableCell>
                    <TableCell>시급</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell align="right">관리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaffData.map((worker, index) => (
                    <TableRow
                      key={index}
                      hover
                      // 퇴직/휴직 직원은 배경색으로 구분
                      sx={{
                        backgroundColor:
                          worker.status === "inactive"
                            ? "rgba(0, 0, 0, 0.04)"
                            : "inherit",
                        // 퇴직/휴직 직원은 텍스트를 연하게 표시
                        opacity: worker.status === "inactive" ? 0.7 : 1,
                      }}
                    >
                      <TableCell>{worker.name}</TableCell>
                      <TableCell>
                        <RoleChip role={worker.roles} />
                      </TableCell>
                      <TableCell>{worker.email}</TableCell>
                      <TableCell>{worker.phoneNums}</TableCell>
                      <TableCell>{formatCurrency(worker.cost)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(worker.status)}
                          color={getStatusColor(worker.status)}
                          size="small"
                          variant={
                            worker.status === "inactive" ? "outlined" : "filled"
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDetails(worker)}
                          sx={{ mr: 1 }}
                        >
                          <PersonIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditEmployee(worker)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleConfirmDelete(worker)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : selectedBranchId ? (
            <Alert severity="info" sx={{ mb: 4 }}>
              {currentBranch?.name || `브랜치(ID: ${selectedBranchId})`}에
              등록된 일반 직원이 없습니다.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 4 }}>
              먼저 상단에서 브랜치를 선택해주세요.
            </Alert>
          )}
        </>
      )}

      {/* 직원 추가/수정 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing
            ? newEmployee.roles === "사장" || newEmployee.roles === "매니저"
              ? "관리자 정보 수정"
              : "직원 정보 수정"
            : "새 직원 추가"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="이름"
                fullWidth
                required
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="연락처"
                fullWidth
                required
                value={newEmployee.phoneNums}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    phoneNums: e.target.value,
                  })
                }
                placeholder="010-0000-0000"
                helperText="하이픈(-)을 포함한 연락처를 입력해주세요"
                error={
                  newEmployee.phoneNums !== "" &&
                  !validatePhoneNumber(newEmployee.phoneNums)
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="이메일"
                fullWidth
                type="email"
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="시급"
                fullWidth
                // 사용자 입력 그대로 표시 (0이면 빈 값으로)
                value={newEmployee.cost === 0 ? "" : newEmployee.cost}
                onChange={handleCostChange}
                inputProps={{
                  inputMode: "numeric", // 모바일에서 숫자 키패드 표시
                }}
                helperText={
                  <span>
                    최저시급(9,620원) 이상{" • "}
                    <strong style={{ color: "#1976d2" }}>
                      {formatDisplayCost(newEmployee.cost || 9620)}원
                    </strong>
                    {newEmployee.cost > 0 && newEmployee.cost < 9620 && (
                      <span style={{ color: "red" }}> (최저시급 미만)</span>
                    )}
                  </span>
                }
                // 관리자인 경우 시급 수정 안내 추가
                disabled={false} // 이제 모든 직원의 시급 수정 가능
                // 표시 개선
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₩</InputAdornment>
                  ),
                }}
                error={newEmployee.cost > 0 && newEmployee.cost < 9620}
              />
              {isEditing &&
                (newEmployee.roles === "사장" ||
                  newEmployee.roles === "매니저") && (
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ mt: 0.5 }}
                  >
                    관리자는 더 높은 시급을 설정하는 것이 권장됩니다.
                  </Typography>
                )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>역할</InputLabel>
                <Select
                  label="역할"
                  value={newEmployee.roles}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, roles: e.target.value })
                  }
                  disabled={false} // 모든 직원의 역할 변경 가능
                  renderValue={(selected) => <RoleChip role={selected} />}
                >
                  {roles.map((role) => (
                    <MenuItem key={role} value={role}>
                      <RoleChip role={role} />
                    </MenuItem>
                  ))}
                </Select>
                <Box
                  sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => setRoleDialogOpen(true)}
                  >
                    역할 관리
                  </Button>
                </Box>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select
                  label="상태"
                  value={newEmployee.status}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      status: e.target.value,
                    })
                  }
                >
                  <MenuItem value="active">재직 중</MenuItem>
                  <MenuItem value="inactive">퇴직/휴직</MenuItem>
                </Select>
                <Typography variant="caption" sx={{ mt: 0.5, ml: 1.5 }}>
                  재직 중: 현재 근무 중인 직원 / 퇴직/휴직: 근무하지 않는 직원
                </Typography>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveEmployee}
          >
            {isEditing ? "저장" : "추가"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 직원 상세 정보 다이얼로그 */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
              <PersonIcon />
            </Avatar>
            <Typography variant="h6">
              {selectedEmployee?.name} 상세 정보
            </Typography>
            <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
              {selectedEmployee && (
                <Tooltip title="직원 정보 수정">
                  <IconButton
                    onClick={() => {
                      setDetailsOpen(false);
                      handleEditEmployee(selectedEmployee);
                    }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton onClick={() => setDetailsOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmployee ? (
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography>
                  <strong>역할:</strong> {selectedEmployee.roles || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>상태:</strong>{" "}
                  <Chip
                    label={getStatusLabel(selectedEmployee.status)}
                    color={getStatusColor(selectedEmployee.status)}
                    size="small"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>연락처:</strong> {selectedEmployee.phoneNums || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>이메일:</strong> {selectedEmployee.email || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <strong>시급:</strong> {formatCurrency(selectedEmployee.cost)}
                </Typography>
              </Grid>
              {selectedEmployee.userId && (
                <Grid item xs={12}>
                  <Typography>
                    <strong>사용자 ID:</strong> {selectedEmployee.userId}
                  </Typography>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography>선택된 직원이 없습니다.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 직원 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <DeleteIcon color="error" sx={{ mr: 1 }} />
            직원 삭제 확인
          </Box>
        </DialogTitle>
        <DialogContent>
          {employeeToDelete && (
            <>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                다음 직원을 정말 삭제하시겠습니까?
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Typography variant="body1" component="div">
                  <strong>이름:</strong> {employeeToDelete.name}
                </Typography>
                <Typography variant="body1" component="div">
                  <strong>역할:</strong> {employeeToDelete.roles}
                </Typography>
                <Typography variant="body1" component="div">
                  <strong>연락처:</strong> {employeeToDelete.phoneNums}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block" }}
              >
                이 작업은 되돌릴 수 없으며, 해당 직원의 모든 정보가 삭제됩니다.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            취소
          </Button>
          <Button
            onClick={handleDeleteEmployee}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            disabled={apiWorkerLoading}
          >
            {apiWorkerLoading ? "삭제 중..." : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 역할 관리 모달 - 간소화된 버전 */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">역할 관리</Typography>
            <IconButton onClick={() => setRoleDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              역할 추가
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                label="역할 이름"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="예: 매장관리"
                size="small"
              />
              <Button
                variant="contained"
                onClick={editingRole ? handleSaveEditRole : handleAddRole}
                disabled={!newRoleName.trim()}
              >
                {editingRole ? "저장" : "추가"}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            역할 목록
          </Typography>

          <List>
            {roles.map((roleName) => (
              <ListItem
                key={roleName}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleStartEditRole(roleName)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteRole(roleName)}
                      size="small"
                      disabled={[
                        "사장",
                        "매니저",
                        "바리스타",
                        "홀 서빙",
                        "주방",
                        "일반 직원",
                      ].includes(roleName)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={roleName}
                  secondary={
                    [
                      "사장",
                      "매니저",
                      "바리스타",
                      "홀 서빙",
                      "주방",
                      "일반 직원",
                    ].includes(roleName)
                      ? "기본 역할"
                      : "추가된 역할"
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)} variant="outlined">
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default EmployeePage;
