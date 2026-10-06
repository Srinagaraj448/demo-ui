# Authorization Troubleshooting Guide

## 🚨 **Current Error**
```
error: "Not authorised to access resources"
success: false
```

## 🔍 **Problem Analysis**

The API endpoint `/pm/customer/all_customers` is working (you're getting a response), but the user doesn't have the required **super-admin** permissions.

### **Backend Requirements**
```javascript
// customer.route.js
router.get('/all_customers', verifySuperAdminAuthorization, customerController.getAllCustomers);

// superadmin_auth.js middleware
const isAuthorized = payload.userType === 'super-admin';
```

**Required**: JWT token with `userType: 'super-admin'`

## ✅ **What We've Fixed**

1. **Added User Type Support** to AuthContext
2. **Enhanced User Interface** to show authorization status
3. **Added Debug Logging** to track user permissions
4. **Updated User Storage** to include userType

## 🧪 **Testing Steps**

### **Step 1: Check User Authorization Status**
1. **Navigate to Customers page**
2. **Look at the header** - you should see:
   - User email
   - User type (should show "super-admin")
   - Authorization status (should show "✅ Authorized")

### **Step 2: Check Browser Console**
You should see logs like:
```
Starting to load customers...
Current user: {userId: "...", email: "...", userType: "super-admin"}
Is super admin: true
User type: super-admin
```

### **Step 3: Check localStorage**
Open DevTools → Application → Local Storage:
```
accessToken: "your-jwt-token"
userEmail: "your-email"
userId: "your-user-id"
userType: "super-admin"  ← This should exist and be "super-admin"
```

## 🚨 **If Still Getting Authorization Error**

### **Issue 1: User Type Not Set**
**Symptoms**: `userType: undefined` or missing from localStorage
**Solution**: 
1. **Logout** and **login again**
2. **Check backend login response** includes `userType`
3. **Verify JWT payload** contains user type

### **Issue 2: Wrong User Type**
**Symptoms**: `userType: "user"` or something other than "super-admin"
**Solution**:
1. **Check backend user database** - ensure user has super-admin role
2. **Verify JWT token** contains correct user type
3. **Check user creation/role assignment** in backend

### **Issue 3: JWT Token Expired/Invalid**
**Symptoms**: 401 errors or token validation failures
**Solution**:
1. **Check token expiration** in JWT payload
2. **Verify token signature** is valid
3. **Check backend ACCESS_SECRET_KEY** configuration

## 🔧 **Backend Verification Steps**

### **1. Check User Database**
```sql
-- Check if your user has super-admin role
SELECT id, email, userType FROM users WHERE email = 'your-email@domain.com';
```

**Expected Result**: `userType` should be `'super-admin'`

### **2. Check JWT Token Payload**
Decode your JWT token at [jwt.io](https://jwt.io) and verify:
```json
{
  "userId": "your-user-id",
  "email": "your-email",
  "userType": "super-admin",  ← Must be this exact value
  "iat": 1234567890,
  "exp": 1234567890
}
```

### **3. Check Backend Middleware**
Verify `verifySuperAdminAuthorization` middleware is working:
```javascript
// Add logging to superadmin_auth.js
console.log('JWT Payload:', payload);
console.log('User Type:', payload.userType);
console.log('Is Authorized:', payload.userType === 'super-admin');
```

## 🎯 **Quick Fixes**

### **Fix 1: Update User Role in Database**
```sql
UPDATE users 
SET userType = 'super-admin' 
WHERE email = 'your-email@domain.com';
```

### **Fix 2: Regenerate JWT Token**
1. **Logout** from frontend
2. **Update user role** in backend database
3. **Login again** to get new JWT token

### **Fix 3: Check Backend Configuration**
Verify backend has correct user type handling:
```javascript
// In your login controller
const userData = {
  userId: user.id,
  email: user.email,
  name: user.name,
  userType: user.userType  // Make sure this is included
};
```

## 📋 **Debug Checklist**

- [ ] **User logged in** and has valid JWT token
- [ ] **JWT token contains** `userType: 'super-admin'`
- [ ] **Backend database** has user with super-admin role
- [ ] **Frontend stores** userType in localStorage
- [ ] **AuthContext shows** `isSuperAdmin: true`
- [ ] **UI displays** "✅ Authorized" status
- [ ] **Console logs** show correct user type
- [ ] **Backend middleware** receives correct user type

## 🚀 **Expected Result After Fix**

1. **UI shows**: "✅ Authorized" status
2. **Console shows**: `Is super admin: true`
3. **API call succeeds**: 200 OK response
4. **Customers table**: Populated with data

## 🔮 **If All Else Fails**

1. **Check backend logs** for detailed error messages
2. **Verify database connection** and user data
3. **Test endpoint directly** with Postman/curl
4. **Check if other super-admin endpoints** work
5. **Verify JWT secret key** configuration

The authorization issue should be resolved once the user has the correct `userType: 'super-admin'` in both the database and JWT token. 