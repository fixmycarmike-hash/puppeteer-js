/**
 * Smart Quote Selector
 * 
 * Selects the best parts quote considering multiple factors beyond just price
 * Like a real service advisor would do
 */

const partsStoreDirectory = require('./parts-store-directory');

class SmartQuoteSelector {
  constructor() {
    this.selectionCriteria = {
      price: 0.30,        // 30% weight on price
      availability: 0.25, // 25% weight on availability
      delivery: 0.20,     // 20% weight on delivery speed
      quality: 0.15,      // 15% weight on part quality
      relationship: 0.10  // 10% weight on store relationship
    };
  }

  /**
   * Select the best quote using smart criteria
   */
  selectBestQuote(quotes, jobContext = {}) {
    if (!quotes || quotes.length === 0) {
      return null;
    }

    // Score each quote using multiple criteria
    const scoredQuotes = quotes.map(quote => ({
      ...quote,
      overallScore: this.calculateOverallScore(quote, jobContext),
      scoreBreakdown: this.getScoreBreakdown(quote, jobContext)
    }));

    // Sort by overall score (highest first)
    scoredQuotes.sort((a, b) => b.overallScore - a.overallScore);

    // Return the best quote with explanation
    const bestQuote = scoredQuotes[0];
    const recommendation = this.generateRecommendation(bestQuote, scoredQuotes, jobContext);

    return {
      ...bestQuote,
      recommendation,
      allScores: scoredQuotes.map(sq => ({
        storeName: sq.storeName,
        overallScore: sq.overallScore,
        scoreBreakdown: sq.scoreBreakdown
      }))
    };
  }

  /**
   * Calculate overall score considering all factors
   */
  calculateOverallScore(quote, jobContext) {
    const criteria = this.selectionCriteria;
    
    let totalScore = 0;
    
    // Price score (lower is better, normalize to 0-100)
    const priceScore = this.calculatePriceScore(quote, jobContext);
    totalScore += priceScore * criteria.price;

    // Availability score
    const availabilityScore = this.calculateAvailabilityScore(quote, jobContext);
    totalScore += availabilityScore * criteria.availability;

    // Delivery speed score
    const deliveryScore = this.calculateDeliveryScore(quote, jobContext);
    totalScore += deliveryScore * criteria.delivery;

    // Quality score
    const qualityScore = this.calculateQualityScore(quote, jobContext);
    totalScore += qualityScore * criteria.quality;

    // Relationship score (store priority and history)
    const relationshipScore = this.calculateRelationshipScore(quote, jobContext);
    totalScore += relationshipScore * criteria.relationship;

    return Math.round(totalScore);
  }

  /**
   * Calculate price score
   */
  calculatePriceScore(quote, jobContext) {
    if (!quote.price) return 50;

    const { urgency, budgetSensitive } = jobContext;

    // If urgent, price matters less
    if (urgency === 'urgent') {
      return 70; // Moderate score, prioritize speed over price
    }

    // If budget is sensitive, price matters more
    if (budgetSensitive) {
      const priceScore = Math.max(0, 100 - (quote.price / 5));
      return Math.min(100, priceScore);
    }

    // Normal pricing consideration
    const priceScore = Math.max(0, 100 - (quote.price / 10));
    return Math.min(100, priceScore);
  }

