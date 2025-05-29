import React, { useEffect, useRef, useState } from 'react';
import { 
  Hash, Star, Calendar, Image, LinkIcon, Lightbulb, MessageSquare, Type, ListOrdered, List, 
  Instagram, Youtube, Mail, Video, Film, Camera, Tv, Radio, Send, FileText, Users, Bookmark,
  MessageCircle, Newspaper, Briefcase, Network, Gift, Bot, Clock, ArrowLeft, ChevronRight
} from 'lucide-react';
import { platformPrompts, PlatformKey } from './types/platformPrompts';

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
}
type PromptStep = 'platform' | 'postType' | 'aiPrompts';

export function CommandMenu({ onSelect, onClose, searchTerm = '', position }: CommandMenuProps) {
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
    
    const menuElement = menuRef.current;
    const selectedElement = menuElement.children[0]?.children[index] as HTMLElement;
    if (!selectedElement) return;

    const menuRect = menuElement.getBoundingClientRect();
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
            const newIndex = (i + 1) % filteredCommands.length;
            scrollSelectedIntoView(newIndex);
            return newIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => {
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
    } else if (currentStep === 'aiPrompts' && selectedPlatform && selectedPostType) {
      // If we're at the AI prompts step, generate AI content ideas
      const platformData = selectedPlatform ? platformPrompts[selectedPlatform] : undefined;
      const postTypeData = platformData?.find(p => p.key === selectedPostType);
      
      if (!platformData || !postTypeData) {
        console.error(`[CommandMenu] No data found for platform: ${selectedPlatform} or post type: ${selectedPostType}`);
        return;
      }
      
      // Generate 3-5 AI content ideas
      const aiPromptCommands: Command[] = [
        {
          icon: Lightbulb,
          label: `${postTypeData.description} Idea 1`,
          action: 'ai_idea_1',
          preview: `AI-generated idea for ${postTypeData.description}`,
          type: 'block',
          template: generateTemplate(selectedPlatform, selectedPostType, postTypeData.description),
          metadata: { type: 'idea', value: true },
        },
        {
          icon: Lightbulb,
          label: `${postTypeData.description} Idea 2`,
          action: 'ai_idea_2',
          preview: `Another AI-generated idea for ${postTypeData.description}`,
          type: 'block',
          template: generateTemplate(selectedPlatform, selectedPostType, postTypeData.description),
          metadata: { type: 'idea', value: true },
        },
        {
          icon: Lightbulb,
          label: `${postTypeData.description} Idea 3`,
          action: 'ai_idea_3',
          preview: `One more AI-generated idea for ${postTypeData.description}`,
          type: 'block',
          template: generateTemplate(selectedPlatform, selectedPostType, postTypeData.description),
          metadata: { type: 'idea', value: true },
        },
        {
          icon: Lightbulb,
          label: `${postTypeData.description} Idea 4`,
          action: 'ai_idea_4',
          preview: `Fourth AI-generated idea for ${postTypeData.description}`,
          type: 'block',
          template: generateTemplate(selectedPlatform, selectedPostType, postTypeData.description),
          metadata: { type: 'idea', value: true },
        },
        {
          icon: Lightbulb,
          label: `${postTypeData.description} Idea 5`,
          action: 'ai_idea_5',
          preview: `Fifth AI-generated idea for ${postTypeData.description}`,
          type: 'block',
          template: generateTemplate(selectedPlatform, selectedPostType, postTypeData.description),
          metadata: { type: 'idea', value: true },
        }
      ];
      
      // Filter AI prompts by search term if provided
      const filteredAiPrompts = searchTerm
        ? aiPromptCommands.filter(cmd =>
            cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cmd.preview && cmd.preview.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : aiPromptCommands;
      
      setFilteredCommands(filteredAiPrompts);
      setSelectedIndex(0);
    }
  }, [currentStep, searchTerm, selectedPlatform, selectedPostType]);
  
  // Render the command menu
  return (
    <div 
      ref={menuRef}
      className="command-menu"
      style={{
        position: 'absolute',
        top: position?.top || 0,
        left: position?.left || 0,
        maxHeight: '400px',
        width: '320px',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      <div className="command-menu-header" style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentStep !== 'platform' && (
            <button 
              onClick={handleBack}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span style={{ fontWeight: 600 }}>{stepTitle}</span>
        </div>
        <button 
          onClick={() => onClose?.()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      
      <div className="command-menu-content" style={{ overflow: 'auto', maxHeight: '352px' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {filteredCommands.map((command, index) => (
            <li 
              key={command.action}
              onClick={() => handleSelect(command)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#f7fafc' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderLeft: index === selectedIndex ? '2px solid #3182ce' : '2px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
                {React.createElement(command.icon, { size: 18 })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{command.label}</div>
                {command.preview && <div style={{ fontSize: '12px', color: '#718096' }}>{command.preview}</div>}
              </div>
              {currentStep !== 'aiPrompts' && <ChevronRight size={16} style={{ color: '#a0aec0' }} />}
            </li>
          ))}
          
          {filteredCommands.length === 0 && (
            <li style={{ padding: '16px', textAlign: 'center', color: '#718096' }}>
              No matching options found
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
    
 