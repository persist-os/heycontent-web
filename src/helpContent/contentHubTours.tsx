import React from 'react';
import { InteractiveStep } from '@/components/ui/interactive-tooltip';
import { TourContent } from './tourContent';
import { 
  BarChart3, 
  Brain, 
  Instagram, 
  Youtube, 
  Sparkles, 
  Target, 
  TrendingUp, 
  RefreshCw, 
  Zap, 
  Eye,
  Settings,
  FileText,
  MessageCircle,
  Clock,
  Award,
  Layers,
  Save,
  Share2
} from 'lucide-react';

// Content Hub specific tour content
const ContentHubContent = {
  hubInsightsDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
        <Sparkles className="w-4 h-4" />
        <span className="font-medium">Hub Insights Overview</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Your content remix dashboard:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Cross-Platform Summary:</strong> All your content from Instagram, YouTube, Gmail in one view</li>
          <li>• <strong>Performance Highlights:</strong> Your best-performing posts bubble to the top</li>
          <li>• <strong>AI Smart Cards:</strong> Quick insights and recommendations for each piece</li>
          <li>• <strong>"Discuss" Feature:</strong> Click to chat with AI about any specific content</li>
          <li>• <strong>"Save" Feature:</strong> Save insights and content ideas to your notes</li>
        </ul>
        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Magic moment:</strong> Hub Insights learns what content performs best and surfaces similar opportunities!
        </div>
      </div>
    </div>
  ),

  discussFeatureDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium">"Discuss" Feature</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Chat with AI about any content:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Click "Discuss"</strong> on any post, video, or email</li>
          <li>• <strong>Auto-Context:</strong> AI already knows everything about that content</li>
          <li>• <strong>Ask Questions:</strong> "Why did this perform well?" or "How can I improve this?"</li>
          <li>• <strong>Get Ideas:</strong> "Create 5 similar content ideas" or "What's the hook here?"</li>
          <li>• <strong>Strategic Planning:</strong> "Should I post more like this?" or "What's missing?"</li>
        </ul>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Pro tip:</strong> Discuss your best-performing content to understand what made it successful!
        </div>
      </div>
    </div>
  ),

  saveFeatureDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <Save className="w-4 h-4" />
        <span className="font-medium">Save Insights</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Build your content strategy library:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Click "Save"</strong> on any insight card to capture recommendations</li>
          <li>• <strong>Auto-organized:</strong> Saved insights appear in your Notes with full context</li>
          <li>• <strong>Reference anytime:</strong> Access your saved strategies from the Notes dashboard</li>
          <li>• <strong>Build playbooks:</strong> Collect winning patterns and proven tactics</li>
          <li>• <strong>Create action plans:</strong> Turn insights into concrete next steps</li>
        </ul>
        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Strategy tip:</strong> Save your highest-impact insights to create a personalized growth playbook.
        </div>
      </div>
    </div>
  )
};

