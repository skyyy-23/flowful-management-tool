import { Link } from "react-router-dom";

const featurePoints = [
  "Layered auth screens with clear calls to action",
  "Protected dashboard routing backed by stored API tokens",
  "Responsive cards and panels ready for live project data",
];

export default function AuthLayout({
  children,
  description,
  eyebrow,
  note,
  switchLabel,
  switchLink,
  switchText,
  title,
}) {
  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel--brand">
        <div className="auth-panel__content">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-panel__description">{description}</p>

          <div className="feature-list">
            {featurePoints.map((point) => (
              <div className="feature-list__item" key={point}>
                <span className="feature-list__dot" />
                <p>{point}</p>
              </div>
            ))}
          </div>

          <div className="auth-panel__note">
            <strong>{switchText}</strong>
            <Link to={switchLink}>{switchLabel}</Link>
          </div>

          <p className="auth-panel__caption">{note}</p>
        </div>
      </section>

      <section className="auth-panel auth-panel--form">{children}</section>
    </main>
  );
}
