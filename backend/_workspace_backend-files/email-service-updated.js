// Email Service Module for VHICL Pro - Updated with Shop Settings
// Handles all email notifications for customer service lifecycle

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const shopSettingsService = require('./shop-settings-service.js');

// Email configuration
const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    from: process.env.EMAIL_FROM || 'noreply@vhiclpro.com',
    fromName: process.env.EMAIL_FROM_NAME || 'VHICL Pro',
    replyTo: process.env.EMAIL_REPLY_TO || 'noreply@vhiclpro.com',
    
    gmailUser: process.env.GMAIL_USER,
    gmailPassword: process.env.GMAIL_PASSWORD,
    
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    
    bccEmails: process.env.BCC_EMAILS ? process.env.BCC_EMAILS.split(',') : [],
    
    trackOpens: true,
    trackClicks: true
};

let transporter = null;

async function initializeTransporter() {
    try {
        if (emailConfig.service === 'gmail') {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailConfig.gmailUser,
                    pass: emailConfig.gmailPassword
                }
            });
        } else if (emailConfig.service === 'sendgrid') {
            const sgTransport = require('nodemailer-sendgrid-transport');
            transporter = nodemailer.createTransport(sgTransport({
                apiKey: emailConfig.sendgridApiKey
            }));
        } else {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });
        }
        
        console.log('Email transporter initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing email transporter:', error);
        return false;
    }
}

