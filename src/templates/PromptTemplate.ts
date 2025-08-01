import type { TemplateConfig } from '../types/index.js';

export class PromptTemplate {
  private config: TemplateConfig;

  constructor(config: TemplateConfig) {
    this.config = config;
  }

  generate(): string[] {
    const variations: string[] = [];
    const { template, variables } = this.config;
    
    const variableKeys = Object.keys(variables);
    const variableValues = variableKeys.map(key => variables[key]);
    
    const combinations = this.getCombinations(variableValues);
    
    for (const combination of combinations) {
      let variation = template;
      variableKeys.forEach((key, index) => {
        variation = variation.replace(`{${key}}`, combination[index]);
      });
      variations.push(variation);
    }
    
    return variations;
  }

  randomVariation(): string {
    const { template, variables } = this.config;
    let variation = template;
    
    for (const [key, values] of Object.entries(variables)) {
      const randomValue = values[Math.floor(Math.random() * values.length)];
      variation = variation.replace(`{${key}}`, randomValue);
    }
    
    return variation;
  }

  interpolate(values: Record<string, string>): string {
    let result = this.config.template;
    
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(`{${key}}`, value);
    }
    
    return result;
  }

  private getCombinations(arrays: string[][]): string[][] {
    if (arrays.length === 0) return [[]];
    
    const [first, ...rest] = arrays;
    const subCombinations = this.getCombinations(rest);
    
    return first.flatMap(value => 
      subCombinations.map(combination => [value, ...combination])
    );
  }
}