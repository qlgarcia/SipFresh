# SipFresh - Ionic + Capacitor + Firebase Android App

A modern e-commerce mobile application built with Ionic React, Capacitor, and Firebase. Features client-side PayPal checkout, real-time Firestore integration, and admin panel.

## 🚀 Features

- **Client-Side PayPal Checkout** - No server-side PHP required
- **Firebase Integration** - Firestore for data, Firebase Auth for authentication
- **Real-time Updates** - Live order status updates
- **Admin Panel** - Order management and product administration
- **Android APK Support** - Build and deploy to Android devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) and npm
- **Java JDK** (11 or higher) - Required for Android builds
- **Android Studio** - For Android SDK and build tools
- **Android SDK** - Installed via Android Studio
- **Gradle** - Usually bundled with Android Studio

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd SipFreshNew
npm install
```

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Firebase and PayPal credentials:

   **Firebase Configuration:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Go to Project Settings > General
   - Scroll down to "Your apps" and copy the config values

   **PayPal Configuration:**
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
   - Create a new app or use existing one
   - Copy the **Sandbox Client ID** for testing
   - For production, use the **Live Client ID**

   Example `.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   
   VITE_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
   VITE_PAYPAL_CURRENCY=PHP
   ```

### 3. Configure Firebase

1. **Firestore Rules**: Ensure your `firestore.rules` allow read/write for authenticated users:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. **Firebase Authentication**: Enable Email/Password and Google Sign-In in Firebase Console:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (add OAuth consent screen if needed)

### 4. Seed Demo Data

To populate your Firestore with demo products, users, and orders:

**Option A: Browser Console**
1. Run the app: `npm run dev`
2. Open browser console (F12)
3. Type: `await seedFirebaseData()`

**Option B: Import in Code**
```typescript
import { seedFirebaseData } from './utils/seedData';
await seedFirebaseData();
```

The seeder will create:
- 5 demo products (juices)
- 2 demo user documents (customer and admin)
- 3 demo orders with different statuses

**Note:** Demo user documents are created in Firestore, but you must also create corresponding users in Firebase Authentication to log in with them.

## 📱 Android Setup

### 1. Add Android Platform

```bash
# Build web assets first
npm run build

# Add Android platform
npx cap add android

