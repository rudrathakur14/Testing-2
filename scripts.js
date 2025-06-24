// Global variables
let currentUser = null;
let currentService = 'passport';
let processedImageUrl = '';
let originalFileName = '';
let selectedBackground = 'white';

// Authentication Functions
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick="switchAuthTab('${tab}')"]`).classList.add('active');
    
    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

function handleAuth(e) {
    e.preventDefault();
    const isLogin = document.getElementById('login-form').classList.contains('hidden') === false;
    
    if (isLogin) {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Simulate login validation
        if (email && password) {
            currentUser = {
                name: email.split('@')[0],
                email: email,
                avatar: email.charAt(0).toUpperCase()
            };
            showMainApp();
        } else {
            alert('Please enter valid credentials');
        }
    } else {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        // Simulate registration
        if (name && email && password) {
            currentUser = {
                name: name,
                email: email,
                avatar: name.charAt(0).toUpperCase()
            };
            showMainApp();
        } else {
            alert('Please fill all fields');
        }
    }
}

function enterDemo() {
    currentUser = {
        name: 'Demo User',
        email: 'demo@photomaster.com',
        avatar: 'D'
    };
    showMainApp();
}

function showMainApp() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    // Update user info
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-avatar').textContent = currentUser.avatar;
}

function logout() {
    currentUser = null;
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    
    // Reset forms
    document.getElementById('auth-form').reset();
    resetService('passport');
    resetService('bgremover');
}

// Service Management Functions
function switchService(service) {
    currentService = service;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.service-tab').forEach(tab => tab.classList.remove('active'));
    
    document.querySelector(`[onclick="switchService('${service}')"]`).classList.add('active');
    document.querySelectorAll(`[onclick="switchService('${service}')"]`).forEach(tab => tab.classList.add('active'));
    
    // Update header
    if (service === 'passport') {
        document.getElementById('service-title').innerHTML = '🪪 Passport Photo Generator';
        document.getElementById('service-description').textContent = 'Convert your photos to perfect passport size with professional backgrounds';
    } else {
        document.getElementById('service-title').innerHTML = '🎨 Background Remover';
        document.getElementById('service-description').textContent = 'Remove backgrounds and replace with custom colors or transparent backgrounds';
    }
    
    // Show/hide service content
    document.querySelectorAll('.service-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${service}-service`).classList.add('active');
}

// Background Selection for Background Remover
function selectBackground(bgType) {
    selectedBackground = bgType;
    document.querySelectorAll('.bg-option').forEach(option => option.classList.remove('active'));
    document.querySelector(`.bg-option.${bgType}`).classList.add('active');
}

// File handling
function setupFileHandlers() {
    ['passport', 'bgremover'].forEach(service => {
        const fileInput = document.getElementById(`file-input-${service}`);
        const uploadBox = document.querySelector(`#${service}-service .upload-box`);
        
        fileInput.addEventListener('change', (e) => handleFileSelect(e, service));
        
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.classList.add('dragover');
        });
        
        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('dragover');
        });
        
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0], service);
            }
        });
    });
}

function handleFileSelect(e, service) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file, service);
    }
}

function handleFile(file, service) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
        showStatus('❌ Please upload a valid image file (JPG, PNG, WEBP, GIF, BMP)', 'error', service);
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showStatus('❌ File size too large. Please upload an image smaller than 10MB.', 'error', service);
        return;
    }
    
    originalFileName = file.name;
    processImage(file, service);
}

function processImage(file, service) {
    showStatus('🔄 Processing your photo...', 'success', service);
    document.getElementById(`progress-container-${service}`).style.display = 'block';
    document.getElementById(`loading-spinner-${service}`).style.display = 'block';
    
    // Simulate processing steps
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        document.getElementById(`progress-fill-${service}`).style.width = progress + '%';
    }, 200);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            setTimeout(() => {
                clearInterval(progressInterval);
                document.getElementById(`progress-fill-${service}`).style.width = '100%';
                
                let processedImageData;
                if (service === 'passport') {
                    processedImageData = createPassportPhoto(img);
                } else {
                    processedImageData = removeBackground(img);
                }
                
                displayResults(e.target.result, processedImageData, service);
                
                setTimeout(() => {
                    document.getElementById(`progress-container-${service}`).style.display = 'none';
                    document.getElementById(`loading-spinner-${service}`).style.display = 'none';
                    document.getElementById(`progress-fill-${service}`).style.width = '0%';
                }, 1000);
            }, 1500);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function createPassportPhoto(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set passport photo dimensions
    const passportSize = 600;
    canvas.width = passportSize;
    canvas.height = passportSize;
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, passportSize, passportSize);
    
    // Calculate dimensions to maintain aspect ratio
    const imgAspectRatio = img.width / img.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imgAspectRatio > 1) {
        // Image is wider than tall
        drawHeight = passportSize;
        drawWidth = drawHeight * imgAspectRatio;
        offsetX = (passportSize - drawWidth) / 2;
        offsetY = 0;
    } else {
        // Image is taller than wide or square
        drawWidth = passportSize;
        drawHeight = drawWidth / imgAspectRatio;
        offsetX = 0;
        offsetY = (passportSize - drawHeight) / 2;
    }
    
    // Draw the image
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    
    // Apply some basic enhancement
    const imageData = ctx.getImageData(0, 0, passportSize, passportSize);
    const data = imageData.data;
    
    // Subtle brightness and contrast adjustment
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.05);     // Red
        data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Green
        data[i + 2] = Math.min(255, data[i + 2] * 1.05); // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.95);
}

