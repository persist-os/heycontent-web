import { HelpPage } from '@/components/ui/help-modal';

export const settingsHelp: HelpPage[] = [
  {
    title: "Welcome to Settings",
    description: "Settings is your control center for customizing your HeyContent experience. Manage your account, configure preferences, and control your data and privacy settings."
  },
  {
    title: "Account Settings",
    description: "Manage your account information:\n\n• Update your profile information\n• Change your email and password\n• Manage your subscription plan\n• View billing history and invoices\n• Account security and two-factor authentication"
  },
  {
    title: "Platform Connections",
    description: "Manage your connected platforms:\n\n• Connect or disconnect YouTube, Instagram, Gmail\n• Refresh platform authentication tokens\n• Configure platform-specific settings\n• Review permission levels and data access\n• Troubleshoot connection issues"
  },
  {
    title: "Privacy & Data",
    description: "Control your data and privacy:\n\n• Data retention settings\n• Content analysis preferences\n• Export your data\n• Delete specific content or insights\n• Privacy controls and data sharing options"
  },
  {
    title: "Notifications",
    description: "Customize your notification preferences:\n\n• Email notification settings\n• In-app notification controls\n• Insight generation alerts\n• Platform sync notifications\n• Weekly/monthly summary emails"
  },
  {
    title: "Preferences",
    description: "Customize your app experience:\n\n• Theme and appearance settings\n• Default analysis preferences\n• Content display options\n• AI interaction settings\n• Keyboard shortcuts customization"
  }
];

// Instructions for updating this help content:
/*
TO UPDATE SETTINGS HELP:
1. Edit the settingsHelp array above
2. Add new HelpPage objects for new settings sections
3. Update when new preferences or options are added
4. Include specific instructions for complex settings

Example of adding a new help page:
{
  title: "New Settings Section",
  description: "Description of the new settings area...",
  image: "/images/help/settings-feature.png" // optional
}
*/ 