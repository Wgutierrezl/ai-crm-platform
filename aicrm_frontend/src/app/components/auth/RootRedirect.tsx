import { Navigate } from "react-router";
import { authStorage } from "../../../utils/storage/authStorage";

export default function RootRedirect() {
  const hasSession = authStorage.hasSession();
  return <Navigate to={hasSession ? "/dashboard" : "/login"} replace />;
}
