import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import PageLoader from "./PageLoader";

export default function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader message="Preparing your session..." />;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}
