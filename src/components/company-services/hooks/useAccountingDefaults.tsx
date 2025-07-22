'use client';

import { useEffect } from 'react';
import { CompanyServicesData } from '@/types/company-services';
import { DEFAULT_FEES, getPricingForTier } from '../utils/accountingPricingConfig';
import { UseFormSetValue } from 'react-hook-form';

export const useAccountingDefaults = (
  watchedData: CompanyServicesData,
  setValue: UseFormSetValue<CompanyServicesData>
) => {
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
      setValue('accountingServices.plStatementFee', 0);
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

  // Reset transaction tier when service type changes
  useEffect(() => {
    if (watchedData.accountingServices?.serviceType) {
      setValue('accountingServices.transactionTier', 0);
      setValue('accountingServices.monthlyPrice', 0);
      setValue('accountingServices.quarterlyPrice', 0);
      setValue('accountingServices.yearlyPrice', 0);
    }
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

  // Set default values for P/L statement and audit report fees
  useEffect(() => {
    if (watchedData.accountingServices?.enabled) {
      if (!watchedData.accountingServices?.plStatementFee) {
        setValue('accountingServices.plStatementFee', DEFAULT_FEES.plStatement);
      }
      if (!watchedData.accountingServices?.auditReportFee) {
        setValue('accountingServices.auditReportFee', DEFAULT_FEES.auditReport);
      }
    }
  }, [watchedData.accountingServices?.enabled, setValue]);

  // Set default values for commercial services
  useEffect(() => {
    if (watchedData.accountingServices?.commercialServices && !watchedData.accountingServices?.commercialServicesFee) {
      setValue('accountingServices.commercialServicesFee', DEFAULT_FEES.commercialServices);
    }
  }, [watchedData.accountingServices?.commercialServices, setValue]);

  // Set default values for bank account services
  useEffect(() => {
    if (watchedData.accountingServices?.personalUAEBank && !watchedData.accountingServices?.personalUAEBankFee) {
      setValue('accountingServices.personalUAEBankFee', DEFAULT_FEES.personalUAEBank);
    }
  }, [watchedData.accountingServices?.personalUAEBank, setValue]);

  useEffect(() => {
    if (watchedData.accountingServices?.digitalBankWIO && !watchedData.accountingServices?.digitalBankWIOFee) {
      setValue('accountingServices.digitalBankWIOFee', DEFAULT_FEES.digitalBankWIO);
    }
  }, [watchedData.accountingServices?.digitalBankWIO, setValue]);

  useEffect(() => {
    if (watchedData.accountingServices?.traditionalUAEBank && !watchedData.accountingServices?.traditionalUAEBankFee) {
      setValue('accountingServices.traditionalUAEBankFee', DEFAULT_FEES.traditionalUAEBank);
    }
  }, [watchedData.accountingServices?.traditionalUAEBank, setValue]);

  // Set default values for payroll services
  useEffect(() => {
    if (watchedData.accountingServices?.payrollServices && !watchedData.accountingServices?.payrollSetupFee) {
      setValue('accountingServices.payrollSetupFee', DEFAULT_FEES.payrollSetup);
    }
    if (watchedData.accountingServices?.payrollServicesEnabled && !watchedData.accountingServices?.payrollServicesPerPersonFee) {
      setValue('accountingServices.payrollServicesPerPersonFee', DEFAULT_FEES.payrollPerPerson);
    }
  }, [watchedData.accountingServices?.payrollServices, watchedData.accountingServices?.payrollServicesEnabled, setValue]);
}; 