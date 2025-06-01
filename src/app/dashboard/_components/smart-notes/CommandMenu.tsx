import React, { useEffect, useRef, useState } from 'react';
import { useSmartNoteIdeas } from '@/app/lib/api-helpers';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/app/context/auth-context';

import { 
  Hash, Star, Calendar, Image, LinkIcon, Lightbulb, MessageSquare, Type, ListOrdered, List, 
  Instagram, Youtube, Mail, Video, Film, Camera, Tv, Radio, Send, FileText, Users, Bookmark,
  MessageCircle, Newspaper, Briefcase, Network, Gift, Bot, Clock, ArrowLeft, ChevronRight
} from 'lucide-react';
import { platformPrompts, PlatformKey } from './types/platformPrompts';
import { fetchPlatformPrompts } from '@/app/lib/api-helpers';
import styles from './components/CommandMenus.module.css';

export interface Command {
  icon: any;
  label: string;
  action: string;
  shortcut?: string;
  preview?: string;
  template?: string;
  type?: 'format' | 'block' | 'metadata';
  metadata?: {
    type?: 'idea' | 'important';
    value?: boolean;
  };
}

interface CommandMenuProps {
  onSelect: (command: Command) => void;
  onClose?: () => void;
  searchTerm?: string;
  position?: { top: number; left: number };
  userId?: string;
  noteId?: string;
}
// 'aiPrompts' is intentionally included as a valid PromptStep value
type PromptStep = 'platform' | 'postType' | 'aiPrompts';

