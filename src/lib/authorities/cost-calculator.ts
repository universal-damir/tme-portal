import { OfferData } from '@/types/offer';
import { 
  AuthorityConfig, 
  InitialSetupCosts, 
  VisaCostBreakdown, 
  YearlyRunningCosts, 
  CostSummary 
} from './types';

export class CostCalculator {
  constructor(protected config: AuthorityConfig) {}

  /**
   * Calculate initial setup costs based on authority configuration and form data
   */
  calculateInitialSetupCosts(data: OfferData): InitialSetupCosts {
    const costs: InitialSetupCosts = {
      baseLicense: 0,
      visaQuotaCosts: 0,
      registrationFee: 0,
      crossBorderLicense: 0,
      mofaTranslations: 0,
      officeRent: 0,
      thirdPartyApproval: 0,
      depositAmount: 0,
      tmeServicesFee: 0,
      priceReduction: 0,
      total: 0,
      // DET-specific costs
      detRegistrationFee: 0,
      mohreRegistrationFee: 0,
      detLicenseFee: 0,
      dewaDeposit: 0,
      landlordDeposit: 0,
      // IFZA-specific costs
      additionalActivitiesCost: 0,
    };

    if (this.config.id === 'det') {
      // DET-specific cost calculation
      
      // Fixed government registration fees for DET
      costs.registrationFee = this.config.initialSetup.registrationFee || 0; // GDRFA
      if (this.config.initialSetup.detRegistrationFee) {
        costs.detRegistrationFee = this.config.initialSetup.detRegistrationFee;
      }
      if (this.config.initialSetup.mohreRegistrationFee) {
        costs.mohreRegistrationFee = this.config.initialSetup.mohreRegistrationFee;
      }

      // DET License fee based on selected license type
      if (data.detLicense?.licenseType && this.config.initialSetup.detLicenseFees) {
        costs.detLicenseFee = this.config.initialSetup.detLicenseFees[data.detLicense.licenseType] || 0;
      }



      // MoFA translation costs
      costs.mofaTranslations = this.calculateMofaTranslationCosts(data);

      // Office rent (mandatory for DET with specific logic)
      if (data.detLicense?.rentType && data.detLicense?.officeRentAmount) {
        costs.officeRent = data.detLicense.officeRentAmount;
      }

      // Third-party approval costs
      if (this.config.features.hasThirdPartyApproval && 
          data.detLicense?.thirdPartyApproval && 
          data.detLicense?.thirdPartyApprovalAmount) {
        costs.thirdPartyApproval = data.detLicense.thirdPartyApprovalAmount;
      }

      // TME services fee (dynamic based on setup type)
      if (data.detLicense?.tmeServicesFee) {
        costs.tmeServicesFee = data.detLicense.tmeServicesFee;
      } else {
        // Use setup type to determine default TME fee
        const isIndividualSetup = data.clientDetails?.companySetupType === 'Individual Setup';
        costs.tmeServicesFee = isIndividualSetup 
          ? (this.config.initialSetup.individualTmeServicesFee || this.config.initialSetup.defaultTmeServicesFee)
          : this.config.initialSetup.defaultTmeServicesFee;
      }

      // Price reduction
      if (data.detLicense?.applyPriceReduction && data.detLicense?.reductionAmount) {
        costs.priceReduction = data.detLicense.reductionAmount;
      }

      // Deposits (not included in main total but tracked)
      if (data.detLicense?.rentType && data.detLicense.rentType !== 'business-center') {
        const rentAmount = data.detLicense?.officeRentAmount || 0;
        costs.depositAmount = rentAmount * 0.05; // 5% landlord deposit
        costs.landlordDeposit = rentAmount * 0.05; // Track landlord deposit separately
        
        // DEWA deposit
        if (data.detLicense.rentType === 'office') {
          costs.dewaDeposit = this.config.initialSetup.dewaDepositOffice || 2000;
        } else if (data.detLicense.rentType === 'warehouse') {
          costs.dewaDeposit = this.config.initialSetup.dewaDepositWarehouse || 4000;
        }
      }

    } else {
      // IFZA-specific cost calculation with multi-year support
      
      // Get license years (default to 1 if not specified)
      const licenseYears = data.ifzaLicense?.licenseYears || 1;
      
      // Calculate base license fee with multi-year discounts
      const baseFeePerYear = this.config.initialSetup.baseLicenseFee;
      const visaQuota = data.ifzaLicense?.visaQuota || 0;
      const visaQuotaCostPerYear = visaQuota * (this.config.initialSetup.visaQuotaCost || 0);
      const annualLicenseFee = baseFeePerYear + visaQuotaCostPerYear;
      
      // Apply multi-year discounts
      let totalLicenseFee = annualLicenseFee * licenseYears;
      if (licenseYears === 2) {
        totalLicenseFee = totalLicenseFee * 0.85; // 15% discount
      } else if (licenseYears === 3) {
        totalLicenseFee = totalLicenseFee * 0.80; // 20% discount
      } else if (licenseYears === 5) {
        totalLicenseFee = totalLicenseFee * 0.70; // 30% discount
      }
      
      costs.baseLicense = Math.round(totalLicenseFee);
      costs.visaQuotaCosts = 0; // Already included in baseLicense for multi-year

      // Registration fee (Establishment cards with special multi-year logic)
      if (data.ifzaLicense?.visaQuota && data.ifzaLicense.visaQuota > 0 && this.config.initialSetup.registrationFee) {
        if (licenseYears === 1) {
          costs.registrationFee = this.config.initialSetup.registrationFee; // 2,000 for 1 year
        } else {
          // Multi-year: 2,000 (first year) + (years-1) × 2,200 (subsequent years)
          const firstYear = this.config.initialSetup.registrationFee; // 2,000 for first year
          const subsequentYears = (licenseYears - 1) * (this.config.yearlyRunning.immigrationRenewalFee || 2200); // 2,200 per subsequent year
          costs.registrationFee = firstYear + subsequentYears;
        }
      }

      // Cross border license (multiplied by years)
      if (this.config.features.hasCrossBorderLicense && 
          data.ifzaLicense?.crossBorderLicense && 
          this.config.initialSetup.crossBorderLicense) {
        costs.crossBorderLicense = this.config.initialSetup.crossBorderLicense * licenseYears;
      }

      // MoFA translation costs (first year only)
      costs.mofaTranslations = this.calculateMofaTranslationCosts(data);

      // Office rent (multiplied by years)
      if (this.config.features.hasOfficeRental && 
          data.ifzaLicense?.rentOfficeRequired && 
          data.ifzaLicense?.officeRentAmount) {
        costs.officeRent = data.ifzaLicense.officeRentAmount * licenseYears;
      }

      // Third-party approval costs (multiplied by years)
      if (this.config.features.hasThirdPartyApproval && 
          data.ifzaLicense?.thirdPartyApproval && 
          data.ifzaLicense?.thirdPartyApprovalAmount) {
        costs.thirdPartyApproval = data.ifzaLicense.thirdPartyApprovalAmount * licenseYears;
      }

      // Deposit amount (separate from main costs, but tracked)
      if (data.ifzaLicense?.depositWithLandlord && data.ifzaLicense?.depositAmount) {
        costs.depositAmount = data.ifzaLicense.depositAmount;
      }

      // TME services fee
      costs.tmeServicesFee = data.ifzaLicense?.tmeServicesFee || this.config.initialSetup.defaultTmeServicesFee;

      // Additional activities cost (IFZA specific: >3 activities)
      if (this.config.id === 'ifza' && this.config.initialSetup.additionalActivityCost) {
        const activitiesCount = data.activityCodes?.length || 0;
        const isTbcEnabled = data.ifzaLicense?.activitiesToBeConfirmed || false;
        
        // Only charge for additional activities if TBC is NOT enabled and there are more than 3 activities
        if (!isTbcEnabled && activitiesCount > 3) {
          const additionalActivities = activitiesCount - 3;
          costs.additionalActivitiesCost = additionalActivities * this.config.initialSetup.additionalActivityCost;
        }
      }

      // Price reduction
      if (data.ifzaLicense?.applyPriceReduction && data.ifzaLicense?.reductionAmount) {
        costs.priceReduction = data.ifzaLicense.reductionAmount;
      }
    }

    // Calculate total (excluding deposits and including reduction)
    costs.total = costs.baseLicense + 
                  costs.visaQuotaCosts + 
                  costs.registrationFee + 
                  (costs.detRegistrationFee || 0) +
                  (costs.mohreRegistrationFee || 0) +
                  (costs.detLicenseFee || 0) +
                  costs.crossBorderLicense + 
                  costs.mofaTranslations + 
                  costs.officeRent + 
                  costs.thirdPartyApproval + 
                  costs.tmeServicesFee + 
                  (costs.additionalActivitiesCost || 0) - 
                  costs.priceReduction;

    return costs;
  }

