import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/auth-context";

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = ({ target }) => {
    setForm((currentForm) => ({
      ...currentForm,
      [target.name]: target.value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      const redirectPath = location.state?.from?.pathname || "/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Flowful Workspace"
      title="Steer projects with calm, clear momentum."
      description="Sign in to review your team pulse, keep deliverables moving, and manage your workspace from one polished control center."
      switchText="Need an account?"
      switchLink="/register"
      switchLabel="Create one"
      note="Demo access: sky@gmail.com / seankirby"
    >
      <form className="auth-form" onSubmit={handleLogin}>
        <div className="auth-form__header">
          <p className="eyebrow">Welcome back</p>
          <h2>Log into Flowful</h2>
          <p>
            Your session stays connected to the Laravel API, so the dashboard
            can pick up exactly where you left off.
          </p>
        </div>

        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            className="field__input"
            name="email"
            onChange={handleChange}
            placeholder="you@company.com"
            type="email"
            value={form.email}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            className="field__input"
            name="password"
            onChange={handleChange}
            placeholder="Enter your password"
            type="password"
            value={form.password}
          />
        </label>

        {error ? <p className="form-message form-message--error">{error}</p> : null}

        <button className="button button--primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Enter dashboard"}
        </button>

        <p className="auth-form__footer">
          New to Flowful? <Link to="/register">Start with a fresh account.</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
