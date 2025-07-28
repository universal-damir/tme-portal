import React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg p-6 border border-gray-200"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center mb-4"
      >
        <div className="p-2 rounded-lg mr-3" style={{ backgroundColor: '#243F7B' }}>
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#243F7B' }}>Additional Services</h2>
          <p className="text-sm text-gray-600">Optional services and fees</p>
        </div>
      </motion.div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <CostInputField
                label="Company Stamp (Two stamps)"
                value={formattedInputs.companyStampFormatted}
                onChange={handlers.handleCompanyStampChange}
                placeholder="646.00"
                description=""
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <CostInputField
                label="Emirates Post P.O. Box Registration"
                value={formattedInputs.emiratesPostFormatted}
                onChange={handlers.handleEmiratesPostChange}
                placeholder="1,500.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <CostInputField
                label="Accounting (Yearly)"
                value={formattedInputs.accountingFeeFormatted}
                onChange={handlers.handleAccountingFeeChange}
                placeholder="6,293.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <CostInputField
                label="CIT Registration"
                value={formattedInputs.citRegistrationFormatted}
                onChange={handlers.handleCitRegistrationChange}
                placeholder="3,070.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <CostInputField
                label="CIT Return Filing (Yearly)"
                value={formattedInputs.citReturnFilingFormatted}
                onChange={handlers.handleCitReturnFilingChange}
                placeholder="5,458.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <CostInputField
                label="VAT Registration/Exception"
                value={formattedInputs.vatRegistrationFormatted}
                onChange={handlers.handleVatRegistrationChange}
                placeholder="3,810.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <CostInputField
                label="Digital Bank WIO Account"
                value={formattedInputs.digitalBankFormatted}
                onChange={handlers.handleDigitalBankChange}
                placeholder="3,150.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              <CostInputField
                label="Traditional UAE Bank Account"
                value={formattedInputs.traditionalBankFormatted}
                onChange={handlers.handleTraditionalBankChange}
                placeholder="7,350.00"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <CostInputField
                label="Personal Bank Account"
                value={formattedInputs.personalBankFormatted}
                onChange={handlers.handlePersonalBankChange}
                placeholder="3,150.00"
              />
            </motion.div>


          </div>
        </div>
      </div>
    </motion.div>
  );
}; 