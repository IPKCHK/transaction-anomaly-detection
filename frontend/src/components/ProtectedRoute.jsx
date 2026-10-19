import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../auth";

function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;