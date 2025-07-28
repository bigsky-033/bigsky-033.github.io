export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType;
  category: 'encoder' | 'formatter' | 'generator' | 'converter' | 'security';
  priority: 'P0' | 'P1' | 'P2';
}

export interface Theme {
  mode: 'light' | 'dark';
}

export interface AppState {
  currentTool: string | null;
  theme: Theme;
}