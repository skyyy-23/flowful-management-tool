import {
  DashboardIcon,
  FolderIcon,
  LeafLogoIcon,
  PlusIcon,
  SettingsIcon,
  TeamIcon,
  UsersIcon,
} from "./FlowfulIcons";

const navItems = [
  { label: "Dashboard", href: "#dashboard", icon: DashboardIcon, isActive: true },
  { label: "My Projects", href: "#projects-section", icon: FolderIcon },
  { label: "Team Members", href: "#activity-panel", icon: UsersIcon },
  { label: "Settings", href: "#insights-section", icon: SettingsIcon },
];

export default function Sidebar({
  activeOrganizationId,
  onCreateOrganization,
  onSelectOrganization,
  organizations,
}) {
  const visibleOrganizations = organizations.slice(0, 6);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <LeafLogoIcon className="sidebar__logo-icon" />
        </div>
        <div>
          <p>Flowful</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <a
            className={`sidebar__link ${item.isActive ? "sidebar__link--active" : ""}`}
            href={item.href}
            key={item.label}
          >
            <item.icon className="sidebar__link-icon" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar__organization-panel">
        <div className="sidebar__section-heading">My Organizations</div>

        <div className="sidebar__organization-list">
          {visibleOrganizations.length ? (
            visibleOrganizations.map((organization) => {
              const isActive = organization.id === activeOrganizationId;

              return (
                <button
                  className={`sidebar__organization-button ${
                    isActive ? "sidebar__organization-button--active" : ""
                  }`}
                  key={organization.id}
                  onClick={() => onSelectOrganization(organization.id)}
                  type="button"
                >
                  <TeamIcon className="sidebar__organization-icon" />
                  <span>{organization.name}</span>
                </button>
              );
            })
          ) : (
            <div className="sidebar__organization-empty">
              Add your first organization to start building the workspace.
            </div>
          )}
        </div>

        <button className="sidebar__create-button" onClick={onCreateOrganization} type="button">
          <PlusIcon className="sidebar__create-icon" />
          <span>New Organization</span>
        </button>
      </div>
    </aside>
  );
}
