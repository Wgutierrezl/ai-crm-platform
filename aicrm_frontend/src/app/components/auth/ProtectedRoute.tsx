import { Navigate, Outlet, useLocation } from "react-router";
import { authStorage } from "../../../utils/storage/authStorage";

export default function ProtectedRoute() {
  const location = useLocation();
  const hasSession = authStorage.hasSession();

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
