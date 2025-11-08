# Admin Panel Setup Guide

This guide explains how to set up and use the admin panel for the SipFresh application.

## 🎯 Features

The admin panel provides:
- **Dashboard**: Overview of total users, products, orders, and pending orders
- **Products Management**: CRUD operations for products
- **Orders Management**: View and manage orders (Accept/Decline)
- **Users Management**: View and manage users (Change roles)

## 🔐 Setting Up Admin Access

### Step 1: Create an Admin User

1. **Sign up/Login** through the app using Google or Email
2. **Go to Firestore Console** (https://console.firebase.google.com)
3. **Navigate to Firestore Database** → `users` collection
4. **Find your user document** (by UID or email)
5. **Update the `role` field** to `"admin"`

Alternatively, you can use the Users Management page in the admin panel (if you already have admin access) to change a user's role.

### Step 2: Access Admin Panel

1. **Login** to the app with your admin account
2. **Open the side menu**
3. **Click on "Admin Panel"** (this option only appears for admin users)
4. You'll be redirected to `/admin/dashboard`

## 📊 Admin Panel Routes

- `/admin` or `/admin/dashboard` - Dashboard with statistics
- `/admin/products` - Products management (CRUD)
- `/admin/orders` - Orders management (Accept/Decline)
- `/admin/users` - Users management (Change roles)

## 🌱 Seeding Demo Data

### Option 1: Browser Console

1. Open the app in your browser
2. Open Developer Console (F12)
3. Run the following command:
   ```javascript
   // Import the seed function (if using modules)
   // Or use the global function if available
   seedFirebaseData()
   ```

### Option 2: Admin Page (Future Feature)

A "Seed Data" button can be added to the Dashboard for easy data seeding.

### Option 3: Manual Seeding

Use the admin panel to manually create products, or use Firebase Console to add data directly.

## 🔒 Security Rules

The Firestore security rules have been configured to:
- Allow users to read their own data
- Allow admins to read/write all data
- Restrict order updates to admins only
- Allow users to create their own orders

Deploy the rules using:
```bash
firebase deploy --only firestore:rules
```

## 📝 Admin Functions

### Products Management
- **Create**: Click the "+" button (bottom right) → Fill form → Save
- **Update**: Click the edit icon on a product → Modify → Save
- **Delete**: Click the delete icon on a product → Confirm

### Orders Management
- **View**: All orders are displayed with status badges
- **Filter**: Use the segment buttons to filter by status
- **Accept/Decline**: Click "Accept" or "Decline" buttons on pending orders

### Users Management
- **View**: All users are displayed with their roles
- **Filter**: Use the segment buttons to filter by role
- **Change Role**: Use the dropdown to change a user's role (admin/user)

## 🚀 Deployment

1. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Build and Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## ⚠️ Important Notes

1. **Role Assignment**: The first admin must be created manually through Firestore Console
2. **Security**: Always deploy Firestore rules before going to production
3. **Testing**: Test all admin functions in a development environment first
4. **Backup**: Consider backing up your Firestore data before seeding

## 🐛 Troubleshooting

### Admin Panel Not Showing
- Check if your user has `role: "admin"` in Firestore
- Refresh the page after changing your role
- Check browser console for errors

### Cannot Access Admin Routes
- Ensure you're logged in
- Verify your role is set to "admin"
- Check Firestore rules are deployed correctly

### Seeding Fails
- Check Firebase configuration in `.env` file
- Ensure you have write permissions
- Check browser console for error messages

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Ionic React Documentation](https://ionicframework.com/docs/react)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

