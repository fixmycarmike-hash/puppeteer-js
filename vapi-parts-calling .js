/**
 * VAPI Parts Calling Integration
 * 
 * Manages automated phone calls to parts stores using VAPI
 * ALEX calls stores to get pricing and availability
 */

const partsStoreDirectory = require('./parts-store-directory');

class VAPIPartsCallingService {
  constructor() {
    this.vapiApiKey = process.env.VAPI_API_KEY;
    this.vapiPhoneId = process.env.VAPI_PHONE_ID;
    this.callsInProgress = new Map();
    this.callHistory = [];
  }

  /**
   * Make a phone call to a parts store
   */
  async callStore(storeId, partRequest) {
    try {
      const store = partsStoreDirectory.getStoreById(storeId);
      if (!store) {
        throw new Error(`Store not found: ${storeId}`);
      }

      if (store.isOnlineOnly) {
        throw new Error(`Cannot call online-only store: ${store.name}`);
      }

      const phoneNumber = partsStoreDirectory.getFormattedPhoneNumber(storeId);
      
      console.log(`📞 ALEX calling ${store.name} at ${phoneNumber}`);
      console.log(`🔧 Part requested: ${JSON.stringify(partRequest)}`);

      // Generate the conversation script
      const script = this.generateConversationScript(partRequest, store);

      // Create VAPI call (this would use the actual VAPI API)
      const callResult = await this.initiateVAPICall(phoneNumber, script);
      
      // Track the call
      const callId = `call-${Date.now()}`;
      this.callsInProgress.set(callId, {
        callId,
        storeId,
        storeName: store.name,
        phoneNumber,
        partRequest,
        startTime: new Date(),
        status: 'in-progress'
      });

      return {
        success: true,
        callId,
        storeName: store.name,
        phoneNumber,
        message: `ALEX is now calling ${store.name} to get pricing and availability`
      };

    } catch (error) {
      console.error('Error calling store:', error);
      throw error;
    }
  }

  /**
   * Call multiple stores for comparison
   */
  async callMultipleStores(storeIds, partRequest) {
    const callPromises = storeIds.map(storeId => 
      this.callStore(storeId, partRequest)
    );

    try {
      const results = await Promise.allSettled(callPromises);
      
      const successfulCalls = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      const failedCalls = results
        .filter(result => result.status === 'rejected')
        .map(result => ({ error: result.reason.message }));

      return {
        totalCalls: storeIds.length,
        successfulCalls: successfulCalls.length,
        failedCalls: failedCalls.length,
        calls: successfulCalls,
        errors: failedCalls
      };

    } catch(error) {
      console.error('Error calling multiple stores:', error);
      throw error;
    }
  }

  /**
   * Generate conversation script for the call
   */
  generateConversationScript(partRequest, store) {
    const { partName, partNumber, year, make, model } = partRequest;

    const script = {
      instructions: `You are ALEX, a professional automotive service advisor calling ${store.name}. 
        You need to get pricing and availability information for a part.
        Be polite, professional, and direct.
        Ask for the specific part information.
        Listen carefully to the response and note:
        1. Price
        2. Availability (in stock, special order, delivery time)
        3. Brand/quality level
        4. Any warranties or guarantees
        5. Store location if multiple locations exist
        Thank the store for their help.`,

      opening: `Hi, this is Alex calling from VHICL Pro Auto Service. I'm looking for a price quote.`,

      request: `I need pricing and availability for a ${partName}${partNumber ? `, part number ${partNumber}` : ''} for a ${year} ${make} ${model}. Could you tell me if you have that in stock and what the price would be?`,

      followUpQuestions: [
        'Do you have that part in stock right now?',
        'How long would it take to get it if it needs to be ordered?',
        'Is that the standard quality or OEM equivalent?',
        'Is there a warranty on this part?',
        'Do you offer any discounts for professional shops?'
      ],

      closing: `Thank you very much for your help. I appreciate the information. Have a great day!`
    };

    return script;
  }

  /**
   * Initiate VAPI call (placeholder - would use actual VAPI API)
   */
  async initiateVAPICall(phoneNumber, script) {
    // This is a placeholder for the actual VAPI API call
    // In production, this would make a real phone call using VAPI
    
    console.log('📞 Simulating VAPI call to:', phoneNumber);
    console.log('📝 Script:', script);
    
    // Simulate a call for testing
    return {
      callId: `vapi-${Date.now()}`,
      phoneNumber,
      status: 'initiated',
      message: 'Call initiated successfully'
    };
  }

