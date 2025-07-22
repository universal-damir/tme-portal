import React from 'react';
import { VisaCostBreakdown, AuthorityConfig } from '@/lib/business';
import { CostBreakdownCard, CostSummaryCard } from '../../ui';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { SpouseVisaBreakdown } from './SpouseVisaBreakdown';
import { ChildVisaBreakdown } from './ChildVisaBreakdown';
import { IndividualChildVisaBreakdown } from './IndividualChildVisaBreakdown';
import { OfferData } from '@/types/offer';

interface FamilyVisaTotalSectionProps {
  visaCosts: VisaCostBreakdown;
  watchedData: OfferData;
  exchangeRate: number;
  currency: string;
  mainVisaTotal: number;
  authorityConfig: AuthorityConfig | null;
}

export const FamilyVisaTotalSection: React.FC<FamilyVisaTotalSectionProps> = ({
  visaCosts,
  watchedData,
  exchangeRate,
  currency,
  mainVisaTotal,
  authorityConfig
}) => {
  const hasSpouseVisa = visaCosts.spouseVisaTotal > 0;
  const hasChildVisa = visaCosts.childVisaTotal > 0;
  const familyVisaTotal = visaCosts.spouseVisaTotal + visaCosts.childVisaTotal;
  const grandTotal = mainVisaTotal + familyVisaTotal;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const numberOfChildVisas = watchedData.visaCosts?.numberOfChildVisas || 0;
  const childText = numberOfChildVisas > 1 ? 'Children' : 'Child';

  if (!hasSpouseVisa && !hasChildVisa) return null;

  return (
    <div className="space-y-6">
      {/* Individual breakdowns */}
      <SpouseVisaBreakdown
        visaCosts={visaCosts}
        watchedData={watchedData}
        exchangeRate={exchangeRate}
        currency={currency}
        authorityConfig={authorityConfig}
      />

      <ChildVisaBreakdown
        visaCosts={visaCosts}
        watchedData={watchedData}
        exchangeRate={exchangeRate}
        currency={currency}
        authorityConfig={authorityConfig}
      />

      <IndividualChildVisaBreakdown
        visaCosts={visaCosts}
        watchedData={watchedData}
        exchangeRate={exchangeRate}
        currency={currency}
        authorityConfig={authorityConfig}
      />

      {/* Total All Family Visas */}
      {(hasSpouseVisa || hasChildVisa) && (
        <CostBreakdownCard
          title={
            hasSpouseVisa && hasChildVisa 
              ? `Total Family Visa Cost (Spouse + ${childText})`
              : hasSpouseVisa 
                ? "Total Spouse Visa Cost"
                : `Total ${childText} Visa Cost`
          }
          currency={currency}
          variant="sky"
          showTableHeader={false}
        >
          <TableRow className="font-bold text-sky-900 text-lg">
            <TableCell>TOTAL</TableCell>
            <TableCell className="text-right w-[120px]">
              {formatCurrency(familyVisaTotal)}
            </TableCell>
            <TableCell className="text-right w-[120px]">
              {formatCurrency(familyVisaTotal / exchangeRate)}
            </TableCell>
          </TableRow>
        </CostBreakdownCard>
      )}

      {/* Grand Total (Main + Family Visas) */}
      {familyVisaTotal > 0 && (
        <CostSummaryCard
          title={(() => {
            if (hasSpouseVisa && hasChildVisa) {
              return `TOTAL VISA COST FOR ALL (EMPLOYMENT + SPOUSE + ${childText.toUpperCase()})`;
            } else if (hasSpouseVisa) {
              return "TOTAL VISA COST FOR ALL (EMPLOYMENT + SPOUSE)";
            } else if (hasChildVisa) {
              return `TOTAL VISA COST FOR ALL (EMPLOYMENT + ${childText.toUpperCase()})`;
            } else {
              return "TOTAL EMPLOYMENT VISA COST";
            }
          })()}
          currency={currency}
          gradient="from-blue-600 to-indigo-600"
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
                {formatCurrency(grandTotal)}
              </p>
            </TableCell>
            <TableCell className="text-right text-white w-[120px]">
              <p className="text-2xl font-medium opacity-90">
                {formatCurrency(grandTotal / exchangeRate)}
              </p>
            </TableCell>
          </TableRow>
        </CostSummaryCard>
      )}
    </div>
  );
}; 