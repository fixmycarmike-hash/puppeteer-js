// Email Service - Work Order Functions
// Add these functions to email-service-updated.js
// VHICL Pro Service Advisor System

/**
 * Send Work Order Confirmation Email
 */
async function sendWorkOrderConfirmation({ to, workOrderId, workOrder }) {
    const workOrderText = workOrder.estimate.estimatedCost 
        ? `Estimated Cost: $${workOrder.estimate.estimatedCost.toFixed(2)}`
        : 'Estimated Cost: TBD after diagnosis';

    const msg = {
        to: to,
        from: {
            email: shopSettings.sendgridFromEmail,
            name: shopSettings.sendgridFromName || shopSettings.shopName
        },
        subject: `Work Order Confirmation - ${workOrderId}`,
        text: `
            Thank you for choosing ${shopSettings.shopName}!
            
            WORK ORDER: ${workOrderId}
            Created: ${new Date(workOrder.createdAt).toLocaleString()}
            
            CUSTOMER INFORMATION:
            Name: ${workOrder.customer.name}
            Phone: ${workOrder.customer.phone}
            Email: ${workOrder.customer.email}
            
            VEHICLE INFORMATION:
            ${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}
            ${workOrder.vehicle.color ? `Color: ${workOrder.vehicle.color}` : ''}
            ${workOrder.vehicle.licensePlate ? `License Plate: ${workOrder.vehicle.licensePlate}` : ''}
            Mileage: ${workOrder.vehicle.mileage}
            
            SERVICE REQUESTED:
            ${workOrder.service.primaryIssue}
            ${workOrder.service.symptoms ? `\nSymptoms: ${workOrder.service.symptoms}` : ''}
            
            ${workOrder.estimate.diagnosticFee ? `Diagnostic Fee: $${workOrder.estimate.diagnosticFee.toFixed(2)}` : ''}
            ${workOrderText}
            ${workOrder.estimate.estimatedTime ? `Estimated Time: ${workOrder.estimate.estimatedTime}` : ''}
            
            ${workOrder.dropoff.isDropoff ? `
            DROP-OFF INFORMATION:
            Your vehicle has been received and is being processed.
            We will contact you within ${workOrder.estimate.estimatedTime || '24-48 hours'} with a firm quote.
            You must approve the quote before any repairs are started.
            
            We have your keys on file.
            ` : `
            APPOINTMENT INFORMATION:
            ${workOrder.schedule.appointmentDate ? `Date: ${workOrder.schedule.appointmentDate}` : ''}
            ${workOrder.schedule.appointmentTime ? `Time: ${workOrder.schedule.appointmentTime}` : ''}
            `}
            
            NEXT STEPS:
            1. We will inspect your vehicle
            2. We will call you with a firm quote
            3. You must approve the quote before we proceed
            4. We will complete the repairs
            5. We will call you when your vehicle is ready
            
            CONTACT INFORMATION:
            ${shopSettings.shopName}
            Phone: ${shopSettings.shopPhone}
            ${shopSettings.shopAddress ? `Address: ${shopSettings.shopAddress}` : ''}
            
            If you have any questions, please call us at ${shopSettings.shopPhone}.
            
            Thank you for your business!
        `,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { margin: 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .section { margin-bottom: 20px; }
                    .section h2 { color: #667eea; font-size: 18px; margin-bottom: 10px; }
                    .info-row { display: flex; margin-bottom: 8px; }
                    .label { font-weight: bold; width: 150px; }
                    .value { flex: 1; }
                    .highlight { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
                    .work-order-id { font-size: 24px; font-weight: bold; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚗 Work Order Confirmation</h1>
                    </div>
                    
                    <div class="content">
                        <div class="work-order-id">${workOrderId}</div>
                        <p style="text-align: center; color: #666; margin-bottom: 30px;">
                            Created: ${new Date(workOrder.createdAt).toLocaleString()}
                        </p>
                        
                        <div class="section">
                            <h2>👤 Customer Information</h2>
                            <div class="info-row"><span class="label">Name:</span><span class="value">${workOrder.customer.name}</span></div>
                            <div class="info-row"><span class="label">Phone:</span><span class="value">${workOrder.customer.phone}</span></div>
                            <div class="info-row"><span class="label">Email:</span><span class="value">${workOrder.customer.email}</span></div>
                        </div>
                        
                        <div class="section">
                            <h2>🚙 Vehicle Information</h2>
                            <div class="info-row"><span class="label">Vehicle:</span><span class="value">${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}</span></div>
                            ${workOrder.vehicle.color ? `<div class="info-row"><span class="label">Color:</span><span class="value">${workOrder.vehicle.color}</span></div>` : ''}
                            ${workOrder.vehicle.licensePlate ? `<div class="info-row"><span class="label">License Plate:</span><span class="value">${workOrder.vehicle.licensePlate}</span></div>` : ''}
                            <div class="info-row"><span class="label">Mileage:</span><span class="value">${workOrder.vehicle.mileage}</span></div>
                        </div>
                        
                        <div class="section">
                            <h2>🔧 Service Requested</h2>
                            <p><strong>${workOrder.service.primaryIssue}</strong></p>
                            ${workOrder.service.symptoms ? `<p style="margin-top: 10px;"><em>Symptoms: ${workOrder.service.symptoms}</em></p>` : ''}
                        </div>
                        
                        <div class="highlight">
                            <h3>💰 Estimate</h3>
                            ${workOrder.estimate.diagnosticFee ? `<p>Diagnostic Fee: <strong>$${workOrder.estimate.diagnosticFee.toFixed(2)}</strong></p>` : ''}
                            <p>${workOrderText}</p>
                            ${workOrder.estimate.estimatedTime ? `<p>Estimated Time: <strong>${workOrder.estimate.estimatedTime}</strong></p>` : ''}
                            <p style="margin-top: 15px; font-size: 14px; color: #666;">
                                <em>* This is an initial estimate. A firm quote will be provided after inspection.</em>
                            </p>
                        </div>
                        
                        ${workOrder.dropoff.isDropoff ? `
                        <div class="section">
                            <h2>📦 Drop-Off Information</h2>
                            <p>Your vehicle has been received and is being processed.</p>
                            <p>We will contact you within <strong>${workOrder.estimate.estimatedTime || '24-48 hours'}</strong> with a firm quote.</p>
                            <p>You must approve the quote before any repairs are started.</p>
                            <p style="margin-top: 10px;">✅ We have your keys on file.</p>
                        </div>
                        ` : `
                        <div class="section">
                            <h2>📅 Appointment Information</h2>
                            ${workOrder.schedule.appointmentDate ? `<p>Date: <strong>${workOrder.schedule.appointmentDate}</strong></p>` : ''}
                            ${workOrder.schedule.appointmentTime ? `<p>Time: <strong>${workOrder.schedule.appointmentTime}</strong></p>` : ''}
                        </div>
                        `}
                        
                        <div class="section">
                            <h2>📋 Next Steps</h2>
                            <ol>
                                <li>We will inspect your vehicle</li>
                                <li>We will call you with a firm quote</li>
                                <li>You must approve the quote before we proceed</li>
                                <li>We will complete the repairs</li>
                                <li>We will call you when your vehicle is ready</li>
                            </ol>
                        </div>
                        
                        <div class="highlight" style="background: #e3f2fd; border-left-color: #2196f3;">
                            <h3>📞 Need to Contact Us?</h3>
                            <p><strong>${shopSettings.shopName}</strong></p>
                            <p>Phone: <a href="tel:${shopSettings.shopPhone}">${shopSettings.shopPhone}</a></p>
                            ${shopSettings.shopAddress ? `<p>${shopSettings.shopAddress}</p>` : ''}
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Thank you for choosing ${shopSettings.shopName}!</p>
                        <p style="font-size: 12px; margin-top: 10px;">This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    await sendMail(msg);
    return { success: true, message: 'Work order confirmation sent' };
}

/**
 * Send Quote to Customer
 */
async function sendQuote({ to, workOrderId, quote, workOrder }) {
    const msg = {
        to: to,
        from: {
            email: shopSettings.sendgridFromEmail,
            name: shopSettings.sendgridFromName || shopSettings.shopName
        },
        subject: `Your Quote - ${workOrderId}`,
        text: `
            Your quote is ready for work order ${workOrderId}.
            
            QUOTE DETAILS:
            ${quote.items ? quote.items.map(item => 
                `- ${item.description}: $${item.price.toFixed(2)}`
            ).join('\n') : ''}
            
            Parts: $${quote.partsCost?.toFixed(2) || '0.00'}
            Labor: $${quote.laborCost?.toFixed(2) || '0.00'}
            Tax: $${quote.tax?.toFixed(2) || '0.00'}
            
            TOTAL: $${quote.total?.toFixed(2) || 'TBD'}
            
            ${quote.notes ? `\nNotes: ${quote.notes}` : ''}
            
            To approve this quote, please:
            1. Reply to this email with "APPROVE"
            2. Call us at ${shopSettings.shopPhone}
            3. Or visit our shop
            
            If you have any questions or would like to discuss the quote, 
            please call us at ${shopSettings.shopPhone}.
            
            Thank you!
            ${shopSettings.shopName}
        `,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .quote-total { background: #e8f5e9; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
                    .quote-total h2 { color: #4caf50; font-size: 36px; margin: 10px 0; }
                    .actions { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; }
                    .actions h3 { color: #2196f3; margin-top: 0; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💰 Your Quote is Ready!</h1>
                    </div>
                    
                    <div class="content">
                        <p style="text-align: center; font-size: 18px; margin-bottom: 30px;">
                            Work Order: <strong>${workOrderId}</strong>
                        </p>
                        
                        ${quote.items ? `
                        <h3>Quote Details:</h3>
                        <table style="width: 100%; margin: 20px 0;">
                            ${quote.items.map(item => `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.description}</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </table>
                        ` : ''}
                        
                        <div class="quote-total">
                            <p>Total Amount Due:</p>
                            <h2>$${quote.total?.toFixed(2) || 'TBD'}</h2>
                            ${quote.partsCost ? `<p>Parts: $${quote.partsCost.toFixed(2)}</p>` : ''}
                            ${quote.laborCost ? `<p>Labor: $${quote.laborCost.toFixed(2)}</p>` : ''}
                            ${quote.tax ? `<p>Tax: $${quote.tax.toFixed(2)}</p>` : ''}
                        </div>
                        
                        ${quote.notes ? `
                        <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 20px 0;">
                            <h3>📝 Notes:</h3>
                            <p>${quote.notes}</p>
                        </div>
                        ` : ''}
                        
                        <div class="actions">
                            <h3>✅ Approve This Quote</h3>
                            <p>To approve this quote and schedule repairs, please choose one:</p>
                            <ol>
                                <li>Reply to this email with "APPROVE"</li>
                                <li>Call us at <a href="tel:${shopSettings.shopPhone}">${shopSettings.shopPhone}</a></li>
                                <li>Visit our shop</li>
                            </ol>
                            <p style="margin-top: 15px;"><strong>If you have questions or want to discuss:</strong></p>
                            <p>Call us at <a href="tel:${shopSettings.shopPhone}">${shopSettings.shopPhone}</a></p>
                        </div>
                        
                        <p style="text-align: center; margin-top: 30px;">
                            We look forward to completing your repairs!
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>${shopSettings.shopName}</p>
                        <p><a href="tel:${shopSettings.shopPhone}">${shopSettings.shopPhone}</a></p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    await sendMail(msg);
    return { success: true, message: 'Quote sent to customer' };
}

/**
 * Send Approval Confirmation
 */
async function sendApprovalConfirmation({ to, workOrderId, workOrder }) {
    const msg = {
        to: to,
        from: {
            email: shopSettings.sendgridFromEmail,
            name: shopSettings.sendgridFromName || shopSettings.shopName
        },
        subject: `Quote Approved - ${workOrderId}`,
        text: `
            Your quote has been approved for work order ${workOrderId}.
            
            APPROVED AMOUNT: $${workOrder.diagnosis?.quote?.total?.toFixed(2) || 'TBD'}
            
            We will begin work on your vehicle shortly.
            We will contact you when your vehicle is ready for pickup.
            
            ${workOrder.schedule.estimatedCompletion ? `
            Estimated Completion: ${workOrder.schedule.estimatedCompletion}
            ` : ''}
            
            If you have any questions, please call us at ${shopSettings.shopPhone}.
            
            Thank you!
            ${shopSettings.shopName}
        `,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .approved { background: #e8f5e9; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
                    .approved h2 { color: #4caf50; font-size: 36px; margin: 10px 0; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Quote Approved!</h1>
                    </div>
                    
                    <div class="content">
                        <p style="text-align: center; font-size: 18px; margin-bottom: 30px;">
                            Work Order: <strong>${workOrderId}</strong>
                        </p>
                        
                        <div class="approved">
                            <p>Your quote has been approved!</p>
                            <h2>$${workOrder.diagnosis?.quote?.total?.toFixed(2) || 'TBD'}</h2>
                            <p>We will begin work on your vehicle shortly.</p>
                        </div>
                        
                        ${workOrder.schedule.estimatedCompletion ? `
                        <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3>📅 Estimated Completion</h3>
                            <p style="font-size: 24px; font-weight: bold; text-align: center;">
                                ${workOrder.schedule.estimatedCompletion}
                            </p>
                            <p style="text-align: center;">We will contact you when your vehicle is ready for pickup.</p>
                        </div>
                        ` : `
                        <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3>📅 Next Steps</h3>
                            <p>We will contact you when your vehicle is ready for pickup.</p>
                        </div>
                        `}
                        
                        <p style="text-align: center; margin-top: 30px;">
                            If you have any questions, please call us at:<br>
                            <a href="tel:${shopSettings.shopPhone}" style="font-size: 24px; color: #667eea;">${shopSettings.shopPhone}</a>
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>${shopSettings.shopName}</p>
                        <p>Thank you for your business!</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    await sendMail(msg);
    return { success: true, message: 'Approval confirmation sent' };
}

// Export functions to be added to email-service-updated.js
module.exports = {
    sendWorkOrderConfirmation,
    sendQuote,
    sendApprovalConfirmation
};