import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import SetupWizard from "./routes/Wizard/SetupWizard";
import DashboardPage from "./routes/Dashboard/DashboardPage";
import SchedulePage from "./routes/Schedule/SchedulePage";
import EmployeePage from "./routes/Employees/EmployeePage";
import PayrollPage from "./routes/Payroll/PayrollPage";

function App() {
  return (
    <Routes>
      {/* 마법사 (초기 설정) */}
      <Route path="/setup/*" element={<SetupWizard />} />

      {/* 메인 레이아웃 안에 들어가는 페이지들 */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/employees" element={<EmployeePage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

export default App;
