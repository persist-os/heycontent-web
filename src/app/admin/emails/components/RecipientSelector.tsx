'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Users, Mail } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'

type SelectionMode = 'all' | 'role' | 'custom'

export interface UserRecipient {
  email: string
  name: string
}

interface RecipientSelectorProps {
  onRecipientsChange?: (recipients: UserRecipient[]) => void
}

export default function RecipientSelector({ onRecipientsChange }: RecipientSelectorProps) {
  const { firebaseUser } = useAuth()
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [customEmails, setCustomEmails] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<UserRecipient[]>([])

  // Get users with roles (admin only query)
  const users = useQuery(
    api.auth.getUsersWithRoles,
    firebaseUser?.uid ? { adminUserId: firebaseUser.uid } : 'skip'
  )

  const roles = ['user', 'admin', 'super_admin', 'blogger', 'ambassador', 'affiliate', 'partner']

  useEffect(() => {
    // Recalculate selected recipients when mode or selections change
    let recipients: UserRecipient[] = []

    if (selectionMode === 'all' && users) {
      // All users
      recipients = users
        .filter((u: any) => u.email)
        .map((u: any) => ({
          email: u.email,
          name: u.name || ''
        }))
    } else if (selectionMode === 'role' && users) {
      // Users by role
      recipients = users
        .filter((u: any) => selectedRoles.includes(u.role) && u.email)
        .map((u: any) => ({
          email: u.email,
          name: u.name || ''
        }))
    } else if (selectionMode === 'custom') {
      // Custom email list (no name data available)
      recipients = customEmails
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter((e) => e && e.includes('@'))
        .map((email) => ({
          email,
          name: ''
        }))
    }

    setSelectedRecipients(recipients)
    onRecipientsChange?.(recipients)
  }, [selectionMode, selectedRoles, customEmails, users, onRecipientsChange])

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Recipients
        </CardTitle>
        <CardDescription>
          Choose who will receive this email. Unsubscribed users will be automatically filtered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectionMode} onValueChange={(v) => setSelectionMode(v as SelectionMode)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="font-normal cursor-pointer">
              All Users
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="role" id="role" />
            <Label htmlFor="role" className="font-normal cursor-pointer">
              By Role
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom" className="font-normal cursor-pointer">
              Custom List
            </Label>
          </div>
        </RadioGroup>

        {selectionMode === 'role' && (
          <div className="space-y-3 pl-6 border-l-2">
            <Label>Select Roles</Label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={role}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => handleRoleToggle(role)}
                  />
                  <Label htmlFor={role} className="font-normal cursor-pointer capitalize">
                    {role.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectionMode === 'custom' && (
          <div className="space-y-2 pl-6 border-l-2">
            <Label htmlFor="custom-emails">Email Addresses</Label>
            <Textarea
              id="custom-emails"
              placeholder="Enter email addresses, one per line or separated by commas"
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple emails with commas or new lines
            </p>
          </div>
        )}

        {selectedRecipients.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                {selectedRecipients.length} recipient(s) selected
              </Label>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedRecipients.slice(0, 10).map((recipient, idx) => (
                <Badge key={idx} variant="outline" className="mr-1 mb-1">
                  {recipient.name ? `${recipient.name} (${recipient.email})` : recipient.email}
                </Badge>
              ))}
              {selectedRecipients.length > 10 && (
                <Badge variant="outline" className="mr-1 mb-1">
                  +{selectedRecipients.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

