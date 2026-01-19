// Multiple Parts Lookup Sites
// Allows choosing from different parts websites

window.multiPartsLookup = {
    // Available parts lookup sites
    sites: {
        nexpart: {
            name: 'Nexpart',
            icon: '🔧',
            color: '#667eea',
            url: 'https://www.nexpart.com/napa-search',
            searchParam: 'q',
            requiresVehicle: true
        },
        rockauto: {
            name: 'RockAuto',
            icon: '🚗',
            color: '#ef4444',
            url: 'https://www.rockauto.com/en/catalog/',
            requiresVehicle: true,
            buildUrl: function(year, make, model, part) {
                // RockAuto format: /year,make,model
                return `https://www.rockauto.com/en/catalog/${year},${make},${model}`;
            }
        },
        autozone: {
            name: 'AutoZone',
            icon: '🔴',
            color: '#dc2626',
            url: 'https://www.autozone.com/parts',
            searchParam: 'searchText',
            requiresVehicle: false
        },
        advanceauto: {
            name: 'Advance Auto',
            icon: '🔵',
            color: '#2563eb',
            url: 'https://shop.advanceautoparts.com/',
            searchParam: 'searchTerm',
            requiresVehicle: false
        },
        oreillyauto: {
            name: "O'Reilly Auto",
            icon: '🟡',
            color: '#f59e0b',
            url: 'https://www.oreillyauto.com/',
            searchParam: 'q',
            requiresVehicle: false
        },
        carquest: {
            name: 'Carquest',
            icon: '🟠',
            color: '#ea580c',
            url: 'https://www.carquest.com/search',
            searchParam: 'Ntt',
            requiresVehicle: false
        },
        partsgeek: {
            name: 'PartsGeek',
            icon: '💚',
            color: '#10b981',
            url: 'https://www.partsgeek.com/catalog/',
            requiresVehicle: true,
            buildUrl: function(year, make, model, part) {
                return `https://www.partsgeek.com/catalog/${year}/${make.toLowerCase()}/${model.toLowerCase().replace(/ /g, '_')}.html`;
            }
        },
        oneaauto: {
            name: '1A Auto',
            icon: '🔷',
            color: '#0ea5e9',
            url: 'https://www.1aauto.com/search',
            searchParam: 'q',
            requiresVehicle: false
        }
    },

    // Show parts lookup modal
    showPartsLookupModal: function() {
        console.log('🔍 Opening multi-site parts lookup');

        // Get vehicle info from quote form
        const year = document.getElementById('quote-year')?.value || '';
        const make = document.getElementById('quote-make')?.value || '';
        const model = document.getElementById('quote-model')?.value || '';

        const hasVehicleInfo = year && make && model;

        const modalHTML = `
            <div id="multi-parts-modal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>🔍 Choose Parts Lookup Site</h2>
                        <span class="close" onclick="window.multiPartsLookup.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        ${!hasVehicleInfo ? `
                            <div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                                <p style="margin: 0; color: #92400e;">
                                    ⚠️ <strong>Tip:</strong> Enter vehicle Year, Make, and Model first for better results on some sites.
                                </p>
                            </div>
                        ` : `
                            <div style="background: #f0f9ff; padding: 12px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                                <p style="margin: 0; color: #1e40af;">
                                    <strong>Vehicle:</strong> ${year} ${make} ${model}
                                </p>
                            </div>
                        `}

                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="font-weight: 600; margin-bottom: 8px; display: block;">
                                What part are you looking for? (Optional)
                            </label>
                            <input type="text" id="parts-search-term" class="form-control" 
                                placeholder="e.g., brake pads, oil filter, alternator"
                                style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                        </div>

                        <h4 style="margin: 20px 0 15px 0; color: #1f2937;">Select a Parts Website:</h4>

                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
                            ${Object.entries(this.sites).map(([key, site]) => `
                                <div class="parts-site-card" onclick="window.multiPartsLookup.openSite('${key}')" style="
                                    border: 2px solid #e5e7eb;
                                    border-radius: 8px;
                                    padding: 15px;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    text-align: center;
                                    background: white;
                                " onmouseover="this.style.borderColor='${site.color}'; this.style.background='#f9fafb';" 
                                   onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                                    <div style="font-size: 32px; margin-bottom: 8px;">${site.icon}</div>
                                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${site.name}</div>
                                    ${site.requiresVehicle && !hasVehicleInfo ? 
                                        '<div style="font-size: 11px; color: #ef4444;">⚠️ Needs vehicle info</div>' : 
                                        '<div style="font-size: 11px; color: #10b981;">✓ Ready</div>'
                                    }
                                </div>
                            `).join('')}
                        </div>

                        <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
                            <h5 style="margin: 0 0 8px 0; color: #1f2937;">💡 Tips:</h5>
                            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px;">
                                <li>Sites with vehicle info will show parts specific to your car</li>
                                <li>You can search multiple sites to compare prices</li>
                                <li>Each site opens in a new tab so you can keep comparing</li>
                                <li>Some sites may require you to select your vehicle again</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('multi-parts-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // Open selected parts site
    openSite: function(siteKey) {
        const site = this.sites[siteKey];
        if (!site) return;

        console.log('🔍 Opening', site.name);

        // Get vehicle info
        const year = document.getElementById('quote-year')?.value || '';
        const make = document.getElementById('quote-make')?.value || '';
        const model = document.getElementById('quote-model')?.value || '';
        const searchTerm = document.getElementById('parts-search-term')?.value || '';

        // Check if vehicle info is required but missing
        if (site.requiresVehicle && (!year || !make || !model)) {
            alert(`⚠️ ${site.name} requires vehicle Year, Make, and Model.\n\nPlease fill in vehicle information first.`);
            return;
        }

        // Build URL
        let url;
        if (site.buildUrl) {
            // Custom URL builder
            url = site.buildUrl(year, make, model, searchTerm);
        } else if (searchTerm && site.searchParam) {
            // Standard search URL
            url = `${site.url}?${site.searchParam}=${encodeURIComponent(searchTerm)}`;
        } else {
            // Just the base URL
            url = site.url;
        }

        // Open in new tab
        window.open(url, '_blank');

        console.log('✅ Opened', site.name, 'in new tab');
        
        // Show notification
        this.showNotification(`🔍 Opened ${site.name} in new tab`, 'info');
    },

    // Close modal
    closeModal: function() {
        const modal = document.getElementById('multi-parts-modal');
        if (modal) {
            modal.remove();
        }
    },

    // Show notification
    showNotification: function(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(message);
        }
    }
};

console.log('✅ Multi-site parts lookup loaded');
