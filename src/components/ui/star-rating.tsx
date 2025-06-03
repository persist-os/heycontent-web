import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "../../lib/utils"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  className?: string
}

const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  ({ value, onChange, size = "md", disabled = false, className }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6"
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1", className)}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => !disabled && onChange(rating)}
            disabled={disabled}
            aria-label={`Rate ${rating} out of 5 stars`}
            title={`Rate ${rating} out of 5 stars`}
            className={cn(
              "transition-colors hover:scale-110 transform duration-150",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                rating <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          </button>
        ))}
      </div>
    )
  }
)
StarRating.displayName = "StarRating"

export { StarRating } 