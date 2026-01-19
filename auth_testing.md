# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var visitorId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: visitorId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: visitorId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + visitorId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
curl -X GET "https://swissride.preview.emergentagent.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test protected endpoints
curl -X GET "https://swissride.preview.emergentagent.com/api/rides/user/YOUR_USER_ID" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing
```javascript
// Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "swissride-mvp.preview.emergentagent.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
}]);
```

## Checklist
- [ ] User document has `user_id` field (custom ID, not MongoDB's _id)
- [ ] Session `user_id` matches `users.user_id` exactly
- [ ] All queries exclude `_id` with `{"_id": 0}`
- [ ] Pydantic models use `user_id: str` (no aliases needed)
- [ ] API returns user data (not 401/404)
- [ ] App loads main screen (not login page)

## Success Indicators
- `/api/auth/me` returns user data with `user_id` field
- Main screen loads without redirect
- CRUD operations work
