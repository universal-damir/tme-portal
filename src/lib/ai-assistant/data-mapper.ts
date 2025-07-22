import { AIFormData } from '@/types/ai-assistant';
import { OfferData } from '@/types/offer';
import { UseFormSetValue } from 'react-hook-form';

/**
 * Maps AI assistant response data to the full OfferData structure
 */
export function mapAIResponseToFormData(aiFormData: AIFormData): Partial<OfferData> {
  const mappedData: Partial<OfferData> = {};

  // Map client details - only include fields that are actually provided by AI
  // Don't provide defaults that would override existing form data
  if (aiFormData.clientDetails) {
    const clientDetails: any = {};
    
    // Only set fields that the AI actually provided
    if (aiFormData.clientDetails.firstName !== undefined) {
      clientDetails.firstName = aiFormData.clientDetails.firstName;
    }
    if (aiFormData.clientDetails.lastName !== undefined) {
      clientDetails.lastName = aiFormData.clientDetails.lastName;
    }
    if (aiFormData.clientDetails.companyName !== undefined) {
      clientDetails.companyName = aiFormData.clientDetails.companyName;
    }
    if (aiFormData.clientDetails.companySetupType !== undefined) {
      clientDetails.companySetupType = aiFormData.clientDetails.companySetupType;
    }
    
    // Only add to mappedData if we have actual client data to update
    if (Object.keys(clientDetails).length > 0) {
      mappedData.clientDetails = clientDetails;
    }
  }

  // Map authority information
  if (aiFormData.authorityInformation) {
    const isIFZA = aiFormData.authorityInformation.responsibleAuthority?.includes('IFZA');
    const isDET = aiFormData.authorityInformation.responsibleAuthority?.includes('DET');
    
    const authorityData: any = {};
    
    // Only set fields that were provided or are required for calculations
    if (aiFormData.authorityInformation.responsibleAuthority !== undefined) {
      authorityData.responsibleAuthority = aiFormData.authorityInformation.responsibleAuthority;
      // Auto-set area and legal entity when authority is set
      authorityData.areaInUAE = isIFZA ? 'Dubai Digital Park (DDP) Building A2' : '';
      authorityData.legalEntity = isIFZA ? 'FZCO (LLC Structure)' : 
                                  isDET ? 'LLC (Limited Liability Company)' : '';
    }
    
    if (aiFormData.authorityInformation.legalEntity !== undefined) {
      authorityData.legalEntity = aiFormData.authorityInformation.legalEntity;
    }
    
    // Handle share capital fields
    const shareCapital = aiFormData.authorityInformation.shareCapitalAED || 50000;
    const valuePerShare = aiFormData.authorityInformation.valuePerShareAED || 1000;
    
    authorityData.shareCapitalAED = shareCapital;
    authorityData.valuePerShareAED = valuePerShare;
    authorityData.numberOfShares = Math.floor(shareCapital / valuePerShare);
    
    if (Object.keys(authorityData).length > 0) {
      mappedData.authorityInformation = authorityData;
    }
  }

  // Map IFZA license data
  if (aiFormData.ifzaLicense) {
    const ifzaData: any = {};
    
    // Only include fields that were actually provided by AI
    if (aiFormData.ifzaLicense.visaQuota !== undefined) {
      ifzaData.visaQuota = aiFormData.ifzaLicense.visaQuota;
    }
    if (aiFormData.ifzaLicense.licenseYears !== undefined) {
      ifzaData.licenseYears = aiFormData.ifzaLicense.licenseYears;
    }
    if (aiFormData.ifzaLicense.crossBorderLicense !== undefined) {
      ifzaData.crossBorderLicense = aiFormData.ifzaLicense.crossBorderLicense;
    }
    if (aiFormData.ifzaLicense.rentOfficeRequired !== undefined) {
      ifzaData.rentOfficeRequired = aiFormData.ifzaLicense.rentOfficeRequired;
    }
    if (aiFormData.ifzaLicense.officeRentAmount !== undefined) {
      ifzaData.officeRentAmount = aiFormData.ifzaLicense.officeRentAmount;
    }
    if (aiFormData.ifzaLicense.thirdPartyApproval !== undefined) {
      ifzaData.thirdPartyApproval = aiFormData.ifzaLicense.thirdPartyApproval;
    }
    if (aiFormData.ifzaLicense.thirdPartyApprovalAmount !== undefined) {
      ifzaData.thirdPartyApprovalAmount = aiFormData.ifzaLicense.thirdPartyApprovalAmount;
    }
    if (aiFormData.ifzaLicense.tmeServicesFee !== undefined) {
      ifzaData.tmeServicesFee = aiFormData.ifzaLicense.tmeServicesFee;
    }
    if (aiFormData.ifzaLicense.activitiesToBeConfirmed !== undefined) {
      ifzaData.activitiesToBeConfirmed = aiFormData.ifzaLicense.activitiesToBeConfirmed;
    }
    
    // Only add to mappedData if we have actual IFZA data to update
    if (Object.keys(ifzaData).length > 0) {
      mappedData.ifzaLicense = ifzaData;
    }
  }

  // Map DET license data
  if (aiFormData.detLicense) {
    const detData: any = {};
    
    // Only include fields that were actually provided by AI
    if (aiFormData.detLicense.licenseType !== undefined) {
      detData.licenseType = aiFormData.detLicense.licenseType;
    }
    if (aiFormData.detLicense.rentType !== undefined) {
      detData.rentType = aiFormData.detLicense.rentType;
    }
    if (aiFormData.detLicense.officeRentAmount !== undefined) {
      detData.officeRentAmount = aiFormData.detLicense.officeRentAmount;
    }
    if (aiFormData.detLicense.thirdPartyApproval !== undefined) {
      detData.thirdPartyApproval = aiFormData.detLicense.thirdPartyApproval;
    }
    if (aiFormData.detLicense.thirdPartyApprovalAmount !== undefined) {
      detData.thirdPartyApprovalAmount = aiFormData.detLicense.thirdPartyApprovalAmount;
    }
    if (aiFormData.detLicense.tmeServicesFee !== undefined) {
      detData.tmeServicesFee = aiFormData.detLicense.tmeServicesFee;
    }
    if (aiFormData.detLicense.activitiesToBeConfirmed !== undefined) {
      detData.activitiesToBeConfirmed = aiFormData.detLicense.activitiesToBeConfirmed;
    }
    
    // Only add to mappedData if we have actual DET data to update
    if (Object.keys(detData).length > 0) {
      mappedData.detLicense = detData;
    }
  }

  // Map visa costs
  if (aiFormData.visaCosts || aiFormData.ifzaLicense?.visaQuota) {
    const visaData: any = {};
    
    // Handle visa count (from visa costs or IFZA visa quota)
    if (aiFormData.visaCosts?.numberOfVisas !== undefined) {
      visaData.numberOfVisas = aiFormData.visaCosts.numberOfVisas;
    } else if (aiFormData.ifzaLicense?.visaQuota !== undefined) {
      visaData.numberOfVisas = aiFormData.ifzaLicense.visaQuota;
    }
    
    // Handle other visa fields only if explicitly provided
    if (aiFormData.visaCosts?.spouseVisa !== undefined) {
      visaData.spouseVisa = aiFormData.visaCosts.spouseVisa;
    }
    if (aiFormData.visaCosts?.childVisa !== undefined) {
      visaData.childVisa = aiFormData.visaCosts.childVisa;
    }
    if (aiFormData.visaCosts?.numberOfChildVisas !== undefined) {
      visaData.numberOfChildVisas = aiFormData.visaCosts.numberOfChildVisas;
    }
    if (aiFormData.visaCosts?.reducedVisaCost !== undefined) {
      visaData.reducedVisaCost = aiFormData.visaCosts.reducedVisaCost;
    }
    if (aiFormData.visaCosts?.vipStamping !== undefined) {
      visaData.vipStamping = aiFormData.visaCosts.vipStamping;
    }
    if (aiFormData.visaCosts?.vipStampingVisas !== undefined) {
      visaData.vipStampingVisas = aiFormData.visaCosts.vipStampingVisas;
    }
    if (aiFormData.visaCosts?.visaDetails !== undefined) {
      visaData.visaDetails = aiFormData.visaCosts.visaDetails;
    }
    
    // Only add to mappedData if we have actual visa data to update
    if (Object.keys(visaData).length > 0) {
      mappedData.visaCosts = visaData;
    }
  }
  
  // Also ensure IFZA visa quota matches visa costs
  if (aiFormData.ifzaLicense?.visaQuota && mappedData.ifzaLicense) {
    mappedData.ifzaLicense.visaQuota = aiFormData.ifzaLicense.visaQuota;
    // Make sure visaCosts numberOfVisas is also set
    if (!mappedData.visaCosts) {
      mappedData.visaCosts = {
        numberOfVisas: aiFormData.ifzaLicense.visaQuota,
        visaDetails: [],
        enableVisaStatusChange: false,
        visaStatusChange: 0,
        reducedVisaCost: 0,
        vipStamping: false,
        vipStampingVisas: 0,
        spouseVisa: false,
        childVisa: false,
        numberOfChildVisas: 0,
        childVisaDetails: [],
      };
    }
  }

  return mappedData;
}

