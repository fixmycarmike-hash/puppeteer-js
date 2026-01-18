/**
 * Shop Settings Service
 * Centralized management for shop-specific configuration
 */

class ShopSettingsService {
  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from environment variables
   */
  loadSettings() {
    return {
      // ============================================================
      // SHOP INFORMATION
      // ============================================================
      shopName: process.env.SHOP_NAME || 'Your Shop Name',
      shopPhone: process.env.SHOP_PHONE || '555-123-4567',
      shopAddress: process.env.SHOP_ADDRESS || '123 Main Street',
      shopEmail: process.env.SHOP_EMAIL || 'contact@example.com',
      
      // ============================================================
      // API CONFIGURATION (Shop-Specific Credentials)
      // ============================================================
      
      // SendGrid Configuration (for email notifications)
      sendGridApiKey: process.env.SENDGRID_API_KEY || '',
      sendGridFromEmail: process.env.EMAIL_FROM || '',
      sendGridFromName: process.env.EMAIL_FROM_NAME || '',
      
      // VAPI Configuration (for ALEX voice calling)
      vapiApiKey: process.env.VAPI_API_KEY || '',
      vapiPhoneId: process.env.VAPI_PHONE_ID || '',
      vapiPhoneNumber: process.env.VAPI_PHONE_NUMBER || '',
      
      // ============================================================
      // SERVER CONFIGURATION
      // ============================================================
      serverPort: parseInt(process.env.PORT) || 3000,
      allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000',
      
      // ============================================================
      // PAYPAL CONFIGURATION
      // ============================================================
      paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
      paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      
      // ============================================================
      // SMTP CONFIGURATION (Fallback for email)
      // ============================================================
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: process.env.SMTP_PORT || '587',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      
      // ============================================================
      // BUSINESS HOURS
      // ============================================================
      shopHours: 'Mon-Fri: 8am-5pm, Sat: 8am-12pm',
      
      // ============================================================
      // PRICING
      // ============================================================
      taxRate: parseFloat(process.env.TAX_RATE) || 0.08, // 8% default tax rate
      laborRate: parseFloat(process.env.LABOR_RATE) || 95, // $95 per hour default
      diagnosticFee: parseFloat(process.env.DIAGNOSTIC_FEE) || 95,
      
      // ============================================================
      // ALEX AI ASSISTANT SETTINGS
      // ============================================================
      enableAlex: process.env.ENABLE_ALEX === 'true' || true,
      alexAutoCallStores: process.env.ALEX_AUTO_CALL_STORES === 'true' || true,
      alexMaxStoresToCall: parseInt(process.env.ALEX_MAX_STORES) || 3,
      alexCallTimeoutMinutes: parseInt(process.env.ALEX_CALL_TIMEOUT) || 10,
      
      // Smart quote selection weights (should add up to 1.0)
      alexSelectionWeights: {
        price: parseFloat(process.env.ALEX_WEIGHT_PRICE) || 0.30,
        availability: parseFloat(process.env.ALEX_WEIGHT_AVAILABILITY) || 0.25,
        delivery: parseFloat(process.env.ALEX_WEIGHT_DELIVERY) || 0.20,
        quality: parseFloat(process.env.ALEX_WEIGHT_QUALITY) || 0.15,
        relationship: parseFloat(process.env.ALEX_WEIGHT_RELATIONSHIP) || 0.10
      },
      
      // Customer contact settings
      alexAutoContactCustomers: process.env.ALEX_AUTO_CONTACT === 'true' || true,
      alexContactMethod: process.env.ALEX_CONTACT_METHOD || 'phone',
      alexFollowUpAttempts: parseInt(process.env.ALEX_FOLLOWUP_ATTEMPTS) || 3,
      
      // Order approval settings
      alexRequireJobApproval: process.env.ALEX_REQUIRE_APPROVAL === 'true' || true,
      alexAutoOrderOnApproval: process.env.ALEX_AUTO_ORDER === 'true' || true,
      
      // ============================================================
      // INTEGRATION STATUS (Auto-detected)
      // ============================================================
      sendGridConfigured: !!(process.env.SENDGRID_API_KEY),
      vapiConfigured: !!(process.env.VAPI_API_KEY && process.env.VAPI_PHONE_ID),
      alexEnabled: !!(process.env.VAPI_API_KEY && process.env.VAPI_PHONE_ID)
    };
  }

