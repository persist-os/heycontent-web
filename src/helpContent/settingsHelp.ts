import { HelpPage } from '@/components/ui/help-modal';

export const settingsHelp: HelpPage[] = [
  {
    title: "Settings",
    description: "Tweak your app, your way. Make it feel like home."
  },
  {
    title: "Account",
    description: "Update your info or password. Stay secure, stay you."
  },
  {
    title: "Platforms",
    description: "Connect or disconnect your socials. More links, more power."
  },
  {
    title: "Privacy",
    description: "Control your data. Share what you want, keep the rest private."
  },
  {
    title: "Notifications",
    description: "Pick what pings you. No more notification overload."
  },
  {
    title: "Preferences",
    description: "Change the look, set your defaults. Make it yours."
  },
  {
    title: "Integrations",
    description: "Plug in other tools. Unlock bonus features."
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