// Professional Diagnostic System - OBD2 + Sensors
// Hybrid approach: Connect to dongle but use sensors for assessment

let vehicleData = {};
let assessmentMode = 'standard';
let bluetoothDevice = null;
let sensorData = {
    sounds: [],
    vibrations: [],
    startTime: null,
    duration: 0
};
let initialAssessment = null; // Store initial assessment for before/after comparison

// Audio analysis
let audioContext = null;
let analyser = null;
let audioStream = null;

// Mode selection
window.selectMode = function(mode) {
    assessmentMode = mode;
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.mode-card').classList.add('selected');
    
    setTimeout(() => {
        showScreen('infoScreen');
    }, 300);
};

// Skip VIN read function
window.skipVINRead = function() {
    console.log('⏭️ User skipped VIN read');
    window.vinReadInProgress = false;
    
    const statusDiv = document.getElementById('connectionStatus');
    const btn = document.getElementById('continueBtn');
    
    if (statusDiv && btn) {
        statusDiv.innerHTML = `
            ✅ Connected Successfully<br>
            ⏭️ VIN reading skipped<br><br>
            Click below to enter vehicle details manually
        `;
        statusDiv.className = 'status-box';
        
        btn.disabled = false;
        btn.textContent = '➡️ Continue to Vehicle Details';
        btn.onclick = () => proceedToVehicleInfo(false);
    }
};

// Screen navigation
window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
};

// Start new assessment
// New workflow: Connect dongle first
window.connectDongleFirst = function() {
    console.log('🚀 Starting new assessment - connecting dongle first');
    
    // Reset data
    vehicleData = {};
    sensorData = { 
        sounds: [], 
        vibrations: [], 
        accelerations: [],
        decelerations: [],
        startTime: null, 
        duration: 0 
    };
    bluetoothDevice = null;
    previousSpeed = 0;
    speedHistory = [];
    window.autoDetectedVehicle = null;
    window.decodedVehicleData = null;
    
    showScreen('connectScreen');
};

// Manual entry mode (skip dongle)
window.manualEntryMode = function() {
    console.log('✏️ Manual entry mode - skipping dongle');
    
    // Reset data
    vehicleData = {};
    sensorData = { 
        sounds: [], 
        vibrations: [], 
        accelerations: [],
        decelerations: [],
        startTime: null, 
        duration: 0 
    };
    bluetoothDevice = null;
    previousSpeed = 0;
    speedHistory = [];
    
    showScreen('infoScreen');
};

// Skip to manual entry from connect screen
window.skipToManualEntry = function() {
    console.log('⏭️ Skipping dongle connection - going to test drive');
    
    // If we're on connect screen and have vehicle data, go to test drive
    if (vehicleData && vehicleData.year && vehicleData.make && vehicleData.model) {
        startTestDrive();
    } else {
        // No vehicle data yet, go to info screen
        showScreen('infoScreen');
    }
};

// Proceed to vehicle info screen
window.proceedToVehicleInfo = function(autoDetected) {
    if (autoDetected && window.autoDetectedVehicle) {
        // Pre-fill the form
        document.getElementById('vin').value = window.autoDetectedVehicle.vin || '';
        document.getElementById('year').value = window.autoDetectedVehicle.year || '';
        document.getElementById('make').value = window.autoDetectedVehicle.make || '';
        document.getElementById('model').value = window.autoDetectedVehicle.model || '';
        
        // Show auto-detected banner
        const banner = document.getElementById('autoDetectedBanner');
        const info = document.getElementById('autoDetectedInfo');
        if (banner && info) {
            banner.style.display = 'block';
            info.textContent = `${window.autoDetectedVehicle.year} ${window.autoDetectedVehicle.make} ${window.autoDetectedVehicle.model}`;
        }
        
        // Show decoded info
        if (window.decodedVehicleData) {
            const vinStatus = document.getElementById('vinDecodeStatus');
            if (vinStatus) {
                const vehicle = window.decodedVehicleData;
                let decodedInfo = '✅ Auto-Detected from OBD2!<br><br>';
                decodedInfo += `<strong>${vehicle.ModelYear} ${vehicle.Make} ${vehicle.Model}</strong><br>`;
                if (vehicle.Trim) decodedInfo += `Trim: ${vehicle.Trim}<br>`;
                if (vehicle.DisplacementL) decodedInfo += `Engine: ${vehicle.DisplacementL}L `;
                if (vehicle.EngineCylinders) decodedInfo += `${vehicle.EngineCylinders}-Cyl `;
                if (vehicle.EngineHP) decodedInfo += `(${vehicle.EngineHP} HP)`;
                vinStatus.innerHTML = decodedInfo;
                vinStatus.style.color = '#059669';
            }
        }
    }
    
    showScreen('infoScreen');
};

