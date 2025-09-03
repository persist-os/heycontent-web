import { ReactNode } from 'react'
import DashboardLayout from '../dashboard/layout'
import SettingsScreen from './SettingsScreen'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsScreen />
    </DashboardLayout>
  )
}