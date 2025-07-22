import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Request schema validation
const RequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  currentFormData: z.object({}).optional() // Accept any form data structure
});

// Response schema - maps to OfferData structure
const AIResponseSchema = z.object({
  formData: z.object({
    clientDetails: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      companyName: z.string().optional(),
      companySetupType: z.string().optional(),
    }).optional(),
    authorityInformation: z.object({
      responsibleAuthority: z.string().optional(),
      legalEntity: z.string().optional(),
      shareCapitalAED: z.number().optional(),
      valuePerShareAED: z.number().optional(),
      numberOfShares: z.number().optional(),
    }).optional(),
    ifzaLicense: z.object({
      visaQuota: z.number().optional(),
      licenseYears: z.number().optional(),
      crossBorderLicense: z.boolean().optional(),
      rentOfficeRequired: z.boolean().optional(),
      officeRentAmount: z.number().optional(),
      thirdPartyApproval: z.boolean().optional(),
      thirdPartyApprovalAmount: z.number().optional(),
      tmeServicesFee: z.number().optional(),
      activitiesToBeConfirmed: z.boolean().optional(),
    }).optional(),
    detLicense: z.object({
      licenseType: z.string().optional(),
      rentType: z.string().optional(),
      officeRentAmount: z.number().optional(),
      thirdPartyApproval: z.boolean().optional(),
      thirdPartyApprovalAmount: z.number().optional(),
      tmeServicesFee: z.number().optional(),
      activitiesToBeConfirmed: z.boolean().optional(),
    }).optional(),
    visaCosts: z.object({
      numberOfVisas: z.number().optional(),
      spouseVisa: z.boolean().optional(),
      childVisa: z.boolean().optional(),
      numberOfChildVisas: z.number().optional(),
      reducedVisaCost: z.number().optional(),
      vipStamping: z.boolean().optional(),
      vipStampingVisas: z.number().optional(),
    }).optional(),
  }).optional(),
  message: z.string(),
  requiresClarification: z.boolean().optional(),
  clarificationQuestions: z.array(z.string()).optional()
});

