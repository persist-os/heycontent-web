/**
 * Convergence Admin Dashboard Types
 * Aligned with actual Convergence optimization system functionality
 */

export type TabId = 'runner' | 'experiments' | 'configs' | 'rl_meta' | 'runs' | 'terminal';

export interface Tab {
  id: TabId;
  label: string;
  cmd: string;
}

export interface OptimizationParams {
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

