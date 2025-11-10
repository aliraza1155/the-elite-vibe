// lib/id-system.ts
export class UnifiedIDSystem {
  /**
   * Generate a consistent ID for models that works across all systems
   */
  static generateModelID(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `model_${timestamp}_${randomStr}`;
  }

  /**
   * Ensure consistent ID format across all operations
   */
  static normalizeModelID(id: string): string {
    if (id.startsWith('model_')) {
      return id;
    }
    return id;
  }

  /**
   * Validate model ID format
   */
  static isValidModelID(id: string): boolean {
    return id.startsWith('model_') && id.length > 20;
  }

  /**
   * Extract timestamp from model ID for sorting/validation
   */
  static getTimestampFromID(id: string): number {
    const match = id.match(/model_(\d+)_/);
    return match ? parseInt(match[1]) : Date.now();
  }

  /**
   * Generate user ID
   */
  static generateUserID(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `user_${timestamp}_${randomStr}`;
  }

  /**
   * Generate purchase ID
   */
  static generatePurchaseID(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 12);
    return `purchase_${timestamp}_${randomStr}`;
  }
}