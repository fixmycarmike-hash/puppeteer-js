/**
 * Labor Database Schema
 * Shop-owned database of repair operations with labor times
 */

class LaborDatabase {
  constructor() {
    // Labor operations database
    this.laborOperations = new Map();
    
    // Initialize with common repairs
    this.initializeCommonRepairs();
  }

  /**
   * Initialize database with industry-standard labor times
   * These are based on flat rate books and can be customized per shop
   */
  initializeCommonRepairs() {
    // Maintenance Operations
    this.addLaborOperation({
      id: 'oil-change',
      name: 'Oil Change - Synthetic',
      category: 'Maintenance',
      baseHours: 0.5,
      difficulty: 'Easy',
      description: 'Oil and filter change with synthetic oil',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'oil-change-conventional',
      name: 'Oil Change - Conventional',
      category: 'Maintenance',
      baseHours: 0.5,
      difficulty: 'Easy',
      description: 'Oil and filter change with conventional oil',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'tire-rotation',
      name: 'Tire Rotation',
      category: 'Maintenance',
      baseHours: 0.3,
      difficulty: 'Easy',
      description: 'Rotate tires for even wear',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'brake-inspection',
      name: 'Brake Inspection',
      category: 'Inspection',
      baseHours: 0.3,
      difficulty: 'Easy',
      description: 'Complete brake system inspection',
      vehicles: ['All']
    });

    // Brake Repairs
    this.addLaborOperation({
      id: 'brake-pads-front',
      name: 'Brake Pads Replacement - Front',
      category: 'Brakes',
      baseHours: 1.0,
      difficulty: 'Medium',
      description: 'Replace front brake pads',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'brake-pads-rear',
      name: 'Brake Pads Replacement - Rear',
      category: 'Brakes',
      baseHours: 1.0,
      difficulty: 'Medium',
      description: 'Replace rear brake pads',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'brake-rotors-front',
      name: 'Brake Rotors Replacement - Front',
      category: 'Brakes',
      baseHours: 1.5,
      difficulty: 'Medium',
      description: 'Replace front brake rotors',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'brake-rotors-rear',
      name: 'Brake Rotors Replacement - Rear',
      category: 'Brakes',
      baseHours: 1.5,
      difficulty: 'Medium',
      description: 'Replace rear brake rotors',
      vehicles: ['All']
    });

    // Battery & Electrical
    this.addLaborOperation({
      id: 'battery-replacement',
      name: 'Battery Replacement',
      category: 'Electrical',
      baseHours: 0.3,
      difficulty: 'Easy',
      description: 'Replace battery',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'alternator-replacement',
      name: 'Alternator Replacement',
      category: 'Electrical',
      baseHours: 1.5,
      difficulty: 'Medium',
      description: 'Replace alternator',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'starter-replacement',
      name: 'Starter Replacement',
      category: 'Electrical',
      baseHours: 1.5,
      difficulty: 'Medium',
      description: 'Replace starter motor',
      vehicles: ['All']
    });

    // Fluid Services
    this.addLaborOperation({
      id: 'coolant-flush',
      name: 'Coolant Flush',
      category: 'Fluids',
      baseHours: 1.0,
      difficulty: 'Medium',
      description: 'Flush and refill cooling system',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'brake-fluid-flush',
      name: 'Brake Fluid Flush',
      category: 'Fluids',
      baseHours: 0.8,
      difficulty: 'Medium',
      description: 'Flush and refill brake fluid',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'transmission-fluid',
      name: 'Transmission Fluid Service',
      category: 'Fluids',
      baseHours: 1.5,
      difficulty: 'Medium',
      description: 'Drain and refill transmission fluid',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'power-steering-fluid',
      name: 'Power Steering Fluid Service',
      category: 'Fluids',
      baseHours: 0.5,
      difficulty: 'Easy',
      description: 'Flush and refill power steering fluid',
      vehicles: ['All']
    });

    // Tune-Up & Ignition
    this.addLaborOperation({
      id: 'spark-plugs-4cyl',
      name: 'Spark Plug Replacement - 4 Cylinder',
      category: 'Ignition',
      baseHours: 1.0,
      difficulty: 'Medium',
      description: 'Replace spark plugs (4 cylinder)',
      vehicles: ['4 Cylinder']
    });

    this.addLaborOperation({
      id: 'spark-plugs-6cyl',
      name: 'Spark Plug Replacement - 6 Cylinder',
      category: 'Ignition',
      baseHours: 1.5,
      difficulty: 'Medium',
      description: 'Replace spark plugs (6 cylinder)',
      vehicles: ['6 Cylinder', 'V6']
    });

    this.addLaborOperation({
      id: 'spark-plugs-8cyl',
      name: 'Spark Plug Replacement - 8 Cylinder',
      category: 'Ignition',
      baseHours: 2.0,
      difficulty: 'Hard',
      description: 'Replace spark plugs (8 cylinder)',
      vehicles: ['8 Cylinder', 'V8']
    });

    this.addLaborOperation({
      id: 'ignition-coils',
      name: 'Ignition Coil Replacement',
      category: 'Ignition',
      baseHours: 0.5,
      difficulty: 'Easy',
      description: 'Replace ignition coil (per coil)',
      vehicles: ['All']
    });

    // Suspension & Steering
    this.addLaborOperation({
      id: 'shock-absorbers',
      name: 'Shock Absorber Replacement (pair)',
      category: 'Suspension',
      baseHours: 2.0,
      difficulty: 'Hard',
      description: 'Replace shock absorbers (pair)',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'struts',
      name: 'Strut Replacement (pair)',
      category: 'Suspension',
      baseHours: 3.0,
      difficulty: 'Hard',
      description: 'Replace struts (pair)',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'ball-joints',
      name: 'Ball Joint Replacement (each)',
      category: 'Suspension',
      baseHours: 1.5,
      difficulty: 'Medium',
      description: 'Replace ball joint',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'tie-rods',
      name: 'Tie Rod Replacement (each)',
      category: 'Steering',
      baseHours: 1.0,
      difficulty: 'Medium',
      description: 'Replace tie rod end',
      vehicles: ['All']
    });

    // HVAC
    this.addLaborOperation({
      id: 'ac-recharge',
      name: 'A/C Recharge',
      category: 'HVAC',
      baseHours: 0.5,
      difficulty: 'Easy',
      description: 'Recharge A/C system',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'ac-compressor',
      name: 'A/C Compressor Replacement',
      category: 'HVAC',
      baseHours: 3.0,
      difficulty: 'Hard',
      description: 'Replace A/C compressor',
      vehicles: ['All']
    });

    // Filters
    this.addLaborOperation({
      id: 'air-filter',
      name: 'Engine Air Filter Replacement',
      category: 'Maintenance',
      baseHours: 0.2,
      difficulty: 'Easy',
      description: 'Replace engine air filter',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'cabin-filter',
      name: 'Cabin Air Filter Replacement',
      category: 'Maintenance',
      baseHours: 0.3,
      difficulty: 'Easy',
      description: 'Replace cabin air filter',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'fuel-filter',
      name: 'Fuel Filter Replacement',
      category: 'Maintenance',
      baseHours: 0.5,
      difficulty: 'Medium',
      description: 'Replace fuel filter',
      vehicles: ['All']
    });

    // Exhaust
    this.addLaborOperation({
      id: 'muffler-replacement',
      name: 'Muffler Replacement',
      category: 'Exhaust',
      baseHours: 1.5,
      difficulty: 'Medium',
      description: 'Replace muffler',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'o2-sensor',
      name: 'O2 Sensor Replacement',
      category: 'Exhaust',
      baseHours: 0.5,
      difficulty: 'Easy',
      description: 'Replace oxygen sensor',
      vehicles: ['All']
    });

    // belts & Hoses
    this.addLaborOperation({
      id: 'serpentine-belt',
      name: 'Serpentine Belt Replacement',
      category: 'Belts',
      baseHours: 0.5,
      difficulty: 'Easy',
      description: 'Replace serpentine belt',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'timing-belt',
      name: 'Timing Belt Replacement',
      category: 'Belts',
      baseHours: 4.0,
      difficulty: 'Hard',
      description: 'Replace timing belt',
      vehicles: ['All']
    });

    this.addLaborOperation({
      id: 'radiator-hoses',
      name: 'Radiator Hose Replacement (each)',
      category: 'Hoses',
      baseHours: 0.5,
      difficulty: 'Easy',
      description: 'Replace radiator hose',
      vehicles: ['All']
    });
  }

