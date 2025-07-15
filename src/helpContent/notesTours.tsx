import React from 'react';
import { InteractiveStep } from '@/components/ui/interactive-tooltip';
import { TourContent } from './tourContent';
import { 
  FileText, 
  Edit3, 
  Zap, 
  Plus, 
  Hash, 
  Link, 
  FolderOpen,
  Search,
  Lightbulb,
  BarChart3,
  CheckSquare,
  Users,
  BookOpen,
  Mail,
  Sparkles,
  ArrowRight,
  Award,
  MessageCircle,
  Save,
  Eye,
  Layers,
  Settings,
  Brain,
  CheckCircle,
  Image
} from 'lucide-react';

// Smart Notes specific tour content
const NotesContent = {
  // Welcome content
  welcomeDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <FileText className="w-4 h-4" />
        <span className="font-medium">Smart Notes Overview</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Your AI-powered thinking workspace:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Intelligent Organization:</strong> Auto-categorized notes with smart tagging</li>
          <li>• <strong>AI Writing Assistant:</strong> Type "/" anywhere for instant help</li>
          <li>• <strong>Content Linking:</strong> Connect notes to your social media posts</li>
          <li>• <strong>Project Management:</strong> Organize notes into collaborative projects</li>
          <li>• <strong>Cross-Platform Integration:</strong> Links with Chat and Content Hub</li>
        </ul>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Power feature:</strong> Smart Notes learns from your writing style and suggests improvements!
        </div>
      </div>
    </div>
  ),

  // Inline AI detailed content
  inlineAIDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <Zap className="w-4 h-4" />
        <span className="font-medium">AI Writing Assistant</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Two ways to get AI help while writing:</strong></p>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs">
          <p className="font-medium text-blue-800 dark:text-blue-200">⌘K (Cmd+K) - Works anywhere in your notes</p>
          <p className="text-blue-700 dark:text-blue-300">Quick access to AI assistance while writing</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs">
          <p className="font-medium text-green-800 dark:text-green-200">Type "/" - Inline AI Commands</p>
          <p className="text-green-700 dark:text-green-300">Context-aware writing assistance within your notes</p>
        </div>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>/continue</strong> - AI finishes your thoughts naturally</li>
          <li>• <strong>/expand</strong> - Develop ideas into full sections</li>
          <li>• <strong>/summarize</strong> - Create concise summaries</li>
          <li>• <strong>/brainstorm</strong> - Generate new ideas from your notes</li>
          <li>• <strong>/rewrite</strong> - Improve tone and clarity</li>
        </ul>
        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Smart tip:</strong> Different note types unlock specialized "/" commands tailored to that content type!
        </div>
      </div>
    </div>
  ),

  // Note types content
  noteTypesDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
        <Layers className="w-4 h-4" />
        <span className="font-medium">Smart Note Types & Specialized Commands</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Each note type unlocks specialized "/" commands:</strong></p>
        <div className="space-y-2">
          <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded text-xs">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">💡 Idea Bank</p>
            <p className="text-yellow-700 dark:text-yellow-300">Commands: /brainstorm, /concept-develop, /idea-connect, /trend-analyze</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs">
            <p className="font-medium text-blue-800 dark:text-blue-200">📝 Content Script</p>
            <p className="text-blue-700 dark:text-blue-300">Commands: /hook-create, /structure-video, /cta-generate, /script-outline</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs">
            <p className="font-medium text-green-800 dark:text-green-200">📊 Analytics Insight</p>
            <p className="text-green-700 dark:text-green-300">Commands: /performance-analyze, /growth-track, /trend-identify, /metrics-explain</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs">
            <p className="font-medium text-purple-800 dark:text-purple-200">🤝 Collaboration</p>
            <p className="text-purple-700 dark:text-purple-300">Commands: /team-brief, /partnership-plan, /workflow-optimize, /deadline-track</p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Auto-detection:</strong> Smart Notes automatically suggests the best type and shows relevant commands as you type!
        </div>
      </div>
    </div>
  ),

  // Content linking detailed
  contentLinkingDetailed: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
        <Link className="w-4 h-4" />
        <span className="font-medium">Content Linking System</span>
      </div>
      <div className="text-sm space-y-2">
        <p className="text-gray-900 dark:text-gray-100"><strong>Connect your notes to real content:</strong></p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>@note:</strong> Link to other notes for idea threads</li>
          <li>• <strong>@youtube:</strong> Connect to your YouTube videos</li>
          <li>• <strong>@instagram:</strong> Link to your Instagram posts</li>
          <li>• <strong>@gmail:</strong> Reference email campaigns</li>
          <li>• <strong>@insight:</strong> Link to AI-generated insights</li>
        </ul>
        <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Smart workflow:</strong> Build comprehensive content strategies by linking related pieces!
        </div>
      </div>
    </div>
  )
};

