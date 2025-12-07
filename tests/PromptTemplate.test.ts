import { PromptTemplate } from '../src/templates/PromptTemplate.js';

describe('PromptTemplate', () => {
  describe('generate', () => {
    it('should generate all API documentation prompt variations', () => {
      const template = new PromptTemplate({
        template: `Generate {format} API documentation for a {method} endpoint that {action}. Include {details}.`,
        variables: {
          format: ['OpenAPI 3.0', 'Swagger 2.0', 'JSON Schema'],
          method: ['GET', 'POST', 'PUT'],
          action: ['retrieves user data', 'creates a new resource', 'updates existing data'],
          details: ['request/response examples', 'error codes', 'authentication requirements'],
        },
      });

      const variations = template.generate();
      expect(variations).toHaveLength(81); // 3 * 3 * 3 * 3
      expect(variations).toContain(
        'Generate OpenAPI 3.0 API documentation for a GET endpoint that retrieves user data. Include request/response examples.'
      );
      expect(variations).toContain(
        'Generate Swagger 2.0 API documentation for a POST endpoint that creates a new resource. Include error codes.'
      );
    });

    it('should generate code review prompt variations', () => {
      const template = new PromptTemplate({
        template: `Review this {language} code for {focus_area}. Pay special attention to {specific_concern}.`,
        variables: {
          language: ['JavaScript', 'Python', 'TypeScript', 'Go'],
          focus_area: [
            'security vulnerabilities',
            'performance issues',
            'code style',
            'best practices',
          ],
          specific_concern: ['error handling', 'memory management', 'type safety', 'scalability'],
        },
      });

      const variations = template.generate();
      expect(variations).toHaveLength(64); // 4 * 4 * 4
      expect(variations).toContain(
        'Review this TypeScript code for best practices. Pay special attention to type safety.'
      );
    });

    it('should generate data processing prompt variations', () => {
      const template = new PromptTemplate({
        template:
          'Convert this {input_format} data to {output_format} format, ensuring {requirement}.',
        variables: {
          input_format: ['CSV', 'JSON', 'XML'],
          output_format: ['JSON', 'SQL INSERT statements', 'Parquet'],
          requirement: ['data integrity', 'proper escaping', 'schema validation'],
        },
      });

      const variations = template.generate();
      expect(variations).toHaveLength(27); // 3 * 3 * 3
    });
  });

  describe('randomVariation', () => {
    it('should generate random technical writing prompts', () => {
      const template = new PromptTemplate({
        template: `Write a {document_type} explaining {technical_concept} for {target_audience}. The tone should be {tone} and include {examples}.`,
        variables: {
          document_type: [
            'tutorial',
            'technical specification',
            'architecture document',
            'troubleshooting guide',
          ],
          technical_concept: [
            'microservices',
            'CI/CD pipelines',
            'database sharding',
            'caching strategies',
          ],
          target_audience: [
            'junior developers',
            'senior engineers',
            'DevOps teams',
            'technical managers',
          ],
          tone: ['formal', 'conversational', 'academic', 'practical'],
          examples: ['code snippets', 'diagrams', 'real-world scenarios', 'performance metrics'],
        },
      });

      const variation = template.randomVariation();
      expect(variation).toMatch(
        /Write a (tutorial|technical specification|architecture document|troubleshooting guide)/
      );
      expect(variation).toMatch(
        /explaining (microservices|CI\/CD pipelines|database sharding|caching strategies)/
      );
      expect(variation).toMatch(
        /for (junior developers|senior engineers|DevOps teams|technical managers)/
      );
    });

    it('should generate random SQL query generation prompts', () => {
      const template = new PromptTemplate({
        template:
          'Generate a {complexity} SQL query to {task} from the {table} table(s), using {feature}.',
        variables: {
          complexity: ['simple', 'intermediate', 'complex', 'optimized'],
          task: [
            'aggregate sales data',
            'find duplicate records',
            'calculate running totals',
            'analyze user behavior',
          ],
          table: [
            'orders',
            'users and transactions',
            'products, inventory, and sales',
            'multi-tenant',
          ],
          feature: ['window functions', 'CTEs', 'joins and subqueries', 'indexes'],
        },
      });

      const variation = template.randomVariation();
      expect(variation).toContain('SQL query');
      expect(variation).toMatch(/Generate a (simple|intermediate|complex|optimized)/);
    });
  });

  describe('interpolate', () => {
    it('should interpolate code generation prompts with custom values', () => {
      const template = new PromptTemplate({
        template: `Create a {language} {component_type} that {functionality}. It should follow {pattern} pattern and include {features}.`,
        variables: {
          language: ['TypeScript', 'Python', 'React'],
          component_type: ['class', 'function', 'component'],
          functionality: ['handles API requests', 'manages state', 'validates input'],
          pattern: ['singleton', 'factory', 'observer'],
          features: ['error handling', 'logging', 'tests'],
        },
      });

      const result = template.interpolate({
        language: 'Rust',
        component_type: 'module',
        functionality: 'manages database connections',
        pattern: 'connection pool',
        features: 'thread safety and error recovery',
      });

      expect(result).toBe(
        'Create a Rust module that manages database connections. It should follow connection pool pattern and include thread safety and error recovery.'
      );
    });

    it('should handle partial interpolation for debugging prompts', () => {
      const template = new PromptTemplate({
        template:
          'Debug this {issue_type} in {environment} environment. The error occurs when {trigger} and shows {symptom}.',
        variables: {
          issue_type: ['memory leak', 'race condition', 'deadlock', 'performance bottleneck'],
          environment: ['production', 'staging', 'development', 'CI/CD'],
          trigger: ['high load', 'concurrent requests', 'specific input', 'after deployment'],
          symptom: ['high CPU usage', 'timeout errors', 'data corruption', 'service crashes'],
        },
      });

      const result = template.interpolate({
        issue_type: 'infinite loop',
        environment: 'production',
        trigger: 'processing large datasets',
      });

      expect(result).toBe(
        'Debug this infinite loop in production environment. The error occurs when processing large datasets and shows {symptom}.'
      );
    });

    it('should interpolate complex data analysis prompts', () => {
      const template = new PromptTemplate({
        template: `Analyze the {dataset_type} dataset to {analysis_goal}. Use {method} and present results as {output_format}. Consider {constraints}.`,
        variables: {
          dataset_type: ['time series', 'categorical', 'mixed'],
          analysis_goal: ['identify trends', 'find anomalies', 'predict outcomes'],
          method: ['statistical analysis', 'machine learning', 'data visualization'],
          output_format: ['detailed report', 'executive summary', 'interactive dashboard'],
          constraints: ['missing data', 'computational limits', 'privacy requirements'],
        },
      });

      const result = template.interpolate({
        dataset_type: 'financial transaction',
        analysis_goal: 'detect fraudulent patterns',
        method: 'ensemble learning',
        output_format: 'real-time alerts',
        constraints: 'PCI compliance and GDPR',
      });

      expect(result).toBe(
        'Analyze the financial transaction dataset to detect fraudulent patterns. Use ensemble learning and present results as real-time alerts. Consider PCI compliance and GDPR.'
      );
    });
  });
});
