/**
 * Fingerprint Constellation Data
 * 
 * All constellation mapping data for the ambient fingerprint canvas.
 * Separated for reusability and maintainability.
 */

// Map fingerprint schema fields to constellation stars
export const FINGERPRINT_STARS = [
  // Core Identity Constellation (center-top)
  { fieldName: 'name', displayName: 'Project Identity', category: 'core', x: 50, y: 15, size: 8, importance: 10, discoveryPhase: 1 },
  { fieldName: 'description', displayName: 'Purpose Definition', category: 'core', x: 45, y: 22, size: 6, importance: 8, discoveryPhase: 2 },
  
  // AI Nature Constellation (top-left quadrant)
  { fieldName: 'domain', displayName: 'Project Domain', category: 'nature', x: 20, y: 25, size: 7, importance: 9, discoveryPhase: 2 },
  { fieldName: 'complexity_level', displayName: 'Complexity Level', category: 'nature', x: 15, y: 35, size: 5, importance: 7, discoveryPhase: 3 },
  { fieldName: 'collaboration_style', displayName: 'Collaboration Style', category: 'nature', x: 30, y: 30, size: 6, importance: 8, discoveryPhase: 3 },
  { fieldName: 'time_horizon', displayName: 'Time Horizon', category: 'nature', x: 25, y: 40, size: 5, importance: 7, discoveryPhase: 4 },
  { fieldName: 'primary_pattern', displayName: 'Working Pattern', category: 'nature', x: 35, y: 20, size: 7, importance: 9, discoveryPhase: 4 },
  
  // Archetype Constellation (top-right quadrant)
  { fieldName: 'decision_making', displayName: 'Decision Making', category: 'archetype', x: 75, y: 25, size: 6, importance: 8, discoveryPhase: 5 },
  { fieldName: 'energy_patterns', displayName: 'Energy Patterns', category: 'archetype', x: 80, y: 35, size: 5, importance: 7, discoveryPhase: 5 },
  
  // Intentions Constellation (center-right)
  { fieldName: 'core_intention', displayName: 'Core Intention', category: 'intentions', x: 70, y: 45, size: 8, importance: 10, discoveryPhase: 6 },
  { fieldName: 'success_vision', displayName: 'Success Vision', category: 'intentions', x: 85, y: 50, size: 7, importance: 9, discoveryPhase: 6 },
  { fieldName: 'value_creation', displayName: 'Value Creation', category: 'intentions', x: 75, y: 55, size: 6, importance: 8, discoveryPhase: 7 },
  
  // Timeline Constellation (center-left)
  { fieldName: 'natural_rhythm', displayName: 'Natural Rhythm', category: 'timeline', x: 25, y: 50, size: 6, importance: 8, discoveryPhase: 7 },
  { fieldName: 'flexibility_preference', displayName: 'Flexibility Style', category: 'timeline', x: 15, y: 60, size: 5, importance: 7, discoveryPhase: 8 },
  
  // Outputs Constellation (bottom-right quadrant)
  { fieldName: 'tangible_deliverables', displayName: 'Deliverables', category: 'outputs', x: 70, y: 70, size: 6, importance: 8, discoveryPhase: 8 },
  { fieldName: 'intangible_benefits', displayName: 'Intangible Benefits', category: 'outputs', x: 80, y: 75, size: 5, importance: 7, discoveryPhase: 9 },
  { fieldName: 'measurement_approach', displayName: 'Measurement', category: 'outputs', x: 75, y: 80, size: 4, importance: 6, discoveryPhase: 9 },
  { fieldName: 'sharing_intention', displayName: 'Sharing Intent', category: 'outputs', x: 65, y: 85, size: 5, importance: 7, discoveryPhase: 10 },
  
  // Interface Constellation (bottom-left quadrant)
  { fieldName: 'cognitive_load_preference', displayName: 'Cognitive Load', category: 'interface', x: 25, y: 70, size: 5, importance: 7, discoveryPhase: 10 },
  { fieldName: 'information_density', displayName: 'Info Density', category: 'interface', x: 15, y: 80, size: 4, importance: 6, discoveryPhase: 11 },
  { fieldName: 'feedback_frequency', displayName: 'Feedback Rhythm', category: 'interface', x: 30, y: 85, size: 5, importance: 7, discoveryPhase: 11 },
  
  // Evolution Intelligence (bottom-center)
  { fieldName: 'learning_sensitivity', displayName: 'Learning Rate', category: 'evolution', x: 45, y: 75, size: 6, importance: 8, discoveryPhase: 12 },
  
  // Context Awareness (scattered for natural feel)
  { fieldName: 'user_constraints', displayName: 'Constraints', category: 'context', x: 40, y: 35, size: 4, importance: 6, discoveryPhase: 13 },
  { fieldName: 'support_systems', displayName: 'Support Systems', category: 'context', x: 60, y: 30, size: 5, importance: 7, discoveryPhase: 13 },
  { fieldName: 'external_dependencies', displayName: 'Dependencies', category: 'context', x: 55, y: 65, size: 4, importance: 6, discoveryPhase: 14 },
  
  // Agent Coordination (center constellation)
  { fieldName: 'morning_persona', displayName: 'Morning AI', category: 'agent', x: 45, y: 45, size: 5, importance: 7, discoveryPhase: 14 },
  { fieldName: 'evening_persona', displayName: 'Evening AI', category: 'agent', x: 55, y: 50, size: 5, importance: 7, discoveryPhase: 15 },
  
  // Prompt Generation (upper center)
  { fieldName: 'base_personality', displayName: 'AI Personality', category: 'prompt', x: 50, y: 35, size: 7, importance: 9, discoveryPhase: 15 },
  { fieldName: 'project_voice', displayName: 'Project Voice', category: 'prompt', x: 60, y: 40, size: 6, importance: 8, discoveryPhase: 16 }
]

