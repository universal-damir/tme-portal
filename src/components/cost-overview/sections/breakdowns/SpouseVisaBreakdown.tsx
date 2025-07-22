import React from 'react';
import { OfferData } from '@/types/offer';
import { VisaCostBreakdown, AuthorityConfig } from '@/lib/business';
import { CostDisplayTableRow, CostBreakdownCard } from '../../ui';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { formatServiceDescription, generateListItemKey } from '../../utils/textHelpers';

interface SpouseVisaBreakdownProps {
  visaCosts: VisaCostBreakdown;
  watchedData: OfferData;
  exchangeRate: number;
  currency: string;
  authorityConfig?: AuthorityConfig | null;
}

export const SpouseVisaBreakdown: React.FC<SpouseVisaBreakdownProps> = ({
  visaCosts,
  watchedData,
  exchangeRate,
  currency,
  authorityConfig
}) => {
  const hasSpouseVisa = visaCosts.spouseVisaTotal > 0;
  
  if (!hasSpouseVisa) return null;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <CostBreakdownCard
      title="Spouse Visa Breakdown"
      currency={currency}
      variant="pink"
      className="space-y-3"
    >
      {/* Spouse Visa Costs */}
      {(() => {
        // Define spouse visa services in order with conditions
        const spouseServices = [
          {
            condition: visaCosts.spouseVisaStandardFees > 0,
            description: 'Standard Authority Fees for Spouse Visa and Emirates ID Application',
            amount: visaCosts.spouseVisaStandardFees
          },
          {
            condition: visaCosts.spouseVisaStatusChangeFees > 0,
            description: 'Authority Cost for Spouse Visa Status Change',
            amount: visaCosts.spouseVisaStatusChangeFees
          },
          {
            condition: visaCosts.spouseVisaHealthInsurance > 0,
            description: (() => {
              const insuranceType = watchedData.visaCosts?.spouseVisaInsurance;
              return insuranceType ? `Spouse Visa Health Insurance - ${insuranceType}` : 'Spouse Visa Health Insurance';
            })(),
            amount: visaCosts.spouseVisaHealthInsurance
          },
          {
            condition: visaCosts.spouseVisaVipStampingFees > 0,
            description: 'Spouse Visa VIP Stamping Service',
            amount: visaCosts.spouseVisaVipStampingFees
          },
          {
            condition: visaCosts.spouseVisaTmeServicesFees > 0,
            description: 'TME Services Professional Fee for Spouse Visa and Emirates ID Application',
            amount: visaCosts.spouseVisaTmeServicesFees
          }
        ];

        // Filter active services and add numbering
        const activeSpouseServices = spouseServices.filter(service => service.condition);
        
        return activeSpouseServices.map((service, index) => {
          const numberedDescription = formatServiceDescription(index + 1, service.description);
          const key = generateListItemKey('spouse-service', index, service.description);
          
          return (
            <CostDisplayTableRow
              key={key}
              description={numberedDescription}
              aedAmount={service.amount}
              exchangeRate={exchangeRate}
            />
          );
        });
      })()}
      
      {/* Spouse Visa Total */}
      <div className="border-t border-pink-300 pt-4 mt-4">
        <Table>
          <TableBody>
            <TableRow className="font-semibold text-pink-900">
              <TableCell>Total Spouse Visa Cost</TableCell>
              <TableCell className="text-right text-lg w-[120px]">
                {formatCurrency(visaCosts.spouseVisaTotal)}
              </TableCell>
              <TableCell className="text-right text-lg w-[120px]">
                {formatCurrency(visaCosts.spouseVisaTotal / exchangeRate)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CostBreakdownCard>
  );
}; 