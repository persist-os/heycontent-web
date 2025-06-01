'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '@/app/context/auth-context'
import { getApiKey } from '@/app/lib/api-helpers'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

interface Props {
  planId: string
  onClose?: () => void
  returnUrl?: string
}

export default function CheckoutCard({ planId, onClose, returnUrl }: Props) {
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const checkoutRef = useRef(null)

  // Load API key
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const apiKey = await getApiKey()
        setApiKey(apiKey)
      } catch (error) {
        setError(error.message)
        setLoading(false)
      }
    }
    loadApiKey()
  }, [])

  // Fetch client secret
  useEffect(() => {
    const fetchClientSecret = async () => {
      if (!apiKey || !user) return
      try {
        const response = await fetch('/api/subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            planId,
            userId: user.uid,
            email: user.email,
            name: user.displayName,
            ...(returnUrl ? { returnUrl } : {})
          })
        })
        const data = await response.json()
        console.log('Checkout session response:', data)
        
        // Extract client_secret from the nested response structure
        if (data.data?.client_secret) {
          setClientSecret(data.data.client_secret)
        } else if (data.success && data.data?.client_secret) {
          setClientSecret(data.data.client_secret)
        } else if (data.session?.data?.client_secret) {
          setClientSecret(data.session.data.client_secret)
        } else {
          throw new Error('Client secret not found in response')
        }
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchClientSecret()
  }, [planId, user, apiKey, returnUrl])

  // No need for checkout ready state detection anymore

  // Render loading state
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6 text-red-500">
        <p>Error: {error}</p>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        )}
      </div>
    )
  }

  // Render checkout
  return (
    <div className="relative w-full" ref={checkoutRef}>
      {onClose && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 z-20" 
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <div 
        id="checkout" 
        className="w-full min-h-[400px] sm:min-h-[500px] max-h-[80vh] sm:max-h-[85vh] overflow-auto rounded-lg stripe-embedded-checkout stripe-checkout-container"
      >
        {clientSecret && (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout className="w-full" />
          </EmbeddedCheckoutProvider>
        )}
      </div>
    </div>
  )
}