  /**
   * Get all shop settings
   */
  getSettings() {
    return this.settings;
  }

  /**
   * Update shop settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update integration status based on new settings
    this.settings.sendGridConfigured = !!(this.settings.sendGridApiKey);
    this.settings.vapiConfigured = !!(this.settings.vapiApiKey && this.settings.vapiPhoneId);
    this.settings.alexEnabled = !!(this.settings.vapiApiKey && this.settings.vapiPhoneId);
    
    return this.settings;
  }
  
  /**
   * Get environment variables as a string for display
   */
  getEnvVarsSummary() {
    return {
      shopName: this.settings.shopName,
      sendGridConfigured: this.settings.sendGridConfigured,
      vapiConfigured: this.settings.vapiConfigured,
      alexEnabled: this.settings.alexEnabled,
      serverPort: this.settings.serverPort
    };
  }
  
  /**
   * Validate required settings
   */
  validateSettings() {
    const errors = [];
    const warnings = [];
    
    // Check required settings
    if (!this.settings.shopName || this.settings.shopName === 'Your Shop Name') {
      warnings.push('Shop name should be customized');
    }
    
    // Check email configuration
    if (!this.settings.sendGridApiKey) {
      warnings.push('SendGrid API key not configured - email notifications will not work');
    }
    
    // Check VAPI configuration
    if (!this.settings.vapiApiKey || !this.settings.vapiPhoneId) {
      errors.push('VAPI not configured - ALEX voice calling will not work');
    }
    
    // Check weights sum to 1.0
    const weightSum = Object.values(this.settings.alexSelectionWeights).reduce((a, b) => a + b, 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      warnings.push(`ALEX selection weights sum to ${weightSum}, should be 1.0`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate Alex's system prompt with shop branding
   */
  getAlexPrompt() {
    const { shopName, shopPhone, shopAddress, shopEmail, shopHours } = this.settings;
    
    return `You are Alex, the professional AI Service Advisor for ${shopName}. You are friendly, helpful, and knowledgeable about automotive services. Always introduce yourself as being from ${shopName}.

SHOP INFORMATION:
- Shop Name: ${shopName}
- Phone: ${shopPhone}
- Address: ${shopAddress}
- Email: ${shopEmail}
- Hours: ${shopHours}

YOUR ROLE:
You are the first point of contact for customers calling ${shopName}. Your job is to:
1. Help customers check their vehicle status
2. Book appointments
3. Provide estimates
4. Approve repairs
5. Take messages
6. Provide shop hours
7. Handle emergency situations (PANIC MODE)

PANIC MODE DETECTION:
If a customer uses words like "emergency", "panic", "help", "scared", "afraid", "dangerous", "unsafe", "worried", "freaking out", or expresses high anxiety, immediately switch to PANIC MODE PROTOCOL.

PANIC MODE PROTOCOL:
1. CALM ASSURANCE (IMMEDIATE):
   - Say: "I understand this is stressful. Please take a deep breath. I'm here to help you right now."
   - Say: "You're going to be okay. We're going to work through this together."
   - Ask: "Can you tell me your name and phone number?"
   - Tone: Calm, reassuring, confident, patient

2. ASSESS SAFETY (HIGHEST PRIORITY):
   - Ask: "Are you in a safe location right now?"
   - If not safe: "Please call 911 immediately and then call us back."
   - Ask: "Is anyone with you who can help?"
   - If alone: "Stay on the line with me."
   - Ask: "Is your vehicle in a safe location?"
   - If unsafe: "Let me know immediately."

3. GATHER ESSENTIAL INFO (HIGH PRIORITY):
   - Name: "What's your name, please?"
   - Phone: "What's the best phone number to reach you?"
   - Location: "Where are you right now?"
   - Vehicle: "What vehicle are you in?"

4. IMMEDIATE ACTION PLAN:
   - BROKEN DOWN IN UNSAFE LOCATION:
     * "Your safety is the priority. I'm going to arrange for your vehicle to be towed to our shop right now."
     * "Our towing partner will be there within 30 minutes."
     * "Please stay with your vehicle if it's safe to do so."
   - BROKEN DOWN IN SAFE LOCATION:
     * "Since you're in a safe location, we can send someone to pick you up or arrange for your vehicle to be brought to our shop."
     * "What would work better for you?"
   - SAFETY CONCERN:
     * "I don't want you to drive if you don't feel safe."
     * "Please don't try to drive the vehicle."
     * "Let me arrange to have it towed to our shop."
   - FINANCIAL PANIC:
     * "I understand cost is a concern."
     * "We'll take care of you first, and we can work out payment arrangements."
     * "Your safety comes first."

5. PROVIDE SHOP CONTACT:
   - "You can reach us at ${shopPhone}"
   - "We're located at ${shopAddress}"
   - "Our shop name is ${shopName}"

6. SET EXPECTATIONS:
   - "I'll have someone reach out to you within 1 hour to confirm details."
   - "Once your vehicle arrives at our shop, we'll assess it immediately and give you a call."

CLOSING REASSURANCE:
- "You're going to be okay. We're going to take care of you and your vehicle."
- "Is there anything else I can help you with right now?"
- "You can call us anytime at ${shopPhone} if you need anything."

NORMAL INTRODUCTION (Non-Panic Mode):
"Thank you for calling ${shopName}! This is Alex, your service advisor. How can I help you today?"

CHECKING VEHICLE STATUS:
- Ask for phone number
- Look up vehicle information
- Provide status update
- If vehicle is being serviced, explain what's being done
- If no active service, ask if they'd like to schedule an appointment

BOOKING APPOINTMENTS:
- Ask for preferred date and time
- Check availability
- Confirm appointment details
- Send confirmation email

PROVIDING ESTIMATES:
- Ask about the issue or service needed
- Provide rough estimate if available
- Explain that detailed estimates require vehicle inspection
- Offer to schedule inspection

APPROVING REPAIRS:
- Confirm the work to be done
- Explain the cost
- Get customer approval
- Schedule the work

TAKING MESSAGES:
- Ask for name, phone, and message
- Confirm the message details
- Promise to deliver the message

PROVIDING SHOP HOURS:
- "We're open Monday through Friday from 8am to 5pm, and Saturday from 8am to 12pm."
- "We're closed on Sundays."

ALWAYS:
- Be friendly and professional
- Use the customer's name when possible
- Thank them for calling ${shopName}
- Provide accurate information
- If you don't know something, offer to find out and call back
- Keep responses concise and helpful

Remember: You are representing ${shopName}. Every interaction should be professional, helpful, and leave the customer feeling taken care of.`;
  }

  /**
   * Get email template data for a specific email type
   */
  getEmailTemplateData(templateType) {
    const { shopName, shopPhone, shopAddress, shopEmail } = this.settings;

    const templates = {
      checkinConfirmation: {
        subject: `Check-in Confirmation - ${shopName}`,
        shopName,
        shopPhone,
        shopAddress,
        shopEmail,
      },
      estimateReady: {
        subject: `Your Estimate is Ready - ${shopName}`,
        shopName,
        shopPhone,
        shopAddress,
        shopEmail,
      },
      estimateApproved: {
        subject: `Estimate Approved - ${shopName}`,
        shopName,
        shopPhone,
        shopAddress,
        shopEmail,
      },
      partsOrdered: {
        subject: `Parts Ordered - ${shopName}`,
        shopName,
        shopPhone,
        shopAddress,
        shopEmail,
      },
      vehicleReady: {
        subject: `Your Vehicle is Ready! - ${shopName}`,
        shopName,
        shopPhone,
        shopAddress,
        shopEmail,
      },
      paymentConfirmation: {
        subject: `Payment Confirmation - ${shopName}`,
        shopName,
        shopPhone,
        shopAddress,
        shopEmail,
      },
    };

    return templates[templateType] || {};
  }

  /**
   * Validate settings
   */
  validateSettings() {
    const errors = [];

    if (!this.settings.shopName) {
      errors.push('Shop name is required');
    }
    if (!this.settings.shopPhone) {
      errors.push('Shop phone is required');
    }
    if (!this.settings.shopAddress) {
      errors.push('Shop address is required');
    }
    if (!this.settings.shopEmail) {
      errors.push('Shop email is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
const shopSettingsService = new ShopSettingsService();

module.exports = shopSettingsService;