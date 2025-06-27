// Global variables
let currentUser = null;
let userDatabase = JSON.parse(localStorage.getItem('carbonTracker_users') || '{}');
let currentTheme = localStorage.getItem('carbonTracker_theme') || 'light';
let chart1, chart2;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setTheme(currentTheme);
    checkAuthStatus();
});

// Authentication functions
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegister() {
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '';
    } else {
        input.type = 'password';
        button.textContent = '';
    }
}

function validatePassword() {
    const password = document.getElementById('registerPassword').value;
    const requirements = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    document.getElementById('lengthReq').classList.toggle('valid', requirements.length);
    document.getElementById('upperReq').classList.toggle('valid', requirements.upper);
    document.getElementById('numberReq').classList.toggle('valid', requirements.number);
    document.getElementById('specialReq').classList.toggle('valid', requirements.special);

    const isValid = Object.values(requirements).every(req => req);
    document.getElementById('registerBtn').disabled = !isValid;
}

function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (userDatabase[email]) {
        alert('User already exists with this email');
        return;
    }

    userDatabase[email] = {
        name: name,
        email: email,
        password: password, // In real app, this would be hashed
        activities: [],
        joinDate: new Date().toISOString()
    };

    localStorage.setItem('carbonTracker_users', JSON.stringify(userDatabase));
    currentUser = userDatabase[email];
    showApp();
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!userDatabase[email] || userDatabase[email].password !== password) {
        alert('Invalid email or password');
        return;
    }

    currentUser = userDatabase[email];
    showApp();
}

function logout() {
    currentUser = null;
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
    showLogin();
}

function checkAuthStatus() {
    // In a real app, check for valid session
    if (currentUser) {
        showApp();
    }
}

function showApp() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userDisplayName').textContent = currentUser.name;
    document.getElementById('userDisplayEmail').textContent = currentUser.email;
    
    updateDashboard();
    updateHistory();
}

// Theme functions
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('carbonTracker_theme', theme);
    
    const themeText = document.getElementById('themeText');
    if (themeText) {
        themeText.textContent = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
}

// UI functions
function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('show');
}

