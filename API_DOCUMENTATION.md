# API Documentation - K-Cloud Storage

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://api.k-cloud-storage.com`

## Interactive Documentation
Visit `/api-docs` for interactive Swagger UI documentation.

## Authentication
All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_logto_access_token>
```

## Endpoints

### Authentication

#### GET /api/auth/user
Get the current authenticated user's profile.

**Headers:**
- `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": "uuid",
  "logtoUserId": "string",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "age": 25,
  "gender": "male",
  "picture": "https://...",
  "storageQuota": 10737418240,
  "storageUsed": 1234567,
  "storageUsagePercentage": 0.01,
  "role": "user",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response 404:**
```json
{
  "error": "User not found",
  "message": "Please complete your profile",
  "logtoUserId": "string",
  "email": "user@example.com"
}
```

---

#### POST /api/auth/user
Create a new user profile (first-time login).

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "user@example.com",  // Optional if from token
  "age": 25,                     // Optional
  "gender": "male"               // Optional: male, female, other, prefer_not_to_say
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "logtoUserId": "string",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "age": 25,
  "gender": "male",
  "picture": null,
  "storageQuota": 10737418240,
  "storageUsed": 0,
  "storageUsagePercentage": 0,
  "role": "user",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response 400:**
```json
{
  "error": "Validation failed",
  "message": "Name and phone are required fields",
  "fields": {
    "name": "Name is required",
    "phone": "Phone is required"
  }
}
```

**Response 409:**
```json
{
  "error": "User already exists",
  "message": "User profile already created",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

---

#### PUT /api/auth/user
Update the current user's profile.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+0987654321",
  "age": 26,
  "gender": "other"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "logtoUserId": "string",
  "email": "user@example.com",
  "name": "John Updated",
  "phone": "+0987654321",
  "age": 26,
  "gender": "other",
  "picture": null,
  "storageQuota": 10737418240,
  "storageUsed": 1234567,
  "storageUsagePercentage": 0.01,
  "role": "user",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

#### GET /api/auth/storage
Get storage statistics for the current user.

**Headers:**
- `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "quota": 10737418240,
  "used": 1234567,
  "available": 10736183673,
  "usagePercentage": 0.01
}
```

---

### Health Check

#### GET /health
Check if the API is running.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "fields": {
    "fieldName": "Error message"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No access token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Resource already exists"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **API Routes**: 100 requests per 15 minutes
- **Auth Routes**: 5 requests per 15 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when the limit resets

---

## Data Models

### User
```typescript
{
  id: string (UUID)
  logtoUserId: string
  email: string
  name: string | null
  phone: string | null
  age: number | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  picture: string | null
  storageQuota: number (bytes, default: 10GB)
  storageUsed: number (bytes, default: 0)
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}
```

### Storage Stats
```typescript
{
  quota: number (bytes)
  used: number (bytes)
  available: number (bytes)
  usagePercentage: number (0-100)
}
```

---

## Testing with cURL

### Get User Profile
```bash
curl -X GET http://localhost:3000/api/auth/user \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create User Profile
```bash
curl -X POST http://localhost:3000/api/auth/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "age": 25,
    "gender": "male"
  }'
```

### Update User Profile
```bash
curl -X PUT http://localhost:3000/api/auth/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "age": 26
  }'
```

### Get Storage Stats
```bash
curl -X GET http://localhost:3000/api/auth/storage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Changelog

### v1.0.0 (Week 1)
- User authentication with Logto
- User profile management (CRUD)
- Storage quota tracking
- Role-based access control
- API documentation with Swagger

---

## Support

For issues or questions, please contact: support@k-cloud-storage.com
