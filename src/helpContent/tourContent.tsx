import React from 'react';
import { MessageCircle, Search, User, Brain, Sparkles, AtSign, Lightbulb, FileText, Zap, Layers, BarChart3 } from 'lucide-react';

// Reusable content components for tours
export const TourContent = {
  // Welcome sections
  welcomeHeader: (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
      {icon}
      <span className="font-medium">{title}</span>
    </div>
  ),

  // Command Palette content - Enhanced with personality
  commandPaletteContent: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Search className="w-4 h-4" />
        <span className="font-medium">Universal Access</span>
      </div>
      <div className="text-sm space-y-2">
        <div className="bg-blue-100 dark:bg-blue-950/30 p-3 rounded text-xs mb-2 text-center text-gray-800 dark:text-gray-200">
          <strong>🎯 Try it now:</strong> Press <kbd className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow text-gray-900 dark:text-gray-100">⌘K</kbd> to open the Command Palette!
        </div>
        <p className="text-gray-900 dark:text-gray-100"><strong>⌘K opens your gateway to:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Quick Navigation:</strong> Jump to any page instantly</li>
          <li>• <strong>Create Notes:</strong> Start a Smart Note from anywhere</li>
          <li>• <strong>Theme Toggle:</strong> Switch light/dark mode</li>
          <li>• <strong>Smart Search:</strong> Find across all your content</li>
          <li>• <strong>Quick Ask:</strong> Start conversations instantly</li>
        </ul>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Power Tip:</strong> ⌘K becomes muscle memory - use it constantly for speed!
        </div>
      </div>
    </div>
  ),

  // Ambient Insights content - More detailed and engaging
  ambientInsightsContent: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Lightbulb className="w-4 h-4" />
        <span className="font-medium">Smart Generation</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>These insights are automatically generated from your conversations, notes, and content activity - no setup required!</strong></p>
        <p className="text-gray-900 dark:text-gray-100"><strong>What feeds your insights:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Your chat conversations and questions</li>
          <li>• Smart notes you create and edit</li>
          <li>• Content from connected platforms</li>
          <li>• Your usage patterns and preferences</li>
          <li>• Content performance data</li>
        </ul>
        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Magic moment:</strong> Click any insight to instantly start a conversation about it!
        </div>
      </div>
    </div>
  ),

  // Enhanced persona system content
  personaSystemContent: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
        <User className="w-4 h-4" />
        <span className="font-medium">Your Content DNA</span>
      </div>
      <div className="text-sm space-y-2">
        <div className="bg-purple-100 dark:bg-purple-950/30 p-3 rounded text-xs mb-2 text-gray-800 dark:text-gray-200">
          <div className="text-center mb-2">
            <strong>🎯 Persona Commands:</strong>
          </div>
          <div className="space-y-1">
            <div><strong>First time:</strong> <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow text-gray-900 dark:text-gray-100">"hey content persona"</code></div>
            <div><strong>Update existing:</strong> <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow text-gray-900 dark:text-gray-100">"hey content update persona"</code></div>
            <div><strong>Generate/write:</strong> <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow text-gray-900 dark:text-gray-100">"hey content write persona"</code></div>
          </div>
        </div>
        <p className="text-gray-900 dark:text-gray-100"><strong>How your persona powers everything:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Voice Consistency:</strong> AI matches your writing style</li>
          <li>• <strong>Audience Targeting:</strong> Suggestions fit your followers</li>
          <li>• <strong>Goal Alignment:</strong> Recommendations match your objectives</li>
          <li>• <strong>Platform Optimization:</strong> Content adapted per platform</li>
          <li>• <strong>Growth Strategy:</strong> Personalized advice for your niche</li>
        </ul>
        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Evolution tip:</strong> Update your persona every 2-3 weeks as you grow and your content evolves!
        </div>
      </div>
    </div>
  ),

  // Navigation grid for explore more
  navigationGrid: (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <button 
        onClick={() => window.location.href = '/dashboard/self-hub'}
        className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30 p-3 rounded-lg text-left hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
      >
        <div className="font-medium text-purple-800 dark:text-purple-200">🧑‍💼 Self Hub</div>
        <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">Your creator dashboard & persona</div>
      </button>
      <button 
        onClick={() => window.location.href = '/dashboard/content-hub'}
        className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30 p-3 rounded-lg text-left hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
      >
        <div className="font-medium text-green-800 dark:text-green-200">📁 Content Hub</div>
        <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">Connect & analyze platforms</div>
      </button>
      <button 
        onClick={() => window.location.href = '/dashboard/partnerships'}
        className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/30 p-3 rounded-lg text-left hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
      >
        <div className="font-medium text-orange-800 dark:text-orange-200">🤝 Partnership Hub</div>
        <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">Brand collaborations</div>
      </button>
      <button 
        onClick={() => window.location.href = '/dashboard/notes'}
        className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 p-3 rounded-lg text-left hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
      >
        <div className="font-medium text-blue-800 dark:text-blue-200">📝 Smart Notes</div>
        <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">AI-powered idea development</div>
      </button>
    </div>
  ),

  // Common tip components with more personality
  proTip: (text: string) => (
    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
      <strong>Pro tip:</strong> {text}
    </div>
  ),

  magicMoment: (text: string) => (
    <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
      <strong>Magic moment:</strong> {text}
    </div>
  ),

  // Quick feature lists
  featureList: (items: string[]) => (
    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
      {items.map((item, index) => (
        <li key={index}>• {item}</li>
      ))}
    </ul>
  ),

  // Code command display
  codeCommand: (command: string) => (
    <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow text-gray-900 dark:text-gray-100">
      {command}
    </code>
  )
};

