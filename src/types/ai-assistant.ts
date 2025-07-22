import { OfferData } from './offer';
import { UseFormSetValue } from 'react-hook-form';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface AIFormData {
  clientDetails?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    companySetupType?: string;
  };
  authorityInformation?: {
    responsibleAuthority?: string;
    legalEntity?: string;
    shareCapitalAED?: number;
    valuePerShareAED?: number;
    numberOfShares?: number;
  };
  ifzaLicense?: {
    visaQuota?: number;
    licenseYears?: number;
    crossBorderLicense?: boolean;
    rentOfficeRequired?: boolean;
    officeRentAmount?: number;
    thirdPartyApproval?: boolean;
    thirdPartyApprovalAmount?: number;
    tmeServicesFee?: number;
    activitiesToBeConfirmed?: boolean;
  };
  detLicense?: {
    licenseType?: string;
    rentType?: string;
    officeRentAmount?: number;
    thirdPartyApproval?: boolean;
    thirdPartyApprovalAmount?: number;
    tmeServicesFee?: number;
    activitiesToBeConfirmed?: boolean;
  };
  visaCosts?: {
    numberOfVisas?: number;
    spouseVisa?: boolean;
    childVisa?: boolean;
    numberOfChildVisas?: number;
    reducedVisaCost?: number;
    vipStamping?: boolean;
    vipStampingVisas?: number;
    visaDetails?: Array<{
      healthInsurance?: string;
      investorVisa?: boolean | string;
      employmentVisa?: boolean;
      statusChange?: boolean;
      vipStamping?: boolean;
    }>;
  };
}

export interface AIResponse {
  formData?: AIFormData;
  message: string;
  requiresClarification?: boolean;
  clarificationQuestions?: string[];
}

export interface AIAssistantRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  currentFormData?: OfferData;
}

export interface AIAssistantAPIResponse {
  success: boolean;
  data?: AIResponse;
  error?: string;
  details?: unknown;
}

export interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  sendMessage: (message: string) => Promise<void>;
  openChat: () => void;
  closeChat: () => void;
  clearHistory: () => void;
  applyFormData: (formData: AIFormData) => void;
}

// Hook return type for useAIAssistant
export interface UseAIAssistantReturn extends ChatContextType {
  error: string | null;
  hasBeenUsed: boolean;
  retryLastMessage: () => Promise<void>;
}

// Form integration types
export interface FormDataMapper {
  mapAIResponseToFormData: (aiFormData: AIFormData) => Partial<OfferData>;
  applyToForm: (formData: Partial<OfferData>, setValue: UseFormSetValue<OfferData>) => void;
}