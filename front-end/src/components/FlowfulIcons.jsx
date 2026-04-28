function IconBase({ children, className, viewBox = "0 0 24 24" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
}

export function LeafLogoIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M6 18c3.5.5 6.5-.3 8.8-2.6S18.6 10 18 6c-4 0-7 1-9.2 3.2S5.5 14.5 6 18Z" />
      <path d="M6 18c1.6-3.2 4.2-5.8 7.8-7.8" />
      <path d="M5 11c-1.2.9-2 2.4-2 4 0 2.8 2.2 5 5 5 1.6 0 3.1-.8 4-2" />
    </IconBase>
  );
}

export function DashboardIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect height="7" rx="1.5" width="7" x="3" y="3" />
      <rect height="11" rx="1.5" width="7" x="14" y="3" />
      <rect height="7" rx="1.5" width="7" x="14" y="14" />
      <rect height="11" rx="1.5" width="7" x="3" y="10" />
    </IconBase>
  );
}

export function FolderIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5Z" />
      <path d="M3 10h18" />
    </IconBase>
  );
}

export function UsersIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M16 21v-1.5a3.5 3.5 0 0 0-3.5-3.5h-1A3.5 3.5 0 0 0 8 19.5V21" />
      <circle cx="12" cy="9" r="3.5" />
      <path d="M20.5 20v-1a3 3 0 0 0-2.5-3" />
      <path d="M3.5 20v-1A3 3 0 0 1 6 16" />
    </IconBase>
  );
}

export function SettingsIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1L4.8 8.6a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V5a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
    </IconBase>
  );
}

export function BellIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M15 17H5.8a1.8 1.8 0 0 1-1.6-2.7l1.1-1.9V9.5a5.7 5.7 0 1 1 11.4 0v2.9l1.1 1.9A1.8 1.8 0 0 1 16.2 17H15" />
      <path d="M9 19a2.5 2.5 0 0 0 5 0" />
    </IconBase>
  );
}

export function ChevronDownIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function PlusIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function BuildingIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 20V7.5A1.5 1.5 0 0 1 5.5 6H10V4.8a1 1 0 0 1 1.6-.8l6 4.5a1 1 0 0 1 .4.8V20" />
      <path d="M9 20v-4h6v4" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 13h.01" />
      <path d="M12 13h.01" />
    </IconBase>
  );
}

export function TeamIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
      <path d="M4 19a5 5 0 0 1 10 0" />
      <path d="M14 19a4 4 0 0 1 6 0" />
    </IconBase>
  );
}

export function SparkIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z" />
      <path d="m18.5 16 .8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8Z" />
      <path d="m4.5 13 .9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9Z" />
    </IconBase>
  );
}

export function ArrowRightIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function CheckCircleIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.3 2.3 4.8-5.1" />
    </IconBase>
  );
}

export function CircleIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8.5" />
    </IconBase>
  );
}