export function CommandMenu({ onSelect, onClose, searchTerm = '', position, userId: propUserId, noteId: propNoteId }: CommandMenuProps) {
  const { user } = useAuth();
  const userId = propUserId || user?.uid;
  const noteId = propNoteId;
  // Reset state to initial step when menu mounts
  useEffect(() => {
    setCurrentStep('platform');
    setSelectedPlatform(null);
    setSelectedPostType(null);
    setStepTitle('Select Platform');
    setSelectedIndex(0);
  }, []);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [currentStep, setCurrentStep] = useState<PromptStep>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [stepTitle, setStepTitle] = useState('Select Platform');
  
  // Get platform-specific icon
  const getPlatformIcon = (platform: PlatformKey, promptKey: string) => {
    if (platform === 'instagram') {
      if (promptKey.includes('reel')) return Film;
      if (promptKey.includes('story')) return Camera;
      if (promptKey.includes('carousel')) return Image;
      if (promptKey.includes('live')) return Video;
      if (promptKey.includes('guide')) return Bookmark;
      if (promptKey.includes('collab')) return Users;
      if (promptKey.includes('broadcast')) return MessageCircle;
      return Instagram;
    } else if (platform === 'youtube') {
      if (promptKey.includes('shorts')) return Film;
      if (promptKey.includes('live')) return Video;
      if (promptKey.includes('premiere')) return Tv;
      if (promptKey.includes('community')) return MessageCircle;
      if (promptKey.includes('podcast')) return Radio;
      return Youtube;
    } else if (platform === 'gmail') {
      if (promptKey.includes('newsletter')) return Newspaper;
      if (promptKey.includes('brand_pitch')) return Briefcase;
      if (promptKey.includes('outreach')) return Network;
      if (promptKey.includes('exclusive_drop')) return Gift;
      if (promptKey.includes('automated')) return Bot;
      if (promptKey.includes('drip')) return Clock;
      return Mail;
    }
    return Lightbulb;
  };
  
  // Generate a useful template based on platform and prompt type
  const generateTemplate = (platform: PlatformKey, promptKey: string, description: string) => {
    const formattedKey = promptKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const date = new Date().toLocaleDateString();
    
    return `# ${platform.charAt(0).toUpperCase() + platform.slice(1)} ${formattedKey}
${description}

**Created:** ${date}

## Content Ideas
- 
- 
- 

## Notes


`;
  };
  
  // Handle selection of a command
  const handleSelect = (command: Command) => {
    if (currentStep === 'platform') {
      // User selected a platform, move to post type selection
      setSelectedPlatform(command.action as PlatformKey);
      setCurrentStep('postType');
      setStepTitle(`${command.label} Content Types`);
      setSelectedIndex(0);
    } else if (currentStep === 'postType') {
      // User selected a post type, move to AI prompts
      setSelectedPostType(command.action);
      setCurrentStep('aiPrompts');
      setStepTitle(`AI Content Ideas for ${command.label}`);
      setSelectedIndex(0);
    } else if (currentStep === 'aiPrompts') {
      // User selected an AI prompt, complete the flow
      onSelect(command);
      onClose?.();
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    if (currentStep === 'postType') {
      setCurrentStep('platform');
      setSelectedPlatform(null);
      setStepTitle('Select Platform');
    } else if (currentStep === 'aiPrompts') {
      setCurrentStep('postType');
      setSelectedPostType(null);
      if (selectedPlatform) {
        setStepTitle(`${selectedPlatform.charAt(0).toUpperCase()}${selectedPlatform.slice(1)} Content Types`);
      }
    }
    setSelectedIndex(0);
  };
  
  // Scroll selected item into view
  const scrollSelectedIntoView = (index: number) => {
    if (!menuRef.current) return;
    
const list = menuRef.current?.querySelector(
  '.command-menu-content ul'
) as HTMLUListElement | null;
const selectedElement = list?.children[index] as HTMLElement | null;
    if (!selectedElement) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const selectedRect = selectedElement.getBoundingClientRect();

    if (selectedRect.bottom > menuRect.bottom) {
      // Scroll down if selected item is below viewport
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (selectedRect.top < menuRect.top) {
      // Scroll up if selected item is above viewport
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
setSelectedIndex(i => {
             if (filteredCommands.length === 0) return 0;
             const newIndex = (i + 1) % filteredCommands.length;
            scrollSelectedIntoView(newIndex);
             return newIndex;
           });
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => {
            if (filteredCommands.length === 0) return 0;
            const newIndex = (i - 1 + filteredCommands.length) % filteredCommands.length;
            scrollSelectedIntoView(newIndex);
            return newIndex;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
        case 'Backspace':
          if (currentStep !== 'platform' && searchTerm === '') {
            e.preventDefault();
            handleBack();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, currentStep, searchTerm, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  // State for dynamic prompts
  const [prompts, setPrompts] = useState<{ file: string; content: string }[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [promptsError, setPromptsError] = useState<string | null>(null);

  // Build commands based on the current step in the flow
  useEffect(() => {
    console.log('[CommandMenu] Current step:', currentStep);
    
    // If we're at the platform selection step, show platform options
    if (currentStep === 'platform') {
      const platformCommands: Command[] = [
        {
          icon: Instagram,
          label: 'Instagram',
          action: 'instagram',
          preview: 'Photo and video sharing social network',
          type: 'block',
          template: '',
        },
        {
          icon: Youtube,
          label: 'YouTube',
          action: 'youtube',
          preview: 'Video sharing platform',
          type: 'block',
          template: '',
        },
        {
          icon: Mail,
          label: 'Gmail',
          action: 'gmail',
          preview: 'Email marketing and communication',
          type: 'block',
          template: '',
        }
      ];
      
      // Filter platforms by search term if provided
      const filteredPlatforms = platformCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setFilteredCommands(filteredPlatforms.length > 0 ? filteredPlatforms : platformCommands);
      setSelectedIndex(0);
    } else if (currentStep === 'postType' && selectedPlatform) {
      // If we're at the post type selection step, show post types for the selected platform
      const platformData = platformPrompts[selectedPlatform];
      if (!platformData) {
        console.error(`[CommandMenu] No data found for platform: ${selectedPlatform}`);
        return;
      }
      
      const postTypeCommands: Command[] = platformData.map((value) => ({
        icon: getPlatformIcon(selectedPlatform, value.key),
        label: value.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        action: value.key,
        preview: value.description,
        type: 'block',
        template: generateTemplate(selectedPlatform, value.key, value.description),
      }));
      
      // Filter post types by search term if provided
      const filteredPostTypes = searchTerm
        ? postTypeCommands.filter(cmd =>
            cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cmd.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cmd.preview && cmd.preview.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : postTypeCommands;
      
      setFilteredCommands(filteredPostTypes);
      setSelectedIndex(0);
    } else if (currentStep === 'aiPrompts' && !!selectedPlatform && !!selectedPostType) {
      setPromptsLoading(true);
      setPromptsError(null);
      fetchPlatformPrompts(selectedPlatform, selectedPostType)
        .then((data) => {
          setPrompts(data);
          setPromptsLoading(false);
          // Map fetched prompts to Command objects
          const promptCommands: Command[] = data.map((prompt, i) => ({
            icon: Lightbulb,
            label: prompt.file.replace(/\.txt$/, ''),
            action: `ai_prompt_${i + 1}`,
            preview: prompt.content.slice(0, 80) + (prompt.content.length > 80 ? '...' : ''),
            type: 'block',
            template: prompt.content,
            metadata: { type: 'idea', value: true },
          }));
          // Filter by search term
          const filteredPrompts = searchTerm
            ? promptCommands.filter(cmd =>
                cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (cmd.preview && cmd.preview.toLowerCase().includes(searchTerm.toLowerCase()))
              )
            : promptCommands;
          setFilteredCommands(filteredPrompts);
          setSelectedIndex(0);
        })
        .catch((err) => {
          setPromptsError('Failed to load prompts');
          setPromptsLoading(false);
          // Fallback: show old hardcoded prompts if available
          const platformData = selectedPlatform ? platformPrompts[selectedPlatform] : undefined;
          const postTypeData = platformData?.find(p => p.key === selectedPostType);
          if (platformData && postTypeData) {
            const aiPromptCommands: Command[] = [
              {
                icon: Lightbulb,
                label: `${postTypeData.description} Idea 1`,
                action: 'ai_idea_1',
                preview: `AI-generated idea for ${postTypeData.description}`,
                type: 'block',
                template: generateTemplate(selectedPlatform, selectedPostType, postTypeData.description),
                metadata: { type: 'idea', value: true },
              }
            ];
            setFilteredCommands(aiPromptCommands);
            setSelectedIndex(0);
          }
        });
    }
  }, [currentStep, searchTerm, selectedPlatform, selectedPostType]);
  
  // Render the command menu
  // Show loading or error states for prompts
  // --- AI PROMPTS STEP: Use new API and Markdown rendering ---
   // Always call useSmartNotePrompts to obey the Rules of Hooks
    const platform = selectedPlatform;
    const postType = selectedPostType;
    const { ideas: aiPrompts, loading: aiPromptsLoading, error: aiPromptsError, refetch: refetchPrompts } = useSmartNoteIdeas({ userId, platform });

    if (currentStep === 'aiPrompts') {
      if (!userId) {
        return (
          <div className="command-menu-error" style={{ padding: 24, color: 'red', textAlign: 'center' }}>
            Please log in to see AI-generated ideas.
          </div>
        );
      }
      if (!platform) {
        return (
          <div className="command-menu-error" style={{ padding: 24, color: 'red', textAlign: 'center' }}>
            Please select a platform to see AI-generated ideas.
          </div>
        );
      }
      if (aiPromptsLoading) {
        return (
          <div className="command-menu-loading" style={{ padding: 24, textAlign: 'center' }}>
            Loading prompts...
          </div>
        );
      }
      if (aiPromptsError) {
        return (
          <div className="command-menu-error" style={{ padding: 24, color: 'red', textAlign: 'center' }}>
            {aiPromptsError}
          </div>
        );
      }
      if (!aiPrompts || aiPrompts.length === 0) {
        return (
          <div className="command-menu-empty" style={{ padding: 24, textAlign: 'center' }}>
            No AI-generated ideas found for this platform.
          </div>
        );
      }
      return (
        <div className="command-menu-prompts" style={{ padding: 24 }}>
          {aiPrompts.map((p, i) => (
            <div key={i}>{typeof p === 'string' ? p : JSON.stringify(p)}</div>
          ))}
        </div>
      );
    }

  return (
    <div 
      ref={menuRef}
      className={styles.commandMenu}
      style={{ position: 'absolute', top: position?.top || 0, left: position?.left || 0 }}
    >
      <div className={styles.commandMenuHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentStep !== 'platform' && (
            <button 
              onClick={handleBack}
              title="Back"
              className={styles.iconBtn}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span className={styles.stepTitle}>{stepTitle}</span>
        </div>
        <button 
          onClick={() => onClose?.()}
          title="Close"
          className={styles.iconBtn}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      
      <div className={styles.commandMenuContent}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {filteredCommands.map((command, index) => (
            <li 
              key={command.action}
              onClick={() => handleSelect(command)}
              className={
                `${styles.commandMenuItem} ${index === selectedIndex ? styles.selected : ''}`
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
                {React.createElement(command.icon, { size: 18 })}
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.commandLabel}>{command.label}</div>
                {command.preview && <div className={styles.commandPreview}>{command.preview}</div>}
              </div>
              {(currentStep as PromptStep) !== 'aiPrompts' && <ChevronRight size={16} className={styles.chevronIcon} />}
            </li>
          ))}
          
          {filteredCommands.length === 0 && (
            <li className={styles.noOptions}>
              No matching options found
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
    
 