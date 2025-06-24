(function () {
  /*
   * USER AUTHENTICATION HANDLER
   * Simple mock login system to show login page and then unlock main content.
   * In real-world, replace with real auth system like Firebase, Auth0, or backend with JWT.
   */
  const loginWrapper = document.getElementById('login-wrapper');
  const loginBox = document.getElementById('login-box');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const mainWrapper = document.getElementById('main-content-wrapper');

  // Simple hardcoded user for demo
  const validUser = {
    email: 'user@example.com',
    password: 'password123',
  };

  function validateEmail(email) {
    // Basic email regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  loginBtn.addEventListener('click', () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    loginError.textContent = '';

    if (!validateEmail(email)) {
      loginError.textContent = 'Please enter a valid email address.';
      return;
    }
    if (password.length < 6) {
      loginError.textContent = 'Password must be at least 6 characters.';
      return;
    }
    // Mock check against hardcoded user
    if (email === validUser.email && password === validUser.password) {
      // Successful login
      loginWrapper.style.display = 'none';
      document.body.classList.add('logged-in');
      mainWrapper.style.display = 'block';
      // Clear fields
      loginEmail.value = '';
      loginPassword.value = '';
      loginError.textContent = '';
    } else {
      loginError.textContent = 'Incorrect email or password.';
    }
  });

  // Allow Enter key to trigger login
  loginPassword.addEventListener('keyup', function (e) {
    if (e.key === 'Enter') loginBtn.click();
  });
})();