function showSection(sectionName) {
    // Hide all sections
    const sections = ['dashboard', 'track', 'history', 'analytics'];
    sections.forEach(section => {
        const sectionEl = document.getElementById(section + 'Section');
        const tabEl = document.getElementById(section + 'Tab');
        
        if (sectionEl) sectionEl.classList.add('hidden');
        if (tabEl) tabEl.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    const targetTab = document.getElementById(sectionName + 'Tab');
    
    if (targetSection) targetSection.classList.remove('hidden');
    if (targetTab) targetTab.classList.add('active');

    // Special handling for analytics section
    if (sectionName === 'analytics') {
        setTimeout(() => {
            updateAnalytics();
        }, 200);
    }
}

// Carbon footprint calculation


const emissionFactors = {
    transport: {
        car: 0.21, // kg CO2 per km
        electric_car: 0.05,
        bus: 0.08,
        train: 0.04,
        bike: 0,
        walk: 0
    },
    food: {
        proteins: 0.015, // kg CO2 per gram
        carbs: 0.002,
        fats: 0.008,
        fibers: 0.001
    },
    electricity: {
        grid: 0.5, // kg CO2 per kWh
        renewable: 0.05,
        coal: 0.9,
        natural_gas: 0.4
    },
    goods: {
        clothing: 15, // kg CO2 per purchase
        electronics: 25,
        household: 8,
        online_shopping: 5
    },
    travel: {
        air_travel: 50, // kg CO2 per trip
        hotel_stays: 20,
        leisure: 10
    },
    housing: {
        home_size: 0.1, // kg CO2 per sqm per month
        insulation: -5, // reduction factor
        occupants: -2 // reduction per occupant
    },
    waste: {
        general_waste: 0.5, // kg CO2 per kg waste
        recycling: -0.2, // reduction factor
        composting: -0.3 // reduction factor
    }
};

// Activity tracking functions
function addActivity(category) {
    if (!currentUser) return;

    let activity = {
        id: Date.now(),
        category: category,
        date: new Date().toISOString(),
        emission: 0
    };

    switch(category) {
        case 'transport':
            const transportType = document.getElementById('transportType').value;
            const distance = parseFloat(document.getElementById('transportDistance').value) || 0;
            activity.type = transportType;
            activity.value = distance;
            activity.unit = 'km';
            activity.emission = distance * emissionFactors.transport[transportType];
            document.getElementById('transportDistance').value = '';
            break;

        case 'food':
            const foodType = document.getElementById('foodType').value;
            const portion = parseFloat(document.getElementById('foodPortion').value) || 0;
            activity.type = foodType;
            activity.value = portion;
            activity.unit = 'grams';
            activity.emission = portion * emissionFactors.food[foodType];
            document.getElementById('foodPortion').value = '';
            break;

        case 'electricity':
            const electricityType = document.getElementById('electricityType').value;
            const usage = parseFloat(document.getElementById('electricityUsage').value) || 0;
            activity.type = electricityType;
            activity.value = usage;
            activity.unit = 'kWh';
            activity.emission = usage * emissionFactors.electricity[electricityType];
            document.getElementById('electricityUsage').value = '';
            break;

        case 'goods':
            const goodsType = document.getElementById('goodsType').value;
            const frequency = parseFloat(document.getElementById('goodsFrequency').value) || 0;
            activity.type = goodsType;
            activity.value = frequency;
            activity.unit = 'per month';
            activity.emission = frequency * emissionFactors.goods[goodsType];
            document.getElementById('goodsFrequency').value = '';
            break;

        case 'travel':
            const travelType = document.getElementById('travelType').value;
            const travelFreq = parseFloat(document.getElementById('travelFrequency').value) || 0;
            activity.type = travelType;
            activity.value = travelFreq;
            activity.unit = 'per month';
            activity.emission = travelFreq * emissionFactors.travel[travelType];
            document.getElementById('travelFrequency').value = '';
            break;

        case 'housing':
            const housingType = document.getElementById('housingType').value;
            const housingValue = parseFloat(document.getElementById('housingValue').value) || 0;
            activity.type = housingType;
            activity.value = housingValue;
            activity.unit = housingType === 'home_size' ? 'sqm' : 'units';
            activity.emission = housingValue * emissionFactors.housing[housingType];
            document.getElementById('housingValue').value = '';
            break;

        case 'waste':
            const wasteType = document.getElementById('wasteType').value;
            const wasteAmount = parseFloat(document.getElementById('wasteAmount').value) || 0;
            activity.type = wasteType;
            activity.value = wasteAmount;
            activity.unit = 'kg/week';
            activity.emission = wasteAmount * emissionFactors.waste[wasteType];
            document.getElementById('wasteAmount').value = '';
            break;
    }

    currentUser.activities.push(activity);
    userDatabase[currentUser.email] = currentUser;
    
    // Store in memory instead of localStorage for this environment
    updateDashboard();
    updateHistory();
    
    // Show success message
    showNotification(`Added ${category} activity: ${activity.emission.toFixed(2)} kg CO₂`);
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add animation keyframes
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Dashboard functions
function updateDashboard() {
    if (!currentUser) return;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyActivities = currentUser.activities.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate.getMonth() === currentMonth && 
               activityDate.getFullYear() === currentYear;
    });

    const totalEmission = monthlyActivities.reduce((sum, activity) => sum + activity.emission, 0);
    document.getElementById('totalFootprint').textContent = totalEmission.toFixed(1);

    // Update recent activity
    const recentActivities = currentUser.activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const recentActivityDiv = document.getElementById('recentActivity');
    if (recentActivities.length === 0) {
        recentActivityDiv.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No recent activities. Start tracking to see your carbon footprint!</p>';
    } else {
        recentActivityDiv.innerHTML = recentActivities.map(activity => `
            <div class="history-item">
                <div>
                    <div class="history-date">${formatDate(activity.date)}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${getCategoryIcon(activity.category)} ${formatActivityDescription(activity)}
                    </div>
                </div>
                <div class="history-value">${activity.emission.toFixed(2)} kg CO₂</div>
            </div>
        `).join('');
    }
}

function updateHistory() {
    if (!currentUser) return;

    const activities = currentUser.activities
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const historyList = document.getElementById('historyList');
    if (activities.length === 0) {
        historyList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No history available yet.</p>';
    } else {
        historyList.innerHTML = activities.map(activity => `
            <div class="history-item">
                <div>
                    <div class="history-date">${formatDate(activity.date)}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${getCategoryIcon(activity.category)} ${formatActivityDescription(activity)}
                    </div>
                </div>
                <div class="history-value">${activity.emission.toFixed(2)} kg CO₂</div>
            </div>
        `).join('');
    }
}

function updateAnalytics() {
    if (!currentUser || currentUser.activities.length === 0) {
        // Show message if no data
        const ctx1 = document.getElementById('footprintChart').getContext('2d');
        const ctx2 = document.getElementById('categoryChart').getContext('2d');
        
        if (chart1) chart1.destroy();
        if (chart2) chart2.destroy();
        
        return;
    }

    // Prepare data for line chart (monthly progression)
    const monthlyData = {};
    currentUser.activities.forEach(activity => {
        const date = new Date(activity.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += activity.emission;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const monthlyEmissions = sortedMonths.map(month => monthlyData[month]);

    // Prepare data for pie chart (category breakdown)
    const categoryData = {};
    currentUser.activities.forEach(activity => {
        if (!categoryData[activity.category]) {
            categoryData[activity.category] = 0;
        }
        categoryData[activity.category] += activity.emission;
    });

    // Create line chart
    const ctx1 = document.getElementById('footprintChart').getContext('2d');
    if (chart1) chart1.destroy();
    
    chart1 = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: sortedMonths.map(month => {
                const [year, monthNum] = month.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
            }),
            datasets: [{
                label: 'Monthly CO₂ Emissions (kg)',
                data: monthlyEmissions,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border')
                    }
                },
                y: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border')
                    }
                }
            }
        }
    });

    // Create pie chart
    const ctx2 = document.getElementById('categoryChart').getContext('2d');
    if (chart2) chart2.destroy();

    const categoryColors = {
        transport: '#FF6384',
        food: '#36A2EB',
        electricity: '#FFCE56',
        goods: '#FF9F40',
        travel: '#4BC0C0',
        housing: '#9966FF',
        waste: '#FF6384'
    };

    chart2 = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData).map(cat => 
                cat.charAt(0).toUpperCase() + cat.slice(1)
            ),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: Object.keys(categoryData).map(cat => categoryColors[cat] || '#999999')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        padding: 20
                    }
                }
            }
        }
    });
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCategoryIcon(category) {
    const icons = {
        transport: '🚗',
        food: '🍽️',
        electricity: '⚡',
        goods: '🛍️',
        travel: '✈️',
        housing: '🏠',
        waste: '🗑️'
    };
    return icons[category] || '📊';
}