  /**
   * Add a labor operation to the database
   */
  addLaborOperation(operation) {
    if (!operation.id || !operation.name || !operation.baseHours) {
      throw new Error('Labor operation must have id, name, and baseHours');
    }

    this.laborOperations.set(operation.id, {
      id: operation.id,
      name: operation.name,
      category: operation.category || 'General',
      baseHours: operation.baseHours,
      difficulty: operation.difficulty || 'Medium',
      description: operation.description || '',
      vehicles: operation.vehicles || ['All'],
      customMultiplier: 1.0, // Shop can customize
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get labor operation by ID
   */
  getLaborOperation(operationId) {
    return this.laborOperations.get(operationId);
  }

  /**
   * Get all labor operations
   */
  getAllLaborOperations() {
    return Array.from(this.laborOperations.values());
  }

  /**
   * Get labor operations by category
   */
  getLaborOperationsByCategory(category) {
    return this.getAllLaborOperations().filter(op => op.category === category);
  }

  /**
   * Search labor operations by name or description
   */
  searchLaborOperations(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllLaborOperations().filter(op =>
      op.name.toLowerCase().includes(lowerQuery) ||
      op.description.toLowerCase().includes(lowerQuery) ||
      op.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Calculate labor time for operation with shop multiplier
   */
  calculateLaborTime(operationId, shopMultiplier = 1.0) {
    const operation = this.getLaborOperation(operationId);
    if (!operation) {
      throw new Error(`Labor operation not found: ${operationId}`);
    }

    const customMultiplier = operation.customMultiplier || 1.0;
    return operation.baseHours * customMultiplier * shopMultiplier;
  }

  /**
   * Calculate labor cost
   */
  calculateLaborCost(operationId, laborRate, shopMultiplier = 1.0) {
    const laborHours = this.calculateLaborTime(operationId, shopMultiplier);
    return laborHours * laborRate;
  }

  /**
   * Update labor operation (shop customization)
   */
  updateLaborOperation(operationId, updates) {
    const operation = this.getLaborOperation(operationId);
    if (!operation) {
      throw new Error(`Labor operation not found: ${operationId}`);
    }

    const updated = {
      ...operation,
      ...updates,
      id: operationId, // Prevent ID changes
      updatedAt: new Date().toISOString()
    };

    this.laborOperations.set(operationId, updated);
    return updated;
  }

  /**
   * Delete labor operation
   */
  deleteLaborOperation(operationId) {
    return this.laborOperations.delete(operationId);
  }

  /**
   * Get categories
   */
  getCategories() {
    const categories = new Set();
    this.getAllLaborOperations().forEach(op => categories.add(op.category));
    return Array.from(categories).sort();
  }

  /**
   * Export database as JSON
   */
  exportDatabase() {
    return JSON.stringify(Array.from(this.laborOperations.values()), null, 2);
  }

  /**
   * Import database from JSON
   */
  importDatabase(jsonData) {
    try {
      const operations = JSON.parse(jsonData);
      operations.forEach(op => {
        this.laborOperations.set(op.id, op);
      });
      return true;
    } catch (error) {
      console.error('Failed to import labor database:', error);
      return false;
    }
  }
}

// Export for use in other modules
module.exports = LaborDatabase;