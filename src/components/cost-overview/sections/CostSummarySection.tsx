import React from 'react';
import { Building2 } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { AuthorityConfig, InitialSetupCosts, VisaCostBreakdown, YearlyRunningCosts } from '@/lib/business';
import { getVisaText } from '../utils/textHelpers';
import { 
  generateServiceDescriptions, 
  generateNumberedServices, 
  formatServiceDescription as formatPDFServiceDescription,
  generateCompanyVisaServiceDescriptions,
  generateNumberedVisaServices,
  formatVisaServiceDescription,
  generateYearlyRunningServiceDescriptions,
  generateNumberedYearlyRunningServices,
  formatYearlyRunningServiceDescription
} from '@/lib/pdf-generator/utils';
import { FamilyVisaTotalSection } from './breakdowns/FamilyVisaTotalSection';
import { CostDisplayTableRow, CostBreakdownCard, CostSummaryCard } from '../ui';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';

interface CostSummarySectionProps {
  title: string;
  costs: InitialSetupCosts | VisaCostBreakdown | YearlyRunningCosts | null;
  watchedData: OfferData;
  authorityConfig: AuthorityConfig | null;
  gradientColors: string;
  iconColor: string;
  includeDeposits?: boolean;
}

export const CostSummarySection: React.FC<CostSummarySectionProps> = ({
  title,
  costs,
  watchedData,
  authorityConfig,
  gradientColors,
  iconColor,
  includeDeposits = false
}) => {
  const { clientDetails } = watchedData;
  const exchangeRate = clientDetails?.exchangeRate || 4;
  const currency = clientDetails?.secondaryCurrency || 'USD';

  if (!costs || !authorityConfig) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const renderInitialSetupCosts = (setupCosts: InitialSetupCosts) => {
    // Use shared service description logic
    const serviceDescriptions = generateServiceDescriptions(watchedData);
    const numberedServices = generateNumberedServices(serviceDescriptions);
    
    return numberedServices.map((service) => (
      <CostDisplayTableRow
        key={service.id}
        description={formatPDFServiceDescription(service)}
        aedAmount={service.amount}
        exchangeRate={exchangeRate}
        isReduction={service.isReduction}
      />
    ));
  };

  const renderVisaCosts = (visaCosts: VisaCostBreakdown) => {
    // Use shared service description logic for company visas (same pattern as Initial Setup)
    const companyVisaServiceDescriptions = generateCompanyVisaServiceDescriptions(watchedData, visaCosts, authorityConfig);
    const numberedCompanyVisaServices = generateNumberedVisaServices(companyVisaServiceDescriptions);
    
    return numberedCompanyVisaServices.map((service) => (
      <CostDisplayTableRow
        key={service.id}
        description={formatVisaServiceDescription(service)}
        aedAmount={service.amount}
        exchangeRate={exchangeRate}
        isReduction={service.isReduction}
      />
    ));
  };

  const renderYearlyRunningCosts = (yearlyRunning: YearlyRunningCosts) => {
    // Use shared service description logic with numbering
    const yearlyRunningServiceDescriptions = generateYearlyRunningServiceDescriptions(watchedData, yearlyRunning, authorityConfig);
    const numberedYearlyRunningServices = generateNumberedYearlyRunningServices(yearlyRunningServiceDescriptions);
    
    return numberedYearlyRunningServices.map((service) => (
      <CostDisplayTableRow
        key={service.id}
        description={formatYearlyRunningServiceDescription(service)}
        aedAmount={service.amount}
        exchangeRate={exchangeRate}
      />
    ));
  };

  const renderDeposits = () => {
    // IFZA deposits logic
    const ifzaDepositAmount = watchedData.ifzaLicense?.depositAmount || 0;
    const isIfzaDepositEnabled = watchedData.ifzaLicense?.depositWithLandlord;
    
    // DET deposits logic
    const detRentType = watchedData.detLicense?.rentType;
    const detRentAmount = watchedData.detLicense?.officeRentAmount || 0;
    const detLandlordDeposit = (detRentType && detRentType !== 'business-center') ? detRentAmount * 0.05 : 0;
    const detDewaDeposit = detRentType === 'office' ? 2000 : (detRentType === 'warehouse' ? 4000 : 0);
    const detTotalDeposits = detLandlordDeposit + detDewaDeposit;
    
    // Check if we should show deposits section
    const shouldShowIfzaDeposits = isIfzaDepositEnabled && ifzaDepositAmount > 0;
    const shouldShowDetDeposits = authorityConfig?.id === 'det' && detTotalDeposits > 0;
    
    if (!shouldShowIfzaDeposits && !shouldShowDetDeposits) return null;

    const depositsElements = [];
    
    // IFZA deposits
    if (shouldShowIfzaDeposits) {
      depositsElements.push(
        <CostDisplayTableRow
          key="ifza-deposit"
          description="Deposit with Landlord"
          aedAmount={ifzaDepositAmount}
          exchangeRate={exchangeRate}
        />
      );
    }
    
    // DET deposits
    if (shouldShowDetDeposits) {
      if (detLandlordDeposit > 0) {
        depositsElements.push(
          <CostDisplayTableRow
            key="det-landlord-deposit"
            description="Landlord Deposit (5% of rent)"
            aedAmount={detLandlordDeposit}
            exchangeRate={exchangeRate}
          />
        );
      }
      if (detDewaDeposit > 0) {
        depositsElements.push(
          <CostDisplayTableRow
            key="det-dewa-deposit"
            description="DEWA Deposit"
            aedAmount={detDewaDeposit}
            exchangeRate={exchangeRate}
          />
        );
      }
    }

    return (
      <CostBreakdownCard
        title="Deposits"
        currency={currency}
        variant="blue"
        className="mt-6"
      >
        {depositsElements}
      </CostBreakdownCard>
    );
  };

  const getCostTotal = () => {
    if ('total' in costs) {
      return costs.total;
    }
    return 0;
  };

  const getTotalWithDeposits = () => {
    let total = getCostTotal();
    if (includeDeposits) {
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
  };

  const shouldShowDepositsIncludedTotal = includeDeposits && (
    (watchedData.ifzaLicense?.depositWithLandlord && (watchedData.ifzaLicense?.depositAmount || 0) > 0) ||
    (authorityConfig?.id === 'det' && watchedData.detLicense?.rentType && watchedData.detLicense?.rentType !== 'business-center')
  );

  const getGradientClasses = (isDark = false) => {
    if (title.includes('Yearly Running')) {
      return isDark ? 'from-[#e6cc00] to-[#d4aa00]' : 'from-[#fff017] to-[#ffeb3b]';
    }
    return isDark 
      ? gradientColors.replace('from-green-100', 'from-green-600').replace('to-emerald-100', 'to-emerald-600').replace('from-blue-100', 'from-blue-600').replace('to-indigo-100', 'to-indigo-600').replace('from-yellow-100', 'from-yellow-600').replace('to-amber-100', 'to-amber-600')
      : gradientColors;
  };

  return (
    <div className={`${gradientColors} rounded-2xl p-8 border shadow-md`}>
      <div className="flex items-center mb-6">
        <div className={`${iconColor} p-3 rounded-xl mr-4`}>
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600">
            {title.includes('After') ? 
              `These will be the running costs after your ${watchedData.ifzaLicense?.licenseYears || 1}-year license period ends. All costs shown are per annum.` :
              'Detailed cost breakdown'
            }
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cost Breakdown */}
        <CostBreakdownCard
          title="Cost Breakdown"
          currency={currency}
          variant="default"
        >
          {/* Cost Items */}
          {'baseLicense' in costs && renderInitialSetupCosts(costs as InitialSetupCosts)}
          {'governmentFees' in costs && renderVisaCosts(costs as VisaCostBreakdown)}
          {'baseLicenseRenewal' in costs && renderYearlyRunningCosts(costs as YearlyRunningCosts)}
        </CostBreakdownCard>

        {/* Total Cost (Primary Gradient Section) */}
        <CostSummaryCard
          title={`TOTAL ${title.toUpperCase()}${shouldShowDepositsIncludedTotal ? ' (WITHOUT DEPOSITS)' : ''}`}
          currency={currency}
          gradient={`${getGradientClasses(true)}`}
          textColor={title.includes('Yearly Running') ? 'text-gray-900' : 'text-white'}
          exchangeRate={exchangeRate}
        >
          <TableRow className={`border-b ${title.includes('Yearly Running') ? 'border-gray-800 border-opacity-30' : 'border-white border-opacity-20'}`}>
            <TableCell className={`text-sm ${title.includes('Yearly Running') ? 'text-gray-900 opacity-80' : 'text-white opacity-90'}`}>
              Description
            </TableCell>
            <TableCell className={`text-right text-sm ${title.includes('Yearly Running') ? 'text-gray-900 opacity-80' : 'text-white opacity-90'} w-[120px]`}>
              AED
            </TableCell>
            <TableCell className={`text-right text-sm ${title.includes('Yearly Running') ? 'text-gray-900 opacity-80' : 'text-white opacity-90'} w-[120px]`}>
              {currency}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className={title.includes('Yearly Running') ? 'text-gray-900' : 'text-white'}>
              <p className="text-lg font-medium">TOTAL</p>
            </TableCell>
            <TableCell className={`text-right ${title.includes('Yearly Running') ? 'text-gray-900' : 'text-white'} w-[120px]`}>
              <p className="text-2xl font-bold">
                {formatCurrency(getCostTotal())}
              </p>
            </TableCell>
            <TableCell className={`text-right ${title.includes('Yearly Running') ? 'text-gray-900 opacity-80' : 'text-white opacity-90'} w-[120px]`}>
              <p className="text-2xl font-medium">
                {formatCurrency(getCostTotal() / exchangeRate)}
              </p>
            </TableCell>
          </TableRow>
        </CostSummaryCard>

        {/* Family Visa Breakdown and Total Section */}
        {'governmentFees' in costs && (
          <FamilyVisaTotalSection
            visaCosts={costs as VisaCostBreakdown}
            watchedData={watchedData}
            exchangeRate={exchangeRate}
            currency={currency}
            mainVisaTotal={getCostTotal()}
            authorityConfig={authorityConfig}
          />
        )}

        {/* Deposits (only for initial setup) */}
        {includeDeposits && renderDeposits()}

        {/* Total Cost INCLUDING DEPOSITS (Final Total) */}
        {shouldShowDepositsIncludedTotal && (
          <CostSummaryCard
            title={`TOTAL ${title.toUpperCase()} (INCLUDING DEPOSITS)`}
            currency={currency}
            gradient={getGradientClasses(true)}
            textColor="text-white"
            exchangeRate={exchangeRate}
          >
            <TableRow className="border-b border-white border-opacity-20">
              <TableCell className="text-white opacity-90 text-sm">Description</TableCell>
              <TableCell className="text-right text-white opacity-90 text-sm w-[120px]">AED</TableCell>
              <TableCell className="text-right text-white opacity-90 text-sm w-[120px]">{currency}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-white">
                <p className="text-lg font-medium">TOTAL</p>
              </TableCell>
              <TableCell className="text-right text-white w-[120px]">
                <p className="text-2xl font-bold">
                  {formatCurrency(getTotalWithDeposits())}
                </p>
              </TableCell>
              <TableCell className="text-right text-white w-[120px]">
                <p className="text-2xl font-medium opacity-90">
                  {formatCurrency(getTotalWithDeposits() / exchangeRate)}
                </p>
              </TableCell>
            </TableRow>
          </CostSummaryCard>
        )}
      </div>
    </div>
  );
}; 