// Comprehensive Content Hub Interactive Tour
export const contentHubInteractiveTour: InteractiveStep[] = [
  {
    id: 'content-hub-welcome',
    title: 'Welcome to Your Content Hub',
    description: 'Your unified command center for analyzing, understanding, and optimizing all your content across platforms.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-3">
        {TourContent.welcomeHeader(<Sparkles className="w-4 h-4" />, 'Content Hub Tour')}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Master your content strategy with cross-platform analytics, AI insights, and smart features like "Discuss" and "Save".
        </p>
        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>What you'll learn:</strong> Hub Insights overview, platform analysis, AI discussions, and strategic optimization!
        </div>
      </div>
    )
  },
  {
    id: 'hub-insights-overview',
    title: 'Hub Insights: Your Content Remix Dashboard',
    description: 'You\'re currently viewing Hub Insights - a smart overview combining ALL your content from Instagram, YouTube, and Gmail.',
    target: '[data-hub-insights-tab]',
    position: 'bottom',
    delay: 300,
    action: 'none',
    content: ContentHubContent.hubInsightsDetailed
  },
  {
    id: 'discuss-feature-intro',
    title: 'The "Discuss" Feature: Chat About Any Content',
    description: 'Look for "Discuss" buttons on content cards - click them to start AI conversations about specific posts or videos.',
    target: '[data-discuss-button]',
    position: 'bottom',
    delay: 400,
    action: 'none',
    fallbackContent: ContentHubContent.discussFeatureDetailed,
    content: ContentHubContent.discussFeatureDetailed
  },
  {
    id: 'platform-tabs-navigation',
    title: 'Platform Focus: Click to Deep Dive',
    description: 'Click the "All", "YouTube", or "Instagram" tabs above to focus your analysis on specific platforms.',
    target: '[data-platform-tabs]',
    position: 'bottom',
    delay: 400,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Target className="w-4 h-4" />
          <span className="font-medium">Platform Navigation</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click the tabs above to switch views:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>"Hub Insights":</strong> Cross-platform overview (where you are now)</li>
            <li>• <strong>"All":</strong> Compare performance across all platforms</li>
            <li>• <strong>"YouTube":</strong> Video analytics, subscriber growth, watch time</li>
            <li>• <strong>"Instagram":</strong> Post performance, story insights, follower growth</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Navigation tip:</strong> Start with "All" to compare platforms, then dive deep into specific ones!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'posts-vs-ai-insights',
    title: 'Posts vs AI Insights: Two Analysis Modes',
    description: 'When you click a platform tab, you\'ll see "Posts" and "AI Insights" options - click between them to switch analysis types.',
    target: '[data-posts-tab]',
    position: 'bottom',
    delay: 300,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Layers className="w-4 h-4" />
          <span className="font-medium">Analysis Modes</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>After clicking a platform tab, you'll see:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>"Posts" Tab:</strong> Detailed analysis of your specific content and posts with metrics</li>
            <li>• <strong>"AI Insights" Tab:</strong> Platform opportunities and growth recommendations you can work on</li>
            <li>• <strong>Switch Freely:</strong> Click between tabs to get both content analysis and strategic opportunities</li>
            <li>• <strong>Content Cards:</strong> Each piece of content gets its own detailed card</li>
          </ul>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Analysis strategy:</strong> Check Posts for specific content insights, then AI Insights for platform opportunities!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'content-cards-interaction',
    title: 'Content Cards: Your Interactive Analytics',
    description: 'Each piece of content becomes a card with metrics and action buttons like "Discuss" and "Analytics".',
    target: '[data-content-analytics]',
    position: 'left',
    delay: 400,
    action: 'none',
    fallbackContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <BarChart3 className="w-4 h-4" />
          <span className="font-medium">Interactive Content Cards</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>When you navigate to a platform, each content piece shows:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Performance Metrics:</strong> Views, likes, comments, engagement rate</li>
            <li>• <strong>"Discuss" Button:</strong> Chat with AI about this specific content</li>
            <li>• <strong>"Analytics" Button:</strong> View detailed performance analysis</li>
            <li>• <strong>Quick Preview:</strong> Thumbnail, title, and key stats at a glance</li>
            <li>• <strong>Trend Indicators:</strong> Up/down arrows showing performance changes</li>
          </ul>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Power user tip:</strong> Click "Discuss" on your best and worst content to understand what works!
          </div>
        </div>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <BarChart3 className="w-4 h-4" />
          <span className="font-medium">Interactive Content Cards</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Each content card includes:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Performance Metrics:</strong> Views, likes, comments, engagement rate</li>
            <li>• <strong>"Discuss" Button:</strong> Chat with AI about this specific content</li>
            <li>• <strong>"Analytics" Button:</strong> View detailed performance analysis</li>
            <li>• <strong>Quick Preview:</strong> Thumbnail, title, and key stats at a glance</li>
            <li>• <strong>Trend Indicators:</strong> Up/down arrows showing performance changes</li>
          </ul>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Power user tip:</strong> Click "Discuss" on your best and worst content to understand what works!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'click-ai-insights-tab',
    title: 'Open AI Insights for Strategic Opportunities',
    description: 'Click "AI Insights" to access growth recommendations and save valuable insights to your Notes.',
    target: '[data-ai-insights-tab]',
    position: 'bottom',
    delay: 300,
    action: 'click',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Brain className="w-4 h-4" />
          <span className="font-medium">Access AI Insights</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click "AI Insights" to:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>View Growth Opportunities:</strong> Platform-specific recommendations</li>
            <li>• <strong>Save Insights:</strong> Capture valuable findings to your Notes</li>
            <li>• <strong>Find Content Patterns:</strong> AI-identified trends across your posts</li>
            <li>• <strong>Get Action Steps:</strong> Specific ways to improve performance</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>No insights yet?</strong> Connect more platforms in Settings → Platform Connect to unlock AI analysis.
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'save-feature-intro',
    title: 'Click an Insight Card to See Save Options',
    description: 'Click on any insight card below to open it and see the Save button - this captures insights to your Notes.',
    target: '[data-platform-insights]',
    position: 'top',
    delay: 300,
    action: 'none',
    fallbackContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Eye className="w-4 h-4" />
          <span className="font-medium">Try the Save Feature</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Click any insight card to:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>View detailed recommendations:</strong> See full strategic analysis</li>
            <li>• <strong>Find the Save button:</strong> Located within each opened insight</li>
            <li>• <strong>Save to Notes:</strong> Capture valuable insights with full context</li>
            <li>• <strong>Build your playbook:</strong> Collect winning strategies over time</li>
          </ul>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Try it now:</strong> Click any insight card you see to explore the Save feature!
          </div>
        </div>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Eye className="w-4 h-4" />
          <span className="font-medium">Try the Save Feature</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Click any insight card to:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>View detailed recommendations:</strong> See full strategic analysis</li>
            <li>• <strong>Find the Save button:</strong> Located within each opened insight</li>
            <li>• <strong>Save to Notes:</strong> Capture valuable insights with full context</li>
            <li>• <strong>Build your playbook:</strong> Collect winning strategies over time</li>
          </ul>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Try it now:</strong> Click any insight card you see to explore the Save feature!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'workflow-integration-power',
    title: 'Workflow Integration: Chat & Notes Connection',
    description: 'Content Hub seamlessly connects to Chat and Notes - insights flow between all tools for a unified strategy workflow.',
    target: '[data-integration-links]',
    position: 'center',
    delay: 400,
    action: 'none',
    fallbackContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Zap className="w-4 h-4" />
          <span className="font-medium">Workflow Integration</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Content Hub connects your entire workflow:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>"Discuss" → Chat:</strong> AI conversations include full content context</li>
            <li>• <strong>"Save" → Notes:</strong> Insights automatically saved with references</li>
            <li>• <strong>Chat → Content Hub:</strong> Mention content to analyze it instantly</li>
            <li>• <strong>Strategic Flow:</strong> Analyze → Discuss → Plan → Execute</li>
            <li>• <strong>Context Everywhere:</strong> Your content strategy stays connected</li>
          </ul>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Workflow magic:</strong> Start in Content Hub, discuss in Chat, plan in Notes - everything connects!
          </div>
        </div>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Zap className="w-4 h-4" />
          <span className="font-medium">Workflow Integration</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Content Hub connects your entire workflow:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>"Discuss" → Chat:</strong> AI conversations include full content context</li>
            <li>• <strong>"Save" → Notes:</strong> Insights automatically saved with references</li>
            <li>• <strong>Chat → Content Hub:</strong> Mention content to analyze it instantly</li>
            <li>• <strong>Strategic Flow:</strong> Analyze → Discuss → Plan → Execute</li>
            <li>• <strong>Context Everywhere:</strong> Your content strategy stays connected</li>
          </ul>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Workflow magic:</strong> Start in Content Hub, discuss in Chat, plan in Notes - everything connects!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'content-hub-mastery',
    title: 'Content Hub Mastery Complete!',
    description: 'You now know how to analyze content, save insights, and leverage AI recommendations for strategic growth.',
    position: 'center',
    delay: 400,
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Content Strategy Master!
          </h3>
        </div>
        
        <div className="text-sm space-y-3">
          <p className="text-gray-900 dark:text-gray-100 text-center">
            <strong>Next steps to maximize your content strategy:</strong>
          </p>
          
          {TourContent.navigationGrid}
          
          <div className="mt-3">
            <button 
              onClick={() => window.location.href = '/dashboard/chat'}
              className="w-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 p-3 rounded-lg text-left hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
            >
              <div className="font-medium text-blue-800 dark:text-blue-200 text-xs">💬 AI Chat</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">Start discussing your content insights with AI</div>
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
              <span className="font-medium text-blue-700 dark:text-blue-300">💬 Chat Integration:</span> Use "Discuss" to ask AI about specific content performance
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded">
              <span className="font-medium text-green-700 dark:text-green-300">📝 Notes Integration:</span> Save insights to build your personalized content playbook
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded">
              <span className="font-medium text-orange-700 dark:text-orange-300">🔗 Connect More:</span> Add platforms in Settings → Platform Connect for deeper insights
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded">
              <span className="font-medium text-purple-700 dark:text-purple-300">🎯 Take Action:</span> Implement AI recommendations to optimize your content strategy
            </div>
          </div>
        </div>
        
        <div className="text-center text-xs text-gray-600 dark:text-gray-400">
          <strong>Pro tip:</strong> Combine Content Hub insights with Chat AI assistance, Smart Notes planning, and Self Hub analytics for unstoppable growth!
        </div>
      </div>
    )
  }
];

// Export tours object for easy importing
export const contentHubTours = {
  main: contentHubInteractiveTour
}; 