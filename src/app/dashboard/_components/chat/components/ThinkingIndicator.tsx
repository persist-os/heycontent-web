import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Search, FileText, Database, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ThinkingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
  details?: string[];
  data?: any;
  startTime?: number;
  endTime?: number;
}

interface ThinkingIndicatorProps {
  steps?: ThinkingStep[];
  showExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ 
  steps, 
  showExpanded = false, 
  onToggleExpanded 
}) => {
  const [isExpanded, setIsExpanded] = useState(showExpanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggleExpanded?.();
  };

  // Simple thinking indicator for when no steps are provided
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100/50">
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse" />
          <div className="absolute inset-0 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-ping opacity-20" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">Thinking</span>
          <span className="text-xs text-gray-500 flex items-center space-x-1">
            <span>Processing your request</span>
            <span className="flex space-x-0.5">
              <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </span>
        </div>
      </div>
    );
  }

  const getStepIcon = (step: ThinkingStep) => {
    if (step.title.toLowerCase().includes('search')) return Search;
    if (step.title.toLowerCase().includes('context')) return Database;
    if (step.title.toLowerCase().includes('analyz')) return FileText;
    return Zap;
  };

  const getStatusIcon = (status: ThinkingStep['status']) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'processing': return Loader2;
      case 'error': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: ThinkingStep['status']) => {
    switch (status) {
      case 'completed': return 'text-emerald-500';
      case 'processing': return 'text-purple-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusBgColor = (status: ThinkingStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 border-emerald-200';
      case 'processing': return 'bg-purple-50 border-purple-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  const currentStep = steps.find(s => s.status === 'processing');
  const hasErrors = steps.some(s => s.status === 'error');

  return (
    <div className="thinking-process bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-purple-100/20 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-all duration-200 group"
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg ${currentStep ? 'animate-pulse' : ''}`}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            {currentStep && (
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 animate-ping opacity-20" />
            )}
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 text-sm">AI Reasoning</span>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${hasErrors ? 'bg-red-100 text-red-700' : completedSteps === steps.length ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                {completedSteps}/{steps.length}
              </div>
            </div>
            {currentStep && (
              <span className="text-xs text-gray-500 font-medium">
                {currentStep.title}...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Progress Ring */}
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200"
              />
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`transition-all duration-500 ${hasErrors ? 'text-red-500' : completedSteps === steps.length ? 'text-emerald-500' : 'text-purple-500'}`}
                strokeDasharray={75.36}
                strokeDashoffset={75.36 - (75.36 * progressPercentage) / 100}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700">{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-4">
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ease-out rounded-full ${hasErrors ? 'bg-gradient-to-r from-red-400 to-red-500' : completedSteps === steps.length ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-purple-400 to-blue-500'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Expanded Steps */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/30">
          <div className="p-4 space-y-3">
            {steps.map((step, index) => {
              const StepIcon = getStepIcon(step);
              const StatusIcon = getStatusIcon(step.status);
              
              return (
                <div 
                  key={step.id} 
                  className={`p-3 rounded-xl border transition-all duration-300 ${getStatusBgColor(step.status)} hover:shadow-md`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Step Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-white border flex items-center justify-center ${getStatusColor(step.status)}`}>
                      <StepIcon className="w-4 h-4" />
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
                        <div className="flex items-center space-x-2">
                          {step.duration && step.status === 'completed' && (
                            <span className="text-xs text-gray-500 bg-white/80 px-2 py-0.5 rounded-full font-medium">
                              {step.duration}ms
                            </span>
                          )}
                          <StatusIcon className={`w-4 h-4 ${getStatusColor(step.status)} ${step.status === 'processing' ? 'animate-spin' : ''}`} />
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                      
                      {/* Step Details */}
                      {step.details && step.details.length > 0 && (
                        <div className="space-y-1">
                          {step.details.map((detail, i) => (
                            <div key={i} className="flex items-start space-x-2 text-xs text-gray-600">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Data Preview */}
                      {step.data && step.status === 'completed' && (
                        <div className="mt-3 p-3 bg-white/80 rounded-lg border border-gray-200/50">
                          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                            <Database className="w-3 h-3" />
                            <span>Found Data</span>
                          </div>
                          {Array.isArray(step.data) ? (
                            <div className="space-y-1.5">
                              {step.data.slice(0, 3).map((item: any, i: number) => (
                                <div key={i} className="flex items-center space-x-2 text-xs">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
                                  <span className="text-gray-700 font-medium truncate">
                                    {item.title || item.fileName || item.name || JSON.stringify(item).slice(0, 40)}
                                  </span>
                                  {item.score && (
                                    <span className="text-gray-500 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                      {item.score.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {step.data.length > 3 && (
                                <div className="text-xs text-gray-500 italic">
                                  +{step.data.length - 3} more items
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                              {typeof step.data === 'string' ? step.data : JSON.stringify(step.data).slice(0, 120)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 