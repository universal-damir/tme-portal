// TME Portal Outlook Add-in JavaScript
// Handles form interactions, PDF generation, and email creation with Arial 10pt formatting

// Global variables
let currentDocumentType = 'cost-overview';
const API_BASE_URL = 'http://192.168.97.149:3000';

// Initialize Office Add-in
Office.onReady((info) => {
    if (info.host === Office.HostType.Outlook) {
        console.log('TME Portal Outlook Add-in loaded');
        initializeAddIn();
    }
});

// Initialize the add-in
function initializeAddIn() {
    console.log('Initializing TME Portal Add-in');
    
    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            switchTab(tabId);
        });
    });

    // Set up form validation
    setupFormValidation();
    
    // Initialize default tab
    switchTab('cost-overview');
}

// Switch between tabs
function switchTab(tabId) {
    currentDocumentType = tabId;
    
    // Update button states
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update form visibility
    document.querySelectorAll('.form-container').forEach(container => {
        container.classList.add('hidden');
    });
    document.getElementById(tabId).classList.remove('hidden');
    
    console.log(`Switched to tab: ${tabId}`);
}

// Set up form validation
function setupFormValidation() {
    // Add real-time email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', validateEmail);
    });
}

// Validate email format
function validateEmail(event) {
    const email = event.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        event.target.style.borderColor = '#cc0000';
        showMessage('Please enter a valid email address', 'error');
    } else {
        event.target.style.borderColor = '#243F7B';
    }
}

// Main function to generate document and send email
async function generateDocument(documentType) {
    try {
        console.log(`Starting document generation for: ${documentType}`);
        
        // Show loading state
        showLoading(true);
        hideMessages();

        // Collect and validate form data
        const formData = collectFormData(documentType);
        if (!validateFormData(formData, documentType)) {
            showLoading(false);
            return;
        }

        // Fetch email template from API
        const emailTemplate = await fetchEmailTemplate(documentType);
        if (!emailTemplate) {
            showLoading(false);
            return;
        }

        // Generate PDF
        const pdfResult = await generatePDF(formData, documentType);
        if (!pdfResult) {
            showLoading(false);
            return;
        }

        // Create email with attachment and formatting
        await createEmailWithAttachment(formData, pdfResult, emailTemplate, documentType);

        // Hide loading state
        showLoading(false);

        // Show success message
        showMessage('Email created successfully! Please review and send.', 'success');

    } catch (error) {
        console.error('Error generating document:', error);
        showLoading(false);
        showMessage(`Error generating document: ${error.message}`, 'error');
    }
}

// Collect form data based on document type
function collectFormData(documentType) {
    const prefix = getFieldPrefix(documentType);
    
    const baseData = {
        firstName: document.getElementById(`${prefix}-firstName`).value.trim(),
        lastName: document.getElementById(`${prefix}-lastName`).value.trim(),
        companyName: document.getElementById(`${prefix}-companyName`).value.trim(),
        email: document.getElementById(`${prefix}-email`).value.trim(),
        documentType: documentType,
        date: new Date().toISOString().split('T')[0]
    };

    // Add specific fields based on document type
    const specificFields = getSpecificFields(documentType, prefix);
    
    return { ...baseData, ...specificFields };
}

// Get field prefix for each document type
function getFieldPrefix(documentType) {
    const prefixes = {
        'cost-overview': 'co',
        'golden-visa': 'gv',
        'company-services': 'cs',
        'taxation': 'tax'
    };
    return prefixes[documentType];
}

// Get specific fields for each document type
function getSpecificFields(documentType, prefix) {
    const specificFields = {};
    
    switch (documentType) {
        case 'cost-overview':
            specificFields.authority = document.getElementById(`${prefix}-authority`).value;
            specificFields.notes = document.getElementById(`${prefix}-notes`).value.trim();
            break;
        case 'golden-visa':
            specificFields.visaType = document.getElementById(`${prefix}-visaType`).value;
            specificFields.investment = document.getElementById(`${prefix}-investment`).value.trim();
            specificFields.requirements = document.getElementById(`${prefix}-requirements`).value.trim();
            break;
        case 'company-services':
            specificFields.serviceType = document.getElementById(`${prefix}-serviceType`).value;
            specificFields.details = document.getElementById(`${prefix}-details`).value.trim();
            break;
        case 'taxation':
            specificFields.serviceType = document.getElementById(`${prefix}-serviceType`).value;
            specificFields.requirements = document.getElementById(`${prefix}-requirements`).value.trim();
            break;
    }
    
    return specificFields;
}

// Validate form data
function validateFormData(formData, documentType) {
    // Check required fields
    if (!formData.firstName && !formData.lastName && !formData.companyName) {
        showMessage('Please enter client name or company name.', 'error');
        return false;
    }

    if (!formData.email) {
        showMessage('Please enter client email address.', 'error');
        return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showMessage('Please enter a valid email address.', 'error');
        return false;
    }

    // Document-specific validation
    switch (documentType) {
        case 'cost-overview':
            if (!formData.authority) {
                showMessage('Please select an authority for the cost overview.', 'error');
                return false;
            }
            break;
        case 'golden-visa':
            if (!formData.visaType) {
                showMessage('Please select a visa type for the Golden Visa application.', 'error');
                return false;
            }
            break;
    }

    return true;
}

