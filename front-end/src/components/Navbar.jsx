import { useState } from "react";
import {
  BellIcon,
  ChevronDownIcon,
  CheckCircleIcon,
} from "./FlowfulIcons";

export default function Navbar({ notificationCount, onLogout, onRefresh, user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const firstName = user.name.split(" ")[0];
  const initials = user.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar__welcome">
        <h1>{`Welcome Back, ${firstName}!`}</h1>
      </div>

      <div className="topbar__actions">
        <button className="topbar__icon-button" type="button">
          <BellIcon className="topbar__icon" />
          {notificationCount ? (
            <span className="topbar__notification-badge">{notificationCount}</span>
          ) : null}
        </button>

        <div className="topbar__profile-menu">
          <button
            className="topbar__profile-button"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            <div className="topbar__avatar">{initials}</div>
            <ChevronDownIcon className="topbar__chevron" />
          </button>

          {isMenuOpen ? (
            <div className="topbar__dropdown">
              <div className="topbar__dropdown-header">
                <div className="topbar__avatar topbar__avatar--small">{initials}</div>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              </div>

              <button
                className="topbar__dropdown-action"
                onClick={() => {
                  setIsMenuOpen(false);
                  onRefresh();
                }}
                type="button"
              >
                <CheckCircleIcon className="topbar__dropdown-icon" />
                Refresh profile
              </button>

              <button
                className="topbar__dropdown-action"
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                type="button"
              >
                <BellIcon className="topbar__dropdown-icon" />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
