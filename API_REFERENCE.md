# Manual Upload Web App - API Reference Guide

## 📍 Base URL

### Development
```
http://localhost:5000/api
```

### Production
```
https://your-backend-url/api
```

---

## 🔑 Authentication

### Headers Required for Protected Routes
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### JWT Token Storage (Frontend)
```javascript
// Token stored in localStorage as:
localStorage.getItem('manualUploadToken')

// User data stored as:
localStorage.getItem('manualUploadUser')
```

---

## 👤 Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

**Errors:**
- 400: Missing required fields
- 409: Email already registered

---

### Login User
**POST** `/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "plan": "free",
    "storageLimitMB": 100,
    "usedStorageMB": 25.5
  }
}
```

**Errors:**
- 400: Missing credentials
- 401: Invalid credentials
- 403: Account blocked by admin

---

## 👥 User Profile Endpoints (Protected)

### Get Current User Info
**GET** `/user/me`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "plan": "free",
    "storageLimitMB": 100,
    "usedStorageMB": 25.5
  }
}
```

**Errors:**
- 401: Not authenticated
- 404: User not found

---

### Upgrade to Premium
**PATCH** `/user/upgrade`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:** (none required)

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully upgraded to Premium plan.",
  "data": {
    "plan": "premium",
    "storageLimitMB": 5000
  }
}
```

**Errors:**
- 400: Already on premium plan
- 401: Not authenticated
- 404: User not found

---

## 📁 File Management Endpoints (Protected)

### Upload File
**POST** `/upload`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload (required)

**Supported Types:**
- Images: PNG, JPG, JPEG, GIF, WebP
- Documents: PDF, DOC, DOCX, TXT

**Limits:**
- Max File Size: 10 MB
- Max Total Storage: 100 MB (free) / 5,000 MB (premium)

**Response (201):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "document.pdf",
    "storedName": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6.pdf",
    "fileType": "application/pdf",
    "fileSize": 2048,
    "fileSizeMB": 2.05,
    "filePath": "uploads/a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6.pdf",
    "uploadDate": "2026-06-06T10:30:00.000Z"
  }
}
```

**Errors:**
- 400: No file uploaded / Unsupported file type
- 401: Not authenticated
- 413: Storage limit exceeded

**Storage Error Response (413):**
```json
{
  "success": false,
  "message": "Storage limit exceeded. You have 5.2MB remaining. Upgrade to Premium for more storage."
}
```

---

### Get User's Files
**GET** `/files`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:** (optional)
- `limit`: Number of files (default: all)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "document.pdf",
      "storedName": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6.pdf",
      "fileType": "application/pdf",
      "fileSize": 2048,
      "fileSizeMB": 2.05,
      "filePath": "uploads/a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6.pdf",
      "uploadDate": "2026-06-06T10:30:00.000Z"
    }
  ]
}
```

**Errors:**
- 401: Not authenticated

---

### Get Single File Details
**GET** `/files/:id`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `id`: File ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "document.pdf",
    "storedName": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6.pdf",
    "fileType": "application/pdf",
    "fileSize": 2048,
    "fileSizeMB": 2.05,
    "filePath": "uploads/a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6.pdf",
    "uploadDate": "2026-06-06T10:30:00.000Z"
  }
}
```

**Errors:**
- 401: Not authenticated
- 404: File not found or not owned by user

---

### Download File
**GET** `/download/:id`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `id`: File ID

**Response:**
- 200: File binary data (browser downloads file)
- 401: Not authenticated
- 404: File not found or not owned by user

**Note:** File downloaded with original name (e.g., `document.pdf`)

---

### Delete File
**DELETE** `/files/:id`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `id`: File ID

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully."
}
```

**Note:** 
- File removed from disk
- Metadata removed from database
- Storage refunded to user (usedStorageMB decreased)

**Errors:**
- 401: Not authenticated
- 404: File not found or not owned by user

---

## 👨‍💼 Admin Endpoints (Protected + Admin Role Required)

### Get All Users
**GET** `/admin/users`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "blocked": false,
      "createdAt": "2026-06-01T10:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "blocked": false,
      "createdAt": "2026-05-01T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
- 401: Not authenticated
- 403: Not admin

---

### Block User
**PATCH** `/admin/users/block/:id`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `id`: User ID to block

**Response (200):**
```json
{
  "success": true,
  "message": "User blocked successfully."
}
```

**Note:** Blocked users cannot login

**Errors:**
- 401: Not authenticated
- 403: Not admin
- 404: User not found

---

