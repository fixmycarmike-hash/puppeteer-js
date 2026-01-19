/**
 * VAPI Parts Ordering Integration
 * 
 * Handles calling back to order approved parts
 * Considers multiple factors beyond just price
 */

const partsStoreDirectory = require('./parts-store-directory');

class VAPIPartsOrderingService {
  constructor() {
    this.vapiApiKey = process.env.VAPI_API_KEY;
    this.vapiPhoneId = process.env.VAPI_PHONE_ID;
    this.ordersInProgress = new Map();
    this.orderHistory = [];
  }

  /**
   * Order parts from a store after job approval
   */
  async orderParts(storeId, orderDetails) {
    try {
      const store = partsStoreDirectory.getStoreById(storeId);
      if (!store) {
        throw new Error(`Store not found: ${storeId}`);
      }

      if (store.isOnlineOnly) {
        throw new Error(`Cannot order from online-only store by phone: ${store.name}`);
      }

      const phoneNumber = partsStoreDirectory.getFormattedPhoneNumber(storeId);
      
      console.log(`📞 ALEX calling ${store.name} to order parts`);
      console.log(`📦 Order details:`, orderDetails);

      // Generate the ordering script
      const script = this.generateOrderingScript(orderDetails, store);

      // Create VAPI call (this would use the actual VAPI API)
      const callResult = await this.initiateVAPICall(phoneNumber, script);
      
      // Track the order
      const orderId = `order-${Date.now()}`;
      this.ordersInProgress.set(orderId, {
        orderId,
        storeId,
        storeName: store.name,
        phoneNumber,
        orderDetails,
        startTime: new Date(),
        status: 'in-progress'
      });

      return {
        success: true,
        orderId,
        storeName: store.name,
        phoneNumber,
        message: `ALEX is now calling ${store.name} to order parts`
      };

    } catch (error) {
      console.error('Error ordering parts:', error);
      throw error;
    }
  }

