// VAPI Car Intake Script
// Handles both appointment arrivals and walk-in/drop-off intakes
// VHICL Pro Service Advisor System

class CarIntakeHandler {
    constructor(vapiKey, shopSettings) {
        this.vapiKey = vapiKey;
        this.shopSettings = shopSettings;
    }

    // VAPI Assistant Script for Car Intake
    getIntakeScript() {
        return `
            You are ALEX, an AI automotive service advisor for ${this.shopSettings.shopName}.
            
            Your job is to handle car intake - both for scheduled appointments and walk-in/drop-off customers.
            
            === INTAKE WORKFLOW ===
            
            1. Greet the customer warmly
            2. Ask if they have an appointment or are walking in
            3. Collect vehicle information
            4. Collect customer information
            5. Document the issue/service needed
            6. Provide estimate or explain next steps
            7. Schedule repair work if possible
            8. Explain drop-off process (if applicable)
            
            === FOR APPOINTMENT ARRIVALS ===
            
            "Hi! Thank you for coming in today. Do you have a scheduled appointment with us?"
            
            If yes:
            - Get their name or appointment ID
            - Verify appointment details
            - Ask about vehicle location (where they parked)
            - Collect vehicle information (make, model, year, color, license plate)
            - Confirm contact information (phone and email)
            - Document any additional issues
            - Explain next steps
            - Ask if they're waiting or dropping off
            - If dropping off: explain key drop box, provide timeline, explain pickup process
            
            If no (walk-in):
            - Apologize for any confusion
            - Proceed with walk-in intake process
            
            === FOR WALK-IN / DROP-OFF INTAKES ===
            
            "Hi! Welcome to ${this.shopSettings.shopName}. How can I help you today?"
            
            1. Vehicle Information:
               - Make, model, year
               - Color
               - License plate number
               - Mileage/odometer reading
               - Where is the vehicle located?
               
            2. Customer Information:
               - Full name
               - Phone number
               - Email address (for quote and updates)
               - Physical address (for records)
               
            3. Service Details:
               - What service or repair do they need?
               - When did the issue start?
               - Any symptoms or warning lights?
               - Have they had any previous repairs?
               - Are there any specific concerns?
               
            4. Vehicle Condition:
               - Are there any existing damages?
               - Any personal items in the vehicle?
               - Fuel level (for test drives)
               - Is the vehicle safe to drive?
               
            5. Intake Type:
               - Are they waiting for the service?
               - Dropping off and leaving the vehicle?
               - If dropping off:
                 * Explain key drop box process
                 * Get permission to move vehicle
                 * Explain where they'll park it
                 * Provide estimated completion time
                 * Explain pickup process
                 * Get emergency contact (if different)
                 * Ask about loaner car or shuttle service
                 
            6. Key Drop Box Instructions (FOR DROP-OFFS):
               - "Please drop your keys in the key drop box"
               - "We'll take it from there and process your vehicle"
               - "Make sure the keys are securely placed in the box"
               - "We'll retrieve them and handle everything"
               - "You don't need to wait for anyone - just drop the keys and we'll take care of it"
               
            7. Timeline and Expectations:
               - Provide estimated completion time
               - Explain diagnosis process (if needed)
               - Discuss potential costs (give range if possible)
               - Explain you'll call with firm quote after diagnosis
               - Get approval for diagnosis fee if applicable
            
            8. Drop-Off Process:
               - "Here's what will happen:"
               - "We'll inspect your vehicle"
               - "We'll call you within [timeframe] with a quote"
               - "We'll ask for your approval before starting work"
               - "We'll call you when it's ready"
               - "You can pick it up between [hours]"
               - "We have your keys from the drop box"
               
            9. Final Confirmation:
               - "Let me confirm your information:"
               - Repeat key details
               - "Is there anything else I should know?"
               - "Is there a good time to reach you for updates?"
               
            === ESTIMATES AND PRICING ===
            
            For common services, provide estimates:
            - Oil change: $${this.shopSettings.laborRate + 30} (estimated)
            - Brake pads: $${(this.shopSettings.laborRate * 1.5) + 150} (estimated)
            - Battery: $${150 + (this.shopSettings.laborRate * 0.5)} (estimated)
            
            Always say "estimated" and explain:
            "This is an initial estimate. After we inspect your vehicle, 
            we'll give you a firm quote before starting any work."
            
            === SCHEDULING REPAIRS ===
            
            If customer approves estimate:
            - Schedule the work (if time permits today)
            - If not today, offer appointment slots
            - Provide confirmed date and time
            - Send confirmation email
            - Send confirmation SMS (if configured)
            
            === COMMUNICATION ===
            
            - Always be professional, friendly, and helpful
            - Speak clearly and at a moderate pace
            - Ask for confirmation of important details
            - Repeat phone numbers and emails back to customer
            - Thank them for choosing your shop
            - Provide shop phone number for follow-up
            
            === SPECIAL SCENARIOS ===
            
            Emergency breakdown:
            - Is the vehicle safe to drive?
            - Should they call a tow truck?
            - Can you squeeze them in today?
            - Prioritize if possible
            
            Complex repairs:
            - Explain diagnosis may take time
            - Provide timeline for quote
            - Get approval for diagnostic fee
            - Emphasize you'll call before doing any work
            
            Multiple issues:
            - Document each issue separately
            - Prioritize by safety/urgency
            - Provide estimates for each item
            - Ask what they'd like to address first
            
            === CLOSING ===
            
            "Thank you for choosing ${this.shopSettings.shopName}. 
            We'll take good care of your vehicle. 
            Is there anything else I can help you with today?"
            
            "I'll send you a confirmation email at [email] with all the details."
        `;
    }