# Copy web assets to Android
npx cap copy android
```

### 2. Configure AndroidManifest.xml

The AndroidManifest.xml should already include the INTERNET permission. If not, ensure `android/app/src/main/AndroidManifest.xml` contains:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### 3. Open in Android Studio

```bash
npx cap open android
```

This will open the project in Android Studio.

## 🔨 Building APK

### Option A: Debug APK (Unsigned - for testing)

**Via Android Studio:**
1. Open project in Android Studio: `npx cap open android`
2. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

**Via Command Line:**
```bash
cd android
./gradlew assembleDebug
```
APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Release APK (Signed - for distribution)

#### Step 1: Generate Keystore

**Using Android Studio:**
1. Build > Generate Signed Bundle / APK
2. Select APK
3. Click "Create new..." to create a keystore
4. Fill in the form:
   - Key store path: Choose a secure location
   - Password: Create a strong password
   - Key alias: e.g., `sipfresh-key`
   - Key password: Can be same as keystore password
   - Validity: 25+ years recommended
   - Certificate information: Fill in your details
5. Click OK and continue

**Using Command Line:**
```bash
keytool -genkey -v -keystore sipfresh-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sipfresh-key
```

#### Step 2: Configure Gradle Signing

1. Create `android/key.properties`:
   ```properties
   storePassword=your_keystore_password
   keyPassword=your_key_password
   keyAlias=sipfresh-key
   storeFile=../sipfresh-release-key.jks
   ```

2. Update `android/app/build.gradle`:
   ```gradle
   def keystorePropertiesFile = rootProject.file("key.properties")
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }

   android {
       ...
       signingConfigs {
           release {
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
               storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
               storePassword keystoreProperties['storePassword']
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               ...
           }
       }
   }
   ```

#### Step 3: Build Release APK

**Via Android Studio:**
1. Build > Generate Signed Bundle / APK
2. Select APK
3. Choose your keystore
4. Select release build variant
5. Click Finish

**Via Command Line:**
```bash
cd android
./gradlew assembleRelease
```
APK location: `android/app/build/outputs/apk/release/app-release.apk`

**⚠️ Important:** Never commit `key.properties` or `.jks` files to version control! Add them to `.gitignore`.

## 🧪 Testing

### 1. Install APK on Device/Emulator

```bash
# Connect device via USB (enable USB debugging)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or drag and drop APK to emulator
```

### 2. Test Flow

1. **Login**: Use Firebase Authentication (Email/Password or Google)
2. **Browse Products**: View seeded products
3. **Add to Cart**: Add items to cart
4. **Checkout**: 
   - Use PayPal Sandbox test account
   - Complete payment
   - Verify order created in Firestore
5. **Admin Panel**: 
   - Set user role to 'admin' in Firestore: `users/{uid}.role = 'admin'`
   - Access `/admin/orders` to accept/decline orders

### 3. PayPal Sandbox Testing

1. Go to [PayPal Sandbox](https://developer.paypal.com/dashboard/)
2. Create test accounts (Business and Personal)
3. Use test account credentials when testing checkout
4. Ensure `VITE_PAYPAL_CLIENT_ID` uses Sandbox Client ID

## 📁 Project Structure

```
SipFreshNew/
├── src/
│   ├── components/       # Reusable components
│   ├── context/         # React contexts (Cart)
│   ├── hooks/           # Custom hooks (useAuth)
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin panel pages
│   │   └── checkout/    # Checkout page
│   ├── services/        # Firebase services
│   └── utils/           # Utilities (seedData)
├── android/             # Android native project (after `npx cap add android`)
├── capacitor.config.ts  # Capacitor configuration
├── .env.example         # Environment variables template
└── README.md           # This file
```

## 🔐 Security Notes

- **Environment Variables**: Never commit `.env` file
- **Keystore**: Keep keystore files secure and backed up
- **Firebase Rules**: Review and tighten Firestore rules for production
- **PayPal**: Use Sandbox for testing, Live for production

## 🐛 Troubleshooting

### Android Build Issues

**Gradle Sync Failed:**
```bash
cd android
./gradlew clean
npx cap sync android
```

**APK Installation Failed:**
- Enable "Install from Unknown Sources" on device
- Uninstall previous version first

### PayPal Not Loading

- Check `VITE_PAYPAL_CLIENT_ID` is set correctly
- Verify `allowNavigation` in `capacitor.config.ts`
- Check device has internet connection
- Review browser console for errors

### Firebase Connection Issues

- Verify all environment variables are set
- Check Firebase project is active
- Ensure Firestore is enabled in Firebase Console
- Review Firebase Console logs for errors

## 📝 Order Schema

Orders in Firestore follow this schema:

```typescript
{
  userId: string;
  userEmail?: string;
  userName?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  amount: number;        // Mirrored from totalAmount
  paymentId: string;     // PayPal transaction ID
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🚢 Deployment Checklist

- [ ] Replace `.env` placeholders with production values
- [ ] Update PayPal Client ID to Live credentials
- [ ] Review and update Firestore security rules
- [ ] Test checkout flow with real PayPal account
- [ ] Build signed release APK
- [ ] Test APK on physical device
- [ ] Verify all Firebase collections are accessible
- [ ] Test admin panel functionality
- [ ] Document any custom configurations

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Team/Contributors]

---

**Need Help?** Check the [Ionic Documentation](https://ionicframework.com/docs), [Capacitor Documentation](https://capacitorjs.com/docs), and [Firebase Documentation](https://firebase.google.com/docs).

