import { OfferData } from '@/types/offer';
import { AuthorityConfig, VisaCostBreakdown, CostSummary } from './types';
import { CostCalculator } from './cost-calculator';

/**
 * DET-specific cost calculator that extends the base CostCalculator
 * Handles DET's unique visa calculation requirements and cost structures
 */
export class DetCostCalculator extends CostCalculator {
  constructor(config: AuthorityConfig) {
    super(config);
  }

  /**
   * Override visa cost calculation for DET's specific requirements
   */
  calculateVisaCosts(data: OfferData): VisaCostBreakdown {
    const costs: VisaCostBreakdown = {
      standardGovernmentFees: 0,
      reducedGovernmentFees: 0,
      governmentFees: 0,
      tmeServicesFees: 0,
      healthInsurance: 0,
      investorVisaFees: 0, // DET has no investor visa cost
      employmentVisaFees: 0,
      statusChangeFees: 0,
      vipStampingFees: 0,
      
      // Spouse visa breakdown (now supported in DET)
      spouseVisaApplicationFees: 0,
      spouseVisaStandardFees: 0,
      spouseVisaTmeServicesFees: 0,
      spouseVisaStatusChangeFees: 0,
      spouseVisaHealthInsurance: 0,
      spouseVisaVipStampingFees: 0,
      spouseVisaTotal: 0,
      
      // Child visa breakdown (now supported in DET)
      childVisaStandardFees: 0,
      childVisaTmeServicesFees: 0,
      childVisaStatusChangeFees: 0,
      childVisaHealthInsurance: 0,
      childVisaVipStampingFees: 0,
      childVisaTotal: 0,
      
      // Combined family visa total
      familyVisaTotal: 0,
      
      total: 0,
    };

    const numberOfVisas = data.visaCosts?.numberOfVisas || 0;

    // Company visa calculations (only run if numberOfVisas > 0)
    if (numberOfVisas > 0) {
      // DET-specific visa fees: Use config values with fallback to 6000
      const detVisaFee = this.config.visaCosts.standardVisaFee || 6000;
      costs.standardGovernmentFees = numberOfVisas * detVisaFee;
      costs.reducedGovernmentFees = 0; // DET has no reduced visa option
      costs.governmentFees = costs.standardGovernmentFees;

      // TME Services fees: Use config values with fallback to 3150
      const tmeVisaFee = this.config.visaCosts.tmeVisaServiceFee || 3150;
      costs.tmeServicesFees = numberOfVisas * tmeVisaFee;

      // Health insurance costs (reuse base class logic)
      costs.healthInsurance = this.calculateHealthInsuranceCosts(data);

      // Investor visa fees: DET doesn't support investor visas
      costs.investorVisaFees = 0;

      // Employment visa fees (DET specific rates) - Updated to use per-visa selections
      const employmentVisaCount = data.visaCosts?.visaDetails?.filter(visa => 
        visa.investorVisa === "employment"
      ).length || 0;

      if (employmentVisaCount > 0) {
        // Use config values with fallbacks
        const employeeRate = this.config.visaCosts.employmentVisaEmployeeInsurance || 190;
        
        const employeeInsuranceCost = employmentVisaCount * employeeRate;
        costs.employmentVisaFees = employeeInsuranceCost;
      }

      // Visa status change fees - Updated to count per-visa selections
      if (this.config.features.supportsVisaStatusChange && this.config.visaCosts.statusChangeFee) {
        // Count from per-visa selections (handle both string "true" and boolean true)
        const perVisaStatusChanges = data.visaCosts?.visaDetails?.filter(visa => 
          visa.statusChange === true || (visa.statusChange as any) === "true"
        ).length || 0;
        
        // Fallback to old way for backward compatibility
        const legacyStatusChanges = data.visaCosts?.visaStatusChange || 0;
        
        const totalStatusChanges = perVisaStatusChanges > 0 ? perVisaStatusChanges : legacyStatusChanges;
        costs.statusChangeFees = totalStatusChanges * this.config.visaCosts.statusChangeFee;
      }

      // VIP stamping fees - Updated to count per-visa selections
      if (this.config.features.supportsVipStamping && this.config.visaCosts.vipStampingFee) {
        // Count from per-visa selections (handle both string "true" and boolean true)
        const perVisaVipStamping = data.visaCosts?.visaDetails?.filter(visa => 
          visa.vipStamping === true || (visa.vipStamping as any) === "true"
        ).length || 0;
        
        // Fallback to old way for backward compatibility
        const legacyVipStamping = data.visaCosts?.vipStampingVisas || 0;
        
        const totalVipStamping = perVisaVipStamping > 0 ? perVisaVipStamping : legacyVipStamping;
        costs.vipStampingFees = totalVipStamping * this.config.visaCosts.vipStampingFee;
      }
    }

    // Spouse visa calculations (now supported in DET)
    if (data.visaCosts?.spouseVisa && this.config.visaCosts.spouseVisaStandardFee) {
      // Standard Authority Fees (mandatory if spouse visa selected)
      if (this.config.visaCosts.spouseVisaStandardFee) {
        costs.spouseVisaStandardFees = this.config.visaCosts.spouseVisaStandardFee;
      }
      
      // TME Services Fee (mandatory if spouse visa selected)
      if (this.config.visaCosts.spouseVisaTmeServiceFee) {
        costs.spouseVisaTmeServicesFees = this.config.visaCosts.spouseVisaTmeServiceFee;
      }
      
      // Spouse visa status change (optional)
      if (data.visaCosts.spouseVisaStatusChange && this.config.visaCosts.statusChangeFee) {
        costs.spouseVisaStatusChangeFees = this.config.visaCosts.statusChangeFee;
      }
      
      // Spouse visa health insurance (optional)
      if (data.visaCosts.spouseVisaInsurance && data.visaCosts.spouseVisaInsurance !== 'No Insurance') {
        const insuranceCost = data.visaCosts.spouseVisaInsurance === 'Low Cost' 
          ? (this.config.visaCosts.healthInsurance.lowCost || 1000)
          : (this.config.visaCosts.healthInsurance.silverPackage || 6000);
        costs.spouseVisaHealthInsurance = insuranceCost;
      }
      
      // Spouse visa VIP stamping (optional)
      if (data.visaCosts.spouseVisaVipStamping && this.config.visaCosts.vipStampingFee) {
        costs.spouseVisaVipStampingFees = this.config.visaCosts.vipStampingFee;
      }
      
      // Calculate spouse visa total
      costs.spouseVisaTotal = costs.spouseVisaStandardFees + 
                             costs.spouseVisaTmeServicesFees + 
                             costs.spouseVisaStatusChangeFees + 
                             costs.spouseVisaHealthInsurance + 
                             costs.spouseVisaVipStampingFees;
    }

    // Child visa calculations (now supported in DET)
    if (data.visaCosts?.childVisa && data.visaCosts?.numberOfChildVisas && data.visaCosts.numberOfChildVisas > 0 && this.config.visaCosts.childVisaStandardFee) {
      const numberOfChildVisas = data.visaCosts.numberOfChildVisas;
      
      // Standard Authority Fees (mandatory for each child visa)
      if (this.config.visaCosts.childVisaStandardFee) {
        costs.childVisaStandardFees = numberOfChildVisas * this.config.visaCosts.childVisaStandardFee;
      }
      
      // TME Services Fee (mandatory for each child visa)
      if (this.config.visaCosts.childVisaTmeServiceFee) {
        costs.childVisaTmeServicesFees = numberOfChildVisas * this.config.visaCosts.childVisaTmeServiceFee;
      }
      
      // Child visa status change (optional)
      if (data.visaCosts.childVisaStatusChange && this.config.visaCosts.statusChangeFee) {
        costs.childVisaStatusChangeFees = data.visaCosts.childVisaStatusChange * this.config.visaCosts.statusChangeFee;
      }
      
      // Child visa health insurance
      costs.childVisaHealthInsurance = this.calculateChildVisaHealthInsuranceCosts(data);
      
      // Child visa VIP stamping (optional)
      if (data.visaCosts.childVisaVipStamping && this.config.visaCosts.vipStampingFee) {
        costs.childVisaVipStampingFees = data.visaCosts.childVisaVipStamping * this.config.visaCosts.vipStampingFee;
      }
      
      // Calculate child visa total
      costs.childVisaTotal = costs.childVisaStandardFees + 
                            costs.childVisaTmeServicesFees + 
                            costs.childVisaStatusChangeFees + 
                            costs.childVisaHealthInsurance + 
                            costs.childVisaVipStampingFees;
    }

    // Calculate family visa total
    costs.familyVisaTotal = costs.spouseVisaTotal + costs.childVisaTotal;

    // Calculate total (excluding family visa costs - they are separate)
    costs.total = costs.governmentFees + 
                  costs.tmeServicesFees + 
                  costs.healthInsurance + 
                  costs.investorVisaFees + 
                  costs.employmentVisaFees + 
                  costs.statusChangeFees + 
                  costs.vipStampingFees;

    return costs;
  }

  /**
   * Override cost summary calculation for DET's specific requirements
   */
  calculateCostSummary(data: OfferData): CostSummary {
    const initialSetup = this.calculateInitialSetupCosts(data);
    const visaCosts = this.calculateVisaCosts(data); // Uses our overridden method
    const yearlyRunning = this.calculateYearlyRunningCosts(data);
    
    // DET includes DEWA deposit and landlord deposit in total deposits
    const detRentType = data.detLicense?.rentType;
    const detRentAmount = data.detLicense?.officeRentAmount || 0;
    const detLandlordDeposit = (detRentType && detRentType !== 'business-center') ? detRentAmount * 0.05 : 0;
    const detDewaDeposit = detRentType === 'office' ? 
      (this.config.initialSetup.dewaDepositOffice || 2000) : 
      (detRentType === 'warehouse' ? (this.config.initialSetup.dewaDepositWarehouse || 4000) : 0);
    
    const deposits = detLandlordDeposit + detDewaDeposit;

    const grandTotal = initialSetup.total + visaCosts.total;
    const grandTotalWithDeposits = grandTotal + deposits;

    return {
      initialSetup,
      visaCosts,
      yearlyRunning,
      deposits,
      grandTotal,
      grandTotalWithDeposits,
    };
  }


} 