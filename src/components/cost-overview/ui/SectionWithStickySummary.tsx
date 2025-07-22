import React, { useRef, useEffect, useState } from 'react';
import { OfferData } from '@/types/offer';
import { AuthorityConfig, InitialSetupCosts, VisaCostBreakdown, YearlyRunningCosts } from '@/lib/business';
import { 
  generateServiceDescriptions, 
  generateNumberedServices, 
  formatServiceDescription as formatPDFServiceDescription,
  generateCompanyVisaServiceDescriptions,
  generateSpouseVisaServiceDescriptions,
  generateChildVisaServiceDescriptions,
  generateNumberedVisaServices,
  formatVisaServiceDescription,
  generateYearlyRunningServiceDescriptions,
  generateNumberedYearlyRunningServices,
  formatYearlyRunningServiceDescription
} from '@/lib/pdf-generator/utils';

interface SectionWithStickySummaryProps {
  children: React.ReactNode;
  sectionId: string;
  summaryTitle?: string;
  costs?: InitialSetupCosts | VisaCostBreakdown | YearlyRunningCosts | null;
  watchedData?: OfferData;
  authorityConfig?: AuthorityConfig | null;
  gradientColors?: string;
  iconColor?: string;
  includeDeposits?: boolean;
  showSummary?: boolean;
  visaType?: 'company' | 'spouse' | 'child';
}

