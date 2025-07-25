'use client';

import React, { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { OfferData } from '@/types/offer';
import { offerDataSchema } from '@/lib/validations';
import { 
  generatePDF, 
  generatePDFWithFilename, 
  generateFamilyVisaPDF,
  generateFamilyVisaPDFWithFilename,
  hasFamilyVisas 
} from '@/lib/pdf-generator';
import { Progress } from '@/components/ui/progress';

// Import our section components
import { ClientDetailsSection } from '../../cost-overview/sections/ClientDetailsSection';
import { AuthorityInfoSection } from '../../cost-overview/sections/AuthorityInfoSection';
import { ActivityCodesSection } from '../../cost-overview/sections/ActivityCodesSection';
import { LicenseFeesSection } from '../../cost-overview/sections/LicenseFeesSection';
import { VisaCostsSection } from '../../cost-overview/sections/VisaCostsSection';
import { SpouseVisaSection } from '../../cost-overview/sections/SpouseVisaSection';
import { ChildVisaSection } from '../../cost-overview/sections/ChildVisaSection';
import { CostSummarySection } from '../../cost-overview/sections/CostSummarySection';
import { AdditionalServicesSection } from '../../cost-overview/sections/AdditionalServicesSection';
import { SectionWithStickySummary } from '../../cost-overview/ui/SectionWithStickySummary';

// Import our custom hooks
import { useFormattedInputs } from '../../cost-overview/hooks/useFormattedInputs';
import { useAuthorityConfig } from '../../cost-overview/hooks/useAuthorityConfig';
import { useCostCalculation } from '../../cost-overview/hooks/useCostCalculation';
import { useSharedClient } from '@/contexts/SharedClientContext';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useChatPanel } from '@/hooks/useChatPanel';

// Import AI Assistant components
import { ChatInterface } from '@/components/ai-assistant';

// Progress tracking interface
interface PDFGenerationProgress {
  step: string;
  progress: number;
  isVisible: boolean;
}

interface CostOverviewTabProps {
  // No props needed anymore as we're using global bottom panel
}

const CostOverviewTab: React.FC<CostOverviewTabProps> = () => {
  const { clientInfo, updateClientInfo } = useSharedClient();
  const chatPanel = useChatPanel();

  // Form state management
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    trigger,
    formState: { errors },
  } = useForm<OfferData>({
    resolver: zodResolver(offerDataSchema),
    mode: 'onChange',
    defaultValues: {
      clientDetails: {
        firstName: '',
        lastName: '',
        companyName: '',
        addressToCompany: false,
        date: new Date().toISOString().split('T')[0],
        companySetupType: '',
        secondaryCurrency: 'EUR',
        exchangeRate: 4.0,
      },
      authorityInformation: {
        responsibleAuthority: '',
        areaInUAE: '',
        legalEntity: '',
        shareCapitalAED: 0,
        valuePerShareAED: 0,
        numberOfShares: 0,
      },
      activityCodes: [],
      ifzaLicense: {
        visaQuota: 0,
        licenseYears: 1,
        crossBorderLicense: false,
        mofaOwnersDeclaration: false,
        mofaCertificateOfIncorporation: false,
        mofaActualMemorandumOrArticles: false,
        mofaCommercialRegister: false,
        mofaPowerOfAttorney: false,
        rentOfficeRequired: false,
        officeRentAmount: 0,
        depositWithLandlord: false,
        depositAmount: 0,
        thirdPartyApproval: false,
        thirdPartyApprovalAmount: 0,
        tmeServicesFee: 0,
        applyPriceReduction: false,
        reductionAmount: 0,
      },
      detLicense: {
        mofaOwnersDeclaration: false,
        mofaCertificateOfIncorporation: false,
        mofaActualMemorandumOrArticles: false,
        mofaCommercialRegister: false,
        mofaPowerOfAttorney: false,
        licenseType: undefined,
        rentType: undefined,
        officeRentAmount: 0,
        thirdPartyApproval: false,
        thirdPartyApprovalAmount: 0,
        tmeServicesFee: 0,
        applyPriceReduction: false,
        reductionAmount: 0,
        activitiesToBeConfirmed: false,
      },
      visaCosts: {
        numberOfVisas: 0,
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
      },
      additionalServices: {
        companyStamp: 646,
        emiratesPost: 1500,
        citRegistration: 3070,
        citReturnFiling: 5458,
        vatRegistration: 3810,
        personalBank: 3150,
        digitalBank: 3150,
        traditionalBank: 7350,
        accountingFee: 6293,
      },
    },
  });

  // Field arrays for dynamic sections
  const activityCodesArray = useFieldArray({
    control,
    name: 'activityCodes',
  });

  const visaDetailsArray = useFieldArray({
    control,
    name: 'visaCosts.visaDetails',
  });

  // Watch form data for real-time updates
  const watchedData = watch();
  const { authorityInformation } = watchedData;

  // Auto-save removed to prevent infinite re-rendering issues

  // Custom hooks
  const { formattedInputs, handlers, validationErrors, formatNumberWithSeparators, parseFormattedNumber } = useFormattedInputs(setValue, watchedData);
  const { authorityConfig, isAuthoritySelected } = useAuthorityConfig(
    authorityInformation?.responsibleAuthority, 
    setValue
  );
  const { costs, hasCalculations } = useCostCalculation(authorityConfig || null, watchedData);

  // Track authority configuration changes
  React.useEffect(() => {
    // Authority configuration updated
  }, [authorityInformation?.responsibleAuthority, isAuthoritySelected, authorityConfig?.id, watchedData.visaCosts?.numberOfVisas]);

  // AI Assistant integration
  const aiAssistant = useAIAssistant({
    setValue,
    currentFormData: watchedData,
    trigger,
    onFormUpdate: (summary) => {
      // Don't show duplicate success toast since useAIAssistant handles it
    },
    onAutoGeneratePDF: (updatedData) => handlePreviewPDF(updatedData) // Use merged data
  });

  // Sync AI assistant state with chat panel
  React.useEffect(() => {
    if (aiAssistant.isOpen !== chatPanel.isOpen) {
      if (aiAssistant.isOpen) {
        chatPanel.openPanel();
      } else {
        chatPanel.closePanel();
      }
    }
  }, [aiAssistant.isOpen, chatPanel]);

  // Override AI assistant open/close to also control chat panel
  const handleOpenChat = () => {
    aiAssistant.openChat();
    chatPanel.openPanel();
  };

  const handleCloseChat = () => {
    aiAssistant.closeChat();
    chatPanel.closePanel();
  };

  // PDF generation states
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [pdfProgress, setPdfProgress] = React.useState<PDFGenerationProgress>({
    step: '',
    progress: 0,
    isVisible: false
  });

  // Initialize form with shared client context (only once on mount)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && (clientInfo.firstName || clientInfo.lastName || clientInfo.companyName)) {
      setValue('clientDetails.firstName', clientInfo.firstName || '');
      setValue('clientDetails.lastName', clientInfo.lastName || '');
      setValue('clientDetails.companyName', clientInfo.companyName || '');
      setValue('clientDetails.date', clientInfo.date);
      initializedRef.current = true;
    }
  }, [clientInfo, setValue]); // Include proper dependencies

  // Update shared client info when form changes (simplified to prevent infinite loops)
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    const { firstName, lastName, companyName, date } = watchedData.clientDetails || {};
    
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce the update to prevent rapid fire updates
    updateTimeoutRef.current = setTimeout(() => {
      updateClientInfo({
        firstName: firstName || '',
        lastName: lastName || '',
        companyName: companyName || '',
        date: date || new Date().toISOString().split('T')[0],
      });
    }, 100); // Small delay to prevent loops
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [
    watchedData.clientDetails?.firstName, 
    watchedData.clientDetails?.lastName, 
    watchedData.clientDetails?.companyName, 
    watchedData.clientDetails?.date,
    updateClientInfo
  ]);

  // Progress tracking helper
  const updateProgress = (step: string, progress: number) => {
    setPdfProgress({ step, progress, isVisible: true });
  };

  // Auto-save data loading removed

  // PDF generation handlers with progress tracking
  const handleGeneratePDF = async (data: OfferData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data || !data.clientDetails || !data.authorityInformation) {
      toast.error('Missing Information', {
        description: 'Please fill out the required client details and authority information before generating the PDF.'
      });
      return;
    }

    if (!data.authorityInformation.responsibleAuthority) {
      toast.error('Authority Required', {
        description: 'Please select a responsible authority before generating the PDF.'
      });
      return;
    }

    if (!data.clientDetails.firstName && !data.clientDetails.lastName && !data.clientDetails.companyName) {
      toast.error('Client Details Required', {
        description: 'Please enter either client name (first/last) or company name before generating the PDF.'
      });
      return;
    }

    setIsGenerating(true);
    const hasFamilyVisaDoc = hasFamilyVisas(data);
    const totalSteps = hasFamilyVisaDoc ? 4 : 2;
    let currentStep = 0;

    const loadingToast = toast.loading('Generating PDF documents...', {
      description: 'Please wait while we create your cost overview documents.'
    });

    try {
      // Step 1: Validate data
      updateProgress('Validating form data...', (++currentStep / totalSteps) * 100);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Generate main document
      updateProgress('Generating main cost overview document...', (++currentStep / totalSteps) * 100);
      const { blob: mainPdfBlob, filename: mainFilename } = await generatePDFWithFilename(data);
      const mainUrl = URL.createObjectURL(mainPdfBlob);
      const mainLink = document.createElement('a');
      mainLink.href = mainUrl;
      mainLink.download = mainFilename;
      document.body.appendChild(mainLink);
      mainLink.click();
      document.body.removeChild(mainLink);
      URL.revokeObjectURL(mainUrl);

      // Step 3: Generate family visa document if needed
      if (hasFamilyVisaDoc) {
        updateProgress('Generating family visa document...', (++currentStep / totalSteps) * 100);
        const { blob: familyPdfBlob, filename: familyFilename } = await generateFamilyVisaPDFWithFilename(data);
        const familyUrl = URL.createObjectURL(familyPdfBlob);
        const familyLink = document.createElement('a');
        familyLink.href = familyUrl;
        familyLink.download = familyFilename;
        document.body.appendChild(familyLink);
        familyLink.click();
        document.body.removeChild(familyLink);
        URL.revokeObjectURL(familyUrl);
      }

      // Final step: Complete
      updateProgress('Finalizing documents...', (++currentStep / totalSteps) * 100);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Log PDF generation activity
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_generated',
            resource: 'cost_overview',
            details: {
              filename: mainFilename,
              client_name: data.clientDetails.companyName || `${data.clientDetails.firstName} ${data.clientDetails.lastName}`.trim(),
              authority: data.authorityDetails?.authority || 'Not specified',
              has_family_visa: hasFamilyVisaDoc,
              document_type: 'Cost Overview'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF generation activity:', error);
      }

      // Success notification
      toast.dismiss(loadingToast);
      toast.success('PDF Generated Successfully!', {
        description: hasFamilyVisaDoc 
          ? 'Both main cost overview and family visa documents have been downloaded.'
          : 'Your cost overview document has been downloaded.',
        action: {
          label: 'Generate Another',
          onClick: () => handleGeneratePDF(data)
        }
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss(loadingToast);
      toast.error('PDF Generation Failed', {
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        action: {
          label: 'Retry',
          onClick: () => handleGeneratePDF(data)
        }
      });
    } finally {
      setIsGenerating(false);
      setPdfProgress({ step: '', progress: 0, isVisible: false });
    }
  };

  const handlePreviewPDF = async (data: OfferData): Promise<void> => {
    // PDF preview data validation
    
    // Validate required data before generating PDF
    if (!data || !data.clientDetails || !data.authorityInformation) {
      toast.error('Missing Information', {
        description: 'Please fill out the required client details and authority information before generating the PDF.'
      });
      return;
    }

    if (!data.authorityInformation.responsibleAuthority) {
      toast.error('Authority Required', {
        description: 'Please select a responsible authority before generating the PDF.'
      });
      return;
    }

    if (!data.clientDetails.firstName && !data.clientDetails.lastName && !data.clientDetails.companyName) {
      toast.error('Client Details Required', {
        description: 'Please enter either client name (first/last) or company name before generating the PDF.'
      });
      return;
    }

    setIsGenerating(true);
    const hasFamilyVisaDoc = hasFamilyVisas(data);
    const totalSteps = hasFamilyVisaDoc ? 3 : 2;
    let currentStep = 0;

    const loadingToast = toast.loading('Preparing preview...', {
      description: 'Generating PDF preview for your review.'
    });

    try {
      // Step 1: Validate data
      updateProgress('Preparing preview data...', (++currentStep / totalSteps) * 100);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 2: Generate main preview
      updateProgress('Generating main document preview...', (++currentStep / totalSteps) * 100);
      const { blob: mainPdfBlob, filename: mainFilename } = await generatePDFWithFilename(data);
      const mainUrl = URL.createObjectURL(mainPdfBlob);
      
      // Open main PDF in new tab for preview
      window.open(mainUrl, '_blank');
      
      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => {
        URL.revokeObjectURL(mainUrl);
      }, 1000);

      // Step 3: Generate family visa preview if needed
      if (hasFamilyVisaDoc) {
        updateProgress('Generating family visa preview...', (++currentStep / totalSteps) * 100);
        const familyPdfBlob = await generateFamilyVisaPDF(data);
        const familyUrl = URL.createObjectURL(familyPdfBlob);
        
        // Open family visa PDF in new tab for preview
        setTimeout(() => {
          window.open(familyUrl, '_blank');
          
          // Clean up the URL after a delay
          setTimeout(() => {
            URL.revokeObjectURL(familyUrl);
          }, 1000);
        }, 500); // Slight delay to prevent browser popup blocker
      }

      // Log PDF preview activity
      try {
        await fetch('/api/user/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'pdf_previewed',
            resource: 'cost_overview',
            details: {
              filename: mainFilename,
              client_name: data.clientDetails.companyName || `${data.clientDetails.firstName} ${data.clientDetails.lastName}`.trim(),
              authority: data.authorityDetails?.authority || 'Not specified',
              has_family_visa: hasFamilyVisaDoc,
              document_type: 'Cost Overview'
            }
          })
        });
      } catch (error) {
        console.error('Failed to log PDF preview activity:', error);
      }

      // Dismiss loading notification
      toast.dismiss(loadingToast);

    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast.dismiss(loadingToast);
      toast.error('Preview Generation Failed', {
        description: 'Error generating PDF preview. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => handlePreviewPDF(data)
        }
      });
    } finally {
      setIsGenerating(false);
      setPdfProgress({ step: '', progress: 0, isVisible: false });
    }
  };

  // Listen for PDF generation events from header buttons
  React.useEffect(() => {
    const handleGeneratePDFEvent = () => handleGeneratePDF(watchedData);
    const handlePreviewEvent = () => handlePreviewPDF(watchedData);

    window.addEventListener('generate-pdf', handleGeneratePDFEvent);
    window.addEventListener('preview-document', handlePreviewEvent);

    return () => {
      window.removeEventListener('generate-pdf', handleGeneratePDFEvent);
      window.removeEventListener('preview-document', handlePreviewEvent);
    };
  }, [watchedData]);

  return (
    <div className="space-y-8">

      {/* Enhanced Progress Dialog for PDF Generation */}
      {pdfProgress.isVisible && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
          
          {/* Progress dialog */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 min-w-[400px] max-w-md">
            <div className="text-center space-y-6">
              {/* Header with icon */}
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  Generating PDF Document
                </div>
              </div>
              
              {/* Current step */}
              <div className="text-sm text-gray-600 font-medium">
                {pdfProgress.step}
              </div>
              
              {/* Progress bar with enhanced styling */}
              <div className="space-y-3">
                <Progress 
                  value={pdfProgress.progress} 
                  className="w-full h-3 bg-gray-100" 
                />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold text-blue-600">
                    {Math.round(pdfProgress.progress)}%
                  </span>
                </div>
              </div>
              
              {/* Animated dots */}
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Basic Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Client Details Section */}
        <ClientDetailsSection 
          register={register}
          errors={errors}
          watchedData={watchedData}
          handlers={handlers}
          setValue={setValue}
        />

        {/* Authority Information Section */}
        <AuthorityInfoSection 
          register={register}
          errors={errors}
          watchedData={watchedData}
          setValue={setValue}
          formattedInputs={formattedInputs}
          handlers={handlers}
          validationErrors={validationErrors}
        />
      </div>


      {/* Authority-Specific Sections */}
      {isAuthoritySelected && authorityConfig && (
        <>
          {/* Activity Codes Section */}
          <ActivityCodesSection 
            register={register}
            errors={errors}
            activityCodesArray={activityCodesArray}
            watchedData={watchedData}
          />
          {/* License Fees Section with sticky summary */}
          <SectionWithStickySummary
            sectionId="license-fees"
            summaryTitle="Initial Setup Cost"
            costs={costs?.initialSetup}
            watchedData={watchedData}
            authorityConfig={authorityConfig}
            gradientColors="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200"
            iconColor="bg-green-600"
            includeDeposits={true}
            showSummary={hasCalculations && !!costs?.initialSetup}
          >
            <LicenseFeesSection 
              register={register}
              errors={errors}
              watchedData={watchedData}
              setValue={setValue}
              authorityConfig={authorityConfig}
              formatNumberWithSeparators={formatNumberWithSeparators}
              parseFormattedNumber={parseFormattedNumber}
            />
          </SectionWithStickySummary>

          {/* Visa Costs Section with sticky summary (only if authority supports visas) */}
          {authorityConfig.visaCosts && (
            <SectionWithStickySummary
              sectionId="visa-costs"
              summaryTitle="Visa Costs Summary"
              costs={costs?.visaCosts}
              watchedData={watchedData}
              authorityConfig={authorityConfig}
              gradientColors="bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200"
              iconColor="bg-blue-600"
              showSummary={hasCalculations && !!costs?.visaCosts}
            >
              <VisaCostsSection 
                register={register}
                errors={errors}
                watchedData={watchedData}
                authorityConfig={authorityConfig}
                visaDetailsArray={visaDetailsArray}
              />
            </SectionWithStickySummary>
          )}

          {/* Spouse Visa Section (for authorities that support it) */}
          {authorityConfig.visaCosts?.spouseVisaStandardFee && (
            <SectionWithStickySummary
              sectionId="spouse-visa"
              summaryTitle="Spouse Visa Summary"
              costs={costs?.visaCosts}
              watchedData={watchedData}
              authorityConfig={authorityConfig}
              gradientColors="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200"
              iconColor="bg-pink-500"
              showSummary={!!(costs?.visaCosts && watchedData.visaCosts?.spouseVisa)}
              visaType="spouse"
            >
              <SpouseVisaSection 
                register={register}
                errors={errors}
                watchedData={watchedData}
                authorityConfig={authorityConfig}
                setValue={setValue}
              />
            </SectionWithStickySummary>
          )}

          {/* Child Visa Section (for authorities that support it) */}
          {authorityConfig.visaCosts?.childVisaStandardFee && (
            <SectionWithStickySummary
              sectionId="child-visa"
              summaryTitle="Child Visa Summary"
              costs={costs?.visaCosts}
              watchedData={watchedData}
              authorityConfig={authorityConfig}
              gradientColors="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200"
              iconColor="bg-purple-500"
              showSummary={!!(costs?.visaCosts && watchedData.visaCosts?.childVisa)}
              visaType="child"
            >
              <ChildVisaSection 
                register={register}
                errors={errors}
                watchedData={watchedData}
                authorityConfig={authorityConfig}
                setValue={setValue}
              />
            </SectionWithStickySummary>
          )}

          {/* Additional Services Section with yearly running summary */}
          <SectionWithStickySummary
            sectionId="additional-services"
            summaryTitle={(() => {
              const licenseYears = watchedData.ifzaLicense?.licenseYears || 1;
              const isMultiYear = authorityConfig.id === 'ifza' && licenseYears > 1;
              return isMultiYear 
                ? `Yearly Running Cost (After ${licenseYears} Years)`
                : "Yearly Running Cost";
            })()}
            costs={costs?.yearlyRunning}
            watchedData={watchedData}
            authorityConfig={authorityConfig}
            gradientColors="bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200"
            iconColor="bg-yellow-500"
            showSummary={hasCalculations && !!costs?.yearlyRunning}
          >
            <AdditionalServicesSection 
              formattedInputs={formattedInputs}
              handlers={handlers}
            />
          </SectionWithStickySummary>

          {/* Full Cost Summaries - Now moved to bottom for complete overview */}
          {hasCalculations && costs && (
            <div className="space-y-8 mt-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Cost Overview</h2>
                <p className="text-gray-600">Detailed breakdown of all costs</p>
              </div>

              {/* Initial Setup Cost Summary */}
              {costs.initialSetup && (
                <CostSummarySection 
                  title="Initial Setup Cost Summary"
                  costs={costs.initialSetup}
                  watchedData={watchedData}
                  authorityConfig={authorityConfig}
                  gradientColors="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200"
                  iconColor="bg-green-600"
                  includeDeposits={true}
                />
              )}

              {/* Visa Cost Summary (only if has visa costs) */}
              {costs.visaCosts && costs.visaCosts.total > 0 && (
                <CostSummarySection 
                  title="Visa Cost Summary for 2 Year Employment Visa"
                  costs={costs.visaCosts}
                  watchedData={watchedData}
                  authorityConfig={authorityConfig}
                  gradientColors="bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200"
                  iconColor="bg-blue-600"
                />
              )}

              {/* Yearly Running Cost Summary */}
              {costs.yearlyRunning && (() => {
                const licenseYears = watchedData.ifzaLicense?.licenseYears || 1;
                const isMultiYear = authorityConfig.id === 'ifza' && licenseYears > 1;
                const title = isMultiYear 
                  ? `Yearly Running Cost Summary (After ${licenseYears} Years)`
                  : "Yearly Running Cost Summary";
                
                return (
                  <CostSummarySection 
                    title={title}
                    costs={costs.yearlyRunning}
                    watchedData={watchedData}
                    authorityConfig={authorityConfig}
                    gradientColors="bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200"
                    iconColor="bg-yellow-500"
                  />
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* Generate and Preview Buttons - Only show when authority is selected or AI assistant has been used */}
      {(isAuthoritySelected || aiAssistant.hasBeenUsed) && (
        <div className="text-center animate-in slide-in-from-bottom duration-500">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              type="button"
              onClick={() => handlePreviewPDF(watchedData)}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center space-x-3"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview PDF</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => handleGeneratePDF(watchedData)}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center space-x-3"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Help text when buttons are not visible */}
      {!isAuthoritySelected && !aiAssistant.hasBeenUsed && (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Ready to Generate Your Quote?
              </h3>
              <p className="text-blue-700 text-sm">
                Select an authority above or use the AI Assistant to get started. Once you provide the basic information, you'll see options to preview and download your PDF quote.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Chat Interface - Bottom Panel Mode */}
      <ChatInterface
        mode="bottom-panel"
        isOpen={chatPanel.isOpen}
        isMinimized={chatPanel.isMinimized}
        onClose={handleCloseChat}
        onOpen={handleOpenChat}
        onToggleMinimize={chatPanel.toggleMinimize}
        messages={aiAssistant.messages}
        onSendMessage={aiAssistant.sendMessage}
        onClearHistory={aiAssistant.clearHistory}
        isLoading={aiAssistant.isLoading}
        error={aiAssistant.error}
      />
    </div>
  );
};

export default CostOverviewTab; 