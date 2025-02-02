import { MemoryNode, InputContext, ExtractInput } from './types';
import { ERROR_MESSAGES } from './config';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class InputValidator {
  static validateMemoryNode(node: MemoryNode): ValidationResult {
    const errors: string[] = [];

    if (!node.id || typeof node.id !== 'string') {
      errors.push('Invalid node ID');
    }

    if (!node.type || typeof node.type !== 'string') {
      errors.push('Invalid node type');
    }

    if (!node.content) {
      errors.push('Missing node content');
    }

    if (typeof node.confidence !== 'number' || node.confidence < 0 || node.confidence > 1) {
      errors.push('Invalid confidence value');
    }

    if (!node.timestamp || typeof node.timestamp !== 'number') {
      errors.push('Invalid timestamp');
    }

    if (!node.relationships || !(node.relationships instanceof Map)) {
      errors.push('Invalid relationships structure');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateContext(context: InputContext): ValidationResult {
    const errors: string[] = [];

    if (!context.situation || typeof context.situation !== 'string') {
      errors.push('Invalid context situation');
    }

    if (!Array.isArray(context.external_factors)) {
      errors.push('Invalid external factors');
    }

    if (!context.timestamp || typeof context.timestamp !== 'number') {
      errors.push('Invalid context timestamp');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateInput(input: ExtractInput): ValidationResult {
    const errors: string[] = [];

    if (!input.content || typeof input.content !== 'string') {
      errors.push('Invalid input content');
    }

    if (!input.type || typeof input.type !== 'string') {
      errors.push('Invalid input type');
    }

    const contextValidation = this.validateContext(input.context);
    if (!contextValidation.isValid) {
      errors.push(...contextValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static throwIfInvalid(validation: ValidationResult): void {
    if (!validation.isValid) {
      throw new Error(`${ERROR_MESSAGES.INVALID_INPUT}: ${validation.errors.join(', ')}`);
    }
  }
} 