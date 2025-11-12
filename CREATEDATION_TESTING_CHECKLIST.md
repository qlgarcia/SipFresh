# CreatedAt Timestamp Fix - Testing Checklist

## Pre-Testing Verification
- [ ] Run `npx tsc --noEmit` - expect: **no errors** ✓
- [ ] Dev server running: `npm run dev`

## Test 1: Order Creation with Timestamp
**Location**: Checkout flow  
**Steps**:
1. Navigate to Products page
2. Add a product to cart
3. Go to Cart, proceed to Checkout
4. Complete PayPal payment
5. Verify redirect to `/order-success`

**Expected**: Order created in Firestore with valid `createdAt` timestamp

---

## Test 2: Admin Orders View
**Location**: `/admin` → Orders Management  
**Steps**:
1. Open Orders Management
2. Check recently created order in list
3. Verify date displays (not "N/A")
4. Click "View Items" to expand details

**Expected Output**:
- Order date shows: `MM/DD/YYYY HH:MM:SS AM/PM`
- Not "N/A"
- Status badge visible (pending/accepted/declined/completed)

---

## Test 3: Sorting Functions
**Location**: Orders Management page  
**Steps**:
1. Verify sort dropdown shows: "Newest First", "Oldest First", "Highest Amount", "Lowest Amount"
2. Select "Newest First" (default)
   - Should show recently created orders first
3. Select "Oldest First"
   - Should reverse order
4. Select "Highest Amount"
   - Should sort by totalAmount descending
5. Select "Lowest Amount"
   - Should sort by totalAmount ascending
6. Change status filter (All → Pending → etc.)
   - Sorting should persist with filter

**Expected**: Orders properly sorted by selected criterion

---

## Test 4: Status Filtering with Sorting
**Location**: Orders Management page  
**Steps**:
1. Select "Newest First" sort
2. Filter by "Pending" status
3. Verify only pending orders show, newest first
4. Change to "Oldest First"
5. Verify same pending orders now show oldest first

**Expected**: Filtering and sorting work together correctly

---

## Test 5: User Profile Orders
**Location**: `/profile` → "Your Orders" section  
**Steps**:
1. Create a new order (checkout flow)
2. Go to Profile page
3. Scroll to "Your Orders" section
4. Verify newly created order appears
5. Check that date is displayed (not "N/A")
6. Create another order
7. Verify new order appears first (newest first sorting)

**Expected Output**:
- Orders listed newest first
- Each order shows:
  - Order ID (first 8 chars)
  - Date: `MM/DD/YYYY HH:MM:SS AM/PM`
  - Status: (e.g., PENDING)
  - Item count
  - Total amount

---

## Test 6: Firestore Verification
**Location**: Firebase Console → Firestore → orders collection  
**Steps**:
1. Open Firestore Console
2. Navigate to `orders` collection
3. Click on most recently created order document
4. Verify fields:
   - [ ] `createdAt` field exists
   - [ ] `createdAt` type is "Timestamp" (not empty, not string)
   - [ ] `createdAt` shows actual date/time (not "N/A" or empty)
   - [ ] `updatedAt` field exists (also Timestamp)

**Expected**: Both timestamp fields are proper Firestore Timestamps

---

## Test 7: Backward Compatibility
**Location**: Orders Management (admin page)  
**Steps**:
1. Filter or view any old orders (created before this fix)
2. Verify they still display (even if createdAt shows "N/A")
3. App should not crash
4. Sorting/filtering should still work

**Expected**: No errors, graceful fallback to "N/A" for missing timestamps

---

## Test 8: Mobile/Android Build (If Available)
**Steps**:
1. Build Android APK: `npx cap build android`
2. Open app on device/emulator
3. Perform checkout (Test 1)
4. Navigate to Profile (Test 5)
5. Verify timestamps display correctly

**Expected**: Same behavior as web version

---

## Debugging Tips
If timestamps still show "N/A":

1. **Check browser console** (F12):
   ```
   console.debug("createOrder - raw payload:", ...)
   console.debug("createOrder - cleaned payload:", ...)
   ```
   - Look for `serverTimestamp()` sentinel in cleaned payload

2. **Check Firestore Rules**:
   ```firestore
   match /orders/{orderId} {
     allow create: if request.auth != null && 
                    request.auth.uid == request.resource.data.userId;
   }
   ```
   - Ensure authenticated user can create orders

3. **Check order creation error logs**:
   ```
   console.error("Error creating order:", error);
   ```

4. **Verify Firebase SDK version**:
   - `package.json` should have: `"firebase": "^12.4.0"`

---

## Post-Fix Validation Checklist
- [ ] TypeScript compilation: **PASS** (no errors)
- [ ] Order creation flow works
- [ ] Timestamps save to Firestore
- [ ] Admin Orders page shows dates correctly
- [ ] User Profile page shows dates correctly
- [ ] Sorting functions work
- [ ] Filtering + sorting work together
- [ ] No console errors
- [ ] Mobile build (if applicable) works

---

## Summary
**What was fixed**: `cleanFirestoreData()` function now preserves Firestore's `serverTimestamp()` sentinel  
**Impact**: Orders now have valid `createdAt` timestamps saved to Firestore  
**User-facing benefit**: No more "N/A" dates, proper order history with sorting