  /**
   * Calculate availability score
   */
  calculateAvailabilityScore(quote, jobContext) {
    const { urgency } = jobContext;

    const availabilityScores = {
      'in stock': 100,
      'limited stock': 70,
      'special order': 40,
      'out of stock': 0,
      'unknown': 50
    };

    let score = availabilityScores[quote.availability] || 50;

    // If urgent, in-stock is critical
    if (urgency === 'urgent') {
      if (quote.availability === 'in stock') {
        score += 20; // Bonus for in-stock when urgent
      } else {
        score -= 30; // Penalty for not in-stock when urgent
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate delivery speed score
   */
  calculateDeliveryScore(quote, jobContext) {
    const { urgency } = jobContext;

    if (quote.deliveryTime === null || quote.deliveryTime === undefined) {
      return 50; // Unknown delivery time
    }

    let score = 0;

    // Same day availability
    if (quote.deliveryTime === 0) {
      score = 100;
    } 
    // Next day
    else if (quote.deliveryTime <= 1) {
      score = 85;
    }
    // 2-3 days
    else if (quote.deliveryTime <= 3) {
      score = 60;
    }
    // 4-7 days
    else if (quote.deliveryTime <= 7) {
      score = 30;
    }
    // Longer than a week
    else {
      score = 10;
    }

    // If urgent, delivery speed matters more
    if (urgency === 'urgent') {
      if (quote.deliveryTime <= 1) {
        score += 20; // Bonus for fast delivery when urgent
      } else if (quote.deliveryTime > 2) {
        score -= 40; // Heavy penalty for slow delivery when urgent
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(quote, jobContext) {
    const { vehicleAge, vehicleType, customerPreference } = jobContext;

    const qualityScores = {
      'OEM': 100,
      'OEM Equivalent': 85,
      'Premium': 90,
      'Standard': 70,
      'Economy': 50,
      'Remanufactured': 75,
      'Used': 40,
      'Unknown': 60
    };

    let score = qualityScores[quote.quality] || 60;

    // For newer vehicles, OEM is preferred
    if (vehicleAge && vehicleAge < 3) {
      if (quote.quality === 'OEM') {
        score += 20;
      } else if (quote.quality !== 'OEM Equivalent' && quote.quality !== 'Premium') {
        score -= 20;
      }
    }

    // For older vehicles, economy might be acceptable
    if (vehicleAge && vehicleAge > 10) {
      if (quote.quality === 'Economy' || quote.quality === 'Standard') {
        score += 10;
      }
    }

    // For high-end vehicles, quality matters more
    if (vehicleType === 'luxury' || vehicleType === 'performance') {
      if (quote.quality === 'OEM' || quote.quality === 'Premium') {
        score += 15;
      } else if (quote.quality === 'Economy') {
        score -= 30;
      }
    }

    // Respect customer preference
    if (customerPreference) {
      if (quote.quality.toLowerCase().includes(customerPreference.toLowerCase())) {
        score += 25;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate relationship score
   */
  calculateRelationshipScore(quote, jobContext) {
    const store = partsStoreDirectory.getStoreById(quote.storeId);
    
    if (!store) return 50;

    let score = 50;

    // Store priority (lower number = higher priority)
    const priorityBonus = (10 - store.priority) * 5;
    score += priorityBonus;

    // Past relationship (this could be enhanced with actual relationship tracking)
    // For now, use priority as a proxy for relationship
    if (store.priority <= 2) {
      score += 20; // Bonus for top-tier stores
    }

    // Store specialties
    if (store.specialty && store.specialty !== 'General auto parts') {
      // If store has a specialty, give them a bonus
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get detailed score breakdown
   */
  getScoreBreakdown(quote, jobContext) {
    return {
      price: this.calculatePriceScore(quote, jobContext),
      availability: this.calculateAvailabilityScore(quote, jobContext),
      delivery: this.calculateDeliveryScore(quote, jobContext),
      quality: this.calculateQualityScore(quote, jobContext),
      relationship: this.calculateRelationshipScore(quote, jobContext)
    };
  }

  /**
   * Generate recommendation explanation
   */
  generateRecommendation(bestQuote, allScoredQuotes, jobContext) {
    const { urgency, budgetSensitive } = jobContext;
    
    let recommendation = `I recommend ${bestQuote.storeName} for this order.\n\n`;
    
    // Explain why this store was chosen
    const breakdown = bestQuote.scoreBreakdown;
    const highestScore = Math.max(...Object.values(breakdown));
    const reasons = [];

    Object.entries(breakdown).forEach(([factor, score]) => {
      if (score >= highestScore - 10 && score >= 70) {
        reasons.push(this.getReasonDescription(factor, score, bestQuote, jobContext));
      }
    });

    if (reasons.length > 0) {
      recommendation += `Why I chose this store:\n`;
      reasons.forEach(reason => {
        recommendation += `• ${reason}\n`;
      });
      recommendation += '\n';
    }

    // Mention price if competitive
    if (bestQuote.price) {
      const cheapestPrice = Math.min(...allScoredQuotes.filter(q => q.price).map(q => q.price));
      if (bestQuote.price <= cheapestPrice * 1.1) {
        recommendation += `The price at $${bestQuote.price.toFixed(2)} is competitive with other options.\n\n`;
      }
    }

    // Mention availability
    if (bestQuote.availability === 'in stock') {
      recommendation += `The part is available immediately, which ${urgency === 'urgent' ? 'is critical for this urgent job' : 'will get your vehicle back on the road quickly'}.\n\n`;
    }

    // Add final note based on job context
    if (urgency === 'urgent') {
      recommendation += `Given the urgency of this job, I prioritized availability and delivery speed over the absolute lowest price.`;
    } else if (budgetSensitive) {
      recommendation += `I found a good balance between price and quality that fits within your budget.`;
    } else {
      recommendation += `This offers the best overall value considering price, quality, and availability.`;
    }

    return recommendation;
  }

  /**
   * Get human-readable reason description
   */
  getReasonDescription(factor, score, quote, jobContext) {
    const descriptions = {
      price: score >= 80 ? `Excellent price point` : `Reasonable price`,
      availability: score >= 90 ? `Part is in stock and ready` : `Good availability`,
      delivery: score >= 90 ? `Fastest delivery time` : `Reasonable delivery time`,
      quality: score >= 90 ? `High-quality part${quote.quality ? ` (${quote.quality})` : ''}` : `Good quality`,
      relationship: score >= 80 ? `Excellent relationship with this store` : `Good working relationship`
    };

    return descriptions[factor] || `${factor} score: ${score}`;
  }

  /**
   * Get alternative options with explanations
   */
  getAlternativeOptions(quotes, jobContext) {
    if (!quotes || quotes.length < 2) {
      return [];
    }

    const scoredQuotes = quotes.map(quote => ({
      ...quote,
      overallScore: this.calculateOverallScore(quote, jobContext)
    })).sort((a, b) => b.overallScore - a.overallScore);

    // Return alternatives (skip the first one, which is the best)
    return scoredQuotes.slice(1, 4).map((quote, index) => {
      let alternativeReason = '';

      if (quote.price && quote.price < scoredQuotes[0].price * 0.9) {
        alternativeReason = 'Cheaper option';
      } else if (quote.availability === 'in stock' && scoredQuotes[0].availability !== 'in stock') {
        alternativeReason = 'Better availability';
      } else if (quote.deliveryTime < scoredQuotes[0].deliveryTime) {
        alternativeReason = 'Faster delivery';
      } else if (quote.quality === 'OEM' && scoredQuotes[0].quality !== 'OEM') {
        alternativeReason = 'OEM quality';
      }

      return {
        ...quote,
        rank: index + 2,
        alternativeReason,
        overallScore: quote.overallScore
      };
    });
  }
}

module.exports = SmartQuoteSelector;
