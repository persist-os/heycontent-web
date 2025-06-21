export interface BottomBarAction {
  id: string;
  text: string;
  action: string;
}

export const bottomBarActions: BottomBarAction[] = [
  {
    id: 'update-persona',
    text: 'hey content update persona',
    action: 'hey content update persona'
  },
  {
    id: 'help',
    text: 'hey content help',
    action: 'hey content help'
  },
  {
    id: 'audience-growth',
    text: 'Grow audience',
    action: 'How can I grow my audience faster?'
  },
  {
    id: 'content-ideas',
    text: 'Content ideas',
    action: 'What content should I create next?'
  },
  {
    id: 'engagement',
    text: 'Engagement',
    action: 'How do I improve my engagement rates?'
  },
  {
    id: 'strategy',
    text: 'Content strategy',
    action: 'Help me with my content strategy'
  },
  {
    id: 'roast',
    text: 'Roast me',
    action: 'Roast me!'
  }
];
