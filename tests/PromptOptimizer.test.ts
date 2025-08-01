import { PromptOptimizer } from '../src/optimizer/PromptOptimizer.js';
import type { OptimizerConfig } from '../src/types/index.js';

describe('PromptOptimizer', () => {
  let optimizer: PromptOptimizer;
  const config: OptimizerConfig = {
    model: 'gpt-4',
    evaluationMetrics: ['accuracy', 'relevance', 'coherence'],
  };

  beforeEach(() => {
    optimizer = new PromptOptimizer(config);
  });

  describe('optimize', () => {
    it('should return an optimized prompt', async () => {
      const basePrompt = 'Explain {topic} in simple terms';
      const options = {
        testCases: ['physics', 'chemistry'],
        iterations: 5,
        targetMetric: 'accuracy',
      };

      const result = await optimizer.optimize(basePrompt, options);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle empty options', async () => {
      const basePrompt = 'Test prompt';
      const result = await optimizer.optimize(basePrompt, {});
      expect(result).toBeDefined();
    });
  });

  describe('batchOptimize', () => {
    it('should optimize multiple prompts', async () => {
      const prompts = ['Prompt 1', 'Prompt 2', 'Prompt 3'];
      const options = { iterations: 3 };

      const results = await optimizer.batchOptimize(prompts, options);
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('evaluate', () => {
    it('should return evaluation metrics', async () => {
      const prompt = 'Test prompt';
      const testData = [{ input: 'test', expected: 'output' }];

      const result = await optimizer.evaluate(prompt, testData);
      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('relevance');
      expect(result).toHaveProperty('coherence');
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('compareVariations', () => {
    it('should compare multiple prompt variations', async () => {
      const variations = ['Variation 1', 'Variation 2'];
      const testData = [{ input: 'test', expected: 'output' }];

      const results = await optimizer.compareVariations(variations, testData);
      expect(Object.keys(results)).toHaveLength(2);
      variations.forEach((variation) => {
        expect(results[variation]).toHaveProperty('accuracy');
      });
    });
  });

  describe('compareModels', () => {
    it('should compare performance across models', async () => {
      const options = {
        prompt: 'Test prompt',
        models: ['gpt-4', 'claude-3', 'llama-2'],
        testCases: [{ input: 'test' }],
      };

      const results = await optimizer.compareModels(options);
      expect(Object.keys(results)).toHaveLength(3);
      options.models.forEach((model) => {
        expect(results[model]).toHaveProperty('performance');
        expect(results[model]).toHaveProperty('cost');
      });
    });
  });

  describe('runOptimization', () => {
    it('should run complete optimization cycle', async () => {
      const options = {
        prompt: 'Initial prompt',
        testData: [{ input: 'test', expected: 'output' }],
        evaluator: (_response: any, _expected: any) => Math.random(),
        maxIterations: 10,
      };

      const result = await optimizer.runOptimization(options);
      expect(result).toHaveProperty('prompt');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('iterations');
      expect(result.iterations).toBe(10);
    });
  });
});
