/**
 * Parts Quote Comparator
 * 
 * Compares pricing and availability from multiple parts stores
 * Ranks quotes and recommends best options
 */

const partsStoreDirectory = require('./parts-store-directory.js');

class PartsQuoteComparator {
  constructor() {
    this.quotes = [];
    this.comparisonHistory = [];
  }

  /**
   * Add a quote to the comparison
   */
  addQuote(quote) {
    const quoteWithScore = {
      ...quote,
      id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date(),
      score: this.calculateQuoteScore(quote)
    };

    this.quotes.push(quoteWithScore);
    return quoteWithScore;
  }

  /**
   * Add multiple quotes at once
   */
  addQuotes(quotes) {
    return quotes.map(quote => this.addQuote(quote));
  }

  /**
   * Calculate a comprehensive score for a quote
   */
  calculateQuoteScore(quote) {
    let score = 0;
    const weights = {
      price: 0.35,        // 35% weight on price
      availability: 0.25, // 25% weight on availability
      delivery: 0.20,     // 20% weight on delivery time
      quality: 0.15,      // 15% weight on quality/brand
      warranty: 0.05      // 5% weight on warranty
    };

    // Price score (lower is better, normalize to 0-100)
    if (quote.price) {
      const priceScore = Math.max(0, 100 - (quote.price / 10));
      score += priceScore * weights.price;
    }

    // Availability score
    const availabilityScores = {
      'in stock': 100,
      'limited stock': 70,
      'special order': 40,
      'out of stock': 0,
      'unknown': 30
    };
    const availabilityScore = availabilityScores[quote.availability] || 30;
    score += availabilityScore * weights.availability;

    // Delivery time score (faster is better)
    if (quote.deliveryTime !== null && quote.deliveryTime !== undefined) {
      const deliveryScore = Math.max(0, 100 - (quote.deliveryTime * 20));
      score += deliveryScore * weights.delivery;
    }

    // Quality/brand score
    const qualityScores = {
      'OEM': 100,
      'OEM Equivalent': 85,
      'Premium': 90,
      'Standard': 70,
      'Economy': 50,
      'Unknown': 60
    };
    const qualityScore = qualityScores[quote.quality] || 60;
    score += qualityScore * weights.quality;

    // Warranty score
    if (quote.warranty) {
      const warrantyScore = 100;
      score += warrantyScore * weights.warranty;
    }

    // Store priority bonus (lower priority number = higher priority)
    const store = partsStoreDirectory.getStoreById(quote.storeId);
    if (store) {
      const priorityBonus = (10 - store.priority) * 2;
      score += priorityBonus;
    }

    return Math.round(score);
  }

  /**
   * Get all quotes sorted by score
   */
  getSortedQuotes() {
    return [...this.quotes].sort((a, b) => b.score - a.score);
  }

  /**
   * Get the best quote
   */
  getBestQuote() {
    const sortedQuotes = this.getSortedQuotes();
    return sortedQuotes.length > 0 ? sortedQuotes[0] : null;
  }

  /**
   * Get top N quotes
   */
  getTopQuotes(count = 3) {
    return this.getSortedQuotes().slice(0, count);
  }

  /**
   * Get quotes by availability
   */
  getQuotesByAvailability(availability) {
    return this.quotes.filter(quote => quote.availability === availability);
  }

  /**
   * Get quotes in stock
   */
  getInStockQuotes() {
    return this.getQuotesByAvailability('in stock');
  }

  /**
   * Get cheapest quote
   */
  getCheapestQuote() {
    const quotesWithPrice = this.quotes.filter(quote => quote.price);
    if (quotesWithPrice.length === 0) return null;

    return quotesWithPrice.reduce((cheapest, current) => 
      (current.price < cheapest.price) ? current : cheapest
    );
  }

  /**
   * Get fastest delivery quote
   */
  getFastestDeliveryQuote() {
    const quotesWithDelivery = this.quotes.filter(quote => 
      quote.deliveryTime !== null && quote.deliveryTime !== undefined
    );
    
    if (quotesWithDelivery.length === 0) return null;

    return quotesWithDelivery.reduce((fastest, current) => 
      (current.deliveryTime < fastest.deliveryTime) ? current : fastest
    );
  }

  /**
   * Generate comparison summary
   */
  generateComparisonSummary() {
    const sortedQuotes = this.getSortedQuotes();
    
    if (sortedQuotes.length === 0) {
      return {
        message: 'No quotes to compare',
        quotes: []
      };
    }

    const bestQuote = sortedQuotes[0];
    const cheapestQuote = this.getCheapestQuote();
    const fastestQuote = this.getFastestDeliveryQuote();
    const inStockCount = this.getInStockQuotes().length;

    const summary = {
      totalQuotes: sortedQuotes.length,
      bestQuote: {
        storeName: bestQuote.storeName,
        price: bestQuote.price,
        availability: bestQuote.availability,
        score: bestQuote.score,
        recommendation: '🏆 Best overall option based on price, availability, and quality'
      },
      cheapestQuote: cheapestQuote ? {
        storeName: cheapestQuote.storeName,
        price: cheapestQuote.price,
        recommendation: '💰 Lowest price'
      } : null,
      fastestQuote: fastestQuote ? {
        storeName: fastestQuote.storeName,
        deliveryTime: fastestQuote.deliveryTime,
        recommendation: '⚡ Fastest delivery'
      } : null,
      inStockSummary: inStockCount > 0 ? {
        message: `${inStockCount} store(s) have the part in stock`
      } : null,
      quotes: sortedQuotes
    };

    return summary;
  }

