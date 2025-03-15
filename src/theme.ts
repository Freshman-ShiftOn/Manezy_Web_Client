import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

// 색상 정의
const primaryColor = "#4050B5";
const secondaryColor = "#6070FF";
const accentColor = "#f0f4ff";
const successColor = "#34A853";
const warningColor = "#FBBC05";
const errorColor = "#EA4335";
const infoColor = "#4285F4";

// 테마 생성 함수
export const createAppTheme = (mode: PaletteMode = "light") => {
  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: primaryColor,
        light: "#6B7BD0",
        dark: "#2A3694",
        contrastText: "#ffffff",
      },
      secondary: {
        main: secondaryColor,
        light: "#8B97FF",
        dark: "#4150C0",
        contrastText: "#ffffff",
      },
      success: {
        main: successColor,
        light: "#4CD166",
        dark: "#238C3D",
      },
      warning: {
        main: warningColor,
        light: "#FFCF38",
        dark: "#D6A000",
      },
      error: {
        main: errorColor,
        light: "#F26B5E",
        dark: "#C1302A",
      },
      info: {
        main: infoColor,
        light: "#75A6F6",
        dark: "#2E65C1",
      },
      background: {
        default: mode === "light" ? "#f9fafb" : "#121212",
        paper: mode === "light" ? "#ffffff" : "#1e1e1e",
      },
      text: {
        primary: mode === "light" ? "#333333" : "#f5f5f5",
        secondary: mode === "light" ? "#666666" : "#b3b3b3",
        disabled: mode === "light" ? "#999999" : "#6c6c6c",
      },
      divider:
        mode === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)",
    },
    typography: {
      fontFamily:
        '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: "2.5rem",
      },
      h2: {
        fontWeight: 700,
        fontSize: "2rem",
      },
      h3: {
        fontWeight: 600,
        fontSize: "1.75rem",
      },
      h4: {
        fontWeight: 600,
        fontSize: "1.5rem",
      },
      h5: {
        fontWeight: 600,
        fontSize: "1.25rem",
      },
      h6: {
        fontWeight: 600,
        fontSize: "1rem",
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: "1rem",
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: "0.875rem",
      },
      body1: {
        fontWeight: 400,
        fontSize: "1rem",
        lineHeight: 1.7,
      },
      body2: {
        fontWeight: 400,
        fontSize: "0.875rem",
        lineHeight: 1.6,
      },
      button: {
        fontWeight: 600,
        fontSize: "0.875rem",
        textTransform: "none",
      },
      caption: {
        fontWeight: 400,
        fontSize: "0.75rem",
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      "none",
      "0px 2px 4px rgba(0, 0, 0, 0.05)",
      "0px 4px 8px rgba(0, 0, 0, 0.08)",
      "0px 6px 12px rgba(0, 0, 0, 0.1)",
      "0px 8px 16px rgba(0, 0, 0, 0.12)",
      "0px 10px 20px rgba(0, 0, 0, 0.15)",
      "0px 12px 24px rgba(0, 0, 0, 0.15)",
      "0px 14px 28px rgba(0, 0, 0, 0.15)",
      "0px 16px 32px rgba(0, 0, 0, 0.15)",
      "0px 18px 36px rgba(0, 0, 0, 0.15)",
      "0px 20px 40px rgba(0, 0, 0, 0.15)",
      "0px 22px 44px rgba(0, 0, 0, 0.15)",
      "0px 24px 48px rgba(0, 0, 0, 0.15)",
      "0px 26px 52px rgba(0, 0, 0, 0.15)",
      "0px 28px 56px rgba(0, 0, 0, 0.15)",
      "0px 30px 60px rgba(0, 0, 0, 0.15)",
      "0px 32px 64px rgba(0, 0, 0, 0.15)",
      "0px 34px 68px rgba(0, 0, 0, 0.15)",
      "0px 36px 72px rgba(0, 0, 0, 0.15)",
      "0px 38px 76px rgba(0, 0, 0, 0.15)",
      "0px 40px 80px rgba(0, 0, 0, 0.15)",
      "0px 42px 84px rgba(0, 0, 0, 0.15)",
      "0px 44px 88px rgba(0, 0, 0, 0.15)",
      "0px 46px 92px rgba(0, 0, 0, 0.15)",
      "0px 48px 96px rgba(0, 0, 0, 0.15)",
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 50,
            boxShadow: "0 4px 10px rgba(64, 80, 181, 0.2)",
            transition: "all 0.3s ease",
            fontWeight: 600,
            padding: "8px 20px",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 15px rgba(64, 80, 181, 0.3)",
            },
            "&:active": {
              transform: "translateY(1px)",
              boxShadow: "0 2px 5px rgba(64, 80, 181, 0.2)",
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${primaryColor} 0%, #5060D0 100%)`,
            "&:hover": {
              background: `linear-gradient(135deg, ${primaryColor} 20%, #5060D0 100%)`,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
          },
          elevation1: {
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
          },
          elevation2: {
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.08)",
          },
          elevation3: {
            boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.1)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            overflow: "hidden",
            border:
              mode === "light"
                ? "1px solid rgba(0, 0, 0, 0.05)"
                : "1px solid rgba(255, 255, 255, 0.05)",
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 20,
            "&:last-child": {
              paddingBottom: 20,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              "& fieldset": {
                borderColor:
                  mode === "light"
                    ? "rgba(0, 0, 0, 0.15)"
                    : "rgba(255, 255, 255, 0.15)",
              },
              "&:hover fieldset": {
                borderColor: mode === "light" ? primaryColor : "#6B7BD0",
              },
              "&.Mui-focused fieldset": {
                borderColor: primaryColor,
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.05)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: "none",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "4px 8px",
            "&.Mui-selected": {
              backgroundColor:
                mode === "light" ? accentColor : "rgba(64, 80, 181, 0.2)",
              "&:hover": {
                backgroundColor:
                  mode === "light" ? "#E5EAFF" : "rgba(64, 80, 181, 0.3)",
              },
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor:
              mode === "light" ? accentColor : "rgba(64, 80, 181, 0.1)",
            "& .MuiTableCell-head": {
              fontWeight: 600,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor:
              mode === "light"
                ? "rgba(0, 0, 0, 0.08)"
                : "rgba(255, 255, 255, 0.08)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500,
          },
          filled: {
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === "light" ? "#333" : "#f5f5f5",
            color: mode === "light" ? "#fff" : "#333",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            fontWeight: 500,
            fontSize: "0.75rem",
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor:
                mode === "light"
                  ? "rgba(0, 0, 0, 0.2)"
                  : "rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor:
                mode === "light"
                  ? "rgba(0, 0, 0, 0.05)"
                  : "rgba(255, 255, 255, 0.05)",
            },
          },
        },
      },
    },
  });

  theme = responsiveFontSizes(theme);

  return theme;
};

// 단축 변수 및 유틸리티 함수
export const appTheme = createAppTheme("light");
export const colors = {
  primary: primaryColor,
  secondary: secondaryColor,
  accent: accentColor,
  success: successColor,
  warning: warningColor,
  error: errorColor,
  info: infoColor,
  gray: {
    100: "#f9fafb",
    200: "#f2f3f5",
    300: "#e5e7eb",
    400: "#d1d5db",
    500: "#9ca3af",
    600: "#6b7280",
    700: "#4b5563",
    800: "#374151",
    900: "#1f2937",
  },
};

// 디자인 시스템 상수
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const transitions = {
  fast: "0.2s ease",
  normal: "0.3s ease",
  slow: "0.5s ease",
};

export default appTheme;