### Unblock User
**PATCH** `/admin/users/unblock/:id`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `id`: User ID to unblock

**Response (200):**
```json
{
  "success": true,
  "message": "User unblocked successfully."
}
```

**Errors:**
- 401: Not authenticated
- 403: Not admin
- 404: User not found

---

### Delete User
**DELETE** `/admin/users/:id`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `id`: User ID to delete

**Response (200):**
```json
{
  "success": true,
  "message": "User and their files deleted successfully."
}
```

**Note:** 
- User removed from database
- All user's files deleted from disk
- Metadata entries removed

**Errors:**
- 401: Not authenticated
- 403: Not admin
- 404: User not found

---

### Get All Files
**GET** `/admin/files`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "ownerName": "John Doe",
      "originalName": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 2048,
      "uploadDate": "2026-06-06T10:30:00.000Z"
    }
  ]
}
```

**Errors:**
- 401: Not authenticated
- 403: Not admin

---

### Delete File (Admin)
**DELETE** `/admin/files/:id`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `id`: File ID to delete

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully."
}
```

**Note:** Admin can delete any file regardless of ownership

**Errors:**
- 401: Not authenticated
- 403: Not admin
- 404: File not found

---

### Get Admin Statistics
**GET** `/admin/stats`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 42,
    "totalFiles": 1258,
    "totalStorageUsed": 524288000,
    "activeUsers": 35,
    "blockedUsers": 7
  }
}
```

**Notes:**
- `totalStorageUsed`: Total in bytes
- `activeUsers`: Count of non-blocked users
- `blockedUsers`: Count of blocked users

**Errors:**
- 401: Not authenticated
- 403: Not admin

---

## ⚡ HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH, DELETE) |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 409 | Conflict (email already registered) |
| 413 | Payload Too Large (storage exceeded) |
| 500 | Internal Server Error |

---

## 🔄 Request/Response Format

### Standard Response
```json
{
  "success": true/false,
  "message": "Optional message",
  "data": {} or []
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 📝 Example Workflows

### Complete Upload Workflow

```javascript
// 1. Login
POST /auth/login
Request: { email, password }
Response: { token, user }

// 2. Get User Info
GET /user/me
Headers: Authorization: Bearer {token}
Response: { data: { storage, plan, ... } }

// 3. Upload File
POST /upload
Headers: Authorization: Bearer {token}
Body: FormData with file
Response: { data: { fileId, ... } }

// 4. Get Files
GET /files
Headers: Authorization: Bearer {token}
Response: { data: [files] }

// 5. Download File
GET /download/{fileId}
Headers: Authorization: Bearer {token}
Response: File binary
```

### Premium Upgrade Workflow

```javascript
// 1. Check Storage Status
GET /user/me

// 2. Upgrade Plan
PATCH /user/upgrade
Headers: Authorization: Bearer {token}

// 3. Verify Upgrade
GET /user/me
// storageLimitMB now 5000
```

### Admin Management Workflow

```javascript
// 1. Login as Admin
POST /auth/login (admin credentials)

// 2. Get Dashboard Stats
GET /admin/stats

// 3. Get All Users
GET /admin/users

// 4. Block Problematic User
PATCH /admin/users/block/{userId}

// 5. Get All Files
GET /admin/files

// 6. Delete Spam File
DELETE /admin/files/{fileId}
```

---

## 🔐 Security Notes

1. **Token Expiration**: JWT tokens expire after 1 day (configurable)
2. **HTTPS Required**: Always use HTTPS in production
3. **CORS Enabled**: Frontend domain must be whitelisted
4. **Rate Limiting**: Not implemented (add in production)
5. **Password Hashing**: bcryptjs 10 rounds
6. **File Type Validation**: Whitelist only safe types

---

## 📊 Storage Calculations

```javascript
// File size in MB
const fileSizeMB = Math.round(bytes / 1024 / 1024 * 100) / 100;

// Storage percentage
const percentage = (usedMB / limitMB) * 100;

// Remaining storage
const remainingMB = limitMB - usedMB;
```

---

## 🚀 Production Checklist

- ✅ Change JWT_SECRET to strong random value
- ✅ Set NODE_ENV=production
- ✅ Enable HTTPS on frontend and backend
- ✅ Whitelist frontend domain in CORS
- ✅ Set up database backups
- ✅ Monitor error logs
- ✅ Test all endpoints with production credentials
- ✅ Set up SSL certificates
- ✅ Configure CDN for static files

---

**Last Updated**: June 2026
**API Version**: 1.0
**Status**: Production Ready
