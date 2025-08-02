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
    it('should optimize a code analysis prompt', async () => {
      const basePrompt = `You are a technical documentation expert. Your task is to analyze the following code and provide a comprehensive explanation.

Code to analyze:
{code}

Please provide:
1. A high-level overview of what this code does
2. Key components and their responsibilities
3. Any potential issues or improvements
4. Best practices that are followed or violated

Be concise but thorough in your analysis.`;

      const options = {
        testCases: [
          {
            input:
              'async function fetchUserData(userId) { const response = await fetch(`/api/users/${userId}`); return response.json(); }',
            expectedOutput: 'This async function fetches user data from an API endpoint...',
          },
          {
            input:
              'class EventEmitter { constructor() { this.events = {}; } on(event, callback) { if (!this.events[event]) this.events[event] = []; this.events[event].push(callback); }}',
            expectedOutput: 'This class implements the observer pattern...',
          },
        ],
        iterations: 5,
        targetMetric: 'accuracy',
      };

      const result = await optimizer.optimize(basePrompt, options);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Optimized prompt should maintain key instructions
      expect(result).toContain('code');
      expect(result).toContain('analyze');
    });

    it('should optimize a customer support classification prompt', async () => {
      const basePrompt = `Given a customer support ticket, classify it into one of the following categories:
- Technical Issue
- Billing Question
- Feature Request
- General Inquiry

Ticket: {ticket_content}

Category:`;

      const result = await optimizer.optimize(basePrompt, {});
      expect(result).toBeDefined();
      expect(result).toContain('Technical Issue');
      expect(result).toContain('Billing Question');
    });
  });

  describe('batchOptimize', () => {
    it('should optimize multiple real-world prompts', async () => {
      const prompts = [
        'Summarize the following article in 3 bullet points: {article}',
        'Extract all dates, names, and locations from this text: {text}',
        'Translate the following technical documentation from English to Spanish, maintaining technical accuracy: {documentation}',
      ];
      const options = { iterations: 3 };

      const results = await optimizer.batchOptimize(prompts, options);
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('evaluate', () => {
    it('should evaluate a sentiment analysis prompt', async () => {
      const prompt = `You are a sentiment analysis expert. Analyze the sentiment of the following review and classify it as:
- Positive (score: 0.7-1.0)
- Neutral (score: 0.3-0.7)
- Negative (score: 0.0-0.3)

Review: {review_text}

Sentiment: [POSITIVE/NEUTRAL/NEGATIVE]
Confidence Score: [0.0-1.0]
Key phrases supporting this classification:`;

      const testData = [
        {
          id: '1',
          content: 'The product exceeded my expectations. Great quality and fast shipping!',
          metadata: { expected: 'POSITIVE', expectedScore: 0.9 },
        },
      ];

      const result = await optimizer.evaluate(prompt, testData);
      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('relevance');
      expect(result).toHaveProperty('coherence');
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('compareVariations', () => {
    it('should compare different summarization prompt variations', async () => {
      const variations = [
        'List the main points from this text: {text}',
        'Provide a bullet-point summary of the key information in the following text: {text}',
        'Summarize this text in 3-5 concise bullet points, focusing on the most important information: {text}',
      ];
      const testData = [
        {
          id: '1',
          content:
            'Machine learning is a subset of artificial intelligence that enables systems to learn from data. It uses algorithms to identify patterns and make decisions with minimal human intervention. Common applications include recommendation systems, fraud detection, and natural language processing.',
          metadata: {
            expected: [
              'ML is subset of AI',
              'Learns from data',
              'Identifies patterns',
              'Minimal human intervention',
              'Used in recommendations, fraud detection, NLP',
            ],
          },
        },
      ];

      const results = await optimizer.compareVariations(variations, testData);
      expect(Object.keys(results)).toHaveLength(3);
      variations.forEach((variation) => {
        expect(results[variation]).toHaveProperty('accuracy');
        expect(results[variation]).toHaveProperty('relevance');
      });
    });
  });

  describe('compareModels', () => {
    it('should compare model performance on a technical writing task', async () => {
      const options = {
        prompt: `Write a clear, technical explanation of the following concept for a developer audience:

Concept: {concept}

Your explanation should:
- Define the concept precisely
- Provide a practical example
- Mention common use cases
- Note any important considerations or limitations`,
        models: ['gpt-4', 'claude-3', 'llama-2'],
        testCases: [
          {
            input: 'REST API pagination',
            expectedOutput:
              'Pagination in REST APIs is a technique for dividing large datasets into smaller chunks...',
          },
        ],
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
    it('should optimize a code generation prompt through multiple iterations', async () => {
      const options = {
        prompt: `Generate a {language} function that {task_description}.

Requirements:
- Include proper error handling
- Add inline comments explaining key logic
- Follow {language} best practices
- Optimize for readability and performance

Function signature: {signature}`,
        testData: [
          {
            id: '1',
            content: 'JavaScript function that validates email addresses',
            metadata: {
              expected:
                'function validateEmail(email) { const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/; return regex.test(email); }',
            },
          },
        ],
        evaluator: (_response: string, _expected: string) => Math.random(),
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

  describe('findBestVariation', () => {
    it('should find the best prompt template for data extraction', async () => {
      const { PromptTemplate } = await import('../src/templates/PromptTemplate.js');
      const template = new PromptTemplate({
        template: '{instruction} {fields} from {source}: {text}\\n\\n{output_label}:',
        variables: {
          instruction: ['Extract', 'Please extract', 'Find and extract'],
          fields: ['the following information', 'these data points', 'all relevant details'],
          source: ['the text', 'this document', 'the following content'],
          output_label: ['Extracted data', 'Results', 'Information found'],
        },
      });

      const result = await optimizer.findBestVariation(template);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('extract');
    });
  });
});
