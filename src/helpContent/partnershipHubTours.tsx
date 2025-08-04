import React from 'react';
import { InteractiveStep } from '@/components/ui/interactive-tooltip';
import { TourContent } from './tourContent';
import { 
  Users, 
  Mail, 
  Search, 
  MessageSquare, 
  DollarSign,
  RefreshCw,
  CheckCircle,
  Eye,
  Sparkles,
  BarChart3,
  FileText,
  Edit3,
  Settings,
  Target,
  HandHeart,
  Handshake,
  Calendar,
  Clock,
  Star,
  Filter,
  Brain,
  Activity,
  TrendingUp,
  Award,
  Lightbulb
} from 'lucide-react';

// Ensure Search component is available
const SearchIcon = Search || (() => <span>🔍</span>);

// Partnership Hub specific tour content
const PartnershipHubContent = {
  // Welcome content
  welcomeDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
        <Users className="w-4 h-4" />
        <span className="font-medium">Partnership Hub Overview</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Your command center for brand collaborations:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Gmail Integration:</strong> Automatically discover partnership opportunities</li>
          <li>• <strong>Partnership Tracking:</strong> Manage status from inquiry to completion</li>
          <li>• <strong>Smart Categorization:</strong> AI sorts partnerships by type and value</li>
          <li>• <strong>AI Email Drafting:</strong> Persona-aware intelligent reply composition</li>
          <li>• <strong>Pipeline Management:</strong> Track deal values and progress</li>
        </ul>
        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Growth power:</strong> Transform your email inbox into a partnership discovery engine!
        </div>
      </div>
    </div>
  ),

  // Gmail connection detailed content
  gmailConnectionDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Mail className="w-4 h-4" />
        <span className="font-medium">Gmail Integration</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Connect Gmail to unlock partnership opportunities:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Auto-Discovery:</strong> AI finds brand collaboration emails</li>
          <li>• <strong>Smart Filtering:</strong> Separates real opportunities from spam</li>
          <li>• <strong>Value Estimation:</strong> Calculates potential deal values</li>
          <li>• <strong>Status Tracking:</strong> Monitors conversation progress</li>
          <li>• <strong>Regular Sync:</strong> Keeps finding new opportunities</li>
        </ul>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Privacy note:</strong> We only analyze partnership-related emails, not personal messages.
        </div>
      </div>
    </div>
  ),

  // Partnership filters detailed content
  partnershipFiltersDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <BarChart3 className="w-4 h-4" />
        <span className="font-medium">Partnership Filters</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Click filter cards to filter partnerships:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Total Emails:</strong> All partnership opportunities discovered</li>
          <li>• <strong>Active Discussions:</strong> Ongoing conversations and negotiations</li>
          <li>• <strong>Pending Responses:</strong> Opportunities waiting for your reply</li>
          <li>• <strong>Brand Deals:</strong> High-value partnerships and serious negotiations</li>
          <li>• <strong>Pipeline Value:</strong> Total estimated value of all opportunities</li>
        </ul>
        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Click trick:</strong> Click any filter card to filter your partnership list instantly!
        </div>
      </div>
    </div>
  ),

  // Partnership management detailed content
  partnershipManagementDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
        <Handshake className="w-4 h-4" />
        <span className="font-medium">Partnership Management</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Track and manage your partnership journey:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Opportunity:</strong> Initial brand interest or inquiry</li>
          <li>• <strong>Inquiry:</strong> Formal proposal or detailed discussion</li>
          <li>• <strong>Negotiating:</strong> Terms and conditions being discussed</li>
          <li>• <strong>Active:</strong> Deal confirmed and in progress</li>
          <li>• <strong>Completed:</strong> Partnership successfully finished</li>
        </ul>
        <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Pro tip:</strong> Update status regularly to track your conversion rate and success patterns!
        </div>
      </div>
    </div>
  )
};

