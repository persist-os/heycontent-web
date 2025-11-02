'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface ApiRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description?: string;
}

const API_ROUTES: ApiRoute[] = [
  // Admin routes
  { path: '/api/admin/intelligence/test-run', method: 'POST', description: 'Test intelligence orchestrator' },
  { path: '/api/admin/intelligence/generate-cognitive-field', method: 'POST', description: 'Generate 4-layer cognitive field' },
  
  // Widget routes
  { path: '/api/project-widgets/generate', method: 'POST', description: 'Generate widgets for project' },
  { path: '/api/project-widgets/assign', method: 'POST', description: 'Assign widgets to project' },
  { path: '/api/project-widgets/execute', method: 'POST', description: 'Execute widget' },
  
  // Project routes
  { path: '/api/projects/create', method: 'POST', description: 'Create new project' },
  { path: '/api/projects/update', method: 'POST', description: 'Update project' },
  { path: '/api/projects/delete', method: 'DELETE', description: 'Delete project' },
  
  // Chat routes
  { path: '/api/chat', method: 'POST', description: 'Send chat message' },
  { path: '/api/chat/history', method: 'GET', description: 'Get chat history' },
  
  // Feedback routes
  { path: '/api/feedback/submit', method: 'POST', description: 'Submit feedback' },
  
  // User routes
  { path: '/api/user/profile', method: 'GET', description: 'Get user profile' },
  { path: '/api/user/update', method: 'POST', description: 'Update user profile' },
  
  // Authentication routes
  { path: '/api/auth/login', method: 'POST', description: 'User login' },
  { path: '/api/auth/logout', method: 'POST', description: 'User logout' },
  
  // Living projects routes
  { path: '/api/living-projects/fingerprint', method: 'POST', description: 'Generate project fingerprint' },
  { path: '/api/living-projects/widgets', method: 'GET', description: 'Get project widgets' },
];

interface RouteListProps {
  onSelect: (route: ApiRoute) => void;
}

export function RouteList({ onSelect }: RouteListProps) {
  const [filter, setFilter] = useState('');
  
  const filteredRoutes = API_ROUTES.filter(route =>
    route.path.toLowerCase().includes(filter.toLowerCase()) ||
    route.description?.toLowerCase().includes(filter.toLowerCase())
  );

  const groupedRoutes = filteredRoutes.reduce((acc, route) => {
    const category = route.path.split('/')[2] || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(route);
    return acc;
  }, {} as Record<string, ApiRoute[]>);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search routes..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full"
      />
      
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {Object.entries(groupedRoutes).map(([category, routes]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 capitalize">
              {category.replace('-', ' ')}
            </h4>
            <div className="space-y-1">
              {routes.map((route, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(route)}
                  className="w-full text-left text-sm p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {route.method}
                    </Badge>
                    <span className="text-foreground font-mono text-xs">
                      {route.path.split('/').slice(2).join('/')}
                    </span>
                  </div>
                  {route.description && (
                    <p className="text-xs text-muted-foreground mt-1 ml-14">
                      {route.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

