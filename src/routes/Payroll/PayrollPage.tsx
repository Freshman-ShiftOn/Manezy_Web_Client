// src/routes/Payroll/PayrollPage.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
} from "@mui/material";

interface PayrollData {
  employeeName: string;
  totalHours: number;
  wage: number;
  extraPay: number;
  deduction: number;
}

function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollData[]>([
    {
      employeeName: "김알바",
      totalHours: 80,
      wage: 10000,
      extraPay: 20000,
      deduction: 0,
    },
    {
      employeeName: "이알바",
      totalHours: 60,
      wage: 10500,
      extraPay: 0,
      deduction: 5000,
    },
  ]);

  const handleConfirmPayroll = () => {
    // 예: 백엔드로 확정 요청, 알바생 앱에 “급여 확정” 푸시
    console.log("급여 확정", payrolls);
    alert("급여가 확정되었습니다.");
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        급여 관리
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>알바생</TableCell>
            <TableCell>근무시간</TableCell>
            <TableCell>시급</TableCell>
            <TableCell>추가수당</TableCell>
            <TableCell>공제</TableCell>
            <TableCell>최종급여</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payrolls.map((p, i) => {
            const basePay = p.totalHours * p.wage;
            const finalPay = basePay + p.extraPay - p.deduction;
            return (
              <TableRow key={i}>
                <TableCell>{p.employeeName}</TableCell>
                <TableCell>{p.totalHours}</TableCell>
                <TableCell>{p.wage.toLocaleString()}원</TableCell>
                <TableCell>{p.extraPay.toLocaleString()}원</TableCell>
                <TableCell>{p.deduction.toLocaleString()}원</TableCell>
                <TableCell>{finalPay.toLocaleString()}원</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Box textAlign="right" mt={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirmPayroll}
        >
          급여 확정
        </Button>
      </Box>
    </Box>
  );
}

export default PayrollPage;
