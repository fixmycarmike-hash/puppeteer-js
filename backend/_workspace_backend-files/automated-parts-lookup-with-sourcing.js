// Automated Parts Lookup with Sourcing System - FIXED VERSION
// Fixed to match backend response format (status/parts instead of success/results)
// Accessible via both window.automatedPartsLookup and window.automatedPartsLookupWithSourcing

const partsLookupSystem = {
    async lookupPart(partName, vehicleInfo) {
        // Check if backend is configured
        const settings = JSON.parse(localStorage.getItem('shopSettings') || '{}');
        const serverUrl = settings.vapiServerUrl;

        if (!serverUrl) {
            alert('Backend URL not configured. Please configure your shop settings.');
            return null;
        }

        // Show loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.textContent = '⏳ Searching for parts...';
        loadingMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            z-index: 10000;
            font-size: 16px;
        `;
        document.body.appendChild(loadingMsg);

        let results = [];
        let backendUsed = false;

        try {
            if (serverUrl) {
                // Try backend first (with timeout)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(`${serverUrl}/api/vapi/check-parts-availability`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        part_name: partName,
                        vehicle_info: vehicleInfo
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const result = await response.json();

                // FIXED: Check for result.status and result.parts (matching backend response)
                if (result.status === 'found' && result.parts && result.parts.length > 0) {
                    results = result.parts;
                    backendUsed = true;
                    console.log('✅ Parts found via backend:', results);
                }
            }

            // Remove loading message
            document.body.removeChild(loadingMsg);

            if (results.length === 0) {
                // Use Parts Sourcing System as fallback
                console.log('Backend unavailable, using Parts Sourcing System...');
                const sourcingResult = await window.partsSourcingSystem.checkPartAvailability(partName, vehicleInfo);
                
                if (sourcingResult && sourcingResult.available) {
                    results = [sourcingResult];
                }
            }

            // Show results
            if (results.length > 0) {
                this.showPartResults(results, backendUsed);
            } else {
                alert(`No parts found for "${partName}" for ${vehicleInfo}`);
            }

            return results;

        } catch (error) {
            // Remove loading message
            if (document.body.contains(loadingMsg)) {
                document.body.removeChild(loadingMsg);
            }

            console.error('Parts lookup error:', error);

            // Check if it's a timeout
            if (error.name === 'AbortError') {
                const errorMsg = '⏱️ Parts lookup timed out.\n\nThe backend server is not responding.\n\nTo wake it up:\n• Open: ' + (serverUrl || 'backend URL') + '/health\n• Wait 60 seconds\n• Then try again\n\nWould you like to use manual parts lookup instead?\n(Opens 8 parts websites)';
                const useManual = confirm(errorMsg);
                
                if (useManual) {
                    this.openManualPartsSites(partName, vehicleInfo);
                }
            } else {
                // Use fallback system
                const sourcingResult = await window.partsSourcingSystem.checkPartAvailability(partName, vehicleInfo);
                
                if (sourcingResult && sourcingResult.available) {
                    this.showPartResults([sourcingResult], false);
                } else {
                    alert(`Error searching for parts: ${error.message}`);
                }
            }

            return null;
        }
    },

    showPartResults(parts, fromBackend) {
        // Create modal to show results
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 600px;
            width: 90%;
        `;

        let source = fromBackend ? '🔧 Backend (AutoZone)' : '🏪 Parts Sourcing System';
        
        modal.innerHTML = `
            <h2 style="margin-top: 0; color: #2563eb;">Parts Found - ${source}</h2>
            <div style="margin: 20px 0;">
                ${parts.map(part => `
                    <div style="padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                        <h3 style="margin: 0 0 10px 0; color: #1e40af;">${part.name}</h3>
                        <p style="margin: 5px 0;"><strong>Price:</strong> $${part.price.toFixed(2)}</p>
                        <p style="margin: 5px 0;"><strong>Source:</strong> ${part.source}</p>
                        <p style="margin: 5px 0;"><strong>Available:</strong> ${part.available ? '✅ Yes' : '❌ No'}</p>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: right;">
                <button onclick="this.closest('div').remove(); document.querySelector('.part-results-modal')?.remove();" 
                        style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    openManualPartsSites(partName, vehicleInfo) {
        const sites = [
            'https://www.autozone.com',
            'https://www.oreillyauto.com',
            'https://shop.advanceautoparts.com',
            'https://www.napaonline.com',
            'https://www.carquest.com',
            'https://www.rockauto.com',
            'https://www.partsgeek.com',
            'https://www.amazon.com/s?k=' + encodeURIComponent(partName)
        ];

        alert('Opening ' + sites.length + ' parts websites for manual lookup...');
        
        sites.forEach((site, index) => {
            setTimeout(() => {
                window.open(site, '_blank');
            }, index * 500);
        });
    }
};

// Make it available via both names for compatibility
window.automatedPartsLookupWithSourcing = partsLookupSystem;
window.automatedPartsLookup = partsLookupSystem;

console.log('✅ Automated Parts Lookup with Sourcing System loaded (FIXED VERSION)');