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
import { formatServiceDescription, generateListItemKey, getVisaText } from '../../utils/textHelpers';

interface ChildVisaBreakdownProps {
  visaCosts: VisaCostBreakdown;
  watchedData: OfferData;
  exchangeRate: number;
  currency: string;
  authorityConfig?: AuthorityConfig | null;
}

export const ChildVisaBreakdown: React.FC<ChildVisaBreakdownProps> = ({
  visaCosts,
  watchedData,
  exchangeRate,
  currency,
  authorityConfig
}) => {
  const hasChildVisa = visaCosts.childVisaTotal > 0;
  
  if (!hasChildVisa) return null;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Define child visa services in order with conditions
  const numberOfChildVisas = watchedData.visaCosts?.numberOfChildVisas || 0;
  const childVisaStatusChange = watchedData.visaCosts?.childVisaStatusChange || 0;
  const childVisaVipStamping = watchedData.visaCosts?.childVisaVipStamping || 0;
  
  const childServices = [
    {
      condition: visaCosts.childVisaStandardFees > 0,
      description: 'Standard authority costs',
      amount: visaCosts.childVisaStandardFees
    },
    {
      condition: visaCosts.childVisaStatusChangeFees > 0,
      description: 'Visa status change authority costs',
      amount: visaCosts.childVisaStatusChangeFees
    },
    {
      condition: visaCosts.childVisaVipStampingFees > 0,
      description: 'VIP visa stamping service',
      amount: visaCosts.childVisaVipStampingFees
    },
    {
      condition: visaCosts.childVisaTmeServicesFees > 0,
      description: 'TME Services professional fee',
      amount: visaCosts.childVisaTmeServicesFees
    }
  ];

  // Filter active services and add numbering
  const activeChildServices = childServices.filter(service => service.condition);
  let serviceNumber = 1;
  
  const serviceElements = activeChildServices.map((service, index) => {
    const numberedDescription = formatServiceDescription(serviceNumber++, service.description);
    const key = generateListItemKey('child-service', index, service.description);
    
    return (
      <CostDisplayTableRow
        key={key}
        description={numberedDescription}
        aedAmount={service.amount}
        exchangeRate={exchangeRate}
      />
    );
  });

  // Handle health insurance separately due to breakdown by type
  if (visaCosts.childVisaHealthInsurance > 0) {
    const insuranceBreakdown: { [key: string]: { count: number; cost: number } } = {};
    
    watchedData.visaCosts?.childVisaDetails?.forEach((visaDetail) => {
      if (visaDetail?.healthInsurance && visaDetail.healthInsurance !== 'No Insurance' && visaDetail.healthInsurance !== '') {
        const type = visaDetail.healthInsurance;
        const costPerVisa = type === 'Low Cost' ? 1000 : 6000;
        
        if (!insuranceBreakdown[type]) {
          insuranceBreakdown[type] = { count: 0, cost: costPerVisa };
        }
        insuranceBreakdown[type].count++;
      }
    });
    
    Object.entries(insuranceBreakdown).forEach(([type, data]) => {
      const numberedDescription = formatServiceDescription(serviceNumber++, `Health insurance (${type.toLowerCase()})`);
      serviceElements.push(
        <CostDisplayTableRow
          key={`child-health-insurance-${type}`}
          description={numberedDescription}
          aedAmount={data.count * data.cost}
          exchangeRate={exchangeRate}
        />
      );
    });
  }

  return (
    <div className="space-y-4">
      <CostBreakdownCard
        title="Child Visa Breakdown"
        currency={currency}
        variant="purple"
        className="space-y-3"
      >
        {/* Child Visa Costs */}
        {serviceElements}
      </CostBreakdownCard>
      
      {/* Child Visa Total - Outside the table structure */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <Table>
          <TableBody>
            <TableRow className="font-semibold text-purple-900">
              <TableCell>Total Child Visa Cost</TableCell>
              <TableCell className="text-right text-lg w-[120px]">
                {formatCurrency(visaCosts.childVisaTotal)}
              </TableCell>
              <TableCell className="text-right text-lg w-[120px]">
                {formatCurrency(visaCosts.childVisaTotal / exchangeRate)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 