  /**
   * Generate ordering conversation script
   */
  generateOrderingScript(orderDetails, store) {
    const { parts, customerName, customerPhone, shopName, urgency, jobReference } = orderDetails;

    const partsList = parts.map(part => 
      `- ${part.partName}${part.partNumber ? ` (Part #${part.partNumber})` : ''}, Qty: ${part.quantity}`
    ).join('\n');

    const script = {
      instructions: `You are ALEX, a professional automotive service advisor calling ${store.name} to place a parts order.
        Be polite, professional, and clear.
        Provide all necessary information for the order.
        Confirm the order details.
        Ask about delivery timeframe and pickup options.
        Get an order confirmation number.
        Thank the store for their help.`,

      opening: `Hi, this is Alex from ${shopName || 'VHICL Pro Auto Service'}. I'd like to place a parts order.`,

      orderDetails: `I need to order the following parts:\n${partsList}\n\n` +
        `These parts are for ${urgency === 'urgent' ? 'an urgent job' : 'a repair'}${customerName ? ` for customer ${customerName}` : ''}.\n` +
        (jobReference ? `Job reference: ${jobReference}\n` : ''),

      additionalInfo: customerPhone ? 
        `If you have any questions, you can reach us at ${customerPhone}` : 
        'Please confirm the order details and availability.',

      questions: [
        'Do you have all these parts in stock?',
        'If not, what\'s the delivery timeframe for any backordered items?',
        'Can you provide me with an order confirmation number?',
        'Can we pick up the parts or will you deliver?',
        'When will the parts be ready for pickup/delivery?'
      ],

      confirmation: `Could you please repeat the order details to confirm everything is correct?`,
      
      closing: `Thank you very much. Please have those ready. We appreciate your help!`
    };

    return script;
  }

  /**
   * Initiate VAPI call for ordering
   */
  async initiateVAPICall(phoneNumber, script) {
    console.log('📞 Simulating VAPI ordering call to:', phoneNumber);
    console.log('📝 Script:', script);
    
    return {
      orderId: `order-${Date.now()}`,
      phoneNumber,
      status: 'initiated',
      message: 'Order call initiated successfully'
    };
  }

  /**
   * Process order response and extract confirmation details
   */
  async processOrderResponse(orderId, transcription) {
    try {
      const order = this.ordersInProgress.get(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      console.log(`📝 Processing order response for ${orderId}`);
      console.log(`📝 Transcription: ${transcription}`);

      // Extract order confirmation details from transcription
      const parsedData = this.extractOrderDetailsFromTranscription(transcription);

      // Update order status
      order.status = 'completed';
      order.endTime = new Date();
      order.transcription = transcription;
      order.parsedData = parsedData;

      // Add to history
      this.orderHistory.push(order);
      
      // Remove from in-progress
      this.ordersInProgress.delete(orderId);

      return {
        success: true,
        orderId,
        storeName: order.storeName,
        orderConfirmation: parsedData,
        message: 'Order processed successfully'
      };

    } catch (error) {
      console.error('Error processing order response:', error);
      throw error;
    }
  }

  /**
   * Extract order details from transcribed call
   */
  extractOrderDetailsFromTranscription(transcription) {
    const confirmationPattern = /order\s*(?:number|#)?\s*[:#]?\s*(\w+)/i;
    const readyPattern = /(?:ready|available)\s*(?:for\s*)?(?:pickup|delivery)?\s*(?:in|by|on)?\s*(.+?)(?:\.|,|$)/i;
    const allInStockPattern = /all\s+in\s+stock|everything\s+available/i;
    const someOutOfStockPattern = /(?:some|a few)\s+(?:parts|items)\s+(?:out\s+of\s+stock|not\s+available)/i;
    
    const confirmationMatch = transcription.match(confirmationPattern);
    const readyMatch = transcription.match(readyPattern);
    
    const orderConfirmationNumber = confirmationMatch ? confirmationMatch[1] : null;
    const estimatedReadyTime = readyMatch ? readyMatch[1].trim() : 'Unknown';
    
    let availability = 'all in stock';
    if (someOutOfStockPattern.test(transcription)) {
      availability = 'partial - some backordered';
    } else if (!allInStockPattern.test(transcription)) {
      availability = 'unknown';
    }

    return {
      orderConfirmationNumber,
      estimatedReadyTime,
      availability,
      confidence: orderConfirmationNumber ? 0.9 : 0.5,
      rawTranscription: transcription
    };
  }

  /**
   * Get order history
   */
  getOrderHistory(filters = {}) {
    let history = [...this.orderHistory];

    if (filters.storeId) {
      history = history.filter(order => order.storeId === filters.storeId);
    }

    if (filters.status) {
      history = history.filter(order => order.status === filters.status);
    }

    if (filters.startDate) {
      history = history.filter(order => order.startTime >= filters.startDate);
    }

    if (filters.endDate) {
      history = history.filter(order => order.startTime <= filters.endDate);
    }

    return history.reverse();
  }

  /**
   * Get orders in progress
   */
  getOrdersInProgress() {
    return Array.from(this.ordersInProgress.values());
  }

  /**
   * Cancel an in-progress order
   */
  async cancelOrder(orderId) {
    const order = this.ordersInProgress.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    order.status = 'cancelled';
    order.endTime = new Date();

    this.ordersInProgress.delete(orderId);

    return {
      success: true,
      orderId,
      message: 'Order cancelled successfully'
    };
  }

  /**
   * Get order statistics
   */
  getOrderStatistics() {
    const completedOrders = this.orderHistory.filter(order => order.status === 'completed');
    const averageOrderDuration = this.calculateAverageOrderDuration(completedOrders);
    const successRate = completedOrders.length / Math.max(this.orderHistory.length, 1) * 100;

    return {
      totalOrders: this.orderHistory.length,
      completedOrders: completedOrders.length,
      inProgressOrders: this.ordersInProgress.size,
      averageOrderDuration,
      successRate: successRate.toFixed(2) + '%'
    };
  }

  /**
   * Calculate average order duration
   */
  calculateAverageOrderDuration(orders) {
    if (orders.length === 0) return '0:00';

    const totalDuration = orders.reduce((sum, order) => {
      return sum + (order.endTime - order.startTime);
    }, 0);

    const avgDurationMs = totalDuration / orders.length;
    const avgDurationSeconds = Math.floor(avgDurationMs / 1000);
    const minutes = Math.floor(avgDurationSeconds / 60);
    const seconds = avgDurationSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

module.exports = VAPIPartsOrderingService;