// Start dongle connection (new workflow)
window.startDongleConnection = async function() {
    const statusDiv = document.getElementById('connectionStatus');
    const btn = document.getElementById('connectDongleBtn');
    
    if (!btn) {
        console.error('Connect button not found');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '🔄 Connecting...';
    
    try {
        statusDiv.innerHTML = '🔍 Searching for OBD2 dongle...<br><small>Select your ELM327 Bluetooth dongle from the list</small>';
        statusDiv.className = 'status-box';
        
        console.log('🔍 Attempting OBD2 connection...');
        
        // Request any Bluetooth device
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                '0000fff0-0000-1000-8000-00805f9b34fb',
                '0000ffe0-0000-1000-8000-00805f9b34fb',
                '00001101-0000-1000-8000-00805f9b34fb'
            ]
        });
        
        console.log('✅ Device selected:', device.name);
        
        // Detect device type
        const deviceName = device.name.toLowerCase();
        window.isVLinker = deviceName.includes("vlinker") || deviceName.includes("mc+") || deviceName.includes("mx+");
        window.isGenericOBD = !window.isVLinker;
        
        statusDiv.innerHTML = `✅ Found: ${device.name}<br>Connecting...`;
        
        // Connect to GATT server
        const server = await device.gatt.connect();
        console.log('✅ Connected to GATT server');
        
        // Store device
        bluetoothDevice = device;
        window.obd2Server = server;
        
        statusDiv.innerHTML = `
            ✅ Connected to ${device.name}<br><br>
            <strong>VIN Reading (Optional)</strong><br>
            Attempting to read VIN from vehicle...<br>
            <small>This may take 10-15 seconds</small><br><br>
            <button onclick="skipVINRead()" class="btn btn-secondary" style="margin-top:10px;">Skip VIN Read</button>
        `;
        
        // Set flag for VIN reading
        window.vinReadInProgress = true;
        
        // Initialize OBD2 reader
        try {
            if (window.isVLinker && window.VLinkerHandler) {
                window.obd2Reader = new window.VLinkerHandler();
                await window.obd2Reader.initialize(server);
                console.log('✅ vLinker handler initialized');
            } else {
                window.obd2Reader = new window.OBD2Reader(device, server);
                await window.obd2Reader.initialize();
                console.log('✅ Generic OBD2 reader initialized');
            }
        } catch (initError) {
            console.error('⚠️ OBD2 reader initialization failed:', initError);
            // Continue anyway - we'll try to read VIN
        }
        
        // Try to read VIN from vehicle (with timeout)
        let vin = null;
        try {
            vin = await Promise.race([
                readMode9VIN(),
                new Promise((resolve) => setTimeout(() => resolve(null), 15000)) // 15 second timeout
            ]);
        } catch (vinError) {
            console.warn('⚠️ VIN read error:', vinError);
            vin = null;
        }
        
        // Check if user skipped
        if (!window.vinReadInProgress) {
            return; // User clicked skip, don't continue
        }
        
        window.vinReadInProgress = false;
        
        if (vin && vin.length === 17) {
            console.log('✅ VIN read successfully:', vin);
            statusDiv.innerHTML = `✅ VIN Read: ${vin}<br>🔄 Decoding vehicle information...`;
            
            // Decode VIN
            try {
                const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`);
                const data = await response.json();
                
                if (data.Results && data.Results.length > 0) {
                    const vehicle = data.Results[0];
                    
                    if (vehicle.ErrorCode && vehicle.ErrorCode.includes('0')) {
                        // Store decoded data
                        window.autoDetectedVehicle = {
                            vin: vin,
                            year: vehicle.ModelYear,
                            make: vehicle.Make,
                            model: vehicle.Model,
                            decodedData: vehicle
                        };
                        
                        window.decodedVehicleData = vehicle;
                        
                        statusDiv.innerHTML = `
                            <strong>✅ Vehicle Auto-Detected!</strong><br><br>
                            <strong>VIN:</strong> ${vin}<br>
                            <strong>Vehicle:</strong> ${vehicle.ModelYear} ${vehicle.Make} ${vehicle.Model}<br>
                            ${vehicle.Trim ? `<strong>Trim:</strong> ${vehicle.Trim}<br>` : ''}
                            ${vehicle.DisplacementL ? `<strong>Engine:</strong> ${vehicle.DisplacementL}L` : ''}
                            ${vehicle.EngineCylinders ? ` ${vehicle.EngineCylinders}-Cyl` : ''}
                            ${vehicle.EngineHP ? ` (${vehicle.EngineHP} HP)` : ''}<br>
                            ${vehicle.DriveType ? `<strong>Drive:</strong> ${vehicle.DriveType}` : ''}
                        `;
                        statusDiv.className = 'status-box success';
                        
                        btn.disabled = false;
                        btn.textContent = '➡️ Continue to Vehicle Details';
                        btn.onclick = () => proceedToVehicleInfo(true);
                        
                        console.log('✅ VIN decoded successfully');
                        
                        // Check for recalls and safety rating (async, non-blocking)
                        if (typeof checkVehicleRecallsAndSafety === 'function') {
                            checkVehicleRecallsAndSafety(vin, vehicle.ModelYear, vehicle.Make, vehicle.Model).catch(err => {
                                console.error('Error checking recalls/safety:', err);
                            });
                        }
                    } else {
                        throw new Error('VIN decode failed');
                    }
                } else {
                    throw new Error('No decode data returned');
                }
            } catch (decodeError) {
                console.error('❌ VIN decode error:', decodeError);
                statusDiv.innerHTML = `
                    ✅ Connected Successfully<br>
                    ✅ VIN Read: ${vin}<br>
                    ⚠️ Could not decode VIN automatically<br><br>
                    Your dongle is connected and the VIN was read successfully.<br>
                    Please enter vehicle details manually on the next screen.
                `;
                statusDiv.className = 'status-box';
                
                // Store VIN even if decode failed
                window.autoDetectedVehicle = { vin: vin };
                
                btn.disabled = false;
                btn.textContent = '➡️ Continue to Vehicle Details';
                btn.onclick = () => proceedToVehicleInfo(false);
            }
        } else {
            console.warn('⚠️ Could not read VIN from vehicle');
            statusDiv.innerHTML = `
                ✅ Connected Successfully<br>
                ℹ️ VIN could not be read automatically<br><br>
                <strong>This is normal!</strong> Many vehicles don't support automatic VIN reading.<br>
                Your dongle is connected and working - you can proceed to enter vehicle details manually.<br><br>
                All diagnostic features will work normally.
            `;
            statusDiv.className = 'status-box';
            
            btn.disabled = false;
            btn.textContent = '➡️ Continue to Vehicle Details';
            btn.onclick = () => proceedToVehicleInfo(false);
        }
        
    } catch (error) {
        console.error('❌ Connection error:', error);
        
        if (error.message && error.message.includes('User cancelled')) {
            statusDiv.innerHTML = `
                ℹ️ Connection Cancelled<br><br>
                You can try again or continue with manual entry
            `;
        } else {
            statusDiv.innerHTML = `
                ❌ Connection Failed<br><br>
                ${error.message || 'Could not connect to dongle'}<br><br>
                You can try again or continue with manual entry
            `;
        }
        statusDiv.className = 'status-box';
        
        btn.disabled = false;
        btn.textContent = '🔄 Try Again';
        btn.onclick = startDongleConnection;
    }
};window.startNewAssessment = function() {
    vehicleData = {};
    sensorData = { sounds: [], vibrations: [], startTime: null, duration: 0 };
    bluetoothDevice = null;
    showScreen('modeScreen');
};

// Start assessment - try OBD2 first, fallback to sensors
window.startAssessment = function() {
    const vin = document.getElementById('vin').value;
    const year = document.getElementById('year').value;
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const mileage = document.getElementById('mileage').value;
    const customerName = document.getElementById('customerName').value;
    const notes = document.getElementById('notes').value;
    
    if (!vin || !year || !make || !model || !mileage) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Get vehicle type and modification status
    const vehicleType = document.getElementById('vehicleType')?.value || 'standard';
    const isModified = document.getElementById('isModified')?.checked || false;
    
    vehicleData = { 
        vin, 
        year, 
        make, 
        model, 
        mileage, 
        customerName, 
        notes,
        vehicleType,
        isModified
    };
    console.log('🚀 Starting assessment:', vehicleData);
    
    // Go to dashboard lights check screen
    showScreen('dashboardLightsScreen');
    
    // Reset warning lights state
    window.warningLights = {
        cel: null,
        abs: null,
        srs: null,
        tpms: null,
        brake: null,
        battery: null
    };
};

// Set warning light status
window.setWarningLight = function(light, isOn) {
    window.warningLights[light] = isOn;
    
    // Update button styles
    const buttons = event.target.parentElement.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.style.opacity = '0.5';
        btn.style.transform = 'scale(1)';
    });
    event.target.style.opacity = '1';
    event.target.style.transform = 'scale(1.05)';
    
    // Check if all lights have been answered
    const allAnswered = Object.values(window.warningLights).every(val => val !== null);
    
    if (allAnswered) {
        document.getElementById('proceedFromLightsBtn').disabled = false;
        document.getElementById('proceedFromLightsBtn').style.opacity = '1';
        
        // Show summary of warning lights
        const lightsOn = Object.entries(window.warningLights).filter(([key, val]) => val === true);
        
        if (lightsOn.length > 0) {
            const summaryDiv = document.getElementById('warningLightsSummary');
            const listDiv = document.getElementById('warningLightsList');
            
            const lightNames = {
                cel: 'Check Engine Light',
                abs: 'ABS Light',
                srs: 'SRS/Airbag Light',
                tpms: 'TPMS Light',
                brake: 'Brake Warning Light',
                battery: 'Battery/Charging Light'
            };
            
            listDiv.innerHTML = lightsOn.map(([key]) => `<li>${lightNames[key]}</li>`).join('');
            summaryDiv.style.display = 'block';
        } else {
            document.getElementById('warningLightsSummary').style.display = 'none';
        }
    }
};

