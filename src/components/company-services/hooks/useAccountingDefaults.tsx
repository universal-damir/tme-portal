'use client';

import { useEffect, useRef } from 'react';
import { CompanyServicesData } from '@/types/company-services';
import { DEFAULT_FEES, getPricingForTier } from '../utils/accountingPricingConfig';
import { UseFormSetValue } from 'react-hook-form';

export const useAccountingDefaults = (
  watchedData: CompanyServicesData,
  setValue: UseFormSetValue<CompanyServicesData>
) => {
  // Track previous service type to detect actual changes vs initial loads
  const prevServiceTypeRef = useRef<string | undefined>();
  const isInitialLoad = useRef(true);
  
  // Reset accounting fields when main checkbox is unchecked
  useEffect(() => {
    if (!watchedData.accountingServices?.enabled) {
      setValue('accountingServices.serviceType', '');
      setValue('accountingServices.transactionTier', 0);
      setValue('accountingServices.monthlyPrice', 0);
      setValue('accountingServices.quarterlyPrice', 0);
      setValue('accountingServices.yearlyPrice', 0);
      setValue('accountingServices.vatBooking', false);
      setValue('accountingServices.costCenterBooking', false);
      setValue('accountingServices.monthlyGroupReporting', false);
      setValue('accountingServices.plStatementEnabled', false);
      setValue('accountingServices.plStatementFee', 0);
      setValue('accountingServices.auditReportEnabled', false);
      setValue('accountingServices.auditReportFee', 0);
      setValue('accountingServices.localAuditorFee', false);
      setValue('accountingServices.commercialServices', false);
      setValue('accountingServices.commercialServicesFee', 0);
      setValue('accountingServices.payrollServices', false);
      setValue('accountingServices.payrollSetupFee', 0);
      setValue('accountingServices.payrollServicesEnabled', false);
      setValue('accountingServices.payrollServicesPerPersonFee', 0);
      setValue('accountingServices.bankAccountOpening', false);
      setValue('accountingServices.personalUAEBank', false);
      setValue('accountingServices.personalUAEBankFee', 0);
      setValue('accountingServices.digitalBankWIO', false);
      setValue('accountingServices.digitalBankWIOFee', 0);
      setValue('accountingServices.traditionalUAEBank', false);
      setValue('accountingServices.traditionalUAEBankFee', 0);
    }
  }, [watchedData.accountingServices?.enabled, setValue]);

  // Reset transaction tier ONLY when service type actually changes (not on data restoration)
  useEffect(() => {
    const currentServiceType = watchedData.accountingServices?.serviceType;
    
    // Skip on initial load or when service type hasn't actually changed
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      prevServiceTypeRef.current = currentServiceType;
      return;
    }
    
    // Only reset if service type actually changed
    if (
      currentServiceType && 
      prevServiceTypeRef.current !== currentServiceType
    ) {
      setValue('accountingServices.transactionTier', 0);
      setValue('accountingServices.monthlyPrice', 0);
      setValue('accountingServices.quarterlyPrice', 0);
      setValue('accountingServices.yearlyPrice', 0);
    }
    
    prevServiceTypeRef.current = currentServiceType;
  }, [watchedData.accountingServices?.serviceType, setValue]);

  // Update pricing when transaction tier changes
  useEffect(() => {
    const tier = watchedData.accountingServices?.transactionTier;
    const serviceType = watchedData.accountingServices?.serviceType;
    
    if (tier && serviceType) {
      const pricing = getPricingForTier(serviceType, tier);
      
      if (serviceType === 'monthly' && typeof pricing === 'number') {
        setValue('accountingServices.monthlyPrice', pricing);
        setValue('accountingServices.quarterlyPrice', 0);
        setValue('accountingServices.yearlyPrice', 0);
      } else if (serviceType === 'quarterly-yearly' && typeof pricing === 'object' && pricing !== null) {
        setValue('accountingServices.monthlyPrice', pricing.monthly);
        setValue('accountingServices.quarterlyPrice', pricing.quarterly);
        setValue('accountingServices.yearlyPrice', pricing.yearly);
      }
    }
  }, [watchedData.accountingServices?.transactionTier, watchedData.accountingServices?.serviceType, setValue]);

  // Set default values for P/L statement and audit report fees when checkboxes are checked
  useEffect(() => {
    if (watchedData.accountingServices?.enabled) {
      if (watchedData.accountingServices?.plStatementEnabled && !watchedData.accountingServices?.plStatementFee) {
        setValue('accountingServices.plStatementFee', DEFAULT_FEES.plStatement);
      }
      if (watchedData.accountingServices?.auditReportEnabled && !watchedData.accountingServices?.auditReportFee) {
        setValue('accountingServices.auditReportFee', DEFAULT_FEES.auditReport);
      }
    }
  }, [
    watchedData.accountingServices?.enabled, 
    watchedData.accountingServices?.plStatementEnabled,
    watchedData.accountingServices?.auditReportEnabled,
    setValue
  ]);
  
  // Clear fees when checkboxes are unchecked
  useEffect(() => {
    if (!watchedData.accountingServices?.plStatementEnabled) {
      setValue('accountingServices.plStatementFee', 0);
    }
    if (!watchedData.accountingServices?.auditReportEnabled) {
      setValue('accountingServices.auditReportFee', 0);
    }
  }, [
    watchedData.accountingServices?.plStatementEnabled,
    watchedData.accountingServices?.auditReportEnabled,
    setValue
  ]);

  // Set default values for commercial services and clear when unchecked
  useEffect(() => {
    if (watchedData.accountingServices?.commercialServices) {
      if (!watchedData.accountingServices?.commercialServicesFee) {
        setValue('accountingServices.commercialServicesFee', DEFAULT_FEES.commercialServices);
      }
    } else {
      // Clear commercial services fee when unchecked
      setValue('accountingServices.commercialServicesFee', 0);
    }
  }, [watchedData.accountingServices?.commercialServices, setValue]);

  // Set default values for bank account services and clear when parent unchecked
  useEffect(() => {
    if (!watchedData.accountingServices?.bankAccountOpening) {
      // Clear all bank account sub-options when parent is unchecked
      setValue('accountingServices.personalUAEBank', false);
      setValue('accountingServices.personalUAEBankFee', 0);
      setValue('accountingServices.digitalBankWIO', false);
      setValue('accountingServices.digitalBankWIOFee', 0);
      setValue('accountingServices.traditionalUAEBank', false);
      setValue('accountingServices.traditionalUAEBankFee', 0);
    }
  }, [watchedData.accountingServices?.bankAccountOpening, setValue]);
  
  useEffect(() => {
    if (watchedData.accountingServices?.personalUAEBank && !watchedData.accountingServices?.personalUAEBankFee) {
      setValue('accountingServices.personalUAEBankFee', DEFAULT_FEES.personalUAEBank);
    } else if (!watchedData.accountingServices?.personalUAEBank) {
      setValue('accountingServices.personalUAEBankFee', 0);
    }
  }, [watchedData.accountingServices?.personalUAEBank, setValue]);

  useEffect(() => {
    if (watchedData.accountingServices?.digitalBankWIO && !watchedData.accountingServices?.digitalBankWIOFee) {
      setValue('accountingServices.digitalBankWIOFee', DEFAULT_FEES.digitalBankWIO);
    } else if (!watchedData.accountingServices?.digitalBankWIO) {
      setValue('accountingServices.digitalBankWIOFee', 0);
    }
  }, [watchedData.accountingServices?.digitalBankWIO, setValue]);

  useEffect(() => {
    if (watchedData.accountingServices?.traditionalUAEBank && !watchedData.accountingServices?.traditionalUAEBankFee) {
      setValue('accountingServices.traditionalUAEBankFee', DEFAULT_FEES.traditionalUAEBank);
    } else if (!watchedData.accountingServices?.traditionalUAEBank) {
      setValue('accountingServices.traditionalUAEBankFee', 0);
    }
  }, [watchedData.accountingServices?.traditionalUAEBank, setValue]);

  // Set default values for payroll services and clear when unchecked
  useEffect(() => {
    if (watchedData.accountingServices?.payrollServices) {
      if (!watchedData.accountingServices?.payrollSetupFee) {
        setValue('accountingServices.payrollSetupFee', DEFAULT_FEES.payrollSetup);
      }
    } else {
      // Clear payroll fields when payroll services are unchecked
      setValue('accountingServices.payrollSetupFee', 0);
      setValue('accountingServices.payrollServicesEnabled', false);
      setValue('accountingServices.payrollServicesPerPersonFee', 0);
    }
  }, [watchedData.accountingServices?.payrollServices, setValue]);
  
  useEffect(() => {
    if (watchedData.accountingServices?.payrollServicesEnabled && !watchedData.accountingServices?.payrollServicesPerPersonFee) {
      setValue('accountingServices.payrollServicesPerPersonFee', DEFAULT_FEES.payrollPerPerson);
    } else if (!watchedData.accountingServices?.payrollServicesEnabled) {
      setValue('accountingServices.payrollServicesPerPersonFee', 0);
    }
  }, [watchedData.accountingServices?.payrollServicesEnabled, setValue]);
}; 