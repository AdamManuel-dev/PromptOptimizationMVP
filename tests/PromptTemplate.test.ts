import { PromptTemplate } from '../src/templates/PromptTemplate.js';

describe('PromptTemplate', () => {
  describe('generate', () => {
    it('should generate all possible variations', () => {
      const template = new PromptTemplate({
        template: 'As a {role}, explain {concept} to a {audience}',
        variables: {
          role: ['teacher', 'scientist'],
          concept: ['gravity', 'electricity'],
          audience: ['child', 'student'],
        },
      });

      const variations = template.generate();
      expect(variations).toHaveLength(8); // 2 * 2 * 2
      expect(variations).toContain('As a teacher, explain gravity to a child');
      expect(variations).toContain('As a scientist, explain electricity to a student');
    });

    it('should handle single variable', () => {
      const template = new PromptTemplate({
        template: 'Explain {topic}',
        variables: {
          topic: ['physics', 'chemistry', 'biology'],
        },
      });

      const variations = template.generate();
      expect(variations).toHaveLength(3);
    });

    it('should handle empty variables', () => {
      const template = new PromptTemplate({
        template: 'Static prompt with no variables',
        variables: {},
      });

      const variations = template.generate();
      expect(variations).toHaveLength(1);
      expect(variations[0]).toBe('Static prompt with no variables');
    });
  });

  describe('randomVariation', () => {
    it('should generate a random variation', () => {
      const template = new PromptTemplate({
        template: 'As a {role}, explain {concept}',
        variables: {
          role: ['teacher', 'scientist', 'engineer'],
          concept: ['AI', 'ML', 'DL'],
        },
      });

      const variation = template.randomVariation();
      expect(variation).toMatch(/As a (teacher|scientist|engineer), explain (AI|ML|DL)/);
    });
  });

  describe('interpolate', () => {
    it('should interpolate specific values', () => {
      const template = new PromptTemplate({
        template: 'Write a {type} about {topic} for {audience}',
        variables: {
          type: ['article', 'blog'],
          topic: ['technology', 'science'],
          audience: ['beginners', 'experts'],
        },
      });

      const result = template.interpolate({
        type: 'tutorial',
        topic: 'quantum computing',
        audience: 'students',
      });

      expect(result).toBe('Write a tutorial about quantum computing for students');
    });

    it('should handle partial interpolation', () => {
      const template = new PromptTemplate({
        template: 'The {color} {animal} jumped over the {object}',
        variables: {
          color: ['red', 'blue'],
          animal: ['fox', 'dog'],
          object: ['fence', 'wall'],
        },
      });

      const result = template.interpolate({
        color: 'brown',
        animal: 'cat',
      });

      expect(result).toBe('The brown cat jumped over the {object}');
    });
  });
});