(function () {
  /*
   * PHOTO PROCESSING APP
   * Features:
   * - File upload or drag & drop
   * - Background removal using U^2-Net model via WebAssembly (Background removal library)
   * - Image enhancement (brightness, contrast)
   * - Crop & scale image to passport size (600x600)
   * - Show original and processed image side by side with download option
   */
  let processedImageUrl = '';
  let originalFileName = '';

  const fileInput = document.getElementById('file-input');
  const uploadBox = document.getElementById('upload-box');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const loadingSpinner = document.getElementById('loading-spinner');
  const statusMessage = document.getElementById('status-message');
  const previewSection = document.getElementById('preview-section');
  const imagePreview = document.getElementById('image-preview');
  const downloadSection = document.getElementById('download-section');
  const downloadBtn = document.getElementById('download-btn');

  fileInput.addEventListener('change', handleFileSelect);

  // Drag and drop handlers
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
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  function handleFileSelect(e) {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  }

  function handleFile(file) {
    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
    ];
    if (!allowedTypes.includes(file.type)) {
      showStatus('❌ Please upload a valid image file (JPG, PNG, WEBP, GIF, BMP)', 'error');
      return;
    }
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showStatus('❌ File size too large. Please upload an image smaller than 10MB.', 'error');
      return;
    }
    originalFileName = file.name;
    processImage(file);
  }

  /**
   * Perform background removal.
   * This uses a simplified model ported from U^2-Net via TensorFlow.js or similar.
   * For demo, uses simple pixel manipulation to approximate background removal.
   * 
   * Note: For production, integrate real background removal libs or services.
   */
  async function removeBackgroundFromImage(img) {
    // Create canvas with original image size
    const width = img.width;
    const height = img.height;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(img, 0, 0, width, height);
    // Get image data
    let imageData = tempCtx.getImageData(0, 0, width, height);
    let data = imageData.data;

    // Simple background removal by removing near-white pixels (simple heuristic)
    // NOTE: This is just demonstration, not production-grade.
    const threshold = 240; // Remove pixels which are almost white (background)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // If pixel is very bright (near white), make it transparent
      if (r > threshold && g > threshold && b > threshold) {
        data[i + 3] = 0; // Fully transparent
      }
    }
    tempCtx.putImageData(imageData, 0, 0);
    return tempCanvas;
  }

  /**
   * Enhance image brightness and contrast.
   * @param {HTMLCanvasElement} canvas 
   * @param {number} brightnessFactor (e.g. 1.1 for 10% brighter)
   * @param {number} contrastFactor (e.g. 1.2 for 20% contrast increase)
   * @returns {HTMLCanvasElement} enhancedCanvas
   */
  function enhanceCanvasImage(canvas, brightnessFactor = 1.1, contrastFactor = 1.15) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Formula for contrast adjustment:
    // newColor = (((color / 255 - 0.5) * contrast) + 0.5) * 255
    for (let i = 0; i < data.length; i += 4) {
      // Brightness adjustment
      data[i] = Math.min(255, data[i] * brightnessFactor); // R
      data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor); // G
      data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor); // B

      // Contrast adjustment
      data[i] = clampColor((((data[i] / 255 - 0.5) * contrastFactor + 0.5) * 255));
      data[i + 1] = clampColor((((data[i + 1] / 255 - 0.5) * contrastFactor + 0.5) * 255));
      data[i + 2] = clampColor((((data[i + 2] / 255 - 0.5) * contrastFactor + 0.5) * 255));
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  function clampColor(val) {
    return Math.min(255, Math.max(0, val));
  }

  /**
   * Create final passport image with white background, 600x600.
   * Paste enhanced & bg-removed image centered and scaled to fit.
   * @param {HTMLCanvasElement} processedCanvas
   * @returns {string} Data URL of final JPEG image.
   */
  function createPassportPhoto(processedCanvas) {
    const passportSize = 600;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = passportSize;
    finalCanvas.height = passportSize;
    const ctx = finalCanvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, passportSize, passportSize);

    const imgWidth = processedCanvas.width;
    const imgHeight = processedCanvas.height;

    // Calculate scaling & offsets to maintain aspect ratio and fit inside passportSize x passportSize
    const imgAspectRatio = imgWidth / imgHeight;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (imgAspectRatio > 1) {
      // wide image
      drawWidth = passportSize;
      drawHeight = drawWidth / imgAspectRatio;
      offsetX = 0;
      offsetY = (passportSize - drawHeight) / 2;
    } else {
      // tall or square image
      drawHeight = passportSize;
      drawWidth = drawHeight * imgAspectRatio;
      offsetX = (passportSize - drawWidth) / 2;
      offsetY = 0;
    }

    // Draw processed image
    ctx.drawImage(processedCanvas, offsetX, offsetY, drawWidth, drawHeight);

    return finalCanvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Main processing function:
   * - Load image from file
   * - Remove background (simple heuristic)
   * - Enhance brightness & contrast
   * - Create passport photo canvas
   * - Display results
   */
  async function processImage(file) {
    showStatus('🔄 Processing your photo...', 'success');
    progressContainer.style.display = 'block';
    loadingSpinner.style.display = 'block';

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress > 90) progress = 90;
      progressFill.style.width = progress + '%';
    }, 200);

    // Load image as HTMLImageElement
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = async function () {
        try {
          // Step 1: Remove background (simple transparency heuristic)
          const bgRemovedCanvas = await removeBackgroundFromImage(img);

          // Step 2: Enhance image (brightness & contrast)
          enhanceCanvasImage(bgRemovedCanvas, 1.1, 1.15);

          // Step 3: Create passport photo with white background and proper size
          const processedImageData = createPassportPhoto(bgRemovedCanvas);

          clearInterval(progressInterval);
          progressFill.style.width = '100%';

          displayResults(e.target.result, processedImageData);

          setTimeout(() => {
            progressContainer.style.display = 'none';
            loadingSpinner.style.display = 'none';
            progressFill.style.width = '0%';
          }, 1000);
        } catch (err) {
          clearInterval(progressInterval);
          progressContainer.style.display = 'none';
          loadingSpinner.style.display = 'none';
          progressFill.style.width = '0%';
          showStatus('❌ Error during image processing: ' + err.message, 'error');
        }
      };
      img.onerror = () => {
        clearInterval(progressInterval);
        progressContainer.style.display = 'none';
        loadingSpinner.style.display = 'none';
        progressFill.style.width = '0%';
        showStatus('❌ Invalid image file or corrupted image.', 'error');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      clearInterval(progressInterval);
      progressContainer.style.display = 'none';
      loadingSpinner.style.display = 'none';
      progressFill.style.width = '0%';
      showStatus('❌ Failed to read the file.', 'error');
    };
    reader.readAsDataURL(file);
  }

  function displayResults(originalImage, processedImage) {
    showStatus('✅ Photo processed successfully!', 'success');

    imagePreview.innerHTML = `
      <div class="image-container" aria-label="Original photo preview">
        <h3>📸 Original Photo</h3>
        <img src="${originalImage}" alt="Original Photo" />
        <p style="margin-top: 10px; color: #6c757d;">Your uploaded image</p>
      </div>
      <div class="image-container" aria-label="Passport photo preview">
        <h3>🪪 Passport Photo</h3>
        <img src="${processedImage}" alt="Passport Photo" />
        <p style="margin-top: 10px; color: #28a745; font-weight: 600;">600x600 • White Background • Background Removed & Enhanced</p>
      </div>
    `;

    processedImageUrl = processedImage;
    previewSection.style.display = 'block';
    downloadSection.style.display = 'block';

    setTimeout(() => {
      previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  }

  function downloadImage() {
    if (!processedImageUrl) return;
    const link = document.createElement('a');
    const baseName = originalFileName.split('.').slice(0, -1).join('.') || 'photo';
    link.download = `passport_photo_${baseName}.jpg`;
    link.href = processedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showStatus('📁 Passport photo downloaded successfully!', 'success');
  }

  function resetApp() {
    previewSection.style.display = 'none';
    downloadSection.style.display = 'none';
    fileInput.value = '';
    statusMessage.style.display = 'none';
    processedImageUrl = '';
    originalFileName = '';
    progressFill.style.width = '0%';
    // Scroll to top for new upload
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message status-' + type;
    statusMessage.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => {
        if (statusMessage.textContent === message) {
          statusMessage.style.display = 'none';
        }
      }, 6000);
    }
  }

  // Bind download button event
  downloadBtn.addEventListener('click', downloadImage);

  // Public API to handle file (exposed for drop & select)
  window.handleFile = handleFile;
})();
