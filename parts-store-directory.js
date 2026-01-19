/**
 * Parts Store Directory
 * 
 * Database of local parts stores with phone numbers and information
 * ALEX will call these stores to get pricing and availability
 */

const partsStoreDirectory = [
  {
    id: 'oreilly-1',
    name: "O'Reilly Auto Parts",
    location: 'Main Street',
    address: '123 Main Street, Anytown, USA',
    phone: '+15551234567',
    hours: '7:30 AM - 9:00 PM',
    specialty: 'General auto parts',
    notes: 'Good stock, friendly staff, often has local discounts',
    priority: 1
  },
  {
    id: 'autozone-1',
    name: 'AutoZone',
    location: 'Downtown',
    address: '456 Oak Avenue, Anytown, USA',
    phone: '+15559876543',
    hours: '7:00 AM - 10:00 PM',
    specialty: 'Quick delivery, wide selection',
    notes: 'Can special order hard-to-find parts',
    priority: 2
  },
  {
    id: 'napa-1',
    name: 'NAPA Auto Parts',
    location: 'Industrial District',
    address: '789 Elm Street, Anytown, USA',
    phone: '+15551112222',
    hours: '7:00 AM - 8:00 PM',
    specialty: 'Professional quality parts',
    notes: 'Often has the best prices on OEM-equivalent parts',
    priority: 3
  },
  {
    id: 'advance-1',
    name: 'Advance Auto Parts',
    location: 'Highway 101',
    address: '321 Maple Drive, Anytown, USA',
    phone: '+15553334444',
    hours: '8:00 AM - 9:00 PM',
    specialty: 'Good warranties',
    notes: 'Price matching available',
    priority: 4
  },
  {
    id: 'carquest-1',
    name: 'Carquest',
    location: 'West Side',
    address: '654 Pine Road, Anytown, USA',
    phone: '+15555556666',
    hours: '7:30 AM - 7:30 PM',
    specialty: 'Professional parts',
    notes: 'Good for older and specialty vehicles',
    priority: 5
  },
  {
    id: 'rockauto-1',
    name: "RockAuto (Online)",
    location: 'Online Only',
    address: 'N/A',
    phone: '+18006578785',
    hours: '24/7 (online)',
    specialty: 'Huge selection, low prices',
    notes: 'Online only, 3-5 day shipping, no phone quotes available',
    priority: 6,
    isOnlineOnly: true
  }
];

/**
 * Get all parts stores
 */
function getAllStores() {
  return partsStoreDirectory;
}

/**
 * Get store by ID
 */
function getStoreById(storeId) {
  return partsStoreDirectory.find(store => store.id === storeId);
}

/**
 * Get stores that can be called (not online-only)
 */
function getCallableStores() {
  return partsStoreDirectory.filter(store => !store.isOnlineOnly);
}

/**
 * Get top N stores by priority
 */
function getTopStores(count = 3) {
  return partsStoreDirectory
    .filter(store => !store.isOnlineOnly)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, count);
}

/**
 * Get stores by specialty
 */
function getStoresBySpecialty(specialty) {
  return partsStoreDirectory.filter(store => 
    store.specialty.toLowerCase().includes(specialty.toLowerCase())
  );
}

/**
 * Search stores by name
 */
function searchStores(searchTerm) {
  const term = searchTerm.toLowerCase();
  return partsStoreDirectory.filter(store =>
    store.name.toLowerCase().includes(term) ||
    store.location.toLowerCase().includes(term) ||
    store.specialty.toLowerCase().includes(term)
  );
}

/**
 * Add new store to directory
 */
function addStore(storeData) {
  const newStore = {
    id: `store-${Date.now()}`,
    priority: partsStoreDirectory.length + 1,
    isOnlineOnly: false,
    ...storeData
  };
  
  partsStoreDirectory.push(newStore);
  return newStore;
}

/**
 * Update store information
 */
function updateStore(storeId, updates) {
  const index = partsStoreDirectory.findIndex(store => store.id === storeId);
  if (index !== -1) {
    partsStoreDirectory[index] = {
      ...partsStoreDirectory[index],
      ...updates
    };
    return partsStoreDirectory[index];
  }
  return null;
}

/**
 * Remove store from directory
 */
function removeStore(storeId) {
  const index = partsStoreDirectory.findIndex(store => store.id === storeId);
  if (index !== -1) {
    const removed = partsStoreDirectory.splice(index, 1)[0];
    return removed;
  }
  return null;
}

/**
 * Get store phone number format for calling
 */
function getFormattedPhoneNumber(storeId) {
  const store = getStoreById(storeId);
  if (!store) return null;
  
  // Remove any non-numeric characters except +
  return store.phone.replace(/[^0-9+]/g, '');
}

/**
 * Store priority calculator for quotes
 */
function calculateStoreQuoteScore(store, price, availability, deliveryTime) {
  let score = 100;
  
  // Price factor (lower is better)
  if (price < 50) score += 20;
  else if (price < 100) score += 10;
  else if (price < 200) score += 5;
  
  // Availability factor
  if (availability === 'in stock') score += 30;
  else if (availability === 'limited stock') score += 15;
  else if (availability === 'special order') score -= 10;
  
  // Delivery time factor
  if (deliveryTime <= 1) score += 20;
  else if (deliveryTime <= 2) score += 15;
  else if (deliveryTime <= 3) score += 10;
  else score -= 5;
  
  // Store priority
  score += (10 - store.priority) * 5;
  
  return score;
}

module.exports = {
  partsStoreDirectory,
  getAllStores,
  getStoreById,
  getCallableStores,
  getTopStores,
  getStoresBySpecialty,
  searchStores,
  addStore,
  updateStore,
  removeStore,
  getFormattedPhoneNumber,
  calculateStoreQuoteScore
};
