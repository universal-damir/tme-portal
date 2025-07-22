import { useMemo, useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { getAuthorityConfigByName } from '@/lib/business';
import { OfferData } from '@/types/offer';


export const useAuthorityConfig = (
  authorityName: string | undefined, 
  setValue: UseFormSetValue<OfferData>
) => {
  // Get authority configuration
  const authorityConfig = useMemo(() => {
    if (!authorityName) return null;
    return getAuthorityConfigByName(authorityName);
  }, [authorityName]);

  // Auto-populate area and legal entity based on authority selection
  useEffect(() => {
    if (!authorityConfig) return;
    
    setValue('authorityInformation.areaInUAE', authorityConfig.areaInUAE);
    setValue('authorityInformation.legalEntity', authorityConfig.legalEntity);
  }, [authorityConfig, setValue]);

  return {
    authorityConfig,
    isAuthoritySelected: !!authorityConfig,
    authorityId: authorityConfig?.id,
    authorityFeatures: authorityConfig?.features,
  };
}; 