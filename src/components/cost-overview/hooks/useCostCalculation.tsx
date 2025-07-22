import { useMemo } from 'react';
import { createCostCalculator, AuthorityConfig } from '@/lib/business';
import { OfferData } from '@/types/offer';

export const useCostCalculation = (
  authorityConfig: AuthorityConfig | null,
  formData: OfferData
) => {
  // Create calculator instance using the factory
  const calculator = useMemo(() => {
    return createCostCalculator(authorityConfig);
  }, [authorityConfig]);

  // Calculate all costs using the appropriate calculator - SIMPLIFIED
  const costs = useMemo(() => {
    if (!calculator) {
      return {
        initialSetup: null,
        visaCosts: null,
        yearlyRunning: null,
        costSummary: null,
      };
    }

    // Always recalculate - let React's memoization handle optimization
    const initialSetup = calculator.calculateInitialSetupCosts(formData);
    const visaCosts = calculator.calculateVisaCosts(formData);
    const yearlyRunning = calculator.calculateYearlyRunningCosts(formData);
    const costSummary = calculator.calculateCostSummary(formData);

    return {
      initialSetup,
      visaCosts,
      yearlyRunning,
      costSummary,
    };
  }, [calculator, formData]);

  return {
    calculator,
    costs,
    hasCalculations: !!calculator,
  };
}; 