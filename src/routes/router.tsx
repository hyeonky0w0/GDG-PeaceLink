import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BaseLayout } from "@/layouts/BaseLayout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import ReportPage from "@/pages/ReportPage";
import NotFoundPage from "@/pages/NotFoundPage";
import CommPage from "@/pages/CommPage";
import ResultPage from "@/pages/ResultPage";

const USER_ID_KEY = "peacelink_user_id";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isRegistered = !!localStorage.getItem(USER_ID_KEY);
  return isRegistered ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BaseLayout />}>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/report"
            element={
              <PrivateRoute>
                <ReportPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/comm"
            element={
              <PrivateRoute>
                <CommPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/result"
            element={
              <PrivateRoute>
                <ResultPage />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}