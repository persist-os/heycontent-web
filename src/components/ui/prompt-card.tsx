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
        "transition-all duration-200 hover:shadow-lg cursor-pointer border-2",
        isSelected ? "border-blue-500 shadow-lg bg-blue-50/50" : "border-gray-200 hover:border-gray-300",
        className
      )}
      onClick={() => onSelect(id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
          </div>
          {rating && (
            <Badge variant="outline" className="ml-3 flex-shrink-0">
              ⭐ {rating}/5
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {platform}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {goal}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed">
            {content}
          </p>
        </div>
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
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onTest(id)
            }}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
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