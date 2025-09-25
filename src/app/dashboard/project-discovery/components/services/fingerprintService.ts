/**
 * Fingerprint Management Service
 * 
 * Service for fingerprint-specific operations including validation,
 * completion detection, and widget generation triggers in the
 * project discovery system.
 * 
 * Used by: Main container component, fingerprint status components
 */

import type { FingerprintState as FingerprintData } from "../types/discoveryTypes";
import { discoveryApiService } from "./discoveryApiService";
import {
  validateFingerprintData,
  sanitizeFingerprintData,
  canActivateFingerprint,
} from "@/utils/fingerprint-validation";

/** Centralized service for fingerprint operations */
export class FingerprintService {
  /**
   * Validate a fingerprint object against the schema.
   * @param fingerprint - Raw fingerprint object
   * @returns true if valid, false otherwise
   */
  validateFingerprint(fingerprint: any): boolean {
    const result = validateFingerprintData(fingerprint ?? {});
    return result.isValid;
  }

  /**
   * Detect whether a fingerprint is complete and can be activated.
   * @param fingerprint - Raw fingerprint object
   * @returns true if complete, false otherwise
   */
  detectCompletion(fingerprint: any): boolean {
    if (!this.validateFingerprint(fingerprint)) return false;
    const activation = canActivateFingerprint(fingerprint ?? {});
    return activation.isValid === true;
  }

  /**
   * Transform arbitrary data into normalized FingerprintData.
   * @param data - Input data to normalize
   * @returns normalized fingerprint data
   */
  transformFingerprintData(data: any): FingerprintData {
    const normalized = sanitizeFingerprintData(data ?? {});
    return {
      current_fingerprint: normalized,
      is_complete: this.detectCompletion(normalized),
      confidence_score: typeof normalized.confidence_score === "number" ? normalized.confidence_score : 0,
      missing_areas: [],
    } as FingerprintData;
  }

  /**
   * Trigger widget generation by forcing fingerprint generation.
   * @param projectId - Project identifier
   */
  async triggerWidgetGeneration(projectId: string): Promise<void> {
    await discoveryApiService.generateFingerprint(projectId, true);
  }
}

// Export singleton instance for convenience
export const fingerprintService = new FingerprintService();


