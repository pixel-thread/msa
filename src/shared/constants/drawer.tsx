import {
  UsersIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  CalendarDaysIcon,
  CreditCardIcon,
  BookOpenIcon,
  WalletIcon,
  AlertTriangleIcon,
  ScrollTextIcon,
  ShieldCheck,
  ShieldIcon,
  ClipboardCheck,
} from "lucide-react";

export const drawrNavMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Announcement",
    url: "/announcement",
    icon: <AlertTriangleIcon />,
    isActive: true,
    items: [
      {
        title: "Published",
        url: "/announcement",
      },
      {
        title: "Drafts",
        url: "/announcement/draft",
      },
      {
        title: "Archive",
        url: "/announcement/archive",
      },
    ],
  },
  {
    title: "Members",
    url: "/members",
    icon: <UsersIcon />,
    isActive: true,
    items: [
      {
        title: "All Members",
        url: "/members",
      },
      {
        title: "Membership Applicants",
        url: "/members/applications",
      },
    ],
  },
  {
    title: "Meetings",
    url: "/meetings",
    icon: <CalendarDaysIcon />,
    isActive: true,
    items: [
      {
        title: "All Meetings",
        url: "/meetings",
      },
    ],
  },
  {
    title: "Training",
    url: "/training",
    icon: <BookOpenIcon />,
    isActive: true,
    items: [
      {
        title: "Modules",
        url: "/training",
      },
      {
        title: "Completions",
        url: "/training/completions",
      },
    ],
  },
  {
    title: "Subscriptions",
    url: "/subscriptions/plans",
    icon: <CreditCardIcon />,
    isActive: true,
    items: [
      {
        title: "Plans",
        url: "/subscriptions/plans",
      },
      {
        title: "History",
        url: "/subscriptions/my",
      },
    ],
  },
  {
    title: "Payments",
    url: "/payments",
    icon: <WalletIcon />,
    isActive: true,
    items: [
      {
        title: "All Payments",
        url: "/payments",
      },
      {
        title: "Contributions",
        url: "/payments/contributions",
      },
      {
        title: "By Member",
        url: "/payments/users",
      },
      {
        title: "Providers",
        url: "/payments/providers",
      },
    ],
  },
  {
    title: "Ledger",
    url: "/ledger",
    icon: <BookOpenIcon />,
    isActive: true,
    items: [
      {
        title: "Dashboard",
        url: "/ledger",
      },
      {
        title: "Entries",
        url: "/ledger/entries",
      },
      {
        title: "Accounts",
        url: "/ledger/accounts",
      },
    ],
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: <ScrollTextIcon />,
    isActive: true,
  },
  {
    title: "Privacy",
    url: "#",
    icon: <ShieldIcon />,
    isActive: true,
    items: [
      {
        title: "Consent",
        url: "/consent",
      },
      {
        title: "DSAR",
        url: "/dsar",
      },
    ],
  },
  {
    title: "Compliance",
    url: "/compliance",
    icon: <ClipboardCheck />,
    isActive: true,
  },
  {
    title: "Settings",
    url: "#",
    icon: <Settings2Icon />,
    items: [
      {
        title: "Member Types",
        url: "/member-types",
      },
      {
        title: "General",
        url: "#",
      },
      {
        title: "Change Password",
        url: "/change-password",
      },
    ],
  },
];
