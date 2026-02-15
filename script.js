// ==================== GLOBAL STATE ====================
let weatherData = {
    temperature: 0,
    pressure: 0,
    moistureRH: 0,
    moistureAH: 0,
    rainfall: 0,
    cloudCoverage: null
};

// Sound System
let soundEnabled = true;
let audioContext = null;
let currentAmbientSound = null;

// ==================== DOM ELEMENTS ====================
const elements = {
    // Inputs
    temperature: document.getElementById('temperature'),
    force: document.getElementById('force'),
    area: document.getElementById('area'),
    moistureVapor: document.getElementById('moistureVapor'),
    moistureSaturation: document.getElementById('moistureSaturation'),
    ahVapor: document.getElementById('ahVapor'),
    ahVolume: document.getElementById('ahVolume'),
    rainSlider: document.getElementById('rainSlider'),
    rainfall: document.getElementById('rainfall'),

    // Result Displays
    pressureResult: document.getElementById('pressureResult'),
    moistureRHResult: document.getElementById('moistureRHResult'),
    moistureAHResult: document.getElementById('moistureAHResult'),
    rainResult: document.getElementById('rainResult'),
    cloudResult: document.getElementById('cloudResult'),

    // Visual Elements
    rainFill: document.getElementById('rainFill'),
    weatherBackground: document.getElementById('weatherBackground'),

    // Buttons and Cards
    predictBtn: document.getElementById('predictBtn'),
    rainBtns: document.querySelectorAll('.rain-btn'),
    cloudCards: document.querySelectorAll('.cloud-card'),

    // Results
    resultsSection: document.getElementById('resultsSection'),
    weatherPrediction: document.getElementById('weatherPrediction'),

    // Sound Toggle
    soundToggle: document.getElementById('soundToggle')
};

// ==================== SOUND EFFECTS ====================
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playClickSound() {
    if (!soundEnabled) return;
    initAudio();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playWhooshSound() {
    if (!soundEnabled) return;
    initAudio();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    oscillator.type = 'sawtooth';

    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playSuccessSound() {
    if (!soundEnabled) return;
    initAudio();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
}

function playAmbientSound(weatherCondition) {
    if (!soundEnabled) return;

    // Stop current ambient sound if playing
    if (currentAmbientSound) {
        currentAmbientSound.stop();
        currentAmbientSound = null;
    }

    initAudio();

    // Create different ambient sounds based on weather
    if (weatherCondition === 'rainy' || weatherCondition === 'stormy') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 100;
        oscillator.type = 'brown';

        filter.type = 'lowpass';
        filter.frequency.value = 500;

        gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);

        oscillator.start();
        currentAmbientSound = oscillator;

        // Auto stop after 5 seconds
        setTimeout(() => {
            if (currentAmbientSound === oscillator) {
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
                setTimeout(() => oscillator.stop(), 1000);
                currentAmbientSound = null;
            }
        }, 4000);
    }
}

// ==================== AIR PRESSURE CALCULATION ====================
function calculatePressure() {
    const force = parseFloat(elements.force.value) || 0;
    const area = parseFloat(elements.area.value) || 0;

    if (area > 0) {
        const pressure = force / area;
        weatherData.pressure = pressure;
        elements.pressureResult.textContent = `${pressure.toFixed(2)} Pa`;
    } else {
        elements.pressureResult.textContent = '0 Pa';
    }
}

// ==================== MOISTURE RH CALCULATION ====================
function calculateMoistureRH() {
    const vapor = parseFloat(elements.moistureVapor.value) || 0;
    const saturation = parseFloat(elements.moistureSaturation.value) || 0;

    if (saturation > 0) {
        const rh = (vapor / saturation) * 100;
        weatherData.moistureRH = rh;
        elements.moistureRHResult.textContent = `${rh.toFixed(2)} %`;
    } else {
        elements.moistureRHResult.textContent = '0 %';
    }
}

