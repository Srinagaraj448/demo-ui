# Debugging Customer API Issue

## Problem
Getting error while hitting `/customer/all_customers` route from the `getAllCustomers` function in `Customers.tsx`.

## What We've Fixed

### 1. **Route Configuration** ✅
- **Before**: Frontend was calling `/customer/all_customers` (double prefix issue)
- **After**: Frontend now calls `/pm/customer/all_customers` (full path, matches backend exactly)

### 2. **Added Debug Logging** ✅
- Added console logs to track API calls
- Added detailed request/response logging
- Added error handling with specific error messages

## Debugging Steps

### Step 1: Check Browser Console
Open your browser's Developer Tools (F12) and look at the Console tab. You should see logs like:

```
Starting to load customers...
Calling getAllCustomers with endpoint: /pm/customer/all_customers
Full URL: http://localhost:4001/pm/customer/all_customers
Expected backend route: /pm/customer/all_customers
Access token available: true
Making request to: http://localhost:4001/pm/customer/all_customers
Request headers: {Content-Type: "application/json", Authorization: "Bearer <token>"}
Request method: GET
```

### Step 2: Check Network Tab
In the Network tab, look for the request to `/customer/all_customers`:
- **Request URL**: Should be `http://localhost:4001/pm/customer/all_customers` ✅
- **Request Method**: Should be `GET`
- **Request Headers**: Should include `Authorization: Bearer <token>`
- **Response Status**: Check if it's 200, 401, 403, 404, or 500

### Step 3: Common Issues & Solutions

#### Issue 1: 401 Unauthorized
**Symptoms**: Response status 401, "INVALIDTOKEN" error
**Cause**: User not authenticated or token expired
**Solution**: 
- Check if user is logged in
- Check if `accessToken` exists in localStorage
- Try logging out and logging back in

#### Issue 2: 403 Forbidden
**Symptoms**: Response status 403, "chutiyua" error
**Cause**: User not authorized as super-admin
**Solution**: 
- Verify user has `userType: 'super-admin'` in JWT payload
- Check backend middleware `verifySuperAdminAuthorization`

#### Issue 3: 404 Not Found
**Symptoms**: Response status 404
**Cause**: Route not found
**Solution**: 
- Verify backend route is mounted at `/pm/customer`
- Check if `express-app.js` has `app.use('/pm/customer', customerRouter)`

#### Issue 4: 500 Internal Server Error
**Symptoms**: Response status 500
**Cause**: Backend error in `customerController.getAllCustomers`
**Solution**: 
- Check backend server logs
- Verify database connection
- Check if `customerController.getAllCustomers` exists

## Backend Route Verification

Your backend should have these routes:

```javascript
// In customer.route.js
router.get('/all_customers', verifySuperAdminAuthorization, customerController.getAllCustomers);

// In express-app.js
app.use('/pm/customer', customerRouter);
```

## Frontend Configuration

Your frontend is now configured to call:
```typescript
// In environment.ts
CUSTOMER_SEARCH: '/pm/customer/all_customers'

// This results in: BASE_URL + '/pm/customer/all_customers'
// Example: http://localhost:4001/pm/customer/all_customers
```

## Testing Steps

1. **Login** as a super-admin user
2. **Navigate** to the Customers page
3. **Check console** for debug logs
4. **Check network tab** for the API request
5. **Verify response** status and data

## Expected Response Format

The API should return:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1",
        "companyName": "Company A",
        "cust_name": "Customer A",
        "adminEmail": "admin@companya.com",
        "startDate": "2024-01-01",
        "duration": 12,
        "customerStatus": "active",
        "packageList": [...]
      }
    ]
  }
}
```

## If Still Having Issues

1. **Check backend logs** for any errors
2. **Verify database** connection and data
3. **Test the endpoint** directly with Postman/curl
4. **Check JWT token** payload for user type
5. **Verify middleware** chain is working correctly

## Quick Test with curl

```bash
# Replace <your-token> with actual access token
curl -X GET "http://localhost:4001/pm/customer/all_customers" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json"
```

This should help you identify and resolve the issue with the customer API endpoint. 