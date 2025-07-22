import { AuthorityConfig } from './types';
import { CostCalculator } from './cost-calculator';
import { DetCostCalculator } from './det-cost-calculator';

/**
 * Factory function to create the appropriate cost calculator based on authority type
 */
export const createCostCalculator = (config: AuthorityConfig | null): CostCalculator | null => {
  if (!config) return null;

  switch (config.id) {
    case 'det':
      return new DetCostCalculator(config);
    case 'ifza':
    default:
      return new CostCalculator(config);
  }
}; 