/**
 * Applies mapped form data to React Hook Form using setValue
 */
export function applyToForm(
  formData: Partial<OfferData>, 
  setValue: UseFormSetValue<OfferData>
): void {
  console.log('Applying form data:', formData);
  
  // Apply client details
  if (formData.clientDetails) {
    Object.entries(formData.clientDetails).forEach(([key, value]) => {
      if (value !== undefined) {
        console.log(`Setting clientDetails.${key} =`, value);
        setValue(`clientDetails.${key as keyof typeof formData.clientDetails}`, value);
      }
    });
  }

  // Apply authority information
  if (formData.authorityInformation) {
    Object.entries(formData.authorityInformation).forEach(([key, value]) => {
      if (value !== undefined) {
        console.log(`Setting authorityInformation.${key} =`, value);
        setValue(`authorityInformation.${key as keyof typeof formData.authorityInformation}`, value);
      }
    });
  }

  // Apply IFZA license data
  if (formData.ifzaLicense) {
    Object.entries(formData.ifzaLicense).forEach(([key, value]) => {
      if (value !== undefined) {
        setValue(`ifzaLicense.${key as keyof typeof formData.ifzaLicense}`, value);
      }
    });
  }

  // Apply DET license data
  if (formData.detLicense) {
    Object.entries(formData.detLicense).forEach(([key, value]) => {
      if (value !== undefined) {
        setValue(`detLicense.${key as keyof typeof formData.detLicense}`, value);
      }
    });
  }

  // Apply visa costs
  if (formData.visaCosts) {
    Object.entries(formData.visaCosts).forEach(([key, value]) => {
      if (value !== undefined) {
        console.log(`Setting visaCosts.${key} =`, value);
        setValue(`visaCosts.${key as keyof typeof formData.visaCosts}`, value);
      }
    });
  }
}

