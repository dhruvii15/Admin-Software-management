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


export default function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* Dashboard Layout */}
        <Route element={<AppLayout />}>
          <Route index element={<AdminProtect><Ecommerce /></AdminProtect>} />
          
          {/* employees Page */}
          <Route path="/employee/data" element={<AdminProtect><Data /></AdminProtect>} />
          
          {/* hiring Page */}
          <Route path="/hiring/data" element={<AdminProtect><HiringResume /></AdminProtect>} />
          
          {/* Increment Page */}
          <Route path="/increment" element={<AdminProtect><Increment /></AdminProtect>} />
          
          {/* Salary Page */}
          <Route path="/salary" element={<AdminProtect><Salary /></AdminProtect>} />
          
          {/* Letters Page */}
          <Route path="/letters" element={<AdminProtect><Letters /></AdminProtect>} />

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