// Fetch email template from API
async function fetchEmailTemplate(documentType) {
    try {
        console.log(`Fetching email template for: ${documentType}`);
        
        const response = await fetch(`${API_BASE_URL}/api/outlook-addon/email-templates/${documentType}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch email template: ${response.status}`);
        }
        
        const template = await response.json();
        console.log('Email template fetched successfully');
        return template;
        
    } catch (error) {
        console.error('Error fetching email template:', error);
        showMessage('Error loading email template. Using default formatting.', 'error');
        
        // Return fallback template with Arial 10pt formatting
        return getFallbackTemplate(documentType);
    }
}

// Get fallback email template with Arial 10pt formatting
function getFallbackTemplate(documentType) {
    const templates = {
        'cost-overview': {
            subject: 'TME Cost Overview',
            greeting: 'Dear {firstName},',
            bodyContent: [
                'Please find attached the detailed cost overview for your business setup requirements.',
                'We look forward to discussing this further with you.'
            ],
            fontFamily: 'Arial, sans-serif',
            fontSize: '10pt'
        },
        'golden-visa': {
            subject: 'TME Golden Visa Application',
            greeting: 'Dear {firstName},',
            bodyContent: [
                'Please find your Golden Visa application details attached.',
                'We have prepared your documentation as discussed.'
            ],
            fontFamily: 'Arial, sans-serif',
            fontSize: '10pt'
        },
        'company-services': {
            subject: 'TME Company Services Proposal',
            greeting: 'Dear {firstName},',
            bodyContent: [
                'Please find attached the detailed proposal for your company services requirements.',
                'We look forward to discussing this further with you.'
            ],
            fontFamily: 'Arial, sans-serif',
            fontSize: '10pt'
        },
        'taxation': {
            subject: 'TME Taxation Services Proposal',
            greeting: 'Dear {firstName},',
            bodyContent: [
                'Please review the taxation services proposal attached to this email.',
                'Our team is available to answer any questions you may have.'
            ],
            fontFamily: 'Arial, sans-serif',
            fontSize: '10pt'
        }
    };
    
    return templates[documentType] || templates['cost-overview'];
}

