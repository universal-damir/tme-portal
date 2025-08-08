export const GOLDEN_VISA_TRANSLATIONS = {
  en: {
    headlines: {
      propertyInvestment: 'Golden Visa (10 Years) Property Investment',
      timeDeposit: 'Golden Visa (10 Years) Time Deposit', 
      skilledEmployee: 'Golden Visa (10 Years) Skilled Employee',
      dependent: 'Golden Visa (10 Years) Dependent'
    },
    intro: {
      standard: 'We are pleased to share a personalized proposal for your Golden Visa application. This document provides a transparent breakdown of costs and fees based on the requirements.',
      dependent: 'We are pleased to share a personalized proposal for your dependent Golden Visa application. This document provides a transparent breakdown of costs and fees for dependent visa applications only, based on your specific requirements.',
      withGreeting: (firstName: string) => `Dear ${firstName},\n\n`
    },
    visaTypes: {
      'property-investment': 'Property Investment',
      'time-deposit': 'Time Deposit',
      'skilled-employee': 'Skilled Employee'
    },
    requirements: {
      sectionTitle: 'Visa Requirements & Eligibility',
      introText: {
        standard: 'Please review the following requirements that must be fulfilled for this Golden Visa:',
        skilledEmployee: 'Please review the following requirements to determine eligibility:',
        dependent: 'Please review the following requirements for dependent visas:'
      },
      common: {
        processingTime: 'Processing time',
        processingTimeText: 'Approximately 10 - 15 working days. The applicant must be in the UAE to start the visa process and must remain in the UAE throughout the entire processing period.',
        healthInsurance: 'Health insurance',
        healthInsuranceText: 'Required. Must be either a UAE registered or an international health insurance.',
        medicalEmirates: 'Medical test & Emirates ID',
        medicalEmiratesText: 'Your physical presence is required for both the medical test and Emirates ID appointment. We will arrange the appointments for you, and an experienced member of our team will accompany you. Your original passport is required for both appointments.'
      },
      propertyInvestment: {
        minProperty: 'Minimum property value',
        minPropertyText: 'AED 2,000,000 per person. Joint ownership is permitted.\nUnder-construction properties require a NOC (No Objection Certificate) and payment plan from developer.',
        propertyTypes: 'Eligible property types',
        propertyTypesText: 'Only villas and apartments are eligible.'
      },
      timeDeposit: {
        minDeposit: 'Minimum deposit',
        minDepositText: 'A fixed deposit of AED 2,000,000 with a UAE bank is required, deposited for a minimum of 2 years.',
        residencyReq: 'Residency requirement',
        residencyReqText: 'You must already hold a valid UAE residence visa and provide proof of residence in Dubai.',
        acceptableDocs: 'Acceptable documents are a valid Ejari or title deed issued by DLD (Dubai Land Department).'
      },
      skilledEmployee: {
        education: 'Educational qualification',
        educationText: 'Bachelor or Master certificate with transcript. Requires a multi-step process ending with attestation by the UAE Embassy in the country of origin.',
        equivalency: 'Equivalency certificate',
        equivalencyText: 'This document must be obtained by the customer from the Ministry of Education in Dubai.',
        equivalencyLink: 'Link to Ministry of Education website.',
        employment: 'Employment documents',
        employmentText: 'Employment contract and salary certificate with a minimum monthly salary of AED 30,000.',
        freezoneNoc: 'Freezone NOC',
        freezoneNocText: 'A No Objection Certificate from',
        freezoneSalary: 'Freezone salary certificate',
        freezoneSalaryText: 'A salary certificate from',
        companyNoc: 'Company NOC',
        companyNocText: 'A No Objection Certificate from your current employer, in English and Arabic.',
        bankStatements: 'Bank statements',
        bankStatementsText: '6 months personal bank statements reflecting a monthly salary of AED 30,000 or more.',
        residenceProof: 'Proof of residence',
        residenceProofText: 'Valid Ejari or title deed issued by DLD (Dubai Land Department).'
      },
      dependent: {
        marriageCert: 'Marriage certificate',
        marriageCertText: 'Requires a multi-step process ending with attestation by the UAE Embassy in the country of origin.',
        birthCert: "Child's birth certificate",
        birthCertPlural: "Children's birth certificates",
        birthCertText: 'Requires a multi-step process ending with attestation by the UAE Embassy in the country of origin.'
      }
    },
    costSummary: {
      titles: {
        propertyInvestment: 'Property Investment Golden Visa Summary',
        timeDeposit: 'Time Deposit Golden Visa Summary',
        skilledEmployee: 'Skilled Employee Golden Visa Summary',
        dependent: 'Dependent Golden Visa Summary',
        withDependents: (visaType: string, dependentType: string) => `${visaType} Golden Visa Summary (Including ${dependentType})`,
        dependentSingle: 'Dependent',
        dependentPlural: 'Dependents'
      },
      descriptions: {
        standard: 'This represents the total costs for your Golden Visa application. A detailed cost breakdown can be found on the following pages for complete transparency.',
        dependent: 'This represents the total costs for your Golden Visa dependent services only. A detailed cost breakdown can be found on the following pages for complete transparency.'
      },
      tableHeaders: {
        description: 'Description',
        aed: 'AED',
        total: 'Total'
      },
      costItems: {
        authorityCosts: 'Golden Visa authority costs',
        nocCost: 'NOC (No Objection Certificate) cost',
        salaryCertificate: 'salary certificate cost',
        spouseVisa: 'Dependent (spouse) visa authority costs',
        childVisa: 'Dependent (child) visa authority costs',
        childrenVisa: 'Dependent (children) visa authority costs',
        childrenCount: (count: number) => `(${count} children)`,
        tmeServices: 'TME Services professional fee'
      }
    },
    signature: {
      agreedText: (date: string) => `Agreed to the above proposal, ${date}`,
      signatureLabel: 'Signature'
    },
    costsBreakdown: {
      pageTitle: 'Golden Visa Cost Breakdown',
      introText: 'This page provides a detailed breakdown of all authority costs, including the TME Services consultancy fee, required for your Golden Visa application. Each cost component is clearly listed for complete transparency in the application process.',
      tableTitle: 'Golden Visa Cost Breakdown',
      serviceExplanations: 'Service Explanations',
      explanations: {
        professionalPassportPicture: 'Professional Passport Pictures: Official biometric passport photos to UAE standards for all visa applications.',
        dldApprovalFee: 'DLD Approval/Assessment Fee: For property verification and approval by Dubai Land Department (property investment golden visa only).',
        mandatoryUaeMedicalTest: 'Mandatory UAE Medical Test: Required health examination for all visa applicants at approved clinics.',
        emiratesIdFee: 'Emirates ID Fee: For issuance of the mandatory Emirates ID card for all UAE residents.',
        immigrationResidencyFee: 'Immigration Residency Fee: Official government fee for residence visa processing.',
        visaCancellationFee: 'Visa Cancellation Costs: For cancelling existing visa status before applying for new Golden Visa (if applicable).',
        thirdPartyCosts: 'Third Party Costs: For additional third-party services and administrative costs.',
        tmeServicesFee: 'Includes complete management of the visa and Emirates ID application process, including document preparation, liaison with relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.',
        dependentFileOpening: 'Dependent File Opening Costs: For opening the dependent visa file (applies only to the first dependent).',
        dependentStandardCosts: 'Standard Authority Costs Dependent: For mandatory UAE medical test, Emirates ID and immigration residency processing for dependents.',
        dependentTmeServices: 'TME Services Dependent: Professional fee for managing the dependent visa application process.',
        freezoneNocFee: 'Freezone NOC Fee: No Objection Certificate from',
        freezoneSalaryCertificate: 'Freezone salary Certificate: salary certificate from'
      }
    },
    dependentCosts: {
      pageTitle: 'Dependent Visa Cost Breakdown',
      introText: 'This page provides a detailed breakdown of all authority costs, including TME Services professional fee required for your dependent Golden Visa application. Each cost component is clearly itemized for complete transparency in the application process.',
      spouseVisaBreakdown: 'Spouse Visa Breakdown',
      childVisaBreakdown: 'Child Visa Breakdown',
      serviceExplanations: 'Service Explanations',
      explanations: {
        dependentFileOpening: 'For opening dependent visa file (applies to first dependent only).',
        standardAuthorityCosts: 'For mandatory UAE medical test, Emirates ID, and immigration residency processing.',
        thirdPartyCosts: 'Administrative costs charged by various departments.',
        tmeServicesProfessionalFee: 'Covers the complete management of the visa and Emirates ID application process, including document preparation, liaison with the relevant authorities, and personal accompaniment by an experienced TME Services team member to all required appointments.',
        visaCancellation: 'For cancelling existing visa status before applying for dependent visa.'
      },
      serviceDescriptions: {
        dependentFileOpening: 'Dependent file opening cost',
        standardAuthorityCosts: 'Standard authority costs',
        thirdPartyCosts: 'Third party costs',
        tmeServicesProfessionalFee: 'TME Services professional fee',
        visaCancellation: 'Visa cancellation cost'
      }
    }
  },
  de: {
    headlines: {
      propertyInvestment: 'Golden Visa (10 Jahre) Immobilieninvestition',
      timeDeposit: 'Golden Visa (10 Jahre) Termineinlage',
      skilledEmployee: 'Golden Visa (10 Jahre) Qualifizierte Fachkraft', 
      dependent: 'Golden Visa (10 Jahre) Angehörige'
    },
    intro: {
      standard: 'Wir freuen uns, Ihnen einen personalisierten Vorschlag für Ihren Golden Visa Antrag zu unterbreiten. Dieses Dokument bietet eine transparente Aufschlüsselung der Kosten und Gebühren basierend auf den Anforderungen.',
      dependent: 'Wir freuen uns, Ihnen einen personalisierten Vorschlag für Ihren Angehörigen Golden Visa Antrag zu unterbreiten. Dieses Dokument bietet eine transparente Aufschlüsselung der Kosten und Gebühren nur für Angehörigenvisa, basierend auf Ihren spezifischen Anforderungen.',
      withGreeting: (firstName: string) => `Liebe/r ${firstName},\n\n`
    },
    visaTypes: {
      'property-investment': 'Immobilieninvestition',
      'time-deposit': 'Termineinlage', 
      'skilled-employee': 'Qualifizierte Fachkraft'
    },
    requirements: {
      sectionTitle: 'Visa-Anforderungen & Berechtigung',
      introText: {
        standard: 'Bitte überprüfen Sie die folgenden Anforderungen, die für diese Golden Visa erfüllt werden müssen:',
        skilledEmployee: 'Bitte überprüfen Sie die folgenden Anforderungen zur Bestimmung der Berechtigung:',
        dependent: 'Bitte überprüfen Sie die folgenden Anforderungen für Angehörigenvisa:'
      },
      common: {
        processingTime: 'Bearbeitungszeit',
        processingTimeText: 'Etwa 10 - 15 Werktage. Der Antragsteller muss sich in den VAE befinden, um den Visa-Prozess zu beginnen und muss während der gesamten Bearbeitungsdauer in den VAE bleiben.',
        healthInsurance: 'Krankenversicherung',
        healthInsuranceText: 'Erforderlich. Muss entweder eine in den VAE registrierte oder eine internationale Krankenversicherung sein.',
        medicalEmirates: 'Medizinische Untersuchung & Emirates ID',
        medicalEmiratesText: 'Ihre physische Anwesenheit ist sowohl für die medizinische Untersuchung als auch für den Emirates ID-Termin erforderlich. Wir werden die Termine für Sie vereinbaren, und ein erfahrenes Mitglied unseres Teams wird Sie begleiten. Ihr Originalpass ist für beide Termine erforderlich.'
      },
      propertyInvestment: {
        minProperty: 'Mindestwert der Immobilie',
        minPropertyText: 'AED 2.000.000 pro Person. Gemeinsames Eigentum ist erlaubt.\nImmobilien im Bau erfordern eine NOC (Unbedenklichkeitsbescheinigung) und Zahlungsplan vom Entwickler.',
        propertyTypes: 'Berechtigte Immobilienarten',
        propertyTypesText: 'Nur Villen und Wohnungen sind berechtigt.'
      },
      timeDeposit: {
        minDeposit: 'Mindesteinlage',
        minDepositText: 'Eine Festeinlage von AED 2.000.000 bei einer VAE-Bank ist erforderlich, mindestens 2 Jahre angelegt.',
        residencyReq: 'Aufenthaltsanforderung',
        residencyReqText: 'Sie müssen bereits ein gültiges VAE-Aufenthaltsvisum besitzen und einen Nachweis über den Wohnsitz in Dubai erbringen.',
        acceptableDocs: 'Akzeptable Dokumente sind ein gültiger Ejari oder eine vom DLD (Dubai Land Department) ausgestellte Eigentumsurkunde.'
      },
      skilledEmployee: {
        education: 'Bildungsqualifikation',
        educationText: 'Bachelor- oder Master-Zertifikat mit Transcript. Erfordert einen mehrstufigen Prozess, der mit der Beglaubigung durch die VAE-Botschaft im Herkunftsland endet.',
        equivalency: 'Gleichwertigkeitszertifikat',
        equivalencyText: 'Dieses Dokument muss vom Kunden beim Bildungsministerium in Dubai eingeholt werden.',
        equivalencyLink: 'Link zur Website des Bildungsministeriums.',
        employment: 'Arbeitsunterlagen',
        employmentText: 'Arbeitsvertrag und Gehaltsbescheinigung mit einem monatlichen Mindestgehalt von AED 30.000.',
        freezoneNoc: 'Freizone NOC',
        freezoneNocText: 'Eine Unbedenklichkeitsbescheinigung von',
        freezoneSalary: 'Freizone Gehaltsbescheinigung',
        freezoneSalaryText: 'Eine Gehaltsbescheinigung von',
        companyNoc: 'Unternehmens-NOC',
        companyNocText: 'Eine Unbedenklichkeitsbescheinigung von Ihrem derzeitigen Arbeitgeber, in Englisch und Arabisch.',
        bankStatements: 'Kontoauszüge',
        bankStatementsText: '6 Monate persönliche Kontoauszüge, die ein monatliches Gehalt von AED 30.000 oder mehr widerspiegeln.',
        residenceProof: 'Wohnsitznachweis',
        residenceProofText: 'Gültiger Ejari oder Eigentumsurkunde.'
      },
      dependent: {
        marriageCert: 'Heiratsurkunde',
        marriageCertText: 'Erfordert einen mehrstufigen Prozess, der mit der Beglaubigung durch die VAE-Botschaft im Herkunftsland endet.',
        birthCert: 'Geburtsurkunde des Kindes',
        birthCertPlural: 'Geburtsurkunden der Kinder',
        birthCertText: 'Erfordert einen mehrstufigen Prozess, der mit der Beglaubigung durch die VAE-Botschaft im Herkunftsland endet.'
      }
    },
    costSummary: {
      titles: {
        propertyInvestment: 'Immobilieninvestition Golden Visa Zusammenfassung',
        timeDeposit: 'Termineinlage Golden Visa Zusammenfassung', 
        skilledEmployee: 'Qualifizierte Fachkraft Golden Visa Zusammenfassung',
        dependent: 'Angehörige Golden Visa Zusammenfassung',
        withDependents: (visaType: string, dependentType: string) => `${visaType} Golden Visa Zusammenfassung (Einschließlich ${dependentType})`,
        dependentSingle: 'Angehörige',
        dependentPlural: 'Angehörige'
      },
      descriptions: {
        standard: 'Dies stellt die Gesamtkosten für Ihren Golden Visa Antrag dar. Eine detaillierte Kostenaufschlüsselung finden Sie auf den folgenden Seiten für vollständige Transparenz.',
        dependent: 'Dies stellt die Gesamtkosten nur für Ihre Golden Visa Angehörigenservices dar. Eine detaillierte Kostenaufschlüsselung finden Sie auf den folgenden Seiten für vollständige Transparenz.'
      },
      tableHeaders: {
        description: 'Beschreibung',
        aed: 'AED',
        total: 'Summe'
      },
      costItems: {
        authorityCosts: 'Golden Visa Behördenkosten',
        nocCost: 'NOC (Unbedenklichkeitsbescheinigung) Kosten',
        salaryCertificate: 'Gehaltsbescheinigung Kosten',
        spouseVisa: 'Angehörige (Ehepartner) Visa Behördenkosten',
        childVisa: 'Angehörige (Kind) Visa Behördenkosten',
        childrenVisa: 'Angehörige (Kinder) Visa Behördenkosten',
        childrenCount: (count: number) => `(${count} Kinder)`,
        tmeServices: 'TME Services Beratungshonorar'
      }
    },
    signature: {
      agreedText: (date: string) => `Einverstanden mit dem obigen Angebot, ${date}`,
      signatureLabel: 'Unterschrift'
    },
    costsBreakdown: {
      pageTitle: 'Golden Visa Kostenaufschlüsselung',
      introText: 'Diese Seite bietet eine detaillierte Aufschlüsselung aller Behördenkosten, einschließlich der TME Services Beratungsgebühr, die für Ihren Golden Visa Antrag erforderlich sind. Jede Kostenkomponente ist für vollständige Transparenz im Antragsverfahren klar aufgelistet.',
      tableTitle: 'Golden Visa Kostenaufschlüsselung',
      serviceExplanations: 'Service-Erläuterungen',
      explanations: {
        professionalPassportPicture: 'Professionelle Passbilder: Offizielle biometrische Passfotos nach VAE-Standards für alle Visa-Anträge.',
        dldApprovalFee: 'DLD Genehmigungs-/Bewertungsgebühr: Für die Immobilienverifizierung und Genehmigung durch das Dubai Land Department (nur bei Immobilieninvestition Golden Visa).',
        mandatoryUaeMedicalTest: 'Pflicht-VAE-Medizintest: Erforderliche Gesundheitsuntersuchung für alle Visa-Antragsteller in zugelassenen Kliniken.',
        emiratesIdFee: 'Emirates ID Gebühr: Für die Ausstellung der obligatorischen Emirates ID-Karte für alle Einwohner der VAE.',
        immigrationResidencyFee: 'Einwanderungs-Aufenthaltsgebühr: Offizielle Regierungsgebühr für die Bearbeitung des Aufenthaltsvisa.',
        visaCancellationFee: 'Visa-Stornierungskosten: Für die Stornierung des bestehenden Visa-Status vor der Beantragung des neuen Golden Visa (falls zutreffend).',
        thirdPartyCosts: 'Drittanbieterkosten: Für zusätzliche Serviceleistungen Dritter und Verwaltungskosten.',
        tmeServicesFee: 'Umfasst die vollständige Verwaltung des Visa- und Emirates ID-Antragsverfahrens, einschließlich Dokumentenvorbereitung, Kontakt mit den zuständigen Behörden und persönlicher Begleitung durch ein erfahrenes TME Services Teammitglied zu allen erforderlichen Terminen.',
        dependentFileOpening: 'Angehörigen-Datei Eröffnungskosten: Für die Eröffnung der Angehörigen-Visa-Datei (gilt nur für den ersten Angehörigen).',
        dependentStandardCosts: 'Standard Behördenkosten Angehörige: Für Pflicht-VAE-Medizintest, Emirates ID und Einwanderungs-Aufenthaltsbearbeitung für Angehörige.',
        dependentTmeServices: 'TME Services Angehörige: Beratungshonorar für die Verwaltung des Angehörigen-Visa-Antragsverfahrens.',
        freezoneNocFee: 'Freizone NOC Gebühr: Unbedenklichkeitsbescheinigung von',
        freezoneSalaryCertificate: 'Freizone Gehaltsbescheinigung: Gehaltsbescheinigung von'
      }
    },
    dependentCosts: {
      pageTitle: 'Angehörige Visa Kostenaufschlüsselung',
      introText: 'Diese Seite bietet eine detaillierte Aufschlüsselung aller Behördenkosten, einschließlich der TME Services Beratungsgebühr, die für Ihren Angehörigen Golden Visa Antrag erforderlich sind. Jede Kostenkomponente ist für vollständige Transparenz im Antragsverfahren klar aufgelistet.',
      spouseVisaBreakdown: 'Ehepartner Visa Aufschlüsselung',
      childVisaBreakdown: 'Kinder Visa Aufschlüsselung',
      serviceExplanations: 'Service-Erläuterungen',
      explanations: {
        dependentFileOpening: 'Für die Eröffnung der Angehörigen-Visa-Datei (gilt nur für den ersten Angehörigen).',
        standardAuthorityCosts: 'Für Pflicht-VAE-Medizintest, Emirates ID und Einwanderungs-Aufenthaltsbearbeitung.',
        thirdPartyCosts: 'Von verschiedenen Abteilungen erhobene Verwaltungskosten.',
        tmeServicesProfessionalFee: 'Umfasst die vollständige Verwaltung des Visa- und Emirates ID-Antragsverfahrens, einschließlich Dokumentenvorbereitung, Kontakt mit den zuständigen Behörden und persönlicher Begleitung durch ein erfahrenes TME Services Teammitglied zu allen erforderlichen Terminen.',
        visaCancellation: 'Für die Stornierung des bestehenden Visa-Status vor der Beantragung des Angehörigen-Visa (falls zutreffend).'
      },
      serviceDescriptions: {
        dependentFileOpening: 'Angehörigen-Datei Eröffnungskosten',
        standardAuthorityCosts: 'Standard Behördenkosten',
        thirdPartyCosts: 'Drittanbieterkosten',
        tmeServicesProfessionalFee: 'TME Services Beratungsgebühr',
        visaCancellation: 'Visa-Stornierungskosten'
      }
    }
  }
} as const;

export type Locale = keyof typeof GOLDEN_VISA_TRANSLATIONS;