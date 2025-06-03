import * as React from "react"
import { Badge } from "./badge"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { cn } from "../../lib/utils"
import { Play, Edit } from "lucide-react"

interface PromptCardProps {
  id: string
  title: string
  description: string
  persona: string
  platform: string
  goal: string
  content: string
  rating?: number
  onSelect: (id: string) => void
  onTest: (id: string) => void
  isSelected?: boolean
  className?: string
}

const PromptCard = ({ 
  id,
  title,
  description,
  persona,
  platform,
  goal,
  content,
  rating,
  onSelect,
  onTest,
  isSelected = false,
  className
}: PromptCardProps) => {
  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        isSelected ? "ring-2 ring-blue-500 shadow-md" : "",
        className
      )}
      onClick={() => onSelect(id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          {rating && (
            <Badge variant="outline" className="ml-2">
              ⭐ {rating}/5
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="default">{persona}</Badge>
          <Badge variant="outline">{platform}</Badge>
          <Badge variant="outline">{goal}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {content}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(id)
            }}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onTest(id)
            }}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-1" />
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { PromptCard } 