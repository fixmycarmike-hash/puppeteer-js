// Intake API Endpoints
// Add to service-advisor-backend-complete-alex-final.js
// VHICL Pro Service Advisor System

/**
 * ================================
 * CAR INTAKE API ENDPOINTS
 * ================================
 * 
 * These endpoints handle both appointment arrivals and walk-in/drop-off intakes
 * via ALEX voice assistant (VAPI)
 */

// Import CarIntakeHandler (add to requires at top of file)
const CarIntakeHandler = require('./vapi-car-intake.js');

// Initialize Car Intake Handler (add after other initializations)
const carIntakeHandler = new CarIntakeHandler(shopSettings.vapiKey, shopSettings);

/**
 * POST /api/intake/start
 * Start car intake process via phone call
 */
app.post('/api/intake/start', async (req, res) => {
    try {
        const { customerPhone, intakeMethod } = req.body;
        
        if (!customerPhone) {
            return res.status(400).json({ 
                success: false, 
                error: 'Customer phone number is required' 
            });
        }
        
        // Create intake session
        const intakeSession = {
            sessionId: `intake_${Date.now()}`,
            customerPhone: customerPhone,
            intakeMethod: intakeMethod || 'phone',
            status: 'initiated',
            startTime: new Date().toISOString(),
            data: {}
        };
        
        // Trigger VAPI call with intake script
        const vapiCall = await vapiService.createCall({
            to: customerPhone,
            script: carIntakeHandler.getIntakeScript(),
            metadata: {
                type: 'car_intake',
                sessionId: intakeSession.sessionId
            }
        });
        
        // Store session
        intakeSessions[intakeSession.sessionId] = intakeSession;
        
        res.json({
            success: true,
            sessionId: intakeSession.sessionId,
            callId: vapiCall.id,
            message: 'Intake call initiated. ALEX will call customer shortly.'
        });
        
    } catch (error) {
        console.error('Error starting intake:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to start intake process' 
        });
    }
});

/**
 * POST /api/intake/complete
 * Complete car intake and generate work order
 */
app.post('/api/intake/complete', async (req, res) => {
    try {
        const { sessionId, intakeData } = req.body;
        
        if (!sessionId || !intakeData) {
            return res.status(400).json({ 
                success: false, 
                error: 'Session ID and intake data are required' 
            });
        }
        
        // Validate required fields (VIN removed)
        const requiredFields = [
            'customerName', 'customerPhone', 'customerEmail',
            'vehicleMake', 'vehicleModel', 'vehicleYear',
            'primaryIssue'
        ];
        
        const missingFields = requiredFields.filter(field => !intakeData[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }
        
        // Generate work order
        const workOrder = carIntakeHandler.generateWorkOrder({
            ...intakeData,
            intakeMethod: 'phone'
        });
        
        // Store work order
        workOrders[workOrder.workOrderId] = workOrder;
        
        // Update session
        if (intakeSessions[sessionId]) {
            intakeSessions[sessionId].status = 'completed';
            intakeSessions[sessionId].workOrderId = workOrder.workOrderId;
            intakeSessions[sessionId].completedAt = new Date().toISOString();
        }
        
        // Send confirmation email
        try {
            await emailService.sendWorkOrderConfirmation({
                to: workOrder.customer.email,
                workOrderId: workOrder.workOrderId,
                workOrder: workOrder
            });
        } catch (emailError) {
            console.error('Error sending work order email:', emailError);
            // Continue even if email fails
        }
        
        // Send SMS confirmation (if configured)
        if (shopSettings.smsEnabled) {
            try {
                await smsService.sendWorkOrderSMS({
                    to: workOrder.customer.phone,
                    workOrderId: workOrder.workOrderId
                });
            } catch (smsError) {
                console.error('Error sending SMS:', smsError);
            }
        }
        
        res.json({
            success: true,
            workOrderId: workOrder.workOrderId,
            message: 'Work order created successfully',
            workOrder: workOrder
        });
        
    } catch (error) {
        console.error('Error completing intake:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to complete intake process' 
        });
    }
});

/**
 * GET /api/intake/status/:sessionId
 * Get intake session status
 */
