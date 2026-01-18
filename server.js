#!/usr/bin/env node

/**
 * VHICL Pro - Complete Backend System
 * Hosted on DigitalOcean Droplet
 * 
 * Features:
 * - Nexpart Scraper (real-time parts pricing)
 * - Auto Labor Experts Scraper (real-time labor times)
 * - ALEX Voice Assistant (VAPI integration)
 * - Labor Service (30+ operations)
 * - Email Service (SendGrid)
 * - Shop Settings (configurable)
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Import services
const NexpartScraper = require('./nexpart-scraper.js');
const AutoLaborScraper = require('./auto-labor-scraper.js');
const LaborService = require('./labor-service.js');
const EmailService = require('./email-service-updated.js');
const ShopSettingsService = require('./shop-settings-service.js');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize services
let laborService;
let emailService;
let shopSettingsService;
let nexpartScraper;
let autoLaborScraper;

async function initializeServices() {
    try {
        console.log('🔧 Initializing services...');
        
        // Load shop settings
        shopSettingsService = new ShopSettingsService();
        const shopSettings = await shopSettingsService.getSettings();
        
        // Initialize labor service
        laborService = new LaborService({
            shopId: 'default',
            laborRate: shopSettings.laborRate || 100,
            laborMultiplier: shopSettings.laborMultiplier || 1.0
        });
        
        // Initialize email service
        emailService = new EmailService({
            apiKey: process.env.SENDGRID_API_KEY || shopSettings.sendGridApiKey,
            fromEmail: shopSettings.sendGridFromEmail || 'noreply@vhiclpro.com',
            fromName: shopSettings.sendGridFromName || 'VHICL Pro'
        });
        
        // Initialize scrapers
        nexpartScraper = new NexpartScraper({
            username: process.env.NEXPART_USERNAME || '',
            password: process.env.NEXPART_PASSWORD || '',
            headless: process.env.SCRAPER_HEADLESS !== 'false'
        });
        
        autoLaborScraper = new AutoLaborScraper({
            username: process.env.AUTO_LABOR_USERNAME || '',
            password: process.env.AUTO_LABOR_PASSWORD || '',
            headless: process.env.SCRAPER_HEADLESS !== 'false'
        });
        
        console.log('✅ All services initialized successfully');
        console.log(`📊 Labor rate: $${shopSettings.laborRate}/hour`);
        console.log(`🌐 Scrapers: ${process.env.SCRAPER_HEADLESS !== 'false' ? 'Headless' : 'Headed'}`);
        
    } catch (error) {
        console.error('❌ Error initializing services:', error);
        throw error;
    }
}

// ========================================
// HEALTH CHECK ENDPOINT
// ========================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            backend: true,
            laborService: !!laborService,
            emailService: !!emailService,
            shopSettings: !!shopSettingsService,
            nexpartScraper: !!nexpartScraper,
            autoLaborScraper: !!autoLaborScraper
        }
    });
});

// ========================================
// PARTS PRICING ENDPOINTS
// ========================================

/**
 * GET /api/parts/search
 * Search for parts using Nexpart scraper
 */
app.get('/api/parts/search', async (req, res) => {
    try {
        const { partNumber, make, model, year } = req.query;
        
        if (!partNumber) {
            return res.status(400).json({ error: 'Part number is required' });
        }
        
        console.log(`🔍 Searching for part: ${partNumber} (${make} ${model} ${year})`);
        
        // Use Nexpart scraper
        const partsData = await nexpartScraper.searchParts({
            partNumber,
            make,
            model,
            year
        });
        
        res.json({
            success: true,
            data: partsData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error searching parts:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            fallback: 'Database lookup available'
        });
    }
});

/**
 * POST /api/parts/check-availability
 * Check parts availability from multiple sources
 */
