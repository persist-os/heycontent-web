'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UnsubscribePage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  
  const updateEmailPreferences = useMutation(api.userMutations.updateEmailPreferences)

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous results
    setResult(null)
    
    if (!email || !email.trim()) {
      setResult({ success: false, message: 'Please enter an email address' })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setResult({ success: false, message: 'Please enter a valid email address' })
      return
    }

    const cleanEmail = email.trim().toLowerCase()
    console.log('Starting unsubscribe process for:', cleanEmail)
    console.log('updateEmailPreferences function:', updateEmailPreferences)

    setIsLoading(true)
    try {
      console.log('Calling mutation...')
      const result = await updateEmailPreferences({
        email: cleanEmail,
        emailUnsubscribed: true
      })
      console.log('Mutation result:', result)
      
      setResult({ 
        success: result.success, 
        message: result.message 
      })
      
      // Only clear email on successful unsubscribe
      if (result.success) {
        setEmail('')
      }
    } catch (error) {
      console.error('Unsubscribe error:', error)
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to unsubscribe. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="container mx-auto px-4 pt-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back to HeyContext</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-full max-w-lg">
          {/* Icon and header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Unsubscribe from emails
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We're sorry to see you go. Enter your email address below to unsubscribe from all HeyContext emails.
            </p>
          </div>

          {/* Form card */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleUnsubscribe} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base border-input bg-background"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Unsubscribing...</span>
                    </div>
                  ) : (
                    'Unsubscribe from all emails'
                  )}
                </Button>
              </form>

              {/* Result message */}
              {result && (
                <Alert className={`mt-6 ${
                  result.success 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                    : 'border-destructive/20 bg-destructive/5'
                }`}>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <AlertDescription className={`text-base leading-relaxed ${
                      result.success 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-destructive'
                    }`}>
                      {result.message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Footer note */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Changed your mind? You can always update your email preferences in your{' '}
              <Link href="/settings" className="text-primary hover:text-primary/80 font-medium transition-colors">
                account settings
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 