app.get('/api/intake/status/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = intakeSessions[sessionId];
        if (!session) {
            return res.status(404).json({ 
                success: false, 
                error: 'Intake session not found' 
            });
        }
        
        // Get VAPI call status
        if (session.callId) {
            const callStatus = await vapiService.getCallStatus(session.callId);
            session.callStatus = callStatus;
        }
        
        res.json({
            success: true,
            session: session
        });
        
    } catch (error) {
        console.error('Error getting intake status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get intake status' 
        });
    }
});

/**
 * POST /api/intake/walkin
 * Create work order for walk-in customer (staff initiated)
 */
app.post('/api/intake/walkin', async (req, res) => {
    try {
        const intakeData = req.body;
        
        // Validate required fields (VIN removed)
        const requiredFields = [
            'customerName', 'customerPhone', 'customerEmail',
            'vehicleMake', 'vehicleModel', 'vehicleYear',
            'primaryIssue', 'intakeType'
        ];
        
        const missingFields = requiredFields.filter(field => !intakeData[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }
        
        // Generate work order
        const workOrder = carIntakeHandler.generateWorkOrder({
            ...intakeData,
            intakeMethod: 'inperson',
            serviceType: 'walkin'
        });
        
        // Store work order
        workOrders[workOrder.workOrderId] = workOrder;
        
        // Send confirmation email
        try {
            await emailService.sendWorkOrderConfirmation({
                to: workOrder.customer.email,
                workOrderId: workOrder.workOrderId,
                workOrder: workOrder
            });
        } catch (emailError) {
            console.error('Error sending work order email:', emailError);
        }
        
        res.json({
            success: true,
            workOrderId: workOrder.workOrderId,
            message: 'Work order created successfully',
            workOrder: workOrder
        });
        
    } catch (error) {
        console.error('Error creating walk-in work order:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create work order' 
        });
    }
});

/**
 * POST /api/intake/dropoff
 * Handle vehicle drop-off from home (customer calls from home)
 */
app.post('/api/intake/dropoff', async (req, res) => {
    try {
        const { customerPhone, customerEmail, vehicleInfo, serviceInfo } = req.body;
        
        // Start phone call for detailed intake
        const vapiCall = await vapiService.createCall({
            to: customerPhone,
            script: carIntakeHandler.getIntakeScript(),
            metadata: {
                type: 'dropoff_from_home',
                customerPhone: customerPhone,
                customerEmail: customerEmail,
                vehicleInfo: vehicleInfo,
                serviceInfo: serviceInfo
            }
        });
        
        // Create intake session
        const intakeSession = {
            sessionId: `dropoff_${Date.now()}`,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            intakeMethod: 'phone',
            intakeType: 'dropoff_from_home',
            status: 'initiated',
            startTime: new Date().toISOString(),
            callId: vapiCall.id,
            data: {
                vehicleInfo: vehicleInfo,
                serviceInfo: serviceInfo
            }
        };
        
        intakeSessions[intakeSession.sessionId] = intakeSession;
        
        res.json({
            success: true,
            sessionId: intakeSession.sessionId,
            callId: vapiCall.id,
            message: 'ALEX will call customer to complete drop-off intake process'
        });
        
    } catch (error) {
        console.error('Error starting drop-off intake:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to start drop-off intake' 
        });
    }
});

/**
 * GET /api/intake/workorder/:workOrderId
 * Get work order details
 */
app.get('/api/intake/workorder/:workOrderId', async (req, res) => {
    try {
        const { workOrderId } = req.params;
        
        const workOrder = workOrders[workOrderId];
        if (!workOrder) {
            return res.status(404).json({ 
                success: false, 
                error: 'Work order not found' 
            });
        }
        
        res.json({
            success: true,
            workOrder: workOrder
        });
        
    } catch (error) {
        console.error('Error getting work order:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get work order' 
        });
    }
});

/**
 * PUT /api/intake/workorder/:workOrderId
 * Update work order
 */
app.put('/api/intake/workorder/:workOrderId', async (req, res) => {
    try {
        const { workOrderId } = req.params;
        const updates = req.body;
        
        const workOrder = workOrders[workOrderId];
        if (!workOrder) {
            return res.status(404).json({ 
                success: false, 
                error: 'Work order not found' 
            });
        }
        
        // Update work order
        Object.assign(workOrder, updates);
        workOrder.updatedAt = new Date().toISOString();
        
        res.json({
            success: true,
            message: 'Work order updated successfully',
            workOrder: workOrder
        });
        
    } catch (error) {
        console.error('Error updating work order:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update work order' 
        });
    }
});

