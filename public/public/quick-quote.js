// Quick Quote Form - AI Phone Live Estimate Integration
// VHICL Pro Service Advisor System

class QuickQuoteForm {
    constructor() {
        this.form = document.getElementById('quickQuoteForm');
        this.aiPhoneEstimateBtn = document.getElementById('aiPhoneEstimateBtn');
        this.manualQuoteBtn = document.getElementById('manualQuoteBtn');
        this.statusDisplay = document.getElementById('statusDisplay');
        this.workflowId = null;
        this.statusPollingInterval = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // AI Phone Estimate Button
        this.aiPhoneEstimateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleAIPhoneEstimate();
        });

        // Manual Quote Button
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleManualQuote();
        });

        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        phoneInput.addEventListener('input', (e) => {
            this.formatPhoneNumber(e.target);
        });
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 10) {
            value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
        }
        input.value = value;
    }

    validateForm() {
        const requiredFields = ['make', 'model', 'year', 'service', 'name', 'phone', 'email'];
        const formData = new FormData(this.form);
        
        for (const field of requiredFields) {
            if (!formData.get(field)) {
                return {
                    valid: false,
                    error: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`
                };
            }
        }

        // Validate email format
        const email = formData.get('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                valid: false,
                error: 'Please enter a valid email address'
            };
        }

        // Validate phone format
        const phone = formData.get('phone');
        const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
        if (!phoneRegex.test(phone)) {
            return {
                valid: false,
                error: 'Please enter a valid phone number'
            };
        }

        return { valid: true };
    }

    getFormData() {
        const formData = new FormData(this.form);
        return {
            vehicle: {
                make: formData.get('make'),
                model: formData.get('model'),
                year: parseInt(formData.get('year')),
                vin: formData.get('vin') || null
            },
            service: formData.get('service'),
            description: formData.get('description') || '',
            urgency: formData.get('urgency') || 'normal',
            customer: {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email')
            }
        };
    }

    async handleAIPhoneEstimate() {
        // Validate form
        const validation = this.validateForm();
        if (!validation.valid) {
            this.showStatus('error', validation.error);
            return;
        }

        // Get form data
        const quoteData = this.getFormData();

        // Show loading state
        this.showStatus('loading', 'ALEX is checking parts availability...', {
            progress: [
                { text: 'Validating your request...', done: true },
                { text: 'Calling local parts stores...', done: false },
                { text: 'Comparing prices...', done: false },
                { text: 'Preparing your estimate...', done: false }
            ]
        });

        try {
            // Trigger ALEX workflow
            const response = await fetch('/api/alex/workflow/get-pricing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vehicle: quoteData.vehicle,
                    service: quoteData.service,
                    description: quoteData.description,
                    urgency: quoteData.urgency,
                    customerPhone: quoteData.customer.phone,
                    customerEmail: quoteData.customer.email,
                    customerName: quoteData.customer.name
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            this.workflowId = result.workflowId;

            // Update progress
            this.updateProgress([
                { text: 'Validating your request...', done: true },
                { text: 'Calling local parts stores...', done: true },
                { text: 'Comparing prices...', done: true },
                { text: 'Preparing your estimate...', done: true }
            ]);

            // Show success message
            setTimeout(() => {
                this.showStatus('success', '🎉 Request Submitted!', {
                    message: `
                        <p><strong>ALEX (our AI assistant) will call you at:</strong></p>
                        <p class="phone-number">${quoteData.customer.phone}</p>
                        <p><strong>Within 5-10 minutes</strong> with your live estimate!</p>
                        <p class="note">Please keep your phone nearby. ALEX will provide:</p>
                        <ul>
                            <li>✅ Real-time parts pricing from local stores</li>
                            <li>✅ Accurate labor costs</li>
                            <li>✅ Total estimate including tax</li>
                            <li>✅ Option to book appointment immediately</li>
                        </ul>
                    `,
                    actions: [
                        { text: '🔄 Refresh Status', action: () => this.checkWorkflowStatus() },
                        { text: '📞 Call Shop Directly', action: () => window.location.href = 'tel:+15550199' }
                    ]
                });

                // Start status polling
                this.startStatusPolling();
            }, 1000);

        } catch (error) {
            console.error('Error:', error);
            this.showStatus('error', 'Failed to submit request', {
                message: `We couldn't process your request. Error: ${error.message}`,
                actions: [
                    { text: '🔄 Try Again', action: () => this.hideStatus() },
                    { text: '📞 Call Shop Directly', action: () => window.location.href = 'tel:+15550199' }
                ]
            });
        }
    }

    async handleManualQuote() {
        // Validate form
        const validation = this.validateForm();
        if (!validation.valid) {
            this.showStatus('error', validation.error);
            return;
        }

        // Get form data
        const quoteData = this.getFormData();

        // Show loading state
        this.showStatus('loading', 'Submitting your request...');

        try {
            // Submit for manual review
            const response = await fetch('/api/quotes/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(quoteData)
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();

            // Show success message
            this.showStatus('success', '✅ Quote Request Submitted!', {
                message: `
                    <p>Thank you, ${quoteData.customer.name}!</p>
                    <p>We've received your quote request and will review it shortly.</p>
                    <p><strong>Expected response time:</strong> Within 24 hours</p>
                    <p class="note">You'll receive an estimate at:</p>
                    <p class="email">${quoteData.customer.email}</p>
                `,
                actions: [
                    { text: '📧 Check Email', action: () => window.location.href = `mailto:${quoteData.customer.email}` },
                    { text: '📞 Call Shop Directly', action: () => window.location.href = 'tel:+15550199' }
                ]
            });

        } catch (error) {
            console.error('Error:', error);
            this.showStatus('error', 'Failed to submit request', {
                message: `We couldn't process your request. Error: ${error.message}`,
                actions: [
                    { text: '🔄 Try Again', action: () => this.hideStatus() }
                ]
            });
        }
    }

    async checkWorkflowStatus() {
        if (!this.workflowId) return;

        try {
            const response = await fetch(`/api/alex/workflow/status/${this.workflowId}`);
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'completed') {
                // Stop polling
                this.stopStatusPolling();
                
                // Show final estimate
                this.showFinalEstimate(data.estimate);
            } else if (data.status === 'in_progress') {
                // Update with current step
                this.updateProgress([
                    { text: 'Validating your request...', done: true },
                    { text: 'Calling local parts stores...', done: true },
                    { text: 'Comparing prices...', done: data.step >= 2 },
                    { text: 'Preparing your estimate...', done: data.step >= 3 }
                ]);
            } else if (data.status === 'failed') {
                this.stopStatusPolling();
                this.showStatus('error', 'Workflow Failed', {
                    message: `We encountered an issue: ${data.error}`,
                    actions: [
                        { text: '🔄 Try Again', action: () => this.hideStatus() },
                        { text: '📞 Call Shop Directly', action: () => window.location.href = 'tel:+15550199' }
                    ]
                });
            }

        } catch (error) {
            console.error('Error checking status:', error);
        }
    }

    startStatusPolling() {
        // Poll every 30 seconds
        this.statusPollingInterval = setInterval(() => {
            this.checkWorkflowStatus();
        }, 30000);
    }

    stopStatusPolling() {
        if (this.statusPollingInterval) {
            clearInterval(this.statusPollingInterval);
            this.statusPollingInterval = null;
        }
    }

    showFinalEstimate(estimate) {
        this.showStatus('success', '🎉 Your Estimate is Ready!', {
            message: `
                <div class="estimate-summary">
                    <h3>Quote #${estimate.quoteId}</h3>
                    <p><strong>Vehicle:</strong> ${estimate.vehicle.year} ${estimate.vehicle.make} ${estimate.vehicle.model}</p>
                    <p><strong>Service:</strong> ${estimate.service}</p>
                </div>
                
                <div class="estimate-breakdown">
                    <div class="breakdown-item">
                        <span>Parts:</span>
                        <span class="price">$${estimate.partsCost.toFixed(2)}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Labor:</span>
                        <span class="price">$${estimate.laborCost.toFixed(2)}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Tax:</span>
                        <span class="price">$${estimate.tax.toFixed(2)}</span>
                    </div>
                    <div class="breakdown-item total">
                        <span><strong>Total:</strong></span>
                        <span class="price"><strong>$${estimate.total.toFixed(2)}</strong></span>
                    </div>
                </div>

                <p class="note">
                    <small>* Pricing based on real-time quotes from ${estimate.storesCalled} local parts stores</small>
                </p>
            `,
            actions: [
                { text: '📅 Book Appointment', action: () => window.location.href = '/appointment.html' },
                { text: '📞 Call Shop Directly', action: () => window.location.href = 'tel:+15550199' },
                { text: '📧 Email Quote', action: () => window.location.href = 'mailto:?subject=My Quote&body=' + encodeURIComponent(estimate.summary) }
            ]
        });
    }

    showStatus(type, message, details = {}) {
        this.statusDisplay.classList.remove('hidden');
        
        const icon = document.getElementById('statusIcon');
        const messageEl = document.getElementById('statusMessage');
        const detailsEl = document.getElementById('statusDetails');
        const actionsEl = document.getElementById('statusActions');

        // Set icon
        switch (type) {
            case 'loading':
                icon.innerHTML = '<div class="spinner"></div>';
                break;
            case 'success':
                icon.innerHTML = '✅';
                break;
            case 'error':
                icon.innerHTML = '❌';
                break;
            default:
                icon.innerHTML = 'ℹ️';
        }

        // Set message
        messageEl.textContent = message;

        // Set details
        if (details.progress) {
            detailsEl.innerHTML = `
                <div class="progress-list">
                    ${details.progress.map(step => `
                        <div class="progress-item ${step.done ? 'done' : ''}">
                            ${step.done ? '✅' : '⏳'} ${step.text}
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (details.message) {
            detailsEl.innerHTML = `<div class="status-message-text">${details.message}</div>`;
        } else {
            detailsEl.innerHTML = '';
        }

        // Set actions
        if (details.actions) {
            actionsEl.innerHTML = details.actions.map(action => `
                <button class="btn btn-secondary btn-sm" onclick="(${action.action.toString()})()">
                    ${action.text}
                </button>
            `).join('');
        } else {
            actionsEl.innerHTML = '';
        }

        // Scroll to status
        this.statusDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    hideStatus() {
        this.statusDisplay.classList.add('hidden');
        this.stopStatusPolling();
    }

    updateProgress(progress) {
        const detailsEl = document.getElementById('statusDetails');
        detailsEl.innerHTML = `
            <div class="progress-list">
                ${progress.map(step => `
                    <div class="progress-item ${step.done ? 'done' : ''}">
                        ${step.done ? '✅' : '⏳'} ${step.text}
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuickQuoteForm();
});