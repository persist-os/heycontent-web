import { RefreshCw } from 'lucide-react'

interface RefreshStateProps {
  title: string
  quote: string
}

export function RefreshState({ title, quote }: RefreshStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <RefreshCw className="w-12 h-12 text-text-gray animate-spin mx-auto mb-6" />
      <h3 className="text-lg font-medium text-text-dark dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-text-gray dark:text-gray-400 max-w-md mx-auto">
        {quote}
      </p>
      <div className="mt-4 text-sm text-text-gray/60 dark:text-gray-500">
        This may take a few moments
      </div>
    </div>
  )
} 