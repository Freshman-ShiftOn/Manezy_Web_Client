import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  CssBaseline,
  IconButton,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  ListItemAvatar,
  Popover,
  Paper,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Group as GroupIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Add as AddIcon,
  Store as StoreIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import { getStoreInfo, getEmployees } from "../services/api";
import { useEffect } from "react";
import { Store } from "../lib/types";

const drawerWidth = 260;

// 더미 알림 데이터
const dummyNotifications = [
  {
    id: 1,
    title: "대타 요청",
    message: "김영희님이 내일 오후 시프트 대타를 요청했습니다.",
    time: "10분 전",
    read: false,
  },
  {
    id: 2,
    title: "급여 확정",
    message: "이번 달 급여가 확정되었습니다. 확인해주세요.",
    time: "1시간 전",
    read: false,
  },
  {
    id: 3,
    title: "스케줄 변경",
    message: "다음 주 월요일 스케줄이 변경되었습니다.",
    time: "어제",
    read: true,
  },
];

// 더미 스토어 데이터
const dummyStores = [
  {
    id: "store1",
    name: "메인 카페",
    address: "서울시 강남구 역삼동 123-45",
    phoneNumber: "02-1234-5678",
    baseHourlyRate: 9620,
    openingHour: "09:00",
    closingHour: "22:00",
  },
  {
    id: "store2",
    name: "홍대 지점",
    address: "서울시 마포구 서교동 456-78",
    phoneNumber: "02-2345-6789",
    baseHourlyRate: 9620,
    openingHour: "08:00",
    closingHour: "23:00",
  },
];