  /**
   * Calculate visa-related costs
   */
  calculateVisaCosts(data: OfferData): VisaCostBreakdown {
    const costs: VisaCostBreakdown = {
      standardGovernmentFees: 0,
      reducedGovernmentFees: 0,
      governmentFees: 0,
      tmeServicesFees: 0,
      healthInsurance: 0,
      investorVisaFees: 0,
      employmentVisaFees: 0,
      statusChangeFees: 0,
      vipStampingFees: 0,
      
      // Spouse visa breakdown
      spouseVisaApplicationFees: 0,
      spouseVisaStandardFees: 0,
      spouseVisaTmeServicesFees: 0,
      spouseVisaStatusChangeFees: 0,
      spouseVisaHealthInsurance: 0,
      spouseVisaVipStampingFees: 0,
      spouseVisaTotal: 0,
      
      // Child visa breakdown
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
      // Government fees calculation
      const reducedVisas = data.visaCosts?.reducedVisaCost || 0;
      
      // Show all visas at standard rate first
      costs.standardGovernmentFees = numberOfVisas * this.config.visaCosts.standardVisaFee;
      
      // Calculate the actual reduced fee amount (positive value)
      // The display logic will handle showing it as negative for reductions
      const actualReducedFeePerVisa = this.config.visaCosts.standardVisaFee - this.config.visaCosts.reducedVisaFee;
      costs.reducedGovernmentFees = reducedVisas > 0 ? (reducedVisas * actualReducedFeePerVisa) : 0;
      
      costs.governmentFees = costs.standardGovernmentFees - costs.reducedGovernmentFees;

      // TME Services fees (same for all visas)
      costs.tmeServicesFees = numberOfVisas * this.config.visaCosts.tmeVisaServiceFee;

      // Health insurance costs
      costs.healthInsurance = this.calculateHealthInsuranceCosts(data);

      // Investor visa fees - Count per-visa selections (with legacy fallback)
      if (this.config.features.hasInvestorVisas && this.config.visaCosts.investorVisaFee) {
        // Primary method: count per-visa selections (handle both string "true" and boolean true)
        const perVisaInvestorVisas = data.visaCosts?.visaDetails?.filter(visa => 
          visa.investorVisa === true || (visa.investorVisa as any) === "true"
        ).length || 0;
        
        // Fallback to legacy field for backward compatibility with existing data
        const legacyInvestorVisas = data.visaCosts?.numberOfInvestorVisas || 0;
        
        // Use per-visa count if any exist, otherwise use legacy for backward compatibility
        const totalInvestorVisas = perVisaInvestorVisas > 0 ? perVisaInvestorVisas : legacyInvestorVisas;
        costs.investorVisaFees = totalInvestorVisas * this.config.visaCosts.investorVisaFee;
      }

      // Employment visa fees (DET specific) - Updated to support both legacy and per-visa selection
      let employmentVisaCount = 0;
      
      // For DET: Check per-visa employment selections
      if (this.config.id === 'det') {
        employmentVisaCount = data.visaCosts?.visaDetails?.filter(visa => 
          visa.investorVisa === "employment"
        ).length || 0;
      }
      // Note: Other authorities don't currently use employment visas, so no legacy support needed
      
      if (employmentVisaCount > 0 && 
          this.config.visaCosts.employmentVisaEmployeeInsurance) {
        const employeeInsuranceCost = employmentVisaCount * this.config.visaCosts.employmentVisaEmployeeInsurance;
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

    // Spouse visa calculations (for authorities that support it)
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
      
      // Calculate spouse visa total (removed application fees)
      costs.spouseVisaTotal = costs.spouseVisaStandardFees + 
                             costs.spouseVisaTmeServicesFees + 
                             costs.spouseVisaStatusChangeFees + 
                             costs.spouseVisaHealthInsurance + 
                             costs.spouseVisaVipStampingFees;
    }

    // Child visa calculations (for authorities that support it)
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
   * Calculate yearly running costs
   */
  calculateYearlyRunningCosts(data: OfferData): YearlyRunningCosts {
    const costs: YearlyRunningCosts = {
      baseLicenseRenewal: 0,
      visaQuotaRenewal: 0,
      crossBorderRenewal: 0,
      immigrationRenewal: 0,
      officeRent: 0,
      thirdPartyApproval: 0,
      tmeYearlyFee: 0,
      total: 0,
    };

    // Base license renewal (always included)
    costs.baseLicenseRenewal = this.config.yearlyRunning.baseLicenseRenewal;

    if (this.config.id === 'det') {
      // DET-specific yearly running costs
      
      // DET License renewal - dynamic based on license type (same as initial setup)
      if (data.detLicense?.licenseType && this.config.initialSetup.detLicenseFees) {
        costs.baseLicenseRenewal = this.config.initialSetup.detLicenseFees[data.detLicense.licenseType] || 0;
      }
      
      // Immigration renewal (GDRFA) - fixed yearly cost for DET
      if (this.config.yearlyRunning.immigrationRenewalFee) {
        costs.immigrationRenewal = this.config.yearlyRunning.immigrationRenewalFee;
      }

      // Office rent - use form data if available
      if (data.detLicense?.rentType && data.detLicense?.officeRentAmount) {
        costs.officeRent = data.detLicense.officeRentAmount;
      } else {
        costs.officeRent = 0;
      }

      // Third-party approval (yearly)
      if (this.config.features.hasThirdPartyApproval && 
          data.detLicense?.thirdPartyApproval && 
          data.detLicense?.thirdPartyApprovalAmount) {
        costs.thirdPartyApproval = data.detLicense.thirdPartyApprovalAmount;
      }

    } else {
      // IFZA-specific yearly running costs
      const licenseYears = data.ifzaLicense?.licenseYears || 1;
      
      // Calculate what yearly running costs WILL BE (regardless of multi-year prepayment)
      // This shows what costs will apply after the multi-year period ends
      
      // Base license renewal
      costs.baseLicenseRenewal = this.config.yearlyRunning.baseLicenseRenewal;
      
      // Visa quota renewal costs
      if (this.config.features.hasVisaQuota && 
          data.ifzaLicense?.visaQuota && 
          this.config.yearlyRunning.visaQuotaRenewalCost) {
        costs.visaQuotaRenewal = data.ifzaLicense.visaQuota * this.config.yearlyRunning.visaQuotaRenewalCost;
      }

      // Cross border renewal
      if (this.config.features.hasCrossBorderLicense && 
          data.ifzaLicense?.crossBorderLicense && 
          this.config.yearlyRunning.crossBorderRenewal) {
        costs.crossBorderRenewal = this.config.yearlyRunning.crossBorderRenewal;
      }

      // Immigration renewal (flat fee when visas exist)
      if (data.ifzaLicense?.visaQuota && 
          data.ifzaLicense.visaQuota > 0 && 
          this.config.yearlyRunning.immigrationRenewalFee) {
        costs.immigrationRenewal = this.config.yearlyRunning.immigrationRenewalFee;
      }

      // Office rent (yearly)
      if (this.config.features.hasOfficeRental && 
          data.ifzaLicense?.rentOfficeRequired && 
          data.ifzaLicense?.officeRentAmount) {
        costs.officeRent = data.ifzaLicense.officeRentAmount;
      }

      // Third-party approval (yearly)
      if (this.config.features.hasThirdPartyApproval && 
          data.ifzaLicense?.thirdPartyApproval && 
          data.ifzaLicense?.thirdPartyApprovalAmount) {
        costs.thirdPartyApproval = data.ifzaLicense.thirdPartyApprovalAmount;
      }
    }

    // TME yearly fee (always show what the annual cost will be)
    costs.tmeYearlyFee = this.config.yearlyRunning.tmeYearlyFee;

    // Calculate total
    costs.total = costs.baseLicenseRenewal + 
                  costs.visaQuotaRenewal + 
                  costs.crossBorderRenewal + 
                  costs.immigrationRenewal + 
                  costs.officeRent + 
                  costs.thirdPartyApproval + 
                  costs.tmeYearlyFee;

    return costs;
  }

  /**
   * Calculate complete cost summary
   */
  calculateCostSummary(data: OfferData): CostSummary {
    const initialSetup = this.calculateInitialSetupCosts(data);
    const visaCosts = this.calculateVisaCosts(data);
    const yearlyRunning = this.calculateYearlyRunningCosts(data);
    const deposits = initialSetup.depositAmount;

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

  /**
   * Calculate MoFA translation costs based on setup type and selected options
   */
  private calculateMofaTranslationCosts(data: OfferData): number {
    let total = 0;
    const mofaConfig = this.config.initialSetup.mofaTranslations;

    if (this.config.id === 'det') {
      // DET-specific MoFA calculation logic
      if (data.clientDetails.companySetupType === 'Corporate Setup') {
        if (data.detLicense?.mofaOwnersDeclaration && mofaConfig.ownersDeclaration) {
          total += mofaConfig.ownersDeclaration;
        }
        if (data.detLicense?.mofaCertificateOfIncorporation && mofaConfig.certificateOfIncorporation) {
          total += mofaConfig.certificateOfIncorporation;
        }
        if (data.detLicense?.mofaActualMemorandumOrArticles && mofaConfig.memorandumOrArticles) {
          total += mofaConfig.memorandumOrArticles;
        }
        if (data.detLicense?.mofaCommercialRegister && mofaConfig.commercialRegister) {
          total += mofaConfig.commercialRegister;
        }
      } else if (data.clientDetails.companySetupType === 'Individual Setup') {
        if (data.detLicense?.mofaPowerOfAttorney && mofaConfig.powerOfAttorney) {
          const numberOfShareholders = data.clientDetails?.numberOfShareholders || 1;
          total += mofaConfig.powerOfAttorney * numberOfShareholders;
        }
      }
    } else {
      // IFZA-specific MoFA calculation logic (original)
      if (data.clientDetails.companySetupType === 'Corporate Setup') {
        if (data.ifzaLicense?.mofaOwnersDeclaration && mofaConfig.ownersDeclaration) {
          total += mofaConfig.ownersDeclaration;
        }
        if (data.ifzaLicense?.mofaCertificateOfIncorporation && mofaConfig.certificateOfIncorporation) {
          total += mofaConfig.certificateOfIncorporation;
        }
        if (data.ifzaLicense?.mofaActualMemorandumOrArticles && mofaConfig.memorandumOrArticles) {
          total += mofaConfig.memorandumOrArticles;
        }
        if (data.ifzaLicense?.mofaCommercialRegister && mofaConfig.commercialRegister) {
          total += mofaConfig.commercialRegister;
        }
      } else if (data.clientDetails.companySetupType === 'Individual Setup') {
        if (data.ifzaLicense?.mofaPowerOfAttorney && mofaConfig.powerOfAttorney) {
          const numberOfShareholders = data.clientDetails?.numberOfShareholders || 1;
          total += mofaConfig.powerOfAttorney * numberOfShareholders;
        }
      }
    }

    return total;
  }

  /**
   * Calculate child visa health insurance costs based on child visa details
   */
  protected calculateChildVisaHealthInsuranceCosts(data: OfferData): number {
    let totalCost = 0;
    
    if (data.visaCosts?.childVisaDetails) {
      data.visaCosts.childVisaDetails.forEach((detail) => {
        if (detail?.healthInsurance && detail.healthInsurance !== 'No Insurance') {
          const costPerVisa = detail.healthInsurance === 'Low Cost' 
            ? (this.config.visaCosts.healthInsurance.lowCost || 1000)
            : (this.config.visaCosts.healthInsurance.silverPackage || 6000);
          totalCost += costPerVisa;
        }
      });
    }
    
    return totalCost;
  }

  /**
   * Calculate health insurance costs for all visas
   */
  protected calculateHealthInsuranceCosts(data: OfferData): number {
    let total = 0;
    
    if (!data.visaCosts?.visaDetails) return total;

    data.visaCosts.visaDetails.forEach((visaDetail) => {
      if (visaDetail.healthInsurance === 'Low Cost') {
        total += this.config.visaCosts.healthInsurance.lowCost;
      } else if (visaDetail.healthInsurance === 'Silver Package') {
        total += this.config.visaCosts.healthInsurance.silverPackage;
      }
      // 'No Insurance' adds 0 to total
    });

    return total;
  }
} 