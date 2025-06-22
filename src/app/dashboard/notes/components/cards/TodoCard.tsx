import React, { useState } from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
  onUpdate?: (noteId: string, updates: any) => void;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export function TodoCard({ 
  note, 
  onEdit, 
  onDelete, 
  onToggleImportant, 
  onUpdate 
}: TodoCardProps) {
  // Parse todos from note content
  const parseTodos = (content: string): TodoItem[] => {
    const lines = content.split('\n');
    const todos: TodoItem[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.match(/^[-*]\s/)) {
        // Bullet point format
        todos.push({
          id: `todo-${index}`,
          text: trimmed.replace(/^[-*]\s/, ''),
          completed: false
        });
      } else if (trimmed.match(/^\[.\]\s/)) {
        // Checkbox format
        const completed = trimmed.startsWith('[x]') || trimmed.startsWith('[X]');
        todos.push({
          id: `todo-${index}`,
          text: trimmed.replace(/^\[.\]\s/, ''),
          completed
        });
      } else if (trimmed && !trimmed.startsWith('#')) {
        // Plain text line
        todos.push({
          id: `todo-${index}`,
          text: trimmed,
          completed: false
        });
      }
    });
    
    return todos;
  };

  const allTodos = parseTodos(note.content || '');
  const todos = allTodos.slice(0, 4); // Show max 4 items

  const handleToggleTodo = async (todoId: string) => {
    // Toggle the todo and update the note
    const updatedTodos = allTodos.map(todo => 
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    );
    
    // Convert back to content format
    const updatedContent = updatedTodos
      .map(todo => `[${todo.completed ? 'x' : ' '}] ${todo.text}`)
      .join('\n');
    
    if (onUpdate) {
      onUpdate(String(note._id), { content: updatedContent });
    }
  };

  return (
    <BaseCard
      note={note}
      className="bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50"
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-foreground mb-3 pr-8 line-clamp-2">
          {note.title || 'TO-DO List'}
        </h3>
        
        {/* Todo items */}
        <div className="space-y-2">
          {todos.map((todo) => (
            <div 
              key={todo.id} 
              className="flex items-center gap-2 group/todo"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTodo(todo.id);
              }}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors",
                  todo.completed 
                    ? "bg-yellow-500 border-yellow-500" 
                    : "border-border hover:border-yellow-500/50"
                )}
              >
                {todo.completed && (
                  <Check className="w-2.5 h-2.5 text-white" />
                )}
              </div>
              <span 
                className={cn(
                  "text-sm flex-1 cursor-pointer",
                  todo.completed 
                    ? "line-through text-muted-foreground" 
                    : "text-foreground"
                )}
              >
                {todo.text}
              </span>
            </div>
          ))}
          
          {todos.length === 0 && (
            <div className="text-sm text-muted-foreground italic">
              No tasks yet
            </div>
          )}
          
          {note.content && note.content.split('\n').length > 4 && (
            <div className="text-xs text-muted-foreground mt-2">
              +{note.content.split('\n').length - 4} more tasks
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
} 