app.post('/api/parts/check-availability', async (req, res) => {
    try {
        const { parts, vehicleInfo } = req.body;
        
        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return res.status(400).json({ error: 'Parts array is required' });
        }
        
        console.log(`📦 Checking availability for ${parts.length} parts`);
        
        const results = [];
        
        for (const part of parts) {
            try {
                // Try Nexpart scraper first
                const nexpartResult = await nexpartScraper.getPartAvailability({
                    partNumber: part.partNumber,
                    make: vehicleInfo?.make,
                    model: vehicleInfo?.model,
                    year: vehicleInfo?.year
                });
                
                results.push({
                    part: part,
                    availability: nexpartResult,
                    source: 'Nexpart'
                });
                
            } catch (error) {
                console.error(`Error checking part ${part.partNumber}:`, error);
                results.push({
                    part: part,
                    availability: null,
                    source: 'Error',
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            results: results,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error checking parts availability:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// LABOR TIME ENDPOINTS
// ========================================

/**
 * GET /api/labor/operations
 * Get all labor operations
 */
app.get('/api/labor/operations', async (req, res) => {
    try {
        const operations = await laborService.getAllOperations();
        res.json({
            success: true,
            data: operations,
            count: operations.length
        });
    } catch (error) {
        console.error('Error getting labor operations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/labor/search
 * Search labor operations
 */
app.get('/api/labor/search', async (req, res) => {
    try {
        const { q, category } = req.query;
        const results = await laborService.searchOperations(q, category);
        res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (error) {
        console.error('Error searching labor operations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/labor/estimate/:operationId
 * Get labor estimate for operation
 */
app.get('/api/labor/estimate/:operationId', async (req, res) => {
    try {
        const { operationId } = req.params;
        const estimate = await laborService.getEstimate(operationId);
        
        if (!estimate) {
            return res.status(404).json({
                success: false,
                error: 'Operation not found'
            });
        }
        
        res.json({
            success: true,
            data: estimate
        });
    } catch (error) {
        console.error('Error getting labor estimate:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/labor/quick-estimate
 * Quick estimate from description (uses Auto Labor Experts scraper)
 */
app.post('/api/labor/quick-estimate', async (req, res) => {
    try {
        const { description, make, model, year } = req.body;
        
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }
        
        console.log(`🔧 Quick estimate for: ${description} (${make} ${model} ${year})`);
        
        // Try Auto Labor Experts scraper first
        try {
            const laborTime = await autoLaborScraper.getLaborTime({
                description,
                make,
                model,
                year
            });
            
            const estimate = await laborService.calculateEstimate(laborTime.hours);
            
            res.json({
                success: true,
                data: {
                    description,
                    laborTime: laborTime,
                    estimate: estimate,
                    source: 'Auto Labor Experts'
                }
            });
            
        } catch (scraperError) {
            console.error('Scraper error, falling back to database:', scraperError);
            
            // Fallback to database search
            const dbResults = await laborService.searchOperations(description);
            
            if (dbResults.length > 0) {
                const estimate = await laborService.getEstimate(dbResults[0].id);
                
                res.json({
                    success: true,
                    data: {
                        description,
                        laborTime: { hours: dbResults[0].laborTime },
                        estimate: estimate,
                        source: 'Database (fallback)'
                    }
                });
            } else {
                throw new Error('No labor time found');
            }
        }
        
    } catch (error) {
        console.error('Error getting quick estimate:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// SHOP SETTINGS ENDPOINTS
// ========================================

/**
 * GET /api/shop/settings
 * Get shop settings
 */
app.get('/api/shop/settings', async (req, res) => {
    try {
        const settings = await shopSettingsService.getSettings();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error getting shop settings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/shop/settings
 * Update shop settings
 */
app.post('/api/shop/settings', async (req, res) => {
    try {
        const updates = req.body;
        const settings = await shopSettingsService.updateSettings(updates);
        
        // Reinitialize services if critical settings changed
        if (updates.laborRate || updates.laborMultiplier) {
            laborService = new LaborService({
                shopId: 'default',
                laborRate: settings.laborRate || 100,
                laborMultiplier: settings.laborMultiplier || 1.0
            });
        }
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error updating shop settings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// EMAIL ENDPOINTS
// ========================================

/**
 * POST /api/email/send
 * Send email
 */
app.post('/api/email/send', async (req, res) => {
    try {
        const { to, subject, html, text } = req.body;
        
        if (!to || !subject) {
            return res.status(400).json({ error: 'To and subject are required' });
        }
        
        const result = await emailService.sendEmail({
            to,
            subject,
            html,
            text
        });
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/email/work-order
 * Send work order email
 */
app.post('/api/email/work-order', async (req, res) => {
    try {
        const { workOrder } = req.body;
        
        if (!workOrder) {
            return res.status(400).json({ error: 'Work order data is required' });
        }
        
        const result = await emailService.sendWorkOrder(workOrder);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error sending work order email:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// CAR INTAKE ENDPOINTS
// ========================================

/**
 * POST /api/intake/start
 * Start car intake process
 */
app.post('/api/intake/start', async (req, res) => {
    try {
        const { vehicleInfo, customerInfo, intakeType } = req.body;
        
        if (!vehicleInfo || !customerInfo) {
            return res.status(400).json({ error: 'Vehicle and customer info are required' });
        }
        
        console.log(`🚗 Starting car intake: ${intakeType} for ${vehicleInfo.make} ${vehicleInfo.model}`);
        
        // Generate work order
        const workOrder = {
            id: `WO-${Date.now()}`,
            vehicleInfo,
            customerInfo,
            intakeType,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: workOrder
        });
    } catch (error) {
        console.error('Error starting car intake:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/intake/complete
 * Complete car intake and generate work order
 */
app.post('/api/intake/complete', async (req, res) => {
    try {
        const { workOrderId, parts, labor } = req.body;
        
        console.log(`✅ Completing car intake for work order: ${workOrderId}`);
        
        // Calculate totals
        const partsTotal = parts.reduce((sum, p) => sum + (p.price || 0), 0);
        const laborTotal = labor.reduce((sum, l) => sum + (l.cost || 0), 0);
        
        const workOrder = {
            id: workOrderId,
            parts,
            labor,
            partsTotal,
            laborTotal,
            subtotal: partsTotal + laborTotal,
            tax: (partsTotal + laborTotal) * 0.08,
            total: (partsTotal + laborTotal) * 1.08,
            status: 'completed',
            completedAt: new Date().toISOString()
        };
        
        // Send confirmation email
        try {
            await emailService.sendWorkOrder(workOrder);
        } catch (emailError) {
            console.error('Error sending work order email:', emailError);
        }
        
        res.json({
            success: true,
            data: workOrder
        });
    } catch (error) {
        console.error('Error completing car intake:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// SCRAPER STATUS ENDPOINTS
// ========================================

/**
 * GET /api/scrapers/status
 * Check scraper status
 */
app.get('/api/scrapers/status', async (req, res) => {
    try {
        const status = {
            nexpart: {
                initialized: !!nexpartScraper,
                configured: !!(process.env.NEXPART_USERNAME && process.env.NEXPART_PASSWORD),
                lastCheck: new Date().toISOString()
            },
            autoLabor: {
                initialized: !!autoLaborScraper,
                configured: !!(process.env.AUTO_LABOR_USERNAME && process.env.AUTO_LABOR_PASSWORD),
                lastCheck: new Date().toISOString()
            }
        };
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error checking scraper status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/scrapers/test
 * Test scrapers
 */
app.post('/api/scrapers/test', async (req, res) => {
    try {
        const { scraper } = req.body;
        
        if (scraper === 'nexpart') {
            const testResult = await nexpartScraper.testConnection();
            res.json({
                success: true,
                scraper: 'nexpart',
                data: testResult
            });
        } else if (scraper === 'autoLabor') {
            const testResult = await autoLaborScraper.testConnection();
            res.json({
                success: true,
                scraper: 'autoLabor',
                data: testResult
            });
        } else {
            res.status(400).json({ error: 'Invalid scraper name' });
        }
    } catch (error) {
        console.error('Error testing scraper:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// FALLBACK ROUTE - SERVE FRONTEND
// ========================================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================================
// ERROR HANDLING
// ========================================

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ========================================
// START SERVER
// ========================================

async function startServer() {
    try {
        // Initialize services
        await initializeServices();
        
        // Start server
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 VHICL Pro Backend Server');
            console.log('=' .repeat(50));
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/health`);
            console.log(`📊 API endpoints: http://localhost:${PORT}/api/*`);
            console.log(`🎨 Frontend: http://localhost:${PORT}/`);
            console.log('');
            console.log('📦 Services:');
            console.log(`   - Nexpart Scraper: ${nexpartScraper ? '✅' : '❌'}`);
            console.log(`   - Auto Labor Scraper: ${autoLaborScraper ? '✅' : '❌'}`);
            console.log(`   - Labor Service: ${laborService ? '✅' : '❌'}`);
            console.log(`   - Email Service: ${emailService ? '✅' : '❌'}`);
            console.log(`   - Shop Settings: ${shopSettingsService ? '✅' : '❌'}`);
            console.log('');
            console.log('🔗 Ready for requests!');
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();