// Logical connections between fingerprint fields
export const FINGERPRINT_CONNECTIONS = [
  // Core to Nature
  { from: 'name', to: 'domain' },
  { from: 'description', to: 'core_intention' },
  
  // Nature internal connections
  { from: 'domain', to: 'complexity_level' },
  { from: 'collaboration_style', to: 'primary_pattern' },
  { from: 'time_horizon', to: 'natural_rhythm' },
  
  // Archetype to Intentions
  { from: 'decision_making', to: 'success_vision' },
  { from: 'energy_patterns', to: 'natural_rhythm' },
  
  // Intentions internal flow
  { from: 'core_intention', to: 'success_vision' },
  { from: 'success_vision', to: 'value_creation' },
  
  // Timeline to Outputs
  { from: 'natural_rhythm', to: 'feedback_frequency' },
  { from: 'flexibility_preference', to: 'measurement_approach' },
  
  // Outputs internal flow
  { from: 'tangible_deliverables', to: 'intangible_benefits' },
  { from: 'measurement_approach', to: 'sharing_intention' },
  
  // Interface preferences
  { from: 'cognitive_load_preference', to: 'information_density' },
  { from: 'information_density', to: 'feedback_frequency' },
  
  // Evolution connections
  { from: 'learning_sensitivity', to: 'flexibility_preference' },
  
  // Context awareness
  { from: 'user_constraints', to: 'support_systems' },
  { from: 'support_systems', to: 'external_dependencies' },
  
  // Agent coordination
  { from: 'energy_patterns', to: 'morning_persona' },
  { from: 'natural_rhythm', to: 'evening_persona' },
  
  // Prompt generation
  { from: 'primary_pattern', to: 'base_personality' },
  { from: 'base_personality', to: 'project_voice' },
  
  // Cross-category meaningful connections
  { from: 'core_intention', to: 'base_personality' },
  { from: 'collaboration_style', to: 'support_systems' },
  { from: 'complexity_level', to: 'cognitive_load_preference' },
  { from: 'success_vision', to: 'tangible_deliverables' }
]

// Discovery phases with natural progression messages
export const DISCOVERY_PHASES = [
  { phase: 1, message: "Understanding your project's essence..." },
  { phase: 2, message: "Mapping your creative domain..." },
  { phase: 3, message: "Learning your working style..." },
  { phase: 4, message: "Discovering your patterns..." },
  { phase: 5, message: "Reading your decision rhythms..." },
  { phase: 6, message: "Seeing your deeper intentions..." },
  { phase: 7, message: "Understanding your timeline..." },
  { phase: 8, message: "Mapping your natural flow..." },
  { phase: 9, message: "Defining success together..." },
  { phase: 10, message: "Shaping how you'll share..." },
  { phase: 11, message: "Calibrating your interface..." },
  { phase: 12, message: "Setting evolution sensitivity..." },
  { phase: 13, message: "Mapping your context..." },
  { phase: 14, message: "Coordinating AI support..." },
  { phase: 15, message: "Creating your AI voice..." },
  { phase: 16, message: "Completing your constellation..." }
]