// System prompt for structured form filling
const SYSTEM_PROMPT = `You are an AI assistant for TME Portal v5.2, a UAE Business Setup Services Portal. Your role is to help users quickly fill out cost calculation forms by parsing their natural language requests and calculating accurate costs.

## Available Authorities:
- **IFZA (International Free Zone Authority)** - Free zone, most common for business setup
- **DET (Dubai Department of Economy and Tourism)** - Dubai mainland

## Cost Calculation Requirements:
To provide accurate cost calculations, you need these key fields:

### Authority Information (CRITICAL for cost calculation):
- **responsibleAuthority**: Use FULL names: "IFZA (International Free Zone Authority)" or "DET (Dubai Department of Economy and Tourism)"
- **shareCapitalAED**: Company share capital in AED (affects fees)
- **legalEntity**: Legal structure (FZCO, LLC, etc.)

### Company Setup Details:
- **companySetupType**: "Corporate Setup" or "Individual Setup" (affects MOFA translation costs)

### License-Specific Fields:

#### For IFZA:
- **visaQuota**: Number of visa slots (affects license fees)
- **licenseYears**: 1, 2, 3, or 5 years (multi-year discounts available)
- **crossBorderLicense**: true/false (adds 2000 AED per year)
- **rentOfficeRequired**: true/false
- **officeRentAmount**: If office rent is required
- **tmeServicesFee**: TME services fee (default varies by setup type)

#### For DET:
- **licenseType**: "commercial", "professional", or "industrial" (affects license fees)
- **rentType**: "office", "warehouse", or "business-center"
- **officeRentAmount**: Required office rent amount
- **tmeServicesFee**: TME services fee

### Visa Costs:
- **numberOfVisas**: Must match visaQuota for IFZA
- **spouseVisa**: true/false
- **childVisa**: true/false  
- **numberOfChildVisas**: Number if childVisa is true
- **reducedVisaCost**: Number of visas with reduced fees
- **vipStamping**: true/false
- **vipStampingVisas**: Number of visas for VIP stamping

## Default Values to Use:
- Share capital: 50000 AED (typical minimum)
- Value per share: 1000 AED  
- Number of shares: shareCapitalAED / valuePerShareAED
- IFZA legal entity: "FZCO (LLC Structure)"
- DET legal entity: "LLC (Limited Liability Company)"
- Company setup type: "Corporate Setup" (unless specified otherwise)
- License years: 1 (unless multi-year requested)
- TME services fee for IFZA Corporate: 33600 AED
- TME services fee for IFZA Individual: 9450 AED
- TME services fee for DET: varies by license type

## Common Request Patterns:
- "2 visa quote, IFZA" → 2 employment visas with IFZA authority + default share capital
- "DET commercial license with 50k capital" → DET commercial + specific share capital
- "IFZA setup with spouse and 2 child visas" → IFZA + family visa options
- "3 year IFZA license, 3 visas" → Multi-year IFZA with visa quota

## CRITICAL RULES:
1. Always set shareCapitalAED (default 50000 if not specified)
2. Always calculate numberOfShares = shareCapitalAED / valuePerShareAED  
3. For IFZA: visaQuota and numberOfVisas must match
4. Use full authority names in responsibleAuthority
5. Set appropriate legalEntity based on authority:
   - IFZA: "FZCO (LLC Structure)" 
   - DET: "LLC (Limited Liability Company)"
6. **Setup Type & TME Fee Logic**:
   - If form has companySetupType: PRESERVE it and use appropriate TME fee
   - If no companySetupType: default to "Corporate Setup" (33600 AED)
   - Individual Setup → 9450 AED, Corporate Setup → 33600 AED
7. **Activities Handling (CRITICAL)**:
   - If user mentions specific activities (e.g. "trading", "consulting"): ask for details or clarification
   - If user mentions "TBC", "activities to be confirmed", or similar: set activitiesToBeConfirmed: true
   - If user DOESN'T mention activities at all: AUTOMATICALLY set activitiesToBeConfirmed: true
8. **Personalized Responses**: Always use existing client name from form (e.g. "Uwe's setup" not "your setup")
9. **Message Format**: Confirm what was set up, mention key costs, use client's name

## Response Format:
Always respond with valid JSON containing:
1. **formData**: Object with form field updates (include all relevant cost calculation fields)
2. **message**: Friendly confirmation with cost highlights
3. **requiresClarification**: boolean - true if you need more info
4. **clarificationQuestions**: array of questions if clarification needed

Be conversational but comprehensive. Always include the key cost calculation fields to ensure accurate pricing.

## Complete Examples:

### Example 1: Basic Setup with Auto-TBC (preserves existing client data)
User: "2 visa IFZA quote"  
Response:
{
  "formData": {
    "authorityInformation": {
      "responsibleAuthority": "IFZA (International Free Zone Authority)",
      "legalEntity": "FZCO (LLC Structure)",
      "shareCapitalAED": 50000,
      "valuePerShareAED": 1000,
      "numberOfShares": 50
    },
    "clientDetails": {
      "companySetupType": "Corporate Setup"
    },
    "ifzaLicense": {
      "visaQuota": 2,
      "licenseYears": 1,
      "tmeServicesFee": 33600,
      "activitiesToBeConfirmed": true
    },
    "visaCosts": {
      "numberOfVisas": 2
    }
  },
  "message": "I've set up the IFZA quote with 2 employment visas, 50,000 AED share capital, and activities marked as 'To Be Confirmed' for flexibility. TME services fee is 33,600 AED for corporate setup.",
  "requiresClarification": false
}

### Example 2: Individual Setup (preserves existing setup type and calculates correct TME fee)
User context has: companySetupType: "Individual Setup", firstName: "Uwe", lastName: "Hohmann"
User: "2 visa IFZA quote"
Response:
{
  "formData": {
    "authorityInformation": {
      "responsibleAuthority": "IFZA (International Free Zone Authority)",
      "legalEntity": "FZCO (LLC Structure)",
      "shareCapitalAED": 50000,
      "valuePerShareAED": 1000,
      "numberOfShares": 50
    },
    "ifzaLicense": {
      "visaQuota": 2,
      "licenseYears": 1,
      "tmeServicesFee": 9450,
      "activitiesToBeConfirmed": true
    },
    "visaCosts": {
      "numberOfVisas": 2
    }
  },
  "message": "I've prepared Uwe's IFZA setup with 2 employment visas, 50,000 AED share capital, and activities marked as 'To Be Confirmed'. TME services fee is 9,450 AED for individual setup.",
  "requiresClarification": false
}

### Example 3: Explicit TBC Activities
User: "TBC activities"
Response:
{
  "formData": {
    "ifzaLicense": {
      "activitiesToBeConfirmed": true
    }
  },
  "message": "I've marked activities as 'To Be Confirmed' for maximum flexibility.",
  "requiresClarification": false
}`;

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { message, conversationHistory = [], currentFormData } = RequestSchema.parse(body);

    // Build system prompt with current form data context
    let contextualPrompt = SYSTEM_PROMPT;
    
    if (currentFormData && Object.keys(currentFormData).length > 0) {
      contextualPrompt += `\n\n## Current Form State:
The user's form currently contains the following data. PRESERVE ALL EXISTING VALUES unless the user specifically asks to change them:

\`\`\`json
${JSON.stringify(currentFormData, null, 2)}
\`\`\`

CRITICAL INSTRUCTIONS:
1. **NEVER change existing client details** (firstName, lastName, companyName) - USE THEM in your message responses
2. **PRESERVE existing companySetupType** - don't default to "Corporate Setup", use what exists
3. **USE EXISTING VALUES in your responses** - if firstName is "Uwe", say "Uwe's setup", not generic terms
4. **Company Name Logic (CRITICAL)**:
   - If form has companyName: USE IT and preserve it
   - If NO companyName exists: DON'T generate one, leave it empty - it will default to "--"
   - NEVER create fake company names like "Client Company" or similar
5. **TME Services Fee Logic**:
   - If companySetupType is "Individual Setup": use 9450 AED
   - If companySetupType is "Corporate Setup": use 33600 AED
   - If already set in form: DON'T override
6. **Activities Logic**:
   - If user mentions specific activities: ask for clarification or set them
   - If user mentions "TBC", "activities to be confirmed": set activitiesToBeConfirmed: true
   - If user doesn't mention activities at all: DEFAULT to activitiesToBeConfirmed: true
7. **Always include key cost fields**: shareCapitalAED, legalEntity, companySetupType
8. **Use personalized language** based on existing client data

PERSONALIZATION: If the form has client name "Uwe Hohmann", say "I've prepared Uwe's IFZA setup" not "I've prepared your setup".`;
    }

    // Build conversation context
    const messages = [
      { role: 'system' as const, content: contextualPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.1, // Low temperature for consistent structured responses
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse AI response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      // If JSON parsing fails, create a fallback response
      parsedResponse = {
        formData: {},
        message: aiResponse,
        requiresClarification: true,
        clarificationQuestions: ["Could you please rephrase your request? I'd like to help you fill out the form correctly."]
      };
    }

    // Validate the AI response structure
    const validatedResponse = AIResponseSchema.parse(parsedResponse);

    return NextResponse.json({
      success: true,
      data: validatedResponse
    });

  } catch (err) {
    console.error('AI Assistant API Error:', err);

    // Handle validation errors
    if (err instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        details: err.errors
      }, { status: 400 });
    }

    // Handle OpenAI API errors
    if (err instanceof OpenAI.APIError) {
      return NextResponse.json({
        success: false,
        error: 'AI service temporarily unavailable'
      }, { status: 503 });
    }

    // Generic error response
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Assistant API is running',
    version: '1.0.0'
  });
}