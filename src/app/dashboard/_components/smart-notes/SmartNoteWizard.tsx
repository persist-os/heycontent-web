import React, { useState, useEffect } from "react";
import { formStyles } from './SmartNoteWizard.styles';

// Types for props
interface SmartNoteWizardProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

const SmartNoteWizard: React.FC<SmartNoteWizardProps> = ({ onComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    platform: '',
    contentType: '',
    category: '',
    topic: '',
    description: ''
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Content type options based on selected platform
  const contentTypeOptions = {
    instagram: [
      { 
        label: 'Post', 
        value: 'post',
        description: 'Single image or video post' 
      },
      { 
        label: 'Reel', 
        value: 'reel',
        description: 'Short-form vertical video' 
      },
      { 
        label: 'Story', 
        value: 'story',
        description: '24-hour temporary content' 
      },
      { 
        label: 'Carousel', 
        value: 'carousel',
        description: 'Swipeable multi-image post' 
      },
      { 
        label: 'Guide', 
        value: 'guide',
        description: 'Curated themed collections' 
      },
      { 
        label: 'Highlight', 
        value: 'highlight',
        description: 'Permanent story collections' 
      }
    ],
    youtube: [
      { 
        label: 'Video', 
        value: 'video',
        description: 'Standard YouTube video' 
      },
      { 
        label: 'Shorts', 
        value: 'shorts',
        description: 'Vertical short-form video' 
      }
    ],
    gmail: [
      { 
        label: 'Newsletter', 
        value: 'newsletter',
        description: 'Email campaign for updates, content, or announcements' 
      },
      { 
        label: 'Brand Pitch', 
        value: 'brand_pitch',
        description: 'Email proposing a collab or sponsorship to a brand' 
      },
      { 
        label: 'Outreach', 
        value: 'outreach',
        description: 'Personalized message to build a relationship or network' 
      },
      { 
        label: 'Exclusive Drop', 
        value: 'exclusive_drop',
        description: 'Special offer or content sent to a targeted list' 
      },
      { 
        label: 'Automated Response', 
        value: 'automated_response',
        description: 'Pre-written reply triggered by a specific action' 
      },
      { 
        label: 'Drip Sequence', 
        value: 'drip_sequence',
        description: 'Multi-step campaign sent over days/weeks' 
      }
    ]
  };

  // Categories
  const categories = [
    { label: 'Important', value: 'important' },
    { label: 'Ideas', value: 'ideas' }
  ];

  // Generate platform-specific suggestions based on selected platform and content type
  useEffect(() => {
    if (formData.platform && formData.contentType) {
      // In a real implementation, these would come from API data
      // For now, we'll simulate different suggestions based on selections
      let newSuggestions: string[] = [];
      
      if (formData.platform === 'instagram') {
        switch (formData.contentType) {
          case 'post':
            newSuggestions = [
              'Share a behind-the-scenes look at your process',
              'Post a product showcase with detailed features',
              'Share user testimonials with their permission',
              'Create a before-and-after transformation'
            ];
            break;
          case 'reel':
            newSuggestions = [
              'Create a quick tutorial under 30 seconds',
              'Jump on a trending sound or challenge',
              'Share a day-in-the-life montage',
              'Demonstrate your product in action'
            ];
            break;
          case 'story':
            newSuggestions = [
              'Run a poll to engage your audience',
              'Use a countdown for an upcoming launch',
              'Share user-generated content with tags',
              'Host a Q&A session using the question sticker'
            ];
            break;
          case 'carousel':
            newSuggestions = [
              'Create a step-by-step tutorial series',
              'Share multiple angles of your product',
              'Tell a story across multiple slides',
              'Share tips with one tip per slide'
            ];
            break;
          default:
            newSuggestions = [
              'Share your latest work or project',
              'Create content based on your best performing posts',
              'Engage with your audience through questions',
              'Highlight customer success stories'
            ];
        }
      } else if (formData.platform === 'youtube') {
        switch (formData.contentType) {
          case 'video':
            newSuggestions = [
              'Create an in-depth tutorial on your expertise',
              'Start a series on a specific topic',
              'Review products related to your niche',
              'Film a day-in-the-life vlog'
            ];
            break;
          case 'shorts':
            newSuggestions = [
              'Share a quick tip or hack',
              'Create a teaser for your main channel content',
              'Demonstrate a single feature quickly',
              'Answer a common question in your niche'
            ];
            break;
          default:
            newSuggestions = [
              'Create content that answers common questions',
              'Develop a tutorial for beginners',
              'Review trending products in your industry',
              'Share your process or methodology'
            ];
        }
      } else if (formData.platform === 'gmail') {
        switch (formData.contentType) {
          case 'newsletter':
            newSuggestions = [
              'Monthly industry updates and insights',
              'Curated content roundup with your commentary',
              'Product feature announcements with use cases',
              'Event recap with key takeaways'
            ];
            break;
          case 'brand_pitch':
            newSuggestions = [
              'Proposal for co-marketing campaign',
              'Sponsorship opportunity for upcoming content',
              'Product integration or feature showcase',
              'Affiliate partnership proposal'
            ];
            break;
          case 'outreach':
            newSuggestions = [
              'Connection request with mutual interests',
              'Interview or podcast guest invitation',
              'Speaking engagement or event participation',
              'Request for expert opinion or quote'
            ];
            break;
          case 'exclusive_drop':
            newSuggestions = [
              'Early access to new product or feature',
              'Limited-time discount or special offer',
              'VIP event invitation for loyal customers',
              'Exclusive content or resource for subscribers'
            ];
            break;
          case 'automated_response':
            newSuggestions = [
              'Welcome sequence for new subscribers',
              'Thank you message after purchase',
              'Follow-up email after service completion',
              'Feedback request with satisfaction survey'
            ];
            break;
          case 'drip_sequence':
            newSuggestions = [
              'Educational course delivered over multiple emails',
              'Onboarding sequence for new users',
              'Lead nurture campaign with value-add content',
              'Product launch buildup with teasers'
            ];
            break;
          default:
            newSuggestions = [
              'Personalized message with clear value proposition',
              'Follow-up email with additional resources',
              'Targeted campaign based on user behavior',
              'Educational content with actionable tips'
            ];
        }
      }
      
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [formData.platform, formData.contentType]);

  // Handles platform selection
  const handlePlatformSelect = (platform: string) => {
    setFormData(prev => ({ ...prev, platform, contentType: '' }));
  };

  // Handles content type selection
  const handleContentTypeSelect = (contentType: string) => {
    setFormData(prev => ({ ...prev, contentType }));
  };

  // Handles category selection
  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
  };

  // Handles regular form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handles clicking on a suggestion to fill the topic field
  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, topic: suggestion }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    try {
      // Wait 1.5 seconds to simulate backend processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success response with analysis
      const analysis = {
        summary: `Strategy for ${formData.platform} ${formData.contentType}`,
        recommendations: [
          formData.platform === 'instagram' 
            ? 'Post more consistently to increase engagement'
            : 'Create compelling thumbnails for better click-through',
          formData.contentType === 'reel' || formData.contentType === 'shorts'
            ? 'Keep videos under 60 seconds for maximum retention'
            : 'Develop a consistent posting schedule'
        ]
      };
      
      // Call onComplete with all form data + generated analysis
      if (onComplete) {
        const { description, ...rest } = formData;
        onComplete({ ...rest, noteContent: description, analysis });
      }
    } catch (err) {
      setError('Something went wrong while generating your analysis.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = (
    formData.platform && 
    formData.contentType && 
    formData.category && 
    formData.topic.trim().length > 0
  );

  if (loading) {
    return (
      <div style={formStyles.container}>
        <h2 style={formStyles.title}>Analyzing your content...</h2>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ 
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '3px solid rgba(124, 58, 237, 0.2)',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>We're creating a tailored strategy for your {formData.platform} {formData.contentType}.</p>
      </div>
    );
  }

  return (
    <div style={formStyles.container} className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <h2 style={formStyles.title}>Create Smart Note</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Platform Selection - Card Based */}
        <div style={formStyles.formGroup}>
          <label style={formStyles.label}>Platform</label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Instagram Card */}
            <div 
              style={{
                padding: formStyles.platformCard.padding,
                borderRadius: formStyles.platformCard.borderRadius,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: formData.platform === 'instagram' ? '#7c3aed' : '#e5e7eb',
                cursor: formStyles.platformCard.cursor,
                transition: formStyles.platformCard.transition,
                display: formStyles.platformCard.display,
                alignItems: formStyles.platformCard.alignItems,
                gap: formStyles.platformCard.gap,
                marginBottom: formStyles.platformCard.marginBottom,
                backgroundColor: formData.platform === 'instagram' ? '#f5f3ff' : undefined,
              }}
              onClick={() => handlePlatformSelect('instagram')}
            >
              <div style={{ 
                ...formStyles.platformIcon,
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              }}>
                📸
              </div>
              <div style={formStyles.platformText}>
                <div style={formStyles.platformTitle}>Instagram</div>
                <div style={formStyles.platformDesc}>Create content for Instagram</div>
              </div>
            </div>
            
            {/* YouTube Card */}
            <div 
              style={{
                ...formStyles.platformCard,
                ...(formData.platform === 'youtube' ? formStyles.platformCardSelected : {})
              }}
              onClick={() => handlePlatformSelect('youtube')}
            >
              <div style={{ 
                ...formStyles.platformIcon,
                backgroundColor: '#FF0000',
              }}>
                📹
              </div>
              <div style={formStyles.platformText}>
                <div style={formStyles.platformTitle}>YouTube</div>
                <div style={formStyles.platformDesc}>Create content for YouTube</div>
              </div>
            </div>

            {/* Gmail Card */}
            <div 
              style={{
                ...formStyles.platformCard,
                ...(formData.platform === 'gmail' ? formStyles.platformCardSelected : {})
              }}
              onClick={() => handlePlatformSelect('gmail')}
            >
              <div style={{ 
                ...formStyles.platformIcon,
                backgroundColor: '#4285F4',
              }}>
                ✉️
              </div>
              <div style={formStyles.platformText}>
                <div style={formStyles.platformTitle}>Gmail</div>
                <div style={formStyles.platformDesc}>Create email campaigns and outreach</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Type Selection - shows options based on platform */}
        {formData.platform && (
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Content Type</label>
            
            <div style={formStyles.contentTypeGrid}>
              {contentTypeOptions[formData.platform as keyof typeof contentTypeOptions]?.map(option => (
                <div 
                  key={option.value}
                  style={{
                    ...formStyles.contentTypeCard,
                    ...(formData.contentType === option.value ? formStyles.contentTypeCardSelected : {})
                  }}
                  onClick={() => handleContentTypeSelect(option.value)}
                >
                  <div style={formStyles.contentTypeName}>{option.label}</div>
                  <div style={formStyles.contentTypeDesc}>{option.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Selection */}
        {formData.contentType && (
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Category</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {categories.map(cat => (
                <div 
                  key={cat.value}
                  style={{
                    ...formStyles.contentTypeCard,
                    ...(formData.category === cat.value ? formStyles.contentTypeCardSelected : {}),
                    padding: '8px 16px',
                    flex: 1,
                    textAlign: 'center'
                  }}
                  onClick={() => handleCategorySelect(cat.value)}
                >
                  <div style={formStyles.contentTypeName}>{cat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Field */}
        {formData.category && (
          <div style={formStyles.formGroup}>
            <label style={formStyles.label} htmlFor="topic">Topic</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              style={formStyles.input}
              placeholder="What's this note about?"
              required
            />
          </div>
        )}

        {/* Suggestions based on platform & content type */}
        {suggestions.length > 0 && (
          <div style={formStyles.suggestionsSection}>
            <div style={formStyles.suggestionsTitle}>Suggested ideas for your {formData.platform} {formData.contentType}:</div>
            <div style={formStyles.suggestionsList}>
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  style={formStyles.suggestionItem}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description Field */}
        {formData.topic && (
          <div style={formStyles.formGroup}>
            <label style={formStyles.label} htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={formStyles.textarea}
              placeholder="Add details, goals, or any other information..."
            />
          </div>
        )}

        {/* Error message if there is one */}
        {error && (
          <div style={{ color: '#ef4444', marginBottom: '16px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={formStyles.buttonRow}>
          <button 
            type="button" 
            onClick={onCancel} 
            style={{ ...formStyles.button, ...formStyles.buttonCancel }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            style={{
              ...formStyles.button,
              ...(isFormValid ? formStyles.buttonPrimary : formStyles.buttonDisabled)
            }}
            disabled={!isFormValid}
          >
            Create Smart Note
          </button>
        </div>
      </form>
    </div>
  );
};

export default SmartNoteWizard;