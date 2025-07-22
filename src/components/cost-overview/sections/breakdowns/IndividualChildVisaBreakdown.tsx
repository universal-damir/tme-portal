import React from 'react';
import { OfferData } from '@/types/offer';
import { VisaCostBreakdown, AuthorityConfig } from '@/lib/business';
import { CostDisplayTableRow } from '../../ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatServiceDescription, generateListItemKey, getVisaText } from '../../utils/textHelpers';
import { calculateIndividualChildVisaCosts } from '@/lib/pdf-generator/utils';

interface IndividualChildVisaBreakdownProps {
  visaCosts: VisaCostBreakdown;
  watchedData: OfferData;
  exchangeRate: number;
  currency: string;
  authorityConfig: AuthorityConfig | null;
}

export const IndividualChildVisaBreakdown: React.FC<IndividualChildVisaBreakdownProps> = ({
  visaCosts,
  watchedData,
  exchangeRate,
  currency,
  authorityConfig
}) => {
  const hasChildVisa = visaCosts.childVisaTotal > 0;
  const numberOfChildVisas = watchedData.visaCosts?.numberOfChildVisas || 0;
  
  if (!hasChildVisa || numberOfChildVisas <= 1) return null;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const individualChildVisas = calculateIndividualChildVisaCosts(watchedData, authorityConfig);
  
  if (!individualChildVisas || individualChildVisas.length === 0) return null;

  return (
    <div className="bg-sky-50 rounded-xl p-6 shadow-md border border-sky-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Individual Child Visa Breakdown</h4>
      
      <div className="space-y-6">
        {individualChildVisas.map((childVisa: any, index: number) => (
          <div key={`child-${childVisa.childNumber}`} className="bg-white rounded-lg p-4 border border-sky-200">
            <h5 className="text-md font-semibold text-sky-900 mb-3">Child {childVisa.childNumber} Visa</h5>
            
            {/* Table for individual child visa costs */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left font-semibold text-xs text-gray-600">
                    Description
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs text-gray-600 w-[120px]">
                    AED
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs text-gray-600 w-[120px]">
                    {currency}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let serviceNumber = 1;
                  const serviceElements = [];
                  
                  // Standard Authority Fees
                  serviceElements.push(
                    <CostDisplayTableRow
                      key="standard-fee"
                      description={formatServiceDescription(serviceNumber++, 'Standard Authority Fees for Child Visa and Emirates ID Application')}
                      aedAmount={childVisa.standardFee}
                      exchangeRate={exchangeRate}
                      className="text-sm"
                    />
                  );
                  
                  // Status Change (if applicable)
                  if (childVisa.statusChangeFee > 0) {
                    serviceElements.push(
                      <CostDisplayTableRow
                        key="status-change"
                        description={formatServiceDescription(serviceNumber++, 'Authority Cost for Child Visa Status Change')}
                        aedAmount={childVisa.statusChangeFee}
                        exchangeRate={exchangeRate}
                        className="text-sm"
                      />
                    );
                  }
                  
                  // Health Insurance (if applicable)
                  if (childVisa.healthInsuranceFee > 0) {
                    const insuranceType = childVisa.healthInsuranceType || 'Health Insurance';
                    serviceElements.push(
                      <CostDisplayTableRow
                        key="health-insurance"
                        description={formatServiceDescription(serviceNumber++, `Child Visa Health Insurance - ${insuranceType}`)}
                        aedAmount={childVisa.healthInsuranceFee}
                        exchangeRate={exchangeRate}
                        className="text-sm"
                      />
                    );
                  }
                  
                  // VIP Stamping (if applicable)
                  if (childVisa.vipStampingFee > 0) {
                    serviceElements.push(
                      <CostDisplayTableRow
                        key="vip-stamping"
                        description={formatServiceDescription(serviceNumber++, 'Child Visa VIP Stamping Service')}
                        aedAmount={childVisa.vipStampingFee}
                        exchangeRate={exchangeRate}
                        className="text-sm"
                      />
                    );
                  }
                  
                  // TME Services fee (always at the bottom)
                  serviceElements.push(
                    <CostDisplayTableRow
                      key="tme-service"
                      description={formatServiceDescription(serviceNumber++, 'TME Services Professional Fee for Child Visa and Emirates ID')}
                      aedAmount={childVisa.tmeServiceFee}
                      exchangeRate={exchangeRate}
                      className="text-sm"
                    />
                  );
                  
                  return serviceElements;
                })()}
              </TableBody>
            </Table>
            
            {/* Individual Child Visa Total */}
            <div className="border-t border-sky-300 pt-3 mt-3">
              <Table>
                <TableBody>
                  <TableRow className="font-semibold text-sky-900">
                    <TableCell>Child {childVisa.childNumber} Total</TableCell>
                    <TableCell className="text-right w-[120px]">
                      {formatCurrency(childVisa.total)}
                    </TableCell>
                    <TableCell className="text-right w-[120px]">
                      {formatCurrency(childVisa.total / exchangeRate)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
      
      {/* Grand Total for All Children */}
      <div className="bg-sky-100 rounded-lg p-4 mt-4 border border-sky-300">
        <Table>
          <TableBody>
            <TableRow className="font-bold text-sky-900 text-lg">
              <TableCell>Total for All {numberOfChildVisas} Children</TableCell>
              <TableCell className="text-right w-[120px]">
                {formatCurrency(visaCosts.childVisaTotal)}
              </TableCell>
              <TableCell className="text-right w-[120px]">
                {formatCurrency(visaCosts.childVisaTotal / exchangeRate)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 