export interface TestCase {
  input: string;
  expectedOutput?: string;
  context?: Record<string, unknown>;
}

export interface TestDataItem {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface OptimizerConfig {
  model: string;
  evaluationMetrics: string[];
  domain?: string;
}

export interface OptimizationOptions {
  testCases?: TestCase[];
  testData?: TestDataItem[];
  testProducts?: string[];
  iterations?: number;
  maxIterations?: number;
  targetMetric?: string;
  targetMetrics?: string[];
  evaluationCriteria?: string[];
}

export interface OptimizationResult {
  prompt: string;
  score: number;
  metrics: Record<string, number>;
  iterations: number;
}

export interface TemplateConfig {
  template: string;
  variables: Record<string, string[]>;
}

export interface EvaluationResult {
  accuracy: number;
  relevance: number;
  coherence: number;
  [key: string]: number;
}
