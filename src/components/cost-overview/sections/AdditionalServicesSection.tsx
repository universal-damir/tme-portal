import React from 'react';
import { Building2 } from 'lucide-react';
import { CostInputField } from '../ui/CostInputField';
import { FormattedInputState, FormattedInputHandlers } from '../hooks/useFormattedInputs';

interface AdditionalServicesSectionProps {
  formattedInputs: FormattedInputState;
  handlers: FormattedInputHandlers;
}

export const AdditionalServicesSection: React.FC<AdditionalServicesSectionProps> = ({
  formattedInputs,
  handlers
}) => {

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200">
      <div className="flex items-center mb-6">
        <div className="bg-orange-600 p-3 rounded-xl mr-4">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Additional Services</h2>
          <p className="text-gray-600">Optional services and fees</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <CostInputField
              label="One-time TME Services Professional Fee and cost for Company stamp preparation and production (Two stamps)"
              value={formattedInputs.companyStampFormatted}
              onChange={handlers.handleCompanyStampChange}
              placeholder="646.00"
              description=""
            />

            <CostInputField
              label="One-time TME Services Professional Fee for registration with Emirates Post P.O. Box"
              value={formattedInputs.emiratesPostFormatted}
              onChange={handlers.handleEmiratesPostChange}
              placeholder="1,500.00"
            />

            <CostInputField
              label="One-time TME Services Professional Fee for CIT (Corporate Income Tax Registration)"
              value={formattedInputs.citRegistrationFormatted}
              onChange={handlers.handleCitRegistrationChange}
              placeholder="3,070.00"
            />

            <CostInputField
              label="One-time TME Professional Service Fee for VAT (Value Added Tax) Registration or Exception"
              value={formattedInputs.vatRegistrationFormatted}
              onChange={handlers.handleVatRegistrationChange}
              placeholder="3,810.00"
            />

            <CostInputField
              label="One-time TME Services Professional Fee for application to open 1 personal bank accounts with a UAE bank"
              value={formattedInputs.personalBankFormatted}
              onChange={handlers.handlePersonalBankChange}
              placeholder="3,150.00"
            />

            <CostInputField
              label="One-time TME Services Professional Fee for application to open 1 company account with the digital bank WIO"
              value={formattedInputs.digitalBankFormatted}
              onChange={handlers.handleDigitalBankChange}
              placeholder="3,150.00"
            />

            <CostInputField
              label="One-time TME Services Professional fee for application to open 1 company account with a traditional UAE bank"
              value={formattedInputs.traditionalBankFormatted}
              onChange={handlers.handleTraditionalBankChange}
              placeholder="7,350.00"
            />

            <CostInputField
              label="Yearly Accounting fee based on 360 Transactions per Year"
              value={formattedInputs.accountingFeeFormatted}
              onChange={handlers.handleAccountingFeeChange}
              placeholder="6,293.00"
            />

            <CostInputField
              label="Yearly TME Services Professional Fee for CIT (Corporate Income Tax) Return Filing"
              value={formattedInputs.citReturnFilingFormatted}
              onChange={handlers.handleCitReturnFilingChange}
              placeholder="5,458.00"
            />


          </div>
        </div>
      </div>
    </div>
  );
}; 