export const SectionWithStickySummary: React.FC<SectionWithStickySummaryProps> = ({
  children,
  sectionId,
  summaryTitle,
  costs,
  watchedData,
  authorityConfig,
  gradientColors = "bg-gradient-to-r from-gray-100 to-slate-100 border-gray-200",
  iconColor = "bg-gray-600",
  includeDeposits = false,
  showSummary = false,
  visaType = 'company'
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  
  // Create a stable version of showSummary that doesn't flicker
  const [stableShowSummary, setStableShowSummary] = useState(false);
  const [displayCosts, setDisplayCosts] = useState(costs);
  
  // Update stable values - much simpler logic
  React.useEffect(() => {
    // Always update costs when they change
    if (costs) {
      setDisplayCosts(costs);
    }
    
    // Only show summary when we have valid showSummary AND costs
    if (showSummary && costs) {
      setStableShowSummary(true);
    }
    // Only hide when explicitly told to hide AND no costs
    else if (!showSummary && !costs) {
      setStableShowSummary(false);
    }
    // In all other cases, keep current state (prevents flickering)
  }, [showSummary, costs]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Much simpler observer - just check if section is visible at all
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);
        if (inView) {
          setHasBeenInView(true);
        }
      },
      {
        rootMargin: '0px 0px -50% 0px', // Hide sticky when section is almost out of view
        threshold: 0.1 // Show when at least 10% is visible
      }
    );

    observer.observe(section);

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []); // Keep empty dependency array

  const renderSummaryContent = () => {
    
    if (!stableShowSummary || !displayCosts || !watchedData || !authorityConfig) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">Fill out the section to see cost summary</p>
        </div>
      );
    }

    const exchangeRate = watchedData.clientDetails?.exchangeRate || 4;
    const currency = watchedData.clientDetails?.secondaryCurrency || 'EUR';

         const renderCostLine = (description: string, amount: number, isReduction = false) => {
       if (amount === 0) return null;
       
       return (
         <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 gap-4">
           <span className={`text-sm flex-1 ${isReduction ? 'text-red-600' : 'text-gray-700'}`}>
             {description}
           </span>
           <div className="text-right flex-shrink-0 min-w-[120px]">
             <div className={`font-semibold ${isReduction ? 'text-red-600' : 'text-gray-900'}`}>
               {isReduction ? '-' : ''}AED {amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
             </div>
             <div className={`text-xs ${isReduction ? 'text-red-500' : 'text-gray-500'}`}>
               {isReduction ? '-' : ''}{currency} {(amount / exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
             </div>
           </div>
         </div>
       );
     };

         const getSectionTotal = () => {
       if ('baseLicense' in displayCosts) {
         // Initial Setup Costs
         const setupCosts = displayCosts as InitialSetupCosts;
         return setupCosts.total || 0;
       }
       if ('governmentFees' in displayCosts) {
         // Visa Cost Breakdown - return specific visa type total
         const visaCosts = displayCosts as VisaCostBreakdown;
         if (visaType === 'spouse') {
           return visaCosts.spouseVisaTotal || 0;
         }
         if (visaType === 'child') {
           return visaCosts.childVisaTotal || 0;
         }
         // Default to company visa total (main visa costs)
         return visaCosts.total || 0;
       }
       if ('baseLicenseRenewal' in displayCosts) {
         // Yearly Running Costs
         const yearlyCosts = displayCosts as YearlyRunningCosts;
         return yearlyCosts.total || 0;
       }
       return 0;
     };

    const total = getSectionTotal();

        // Render detailed breakdown using the same logic as CostSummarySection
    const renderDetailedBreakdown = () => {
      if ('baseLicense' in displayCosts) {
        // Initial Setup Costs - use same logic as CostSummarySection
        const serviceDescriptions = generateServiceDescriptions(watchedData);
        const numberedServices = generateNumberedServices(serviceDescriptions);
        

        
        return (
          <div className="space-y-2">
            {numberedServices.map((service) => (
              <div key={service.id}>
                {renderCostLine(
                  formatPDFServiceDescription(service), 
                  service.amount, 
                  service.isReduction
                )}
              </div>
            ))}
          </div>
        );
      }
      if ('governmentFees' in displayCosts) {
        // Visa costs - handle different visa types
        const visaCosts = displayCosts as VisaCostBreakdown;
        
        if (visaType === 'spouse') {
          // Spouse visa breakdown
          const spouseVisaServiceDescriptions = generateSpouseVisaServiceDescriptions(watchedData, visaCosts);
          const numberedSpouseVisaServices = generateNumberedVisaServices(spouseVisaServiceDescriptions);
          
          return (
            <div className="space-y-2">
              {numberedSpouseVisaServices.map((service) => (
                <div key={service.id}>
                  {renderCostLine(
                    formatVisaServiceDescription(service), 
                    service.amount, 
                    service.isReduction
                  )}
                </div>
              ))}
            </div>
          );
        }
        
        if (visaType === 'child') {
          // Child visa breakdown
          const childVisaServiceDescriptions = generateChildVisaServiceDescriptions(watchedData, visaCosts, authorityConfig);
          const numberedChildVisaServices = generateNumberedVisaServices(childVisaServiceDescriptions);
          
          return (
            <div className="space-y-2">
              {numberedChildVisaServices.map((service) => (
                <div key={service.id}>
                  {renderCostLine(
                    formatVisaServiceDescription(service), 
                    service.amount, 
                    service.isReduction
                  )}
                </div>
              ))}
            </div>
          );
        }
        
        // Default: Company visa breakdown
        const companyVisaServiceDescriptions = generateCompanyVisaServiceDescriptions(watchedData, visaCosts, authorityConfig);
        const numberedCompanyVisaServices = generateNumberedVisaServices(companyVisaServiceDescriptions);
        
        return (
          <div className="space-y-2">
            {numberedCompanyVisaServices.map((service) => (
              <div key={service.id}>
                {renderCostLine(
                  formatVisaServiceDescription(service), 
                  service.amount, 
                  service.isReduction
                )}
              </div>
            ))}
          </div>
        );
      }
      if ('baseLicenseRenewal' in displayCosts) {
        // Yearly running costs
        const yearlyCosts = displayCosts as YearlyRunningCosts;
        const yearlyRunningServiceDescriptions = generateYearlyRunningServiceDescriptions(watchedData, yearlyCosts, authorityConfig);
        const numberedYearlyRunningServices = generateNumberedYearlyRunningServices(yearlyRunningServiceDescriptions);
        
        return (
          <div className="space-y-2">
            {numberedYearlyRunningServices.map((service) => (
              <div key={service.id}>
                {renderCostLine(
                  formatYearlyRunningServiceDescription(service), 
                  service.amount
                )}
              </div>
            ))}
          </div>
        );
      }
      return null;
    };

    // Render deposits section for initial setup
    const renderDepositsSection = () => {
      if (!('baseLicense' in displayCosts) || !includeDeposits) return null;

      // IFZA deposits logic
      const ifzaDepositAmount = watchedData.ifzaLicense?.depositAmount || 0;
      const isIfzaDepositEnabled = watchedData.ifzaLicense?.depositWithLandlord;
      
      // DET deposits logic
      const detRentType = watchedData.detLicense?.rentType;
      const detRentAmount = watchedData.detLicense?.officeRentAmount || 0;
      const detLandlordDeposit = (detRentType && detRentType !== 'business-center') ? detRentAmount * 0.05 : 0;
      const detDewaDeposit = detRentType === 'office' ? 2000 : (detRentType === 'warehouse' ? 4000 : 0);
      
      const shouldShowIfzaDeposits = isIfzaDepositEnabled && ifzaDepositAmount > 0;
      const shouldShowDetDeposits = authorityConfig?.id === 'det' && (detLandlordDeposit > 0 || detDewaDeposit > 0);
      
      if (!shouldShowIfzaDeposits && !shouldShowDetDeposits) return null;

      return (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-2">Deposits</div>
          <div className="space-y-2">
            {shouldShowIfzaDeposits && renderCostLine('Deposit with Landlord', ifzaDepositAmount)}
            {shouldShowDetDeposits && (
              <>
                {detLandlordDeposit > 0 && renderCostLine('Landlord Deposit (5% of rent)', detLandlordDeposit)}
                {detDewaDeposit > 0 && renderCostLine('DEWA Deposit', detDewaDeposit)}
              </>
            )}
          </div>
        </div>
      );
    };

    const totalWithDeposits = (() => {
      let total = getSectionTotal();
      if (includeDeposits && 'baseLicense' in displayCosts) {
        // Add IFZA deposits
        if (watchedData.ifzaLicense?.depositWithLandlord) {
          total += watchedData.ifzaLicense?.depositAmount || 0;
        }
        // Add DET deposits
        if (authorityConfig?.id === 'det' && watchedData.detLicense?.rentType && watchedData.detLicense?.rentType !== 'business-center') {
          const detRentAmount = watchedData.detLicense?.officeRentAmount || 0;
          const detLandlordDeposit = detRentAmount * 0.05;
          const detDewaDeposit = watchedData.detLicense?.rentType === 'office' ? 2000 : (watchedData.detLicense?.rentType === 'warehouse' ? 4000 : 0);
          total += detLandlordDeposit + detDewaDeposit;
        }
      }
      return total;
    })();

    const hasDeposits = includeDeposits && totalWithDeposits > total;

    return (
      <div className="space-y-3">
        {/* Detailed cost breakdown */}
        {renderDetailedBreakdown()}
        
        {/* Main Total (show first when deposits exist) */}
        {total > 0 && hasDeposits && (
          <div className="border-t-2 border-gray-300 pt-3 mt-4">
            <div className="flex justify-between items-center gap-4">
              <span className="font-semibold text-gray-900 flex-1">Total (Without Deposits)</span>
              <div className="text-right flex-shrink-0 min-w-[120px]">
                <div className="font-bold text-lg text-gray-900">
                  AED {total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-600">
                  {currency} {(total / exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Deposits section (show after total without deposits) */}
        {renderDepositsSection()}

        {/* Total Including Deposits (final total) */}
        {hasDeposits && (
          <div className="border-t border-gray-300 pt-3">
            <div className="flex justify-between items-center gap-4">
              <span className="font-bold text-gray-900 flex-1">Total (Including Deposits)</span>
              <div className="text-right flex-shrink-0 min-w-[120px]">
                <div className="font-bold text-xl text-gray-900">
                  AED {totalWithDeposits.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-600">
                  {currency} {(totalWithDeposits / exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Total (show when no deposits) */}
        {total > 0 && !hasDeposits && (
          <div className="border-t-2 border-gray-300 pt-3 mt-4">
            <div className="flex justify-between items-center gap-4">
              <span className="font-semibold text-gray-900 flex-1">Total</span>
              <div className="text-right flex-shrink-0 min-w-[120px]">
                <div className="font-bold text-lg text-gray-900">
                  AED {total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-gray-600">
                  {currency} {(total / exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={sectionRef} data-section-id={sectionId} className="relative">
      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1">
          {children}
        </div>

        {/* Sticky summary */}
        {summaryTitle && (
          <div className="hidden xl:block w-[420px] flex-shrink-0">
            <div 
              className={`transition-all duration-300 ${
                stableShowSummary && (isInView || hasBeenInView)
                  ? 'sticky top-6 opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <div className={`rounded-2xl p-6 shadow-lg border-2 ${gradientColors} backdrop-blur-sm`}>
                <div className="flex items-center mb-4">
                  <div className={`w-3 h-3 rounded-full ${iconColor} mr-3`}></div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {summaryTitle}
                  </h3>
                </div>
                
                <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {renderSummaryContent()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile summary - only show when section is in view and has costs */}
        {summaryTitle && stableShowSummary && (
          <div className="xl:hidden mt-6">
            <div className={`rounded-2xl p-6 shadow-lg border-2 ${gradientColors}`}>
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full ${iconColor} mr-3`}></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {summaryTitle}
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {renderSummaryContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 