// ==================== MOISTURE AH CALCULATION ====================
function calculateMoistureAH() {
    const vapor = parseFloat(elements.ahVapor.value) || 0;
    const volume = parseFloat(elements.ahVolume.value) || 0;

    if (volume > 0) {
        const ah = vapor / volume;
        weatherData.moistureAH = ah;
        elements.moistureAHResult.textContent = `${ah.toFixed(2)} g/m³`;
    } else {
        elements.moistureAHResult.textContent = '0 g/m³';
    }
}

// ==================== RAIN AMOUNT CONTROL ====================
function updateRainfall(value) {
    const rainfall = Math.min(Math.max(parseFloat(value) || 0, 0), 50);
    weatherData.rainfall = rainfall;

    // Update all rain controls
    elements.rainSlider.value = rainfall;
    elements.rainfall.value = rainfall.toFixed(1);
    elements.rainResult.textContent = `${rainfall.toFixed(1)} mm`;

    // Update rain fill visual with tween animation
    const fillPercentage = (rainfall / 50) * 100;
    elements.rainFill.style.height = `${fillPercentage}%`;

    // Play whoosh sound
    playWhooshSound();

    // Update active button
    elements.rainBtns.forEach(btn => btn.classList.remove('active'));
}

// ==================== CLOUD COVERAGE SELECTION ====================
function selectCloudCoverage(coverage, cardElement) {
    weatherData.cloudCoverage = coverage;

    // Play click sound
    playClickSound();

    // Update selected card
    elements.cloudCards.forEach(card => card.classList.remove('selected'));
    cardElement.classList.add('selected');

    // Update result display
    const cloudName = cardElement.querySelector('.cloud-name').textContent;
    elements.cloudResult.textContent = `${cloudName} - ${coverage}%`;
}

