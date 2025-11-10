'use client';

/**
 * Config Generator - Terminal Style
 * Generate Convergence configs from templates using natural language
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { ConfigGenerationParams, ConfigGenerationResponse, TemplateOption } from '../../types';

const TEMPLATES: TemplateOption[] = [
  {
    id: 'llm_chat',
    name: 'LLM Chat API',
    description: 'OpenAI-style chat completion APIs (OpenAI, Anthropic, Groq, Azure)',
    examples: ['OpenAI', 'Groq', 'Azure OpenAI', 'Anthropic']
  },
  {
    id: 'agno_agent',
    name: 'Agent API',
    description: 'AI agents with tools and reasoning (Agno, LangChain, custom agents)',
    examples: ['Agno Reddit Agent', 'LangChain Agents', 'Custom AI Agents']
  },
  {
    id: 'web_automation',
    name: 'Web Automation',
    description: 'Browser automation and web scraping APIs',
    examples: ['BrowserBase', 'Playwright Cloud', 'Selenium Grid']
  }
];

const PROVIDER_PRESETS: Record<string, { endpoint: string; api_key_env: string; description: string }> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    api_key_env: 'OPENAI_API_KEY',
    description: 'Optimize ChatGPT API calls - model & temperature tuning'
  },
  groq: {
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    api_key_env: 'GROQ_API_KEY',
    description: 'Optimize Groq fast inference - models, temperature, tokens'
  },
  azure: {
    endpoint: 'https://your-resource.openai.azure.com/openai/deployments/your-model/chat/completions',
    api_key_env: 'AZURE_OPENAI_API_KEY',
    description: 'Optimize Azure-hosted OpenAI - enterprise deployment'
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    api_key_env: 'ANTHROPIC_API_KEY',
    description: 'Optimize Claude API calls - model & parameter tuning'
  },
  custom: {
    endpoint: 'https://api.example.com/v1/endpoint',
    api_key_env: 'API_KEY',
    description: 'Custom API endpoint'
  }
};

export function ConfigGenerator() {
  const { firebaseUser } = useAuth();
  
  // Fetch presets from Convex
  const presetConfigs = useQuery(api.convergencePresetQueries.getPresetConfigs);
  
  const [params, setParams] = useState<Partial<ConfigGenerationParams>>({
    system_name: 'context_enrichment',
    template_type: 'llm_chat', // Default to llm_chat since we're using presets
    provider_name: '',
    endpoint: '',
    api_key_env: '',
    description: '',
    intensity: 'balanced'
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [generatedConfigId, setGeneratedConfigId] = useState<string | null>(null);

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider];
    setParams(prev => ({
      ...prev,
      provider_name: provider,
      endpoint: preset.endpoint,
      api_key_env: preset.api_key_env,
      description: preset.description
    }));
  };

  const handlePresetGeneration = async () => {
    if (!selectedPreset) {
      setOutput(prev => [...prev, '[ERROR] Please select a preset']);
      return;
    }

    setIsGenerating(true);
    setGeneratedConfigId(null);
    
    // Set system_name to match the preset
    const presetSystemName = selectedPreset; // e.g., 'browserbase', 'groq', 'openai'
    
    setOutput([
      '> convergence init --preset ' + selectedPreset,
      '',
      '[INIT] Generating config from preset...',
      '[INIT] Preset: ' + selectedPreset.toUpperCase(),
      '[INIT] System: ' + presetSystemName,
      '',
    ]);
    
    try {
      const idToken = await firebaseUser?.getIdToken();
      
      if (!idToken) {
        setOutput(prev => [...prev, '[ERROR] Authentication failed']);
        setIsGenerating(false);
        return;
      }

      const response = await fetch('/api/v1/convergence/generate-preset-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          user_id: firebaseUser?.uid,
          system_name: presetSystemName,  // Use preset-specific system name
          preset_id: selectedPreset,
          overrides: {}
        }),
      });

      const result: ConfigGenerationResponse = await response.json();

      if (!response.ok) {
        setOutput(prev => [...prev, 
          '[ERROR] ' + (result.error || 'Preset config generation failed'),
          '',
          '$ _'
        ]);
        setIsGenerating(false);
        return;
      }

      setGeneratedConfigId(result.config_id || null);
      
      const preview = result.config_preview;
      setOutput(prev => [...prev,
        '[SUCCESS] Preset config generated successfully!',
        '[CONFIG_ID] ' + result.config_id,
        '',
        '[PREVIEW]',
        '  API: ' + preview?.api_name,
        '  Endpoint: ' + preview?.endpoint,
        '  Parameters: ' + preview?.parameters?.join(', '),
        '  Test Cases: ' + preview?.test_case_count,
        '  Algorithm: ' + preview?.algorithm,
        '',
        '[INFO] Config saved to Convex as CANDIDATE',
        '[INFO] View in CONFIG_VAULT tab to promote to ACTIVE',
        '[INFO] Use in OPTIMIZER tab for optimization runs',
        '',
        '$ _'
      ]);
      setIsGenerating(false);

    } catch (error) {
      setOutput(prev => [...prev,
        '[ERROR] ' + (error instanceof Error ? error.message : 'Unknown error'),
        '',
        '$ _'
      ]);
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Terminal output window */}
      <div className="bg-black border border-cyan-500/30 rounded font-mono text-sm">
        <div className="bg-cyan-900/20 px-4 py-2 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-4 text-xs text-cyan-400">convergence@generator:~$</span>
          </div>
          <span className="text-xs text-slate-600">CONFIG_GENERATOR</span>
        </div>
        <div className="p-4 h-64 overflow-y-auto space-y-1">
          {output.length > 0 ? (
            output.map((line, i) => (
              <div key={i} className={`
                ${line.startsWith('[INIT]') ? 'text-cyan-400' : ''}
                ${line.startsWith('[SUCCESS]') ? 'text-green-400 font-bold' : ''}
                ${line.startsWith('[ERROR]') ? 'text-red-400 font-bold' : ''}
                ${line.startsWith('[CONFIG_ID]') ? 'text-purple-400' : ''}
                ${line.startsWith('[PREVIEW]') || line.startsWith('[INFO]') ? 'text-emerald-400' : ''}
                ${line.startsWith('  ') ? 'text-slate-400 text-xs' : ''}
                ${line.startsWith('>') ? 'text-slate-500' : ''}
                ${!line ? 'h-2' : ''}
              `}>
                {line || '\u00A0'}
              </div>
            ))
          ) : (
            <div className="text-slate-600 italic">
              Awaiting template selection...
            </div>
          )}
        </div>
      </div>

      {/* Configuration form */}
      <div className="space-y-6">
        {/* Preset Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider">
              STEP_1: SELECT_PRESET
            </h3>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider">
              AVAILABLE_PRESETS
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full bg-black border border-cyan-500/30 text-cyan-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-cyan-400"
              aria-label="Select preset"
            >
              <option value="">Choose a preset...</option>
              {presetConfigs?.map((preset) => (
                <option key={preset.preset_id} value={preset.preset_id}>
                  {preset.name} - {preset.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* System Name Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider">
              STEP_2: CONFIGURE_SYSTEM
            </h3>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider">
              SYSTEM_NAME
            </label>
            <select
              value={params.system_name}
              onChange={(e) => setParams(prev => ({ ...prev, system_name: e.target.value }))}
              className="w-full bg-black border border-cyan-500/30 text-cyan-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-cyan-400"
              aria-label="Select system name"
            >
              <option value="context_enrichment">context_enrichment</option>
              <option value="crystal_thresholds">crystal_thresholds</option>
              <option value="intelligence_triggers">intelligence_triggers</option>
              <option value="reddit_tools">reddit_tools</option>
              <option value="search_tools">search_tools</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex items-center gap-4">
          <button
            onClick={handlePresetGeneration}
            disabled={isGenerating || !selectedPreset}
            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-black font-mono font-bold text-sm tracking-wider rounded transition-all duration-300 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
          >
            {isGenerating ? '>>> GENERATING...' : '>>> GENERATE_PRESET_CONFIG'}
          </button>
          
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-cyan-400 font-mono">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              PROCESSING...
            </div>
          )}

          {generatedConfigId && (
            <div className="flex items-center gap-2 text-sm text-green-400 font-mono">
              <span className="text-green-400">✓</span>
              CONFIG_SAVED
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-black border-l-4 border-cyan-500 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-cyan-400">
            <span>💡</span>
            <span>HOW_PRESETS_WORK</span>
          </div>
          <div className="text-xs font-mono text-slate-400 space-y-2">
            <p>1. Select preset from the-convergence package examples</p>
            <p>2. Choose system name for your optimization</p>
            <p>3. Generated config saved to Convex as CANDIDATE</p>
            <p>4. View in CONFIG_VAULT tab and promote to ACTIVE</p>
            <p>5. Use in OPTIMIZER tab to run optimization experiments</p>
            <p>6. Presets include test cases and evaluators from the-convergence</p>
          </div>
        </div>
      </div>
    </div>
  );
}

