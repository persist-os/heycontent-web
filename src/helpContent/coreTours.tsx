import React from 'react';
import { InteractiveStep } from '@/components/ui/interactive-tooltip';
import { MessageCircle, Search, User, Brain, Sparkles, AtSign, Lightbulb, FileText, Zap, Layers, BarChart3 } from 'lucide-react';

// Ensure Search component is available
const SearchIcon = Search || (() => <span>🔍</span>);
import { TourContent, DetailedContent } from './tourContent';

// Core Chat Tour - All 13 essential steps with enhanced personality and detail
export const coreInteractiveTour: InteractiveStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Content Command Center',
    description: 'Let\'s explore the powerful features that make HeyContent your ultimate content creation companion.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-3">
        {TourContent.welcomeHeader(<Sparkles className="w-4 h-4" />, 'Chat Features Tour')}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This comprehensive tour will show you every feature available on the chat screen and how they work together to supercharge your content creation.
        </p>
        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Tip:</strong> Each feature is designed to work seamlessly with the others for maximum productivity!
        </div>
      </div>
    )
  },
  {
    id: 'command-palette',
    title: 'Command Palette: Your Productivity Superpower',
    description: 'Press ⌘K (Cmd+K) anywhere to access your most powerful tool - the Command Palette.',
    position: 'center',
    delay: 400,
    content: TourContent.commandPaletteContent
  },
  {
    id: 'ambient-insights',
    title: 'Ambient Insights: Your Content DNA',
    description: 'These insights are automatically generated from your conversations, notes, and content activity - no setup required!',
    target: '[data-ambient-insights]',
    position: 'right',
    delay: 500,
    action: 'hover',
    content: TourContent.ambientInsightsContent
  },
  {
    id: 'at-content-linking',
    title: 'The @ Function: Your Content Memory',
    description: 'Type @ to search across ALL your content - notes, conversations, social posts, emails - and link them to your message!',
    target: '[data-chat-input]',
    position: 'top',
    delay: 300,
    action: 'focus',
    content: DetailedContent.atFunctionDetailed
  },
  {
    id: 'smart-search-toggle',
    title: 'Smart Search Toggle: Context Control',
    description: 'This toggle controls whether the AI searches your content for context when answering questions.',
    target: '[data-context-toggle]',
    position: 'right',
    delay: 200,
    action: 'hover',
    content: DetailedContent.smartSearchToggle
  },
  {
    id: 'notepad-feature',
    title: 'Built-in Notepad: Capture Ideas Instantly',
    description: 'The floating notepad lets you capture ideas, draft content, and organize thoughts while chatting.',
    target: '[data-notepad-button]',
    position: 'top',
    delay: 300,
    action: 'hover',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <FileText className="w-4 h-4" />
          <span className="font-medium">Notepad Workflow</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>How to use the notepad:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Click the notepad icon</strong> to open your floating workspace</li>
            <li>• <strong>Quote messages</strong> directly into your notepad</li>
            <li>• <strong>Send notes to chat</strong> to continue conversations</li>
            <li>• <strong>Save as Smart Notes</strong> for permanent storage</li>
            <li>• <strong>Use markdown</strong> for rich formatting</li>
          </ul>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs space-y-1 text-gray-800 dark:text-gray-200">
            <p><strong>Perfect for:</strong></p>
            <p>• Collecting ideas from multiple conversations</p>
            <p>• Drafting content while getting AI feedback</p>
            <p>• Building comprehensive content briefs</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'persona-system',
    title: 'Your Persona: The Secret Sauce',
    description: 'Your persona isn\'t just a profile - it\'s how HeyContent learns your style, goals, and audience to personalize everything.',
    position: 'center',
    delay: 400,
    content: TourContent.personaSystemContent
  },
  {
    id: 'bottom-bar-actions',
    title: 'Quick Action Buttons: One-Click Workflows',
    description: 'These smart buttons provide instant access to common content creation workflows.',
    position: 'center',
    delay: 300,
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Zap className="w-4 h-4" />
          <span className="font-medium">Instant Workflows</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Quick access to:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Content Ideas:</strong> "What should I create next?"</li>
            <li>• <strong>Audience Growth:</strong> "How can I grow faster?"</li>
            <li>• <strong>Engagement Tips:</strong> "Improve my engagement rates"</li>
            <li>• <strong>Trending Topics:</strong> "What's trending in my niche?"</li>
            <li>• <strong>Monetization:</strong> "How to monetize my content?"</li>
            <li>• <strong>Analytics Review:</strong> "Help me understand my metrics"</li>
          </ul>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Smart feature:</strong> These buttons appear when you have no active conversation, giving you instant inspiration!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'message-referencing',
    title: 'Message References: Build on Ideas',
    description: 'Write any message and send it. Then hover over your message to see the Reply button (💬) appear.',
    target: '[data-chat-input]',
    position: 'top',
    delay: 500,
    action: 'focus',
    fallbackContent: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <MessageCircle className="w-4 h-4" />
          <span className="font-medium">Message References</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100">Send any message to see the Reply button appear when you hover over messages.</p>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Reply Button:</strong> Look for the 💬 button that appears on hover - it says "Reply" and lets you build on any message!
          </div>
        </div>
      </div>
    ),
    content: DetailedContent.connectedConversations
  },
  {
    id: 'chat-suggestions',
    title: 'AI-Powered Smart Suggestions',
    description: 'Smart suggestions appear below messages after you send them to help you continue conversations naturally.',
    position: 'center',
    delay: 300,
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Brain className="w-4 h-4" />
          <span className="font-medium">Contextual Intelligence</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>How to see suggestions:</strong></p>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs mb-2 text-gray-800 dark:text-gray-200">
            <strong>💡 Tip:</strong> Type any message and send it to see intelligent suggestions appear below!
          </div>
          <p className="text-gray-900 dark:text-gray-100"><strong>How suggestions adapt:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Persona-Aware:</strong> Matches your content style and goals</li>
            <li>• <strong>Context-Sensitive:</strong> Considers linked content and topics</li>
            <li>• <strong>Conversation-Flow:</strong> Builds naturally on previous messages</li>
            <li>• <strong>Platform-Specific:</strong> Adapts to Instagram, YouTube, etc.</li>
            <li>• <strong>Goal-Oriented:</strong> Suggests next steps toward your objectives</li>
          </ul>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Time-saver:</strong> Instead of typing, often you can just click the perfect suggestion!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'inline-commands',
    title: 'Chat Shortcuts: Power User Tips',
    description: 'Special commands and shortcuts that make you a HeyContent power user.',
    target: '[data-chat-input]',
    position: 'top',
    delay: 400,
    action: 'focus',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Zap className="w-4 h-4" />
          <span className="font-medium">Power Commands</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Special commands to try:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>"hey content persona"</strong> - Create your first persona</li>
            <li>• <strong>"hey content update persona"</strong> - Update existing persona</li>
            <li>• <strong>"hey content write persona"</strong> - Generate/write your persona</li>
            <li>• <strong>"hey content help"</strong> - Comprehensive help system</li>
            <li>• <strong>Shift+Enter</strong> - New line without sending</li>
            <li>• <strong>Enter</strong> - Send message instantly</li>
            <li>• <strong>⌘K</strong> - Open Command Palette anywhere</li>
            <li>• <strong>@content</strong> - Search and link your content</li>
          </ul>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-xs space-y-1 text-gray-800 dark:text-gray-200">
            <p><strong>Advanced workflows:</strong></p>
            <p>• Use @ to reference content, then ask specific questions</p>
            <p>• Quote insights to notepad, then send refined questions back</p>
            <p>• Reference previous messages to build complex strategies</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'tour-conclusion',
    title: 'You\'re Now a HeyContent Power User! 🎉',
    description: 'You\'ve learned every feature on the chat screen. Time to put it all together!',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">Master Workflow</span>
        </div>
        <div className="text-sm space-y-3">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30 p-3 rounded-lg">
            <p className="font-medium mb-2 text-green-800 dark:text-green-200">🚀 Your Content Creation Workflow:</p>
            <ol className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>1.</strong> Use ⌘K to jump between sections quickly</li>
              <li><strong>2.</strong> @ search to find relevant past content</li>
              <li><strong>3.</strong> Reference key messages to build complex ideas</li>
              <li><strong>4.</strong> Use notepad to organize thoughts and drafts</li>
              <li><strong>5.</strong> Click ambient insights for inspiration</li>
              <li><strong>6.</strong> Toggle smart search based on your needs</li>
            </ol>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30 p-3 rounded-lg">
            <p className="font-medium mb-2 text-purple-800 dark:text-purple-200">💡 Next Steps:</p>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <li>• <strong>Persona commands:</strong> <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100">"hey content persona"</code> | <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100">"hey content update persona"</code> | <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100">"hey content write persona"</code></li>
              <li>• Connect platforms in Settings for content analysis</li>
              <li>• Try the @ function to search your content</li>
              <li>• Experiment with the notepad for content planning</li>
            </ul>
          </div>
          <p className="text-xs text-center font-medium text-purple-600 dark:text-purple-400">
            Happy creating! You're ready to build amazing content with AI assistance! ✨
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'explore-more',
    title: 'Explore More Features! 🚀',
    description: 'Continue your journey by exploring other powerful sections of HeyContent. Each has its own interactive guide!',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Layers className="w-4 h-4" />
          <span className="font-medium">Continue Learning</span>
        </div>
        <div className="text-sm space-y-3">
          <p className="text-gray-900 dark:text-gray-100">
            <strong>Click any section below to navigate there, then press the ✨ Interactive Guide button to learn its features:</strong>
          </p>
          {TourContent.navigationGrid}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-indigo-600 dark:text-indigo-400">✨</div>
              <strong className="text-indigo-800 dark:text-indigo-200">Pro Tip:</strong>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Look for the <strong>✨ Interactive Guide</strong> button on each screen to get detailed walkthroughs of that section's features!
            </p>
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            You can also access Settings from the top-right menu to configure your account and integrations.
          </p>
        </div>
      </div>
    )
  }
];

