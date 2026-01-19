/**
 * Labor Service
 * Provides labor time lookup and management for repairs
 */

const LaborDatabase = require('./labor-database-schema.js');

class LaborService {
  constructor(shopSettings) {
    this.laborDatabase = new LaborDatabase();
    this.shopSettings = shopSettings;
  }

  /**
   * Get labor time for a repair operation
   */
  getLaborTime(operationId) {
    try {
      const operation = this.laborDatabase.getLaborOperation(operationId);
      if (!operation) {
        return {
          success: false,
          error: 'Labor operation not found',
          requiresVoiceCall: true,
          message: 'This repair operation is not in our database. ALEX can call the shop for an estimate.'
        };
      }

      const laborHours = this.laborDatabase.calculateLaborTime(
        operationId,
        this.shopSettings.laborMultiplier || 1.0
      );

      return {
        success: true,
        operation: operation,
        laborHours: laborHours,
        laborRate: this.shopSettings.laborRate || 100,
        estimatedCost: laborHours * (this.shopSettings.laborRate || 100),
        source: 'database'
      };
    } catch (error) {
      console.error('Error getting labor time:', error);
      return {
        success: false,
        error: error.message,
        requiresVoiceCall: true
      };
    }
  }

  /**
   * Search for labor operations
   */
  searchLaborOperations(query) {
    const results = this.laborDatabase.searchLaborOperations(query);
    return {
      success: true,
      count: results.length,
      operations: results
    };
  }

  /**
   * Get all labor operations by category
   */
  getLaborOperationsByCategory(category) {
    const operations = this.laborDatabase.getLaborOperationsByCategory(category);
    return {
      success: true,
      category: category,
      operations: operations
    };
  }

  /**
   * Get all categories
   */
  getCategories() {
    const categories = this.laborDatabase.getCategories();
    return {
      success: true,
      categories: categories
    };
  }

  /**
   * Add custom labor operation (shop-specific)
   */
  addCustomLaborOperation(operation) {
    try {
      // Add shop ID prefix to avoid conflicts
      const shopOperation = {
        ...operation,
        id: `custom-${this.shopSettings.shopId || 'default'}-${Date.now()}-${operation.id || 'custom'}`
      };

      this.laborDatabase.addLaborOperation(shopOperation);
      return {
        success: true,
        operation: shopOperation,
        message: 'Custom labor operation added successfully'
      };
    } catch (error) {
      console.error('Error adding custom labor operation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update labor operation (shop customization)
   */
  updateLaborOperation(operationId, updates) {
    try {
      const updated = this.laborDatabase.updateLaborOperation(operationId, updates);
      return {
        success: true,
        operation: updated,
        message: 'Labor operation updated successfully'
      };
    } catch (error) {
      console.error('Error updating labor operation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get labor estimate for multiple operations
   */
  getMultipleLaborEstimate(operationIds) {
    const estimates = [];
    let totalHours = 0;
    let totalCost = 0;
    const voiceCallRequired = [];

    operationIds.forEach(operationId => {
      const result = this.getLaborTime(operationId);
      
      if (result.success) {
        estimates.push(result);
        totalHours += result.laborHours;
        totalCost += result.estimatedCost;
      } else if (result.requiresVoiceCall) {
        voiceCallRequired.push({
          operationId: operationId,
          reason: result.message || 'Not in database'
        });
      }
    });

    return {
      success: voiceCallRequired.length === 0,
      estimates: estimates,
      totalHours: totalHours,
      totalCost: totalCost,
      voiceCallRequired: voiceCallRequired,
      requiresVoiceCall: voiceCallRequired.length > 0,
      laborRate: this.shopSettings.laborRate || 100
    };
  }

  /**
   * Get quick estimate for common repairs
   */
  getQuickEstimate(repairDescription) {
    // Search for matching operation
    const searchResults = this.searchLaborOperations(repairDescription);
    
    if (searchResults.operations.length === 0) {
      return {
        success: false,
        requiresVoiceCall: true,
        message: 'No matching labor operation found. ALEX can call the shop for an estimate.'
      };
    }

    // Use the first match
    const operation = searchResults.operations[0];
    const laborHours = this.laborDatabase.calculateLaborTime(
      operation.id,
      this.shopSettings.laborMultiplier || 1.0
    );

    return {
      success: true,
      operation: operation,
      laborHours: laborHours,
      laborRate: this.shopSettings.laborRate || 100,
      estimatedCost: laborHours * (this.shopSettings.laborRate || 100),
      alternatives: searchResults.operations.slice(1, 3), // Top 2 alternatives
      source: 'database'
    };
  }

  /**
   * Export labor database
   */
  exportLaborDatabase() {
    return {
      success: true,
      data: this.laborDatabase.exportDatabase()
    };
  }

  /**
   * Import labor database
   */
  importLaborDatabase(jsonData) {
    try {
      const success = this.laborDatabase.importDatabase(jsonData);
      return {
        success: success,
        message: success ? 'Labor database imported successfully' : 'Failed to import labor database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = LaborService;
