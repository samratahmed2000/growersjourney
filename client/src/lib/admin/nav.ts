export type AdminNavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "inquiries" | "clients" | "projects" | "services" | "portfolio";
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "inquiries" },
  { href: "/admin/clients", label: "Clients", icon: "clients" },
  { href: "/admin/projects", label: "Projects", icon: "projects" },
  { href: "/admin/services", label: "Services", icon: "services" },
  { href: "/admin/portfolio", label: "Portfolio", icon: "portfolio" },
];
