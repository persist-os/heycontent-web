'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from "@/components/ui/badge"
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
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterValue, setFilterValue] = useState('all')
  const [filterProgress, setFilterProgress] = useState('all')

  // Add refs for the search and filter containers
  const searchRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('')
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-purple-500 text-white shadow-lg 
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center">
          <div className="w-[100px] sm:w-[24px]"></div>
          <div className="flex-1 flex justify-center sm:justify-start">
            <div className="text-center sm:text-left">
              <h1 className="text-base font-medium text-black dark:text-white">Partnership Management</h1>
              <p className="text-text-gray dark:text-gray-400">
                <span className="hidden sm:inline">Track and manage your brand collaborations</span>
              </p>
            </div>
          </div>
          <div className="w-[100px] sm:w-auto flex justify-end gap-2">
            {/* Search Button */}
            <div className="relative" ref={searchRef}>
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
            <div ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors bg-heycontent-yellow text-black hover:bg-heycontent-yellow/90">
              <div className="relative">
                <Mail className="w-4 h-4" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-heycontent-green rounded-full animate-pulse" />
              </div>
              <span className="hidden sm:inline">Sync Inbox</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {metrics.map((metric, i) => (
              <Card key={i}>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-heycontent-light-yellow shrink-0">
                      <metric.icon className={`w-4 h-4 sm:w-6 sm:h-6 ${metric.color}`} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-text-gray">{metric.label}</p>
                      <h3 className="text-lg sm:text-2xl font-semibold text-text-dark">{metric.value}</h3>
                      <span className="text-xs sm:text-sm text-heycontent-green">{metric.trend}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {/* Partnerships List */}
            <div className="space-y-4 md:space-y-6">
              {/* Active Partnerships */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Partnerships</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {processedPartnerships.map((partnership) => (
                      <div key={partnership.id}>
                        <div 
                          onClick={() => setSelectedPartnership(partnership)}
                          className="p-3 md:p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer border"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-medium text-text-dark">{partnership.brand}</h3>
                                <Badge className="bg-heycontent-light-yellow text-text-dark text-xs">
                                  {partnership.type}
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-text-gray mt-1">
                                {partnership.deadline ? `Due: ${partnership.deadline}` : 'No deadline set'}
                                {partnership.value ? ` · Value: ${partnership.value}` : ''}
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-xs sm:text-sm font-medium text-heycontent-purple">
                                {partnership.progress ?? 0}% Complete
                              </div>
                              <div className="text-xs sm:text-sm text-text-gray mt-0.5">
                                Last updated: {partnership.lastContact || 'Not available'}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 h-1.5 sm:h-2 bg-heycontent-light-yellow rounded-full">
                            <div 
                              className="h-1.5 sm:h-2 bg-heycontent-yellow rounded-full"
                              style={{ width: `${partnership.progress ?? 0}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Partnership Details - Shown when selected */}
                        {selectedPartnership?.id === partnership.id && (
                          <div className="mt-3 p-3 md:p-4 bg-heycontent-light-yellow rounded-xl border border-heycontent-yellow/20">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h3 className="text-sm font-medium mb-2 text-text-dark">Requirements</h3>
                                <div className="space-y-2">
                                  {selectedPartnership.requirements?.map((req: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-text-dark">
                                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-heycontent-green shrink-0" />
                                      {req}
                                    </div>
                                  )) || (
                                    <div className="text-xs sm:text-sm text-text-gray">No requirements specified</div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-medium mb-2 text-text-dark">Contacts</h3>
                                {selectedPartnership.contacts.map((contact: PartnershipContact, i: number) => (
                                  <div key={i} className="text-xs sm:text-sm space-y-1">
                                    <div className="font-medium text-text-dark">{contact.name}</div>
                                    <div className="text-text-gray">{contact.role}</div>
                                    <div className="text-heycontent-purple">{contact.email}</div>
                                  </div>
                                ))}
                              </div>

                              <div>
                                <h3 className="text-sm font-medium mb-2 text-text-dark">Timeline</h3>
                                <div className="space-y-2">
                                  {selectedPartnership.history.map((event: PartnershipEvent, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-text-gray mt-0.5 shrink-0" />
                                      <div>
                                        <div className="text-text-gray">{event.date}</div>
                                        <div className="text-text-dark">{event.event}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                              <button className="flex-1 px-4 py-2 bg-heycontent-yellow text-black text-xs sm:text-sm rounded-lg hover:bg-heycontent-yellow/90">
                                View Contract
                              </button>
                              <button className="flex-1 px-4 py-2 bg-heycontent-purple text-white text-xs sm:text-sm rounded-lg hover:bg-heycontent-purple/90">
                                Message Team
                              </button>
                            </div>
                          </div>
                        )}
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
                  <div className="space-y-3 md:space-y-4">
                    {partnerships.incoming.map((proposal) => (
                      <div 
                        key={proposal.id}
                        className="p-3 md:p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer border"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium text-text-dark">{proposal.brand}</h3>
                              <Badge className="bg-heycontent-light-purple text-heycontent-purple text-xs">
                                {proposal.type}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-text-gray mt-1">
                              Received: {proposal.receivedDate || 'Recently'} 
                              {proposal.estimatedValue ? ` · Est. Value: ${proposal.estimatedValue}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-left sm:text-right">
                            <span className="text-xs sm:text-sm font-medium text-heycontent-green">
                              {proposal.alignmentScore ?? 0}% Match
                            </span>
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-text-gray" />
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
                  <div className="space-y-3 md:space-y-4">
                    {partnerships.suggested.map((suggestion) => (
                      <div key={suggestion.id}>
                        <div className="p-3 md:p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer border">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-medium text-text-dark">{suggestion.brand}</h3>
                                <Badge className="bg-heycontent-light-green text-heycontent-green text-xs">
                                  AI Detected
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <p className="text-xs sm:text-sm text-text-gray">
                                  Potential Value: {suggestion.potentialValue}
                                </p>
                                <span className="text-xs sm:text-sm font-medium text-heycontent-green">
                                  {suggestion.confidence}% Confidence
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:items-end gap-1">
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-text-gray">
                                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{suggestion.signals.comments} Comments</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-text-gray">
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{suggestion.signals.likes} Likes</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-text-gray">
                                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{suggestion.signals.dms} DMs</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <button className="flex-1 px-3 py-1.5 bg-heycontent-yellow text-black text-xs sm:text-sm rounded-lg hover:bg-heycontent-yellow/90">
                              Start Outreach
                            </button>
                            <button className="flex-1 px-3 py-1.5 bg-heycontent-light-yellow text-text-dark text-xs sm:text-sm rounded-lg hover:bg-heycontent-light-yellow/80">
                              View Analysis
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
        <div className="absolute right-6 top-[4.5rem] w-72 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-lg shadow-lg p-4 space-y-4 z-50">
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-text-dark">Status</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filterStatus === 'all'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filterStatus === 'active'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filterStatus === 'pending'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filterStatus === 'completed'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-sm text-text-dark">Sort By</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  sortBy === 'date'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('value')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  sortBy === 'value'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                Value
              </button>
              <button
                onClick={() => setSortBy('progress')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  sortBy === 'progress'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                Progress
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-sm text-text-dark">Type</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filterType === 'all'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setFilterType('product')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filterType === 'product'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                Product Review
              </button>
              <button
                onClick={() => setFilterType('sponsored')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filterType === 'sponsored'
                    ? 'bg-heycontent-yellow text-black'
                    : 'bg-heycontent-light-yellow text-text-dark'
                }`}
              >
                Sponsored Content
              </button>
            </div>
          </div>

          <div className="pt-4 border-t dark:border-gray-800">
            <button
              onClick={() => {
                setFilterStatus('all')
                setSortBy('date')
                setFilterType('all')
                setIsFilterOpen(false)
              }}
              className="w-full px-4 py-2 text-sm text-text-dark hover:bg-heycontent-light-yellow rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PartnershipsScreen