'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, FileText, Eye } from 'lucide-react';
import { OfferData } from '@/types/offer';
import { offerDataSchema } from '@/lib/validations';
import { 
  generatePDF, 
  generatePDFWithFilename, 
  generateFamilyVisaPDF,
  generateFamilyVisaPDFWithFilename,
  hasFamilyVisas 
} from '@/lib/pdf-generator';

// Import our new section components
import { ClientDetailsSection } from './cost-overview/sections/ClientDetailsSection';
import { AuthorityInfoSection } from './cost-overview/sections/AuthorityInfoSection';
import { LicenseFeesSection } from './cost-overview/sections/LicenseFeesSection';
import { VisaCostsSection } from './cost-overview/sections/VisaCostsSection';
import { SpouseVisaSection } from './cost-overview/sections/SpouseVisaSection';
import { ChildVisaSection } from './cost-overview/sections/ChildVisaSection';
import { CostSummarySection } from './cost-overview/sections/CostSummarySection';
import { AdditionalServicesSection } from './cost-overview/sections/AdditionalServicesSection';
import { SectionWithStickySummary } from './cost-overview/ui/SectionWithStickySummary';


// Import our custom hooks
import { useFormattedInputs } from './cost-overview/hooks/useFormattedInputs';
import { useAuthorityConfig } from './cost-overview/hooks/useAuthorityConfig';
import { useCostCalculation } from './cost-overview/hooks/useCostCalculation';

const CostOverview: React.FC = () => {
  // Form state management
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
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

  // Custom hooks
  const { formattedInputs, handlers, validationErrors, formatNumberWithSeparators, parseFormattedNumber } = useFormattedInputs(setValue, watchedData);
  const { authorityConfig, isAuthoritySelected } = useAuthorityConfig(
    authorityInformation?.responsibleAuthority, 
    setValue
  );
  const { costs, hasCalculations } = useCostCalculation(authorityConfig || null, watchedData);

  // PDF generation states
  const [isGenerating, setIsGenerating] = React.useState(false);

  // PDF generation handlers
  const handleGeneratePDF = async (data: OfferData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data || !data.clientDetails || !data.authorityInformation) {
      alert('Please fill out the required client details and authority information before generating the PDF.');
      return;
    }

    if (!data.authorityInformation.responsibleAuthority) {
      alert('Please select a responsible authority before generating the PDF.');
      return;
    }

    if (!data.clientDetails.firstName && !data.clientDetails.lastName && !data.clientDetails.companyName) {
      alert('Please enter either client name (first/last) or company name before generating the PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      // Always generate the main document
      const { blob: mainPdfBlob, filename: mainFilename } = await generatePDFWithFilename(data);
      const mainUrl = URL.createObjectURL(mainPdfBlob);
      const mainLink = document.createElement('a');
      mainLink.href = mainUrl;
      mainLink.download = mainFilename;
      document.body.appendChild(mainLink);
      mainLink.click();
      document.body.removeChild(mainLink);
      URL.revokeObjectURL(mainUrl);

      // Generate family visa document if family visas are selected
      if (hasFamilyVisas(data)) {
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
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };



  const handlePreviewPDF = async (data: OfferData): Promise<void> => {
    // Validate required data before generating PDF
    if (!data || !data.clientDetails || !data.authorityInformation) {
      alert('Please fill out the required client details and authority information before generating the PDF.');
      return;
    }

    if (!data.authorityInformation.responsibleAuthority) {
      alert('Please select a responsible authority before generating the PDF.');
      return;
    }

    if (!data.clientDetails.firstName && !data.clientDetails.lastName && !data.clientDetails.companyName) {
      alert('Please enter either client name (first/last) or company name before generating the PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      // Always preview the main document
      const mainPdfBlob = await generatePDF(data);
      const mainUrl = URL.createObjectURL(mainPdfBlob);
      
      // Open main PDF in new tab for preview
      window.open(mainUrl, '_blank');
      
      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => {
        URL.revokeObjectURL(mainUrl);
      }, 1000);

      // Preview family visa document if family visas are selected
      if (hasFamilyVisas(data)) {
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
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('Error generating PDF preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
              <FileText className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Cost Overview Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            TME Services Professional cost overview generator
          </p>
        </div>

        <div className="space-y-8">
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
              activityCodesArray={activityCodesArray}
              authorityConfig={authorityConfig}
            />
          </div>

          {/* Authority-Specific Sections */}
          {isAuthoritySelected && authorityConfig && (
            <>
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

          {/* Generate and Preview Buttons */}
          <div className="text-center">
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
                    <Eye className="h-6 w-6" />
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
                    <Download className="h-6 w-6" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostOverview; 