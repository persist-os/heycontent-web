export interface Partnership {
  id: string
  brand: string
  type: string
  status: 'new' | 'in_progress' | 'completed' | 'cancelled'
  value: string
  deadline: string
  alignmentScore: number
  requirements: PartnershipRequirement[]
  progress: number
  lastContact: string
  lastUpdated: Date
  contacts: PartnershipContact[]
  history: PartnershipEvent[]
}

export interface PartnershipRequirement {
  id: string
  description: string
  completed: boolean
  dueDate?: string
}

export interface PartnershipContact {
  id: string
  name: string
  role: string
  email: string
  phone?: string
}

export interface PartnershipEvent {
  id: string
  date: string
  event: string
  notes?: string
}

export interface IncomingProposal {
  id: string
  brand: string
  type: string
  receivedDate: string
  estimatedValue: string
  alignmentScore: number
  status: 'pending' | 'accepted' | 'rejected'
  emailId?: string
}

export interface SuggestedPartnership {
  id: string
  brand: string
  signals: {
    comments: number
    likes: number
    dms: number
  }
  confidence: number
  potentialValue: string
  status: 'new' | 'contacted' | 'ignored'
}

export interface PartnershipData {
  active: Partnership[]
  incoming: IncomingProposal[]
  suggested: SuggestedPartnership[]
} 