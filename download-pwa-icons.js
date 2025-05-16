const https = require('https');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Create the pwa-icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'pwa-icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// URL of the original image
const imageUrl = 'https://i.postimg.cc/MpyY0sQY/Profile-picture-8-removebg-preview.png';

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Download the image
const downloadImage = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
};

// Resize the image to different sizes
const resizeImage = async (imageBuffer, size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Load the image
  const image = await loadImage(imageBuffer);
  
  // Calculate aspect ratio to maintain proportions
  const aspectRatio = image.width / image.height;
  let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
  
  if (aspectRatio > 1) {
    // Image is wider than tall
    drawHeight = size;
    drawWidth = size * aspectRatio;
    offsetX = -(drawWidth - size) / 2;
  } else {
    // Image is taller than wide
    drawWidth = size;
    drawHeight = size / aspectRatio;
    offsetY = -(drawHeight - size) / 2;
  }
  
  // Draw the image centered
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  
  // Convert canvas to buffer
  return canvas.toBuffer('image/png');
};

// Main function to download and create icons
const createPWAIcons = async () => {
  try {
    console.log('Downloading original image...');
    const imageBuffer = await downloadImage(imageUrl);
    
    console.log('Creating PWA icons...');
    for (const size of iconSizes) {
      const resizedBuffer = await resizeImage(imageBuffer, size);
      const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
      fs.writeFileSync(filePath, resizedBuffer);
      console.log(`Created icon: ${filePath}`);
    }
    
    // Also create a maskable icon (with padding for safe area)
    const maskableSize = 512;
    const canvas = createCanvas(maskableSize, maskableSize);
    const ctx = canvas.getContext('2d');
    
    // Fill with background color from Toiral design system
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, maskableSize, maskableSize);
    
    // Load and draw the image with padding (80% of the canvas)
    const image = await loadImage(imageBuffer);
    const padding = maskableSize * 0.1; // 10% padding on each side
    const drawSize = maskableSize * 0.8; // 80% of the canvas
    
    // Calculate aspect ratio to maintain proportions
    const aspectRatio = image.width / image.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (aspectRatio > 1) {
      // Image is wider than tall
      drawHeight = drawSize / aspectRatio;
      drawWidth = drawSize;
      offsetX = padding;
      offsetY = (maskableSize - drawHeight) / 2;
    } else {
      // Image is taller than wide
      drawWidth = drawSize * aspectRatio;
      drawHeight = drawSize;
      offsetX = (maskableSize - drawWidth) / 2;
      offsetY = padding;
    }
    
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    
    // Save the maskable icon
    const maskableFilePath = path.join(iconsDir, 'maskable-icon.png');
    fs.writeFileSync(maskableFilePath, canvas.toBuffer('image/png'));
    console.log(`Created maskable icon: ${maskableFilePath}`);
    
    console.log('All PWA icons created successfully!');
  } catch (error) {
    console.error('Error creating PWA icons:', error);
  }
};

createPWAIcons();
