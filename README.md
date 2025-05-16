# Toiral Task Board

A task management application built with React, Vite, and Firebase.

## Getting Started

1. Clone the repository
2. Set up environment variables (see below)
3. Run `npm install`
4. Run `npm run dev`

## Environment Variables Setup

This application uses environment variables to securely store Firebase configuration. Follow these steps to set up your environment:

### Development Environment

1. Copy the `.env.example` file to a new file named `.env`:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file and replace the placeholder values with your Firebase project configuration:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.region.firebasedatabase.app
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

### Production Environment

For production deployment, you should set these environment variables in your hosting platform:

1. **Firebase Hosting**: Use Firebase CLI to set environment variables:
   ```
   firebase functions:config:set firebase.apikey="your-api-key" firebase.authdomain="your-auth-domain" ...
   ```

2. **Other Hosting Providers**: Consult your hosting provider's documentation for setting environment variables.

## Security Best Practices

1. **Never commit `.env` files to version control**. The `.gitignore` file is configured to exclude these files.

2. **Restrict API key usage** in the Firebase Console:
   - Go to the Firebase Console > Project Settings > API keys
   - Add restrictions based on HTTP referrers, IP addresses, etc.

3. **Set up proper Firebase Security Rules** to control access to your database and storage.

4. **Regularly rotate your API keys** if you suspect they have been compromised.

5. **Use Firebase Authentication** to secure your application and database access.

## Building for Production

1. Run `npm run build`
2. Deploy using Firebase CLI: `firebase deploy`
