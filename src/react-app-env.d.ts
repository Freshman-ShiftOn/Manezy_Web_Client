/// <reference types="react-scripts" />

// 기본 React와 기타 모듈 선언
import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  // React 훅 및 타입 확장
  namespace React {
    export import FC = React.FunctionComponent;
    export import MouseEvent = React.MouseEvent;
    export import ChangeEvent = React.ChangeEvent;
    export import FormEvent = React.FormEvent;
    export import Fragment = React.Fragment;

    export function useState<T>(
      initialState: T | (() => T)
    ): [T, (newState: T | ((prevState: T) => T)) => void];
    export function useState<T = undefined>(): [
      T | undefined,
      (newState: T | ((prevState: T | undefined) => T)) => void
    ];

    export function useEffect(
      effect: () => void | (() => void),
      deps?: readonly any[]
    ): void;
    export function useCallback<T extends (...args: any[]) => any>(
      callback: T,
      deps: readonly any[]
    ): T;
    export function useMemo<T>(
      factory: () => T,
      deps: readonly any[] | undefined
    ): T;
  }

  // MUI 관련 타입
  namespace MUI {
    interface InputLabelProps {
      children?: React.ReactNode;
      component?: React.ElementType;
      id?: string;
      [key: string]: any;
    }

    interface TooltipProps {
      title: React.ReactNode;
      children?: React.ReactElement;
      [key: string]: any;
    }

    interface TableCellProps {
      align?: "inherit" | "left" | "center" | "right" | "justify";
      colSpan?: number;
      [key: string]: any;
    }

    interface SelectProps {
      labelId?: string;
      name?: string;
      value?: any;
      label?: string;
      onChange?: (e: any) => void;
      [key: string]: any;
    }

    interface TextFieldProps {
      InputProps?: {
        startAdornment?: React.ReactNode;
        endAdornment?: React.ReactNode;
        [key: string]: any;
      };
      [key: string]: any;
    }
  }

  // FullCalendar 타입
  namespace FullCalendar {
    interface EventDropArg {
      event: {
        id: string;
        title: string;
        start: Date | string;
        end: Date | string;
        startStr: string;
        endStr: string;
        allDay: boolean;
        extendedProps: any;
        backgroundColor: string;
      };
      revert: () => void;
    }

    interface EventResizeArg {
      event: {
        id: string;
        title: string;
        start: Date | string;
        end: Date | string;
        startStr: string;
        endStr: string;
        allDay: boolean;
        extendedProps: any;
        backgroundColor: string;
      };
      revert: () => void;
    }

    interface EventClickArg {
      event: {
        id: string;
        title: string;
        start: Date | string;
        end: Date | string;
        startStr: string;
        endStr: string;
        allDay: boolean;
        extendedProps: any;
        backgroundColor: string;
      };
    }

    interface DateSelectArg {
      start: Date;
      end: Date;
      allDay: boolean;
      startStr: string;
      endStr: string;
      view: any;
    }
  }
}

// 모듈 선언
declare module "recharts" {
  export const ResponsiveContainer: React.FC<{
    width?: string | number;
    height?: string | number;
    children?: React.ReactNode;
  }>;
  export const BarChart: React.FC<any>;
  export const Bar: React.FC<any>;
  export const PieChart: React.FC<any>;
  export const Pie: React.FC<any>;
  export const Cell: React.FC<any>;
  export const CartesianGrid: React.FC<any>;
  export const XAxis: React.FC<any>;
  export const YAxis: React.FC<any>;
  export const Tooltip: React.FC<any>;
  export const Legend: React.FC<any>;
  export const Line: React.FC<any>;
  export const LineChart: React.FC<any>;
}

declare module "@fullcalendar/react";
declare module "@fullcalendar/daygrid";
declare module "@fullcalendar/timegrid";
declare module "@fullcalendar/interaction";
declare module "@fullcalendar/core";

declare module "@mui/material/Tooltip" {
  import { TooltipProps as MuiTooltipProps } from "@mui/material";
  interface TooltipProps extends MuiTooltipProps {
    children?: React.ReactElement;
  }
  const Tooltip: React.FC<TooltipProps>;
  export default Tooltip;
}

declare module "@mui/material/TableCell" {
  import { TableCellProps as MuiTableCellProps } from "@mui/material";
  interface TableCellProps extends MuiTableCellProps {
    colSpan?: number;
  }
  const TableCell: React.FC<TableCellProps>;
  export default TableCell;
}

declare module "@mui/material/TextField" {
  import { TextFieldProps as MuiTextFieldProps } from "@mui/material";
  interface TextFieldProps extends MuiTextFieldProps {
    InputProps?: {
      startAdornment?: React.ReactNode;
      endAdornment?: React.ReactNode;
      [key: string]: any;
    };
  }
  const TextField: React.FC<TextFieldProps>;
  export default TextField;
}

declare module "@mui/material/Select" {
  import { SelectProps as MuiSelectProps } from "@mui/material";
  interface SelectProps extends MuiSelectProps {
    name?: string;
    labelId?: string;
  }
  const Select: React.FC<SelectProps>;
  export default Select;
}

declare module "@mui/x-date-pickers/AdapterDateFns";
declare module "@mui/x-date-pickers";