/**
 * Generates a summary of changes made by the AI assistant
 */
export function generateChangesSummary(aiFormData: AIFormData): string {
  const changes: string[] = [];

  if (aiFormData.clientDetails) {
    const { firstName, lastName, companyName } = aiFormData.clientDetails;
    if (firstName || lastName) {
      changes.push(`Client: ${[firstName, lastName].filter(Boolean).join(' ')}`);
    }
    if (companyName) {
      changes.push(`Company: ${companyName}`);
    }
  }

  if (aiFormData.authorityInformation?.responsibleAuthority) {
    changes.push(`Authority: ${aiFormData.authorityInformation.responsibleAuthority}`);
  }

  if (aiFormData.visaCosts?.numberOfVisas) {
    changes.push(`Employment visas: ${aiFormData.visaCosts.numberOfVisas}`);
  }

  if (aiFormData.visaCosts?.spouseVisa) {
    changes.push('Spouse visa: Yes');
  }

  if (aiFormData.visaCosts?.childVisa && aiFormData.visaCosts?.numberOfChildVisas) {
    changes.push(`Child visas: ${aiFormData.visaCosts.numberOfChildVisas}`);
  }

  if (aiFormData.detLicense?.licenseType) {
    changes.push(`License type: ${aiFormData.detLicense.licenseType}`);
  }

  if (aiFormData.ifzaLicense?.licenseYears && aiFormData.ifzaLicense.licenseYears > 1) {
    changes.push(`License years: ${aiFormData.ifzaLicense.licenseYears}`);
  }

  return changes.length > 0 
    ? `Updated: ${changes.join(', ')}` 
    : 'Form updated based on your request';
}

/**
 * Validates that required form data is present for PDF generation
 * More lenient validation for AI-generated forms
 */
export function validateForPDFGeneration(formData: Partial<OfferData>): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // For AI assistant, we require authority selection and some client details
  if (!formData.authorityInformation?.responsibleAuthority) {
    missingFields.push('Responsible authority');
  }

  // Check if we have client details (firstName, lastName, or companyName)
  const hasClientInfo = !!(formData.clientDetails?.firstName || 
                          formData.clientDetails?.lastName || 
                          formData.clientDetails?.companyName);
  
  if (!hasClientInfo) {
    missingFields.push('Client name or company name');
  }

  // Allow PDF generation if we have both authority and client info
  return {
    isValid: !!formData.authorityInformation?.responsibleAuthority && hasClientInfo,
    missingFields
  };
}

/**
 * Default form data mapper instance
 */
export const formDataMapper = {
  mapAIResponseToFormData,
  applyToForm,
  generateChangesSummary,
  validateForPDFGeneration,
};