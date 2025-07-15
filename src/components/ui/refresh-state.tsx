import { RefreshCw } from 'lucide-react'

interface RefreshStateProps {
  title: string
  quote: string
  subtitle?: string
}

export function RefreshState({ title, quote, subtitle }: RefreshStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-6" />
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-3">
        {quote}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  )
} 