// Essential Quick Start Tour (enhanced with personality)
export const essentialQuickStart: InteractiveStep[] = [
  {
    id: 'quick-welcome',
    title: 'Quick Start: Get Up and Running',
    description: 'Learn the 5 essential features that will transform your content creation workflow.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-3">
        {TourContent.welcomeHeader(<Sparkles className="w-4 h-4" />, '5-Minute Setup')}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Master these basics and you'll be creating better content in no time.
        </p>
      </div>
    )
  },
  {
    id: 'quick-persona',
    title: '1. Set Your Persona',
    description: 'Tell HeyContent about your style, audience, and goals. This powers everything else.',
    target: '[data-persona-tip]',
    position: 'left',
    delay: 300,
    action: 'hover',
    content: (
      <div className="space-y-2">
        <div className="text-sm">
          <strong>Just type:</strong> {TourContent.codeCommand('"hey content persona"')}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          The AI will guide you through creating your content DNA.
        </div>
      </div>
    )
  },
  {
    id: 'quick-at-function',
    title: '2. Master the @ Function',
    description: 'Type @ to search your content and get personalized, context-aware responses.',
    target: '[data-chat-input]',
    position: 'top',
    delay: 400,
    action: 'focus',
    content: (
      <div className="space-y-2">
        <div className="text-sm">
          <strong>Try it:</strong> Type @ and search for any topic you've discussed.
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          The AI will use that context to give you relevant answers.
        </div>
      </div>
    )
  },
  {
    id: 'quick-smart-notes',
    title: '3. Use Smart Notes',
    description: 'Create notes with AI assistance. Type "/" for inline AI help.',
    target: '[data-smart-notes-link]',
    position: 'right',
    delay: 500,
    action: 'hover',
    content: (
      <div className="space-y-2">
        <div className="text-sm">
          <strong>Essential shortcuts:</strong>
        </div>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <code>/continue</code> - AI continues your thoughts</li>
          <li>• <code>/analyze</code> - Get insights</li>
        </ul>
      </div>
    )
  },
  {
    id: 'quick-content-hub',
    title: '4. Connect Your Platforms',
    description: 'Link Instagram, YouTube, or Gmail to get AI analysis of your content.',
    target: '[data-content-hub-link]',
    position: 'right',
    delay: 600,
    action: 'hover',
    content: (
      <div className="space-y-2">
        <div className="text-sm">
          Connect platforms to unlock powerful insights about your content performance.
        </div>
      </div>
    )
  },
  {
    id: 'quick-ambient',
    title: '5. Watch for Ambient Insights',
    description: 'These appear automatically based on your activity - click them to explore ideas.',
    target: '[data-ambient-insights]',
    position: 'right',
    delay: 700,
    action: 'hover',
    content: (
      <div className="space-y-2">
        <div className="text-sm">
          <strong>Pro tip:</strong> The more you use HeyContent, the smarter these insights become.
        </div>
      </div>
    )
  }
];

