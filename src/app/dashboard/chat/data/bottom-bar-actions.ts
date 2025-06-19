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
    text: 'hey content grow audience',
    action: 'How can I grow my audience faster?'
  },
  {
    id: 'content-ideas',
    text: 'hey content content ideas',
    action: 'What content should I create next?'
  },
  {
    id: 'engagement',
    text: 'hey content engagement',
    action: 'How do I improve my engagement rates?'
  },
  {
    id: 'strategy',
    text: 'hey content content strategy',
    action: 'Help me with my content strategy'
  },
  {
    id: 'roast',
    text: 'hey content roast me',
    action: 'Roast me!'
  }
];
