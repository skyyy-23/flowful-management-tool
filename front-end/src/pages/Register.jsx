import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/auth-context";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = ({ target }) => {
    setForm((currentForm) => ({
      ...currentForm,
      [target.name]: target.value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please review your details and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Build Your Workspace"
      title="Launch a team space that keeps work visible."
      description="Create your account to start shaping organizations, projects, and task boards inside a cleaner Flowful experience."
      switchText="Already registered?"
      switchLink="/"
      switchLabel="Sign in"
      note="A new account is created instantly through the existing API."
    >
      <form className="auth-form" onSubmit={handleRegister}>
        <div className="auth-form__header">
          <p className="eyebrow">Get started</p>
          <h2>Create your Flowful account</h2>
          <p>
            Set up your profile now, then head straight into a responsive
            dashboard designed for project planning and team clarity.
          </p>
        </div>

        <label className="field">
          <span>Full name</span>
          <input
            autoComplete="name"
            className="field__input"
            name="name"
            onChange={handleChange}
            placeholder="Alex Morgan"
            type="text"
            value={form.name}
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            className="field__input"
            name="email"
            onChange={handleChange}
            placeholder="alex@company.com"
            type="email"
            value={form.email}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Password</span>
            <input
              autoComplete="new-password"
              className="field__input"
              name="password"
              onChange={handleChange}
              placeholder="At least 6 characters"
              type="password"
              value={form.password}
            />
          </label>

          <label className="field">
            <span>Confirm password</span>
            <input
              autoComplete="new-password"
              className="field__input"
              name="confirmPassword"
              onChange={handleChange}
              placeholder="Repeat password"
              type="password"
              value={form.confirmPassword}
            />
          </label>
        </div>

        {error ? <p className="form-message form-message--error">{error}</p> : null}

        <button className="button button--primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account..." : "Create workspace access"}
        </button>

        <p className="auth-form__footer">
          Already have login details? <Link to="/">Return to sign in.</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Register;