function removeBackground(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Apply background based on selection
    switch(selectedBackground) {
        case 'white':
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'transparent':
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'blue':
            const blueGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            blueGradient.addColorStop(0, '#667eea');
            blueGradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = blueGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'green':
            const greenGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            greenGradient.addColorStop(0, '#28a745');
            greenGradient.addColorStop(1, '#20c997');
            ctx.fillStyle = greenGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'red':
            const redGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            redGradient.addColorStop(0, '#dc3545');
            redGradient.addColorStop(1, '#e74c3c');
            ctx.fillStyle = redGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        default:
            // Custom color from color picker
            ctx.fillStyle = document.getElementById('bg-color').value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Simulate background removal by applying a simple edge detection and masking
    // Note: This is a simplified implementation. In a real app, you'd use more sophisticated algorithms
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(img, 0, 0);
    
    // Apply some basic filtering to simulate background removal
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple background removal simulation (edge-based)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Detect likely background pixels (very basic)
        const isBackground = (r > 200 && g > 200 && b > 200) || 
                               (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30);
        
        if (isBackground && selectedBackground === 'transparent') {
            data[i + 3] = 0; // Make transparent
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return selectedBackground === 'transparent' ? 
           canvas.toDataURL('image/png') : 
           canvas.toDataURL('image/jpeg', 0.95);
}

function displayResults(originalImage, processedImage, service) {
    showStatus('✅ Photo processed successfully!', 'success', service);
    
    const previewSection = document.getElementById(`preview-section-${service}`);
    const imagePreview = document.getElementById(`image-preview-${service}`);
    const downloadSection = document.getElementById(`download-section-${service}`);
    
    const serviceTitle = service === 'passport' ? 'Passport Photo' : 'Background Removed';
    const serviceInfo = service === 'passport' ? '600x600 • White Background' : 'Custom Background Applied';
    
    imagePreview.innerHTML = `
        <div class="image-container">
            <h3>📸 Original Photo</h3>
            <img src="${originalImage}" alt="Original Photo">
            <p style="margin-top: 10px; color: #6c757d;">Your uploaded image</p>
        </div>
        <div class="image-container">
            <h3>${service === 'passport' ? '🪪' : '🎨'} ${serviceTitle}</h3>
            <img src="${processedImage}" alt="${serviceTitle}">
            <p style="margin-top: 10px; color: #28a745; font-weight: 600;">${serviceInfo}</p>
        </div>
    `;
    
    processedImageUrl = processedImage;
    previewSection.style.display = 'block';
    downloadSection.style.display = 'block';
    
    // Scroll to results
    setTimeout(() => {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

function downloadImage(service) {
    if (processedImageUrl) {
        const link = document.createElement('a');
        const fileName = service === 'passport' ? 
            `passport_photo_${originalFileName.split('.')[0]}.jpg` :
            `bg_removed_${originalFileName.split('.')[0]}.${selectedBackground === 'transparent' ? 'png' : 'jpg'}`;
        
        link.download = fileName;
        link.href = processedImageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showStatus(`📁 ${service === 'passport' ? 'Passport photo' : 'Photo'} downloaded successfully!`, 'success', service);
    }
}

function resetService(service) {
    document.getElementById(`preview-section-${service}`).style.display = 'none';
    document.getElementById(`file-input-${service}`).value = '';
    document.getElementById(`status-message-${service}`).style.display = 'none';
    processedImageUrl = '';
    originalFileName = '';
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStatus(message, type, service) {
    const statusEl = document.getElementById(`status-message-${service}`);
    statusEl.innerHTML = message;
    statusEl.className = `status-message status-${type}`;
    statusEl.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            if (statusEl.innerHTML === message) {
                statusEl.style.display = 'none';
            }
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Setup form handler
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    
    // Setup file handlers
    setupFileHandlers();
    
    // Setup color picker handler
    document.getElementById('bg-color').addEventListener('change', function() {
        selectedBackground = 'custom';
        document.querySelectorAll('.bg-option').forEach(option => option.classList.remove('active'));
    });
    
    // Add animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeIn 0.8s ease-out forwards';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature').forEach(feature => {
        observer.observe(feature);
    });
});
    </script>