function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [notificationCount, setNotificationCount] = useState(2);

  // 알림 메뉴 상태
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const notificationOpen = Boolean(notificationAnchorEl);

  // 스토어 메뉴 상태
  const [storeAnchorEl, setStoreAnchorEl] = useState<null | HTMLElement>(null);
  const storeMenuOpen = Boolean(storeAnchorEl);

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // 자동으로 모바일에서는 드로어 닫기
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  }, [isMobile]);

  // 스토어 정보 가져오기
  useEffect(() => {
    const loadStoreInfo = async () => {
      try {
        // 실제 API 호출
        const info = await getStoreInfo();
        setStoreInfo(info);

        // 더미 데이터 추가
        if (info && info.id) {
          setStores([info, ...dummyStores]);
          setSelectedStoreId(info.id);
        } else {
          // If info is null or has no id, use dummy data
          setStores(dummyStores);
          if (dummyStores.length > 0) {
            setSelectedStoreId(dummyStores[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load store info:", error);
        // In case of error, still set some default data
        setStores(dummyStores);
        if (dummyStores.length > 0) {
          setSelectedStoreId(dummyStores[0].id);
        }
      }
    };

    loadStoreInfo();
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // 현재 활성화된 메뉴 확인
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 알림 메뉴 열기
  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  // 알림 메뉴 닫기
  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  // 알림 읽음 처리
  const handleReadNotification = (id: number) => {
    setNotificationCount((prev) => Math.max(0, prev - 1));
    // 여기서 실제로는 API를 호출하여 알림을 읽음 처리해야 함
  };

  // 알림 모두 읽음 처리
  const handleReadAllNotifications = () => {
    setNotificationCount(0);
    // 여기서 실제로는 API를 호출하여 모든 알림을 읽음 처리해야 함
    handleNotificationClose();
  };

  // 스토어 선택 메뉴 열기
  const handleStoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStoreAnchorEl(event.currentTarget);
  };

  // 스토어 선택 메뉴 닫기
  const handleStoreMenuClose = () => {
    setStoreAnchorEl(null);
  };

  // 스토어 변경 처리
  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    // 여기서 실제로는 API를 호출하여 선택된 스토어의 데이터를 로드해야 함

    // 선택된 스토어 정보 업데이트
    const selected = stores.find((store) => store.id === storeId);
    if (selected) {
      setStoreInfo(selected);
    }

    handleStoreMenuClose();
  };

  // 새 스토어 등록
  const handleAddNewStore = () => {
    handleStoreMenuClose();
    navigate("/setup");
  };

  // 메뉴 아이템 부분을 찾아 구독 메뉴 추가
  const menuItems = [
    { text: "대시보드", icon: <DashboardIcon />, path: "/" },
    { text: "스케줄 관리", icon: <CalendarIcon />, path: "/schedule" },
    { text: "알바생 관리", icon: <GroupIcon />, path: "/employees" },
    { text: "급여 관리", icon: <PaymentIcon />, path: "/payroll" },
    { text: "결제 및 구독", icon: <CreditCardIcon />, path: "/subscription" },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CssBaseline />

      {/* 상단 앱바 */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
          backgroundColor: "white",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              onClick={() => setDrawerOpen(!drawerOpen)}
              edge="start"
              sx={{ mr: 2, display: { sm: "none", xs: "block" } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: "bold",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                color: "primary.main",
              }}
            >
              Manezy
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* 알림 버튼 */}
            <Tooltip title="알림">
              <IconButton
                color="inherit"
                onClick={handleNotificationOpen}
                aria-describedby="notification-popover"
              >
                <Badge badgeContent={notificationCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* 알림 팝업 */}
            <Popover
              id="notification-popover"
              open={notificationOpen}
              anchorEl={notificationAnchorEl}
              onClose={handleNotificationClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              sx={{ mt: 1 }}
            >
              <Paper sx={{ width: 320, maxHeight: 400, overflow: "auto" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    p: 2,
                    alignItems: "center",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    알림
                  </Typography>
                  <Box>
                    <Button size="small" onClick={handleReadAllNotifications}>
                      모두 읽음
                    </Button>
                    <IconButton size="small" onClick={handleNotificationClose}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <List sx={{ p: 0 }}>
                  {dummyNotifications.length > 0 ? (
                    dummyNotifications.map((notification) => (
                      <ListItem
                        key={notification.id}
                        divider
                        sx={{
                          bgcolor: notification.read
                            ? "inherit"
                            : "rgba(25, 118, 210, 0.05)",
                          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                        }}
                      >
                        <ListItemButton
                          onClick={() =>
                            handleReadNotification(notification.id)
                          }
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: notification.read
                                  ? "grey.300"
                                  : "primary.main",
                              }}
                            >
                              <AccessTimeIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={notification.title}
                            secondary={
                              <Box>
                                <Typography variant="body2" component="span">
                                  {notification.message}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  component="div"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  {notification.time}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="새로운 알림이 없습니다." />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Popover>

            {/* 스토어 선택 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                ml: 2,
                cursor: "pointer",
                borderRadius: 1,
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                p: 0.5,
              }}
              onClick={handleStoreMenuOpen}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "primary.main",
                  fontSize: "0.9rem",
                }}
              >
                {storeInfo?.name?.substring(0, 1) || "M"}
              </Avatar>
              <Box sx={{ ml: 1, display: { xs: "none", sm: "block" } }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, lineHeight: 1.2 }}
                >
                  {storeInfo?.name || "내 매장"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  스토어 변경
                </Typography>
              </Box>
            </Box>

            {/* 스토어 선택 메뉴 */}
            <Menu
              anchorEl={storeAnchorEl}
              open={storeMenuOpen}
              onClose={handleStoreMenuClose}
              sx={{ mt: 1 }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  스토어 선택
                </Typography>
              </Box>
              <Divider />
              {stores.map((store) => (
                <MenuItem
                  key={store.id}
                  onClick={() => handleStoreChange(store.id)}
                  selected={selectedStoreId === store.id}
                >
                  <ListItemIcon>
                    <StoreIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={store.name}
                    secondary={store.address}
                  />
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={handleAddNewStore}>
                <ListItemIcon>
                  <AddIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary="새 지점 등록하기" />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 사이드바 */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.05)",
            borderRight: "none",
            bgcolor: "#fafafa",
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* 스토어 정보 카드 */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "white",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", fontSize: "1rem" }}
            >
              {storeInfo?.name || "매장 이름"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {storeInfo?.address || "매장 주소"}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<StoreIcon />}
              onClick={() => handleNavigation("/settings")}
              sx={{ mb: 2, mt: 1 }}
            >
              지점 관리
            </Button>
          </Box>

          {/* 메인 메뉴 */}
          <List sx={{ flexGrow: 1 }}>
            {menuItems.map((item) => (
              <ListItem disablePadding key={item.path}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={isActive(item.path)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    "&.Mui-selected": {
                      backgroundColor: "primary.light",
                      "&:hover": {
                        backgroundColor: "primary.light",
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? "bold" : "normal",
                      color: isActive(item.path) ? "primary.main" : "inherit",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {/* 하단 메뉴 */}
          <Box sx={{ mt: "auto" }}>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  /* Logout logic here */
                }}
                sx={{
                  borderRadius: 2,
                  color: "text.secondary",
                }}
              >
                <ListItemIcon>
                  <LogoutIcon color="inherit" />
                </ListItemIcon>
                <ListItemText primary="로그아웃" />
              </ListItemButton>
            </ListItem>
          </Box>
        </Box>
      </Drawer>

      {/* 메인 콘텐츠 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          overflow: "auto",
          height: "100vh",
          bgcolor: "#f5f5f7",
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;

// If you still get "not a module" errors, you can add this line:
// export {};
