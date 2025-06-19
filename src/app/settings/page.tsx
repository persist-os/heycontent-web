import { ReactNode } from 'react'
import DashboardLayout from '../dashboard/layout'
import SettingsScreen from './tabs/settings-screen'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsScreen />
    </DashboardLayout>
  )
}