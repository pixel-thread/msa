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
  ShieldIcon,
  ClipboardCheck,
} from 'lucide-react';

export const DRAWER_NAV_MAIN = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: <LayoutDashboardIcon />,
  },
  {
    title: 'Announcement',
    url: '/announcement',
    icon: <AlertTriangleIcon />,
    isActive: false,
    items: [
      {
        title: 'Published',
        url: '/announcement',
      },
      {
        title: 'Drafts',
        url: '/announcement/draft',
      },
      {
        title: 'Archive',
        url: '/announcement/archived',
      },
    ],
  },
  {
    title: 'Members',
    url: '/members',
    icon: <UsersIcon />,
    isActive: true,
    items: [
      {
        title: 'All Members',
        url: '/members',
      },
      {
        title: 'Membership Applicants',
        url: '/members/applications',
      },
    ],
  },
  {
    title: 'Meetings',
    url: '/meetings',
    icon: <CalendarDaysIcon />,
    isActive: false,
    items: [
      {
        title: 'All Meetings',
        url: '/meetings',
      },
    ],
  },
  {
    title: 'Training',
    url: '/training',
    icon: <BookOpenIcon />,
    isActive: false,
    items: [
      {
        title: 'Modules',
        url: '/training',
      },
      {
        title: 'Completions',
        url: '/training/completions',
      },
    ],
  },
  {
    title: 'Subscriptions',
    url: '/subscriptions/plans',
    icon: <CreditCardIcon />,
    isActive: false,
    items: [
      {
        title: 'Plans',
        url: '/subscriptions/plans',
      },
      {
        title: 'History',
        url: '/subscriptions/my',
      },
    ],
  },
  {
    title: 'Payments',
    url: '/payments',
    icon: <WalletIcon />,
    isActive: false,
    items: [
      {
        title: 'All Payments',
        url: '/payments',
      },
      {
        title: 'Contributions',
        url: '/payments/contributions',
      },
      {
        title: 'By Member',
        url: '/payments/users',
      },
      {
        title: 'Providers',
        url: '/payments/providers',
      },
    ],
  },
  {
    title: 'Ledger',
    url: '/ledger',
    icon: <BookOpenIcon />,
    isActive: false,
    items: [
      {
        title: 'Dashboard',
        url: '/ledger',
      },
      {
        title: 'Entries',
        url: '/ledger/entries',
      },
      {
        title: 'Accounts',
        url: '/ledger/accounts',
      },
    ],
  },
  {
    title: 'Audit Logs',
    url: '/audit-logs',
    icon: <ScrollTextIcon />,
    isActive: false,
  },
  {
    title: 'Privacy',
    url: '#',
    icon: <ShieldIcon />,
    isActive: false,
    items: [
      {
        title: 'Consent',
        url: '/consent',
      },
      {
        title: 'DSAR',
        url: '/dsar',
      },
    ],
  },
  {
    title: 'Compliance',
    url: '/compliance',
    icon: <ClipboardCheck />,
    isActive: false,
  },
  {
    title: 'Settings',
    url: '#',
    icon: <Settings2Icon />,
    items: [
      {
        title: 'Associations',
        url: '/associations/current',
      },
      {
        title: 'Member Types',
        url: '/member-types',
      },
      {
        title: 'General',
        url: '#',
      },
      {
        title: 'Change Password',
        url: '/change-password',
      },
    ],
  },
];
