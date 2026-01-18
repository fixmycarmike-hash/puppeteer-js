/**
 * VAPI Sync Client for VHICL Pro
 * Syncs localStorage data with backend server
 */

class VAPISyncClient {
    constructor() {
        this.serverUrl = '';
        this.syncInterval = null;
        this.initialized = false;
    }

    /**
     * Initialize sync client
     */
    initialize(serverUrl) {
        this.serverUrl = serverUrl;
        this.initialized = true;
        
        console.log('📡 VAPI Sync Client initialized:', serverUrl);
        
        // Start auto-sync every 30 seconds
        this.startAutoSync();
        
        // Sync immediately
        this.syncData();
    }

    /**
     * Start automatic syncing
     */
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            this.syncData();
        }, 30000); // Every 30 seconds
        
        console.log('✅ Auto-sync started (every 30 seconds)');
    }

    /**
     * Stop automatic syncing
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Auto-sync stopped');
        }
    }

    /**
     * Sync data to backend
     */
    async syncData() {
        if (!this.initialized || !this.serverUrl) {
            console.warn('⚠️ Sync client not initialized');
            return;
        }

        try {
            // Gather data from localStorage
            const data = {
                customers: JSON.parse(localStorage.getItem('customers') || '[]'),
                vehicles: JSON.parse(localStorage.getItem('vehicles') || '[]'),
                techJobs: JSON.parse(localStorage.getItem('techJobs') || '[]'),
                appointments: JSON.parse(localStorage.getItem('appointments') || '[]'),
                settings: JSON.parse(localStorage.getItem('shopSettings') || '{}')
            };

            // Send to backend
            const response = await fetch(`${this.serverUrl}/api/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Data synced successfully:', result);
            } else {
                console.error('❌ Sync failed:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Sync error:', error);
        }
    }

    /**
     * Trigger outbound call: Estimate Ready
     */
    async callCustomerWithEstimate(jobId) {
        if (!this.initialized || !this.serverUrl) {
            console.warn('⚠️ Sync client not initialized');
            return { success: false, error: 'Not initialized' };
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/outbound/estimate-ready`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ job_id: jobId })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Outbound call initiated for estimate');
                return { success: true, message: 'AI will call customer to discuss estimate' };
            } else {
                console.error('❌ Failed to initiate call:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Error initiating call:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Trigger outbound call: Car Ready
     */
    async callCustomerCarReady(jobId) {
        if (!this.initialized || !this.serverUrl) {
            console.warn('⚠️ Sync client not initialized');
            return { success: false, error: 'Not initialized' };
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/outbound/car-ready`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ job_id: jobId })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Outbound call initiated for car ready notification');
                return { success: true, message: 'AI will call customer to notify car is ready' };
            } else {
                console.error('❌ Failed to initiate call:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Error initiating call:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check server health
     */
    async checkHealth() {
        if (!this.serverUrl) {
            return { status: 'not_configured' };
        }

        try {
            const response = await fetch(`${this.serverUrl}/health`);
            const result = await response.json();
            return result;
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
}

// Initialize global instance
window.vapiSyncClient = new VAPISyncClient();

// Auto-initialize if server URL is in settings
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const settings = JSON.parse(localStorage.getItem('shopSettings') || '{}');
        if (settings.vapiServerUrl) {
            window.vapiSyncClient.initialize(settings.vapiServerUrl);
        }
    }, 1000);
});

console.log('✅ VAPI Sync Client loaded');