async function loadTemplate(templateName, data) {
    try {
        const templatePath = path.join(__dirname, 'email-templates', templateName);
        let templateContent = await fs.readFile(templatePath, 'utf-8');
        
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            const regex = new RegExp(placeholder, 'g');
            templateContent = templateContent.replace(regex, data[key] || '');
        });
        
        templateContent = templateContent.replace(/{{#if [^}]+}}[\s\S]*?{{\/if}}/g, '');
        templateContent = templateContent.replace(/{{#each [^}]+}}[\s\S]*?{{\/each}}/g, '<li>Items listed in your estimate</li>');
        
        return templateContent;
    } catch (error) {
        console.error('Error loading email template:', error);
        throw error;
    }
}

async function sendEmail(to, subject, htmlContent, textContent = null) {
    try {
        if (!transporter) {
            await initializeTransporter();
        }
        
        if (!transporter) {
            throw new Error('Email transporter not initialized');
        }
        
        const mailOptions = {
            from: `${emailConfig.fromName} <${emailConfig.from}>`,
            to: to,
            replyTo: emailConfig.replyTo,
            subject: subject,
            html: htmlContent,
            text: textContent || stripHtml(htmlContent)
        };
        
        if (emailConfig.bccEmails.length > 0) {
            mailOptions.bcc = emailConfig.bccEmails.join(', ');
        }
        
        if (emailConfig.service === 'sendgrid') {
            mailOptions.headers = {
                'X-SG-Track-Clicks': emailConfig.trackClicks ? 'true' : 'false',
                'X-SG-Track-Opens': emailConfig.trackOpens ? 'true' : 'false'
            };
        }
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('Email sent successfully:', info.messageId);
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '')
               .replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&#39;/g, "'")
               .replace(/&quot;/g, '"')
               .trim();
}

// Email notification functions with shop settings

async function sendCheckinConfirmation(customerData) {
    try {
        const shopSettings = shopSettingsService.getSettings();
        const templateData = {
            shop_name: shopSettings.shopName,
            customer_name: customerData.customerName,
            year: customerData.vehicleYear,
            make: customerData.vehicleMake,
            model: customerData.vehicleModel,
            vin: customerData.vin,
            mileage: customerData.mileage,
            checkin_date: customerData.checkinDate,
            concerns: customerData.concerns || [],
            shop_phone: shopSettings.shopPhone,
            shop_email: shopSettings.shopEmail,
            shop_address: shopSettings.shopAddress,
            business_hours: shopSettings.businessHours,
            current_year: new Date().getFullYear()
        };
        
        const htmlContent = await loadTemplate('checkin-confirmation.html', templateData);
        
        return await sendEmail(
            customerData.customerEmail,
            `Vehicle Check-in Confirmed - ${shopSettings.shopName}`,
            htmlContent
        );
    } catch (error) {
        console.error('Error sending check-in confirmation:', error);
        return { success: false, error: error.message };
    }
}

async function sendEstimateReady(estimateData) {
    try {
        const shopSettings = shopSettingsService.getSettings();
        const templateData = {
            shop_name: shopSettings.shopName,
            customer_name: estimateData.customerName,
            year: estimateData.vehicleYear,
            make: estimateData.vehicleMake,
            model: estimateData.vehicleModel,
            estimate_id: estimateData.estimateId,
            estimate_date: estimateData.estimateDate,
            total_amount: estimateData.totalAmount,
            is_urgent: estimateData.isUrgent || false,
            view_estimate_url: estimateData.viewUrl,
            shop_phone_url: estimateData.phoneUrl,
            shop_phone: shopSettings.shopPhone,
            shop_email: shopSettings.shopEmail,
            shop_address: shopSettings.shopAddress,
            business_hours: shopSettings.businessHours,
            current_year: new Date().getFullYear()
        };
        
        const htmlContent = await loadTemplate('estimate-ready.html', templateData);
        
        return await sendEmail(
            estimateData.customerEmail,
            `Your Estimate is Ready - ${shopSettings.shopName}`,
            htmlContent
        );
    } catch (error) {
        console.error('Error sending estimate ready email:', error);
        return { success: false, error: error.message };
    }
}

async function sendEstimateApproved(approvalData) {
    try {
        const shopSettings = shopSettingsService.getSettings();
        const templateData = {
            shop_name: shopSettings.shopName,
            customer_name: approvalData.customerName,
            year: approvalData.vehicleYear,
            make: approvalData.vehicleMake,
            model: approvalData.vehicleModel,
            estimate_id: approvalData.estimateId,
            approval_date: approvalData.approvalDate,
            approval_method: approvalData.approvalMethod || 'Online',
            approved_amount: approvalData.approvedAmount,
            expected_start_date: approvalData.expectedStartDate,
            parts_expected_date: approvalData.partsExpectedDate,
            expected_completion_date: approvalData.expectedCompletionDate,
            shop_phone: shopSettings.shopPhone,
            shop_email: shopSettings.shopEmail,
            shop_address: shopSettings.shopAddress,
            business_hours: shopSettings.businessHours,
            current_year: new Date().getFullYear()
        };
        
        const htmlContent = await loadTemplate('estimate-approved.html', templateData);
        
        return await sendEmail(
            approvalData.customerEmail,
            `Work Authorized - ${shopSettings.shopName}`,
            htmlContent
        );
    } catch (error) {
        console.error('Error sending estimate approved email:', error);
        return { success: false, error: error.message };
    }
}

async function sendPartsOrdered(partsData) {
    try {
        const shopSettings = shopSettingsService.getSettings();
        const templateData = {
            shop_name: shopSettings.shopName,
            customer_name: partsData.customerName,
            year: partsData.vehicleYear,
            make: partsData.vehicleMake,
            model: partsData.vehicleModel,
            estimate_id: partsData.estimateId,
            order_date: partsData.orderDate,
            expected_arrival_date: partsData.expectedArrivalDate,
            service_start_date: partsData.serviceStartDate,
            parts: partsData.parts || [],
            shop_phone: shopSettings.shopPhone,
            shop_email: shopSettings.shopEmail,
            shop_address: shopSettings.shopAddress,
            business_hours: shopSettings.businessHours,
            current_year: new Date().getFullYear()
        };
        
        const htmlContent = await loadTemplate('parts-ordered.html', templateData);
        
        return await sendEmail(
            partsData.customerEmail,
            `Parts Update - ${shopSettings.shopName}`,
            htmlContent
        );
    } catch (error) {
        console.error('Error sending parts ordered email:', error);
        return { success: false, error: error.message };
    }
}

async function sendVehicleReady(readyData) {
    try {
        const shopSettings = shopSettingsService.getSettings();
        const templateData = {
            shop_name: shopSettings.shopName,
            customer_name: readyData.customerName,
            year: readyData.vehicleYear,
            make: readyData.vehicleMake,
            model: readyData.vehicleModel,
            estimate_id: readyData.estimateId,
            completion_date: readyData.completionDate,
            total_amount: readyData.totalAmount,
            payment_url: readyData.paymentUrl,
            shop_phone_url: readyData.phoneUrl,
            completed_work: readyData.completedWork || [],
            shop_address: shopSettings.shopAddress,
            business_hours: shopSettings.businessHours,
            shop_phone: shopSettings.shopPhone,
            shop_email: shopSettings.shopEmail,
            current_year: new Date().getFullYear()
        };
        
        const htmlContent = await loadTemplate('vehicle-ready.html', templateData);
        
        return await sendEmail(
            readyData.customerEmail,
            `Your Vehicle is Ready! - ${shopSettings.shopName}`,
            htmlContent
        );
    } catch (error) {
        console.error('Error sending vehicle ready email:', error);
        return { success: false, error: error.message };
    }
}

async function sendAppointmentConfirmation(appointmentData) {
    try {
        const shopSettings = shopSettingsService.getSettings();
        const templateData = {
            shop_name: shopSettings.shopName,
            customer_name: appointmentData.customerName || appointmentData.name || 'Valued Customer',
            appointment_date: appointmentData.date || appointmentData.appointmentDate,
            appointment_time: appointmentData.time || appointmentData.appointmentTime,
            vehicle: appointmentData.vehicle || `${appointmentData.vehicleYear || ''} ${appointmentData.vehicleMake || ''} ${appointmentData.vehicleModel || ''}`.trim(),
            service: appointmentData.service || appointmentData.serviceType || 'Service Appointment',
            phone: appointmentData.phone || appointmentData.customerPhone,
            email: appointmentData.email || appointmentData.customerEmail,
            shop_phone: shopSettings.shopPhone,
            shop_email: shopSettings.shopEmail,
            shop_address: shopSettings.shopAddress,
            business_hours: shopSettings.businessHours || shopSettings.shopHours,
            current_year: new Date().getFullYear()
        };
        
        // Use a simple inline template for appointment confirmation
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Appointment Confirmed</h2>
                <p>Dear ${templateData.customer_name},</p>
                <p>Your appointment has been confirmed:</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Date:</strong> ${templateData.appointment_date}</p>
                    <p><strong>Time:</strong> ${templateData.appointment_time}</p>
                    <p><strong>Service:</strong> ${templateData.service}</p>
                    <p><strong>Vehicle:</strong> ${templateData.vehicle}</p>
                </div>
                <p>If you need to reschedule or cancel, please contact us:</p>
                <p><strong>${templateData.shop_name}</strong><br>
                Phone: ${templateData.shop_phone}<br>
                Email: ${templateData.shop_email}<br>
                Address: ${templateData.shop_address}</p>
                <p style="color: #666; font-size: 12px;">Business Hours: ${templateData.business_hours}</p>
            </div>
        `;
        
        return await sendEmail(
            appointmentData.email || appointmentData.customerEmail,
            `Appointment Confirmed - ${shopSettings.shopName}`,
            htmlContent
        );
    } catch (error) {
        console.error('Error sending appointment confirmation email:', error);
        return { success: false, error: error.message };
    }
}

async function sendPaymentConfirmation(paymentData) {
    try {
        const shopSettings = shopSettingsService.getSettings();
        const templateData = {
            shop_name: shopSettings.shopName,
            customer_name: paymentData.customerName,
            year: paymentData.vehicleYear,
            make: paymentData.vehicleMake,
            model: paymentData.vehicleModel,
            estimate_id: paymentData.estimateId,
            payment_date: paymentData.paymentDate,
            payment_amount: paymentData.paymentAmount,
            payment_method: paymentData.paymentMethod,
            transaction_id: paymentData.transactionId,
            shop_phone: shopSettings.shopPhone,
            shop_email: shopSettings.shopEmail,
            shop_address: shopSettings.shopAddress,
            business_hours: shopSettings.businessHours,
            current_year: new Date().getFullYear()
        };
        
        const htmlContent = await loadTemplate('payment-confirmation.html', templateData);
        
        return await sendEmail(
            paymentData.customerEmail,
            `Payment Confirmation - ${shopSettings.shopName}`,
            htmlContent
        );
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    initializeTransporter,
    sendEmail,
    sendCheckinConfirmation,
    sendEstimateReady,
    sendEstimateApproved,
    sendPartsOrdered,
    sendVehicleReady,
    sendPaymentConfirmation,
    sendAppointmentConfirmation
};