    // Generate work order from intake data
    generateWorkOrder(intakeData) {
        const workOrderId = `WO-${Date.now()}`;
        
        const workOrder = {
            workOrderId: workOrderId,
            createdAt: new Date().toISOString(),
            
            // Customer Information
            customer: {
                name: intakeData.customerName,
                phone: intakeData.customerPhone,
                email: intakeData.customerEmail,
                address: intakeData.customerAddress || null
            },
            
            // Vehicle Information
            vehicle: {
                make: intakeData.vehicleMake,
                model: intakeData.vehicleModel,
                year: intakeData.vehicleYear,
                color: intakeData.vehicleColor || null,
                licensePlate: intakeData.licensePlate,
                mileage: intakeData.mileage
                // VIN removed - not collected from customer
            },
            
            // Service Information
            service: {
                type: intakeData.serviceType, // 'appointment' or 'walkin'
                primaryIssue: intakeData.primaryIssue,
                additionalIssues: intakeData.additionalIssues || [],
                symptoms: intakeData.symptoms,
                previousRepairs: intakeData.previousRepairs || null,
                urgency: intakeData.urgency || 'normal'
            },
            
            // Intake Details
            intake: {
                method: intakeData.intakeMethod, // 'phone' or 'inperson'
                intakeType: intakeData.intakeType, // 'waiting', 'dropoff', 'dropoff_from_home'
                keysFromDropbox: intakeData.keysFromDropbox || false,
                hasAlarm: intakeData.alarmInfo || false,
                alarmInfo: intakeData.alarmInfo || null,
                hasPersonalItems: intakeData.hasPersonalItems || false,
                personalItems: intakeData.personalItems || null,
                fuelLevel: intakeData.fuelLevel || null,
                safeToDrive: intakeData.safeToDrive !== false,
                vehicleLocation: intakeData.vehicleLocation || null
            },
            
            // Drop-off Details (if applicable)
            dropoff: {
                isDropoff: intakeData.intakeType === 'dropoff' || intakeData.intakeType === 'dropoff_from_home',
                needsLoaner: intakeData.needsLoaner || false,
                needsShuttle: intakeData.needsShuttle || false,
                pickupContact: intakeData.pickupContact || null,
                pickupPhone: intakeData.pickupPhone || null,
                parkingInstructions: intakeData.parkingInstructions || null
            },
            
            // Estimates
            estimate: {
                diagnosticFee: intakeData.diagnosticFee || this.shopSettings.diagnosticFee,
                estimatedCost: intakeData.estimatedCost || null,
                estimatedTime: intakeData.estimatedTime || null,
                timelineProvided: intakeData.timelineProvided || false
            },
            
            // Scheduling
            schedule: {
                appointmentDate: intakeData.appointmentDate || null,
                appointmentTime: intakeData.appointmentTime || null,
                estimatedCompletion: intakeData.estimatedCompletion || null,
                completionTime: null
            },
            
            // Approval
            approval: {
                diagnosticApproved: intakeData.diagnosticApproved || false,
                repairApproved: false,
                approvalDate: null,
                finalCost: null
            },
            
            // Status
            status: 'intake_complete',
            
            // Notes
            notes: intakeData.notes || '',
            technicianNotes: '',
            
            // Shop Information
            staff: {
                name: this.shopSettings.shopName,
                phone: this.shopSettings.shopPhone,
                address: this.shopSettings.shopAddress,
                intakeTechnician: intakeData.intakeTechnician || 'ALEX'
            }
        };
        
        return workOrder;
    }

