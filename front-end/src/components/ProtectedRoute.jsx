import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import PageLoader from "./PageLoader";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader message="Syncing your workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/" />;
  }

  return children;
}