function formatActivityDescription(activity) {
    const typeNames = {
        // Transport
        car: 'Car (Gasoline)',
        electric_car: 'Electric Car',
        bus: 'Public Bus',
        train: 'Train',
        bike: 'Bicycle',
        walk: 'Walking',
        
        // Food
        proteins: 'Proteins',
        carbs: 'Carbohydrates',
        fats: 'Fats',
        fibers: 'Fibers',
        
        // Electricity
        grid: 'Grid Electricity',
        renewable: 'Renewable Energy',
        coal: 'Coal Power',
        natural_gas: 'Natural Gas',
        
        // Goods
        clothing: 'Clothing Purchase',
        electronics: 'Electronic Devices',
        household: 'Household Goods',
        online_shopping: 'Online Shopping',
        
        // Travel
        air_travel: 'Air Travel',
        hotel_stays: 'Hotel Stays',
        leisure: 'Leisure Activities',
        
        // Housing
        home_size: 'Home Size',
        insulation: 'Building Insulation',
        occupants: 'Occupants',
        
        // Waste
        general_waste: 'General Waste',
        recycling: 'Recycling',
        composting: 'Composting'
    };

    return `${typeNames[activity.type] || activity.type}: ${activity.value} ${activity.unit}`;
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.matches('.user-button') && !event.target.matches('.user-button *')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
});

// Handle theme changes for charts
function updateChartsTheme() {
    setTimeout(() => {
        if (chart1 || chart2) {
            updateAnalytics();
        }
    }, 100);
}

// Override theme toggle to update charts
const originalToggleTheme = toggleTheme;
toggleTheme = function() {
    originalToggleTheme();
    updateChartsTheme();
};

// Input validation functions
function validateNumericInput(inputId, min = 0) {
    const input = document.getElementById(inputId);
    if (input) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value < min) {
            input.setCustomValidity(`Please enter a valid number (minimum ${min})`);
        } else {
            input.setCustomValidity('');
        }
    }
}

// Add event listeners for form validation
document.addEventListener('DOMContentLoaded', function() {
    // Add validation to numeric inputs
    const numericInputs = [
        'transportDistance', 'foodPortion', 'electricityUsage',
        'goodsFrequency', 'travelFrequency', 'housingValue', 'wasteAmount'
    ];
    
    numericInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', () => validateNumericInput(inputId));
        }
    });
});

// Export functionality (for future use)
function exportData() {
    if (!currentUser) return;
    
    const data = {
        user: currentUser.name,
        exportDate: new Date().toISOString(),
        activities: currentUser.activities,
        summary: {
            totalActivities: currentUser.activities.length,
            totalEmissions: currentUser.activities.reduce((sum, act) => sum + act.emission, 0),
            categories: [...new Set(currentUser.activities.map(act => act.category))]
        }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-footprint-${currentUser.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!');
}

// Delete activity function
function deleteActivity(activityId) {
    if (!currentUser) return;
    
    const index = currentUser.activities.findIndex(activity => activity.id === activityId);
    if (index > -1) {
        currentUser.activities.splice(index, 1);
        userDatabase[currentUser.email] = currentUser;
        
        updateDashboard();
        updateHistory();
        showNotification('Activity deleted successfully!');
    }
}