    // Format work order for display/email
    formatWorkOrder(workOrder) {
        return `
            WORK ORDER: ${workOrder.workOrderId}
            Created: ${new Date(workOrder.createdAt).toLocaleString()}
            
            CUSTOMER INFORMATION:
            Name: ${workOrder.customer.name}
            Phone: ${workOrder.customer.phone}
            Email: ${workOrder.customer.email}
            ${workOrder.customer.address ? `Address: ${workOrder.customer.address}` : ''}
            
            VEHICLE INFORMATION:
            ${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}
            ${workOrder.vehicle.color ? `Color: ${workOrder.vehicle.color}` : ''}
            ${workOrder.vehicle.licensePlate ? `License Plate: ${workOrder.vehicle.licensePlate}` : ''}
            Mileage: ${workOrder.vehicle.mileage}
            
            SERVICE REQUESTED:
            Type: ${workOrder.service.type === 'appointment' ? 'Scheduled Appointment' : 'Walk-In / Drop-Off'}
            Primary Issue: ${workOrder.service.primaryIssue}
            ${workOrder.service.symptoms ? `Symptoms: ${workOrder.service.symptoms}` : ''}
            ${workOrder.service.additionalIssues.length > 0 ? `Additional Issues: ${workOrder.service.additionalIssues.join(', ')}` : ''}
            
            INTAKE DETAILS:
            Method: ${workOrder.intake.method === 'phone' ? 'Phone Intake' : 'In-Person Intake'}
            ${workOrder.dropoff.isDropoff ? 'Type: Drop-Off' : 'Type: Waiting for Service'}
            ${workOrder.intake.keysFromDropbox ? 'Keys: Dropped in key drop box' : ''}
            
            ${workOrder.dropoff.isDropoff ? `
            DROP-OFF INFORMATION:
            Vehicle Location: ${workOrder.intake.vehicleLocation || 'Shop Lot'}
            ${workOrder.dropoff.needsLoaner ? 'Loaner Car Requested: Yes' : ''}
            ${workOrder.dropoff.needsShuttle ? 'Shuttle Service Requested: Yes' : ''}
            ` : ''}
            
            ESTIMATE:
            ${workOrder.estimate.diagnosticFee ? `Diagnostic Fee: $${workOrder.estimate.diagnosticFee.toFixed(2)}` : ''}
            ${workOrder.estimate.estimatedCost ? `Estimated Cost: $${workOrder.estimate.estimatedCost.toFixed(2)}` : 'Estimated Cost: TBD after diagnosis'}
            ${workOrder.estimate.estimatedTime ? `Estimated Time: ${workOrder.estimate.estimatedTime}` : ''}
            
            SCHEDULE:
            ${workOrder.schedule.appointmentDate ? `Appointment: ${workOrder.schedule.appointmentDate} at ${workOrder.schedule.appointmentTime}` : 'Appointment: TBD'}
            
            STATUS: ${workOrder.status}
            
            STAFF: ${workOrder.staff.name}
            ${workOrder.staff.address ? `Address: ${workOrder.staff.address}` : ''}
            Phone: ${workOrder.staff.phone}
            
            ${workOrder.notes ? `NOTES:\n${workOrder.notes}` : ''}
        `;
    }
}

module.exports = CarIntakeHandler;
