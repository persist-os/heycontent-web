'use client';

/**
 * Config Generator - Terminal Style
 * Generate Convergence configs from templates using natural language
 */

import { useState } from 'react';
import { useAuth } from '@/app/context/auth-context';
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
  const [params, setParams] = useState<Partial<ConfigGenerationParams>>({
    system_name: 'context_enrichment',
    template_type: 'llm_chat',
    provider_name: 'openai',
    endpoint: PROVIDER_PRESETS.openai.endpoint,
    api_key_env: PROVIDER_PRESETS.openai.api_key_env,
    description: PROVIDER_PRESETS.openai.description,
    intensity: 'balanced'
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedConfigId(null);
    setOutput([
      '> convergence init --template ' + params.template_type,
      '',
      '[INIT] Generating config from template...',
      '[INIT] Template: ' + params.template_type?.toUpperCase(),
      '[INIT] Provider: ' + params.provider_name?.toUpperCase(),
      '[INIT] System: ' + params.system_name,
      '',
    ]);
    
    try {
      const idToken = await firebaseUser?.getIdToken();
      
      if (!idToken) {
        setOutput(prev => [...prev, '[ERROR] Authentication failed']);
        setIsGenerating(false);
        return;
      }

      const response = await fetch('/api/v1/convergence/generate-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          user_id: firebaseUser?.uid,
          system_name: params.system_name,
          template_type: params.template_type,
          endpoint: params.endpoint,
          api_key_env: params.api_key_env,
          description: params.description,
          provider_name: params.provider_name,
          intensity: params.intensity
        }),
      });

      const result: ConfigGenerationResponse = await response.json();

      if (!response.ok) {
        setOutput(prev => [...prev, 
          '[ERROR] ' + (result.error || 'Config generation failed'),
          '',
          '$ _'
        ]);
        setIsGenerating(false);
        return;
      }

      setGeneratedConfigId(result.config_id || null);
      
      const preview = result.config_preview;
      setOutput(prev => [...prev,
        '[SUCCESS] Config generated successfully!',
        '[CONFIG_ID] ' + result.config_id,
        '',
        '[PREVIEW]',
        '  API: ' + preview?.api_name,
        '  Endpoint: ' + preview?.endpoint,
        '  Parameters: ' + preview?.parameters?.join(', '),
        '  Test Cases: ' + preview?.test_case_count,
        '  Intensity: ' + preview?.intensity,
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider">
              STEP_1: SELECT_TEMPLATE
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setParams(prev => ({ ...prev, template_type: template.id as any }))}
                className={`text-left p-4 border transition-all ${
                  params.template_type === template.id
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'bg-black border-cyan-500/20 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="text-sm font-mono font-bold text-cyan-400">
                      {template.name}
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {template.description}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600">
                      Examples: {template.examples.join(', ')}
                    </div>
                  </div>
                  {params.template_type === template.id && (
                    <span className="text-cyan-400 text-xs">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Provider/Endpoint Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider">
              STEP_2: CONFIGURE_ENDPOINT
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider">
                PROVIDER_PRESET
              </label>
              <select
                value={params.provider_name}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full bg-black border border-cyan-500/30 text-cyan-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-cyan-400"
                aria-label="Select provider preset"
              >
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="groq">Groq (Fast Inference)</option>
                <option value="azure">Azure OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="custom">Custom Endpoint</option>
              </select>
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

          <div className="space-y-2">
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider">
              API_ENDPOINT
            </label>
            <input
              type="text"
              value={params.endpoint}
              onChange={(e) => setParams(prev => ({ ...prev, endpoint: e.target.value }))}
              className="w-full bg-black border border-cyan-500/30 text-cyan-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-cyan-400"
              placeholder="https://api.example.com/v1/endpoint"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider">
                API_KEY_ENV_VAR
              </label>
              <input
                type="text"
                value={params.api_key_env}
                onChange={(e) => setParams(prev => ({ ...prev, api_key_env: e.target.value }))}
                className="w-full bg-black border border-cyan-500/30 text-cyan-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-cyan-400"
                placeholder="API_KEY"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider">
                INTENSITY
              </label>
              <select
                value={params.intensity}
                onChange={(e) => setParams(prev => ({ ...prev, intensity: e.target.value as any }))}
                className="w-full bg-black border border-cyan-500/30 text-cyan-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-cyan-400"
                aria-label="Select optimization intensity"
              >
                <option value="quick">QUICK (~12 calls, 1-2 min)</option>
                <option value="balanced">BALANCED (~18 calls, 2-3 min)</option>
                <option value="thorough">THOROUGH (~48 calls, 5-8 min)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider">
              DESCRIPTION
            </label>
            <textarea
              value={params.description}
              onChange={(e) => setParams(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full bg-black border border-cyan-500/30 text-cyan-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-cyan-400 resize-none"
              placeholder="Describe what this API does (helps generate better test cases)"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={isGenerating}
            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-black font-mono font-bold text-sm tracking-wider rounded transition-all duration-300 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
          >
            {isGenerating ? '>>> GENERATING...' : '>>> GENERATE_CONFIG'}
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
            <span>HOW_IT_WORKS</span>
          </div>
          <div className="text-xs font-mono text-slate-400 space-y-2">
            <p>1. Select template type based on your API architecture</p>
            <p>2. Configure endpoint and authentication details</p>
            <p>3. Generated config saved to Convex as CANDIDATE</p>
            <p>4. View in CONFIG_VAULT tab and promote to ACTIVE</p>
            <p>5. Use in OPTIMIZER tab to run optimization experiments</p>
          </div>
        </div>
      </form>
    </div>
  );
}

