/**
 * Parts Markup Matrix System
 * Different markup percentages based on part cost ranges
 */

class PartsMatrix {
    constructor() {
        this.defaultMatrix = [
            { min: 0, max: 10, markup: 300 },      // $0-10: 300%
            { min: 10, max: 25, markup: 200 },     // $10-25: 200%
            { min: 25, max: 50, markup: 150 },     // $25-50: 150%
            { min: 50, max: 100, markup: 100 },    // $50-100: 100%
            { min: 100, max: 250, markup: 50 },    // $100-250: 50%
            { min: 250, max: 500, markup: 30 },    // $250-500: 30%
            { min: 500, max: 1000, markup: 20 },   // $500-1000: 20%
            { min: 1000, max: 999999, markup: 12 } // $1000+: 12%
        ];
        
        this.loadMatrix();
    }
    
    loadMatrix() {
        const saved = localStorage.getItem('partsMatrix');
        if (saved) {
            try {
                this.matrix = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading parts matrix:', e);
                this.matrix = this.defaultMatrix;
            }
        } else {
            this.matrix = this.defaultMatrix;
        }
    }
    
    saveMatrix() {
        localStorage.setItem('partsMatrix', JSON.stringify(this.matrix));
    }
    
    getMarkup(cost) {
        const numCost = parseFloat(cost) || 0;
        
        for (let tier of this.matrix) {
            if (numCost >= tier.min && numCost < tier.max) {
                return tier.markup;
            }
        }
        
        // Default to last tier if not found
        return this.matrix[this.matrix.length - 1].markup;
    }
    
    calculateSellPrice(cost) {
        const numCost = parseFloat(cost) || 0;
        const markup = this.getMarkup(numCost);
        return numCost * (1 + markup / 100);
    }
    
    showMatrixEditor() {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;';
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 30px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin: 0 0 10px 0; color: #667eea;">💰 Parts Markup Matrix</h2>
                <p style="color: #666; margin: 0 0 20px 0;">Set different markup percentages based on part cost ranges</p>
                
                <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <strong style="color: #10b981;">💡 How It Works:</strong>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                        Cheaper parts get higher markup percentages, expensive parts get lower markups.
                        This is standard industry practice.
                    </p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 100px 100px 100px 80px; gap: 10px; padding: 10px; background: #f3f4f6; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">
                        <div>Min Cost</div>
                        <div>Max Cost</div>
                        <div>Markup %</div>
                        <div></div>
                    </div>
                    <div id="matrix-rows"></div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button onclick="window.partsMatrix.addMatrixRow()" style="flex: 1; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        ➕ Add Tier
                    </button>
                    <button onclick="window.partsMatrix.resetToDefaults()" style="padding: 12px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        🔄 Reset to Defaults
                    </button>
                </div>
                
                <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <strong style="color: #f59e0b;">📊 Example:</strong>
                    <div style="margin-top: 10px; font-size: 14px; color: #666;">
                        • $5 part → 300% markup → Sell for $20<br>
                        • $50 part → 100% markup → Sell for $100<br>
                        • $500 part → 20% markup → Sell for $600<br>
                        • $1000 part → 12% markup → Sell for $1120
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.partsMatrix.saveMatrixSettings()" style="flex: 1; padding: 15px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: bold;">
                        ✅ Save Matrix
                    </button>
                    <button onclick="window.partsMatrix.closeMatrixEditor()" style="padding: 15px 30px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        ✕ Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.matrixModal = modal;
        this.renderMatrixRows();
    }
    
    renderMatrixRows() {
        const container = document.getElementById('matrix-rows');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.matrix.forEach((tier, index) => {
            const row = document.createElement('div');
            row.style.cssText = 'display: grid; grid-template-columns: 100px 100px 100px 80px; gap: 10px; padding: 10px; border-bottom: 1px solid #e5e7eb;';
            row.innerHTML = `
                <input type="number" value="${tier.min}" data-index="${index}" data-field="min" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" onchange="window.partsMatrix.updateTier(${index}, 'min', this.value)">
                <input type="number" value="${tier.max}" data-index="${index}" data-field="max" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" onchange="window.partsMatrix.updateTier(${index}, 'max', this.value)">
                <input type="number" value="${tier.markup}" data-index="${index}" data-field="markup" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" onchange="window.partsMatrix.updateTier(${index}, 'markup', this.value)">
                <button onclick="window.partsMatrix.removeTier(${index})" style="padding: 8px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">✕</button>
            `;
            container.appendChild(row);
        });
    }
    
    updateTier(index, field, value) {
        this.matrix[index][field] = parseFloat(value) || 0;
    }
    
    addMatrixRow() {
        const lastTier = this.matrix[this.matrix.length - 1];
        this.matrix.push({
            min: lastTier.max,
            max: lastTier.max + 500,
            markup: 10
        });
        this.renderMatrixRows();
    }
    
    removeTier(index) {
        if (this.matrix.length > 1) {
            this.matrix.splice(index, 1);
            this.renderMatrixRows();
        } else {
            alert('⚠️ You must have at least one tier');
        }
    }
    
    resetToDefaults() {
        if (confirm('Reset to default markup matrix?\n\nThis will restore the standard industry markup percentages.')) {
            this.matrix = JSON.parse(JSON.stringify(this.defaultMatrix));
            this.renderMatrixRows();
        }
    }
    
    saveMatrixSettings() {
        // Sort by min value
        this.matrix.sort((a, b) => a.min - b.min);
        
        // Validate no gaps
        for (let i = 0; i < this.matrix.length - 1; i++) {
            if (this.matrix[i].max !== this.matrix[i + 1].min) {
                alert('⚠️ Error: Gaps in price ranges!\n\nEach tier\'s max must equal the next tier\'s min.');
                return;
            }
        }
        
        this.saveMatrix();
        this.closeMatrixEditor();
        alert('✅ Parts markup matrix saved!\n\nThe new markup percentages will be used for all future quotes.');
    }
    
    closeMatrixEditor() {
        if (this.matrixModal) {
            document.body.removeChild(this.matrixModal);
            this.matrixModal = null;
        }
    }
}

// Initialize and make globally available
window.partsMatrix = new PartsMatrix();

console.log('✅ Parts Markup Matrix loaded');
console.log('💡 Use: window.partsMatrix.showMatrixEditor() to configure');
