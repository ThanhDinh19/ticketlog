import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import SupportPage from "./pages/SupportPage";
import ReportPage from "./pages/ReportPage";
import WorkdayConfigPage from "./pages/WorkdayConfigPage";
import SupportReasonsPage from "./pages/SupportReasonsPage";
import QrPage from "./pages/QrPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/workday-configs"
            element={
              <ProtectedRoute>
                <WorkdayConfigPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/support-reasons"
            element={
              <ProtectedRoute>
                <SupportReasonsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/qr"
            element={
              <ProtectedRoute>
                <QrPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}