  /**
   * Generate ALEX's recommendation message
   */
  generateALEXRecommendation() {
    const summary = this.generateComparisonSummary();
    
    if (summary.totalQuotes === 0) {
      return "I haven't received any quotes yet. Let me make some calls to get pricing for you.";
    }

    const bestQuote = summary.bestQuote;
    const quotes = summary.quotes;
    
    let message = `I've contacted ${summary.totalQuotes} parts store${summary.totalQuotes > 1 ? 's' : ''} and here's what I found:\n\n`;

    if (summary.inStockCount > 0) {
      message += `📦 ${summary.inStockCount} store${summary.inStockCount > 1 ? 's' : ''} have the part in stock\n\n`;
    }

    // Top 3 recommendations
    const topQuotes = quotes.slice(0, 3);
    topQuotes.forEach((quote, index) => {
      const rank = index + 1;
      const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
      
      message += `${rankEmoji} ${quote.storeName}\n`;
      message += `   💵 Price: $${quote.price.toFixed(2)}\n`;
      message += `   📦 Status: ${quote.availability}\n`;
      
      if (quote.deliveryTime !== null && quote.deliveryTime !== undefined) {
        message += `   ⏰ Delivery: ${quote.deliveryTime === 0 ? 'Same day' : `${quote.deliveryTime} day(s)`}\n`;
      }
      
      if (quote.quality) {
        message += `   🔧 Quality: ${quote.quality}\n`;
      }
      
      if (quote.warranty) {
        message += `   ✅ Warranty: ${quote.warranty}\n`;
      }
      
      message += `   📊 Score: ${quote.score}/100\n\n`;
    });

    // Overall recommendation
    message += `\n💡 My recommendation: ${bestQuote.storeName} offers the best overall value at $${bestQuote.price.toFixed(2)}.\n`;
    
    if (bestQuote.availability === 'in stock') {
      message += `It's available right now, so you can get your vehicle back on the road quickly!\n`;
    } else if (bestQuote.deliveryTime) {
      message += `It will take about ${bestQuote.deliveryTime} day(s) to get the part.\n`;
    }

    return message;
  }

  /**
   * Clear all quotes
   */
  clearQuotes() {
    this.quotes = [];
  }

  /**
   * Save comparison to history
   */
  saveToHistory(partRequest) {
    const summary = this.generateComparisonSummary();
    
    const historyEntry = {
      id: `comparison-${Date.now()}`,
      partRequest,
      summary,
      quotes: [...this.quotes],
      timestamp: new Date()
    };

    this.comparisonHistory.push(historyEntry);
    return historyEntry;
  }

  /**
   * Get comparison history
   */
  getHistory(filters = {}) {
    let history = [...this.comparisonHistory];

    if (filters.partName) {
      history = history.filter(entry => 
        entry.partRequest.partName?.toLowerCase().includes(filters.partName.toLowerCase())
      );
    }

    if (filters.startDate) {
      history = history.filter(entry => entry.timestamp >= filters.startDate);
    }

    if (filters.endDate) {
      history = history.filter(entry => entry.timestamp <= filters.endDate);
    }

    return history.reverse();
  }

  /**
   * Export comparison report
   */
  exportReport(format = 'text') {
    const summary = this.generateComparisonSummary();

    if (format === 'json') {
      return JSON.stringify(summary, null, 2);
    }

    if (format === 'markdown') {
      return this.generateMarkdownReport(summary);
    }

    // Default text format
    return this.generateTextReport(summary);
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(summary) {
    let markdown = '# Parts Price Comparison Report\n\n';
    markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
    markdown += `**Total Quotes:** ${summary.totalQuotes}\n\n`;

    if (summary.bestQuote) {
      markdown += '## 🏆 Best Overall Option\n\n';
      markdown += `**Store:** ${summary.bestQuote.storeName}\n`;
      markdown += `**Price:** $${summary.bestQuote.price?.toFixed(2)}\n`;
      markdown += `**Availability:** ${summary.bestQuote.availability}\n`;
      markdown += `**Score:** ${summary.bestQuote.score}/100\n\n`;
    }

    markdown += '## All Quotes\n\n';
    summary.quotes.forEach((quote, index) => {
      markdown += `### ${index + 1}. ${quote.storeName}\n\n`;
      markdown += `- **Price:** $${quote.price?.toFixed(2)}\n`;
      markdown += `- **Availability:** ${quote.availability}\n`;
      markdown += `- **Quality:** ${quote.quality || 'Unknown'}\n`;
      markdown += `- **Score:** ${quote.score}/100\n\n`;
    });

    return markdown;
  }

  /**
   * Generate text report
   */
  generateTextReport(summary) {
    let text = 'PARTS PRICE COMPARISON REPORT\n';
    text += '='.repeat(50) + '\n\n';
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Total Quotes: ${summary.totalQuotes}\n\n`;

    if (summary.bestQuote) {
      text += 'BEST OVERALL OPTION:\n';
      text += '-'.repeat(30) + '\n';
      text += `Store: ${summary.bestQuote.storeName}\n`;
      text += `Price: $${summary.bestQuote.price?.toFixed(2)}\n`;
      text += `Availability: ${summary.bestQuote.availability}\n`;
      text += `Score: ${summary.bestQuote.score}/100\n\n`;
    }

    text += 'ALL QUOTES:\n';
    text += '-'.repeat(30) + '\n';
    summary.quotes.forEach((quote, index) => {
      text += `\n${index + 1}. ${quote.storeName}\n`;
      text += `   Price: $${quote.price?.toFixed(2)}\n`;
      text += `   Availability: ${quote.availability}\n`;
      text += `   Quality: ${quote.quality || 'Unknown'}\n`;
      text += `   Score: ${quote.score}/100\n`;
    });

    return text;
  }
}

module.exports = PartsQuoteComparator;