// Generate PDF (calls your existing PDF generation API)
async function generatePDF(formData, documentType) {
    try {
        console.log(`Generating PDF for: ${documentType}`);
        
        // Call your existing PDF generation API
        const response = await fetch(`${API_BASE_URL}/api/pdf/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documentType: documentType,
                data: formData
            })
        });

        if (!response.ok) {
            throw new Error(`PDF generation failed: ${response.status}`);
        }

        const pdfBlob = await response.blob();
        const filename = getFileName(formData, documentType);

        // Download the PDF
        downloadBlob(pdfBlob, filename);

        console.log('PDF generated and downloaded successfully');
        return { blob: pdfBlob, filename: filename };
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        
        // Create fallback PDF for testing
        const fallbackPdf = createFallbackPDF(formData, documentType);
        const filename = getFileName(formData, documentType);
        
        downloadBlob(fallbackPdf, filename);
        
        return { blob: fallbackPdf, filename: filename };
    }
}

// Create fallback PDF for testing
function createFallbackPDF(formData, documentType) {
    const clientName = formData.companyName || `${formData.firstName} ${formData.lastName}`.trim();
    const date = new Date().toLocaleDateString();
    
    const content = `TME Portal - ${documentType.toUpperCase().replace('-', ' ')}

Client: ${clientName}
Email: ${formData.email}
Date: ${date}
Document Type: ${documentType}

This is a test document generated from TME Portal Outlook Add-in.
All emails will use Arial 10pt font with professional formatting.

Features:
- Blue text for professional information
- Red text for important notices  
- Green text for approved items
- Yellow text for pending items
- Bold and underline formatting options

[This is a placeholder. Your actual PDF generation will be integrated here.]
`;

    return new Blob([content], { type: 'application/pdf' });
}

// Get filename for the document
function getFileName(formData, documentType) {
    const clientName = formData.companyName || `${formData.firstName} ${formData.lastName}`.trim();
    const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '-');
    const typeMap = {
        'cost-overview': 'Cost-Overview',
        'golden-visa': 'Golden-Visa',
        'company-services': 'Company-Services',
        'taxation': 'Taxation'
    };
    
    const date = new Date().toISOString().split('T')[0];
    return `TME-${typeMap[documentType]}-${cleanName}-${date}.pdf`;
}

// Download blob as file
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Create email with attachment using Outlook API
async function createEmailWithAttachment(formData, pdfResult, emailTemplate, documentType) {
    try {
        console.log('Creating email with attachment and Arial 10pt formatting');
        
        const { blob, filename } = pdfResult;
        const clientName = formData.companyName || `${formData.firstName} ${formData.lastName}`.trim();
        
        // Convert blob to base64 for attachment
        const base64Data = await blobToBase64(blob);
        
        // Process template with form data
        const processedTemplate = processEmailTemplate(emailTemplate, formData);
        
        // Create formatted email body with Arial 10pt
        const emailBody = createFormattedEmailBody(processedTemplate, formData);
        
        // Create email using Outlook API
        Office.context.mailbox.displayNewMessageForm({
            toRecipients: [{
                displayName: clientName,
                emailAddress: formData.email
            }],
            subject: processedTemplate.subject || `TME ${documentType.replace('-', ' ')} - ${clientName}`,
            htmlBody: emailBody,
            attachments: [{
                type: 'file',
                name: filename,
                content: base64Data
            }]
        });
        
        console.log('Email created successfully with Arial 10pt formatting');
        
    } catch (error) {
        console.error('Error creating email:', error);
        throw new Error(`Failed to create email: ${error.message}`);
    }
}

// Process email template with form data
function processEmailTemplate(template, formData) {
    const firstName = formData.firstName || 'Client';
    const lastName = formData.lastName || '';
    const companyName = formData.companyName || '';
    
    // Replace template variables
    const processText = (text) => {
        return text
            .replace(/{firstName}/g, firstName)
            .replace(/{lastName}/g, lastName)
            .replace(/{companyName}/g, companyName);
    };
    
    return {
        ...template,
        greeting: processText(template.greeting || `Dear ${firstName},`),
        bodyContent: template.bodyContent?.map(processText) || [],
        subject: processText(template.subject || 'TME Document')
    };
}

// Create formatted email body with Arial 10pt and color options
function createFormattedEmailBody(template, formData) {
    const fontFamily = template.fontFamily || 'Arial, sans-serif';
    const fontSize = template.fontSize || '10pt';
    
    // Base email styling - Arial 10pt
    const baseStyle = `font-family: ${fontFamily}; font-size: ${fontSize}; line-height: 1.4; color: #000000;`;
    
    let emailBody = `
        <div style="${baseStyle}">
            <p style="margin-bottom: 12px;">${template.greeting}</p>
    `;
    
    // Add body content with formatting options
    if (template.bodyContent && template.bodyContent.length > 0) {
        template.bodyContent.forEach(content => {
            // Check if content already has HTML formatting
            if (content.includes('<span') || content.includes('<p') || content.includes('<div')) {
                // Content already has HTML formatting, preserve it but ensure Arial 10pt
                const formattedContent = content.replace(
                    /style="([^"]*)"/g, 
                    `style="$1 font-family: ${fontFamily}; font-size: ${fontSize};"`
                );
                emailBody += `<p style="margin-bottom: 8px;">${formattedContent}</p>`;
            } else {
                // Plain text content, apply base formatting
                emailBody += `<p style="margin-bottom: 8px;">${content}</p>`;
            }
        });
    }
    
    // Add signature
    emailBody += `
            <br>
            <p style="margin-bottom: 8px;">Best regards,</p>
            <p style="margin-bottom: 4px;"><strong>TME Services Team</strong></p>
            <p style="margin-bottom: 0; font-size: 9pt; color: #666;">
                <em>This email was generated using TME Portal with professional Arial 10pt formatting</em>
            </p>
        </div>
    `;
    
    return emailBody;
}

// Convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Show/hide loading state
function showLoading(show) {
    const loading = document.getElementById('loading');
    const forms = document.querySelectorAll('.form-container');
    const tabs = document.querySelectorAll('.tab-button');
    
    if (show) {
        loading.style.display = 'block';
        forms.forEach(form => {
            form.style.opacity = '0.5';
            form.style.pointerEvents = 'none';
        });
        tabs.forEach(tab => {
            tab.style.pointerEvents = 'none';
        });
    } else {
        loading.style.display = 'none';
        forms.forEach(form => {
            form.style.opacity = '1';
            form.style.pointerEvents = 'auto';
        });
        tabs.forEach(tab => {
            tab.style.pointerEvents = 'auto';
        });
    }
}

// Show message to user
function showMessage(message, type) {
    const messageElement = document.getElementById(`${type}-message`);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Hide all messages
function hideMessages() {
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
}

// Utility function to format text with colors and styles
function formatText(text, color, styles = []) {
    let styleString = 'font-family: Arial, sans-serif; font-size: 10pt;';
    
    // Add color
    if (color) {
        const colors = {
            blue: '#0066cc',
            red: '#cc0000',
            green: '#006600',
            yellow: '#DAA520',
            black: '#000000',
            tmePrimary: '#243F7B',
            tmeSecondary: '#D2BC99'
        };
        styleString += ` color: ${colors[color] || color};`;
    }
    
    // Add styles
    if (styles.includes('bold')) {
        styleString += ' font-weight: bold;';
    }
    if (styles.includes('underline')) {
        styleString += ' text-decoration: underline;';
    }
    if (styles.includes('italic')) {
        styleString += ' font-style: italic;';
    }
    
    return `<span style="${styleString}">${text}</span>`;
}

// Export utility functions for external use
window.TMEPortal = {
    formatText: formatText,
    generateDocument: generateDocument,
    switchTab: switchTab
};

console.log('TME Portal Outlook Add-in JavaScript loaded successfully');