/**
 * GET /api/intake/workorders
 * Get all work orders (with filters)
 */
app.get('/api/intake/workorders', async (req, res) => {
    try {
        const { status, type, date } = req.query;
        
        let filteredOrders = Object.values(workOrders);
        
        // Apply filters
        if (status) {
            filteredOrders = filteredOrders.filter(wo => wo.status === status);
        }
        
        if (type) {
            filteredOrders = filteredOrders.filter(wo => 
                wo.service.type === type || wo.intake.intakeType === type
            );
        }
        
        if (date) {
            filteredOrders = filteredOrders.filter(wo => 
                wo.createdAt.startsWith(date)
            );
        }
        
        // Sort by creation date (newest first)
        filteredOrders.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        res.json({
            success: true,
            count: filteredOrders.length,
            workOrders: filteredOrders
        });
        
    } catch (error) {
        console.error('Error getting work orders:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get work orders' 
        });
    }
});

/**
 * POST /api/intake/diagnose/:workOrderId
 * Mark diagnosis complete and provide quote
 */
app.post('/api/intake/diagnose/:workOrderId', async (req, res) => {
    try {
        const { workOrderId } = req.params;
        const { diagnosticResults, quote, needsApproval } = req.body;
        
        const workOrder = workOrders[workOrderId];
        if (!workOrder) {
            return res.status(404).json({ 
                success: false, 
                error: 'Work order not found' 
            });
        }
        
        // Update work order with diagnosis
        workOrder.diagnosis = {
            completedAt: new Date().toISOString(),
            results: diagnosticResults,
            quote: quote,
            needsApproval: needsApproval !== false
        };
        
        workOrder.status = 'awaiting_approval';
        
        // Send quote to customer
        try {
            await emailService.sendQuote({
                to: workOrder.customer.email,
                workOrderId: workOrder.workOrderId,
                quote: quote,
                workOrder: workOrder
            });
        } catch (emailError) {
            console.error('Error sending quote email:', emailError);
        }
        
        res.json({
            success: true,
            message: 'Diagnosis completed and quote sent to customer',
            workOrder: workOrder
        });
        
    } catch (error) {
        console.error('Error completing diagnosis:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to complete diagnosis' 
        });
    }
});

/**
 * POST /api/intake/approve/:workOrderId
 * Customer approves quote/repairs
 */
app.post('/api/intake/approve/:workOrderId', async (req, res) => {
    try {
        const { workOrderId } = req.params;
        const { approvedBy, notes } = req.body;
        
        const workOrder = workOrders[workOrderId];
        if (!workOrder) {
            return res.status(404).json({ 
                success: false, 
                error: 'Work order not found' 
            });
        }
        
        // Update approval
        workOrder.approval.repairApproved = true;
        workOrder.approval.approvedBy = approvedBy;
        workOrder.approval.approvalDate = new Date().toISOString();
        workOrder.approval.notes = notes;
        workOrder.status = 'approved';
        
        // Send approval confirmation
        try {
            await emailService.sendApprovalConfirmation({
                to: workOrder.customer.email,
                workOrderId: workOrder.workOrderId,
                workOrder: workOrder
            });
        } catch (emailError) {
            console.error('Error sending approval email:', emailError);
        }
        
        res.json({
            success: true,
            message: 'Quote approved successfully',
            workOrder: workOrder
        });
        
    } catch (error) {
        console.error('Error approving quote:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to approve quote' 
        });
    }
});

// Storage for intake sessions and work orders (add to global scope)
const intakeSessions = {};
const workOrders = {};

console.log('📋 Car Intake API endpoints loaded');
console.log('   POST /api/intake/start - Start intake process');
console.log('   POST /api/intake/complete - Complete intake and generate work order');
console.log('   GET /api/intake/status/:sessionId - Get intake status');
console.log('   POST /api/intake/walkin - Create walk-in work order');
console.log('   POST /api/intake/dropoff - Handle drop-off from home');
console.log('   GET /api/intake/workorder/:workOrderId - Get work order');
console.log('   PUT /api/intake/workorder/:workOrderId - Update work order');
console.log('   GET /api/intake/workorders - Get all work orders');
console.log('   POST /api/intake/diagnose/:workOrderId - Complete diagnosis');
console.log('   POST /api/intake/approve/:workOrderId - Approve quote');