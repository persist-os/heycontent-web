import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { PersonaProfile } from '@/data/personas';

interface Platform {
  id: string;
  name: string;
  goals: string[];
}

interface PromptFiltersProps {
  personas: PersonaProfile[];
  platforms: Platform[];
  selectedPersona: string;
  setSelectedPersona: (v: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (v: string) => void;
  selectedGoal: string;
  setSelectedGoal: (v: string) => void;
  availableGoals: string[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export function PromptFilters({
  personas,
  platforms,
  selectedPersona,
  setSelectedPersona,
  selectedPlatform,
  setSelectedPlatform,
  selectedGoal,
  setSelectedGoal,
  availableGoals,
  searchQuery,
  setSearchQuery
}: PromptFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Persona</label>
          <Select
            value={selectedPersona || 'all'}
            onValueChange={v => setSelectedPersona(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Personas</SelectItem>
              {personas.map(persona => (
                <SelectItem key={persona.id} value={persona.name}>
                  {persona.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPersona && (
            <div className="mt-2">
              <p className="text-xs text-gray-600">
                {personas.find(p => p.name === selectedPersona)?.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {personas.find(p => p.name === selectedPersona)?.tone.map(tone => (
                  <Badge key={tone} variant="outline" className="text-xs">
                    {tone}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Platform</label>
          <Select
            value={selectedPlatform || 'all'}
            onValueChange={v => setSelectedPlatform(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map(platform => (
                <SelectItem key={platform.id} value={platform.name}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Goal</label>
          <Select
            value={selectedGoal || 'all'}
            onValueChange={v => setSelectedGoal(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              {availableGoals.map(goal => (
                <SelectItem key={goal} value={goal}>
                  {goal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardContent>
    </Card>
  );
} 