// Detailed content for complex sections that can be imported as needed
export const DetailedContent = {
  smartSearchToggle: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Search className="w-4 h-4" />
        <span className="font-medium">Context Control</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>This toggle controls whether the AI searches your content for context when answering questions.</strong></p>
        <p className="text-gray-900 dark:text-gray-100"><strong>When to use each mode:</strong></p>
        <div className="space-y-3 text-xs">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full flex-shrink-0"></div>
              <strong className="text-green-800 dark:text-green-200">ON (Smart Search):</strong>
            </div>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-5">
              <li>• Questions about your specific content</li>
              <li>• "Analyze my Instagram post about..."</li>
              <li>• "What did I write about X in my notes?"</li>
              <li>• Building on previous conversations</li>
            </ul>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-orange-500 dark:bg-orange-400 rounded-full flex-shrink-0"></div>
              <strong className="text-orange-800 dark:text-orange-200">OFF (General Mode):</strong>
            </div>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-5">
              <li>• General brainstorming sessions</li>
              <li>• Fresh creative perspectives</li>
              <li>• Industry trends and news</li>
              <li>• When you want unbiased opinions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  ),

  connectedConversations: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium">Connected Conversations</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Write any message (like "Hello" or "Content ideas for Instagram") and send it!</strong></p>
        <div className="space-y-3 text-xs">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 p-3 rounded-lg">
            <strong className="text-blue-800 dark:text-blue-200">After sending, hover over ANY message to see the Reply button (💬 - shows "Reply" tooltip):</strong>
            <ul className="text-gray-700 dark:text-gray-300 space-y-1 mt-2 ml-2">
              <li>• <strong>Your messages:</strong> Reference your own ideas</li>
              <li>• <strong>AI responses:</strong> Build on AI suggestions</li>
              <li>• <strong>Any message:</strong> Continue any conversation thread</li>
            </ul>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30 p-3 rounded-lg">
            <strong className="text-green-800 dark:text-green-200">Click the Reply button to:</strong>
            <ul className="text-gray-700 dark:text-gray-300 space-y-1 mt-2 ml-2">
              <li>• "Expand on this concept..."</li>
              <li>• "How does this apply to Instagram?"</li>
              <li>• "Give me 5 examples of this"</li>
              <li>• "Make this more specific to my audience"</li>
            </ul>
          </div>
        </div>
        <div className="bg-green-100 dark:bg-green-950/40 border border-green-300 dark:border-green-700/50 p-3 rounded-lg text-xs text-green-800 dark:text-green-200 font-medium">
          💡 <strong>Try it:</strong> Type something simple, send it, then hover over your message to see the 💬 "Reply" button!
        </div>
      </div>
    </div>
  ),

  // Enhanced @ function content
  atFunctionDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <AtSign className="w-4 h-4" />
        <span className="font-medium">Universal Content Search</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Type @ to search across ALL your content - notes, conversations, social posts, emails - and link them to your message!</strong></p>
        <p className="text-gray-900 dark:text-gray-100"><strong>What @ searches across:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Smart Notes:</strong> All your saved ideas and drafts</li>
          <li>• <strong>Previous Chats:</strong> Past conversations and insights</li>
          <li>• <strong>YouTube Videos:</strong> Analyzed content and transcripts</li>
          <li>• <strong>Instagram Posts:</strong> Captions, insights, and metrics</li>
          <li>• <strong>Email Threads:</strong> Important conversations</li>
          <li>• <strong>Content Analysis:</strong> Generated insights and reports</li>
        </ul>
        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Pro workflow:</strong> Type "@", search for relevant content, then ask specific questions about it!
        </div>
      </div>
    </div>
  )
}; 