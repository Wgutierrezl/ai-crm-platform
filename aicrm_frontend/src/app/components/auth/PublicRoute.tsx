import { Navigate, Outlet } from "react-router";
import { authStorage } from "../../../utils/storage/authStorage";

export default function PublicRoute() {
  const hasSession = authStorage.hasSession();

  if (hasSession) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
