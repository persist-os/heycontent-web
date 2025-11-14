'use client'

import { useState, useMemo } from 'react'
import { Search, Save, X, Edit2, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Id } from '@/convex/_generated/dataModel'
import { usePromptHandlers } from '../../hooks/usePromptHandlers'

interface PromptsTabProps {
  prompts: any[]
  updatePrompt: (args: {
    promptId: Id<'prompts'>
    content: string
    tags: string[]
    description?: string
  }) => Promise<void>
  deletePrompt: (args: { promptId: Id<'prompts'> }) => Promise<void>
}

export function PromptsTab({ prompts, updatePrompt, deletePrompt }: PromptsTabProps) {
  const [promptSearch, setPromptSearch] = useState('')
  const {
    editingPromptId,
    editPromptContent,
    editPromptTags,
    editPromptDescription,
    setEditPromptContent,
    setEditPromptTags,
    setEditPromptDescription,
    handleEditPrompt,
    handleSavePrompt,
    handleCancelEditPrompt,
    handleDeletePrompt,
  } = usePromptHandlers(updatePrompt, deletePrompt)

  const filteredPrompts = useMemo(() => {
    if (!promptSearch) return prompts || []
    const search = promptSearch.toLowerCase()
    return (prompts || []).filter(
      (p) =>
        p.content.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.tags.some((tag: string) => tag.toLowerCase().includes(search)) ||
        p.type.toLowerCase().includes(search)
    )
  }, [prompts, promptSearch])

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search prompts by content, tags, or type..."
          value={promptSearch}
          onChange={(e) => setPromptSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Prompts</div>
          <div className="text-2xl font-bold text-foreground">{prompts?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Filtered Results</div>
          <div className="text-2xl font-bold text-foreground">{filteredPrompts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Editing</div>
          <div className="text-2xl font-bold text-foreground">{editingPromptId ? '1' : '0'}</div>
        </Card>
      </div>

      {/* Prompts List */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-4">
          {filteredPrompts.map((prompt: any) => (
            <Card key={prompt._id} className="p-6">
              {editingPromptId === prompt._id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Content</label>
                    <Textarea
                      value={editPromptContent}
                      onChange={(e) => setEditPromptContent(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Tags (comma-separated)
                    </label>
                    <Input
                      value={editPromptTags}
                      onChange={(e) => setEditPromptTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Description (optional)
                    </label>
                    <Input
                      value={editPromptDescription}
                      onChange={(e) => setEditPromptDescription(e.target.value)}
                      placeholder="Brief description"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSavePrompt} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button onClick={handleCancelEditPrompt} variant="outline" className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{prompt.type}</Badge>
                        <Badge variant="outline">{prompt.scope}</Badge>
                        {prompt.scopeId && (
                          <Badge variant="secondary" className="text-xs">
                            {prompt.scopeId.slice(0, 8)}...
                          </Badge>
                        )}
                      </div>
                      {prompt.description && (
                        <p className="text-sm text-muted-foreground">{prompt.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEditPrompt(prompt)} variant="outline" size="sm">
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeletePrompt(prompt._id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 mb-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono text-foreground">{prompt.content}</pre>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {prompt.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Effectiveness:</span>{' '}
                      <span className="font-medium text-foreground">
                        {((prompt.effectiveness || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Usage:</span>{' '}
                      <span className="font-medium text-foreground">{prompt.usageCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success:</span>{' '}
                      <span className="font-medium text-foreground">
                        {((prompt.successRate || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Version:</span>{' '}
                      <span className="font-medium text-foreground">{prompt.version}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

      {filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No prompts found</p>
          {promptSearch && (
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search term</p>
          )}
        </div>
      )}
    </div>
  )
}

