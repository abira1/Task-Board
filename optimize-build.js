// Build optimization script
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Starting build optimization process...');

// Step 1: Clean previous build
console.log('🧹 Cleaning previous build...');
try {
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  console.log('✅ Previous build cleaned successfully');
} catch (error) {
  console.error('❌ Error cleaning previous build:', error);
}

// Step 2: Run the build with production optimization
console.log('🏗️ Building production bundle...');
try {
  execSync('npx vite build --mode production', { stdio: 'inherit' });
  console.log('✅ Production build completed');
} catch (error) {
  console.error('❌ Error during build:', error);
  process.exit(1);
}

// Step 3: Generate PWA assets
console.log('🖼️ Generating PWA assets...');
try {
  execSync('npm run generate-pwa-assets', { stdio: 'inherit' });
  console.log('✅ PWA assets generated');
} catch (error) {
  console.log('⚠️ PWA asset generation skipped:', error.message);
}

// Step 4: Add cache headers to the build
console.log('📝 Adding cache headers...');
try {
  const firebaseJson = {
    "hosting": {
      "public": "dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**/*.@(js|css)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "max-age=31536000"
            }
          ]
        },
        {
          "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "max-age=31536000"
            }
          ]
        },
        {
          "source": "**/*.@(woff|woff2|ttf|otf|eot)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "max-age=31536000"
            }
          ]
        },
        {
          "source": "**/*.html",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "max-age=0, no-cache"
            }
          ]
        },
        {
          "source": "/",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "max-age=0, no-cache"
            }
          ]
        }
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  };

  fs.writeFileSync('firebase.json', JSON.stringify(firebaseJson, null, 2));
  console.log('✅ Cache headers added to firebase.json');
} catch (error) {
  console.error('❌ Error adding cache headers:', error);
}

console.log('🎉 Build optimization completed!');
console.log('📋 Next steps:');
console.log('1. Run "firebase deploy" to deploy your optimized application');
console.log('2. Test your application performance with Lighthouse');
