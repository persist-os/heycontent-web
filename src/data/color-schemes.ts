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
        from: '#E9D5FF',
        via: '#BFDBFE',
        to: '#A7F3D0',
        glow: 'rgba(126,58,242,0.4)'
      },
      title: 'Creative Pioneer'
    },
    {
      primary: '#F43F5E',
      gradient: {
        from: '#FECACA',
        via: '#FED7AA',
        to: '#FEF9C3',
        glow: 'rgba(244,63,94,0.4)'
      },
      title: 'Digital Innovator'
    },
    {
      primary: '#0EA5E9',
      gradient: {
        from: '#BFDBFE',
        via: '#A5F3FC',
        to: '#99F6E4',
        glow: 'rgba(14,165,233,0.4)'
      },
      title: 'Content Architect'
    },
    {
      primary: '#10B981',
      gradient: {
        from: '#A7F3D0',
        via: '#BBF7D0',
        to: '#99F6E4',
        glow: 'rgba(16,185,129,0.4)'
      },
      title: 'Vision Creator'
    },
    {
      primary: '#8B5CF6',
      gradient: {
        from: '#DDD6FE',
        via: '#E9D5FF',
        to: '#F5D0FE',
        glow: 'rgba(139,92,246,0.4)'
      },
      title: 'Design Alchemist'
    },
    {
      primary: '#EC4899',
      gradient: {
        from: '#FBCFE8',
        via: '#FFE4E6',
        to: '#FECACA',
        glow: 'rgba(236,72,153,0.4)'
      },
      title: 'Future Shaper'
    },
    {
      primary: '#06B6D4',
      gradient: {
        from: '#A5F3FC',
        via: '#E0F2FE',
        to: '#BFDBFE',
        glow: 'rgba(6,182,212,0.4)'
      },
      title: 'Tech Visionary'
    },
    {
      primary: '#FB923C',
      gradient: {
        from: '#FED7AA',
        via: '#FEF3C7',
        to: '#FEF9C3',
        glow: 'rgba(251,146,60,0.4)'
      },
      title: 'Brand Catalyst'
    },
    {
      primary: '#6366F1',
      gradient: {
        from: '#C7D2FE',
        via: '#BFDBFE',
        to: '#DDD6FE',
        glow: 'rgba(99,102,241,0.4)'
      },
      title: 'Digital Maven'
    },
    {
      primary: '#14B8A6',
      gradient: {
        from: '#99F6E4',
        via: '#A7F3D0',
        to: '#A5F3FC',
        glow: 'rgba(20,184,166,0.4)'
      },
      title: 'Innovation Lead'
    },
    {
      primary: '#F59E0B',
      gradient: {
        from: '#FEF3C7',
        via: '#FEF9C3',
        to: '#FED7AA',
        glow: 'rgba(245,158,11,0.4)'
      },
      title: 'Content Master'
    },
    {
      primary: '#4F46E5',
      gradient: {
        from: '#C7D2FE',
        via: '#E9D5FF',
        to: '#BFDBFE',
        glow: 'rgba(79,70,229,0.4)'
      },
      title: 'Digital Pioneer'
    },
    {
      primary: '#FF6B00',
      gradient: {
        from: '#FFD6A5',
        via: '#FFB86B',
        to: '#FF6B00',
        glow: 'rgba(255,107,0,0.4)'
      },
      title: 'Trendsetter'
    },
    {
      primary: '#00C2FF',
      gradient: {
        from: '#A5F3FC',
        via: '#00C2FF',
        to: '#0057B7',
        glow: 'rgba(0,194,255,0.4)'
      },
      title: 'Digital Voyager'
    },
    {
      primary: '#FF3CAC',
      gradient: {
        from: '#FEC7E0',
        via: '#FF3CAC',
        to: '#784BA0',
        glow: 'rgba(255,60,172,0.4)'
      },
      title: 'Pop Culture Curator'
    },
    {
      primary: '#00FFB8',
      gradient: {
        from: '#CFFAFE',
        via: '#00FFB8',
        to: '#009E60',
        glow: 'rgba(0,255,184,0.4)'
      },
      title: 'Eco Creator'
    },
    {
      primary: '#FFD600',
      gradient: {
        from: '#FFF9C4',
        via: '#FFD600',
        to: '#FF6F00',
        glow: 'rgba(255,214,0,0.4)'
      },
      title: 'Sunshine Storyteller'
    },
    {
      primary: '#B388FF',
      gradient: {
        from: '#EDE7F6',
        via: '#B388FF',
        to: '#651FFF',
        glow: 'rgba(179,136,255,0.4)'
      },
      title: 'Night Owl Maker'
    },
    {
      primary: '#FF0000',
      gradient: {
        from: '#FF8A80',
        via: '#FF0000',
        to: '#212121',
        glow: 'rgba(255,0,0,0.4)'
      },
      title: 'Video Visionary'
    },
    {
      primary: '#9147FF',
      gradient: {
        from: '#D1C4E9',
        via: '#9147FF',
        to: '#1ED760',
        glow: 'rgba(145,71,255,0.4)'
      },
      title: 'Live Entertainer'
    },
    {
      primary: '#2196F3',
      gradient: {
        from: '#B3E5FC',
        via: '#2196F3',
        to: '#757575',
        glow: 'rgba(33,150,243,0.4)'
      },
      title: 'Audio Storyteller'
    },
    {
      primary: '#FFD600',
      gradient: {
        from: '#FFF9C4',
        via: '#FFD600',
        to: '#212121',
        glow: 'rgba(255,214,0,0.4)'
      },
      title: 'Wordsmith'
    },
    {
      primary: '#8E24AA',
      gradient: {
        from: '#F3E5F5',
        via: '#8E24AA',
        to: '#00B8D4',
        glow: 'rgba(142,36,170,0.4)'
      },
      title: 'Visual Storyteller'
    },
    {
      primary: '#00BFAE',
      gradient: {
        from: '#B2F5EA',
        via: '#00BFAE',
        to: '#FF3CAC',
        glow: 'rgba(0,191,174,0.4)'
      },
      title: 'Design Dynamo'
    },
    {
      primary: '#E1306C',
      gradient: {
        from: '#FEC7E0',
        via: '#E1306C',
        to: '#F77737',
        glow: 'rgba(225,48,108,0.4)'
      },
      title: 'Insta Icon'
    },
    {
      primary: '#010101',
      gradient: {
        from: '#00F2EA',
        via: '#FF0050',
        to: '#010101',
        glow: 'rgba(1,1,1,0.4)'
      },
      title: 'Shortform Star'
    },
    {
      primary: '#FF0000',
      gradient: {
        from: '#FFF',
        via: '#FF0000',
        to: '#000',
        glow: 'rgba(255,0,0,0.4)'
      },
      title: 'YouTube Creator'
    },
    {
      primary: '#FFC1E3',
      gradient: {
        from: '#F8BBD0',
        via: '#FFC1E3',
        to: '#FFD700',
        glow: 'rgba(255,193,227,0.4)'
      },
      title: 'Style Maven'
    },
    {
      primary: '#43EA7F',
      gradient: {
        from: '#B2F5EA',
        via: '#43EA7F',
        to: '#2196F3',
        glow: 'rgba(67,234,127,0.4)'
      },
      title: 'Wellness Coach'
    },
    {
      primary: '#FF9800',
      gradient: {
        from: '#FFF3E0',
        via: '#FF9800',
        to: '#795548',
        glow: 'rgba(255,152,0,0.4)'
      },
      title: 'Culinary Artist'
    },
    {
      primary: '#00FF41',
      gradient: {
        from: '#D1C4E9',
        via: '#00FF41',
        to: '#212121',
        glow: 'rgba(0,255,65,0.4)'
      },
      title: 'Game Changer'
    },
    {
      primary: '#FFD600',
      gradient: {
        from: '#FFF9C4',
        via: '#FFD600',
        to: '#FF9800',
        glow: 'rgba(255,214,0,0.4)'
      },
      title: 'Laugh Leader'
    },
    {
      primary: '#00B8D4',
      gradient: {
        from: '#B2EBF2',
        via: '#00B8D4',
        to: '#FF8A65',
        glow: 'rgba(0,184,212,0.4)'
      },
      title: 'Globe Trotter'
    }
  ]; 