  /**
   * Process call response and extract pricing information
   */
  async processCallResponse(callId, transcription) {
    try {
      const call = this.callsInProgress.get(callId);
      if (!call) {
        throw new Error(`Call not found: ${callId}`);
      }

      console.log(`📝 Processing response for call ${callId}`);
      console.log(`📝 Transcription: ${transcription}`);

      // Extract pricing and availability from transcription
      const parsedData = this.extractPricingFromTranscription(transcription);

      // Update call status
      call.status = 'completed';
      call.endTime = new Date();
      call.transcription = transcription;
      call.parsedData = parsedData;

      // Add to history
      this.callHistory.push(call);
      
      // Remove from in-progress
      this.callsInProgress.delete(callId);

      return {
        success: true,
        callId,
        storeName: call.storeName,
        pricing: parsedData,
        message: 'Call processed successfully'
      };

    } catch (error) {
      console.error('Error processing call response:', error);
      throw error;
    }
  }

  /**
   * Extract pricing and availability from transcribed call
   */
  extractPricingFromTranscription(transcription) {
    // This would use AI (GPT-4) to intelligently parse the conversation
    // For now, we'll use regex patterns as a placeholder
    
    const pricePattern = /\$?(\d+\.?\d*)/;
    const inStockPattern = /in stock|available now|have it/i;
    const specialOrderPattern = /special order|order it|need to order|(\d+)\s*(day|days|week|weeks)/i;
    
    const priceMatch = transcription.match(pricePattern);
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;
    
    let availability = 'unknown';
    let deliveryTime = null;

    if (inStockPattern.test(transcription)) {
      availability = 'in stock';
      deliveryTime = 0; // Same day
    } else {
      const timeMatch = transcription.match(/(\d+)\s*(day|days|hour|hours|week|weeks)/i);
      if (timeMatch) {
        availability = 'special order';
        deliveryTime = parseInt(timeMatch[1]);
      }
    }

    return {
      price,
      availability,
      deliveryTime,
      confidence: price ? 0.8 : 0.3,
      rawTranscription: transcription
    };
  }

  /**
   * Get call history
   */
  getCallHistory(filters = {}) {
    let history = [...this.callHistory];

    if (filters.storeId) {
      history = history.filter(call => call.storeId === filters.storeId);
    }

    if (filters.status) {
      history = history.filter(call => call.status === filters.status);
    }

    if (filters.startDate) {
      history = history.filter(call => call.startTime >= filters.startDate);
    }

    if (filters.endDate) {
      history = history.filter(call => call.startTime <= filters.endDate);
    }

    return history.reverse(); // Most recent first
  }

  /**
   * Get calls in progress
   */
  getCallsInProgress() {
    return Array.from(this.callsInProgress.values());
  }

  /**
   * Cancel an in-progress call
   */
  async cancelCall(callId) {
    const call = this.callsInProgress.get(callId);
    if (!call) {
      throw new Error(`Call not found: ${callId}`);
    }

    // This would call VAPI API to cancel the call
    call.status = 'cancelled';
    call.endTime = new Date();

    this.callsInProgress.delete(callId);

    return {
      success: true,
      callId,
      message: 'Call cancelled successfully'
    };
  }

  /**
   * Get call statistics
   */
  getCallStatistics() {
    const completedCalls = this.callHistory.filter(call => call.status === 'completed');
    const averageCallDuration = this.calculateAverageCallDuration(completedCalls);
    const successRate = completedCalls.length / Math.max(this.callHistory.length, 1) * 100;

    return {
      totalCalls: this.callHistory.length,
      completedCalls: completedCalls.length,
      inProgressCalls: this.callsInProgress.size,
      averageCallDuration,
      successRate: successRate.toFixed(2) + '%'
    };
  }

  /**
   * Calculate average call duration
   */
  calculateAverageCallDuration(calls) {
    if (calls.length === 0) return '0:00';

    const totalDuration = calls.reduce((sum, call) => {
      return sum + (call.endTime - call.startTime);
    }, 0);

    const avgDurationMs = totalDuration / calls.length;
    const avgDurationSeconds = Math.floor(avgDurationMs / 1000);
    const minutes = Math.floor(avgDurationSeconds / 60);
    const seconds = avgDurationSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

module.exports = VAPIPartsCallingService;
