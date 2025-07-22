import React from 'react';
import { OfferData } from '@/types/offer';
import { AuthorityConfig } from '@/lib/business';
import { CostDisplayTableRow, CostBreakdownCard } from '../../ui';

interface DepositsSectionProps {
  watchedData: OfferData;
  authorityConfig: AuthorityConfig | null;
  exchangeRate: number;
  currency: string;
}

export const DepositsSection: React.FC<DepositsSectionProps> = ({
  watchedData,
  authorityConfig,
  exchangeRate,
  currency
}) => {
  const { ifzaLicense, detLicense } = watchedData;
  
  // IFZA deposits logic
  const shouldShowIfzaDeposits = 
    authorityConfig?.id === 'ifza' && 
    ifzaLicense?.depositWithLandlord && 
    (ifzaLicense?.depositAmount || 0) > 0;
    
  const ifzaDepositAmount = ifzaLicense?.depositAmount || 0;

  // DET deposits logic
  const detRentAmount = detLicense?.officeRentAmount || 0;
  const detRentType = detLicense?.rentType;
  const detLandlordDeposit = (detRentType && detRentType !== 'business-center') ? detRentAmount * 0.05 : 0;
  const detDewaDeposit = detRentType === 'office' ? 2000 : (detRentType === 'warehouse' ? 4000 : 0);
  
  const shouldShowDetDeposits = 
    authorityConfig?.id === 'det' && 
    detRentType && 
    detRentType !== 'business-center' &&
    (detLandlordDeposit > 0 || detDewaDeposit > 0);

  // Show section only if there are deposits to display
  if (!shouldShowIfzaDeposits && !shouldShowDetDeposits) {
    return null;
  }

  return (
    <CostBreakdownCard
      title="Deposits"
      currency={currency}
      variant="blue"
      className="space-y-3"
    >
      {/* IFZA deposits */}
      {shouldShowIfzaDeposits && (
        <CostDisplayTableRow
          description="Deposit with Landlord"
          aedAmount={ifzaDepositAmount}
          exchangeRate={exchangeRate}
        />
      )}
      
      {/* DET deposits */}
      {shouldShowDetDeposits && (
        <>
          {detLandlordDeposit > 0 && (
            <CostDisplayTableRow
              description="Landlord Deposit (5% of rent)"
              aedAmount={detLandlordDeposit}
              exchangeRate={exchangeRate}
            />
          )}
          {detDewaDeposit > 0 && (
            <CostDisplayTableRow
              description="DEWA Deposit"
              aedAmount={detDewaDeposit}
              exchangeRate={exchangeRate}
            />
          )}
        </>
      )}
    </CostBreakdownCard>
  );
}; 