/**
 * Convergence Admin Dashboard Types
 * Aligned with actual Convergence optimization system functionality
 */

export type TabId = 'runner' | 'experiments' | 'configs' | 'rl_meta' | 'runs' | 'terminal' | 'generator';

export interface Tab {
  id: TabId;
  label: string;
  cmd: string;
}

export interface OptimizationParams {
  system_name: string; // REQUIRED: System to optimize (e.g., "context_enrichment")
  api_name: string;
  search_space_params: string[];
  test_cases_path: string;
  generations: number;
  population_size: number;
  algorithm: 'mab_evolution' | 'genetic' | 'mab_only';
  parallel_workers: number;
  enable_rl_meta: boolean;
  enable_agent_society: boolean;
  mock_mode: boolean;
  mutation_rate: number;
  crossover_rate: number;
  elite_size: number;
  max_retries: number;
  timeout_seconds: number;
  early_stopping_enabled: boolean;
  early_stopping_patience: number;
  endpoint: string;
}

export interface ExperimentEntry {
  timestamp: string;
  session_id: string;
  run_id: string;
  api_name: string;
  test_case_id: string;
  config: Record<string, any>;
  score: number;
  success: boolean;
  latency_ms?: number;
}

export interface GenerationStats {
  generation: number;
  best_score: number;
  avg_score: number;
  population_size: number;
  mutations: number;
  crossovers: number;
}

export interface OptimizationSession {
  session_id: string;
  api_name: string;
  run_ids: string[];
  started_at: number;
  status: 'active' | 'completed' | 'failed';
  total_experiments: number;
  best_config: Record<string, any> | null;
  best_score: number;
  generations_completed: number;
}

export interface LegacyRecord {
  timestamp: string;
  api_name: string;
  config: Record<string, any>;
  score: number;
  success: boolean;
  total_uses: number;
}

export interface ConfigGenerationParams {
  user_id: string;
  system_name: string;
  template_type: 'llm_chat' | 'agno_agent' | 'web_automation';
  endpoint: string;
  api_key_env: string;
  description: string;
  provider_name: string;
  intensity: 'quick' | 'balanced' | 'thorough';
}

export interface ConfigGenerationResponse {
  success: boolean;
  message: string;
  config_id?: string;
  config_preview?: {
    api_name: string;
    endpoint: string;
    parameters: string[];
    test_case_count: number;
    algorithm: string;
  };
  error?: string;
}

export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  examples: string[];
}

