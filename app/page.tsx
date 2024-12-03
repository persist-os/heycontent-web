import { redirect } from 'next/navigation'

export default function Home() {
  // For now, redirect to login. Later we can add auth check here
  redirect('/login')
} 