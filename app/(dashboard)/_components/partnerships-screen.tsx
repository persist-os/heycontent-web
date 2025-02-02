'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from "@/src/components/ui/badge"
import { 
  Mail, MessageSquare, Heart, Star, Clock, AlertCircle,
  CheckCircle, XCircle, DollarSign, ArrowUpRight, Filter,
  Calendar, Briefcase, Target, Bell, UserCheck, BarChart2, Search, X, ChevronDown
} from 'lucide-react'
import { 
  Partnership, 
  PartnershipContact, 
  PartnershipEvent 
} from '@/app/types/index'

const PartnershipsScreen = () => {
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date', 'value', 'progress'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Sample data structure for partnerships
  const partnerships = {
    active: [
      {
        id: 1,
        brand: "TechCo",
        type: "Product Review",
        status: "In Progress",
        value: "$5,000",
        deadline: "2024-12-20",
        alignmentScore: 92,
        requirements: [
          "2 YouTube videos",
          "3 Instagram posts",
          "1 Blog review"
        ],
        progress: 60,
        lastContact: "2024-12-01",
        contacts: [
          { name: "Sarah Miller", role: "Partnership Manager", email: "sarah@techco.com" }
        ],
        history: [
          { date: "2024-11-28", event: "Contract signed" },
          { date: "2024-11-25", event: "Terms negotiated" },
          { date: "2024-11-20", event: "Initial contact" }
        ]
      },
      {
        id: 2,
        brand: "GameStream",
        type: "Sponsored Stream",
        status: "Active",
        value: "$3,500",
        deadline: "2024-12-25",
        alignmentScore: 88,
        requirements: [
          "3 Live streams",
          "2 Social posts",
          "1 Review video"
        ],
        progress: 30,
        lastContact: "2024-12-03",
        contacts: [
          { name: "Mike Johnson", role: "Influencer Manager", email: "mike@gamestream.com" }
        ],
        history: [
          { date: "2024-12-03", event: "First stream completed" },
          { date: "2024-11-30", event: "Contract signed" },
          { date: "2024-11-22", event: "Initial meeting" }
        ]
      }
    ],
    incoming: [
      {
        id: 3,
        brand: "FashionCo",
        type: "Brand Collaboration",
        receivedDate: "2024-12-05",
        estimatedValue: "$3,000",
        alignmentScore: 85
      },
      {
        id: 4,
        brand: "FitnessPro",
        type: "Product Launch",
        receivedDate: "2024-12-04",
        estimatedValue: "$4,500",
        alignmentScore: 92
      },
      {
        id: 5,
        brand: "TechGadgets",
        type: "Review Series",
        receivedDate: "2024-12-03",
        estimatedValue: "$2,800",
        alignmentScore: 78
      }
    ],
    suggested: [
      {
        id: 6,
        brand: "HealthCo",
        signals: {
          comments: 15,
          likes: 20,
          dms: 10
        },
        confidence: 90,
        potentialValue: "$4,000"
      },
      {
        id: 7,
        brand: "EduTech",
        signals: {
          comments: 25,
          likes: 45,
          dms: 5
        },
        confidence: 85,
        potentialValue: "$3,500"
      },
      {
        id: 8,
        brand: "GreenLiving",
        signals: {
          comments: 18,
          likes: 30,
          dms: 8
        },
        confidence: 82,
        potentialValue: "$2,800"
      }
    ]
  }

  // Add metrics data
  const metrics = [
    { 
      label: "Active Deals",
      value: "8",
      trend: "+2 this month",
      icon: Briefcase,
      color: "text-blue-500"
    },
    {
      label: "Pending Proposals",
      value: "5",
      trend: "3 high priority",
      icon: Mail,
      color: "text-purple-500"
    },
    {
      label: "Potential Matches",
      value: "12",
      trend: "85%+ alignment",
      icon: Target,
      color: "text-green-500"
    },
    {
      label: "Revenue Pipeline",
      value: "$45K",
      trend: "+28% vs last month",
      icon: DollarSign,
      color: "text-orange-500"
    }
  ]

  // Add a scroll to top button component
  const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
      const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      }

      window.addEventListener('scroll', toggleVisibility)
      return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    return (
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-blue-500 text-white shadow-lg 
          transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <ArrowUpRight className="w-6 h-6" />
      </button>
    )
  }

  // Add these helper functions
  const filterPartnerships = (partnerships: Partnership[]) => {
    return partnerships.filter(p => 
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const sortPartnerships = (partnerships: Partnership[]) => {
    return [...partnerships].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          if (!a.lastContact) return 1;
          if (!b.lastContact) return -1;
          return new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime();
        case 'value':
          return parseInt(b.value?.replace(/\D/g, '') || '0') - parseInt(a.value?.replace(/\D/g, '') || '0')
        case 'progress':
          return (b.progress || 0) - (a.progress || 0)
        default:
          return 0
      }
    })
  }

  const paginatePartnerships = (partnerships: Partnership[]) => {
    const start = (currentPage - 1) * itemsPerPage
    return partnerships.slice(start, start + itemsPerPage)
  }

  // Use these functions when rendering partnerships
  const processedPartnerships = paginatePartnerships(
    sortPartnerships(
      filterPartnerships(partnerships.active)
    )
  )

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && e.ctrlKey) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (e.key === 'ArrowDown' && e.ctrlKey) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Add new state for filter dropdown
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Add these near your other filter states
  const [filterType, setFilterType] = useState('all')
  const [filterValue, setFilterValue] = useState('all')
  const [filterProgress, setFilterProgress] = useState('all')

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-lg font-semibold mb-1">Partnership Management</h1>
            <p className="text-gray-600">Track and manage your brand collaborations</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <div className="relative">
              {searchQuery ? (
                <div className="flex items-center bg-white border rounded-lg">
                  <input
                    type="text"
                    placeholder="Search partnerships..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-4 pr-10 py-2 rounded-lg"
                    autoFocus
                  />
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchQuery(' ')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Search className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>

            {/* Sync Inbox Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
              <Mail className="w-4 h-4" />
              Sync Inbox
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-4">
            {metrics.map((metric, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gray-50">
                      <metric.icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <h3 className="text-2xl font-semibold">{metric.value}</h3>
                      <span className="text-sm text-green-500">{metric.trend}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Partnerships List */}
            <div className="col-span-8 space-y-6">
              {/* Active Partnerships */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Partnerships</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {processedPartnerships.map((partnership) => (
                      <div 
                        key={partnership.id}
                        onClick={() => setSelectedPartnership(partnership)}
                        className="p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer border"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{partnership.brand}</h3>
                              <Badge className="bg-gray-100 text-gray-700">
                                {partnership.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {partnership.deadline ? `Due: ${partnership.deadline}` : 'No deadline set'}
                              {partnership.value ? ` · Value: ${partnership.value}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-500">
                              {partnership.progress ?? 0}% Complete
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Last updated: {partnership.lastContact || 'Not available'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 h-2 bg-gray-100 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${partnership.progress ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Incoming Proposals */}
              <Card>
                <CardHeader>
                  <CardTitle>Incoming Proposals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {partnerships.incoming.map((proposal) => (
                      <div 
                        key={proposal.id}
                        className="p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer border"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{proposal.brand}</h3>
                              <Badge className="bg-purple-100 text-purple-700">
                                {proposal.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Received: {proposal.receivedDate || 'Recently'} 
                              {proposal.estimatedValue ? ` · Est. Value: ${proposal.estimatedValue}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-green-500">
                              {proposal.alignmentScore ?? 0}% Match
                            </span>
                            <Mail className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI-Suggested Partnerships */}
              <Card>
                <CardHeader>
                  <CardTitle>AI-Detected Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {partnerships.suggested.map((suggestion) => (
                      <div 
                        key={suggestion.id}
                        className="p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer border"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{suggestion.brand}</h3>
                              <Badge className="bg-blue-100 text-blue-700">
                                AI Suggested
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {suggestion.signals?.comments || 0} comments
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {suggestion.signals?.likes || 0} likes
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {suggestion.signals?.dms || 0} messages
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-purple-500">
                              {suggestion.confidence}% Confidence
                            </span>
                            <p className="text-sm text-gray-500 mt-1">
                              Est. Value: {suggestion.potentialValue}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Panel */}
            <div className="col-span-4">
              {selectedPartnership ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Partnership Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Requirements</h3>
                      <div className="space-y-2">
                        {selectedPartnership.requirements?.map((req: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {req}
                          </div>
                        )) || (
                          <div className="text-sm text-gray-500">No requirements specified</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Contacts</h3>
                      {selectedPartnership.contacts.map((contact: PartnershipContact, i: number) => (
                        <div key={i} className="text-sm space-y-1">
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-gray-600">{contact.role}</div>
                          <div className="text-blue-500">{contact.email}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Timeline</h3>
                      <div className="space-y-3">
                        {selectedPartnership.history.map((event: PartnershipEvent, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <div className="text-gray-600">{event.date}</div>
                              <div>{event.event}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        View Contract
                      </button>
                      <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                        Message Team
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a partnership to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination at the bottom */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm text-gray-600 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage}
        </span>
        <button
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={currentPage * itemsPerPage >= partnerships.active.length}
          className="px-4 py-2 text-sm text-gray-600 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Add the scroll to top button at the end of the component */}
      <ScrollToTop />

      {/* Filter Dropdown - Positioned absolutely */}
      {isFilterOpen && (
        <div className="absolute right-6 top-[4.5rem] w-72 bg-white border rounded-lg shadow-lg p-4 space-y-4 z-50">
          {/* Filter content... */}
        </div>
      )}
    </div>
  )
}

export default PartnershipsScreen