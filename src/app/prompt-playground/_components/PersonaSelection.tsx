import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { personas } from '@/data/personas';

export function PersonaSelection() {
  const [selectedPersona, setSelectedPersona] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Persona
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
      </CardContent>
    </Card>
  );
} 