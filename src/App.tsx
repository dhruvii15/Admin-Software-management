import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";
import SignIn from "./pages/AuthPages/SignIn";
import Ecommerce from "./pages/Dashboard/ECommerce";
import AdminProtect from "./components/AdminProtect";
import Data from "./pages/employees/Data";
import HiringResume from "./pages/Hiring/HiringResume";
import Increment from "./pages/Increment/Increment";
import Salary from "./pages/Salary/Salary";
import Letters from "./pages/Letters/Letters";
import Dashboard from "./pages/Dashboard/Dashboard";
import Portfolio from "./pages/Portfolio/Portfolio";
import OpenPosition from "./pages/Position/Position";
import Culture from "./pages/Culture/Culture";
import HiringDashboard from "./pages/Hiring/HiringDashboard";
import Leave from "./pages/Leave/Leave";


export default function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* Dashboard Layout */}
        <Route element={<AppLayout />}>
          <Route index element={<AdminProtect><Ecommerce /></AdminProtect>} />

          <Route path="/website/portfolio" element={<AdminProtect><Portfolio /></AdminProtect>} />
          <Route path="/website/position" element={<AdminProtect><OpenPosition /></AdminProtect>} />
          <Route path="/website/culture" element={<AdminProtect><Culture /></AdminProtect>} />



          {/* dashboard Page */}
          <Route path="/management/dashboard" element={<AdminProtect><Dashboard /></AdminProtect>} />
          {/* employees Page */}
          <Route path="/management/employee/data" element={<AdminProtect><Data /></AdminProtect>} />
          {/* hiring Page */}
          <Route path="/management/hiring-resume" element={<AdminProtect><HiringResume /></AdminProtect>} />
          <Route path="/management/hiring/data" element={<AdminProtect><HiringDashboard /></AdminProtect>} />
          {/* Increment Page */}
          <Route path="/management/increment" element={<AdminProtect><Increment /></AdminProtect>} />
          {/* Leave Page */}
          <Route path="/management/leave" element={<AdminProtect><Leave /></AdminProtect>} />
          {/* Salary Page */}
          <Route path="/management/salary" element={<AdminProtect><Salary /></AdminProtect>} />
          {/* Letters Page */}
          <Route path="/management/letters" element={<AdminProtect><Letters /></AdminProtect>} />

          {/* Fallback Route */}
          <Route path="*" element={<AdminProtect><Ecommerce /></AdminProtect>} />
        </Route>

        {/* Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<SignIn />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
