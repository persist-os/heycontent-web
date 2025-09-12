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

  const completedCount = allTodos.filter(todo => todo.completed).length;
  const totalCount = allTodos.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <BaseCard
      note={note}
      className="border-l-2 border-l-green-400/40"
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      <div className="space-y-4">
        {/* Header with progress */}
        <div className="space-y-3">
          <h3 className="text-lg font-light text-foreground leading-tight tracking-tight line-clamp-2">
            {note.title || 'Task List'}
          </h3>
          
          {/* Progress indicator */}
          {totalCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-light">
                <span className="text-muted-foreground/70">
                  {completedCount} of {totalCount} completed
                </span>
                <span className="text-green-600/70 bg-green-50/50 dark:bg-green-950/20 px-2 py-0.5 rounded-md">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full bg-gradient-to-r from-green-400/70 to-green-500/70 rounded-full transition-all duration-500 ease-out",
                    progressPercentage === 0 && "w-0",
                    progressPercentage > 0 && progressPercentage <= 25 && "w-1/4",
                    progressPercentage > 25 && progressPercentage <= 50 && "w-1/2",
                    progressPercentage > 50 && progressPercentage <= 75 && "w-3/4",
                    progressPercentage > 75 && "w-full"
                  )}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Todo items with improved styling */}
        <div className="space-y-3">
          {todos.map((todo) => (
            <div 
              key={todo.id} 
              className="group/todo flex items-start gap-3 transition-all duration-200 hover:bg-muted/20 -mx-2 px-2 py-1.5 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTodo(todo.id);
              }}
            >
              <div
                className={cn(
                  "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110",
                  todo.completed 
                    ? "bg-green-500/90 border-green-500/90 shadow-sm" 
                    : "border-muted-foreground/30 hover:border-green-400/60 bg-background"
                )}
              >
                {todo.completed && (
                  <Check className="w-2.5 h-2.5 text-white" />
                )}
              </div>
              <span 
                className={cn(
                  "text-sm flex-1 cursor-pointer font-light leading-relaxed transition-all duration-200",
                  todo.completed 
                    ? "line-through text-muted-foreground/60" 
                    : "text-foreground group-hover/todo:text-foreground"
                )}
              >
                {todo.text}
              </span>
            </div>
          ))}
          
          {todos.length === 0 && (
            <div className="text-sm text-muted-foreground/60 italic font-light py-4 text-center">
              No tasks yet — start adding some ideas
            </div>
          )}
          
          {allTodos.length > 4 && (
            <div className="text-xs text-muted-foreground/60 font-light pt-2 border-t border-border/20">
              +{allTodos.length - 4} more tasks
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
} 