// ==================== WEATHER PREDICTION ENGINE ====================
function predictWeather() {
    // Get current temperature
    const temp = parseFloat(elements.temperature.value);

    // Validate inputs
    if (isNaN(temp)) {
        alert('Please enter a valid temperature!');
        return;
    }

    if (weatherData.cloudCoverage === null) {
        alert('Please select a cloud coverage level!');
        return;
    }

    // Weather prediction logic
    let weatherCondition = 'clear';
    let description = '';
    let emoji = '☀️';

    // Determine weather condition based on parameters
    if (weatherData.rainfall > 30) {
        weatherCondition = 'stormy';
        emoji = '⛈️';
        description = 'Heavy storms expected';
    } else if (weatherData.rainfall > 10) {
        weatherCondition = 'rainy';
        emoji = '🌧️';
        description = 'Rainy conditions';
    } else if (temp < 0 && weatherData.moistureRH > 60) {
        weatherCondition = 'snowy';
        emoji = '❄️';
        description = 'Snowfall expected';
    } else if (weatherData.cloudCoverage >= 60) {
        weatherCondition = 'cloudy';
        emoji = '☁️';
        description = 'Cloudy skies';
    } else if (weatherData.cloudCoverage >= 20) {
        weatherCondition = 'cloudy';
        emoji = '⛅';
        description = 'Partly cloudy';
    } else {
        weatherCondition = 'sunny';
        emoji = '☀️';
        description = 'Clear and sunny';
    }

    // Temperature analysis
    let tempDesc = '';
    if (temp > 30) {
        tempDesc = 'Hot';
    } else if (temp > 20) {
        tempDesc = 'Warm';
    } else if (temp > 10) {
        tempDesc = 'Mild';
    } else if (temp > 0) {
        tempDesc = 'Cool';
    } else {
        tempDesc = 'Cold';
    }

    // Humidity analysis
    let humidityDesc = '';
    if (weatherData.moistureRH > 80) {
        humidityDesc = 'Very Humid';
    } else if (weatherData.moistureRH > 60) {
        humidityDesc = 'Humid';
    } else if (weatherData.moistureRH > 40) {
        humidityDesc = 'Moderate Humidity';
    } else {
        humidityDesc = 'Low Humidity';
    }

    // Pressure analysis
    let pressureDesc = '';
    if (weatherData.pressure > 101325) {
        pressureDesc = 'High Pressure (Stable weather)';
    } else if (weatherData.pressure < 101325) {
        pressureDesc = 'Low Pressure (Unstable weather)';
    } else {
        pressureDesc = 'Normal Pressure';
    }

    // Generate prediction HTML
    const predictionHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 5rem; margin-bottom: 20px;">${emoji}</div>
            <h3 style="font-size: 2.5rem; color: var(--text-accent); margin-bottom: 10px;">${description}</h3>
            <p style="font-size: 1.3rem; color: var(--text-muted);">${tempDesc} and ${humidityDesc}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 30px;">
            <div style="background: rgba(96, 165, 250, 0.1); padding: 20px; border-radius: 15px; border: 1px solid var(--glass-border);">
                <h4 style="color: var(--primary); margin-bottom: 10px;">🌡️ Temperature</h4>
                <p style="font-size: 1.8rem; font-weight: bold;">${temp}°C</p>
                <p style="color: var(--text-muted);">${tempDesc} conditions</p>
            </div>
            
            <div style="background: rgba(96, 165, 250, 0.1); padding: 20px; border-radius: 15px; border: 1px solid var(--glass-border);">
                <h4 style="color: var(--primary); margin-bottom: 10px;">💧 Humidity</h4>
                <p style="font-size: 1.8rem; font-weight: bold;">${weatherData.moistureRH.toFixed(1)}%</p>
                <p style="color: var(--text-muted);">${humidityDesc}</p>
            </div>
            
            <div style="background: rgba(96, 165, 250, 0.1); padding: 20px; border-radius: 15px; border: 1px solid var(--glass-border);">
                <h4 style="color: var(--primary); margin-bottom: 10px;">📊 Pressure</h4>
                <p style="font-size: 1.8rem; font-weight: bold;">${weatherData.pressure.toFixed(0)} Pa</p>
                <p style="color: var(--text-muted);">${pressureDesc}</p>
            </div>
            
            <div style="background: rgba(96, 165, 250, 0.1); padding: 20px; border-radius: 15px; border: 1px solid var(--glass-border);">
                <h4 style="color: var(--primary); margin-bottom: 10px;">🌧️ Rainfall</h4>
                <p style="font-size: 1.8rem; font-weight: bold;">${weatherData.rainfall.toFixed(1)} mm</p>
                <p style="color: var(--text-muted);">${weatherData.rainfall > 0 ? 'Precipitation expected' : 'No precipitation'}</p>
            </div>
            
            <div style="background: rgba(96, 165, 250, 0.1); padding: 20px; border-radius: 15px; border: 1px solid var(--glass-border);">
                <h4 style="color: var(--primary); margin-bottom: 10px;">☁️ Cloud Cover</h4>
                <p style="font-size: 1.8rem; font-weight: bold;">${weatherData.cloudCoverage}%</p>
                <p style="color: var(--text-muted);">${weatherData.cloudCoverage > 50 ? 'Mostly cloudy' : 'Clear skies'}</p>
            </div>
            
            <div style="background: rgba(96, 165, 250, 0.1); padding: 20px; border-radius: 15px; border: 1px solid var(--glass-border);">
                <h4 style="color: var(--primary); margin-bottom: 10px;">💨 Absolute Humidity</h4>
                <p style="font-size: 1.8rem; font-weight: bold;">${weatherData.moistureAH.toFixed(1)} g/m³</p>
                <p style="color: var(--text-muted);">Water vapor density</p>
            </div>
        </div>
        
        <div style="margin-top: 40px; padding: 30px; background: rgba(167, 139, 250, 0.1); border-radius: 15px; border: 2px solid var(--secondary);">
            <h4 style="color: var(--secondary); font-size: 1.5rem; margin-bottom: 15px;">📅 7-Day Forecast</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 15px; margin-top: 20px;">
                ${generateSevenDayForecast(temp, weatherCondition)}
            </div>
        </div>
    `;

    // Display results
    elements.weatherPrediction.innerHTML = predictionHTML;
    elements.resultsSection.classList.remove('hidden');

    // Play success sound
    playSuccessSound();

    // Change background based on weather
    changeWeatherBackground(weatherCondition);

    // Play ambient weather sound
    playAmbientSound(weatherCondition);

    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==================== SEVEN DAY FORECAST GENERATOR ====================
function generateSevenDayForecast(baseTemp, baseCondition) {
    const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const conditions = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
    const emojis = {
        sunny: '☀️',
        cloudy: '☁️',
        rainy: '🌧️',
        stormy: '⛈️',
        snowy: '❄️',
        clear: '☀️'
    };

    let forecastHTML = '';

    for (let i = 0; i < 7; i++) {
        // Generate slight variations in temperature
        const tempVariation = (Math.random() - 0.5) * 6;
        const dayTemp = Math.round(baseTemp + tempVariation);

        // Determine condition with some randomness
        let dayCondition = baseCondition;
        if (Math.random() > 0.7) {
            dayCondition = conditions[Math.floor(Math.random() * conditions.length)];
        }

        forecastHTML += `
            <div style="text-align: center; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; border: 1px solid var(--glass-border);">
                <p style="font-weight: 600; margin-bottom: 10px; color: var(--text-muted);">${days[i]}</p>
                <div style="font-size: 2.5rem; margin: 10px 0;">${emojis[dayCondition] || emojis.sunny}</div>
                <p style="font-size: 1.3rem; font-weight: bold; color: var(--primary);">${dayTemp}°C</p>
            </div>
        `;
    }

    return forecastHTML;
}

// ==================== CHANGE WEATHER BACKGROUND ====================
function changeWeatherBackground(condition) {
    // Remove all weather classes
    elements.weatherBackground.classList.remove('sunny', 'cloudy', 'rainy', 'stormy', 'snowy');

    // Add new weather class
    elements.weatherBackground.classList.add(condition);
}

// ==================== EVENT LISTENERS ====================

// Air Pressure Inputs
elements.force.addEventListener('input', calculatePressure);
elements.area.addEventListener('input', calculatePressure);

// Moisture RH Inputs
elements.moistureVapor.addEventListener('input', calculateMoistureRH);
elements.moistureSaturation.addEventListener('input', calculateMoistureRH);

// Moisture AH Inputs
elements.ahVapor.addEventListener('input', calculateMoistureAH);
elements.ahVolume.addEventListener('input', calculateMoistureAH);

// Rain Slider
elements.rainSlider.addEventListener('input', (e) => {
    updateRainfall(e.target.value);
});

// Rain Input Box
elements.rainfall.addEventListener('input', (e) => {
    updateRainfall(e.target.value);
});

// Rain Buttons
elements.rainBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const value = e.target.getAttribute('data-value');
        updateRainfall(value);
        btn.classList.add('active');
        playClickSound();
    });
});

// Cloud Cards
elements.cloudCards.forEach(card => {
    card.addEventListener('click', (e) => {
        const coverage = parseInt(card.getAttribute('data-coverage'));
        selectCloudCoverage(coverage, card);
    });
});

// Temperature Input
elements.temperature.addEventListener('input', (e) => {
    weatherData.temperature = parseFloat(e.target.value) || 0;
});

// Predict Button
elements.predictBtn.addEventListener('click', predictWeather);

// Sound Toggle
elements.soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    elements.soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    elements.soundToggle.classList.toggle('muted');
    playClickSound();
});

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 Atmospheric Weather Forecast App Initialized');

    // Set default rainfall to 0
    updateRainfall(0);

    // Initialize all calculations
    calculatePressure();
    calculateMoistureRH();
    calculateMoistureAH();
});