// Comprehensive Smart Notes Interactive Tour
export const notesInteractiveTour: InteractiveStep[] = [
  {
    id: 'notes-welcome',
    title: 'Welcome to Smart Notes',
    description: 'Your AI-powered thinking workspace that transforms ideas into content strategies.',
    position: 'center',
    delay: 0,
    content: (
      <div className="space-y-3">
        {TourContent.welcomeHeader(<FileText className="w-4 h-4" />, 'Smart Notes Tour')}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Learn to create notes, use AI assistance, and organize your content ideas effectively.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
          <strong>Interactive walkthrough:</strong> We'll guide you through actually creating and using notes!
        </div>
      </div>
    )
  },
  {
    id: 'notes-dashboard',
    title: 'Your Notes Dashboard',
    description: 'This is your notes overview - all your ideas, drafts, and projects organized in one place.',
    target: 'h1',
    position: 'bottom',
    delay: 300,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <FileText className="w-4 h-4" />
          <span className="font-medium">Your Notes Dashboard</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Your intelligent workspace:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>All your content ideas</strong> in one place</li>
            <li>• <strong>AI-powered writing assistance</strong> with ⌘K and "/" commands</li>
            <li>• <strong>Smart organization</strong> with projects and tags</li>
            <li>• <strong>Content linking</strong> to your social media posts</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'create-first-note',
    title: 'Create Your First Note',
    description: 'Click the yellow + button to create a new note and start experiencing Smart Notes features.',
    position: 'center',
    delay: 400,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Plus className="w-4 h-4" />
          <span className="font-medium">Create Your First Note</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click the yellow + button (bottom-right) to get started:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Choose from different note types</li>
            <li>• Start with a blank note or template</li>
            <li>• AI will help you write from the moment you start</li>
          </ul>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Try it now:</strong> Create a note to continue the tour!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'ai-writing-help',
    title: 'AI Writing Assistant',
    description: 'Use ⌘K (Cmd+K) or type "/" in your note to get AI writing assistance.',
    position: 'center',
    delay: 500,
    action: 'none',
    content: NotesContent.inlineAIDetailed
  },
  {
    id: 'try-note-types',
    title: 'Try Different Note Types',
    description: 'Each note type has specialized AI commands. Try creating different types!',
    position: 'center',
    delay: 600,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Layers className="w-4 h-4" />
          <span className="font-medium">Try Different Note Types</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Each type unlocks specialized features:</strong></p>
          <div className="space-y-2">
            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded text-xs">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">💡 Try "Idea Bank" - for brainstorming</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs">
              <p className="font-medium text-blue-800 dark:text-blue-200">📝 Try "Content Script" - for video content</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs">
              <p className="font-medium text-green-800 dark:text-green-200">📊 Try "Analytics Insight" - for performance tracking</p>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Try it:</strong> Create notes of different types and see the specialized "/" commands!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'organize-with-projects',
    title: 'Organize with Projects',
    description: 'Click "Projects" filter to see how to group related notes together.',
    target: '[data-projects-filter]',
    position: 'bottom',
    delay: 700,
    action: 'click',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <FolderOpen className="w-4 h-4" />
          <span className="font-medium">Organize with Projects</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click "Projects" to see project view:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Group related notes</strong> into projects</li>
            <li>• <strong>Collaborate with teams</strong> on shared projects</li>
            <li>• <strong>Track project progress</strong> and deadlines</li>
          </ul>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Try it:</strong> Click Projects to see how organization works!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'try-search',
    title: 'Try Smart Search',
    description: 'Use the search bar to find notes instantly by content, tags, or type.',
    target: 'input[placeholder*="Search"]',
    position: 'bottom',
    delay: 800,
    action: 'focus',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
          <Search className="w-4 h-4" />
          <span className="font-medium">Try Smart Search</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>👆 Click the search bar and try searching:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Type any keyword</strong> to find notes</li>
            <li>• <strong>Filter by tags</strong> using the tag buttons</li>
            <li>• <strong>Switch between note types</strong> with the colored buttons</li>
          </ul>
          <div className="bg-cyan-50 dark:bg-cyan-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Try it:</strong> Search for something to see how powerful it is!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'add-media-to-notes',
    title: 'Add Images & Media',
    description: 'Click the image button in any note to add photos, screenshots, and visual content.',
    position: 'center',
    delay: 900,
    action: 'none',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Image className="w-4 h-4" />
          <span className="font-medium">Add Images & Media</span>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-gray-900 dark:text-gray-100"><strong>Make your notes visual and engaging:</strong></p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>Add photos</strong> to document your content creation process</li>
            <li>• <strong>Include screenshots</strong> of analytics, comments, or inspiration</li>
            <li>• <strong>Upload reference images</strong> for mood boards and planning</li>
            <li>• <strong>Create visual galleries</strong> within your notes</li>
          </ul>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded text-xs text-gray-800 dark:text-gray-200">
            <strong>Look for:</strong> The image button appears when you open a note - perfect for visual creators!
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'notes-tour-complete',
    title: 'Smart Notes Mastery Complete!',
    description: 'You now know how to create, organize, and enhance your notes with AI assistance.',
    position: 'center',
    delay: 900,
    action: 'none',
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Smart Notes Tour Complete!</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You're ready to transform your ideas into organized, AI-enhanced content!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.location.href = '/dashboard/self-hub'}
            className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors group"
          >
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Self Hub</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Track your growth</div>
            </div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard/content-hub'}
            className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors group"
          >
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-purple-900 dark:text-purple-100">Content Hub</div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Generate content</div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.location.href = '/dashboard/partnerships'}
            className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors group"
          >
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Partnership Hub</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">Find collaborations</div>
            </div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard/chat'}
            className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors group"
          >
            <MessageCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-orange-900 dark:text-orange-100">AI Chat</div>
              <div className="text-xs text-orange-700 dark:text-orange-300">Get instant help</div>
            </div>
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Power combo:</strong> Use Smart Notes with other features:
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
            <li>• Link notes to Content Hub insights</li>
            <li>• Ask Chat questions about your notes</li>
            <li>• Track note patterns in Self Hub</li>
            <li>• Use notes for partnership planning</li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Happy note-taking! Your ideas are now organized, AI-enhanced, and ready to become amazing content.
          </p>
        </div>
      </div>
    )
  }
];

// Export the comprehensive Smart Notes tour
export const notesTours = {
  main: notesInteractiveTour
}; 