import { ReactNode } from 'react'
import DashboardLayout from '../dashboard/layout'
import SettingsScreen from '../dashboard/_components/settings-screen'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsScreen />
    </DashboardLayout>
  )
}