// Comprehensive Partnership Hub Interactive Tour
export const partnershipHubInteractiveTour: InteractiveStep[] = [
  {
    id: 'partnership-welcome',
    title: 'Welcome to Partnership Hub',
    description: 'Your command center for discovering, managing, and growing brand collaborations.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-3">
        {TourContent.welcomeHeader(<Users className="w-4 h-4" />, 'Partnership Hub Tour')}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Learn to discover brand opportunities, manage partnerships, and track your collaboration business.
        </p>
        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Interactive walkthrough:</strong> We'll guide you through actually using partnership features!
        </div>
      </div>
    )
  },
  {
    id: 'partnership-dashboard',
    title: 'Your Partnership Dashboard',
    description: 'This is your partnership command center - metrics, opportunities, and deal tracking in one place.',
    target: 'h1',
    position: 'bottom',
    delay: 300,
    action: 'none',
    content: PartnershipHubContent.welcomeDetailed
  },
  {
    id: 'connect-gmail-first',
    title: 'Connect Gmail to Discover Opportunities',
    description: 'First, ensure Gmail is connected to automatically discover brand collaboration opportunities.',
    position: 'center',
    delay: 400,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Mail className="w-4 h-4" />
          <span className="font-medium">Gmail Connection Required</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>To unlock partnership discovery:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Go to Settings</strong> → Platform Connect</li>
            <li>• <strong>Connect Gmail</strong> with partnership permissions</li>
            <li>• <strong>Return here</strong> to start discovering opportunities</li>
            <li>• <strong>AI will analyze</strong> your inbox for collaboration emails</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Already connected?</strong> Great! The next steps will show you how to use your partnership data.
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'try-partnership-filters',
    title: 'Try Partnership Filters',
    description: 'Click the filter cards to filter your partnerships by type - try clicking "Active Discussions" or "Brand Deals".',
    target: 'div[class*="cursor-pointer"]',
    position: 'bottom',
    delay: 500,
    action: 'click',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <BarChart3 className="w-4 h-4" />
          <span className="font-medium">Try Partnership Filters</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click any filter card to filter partnerships:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Total Emails:</strong> See all discovered opportunities</li>
            <li>• <strong>Active Discussions:</strong> Focus on ongoing conversations</li>
            <li>• <strong>Pending Responses:</strong> Find partnerships needing your reply</li>
            <li>• <strong>Brand Deals:</strong> View high-value partnerships</li>
          </ul>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Try it now:</strong> Click "Active Discussions" to see partnerships in progress!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'find-new-opportunities',
    title: 'Find New Opportunities',
    description: 'Click "Find New Opportunities" to sync your Gmail and discover fresh partnership possibilities.',
    target: '[data-find-opportunities-button]',
    position: 'bottom',
    delay: 600,
    action: 'click',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <RefreshCw className="w-4 h-4" />
          <span className="font-medium">Discover Fresh Opportunities</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click "Find New Opportunities" to:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Sync Gmail:</strong> Scan for new partnership emails</li>
            <li>• <strong>AI Analysis:</strong> Identify collaboration opportunities</li>
            <li>• <strong>Smart Categorization:</strong> Sort by partnership type</li>
            <li>• <strong>Value Estimation:</strong> Calculate potential deal values</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Pro tip:</strong> Run this weekly to keep discovering new collaboration opportunities!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'try-partnership-search',
    title: 'Try Partnership Search',
    description: 'Use the search bar to find specific partnerships, brands, or opportunities by keywords.',
    target: 'input[placeholder*="Search partnerships"]',
    position: 'bottom',
    delay: 700,
    action: 'focus',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
          <SearchIcon className="w-4 h-4" />
          <span className="font-medium">Try Partnership Search</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click the search bar and try searching:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Brand names:</strong> Find specific companies</li>
            <li>• <strong>Keywords:</strong> Search email subjects or content</li>
            <li>• <strong>Values:</strong> Find high-value partnerships</li>
            <li>• <strong>Status:</strong> Filter by partnership stage</li>
          </ul>
          <div className="bg-cyan-50 dark:bg-cyan-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Try it:</strong> Search for a brand name or keyword to see how powerful the search is!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'select-partnership',
    title: 'Select a Partnership to Manage',
    description: 'Click on any partnership in the list to view details, conversation history, and manage the collaboration.',
    position: 'center',
    delay: 800,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Eye className="w-4 h-4" />
          <span className="font-medium">Select and Manage Partnerships</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click any partnership on the left to:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>View Details:</strong> See brand info, estimated value, and status</li>
            <li>• <strong>Read Conversation:</strong> Full email thread and context</li>
            <li>• <strong>Update Status:</strong> Track progress from inquiry to completion</li>
            <li>• <strong>Draft Replies:</strong> AI-powered email composition with persona awareness</li>
            <li>• <strong>Manage Timeline:</strong> Track all partnership interactions</li>
          </ul>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Try it now:</strong> Click any partnership to see the full detail panel!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'manage-partnership-status',
    title: 'Update Partnership Status',
    description: 'In the detail panel, update partnership status to track your collaboration pipeline.',
    position: 'center',
    delay: 900,
    action: 'none',
    content: PartnershipHubContent.partnershipManagementDetailed
  },
  {
    id: 'ai-powered-email-drafting',
    title: 'AI-Powered Email Drafting',
    description: 'Click "Start Draft" to open the intelligent email composer that understands your persona and crafts perfect replies.',
    position: 'center',
    delay: 1000,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Edit3 className="w-4 h-4" />
          <span className="font-medium">AI-Powered Email Drafting</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click "Start Draft" to unlock intelligent email composition:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Persona-Aware AI:</strong> Tailors responses based on your unique creator style</li>
            <li>• <strong>Context Understanding:</strong> Analyzes the full email thread for perfect replies</li>
            <li>• <strong>Smart Templates:</strong> Quick shortcuts for accept, decline, negotiate, etc.</li>
            <li>• <strong>Brand Intelligence:</strong> Understands what each brand values most</li>
            <li>• <strong>Save to Notes:</strong> Save drafts as email notes, turn into content/scripts later</li>
          </ul>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Pro tip:</strong> Use Cmd+K or / shortcuts for templates. Save drafts as notes to repurpose!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'partnership-tour-complete',
    title: 'Partnership Hub Mastery Complete!',
    description: 'You now know how to discover, manage, and grow your brand collaborations effectively.',
    position: 'center',
    delay: 1100,
    action: 'none',
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Partnership Hub Tour Complete!</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You're ready to discover and manage brand collaborations like a pro!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.location.href = '/dashboard/content-hub'}
            className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors group"
          >
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-purple-900 dark:text-purple-100">Content Hub</div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Analyze performance</div>
            </div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard/notes'}
            className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors group"
          >
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Smart Notes</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Capture strategies</div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.location.href = '/dashboard/self-hub'}
            className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors group"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Self Hub</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">Track your growth</div>
            </div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard/chat'}
            className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors group"
          >
            <MessageSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-orange-900 dark:text-orange-100">AI Chat</div>
              <div className="text-xs text-orange-700 dark:text-orange-300">Get help anytime</div>
            </div>
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Power combo:</strong> Use Partnership Hub with other features:
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
            <li>• Analyze partnership content in Content Hub</li>
            <li>• Use AI drafting to craft perfect partnership replies</li>
            <li>• Track partnership patterns in Self Hub</li>
            <li>• Ask Chat for partnership advice</li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Happy collaborating! Your partnership business is now organized and ready to scale.
          </p>
        </div>
      </div>
    )
  }
]; 