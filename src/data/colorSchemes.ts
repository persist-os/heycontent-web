export interface ColorScheme {
  primary: string;
  gradient: {
    from: string;
    via: string;
    to: string;
    glow: string;
  };
  title: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    primary: '#7E3AF2',
    gradient: {
      from: 'purple-200/50',
      via: 'blue-200/50',
      to: 'emerald-200/50',
      glow: 'rgba(126,58,242,0.4)'
    },
    title: 'Creative Pioneer'
  },
  {
    primary: '#F43F5E',
    gradient: {
      from: 'red-200/50',
      via: 'orange-200/50',
      to: 'yellow-200/50',
      glow: 'rgba(244,63,94,0.4)'
    },
    title: 'Digital Innovator'
  },
  {
    primary: '#0EA5E9',
    gradient: {
      from: 'blue-200/50',
      via: 'cyan-200/50',
      to: 'teal-200/50',
      glow: 'rgba(14,165,233,0.4)'
    },
    title: 'Content Architect'
  },
  {
    primary: '#10B981',
    gradient: {
      from: 'emerald-200/50',
      via: 'green-200/50',
      to: 'teal-200/50',
      glow: 'rgba(16,185,129,0.4)'
    },
    title: 'Vision Creator'
  },
  {
    primary: '#8B5CF6',
    gradient: {
      from: 'violet-200/50',
      via: 'purple-200/50',
      to: 'fuchsia-200/50',
      glow: 'rgba(139,92,246,0.4)'
    },
    title: 'Design Alchemist'
  },
  {
    primary: '#EC4899',
    gradient: {
      from: 'pink-200/50',
      via: 'rose-200/50',
      to: 'red-200/50',
      glow: 'rgba(236,72,153,0.4)'
    },
    title: 'Future Shaper'
  },
  {
    primary: '#06B6D4',
    gradient: {
      from: 'cyan-200/50',
      via: 'sky-200/50',
      to: 'blue-200/50',
      glow: 'rgba(6,182,212,0.4)'
    },
    title: 'Tech Visionary'
  },
  {
    primary: '#FB923C',
    gradient: {
      from: 'orange-200/50',
      via: 'amber-200/50',
      to: 'yellow-200/50',
      glow: 'rgba(251,146,60,0.4)'
    },
    title: 'Brand Catalyst'
  },
  {
    primary: '#6366F1',
    gradient: {
      from: 'indigo-200/50',
      via: 'blue-200/50',
      to: 'violet-200/50',
      glow: 'rgba(99,102,241,0.4)'
    },
    title: 'Digital Maven'
  },
  {
    primary: '#14B8A6',
    gradient: {
      from: 'teal-200/50',
      via: 'emerald-200/50',
      to: 'cyan-200/50',
      glow: 'rgba(20,184,166,0.4)'
    },
    title: 'Innovation Lead'
  },
  {
    primary: '#F59E0B',
    gradient: {
      from: 'amber-200/50',
      via: 'yellow-200/50',
      to: 'orange-200/50',
      glow: 'rgba(245,158,11,0.4)'
    },
    title: 'Content Master'
  },
  {
    primary: '#4F46E5',
    gradient: {
      from: 'indigo-200/50',
      via: 'purple-200/50',
      to: 'blue-200/50',
      glow: 'rgba(79,70,229,0.4)'
    },
    title: 'Digital Pioneer'
  }
]; 