// Enhanced Notes Tour
export const coreNotesTour: InteractiveStep[] = [
  {
    id: 'notes-welcome',
    title: 'Smart Notes: Your Idea Powerhouse',
    description: 'Smart Notes aren\'t just text - they\'re AI-powered thinking tools that help you develop ideas.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-3">
        {TourContent.welcomeHeader(<FileText className="w-4 h-4" />, 'Smart Notes Tour')}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Discover how Smart Notes transform your raw ideas into polished content.
        </p>
      </div>
    )
  },
  {
    id: 'inline-ai',
    title: 'Inline AI: Your Writing Partner',
    description: 'Type "/" anywhere in your note to get AI assistance - continue thoughts, summarize, or analyze.',
    target: '[data-note-editor]',
    position: 'right',
    delay: 400,
    action: 'focus',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Zap className="w-4 h-4" />
          <span className="font-medium">Inline AI Tools</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Available commands:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <code>/continue</code> - Finish your thoughts</li>
            <li>• <code>/summarize</code> - Create summaries</li>
            <li>• <code>/analyze</code> - Deep analysis</li>
            <li>• <code>/expand</code> - Develop ideas further</li>
          </ul>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Pro tip:</strong> The AI knows your persona and adapts suggestions to your style!
          </div>
        </div>
      </div>
    )
  }
];

// Export the enhanced tours
export const conciseTours = {
  core: coreInteractiveTour,
  quickStart: essentialQuickStart,
  notes: coreNotesTour
}; 