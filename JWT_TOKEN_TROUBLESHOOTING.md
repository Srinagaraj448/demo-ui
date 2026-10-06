# JWT Token Troubleshooting Guide

## 🚨 **Current Error**
```
Response data: {
  message: 'Not authorised to access resources', 
  success: false, 
  errorCode: 'INVALIDTOKEN'
}
```

## 🔍 **Problem Analysis**

The `errorCode: 'INVALIDTOKEN'` indicates that the **JWT token itself is invalid**, not just an authorization issue. This means the backend middleware `verifySuperAdminAuthorization` is failing at the JWT verification step.

## 🧪 **Debugging Steps**

### **Step 1: Check Token in Browser Console**
After refreshing the page and navigating to Customers, check the console for:

```
Access token available: true
Token length: [some number]
Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization header value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Step 2: Check localStorage**
Open DevTools → Application → Local Storage:
```
accessToken: [your-jwt-token]
userEmail: [your-email]
userId: [your-user-id]
userType: [should-be-super-admin]
```

### **Step 3: Decode JWT Token**
1. Copy your `accessToken` from localStorage
2. Go to [jwt.io](https://jwt.io)
3. Paste the token and check the payload

**Expected JWT Payload**:
```json
{
  "userId": "your-user-id",
  "email": "your-email",
  "userType": "super-admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 🚨 **Common JWT Token Issues**

### **Issue 1: Token Format**
**Problem**: Token doesn't start with `eyJ`
**Solution**: Check if token is properly stored in localStorage

### **Issue 2: Token Expired**
**Problem**: `exp` timestamp is in the past
**Solution**: Login again to get fresh token

### **Issue 3: Token Malformed**
**Problem**: Token is truncated or corrupted
**Solution**: Clear localStorage and login again

### **Issue 4: Missing Bearer Prefix**
**Problem**: Backend expects `Bearer <token>` but gets just `<token>`
**Solution**: Check `getAuthHeaders()` method

### **Issue 5: Wrong Secret Key**
**Problem**: Backend uses different secret key than token was signed with
**Solution**: Check backend `ACCESS_SECRET_KEY` configuration

## 🔧 **Frontend Token Validation**

Let me add a token validation function to help debug:

```typescript
// Add this to your apiService.ts
private validateToken(token: string): boolean {
  try {
    // Check if token exists and has proper format
    if (!token || !token.startsWith('eyJ')) {
      console.error('Invalid token format');
      return false;
    }
    
    // Check token length (should be reasonable)
    if (token.length < 50) {
      console.error('Token too short:', token.length);
      return false;
    }
    
    // Try to decode token (basic validation)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT structure');
      return false;
    }
    
    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    console.log('JWT Payload:', payload);
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.error('Token expired');
      return false;
    }
    
    // Check required fields
    if (!payload.userId || !payload.email || !payload.userType) {
      console.error('Missing required fields in token');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}
```

## 🎯 **Quick Fixes**

### **Fix 1: Clear and Relogin**
```javascript
// In browser console
localStorage.clear();
// Then login again
```

### **Fix 2: Check Token Storage**
```javascript
// In browser console
console.log('accessToken:', localStorage.getItem('accessToken'));
console.log('userType:', localStorage.getItem('userType'));
```

### **Fix 3: Verify Backend Configuration**
Check your backend:
1. **JWT secret key** is correct
2. **Token expiration** settings
3. **Required payload fields** are included

## 📋 **Debug Checklist**

- [ ] **Token exists** in localStorage
- [ ] **Token format** is valid (starts with eyJ)
- [ ] **Token length** is reasonable (>50 characters)
- [ ] **JWT structure** has 3 parts (header.payload.signature)
- [ ] **Token payload** contains required fields
- [ ] **Token not expired** (exp > current time)
- [ ] **Authorization header** includes "Bearer " prefix
- [ ] **Backend secret key** matches token signature

## 🚀 **Expected Console Output**

After fixes, you should see:
```
Access token available: true
Token length: 123
Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization header value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Making request to: http://localhost:4001/pm/customer/all_customers
Request headers: {Content-Type: "application/json", Authorization: "Bearer eyJ..."}
Request method: GET
```

## 🔮 **If Token Issues Persist**

1. **Check backend logs** for JWT verification errors
2. **Verify JWT library** version and configuration
3. **Test with Postman** using the same token
4. **Check if other endpoints** work with the same token
5. **Verify token generation** in login process

The `INVALIDTOKEN` error should be resolved once the JWT token is properly formatted, not expired, and contains all required fields. 