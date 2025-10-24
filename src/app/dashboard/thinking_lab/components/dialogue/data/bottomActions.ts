import type { BottomBarAction } from '@/app/dashboard/thinking_lab/types/core/labCore'

// Multiple action sets for different thinking modes - rotates on each refresh
export const actionSets: BottomBarAction[][] = [
  // Set 1: Perspective & Assumptions
  [
    {
      id: 'perspective-shift',
      text: 'Challenge my perspective',
      action: 'What\'s one assumption I might be making that\'s limiting my thinking right now?'
    },
    {
      id: 'hidden-connections',
      text: 'Reveal hidden connections',
      action: 'What unexpected connections exist between my recent thoughts that I might be missing?'
    },
    {
      id: 'blindspot-detector',
      text: 'Find my blind spots',
      action: 'What important consideration am I probably overlooking in my current thinking?'
    },
    {
      id: 'future-self',
      text: 'Future me would say...',
      action: 'What would my future self want me to focus on right now?'
    },
    {
      id: 'question-question',
      text: 'Better questions',
      action: 'What better questions should I be asking about this situation?'
    },
    {
      id: 'pattern-recognition',
      text: 'Spot my patterns',
      action: 'What recurring patterns do you notice in my recent thoughts that I might not see?'
    }
  ],
  
  // Set 2: Mental Models & Frameworks
  [
    {
      id: 'mental-models',
      text: 'New mental model',
      action: 'Suggest one mental model that could help me think differently about my current challenge'
    },
    {
      id: 'constraints-as-levers',
      text: 'Turn constraints into levers',
      action: 'How might my current constraints actually be opportunities in disguise?'
    },
    {
      id: 'opposite-day',
      text: 'Opposite thinking',
      action: 'What would the opposite of my current approach look like, and what can I learn from it?'
    },
    {
      id: 'core-beliefs',
      text: 'Examine core beliefs',
      action: 'What core belief is shaping my current thinking, and is it serving me well?'
    },
    {
      id: 'second-order',
      text: 'Second-order effects',
      action: 'What might be the unintended consequences of my current line of thinking?'
    },
    {
      id: 'simplify',
      text: 'Simplify complexity',
      action: 'How could I explain my current challenge to a 10-year-old?'
    }
  ],
  
  // Set 3: Time & Context
  [
    {
      id: 'temporal-lens',
      text: 'Time travel thinking',
      action: 'How will I view this situation one year from now? Ten years?'
    },
    {
      id: 'stakeholder-views',
      text: 'Other perspectives',
      action: 'How would someone with completely different values view this situation?'
    },
    {
      id: 'first-principles',
      text: 'First principles',
      action: 'What are the fundamental truths about this situation that I might be overlooking?'
    },
    {
      id: 'energy-audit',
      text: 'Energy audit',
      action: 'What activities or thoughts are giving me energy, and which are draining it?'
    },
    {
      id: 'fear-mapping',
      text: 'Map my fears',
      action: 'What am I really afraid of in this situation, and what would I do if that fear came true?'
    },
    {
      id: 'decision-lens',
      text: 'Decision clarity',
      action: 'What would make this decision 10% easier to make?'
    }
  ],
  
  // Set 4: Growth & Reflection
  [
    {
      id: 'growth-edge',
      text: 'Growth edge',
      action: 'Where is my current discomfort pointing me toward growth?'
    },
    {
      id: 'silent-assumptions',
      text: 'Silent assumptions',
      action: 'What am I taking for granted that might not actually be true?'
    },
    {
      id: 'creative-breakthrough',
      text: 'Creative breakthrough',
      action: 'What would happen if I approached this with complete creative freedom?'
    },
    {
      id: 'system-thinking',
      text: 'System thinking',
      action: 'How does this connect to the bigger system I\'m part of?'
    },
    {
      id: 'emotional-intelligence',
      text: 'Emotional intelligence',
      action: 'What emotions are driving my thinking right now, and what are they telling me?'
    },
    {
      id: 'wisdom-seeking',
      text: 'Seek wisdom',
      action: 'What would someone I deeply respect advise me about this situation?'
    }
  ]
];

// Legacy export for backward compatibility
export const bottomBarActions: BottomBarAction[] = actionSets[0];

// Function to get a random action set (similar to placeholder rotation)
export function getRandomActionSet(): BottomBarAction[] {
  const randomIndex = Math.floor(Math.random() * actionSets.length);
  return actionSets[randomIndex];
}
