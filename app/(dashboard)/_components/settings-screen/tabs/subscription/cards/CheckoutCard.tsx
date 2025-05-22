'use client'

import React, { useState, useEffect } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '@/app/context/auth-context'
import { getApiKey } from '@/app/lib/api-helpers'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

interface Props {
  planId: string
}

export default function CheckoutCard({ planId }: Props) {
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const apiKey = await getApiKey()
        setApiKey(apiKey)
      } catch (error) {
        setError(error.message)
      }
    }
    loadApiKey()
  }, [])

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
  }, [planId, user, apiKey])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}