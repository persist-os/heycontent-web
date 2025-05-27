export interface InteractiveOption {
  text: string;
  type: 'detail' | 'action';
  action: string;
  icon?: string;
}

export interface InteractiveResponse {
  options: InteractiveOption[];
  selectedOption?: InteractiveOption;
  onOptionSelect?: (option: InteractiveOption) => void;
}
