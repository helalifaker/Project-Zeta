# Project Zeta - API Documentation
## RESTful API Endpoints

**Version:** 1.0  
**Last Updated:** November 13, 2025  
**Base URL (Development):** `http://localhost:3000/api`  
**Base URL (Production):** `https://projectzeta.yourcompany.com/api`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Versions API](#versions-api)
3. [Curriculum API](#curriculum-api)
4. [Rent Plans API](#rent-plans-api)
5. [Reports API](#reports-api)
6. [Admin API](#admin-api)
7. [Health Check API](#health-check-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

### Overview

All API endpoints (except `/api/health` and `/api/auth/*`) require authentication.

**Authentication Method:** Session-based (NextAuth.js with JWT)

**How to Authenticate:**
1. Sign in via `/api/auth/signin`
2. Session cookie automatically set
3. Include cookie in subsequent requests

**Authorization:**
- **ADMIN:** Full access (create, read, update, delete, lock)
- **PLANNER:** Create, read, update (cannot delete or lock)
- **VIEWER:** Read-only access

---

## Versions API

### 1. List Versions

**Endpoint:** `GET /api/versions`

**Description:** Retrieve all versions with pagination and filtering

**Authentication:** Required (ADMIN, PLANNER, VIEWER)

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 20 | Results per page (max: 100) |
| `status` | string | No | all | Filter by status: `DRAFT`, `READY`, `APPROVED`, `LOCKED`, `all` |
| `mode` | string | No | all | Filter by mode: `RELOCATION_2028`, `HISTORICAL_BASELINE`, `all` |
| `search` | string | No | - | Search in name and description |
| `sortBy` | string | No | createdAt | Sort by: `name`, `createdAt`, `updatedAt` |
| `sortOrder` | string | No | desc | Sort order: `asc`, `desc` |

**Request Example:**

```bash
curl -X GET "http://localhost:3000/api/versions?page=1&limit=20&status=DRAFT&sortBy=createdAt&sortOrder=desc" \
  -H "Cookie: next-auth.session-token=..."
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "V1 - Partner Model 4.5% Yield",
        "description": "Base scenario with PartnerModel rent",
        "mode": "RELOCATION_2028",
        "status": "DRAFT",
        "createdBy": "user123",
        "createdByName": "John Doe",
        "createdAt": "2025-11-13T10:00:00Z",
        "updatedAt": "2025-11-13T15:30:00Z",
        "rentModel": "PARTNER_MODEL",
        "npvRent": 45000000.00,
        "avgEBITDAMargin": 15.5,
        "avgRentLoad": 35.2
      },
      // ... more versions
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `400 Bad Request` - Invalid query parameters
- `500 Internal Server Error` - Server error

---

### 2. Get Version by ID

**Endpoint:** `GET /api/versions/{id}`

**Description:** Retrieve detailed information for a specific version

**Authentication:** Required (ADMIN, PLANNER, VIEWER)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Version ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `includeCalculations` | boolean | No | false | Include full 30-year projection |

**Request Example:**

```bash
curl -X GET "http://localhost:3000/api/versions/550e8400-e29b-41d4-a716-446655440000?includeCalculations=true" \
  -H "Cookie: next-auth.session-token=..."
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "V1 - Partner Model 4.5% Yield",
    "description": "Base scenario with PartnerModel rent",
    "mode": "RELOCATION_2028",
    "status": "DRAFT",
    "createdBy": "user123",
    "createdByName": "John Doe",
    "createdAt": "2025-11-13T10:00:00Z",
    "updatedAt": "2025-11-13T15:30:00Z",
    "basedOnId": null,
    "basedOnName": null,
    
    "curriculumPlans": [
      {
        "id": "cp-fr-001",
        "curriculumType": "FR",
        "capacity": 400,
        "tuitionBase": 50000.00,
        "cpiFrequency": 2,
        "studentsProjection": [
          {"year": 2028, "students": 300},
          {"year": 2029, "students": 350},
          {"year": 2030, "students": 380},
          {"year": 2031, "students": 395},
          {"year": 2032, "students": 400},
          // ... more years
        ]
      },
      {
        "id": "cp-ib-001",
        "curriculumType": "IB",
        "capacity": 200,
        "tuitionBase": 60000.00,
        "cpiFrequency": 2,
        "studentsProjection": [
          {"year": 2028, "students": 30},
          {"year": 2029, "students": 60},
          {"year": 2030, "students": 100},
          {"year": 2031, "students": 150},
          {"year": 2032, "students": 200},
          // ... more years
        ]
      }
    ],
    
    "rentPlan": {
      "id": "rp-001",
      "rentModel": "PARTNER_MODEL",
      "parameters": {
        "landSize": 10000,
        "landPricePerSqm": 5000,
        "buaSize": 8000,
        "constructionCostPerSqm": 3000,
        "yieldBase": 0.045
      }
    },
    
    "capexItems": [
      {
        "id": "capex-001",
        "year": 2028,
        "category": "BUILDING",
        "amount": 10000000.00,
        "description": "New campus construction"
      },
      {
        "id": "capex-002",
        "year": 2030,
        "category": "TECHNOLOGY",
        "amount": 2000000.00,
        "description": "IT infrastructure upgrade"
      }
    ],
    
    "opexSubAccounts": [
      {
        "id": "opex-001",
        "subAccountName": "Marketing",
        "percentOfRevenue": 3.0,
        "isFixed": false,
        "fixedAmount": null
      },
      {
        "id": "opex-002",
        "subAccountName": "Utilities",
        "percentOfRevenue": null,
        "isFixed": true,
        "fixedAmount": 200000.00
      }
    ],
    
    "calculations": {
      "npvRent": 45000000.00,
      "npvCashFlow": 120000000.00,
      "avgEBITDAMargin": 15.5,
      "avgRentLoad": 35.2,
      "breakevenYear": 2030,
      "projectionYears": [
        {
          "year": 2028,
          "tuitionFR": 50000.00,
          "tuitionIB": 60000.00,
          "studentsFR": 300,
          "studentsIB": 30,
          "utilizationFR": 75.0,
          "utilizationIB": 15.0,
          "revenue": 16800000.00,
          "rent": 3330000.00,
          "rentLoad": 19.8,
          "staffCost": 5000000.00,
          "opex": 2000000.00,
          "capex": 10000000.00,
          "ebitda": 6470000.00,
          "ebitdaMargin": 38.5,
          "cashFlow": -5530000.00
        },
        // ... more years (30 total)
      ]
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Version not found
- `500 Internal Server Error` - Server error

---

### 3. Create Version

**Endpoint:** `POST /api/versions`

**Description:** Create a new version

**Authentication:** Required (ADMIN, PLANNER)

**Request Body:**

```json
{
  "name": "V2 - Fixed Escalation 4%",
  "description": "Alternative scenario with FixedEscalation rent",
  "mode": "RELOCATION_2028",
  "basedOnId": "550e8400-e29b-41d4-a716-446655440000",
  
  "curriculumPlans": [
    {
      "curriculumType": "FR",
      "capacity": 400,
      "tuitionBase": 50000.00,
      "cpiFrequency": 2,
      "studentsProjection": [
        {"year": 2028, "students": 300},
        {"year": 2029, "students": 350},
        // ... all 30 years (2023-2052)
      ]
    },
    {
      "curriculumType": "IB",
      "capacity": 200,
      "tuitionBase": 60000.00,
      "cpiFrequency": 2,
      "studentsProjection": [
        {"year": 2028, "students": 30},
        {"year": 2029, "students": 60},
        // ... all 30 years
      ]
    }
  ],
  
  "rentPlan": {
    "rentModel": "FIXED_ESCALATION",
    "parameters": {
      "baseRent": 5000000.00,
      "escalationRate": 0.04
    }
  },
  
  "capexItems": [
    {
      "year": 2028,
      "category": "BUILDING",
      "amount": 10000000.00,
      "description": "New campus construction"
    }
  ],
  
  "opexSubAccounts": [
    {
      "subAccountName": "Marketing",
      "percentOfRevenue": 3.0,
      "isFixed": false
    },
    {
      "subAccountName": "Utilities",
      "percentOfRevenue": null,
      "isFixed": true,
      "fixedAmount": 200000.00
    }
  ],
  
  "staffing": {
    "baseCost": 8000000.00,
    "cpiFrequency": 2
  },
  
  "adminSettings": {
    "cpiRate": 0.03,
    "discountRate": 0.08,
    "taxRate": 0.15
  }
}
```

**Request Example:**

```bash
curl -X POST "http://localhost:3000/api/versions" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d @version-create.json
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "V2 - Fixed Escalation 4%",
    "status": "DRAFT",
    "createdAt": "2025-11-13T16:00:00Z",
    "message": "Version created successfully"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions (VIEWER role)
- `400 Bad Request` - Validation error
- `500 Internal Server Error` - Server error

**Validation Errors (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": ["Name must be at least 3 characters"],
    "curriculumPlans": ["Must provide exactly 2 curriculum plans (FR and IB)"],
    "rentPlan.parameters.escalationRate": ["Must be between 0 and 1"]
  }
}
```

---

### 4. Update Version

**Endpoint:** `PATCH /api/versions/{id}`

**Description:** Update an existing version (only DRAFT or READY status)

**Authentication:** Required (ADMIN, PLANNER)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Version ID |

**Request Body:** (Partial update, provide only fields to update)

```json
{
  "name": "V2 - Fixed Escalation 4% (Updated)",
  "description": "Updated description",
  "curriculumPlans": [
    {
      "id": "cp-fr-001",
      "tuitionBase": 55000.00
    }
  ],
  "rentPlan": {
    "id": "rp-001",
    "parameters": {
      "escalationRate": 0.045
    }
  }
}
```

**Request Example:**

```bash
curl -X PATCH "http://localhost:3000/api/versions/660e8400-e29b-41d4-a716-446655440001" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d @version-update.json
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "updatedAt": "2025-11-13T17:00:00Z",
    "message": "Version updated successfully"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions or version is LOCKED
- `404 Not Found` - Version not found
- `400 Bad Request` - Validation error
- `500 Internal Server Error` - Server error

---

### 5. Delete Version

**Endpoint:** `DELETE /api/versions/{id}`

**Description:** Delete a version (soft delete, preserves audit logs)

**Authentication:** Required (ADMIN only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Version ID |

**Request Example:**

```bash
curl -X DELETE "http://localhost:3000/api/versions/660e8400-e29b-41d4-a716-446655440001" \
  -H "Cookie: next-auth.session-token=..."
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "deletedAt": "2025-11-13T18:00:00Z",
    "message": "Version deleted successfully"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions (not ADMIN)
- `404 Not Found` - Version not found
- `409 Conflict` - Cannot delete LOCKED version
- `500 Internal Server Error` - Server error

---

### 6. Duplicate Version

**Endpoint:** `POST /api/versions/{id}/duplicate`

**Description:** Create a copy of an existing version

**Authentication:** Required (ADMIN, PLANNER)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Version ID to duplicate |

**Request Body:**

```json
{
  "name": "V3 - Copy of V2",
  "description": "Duplicate for testing"
}
```

**Request Example:**

```bash
curl -X POST "http://localhost:3000/api/versions/660e8400-e29b-41d4-a716-446655440001/duplicate" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"name":"V3 - Copy of V2","description":"Duplicate for testing"}'
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "V3 - Copy of V2",
    "status": "DRAFT",
    "basedOnId": "660e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2025-11-13T19:00:00Z",
    "message": "Version duplicated successfully"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Version not found
- `400 Bad Request` - Validation error (name already exists)
- `500 Internal Server Error` - Server error

---

### 7. Lock Version

**Endpoint:** `POST /api/versions/{id}/lock`

**Description:** Lock a version (change status to LOCKED, prevent further edits)

**Authentication:** Required (ADMIN only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Version ID |

**Request Body:**

```json
{
  "reason": "Approved by board on 2025-11-13"
}
```

**Request Example:**

```bash
curl -X POST "http://localhost:3000/api/versions/660e8400-e29b-41d4-a716-446655440001/lock" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"reason":"Approved by board on 2025-11-13"}'
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "LOCKED",
    "lockedAt": "2025-11-13T20:00:00Z",
    "lockedBy": "admin@company.com",
    "lockReason": "Approved by board on 2025-11-13",
    "message": "Version locked successfully"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions (not ADMIN)
- `404 Not Found` - Version not found
- `409 Conflict` - Version already locked
- `500 Internal Server Error` - Server error

---

### 8. Compare Versions

**Endpoint:** `POST /api/versions/compare`

**Description:** Compare 2-4 versions side-by-side

**Authentication:** Required (ADMIN, PLANNER, VIEWER)

**Request Body:**

```json
{
  "versionIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001",
    "770e8400-e29b-41d4-a716-446655440002"
  ],
  "metrics": ["npvRent", "avgEBITDAMargin", "avgRentLoad", "breakevenYear"]
}
```

**Request Example:**

```bash
curl -X POST "http://localhost:3000/api/versions/compare" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d @compare-request.json
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "comparison": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "V1 - Partner Model 4.5%",
        "rentModel": "PARTNER_MODEL",
        "npvRent": 45000000.00,
        "avgEBITDAMargin": 15.5,
        "avgRentLoad": 35.2,
        "breakevenYear": 2030
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "V2 - Fixed Escalation 4%",
        "rentModel": "FIXED_ESCALATION",
        "npvRent": 48000000.00,
        "avgEBITDAMargin": 14.2,
        "avgRentLoad": 37.5,
        "breakevenYear": 2031
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "V3 - Revenue Share 8%",
        "rentModel": "REVENUE_SHARE",
        "npvRent": 52000000.00,
        "avgEBITDAMargin": 12.8,
        "avgRentLoad": 40.1,
        "breakevenYear": 2032
      }
    ],
    "best": {
      "npvRent": "V1 - Partner Model 4.5%",
      "avgEBITDAMargin": "V1 - Partner Model 4.5%",
      "avgRentLoad": "V1 - Partner Model 4.5%",
      "breakevenYear": "V1 - Partner Model 4.5%"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `400 Bad Request` - Invalid request (must provide 2-4 version IDs)
- `404 Not Found` - One or more versions not found
- `500 Internal Server Error` - Server error

---

## Reports API

### 9. Generate Report

**Endpoint:** `POST /api/reports/generate/{versionId}`

**Description:** Generate PDF or Excel report for a version

**Authentication:** Required (ADMIN, PLANNER, VIEWER)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `versionId` | string (UUID) | Yes | Version ID |

**Request Body:**

```json
{
  "reportType": "EXECUTIVE_SUMMARY",
  "format": "PDF",
  "includeCharts": true,
  "includeYearByYear": false
}
```

**Report Types:**
- `EXECUTIVE_SUMMARY` - 2-3 pages, key metrics and charts
- `FINANCIAL_DETAIL` - 10-15 pages, all metrics, all charts, year-by-year table
- `COMPARISON` - Compare multiple versions (requires `compareWithIds` array)

**Formats:**
- `PDF` - Professional PDF report
- `EXCEL` - Excel workbook with multiple sheets

**Request Example:**

```bash
curl -X POST "http://localhost:3000/api/reports/generate/660e8400-e29b-41d4-a716-446655440001" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"reportType":"EXECUTIVE_SUMMARY","format":"PDF","includeCharts":true}'
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "reportId": "rpt-001",
    "downloadUrl": "https://projectzeta.vercel.app/_next/reports/rpt-001.pdf",
    "expiresAt": "2025-11-14T20:00:00Z",
    "generatedAt": "2025-11-13T20:00:00Z",
    "fileSize": 2048576,
    "message": "Report generated successfully"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Version not found
- `400 Bad Request` - Invalid report type or format
- `500 Internal Server Error` - Report generation failed

---

### 10. List Reports

**Endpoint:** `GET /api/reports`

**Description:** List all generated reports

**Authentication:** Required (ADMIN, PLANNER, VIEWER)

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Results per page |
| `versionId` | string | No | - | Filter by version ID |

**Request Example:**

```bash
curl -X GET "http://localhost:3000/api/reports?page=1&limit=20" \
  -H "Cookie: next-auth.session-token=..."
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "rpt-001",
        "versionId": "660e8400-e29b-41d4-a716-446655440001",
        "versionName": "V2 - Fixed Escalation 4%",
        "reportType": "EXECUTIVE_SUMMARY",
        "format": "PDF",
        "generatedBy": "user123",
        "generatedAt": "2025-11-13T20:00:00Z",
        "downloadUrl": "https://projectzeta.vercel.app/_next/reports/rpt-001.pdf",
        "expiresAt": "2025-11-14T20:00:00Z",
        "fileSize": 2048576
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

## Admin API

### 11. Get Admin Settings

**Endpoint:** `GET /api/admin/settings`

**Description:** Get global admin settings

**Authentication:** Required (ADMIN only)

**Request Example:**

```bash
curl -X GET "http://localhost:3000/api/admin/settings" \
  -H "Cookie: next-auth.session-token=..."
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "cpiRate": 0.03,
    "discountRate": 0.08,
    "taxRate": 0.15,
    "currency": "SAR",
    "timezone": "Asia/Riyadh",
    "dateFormat": "DD/MM/YYYY",
    "numberFormat": "1,000,000"
  }
}
```

---

### 12. Update Admin Settings

**Endpoint:** `PATCH /api/admin/settings`

**Description:** Update global admin settings

**Authentication:** Required (ADMIN only)

**Request Body:**

```json
{
  "cpiRate": 0.035,
  "discountRate": 0.09
}
```

**Request Example:**

```bash
curl -X PATCH "http://localhost:3000/api/admin/settings" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"cpiRate":0.035,"discountRate":0.09}'
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "cpiRate": 0.035,
    "discountRate": 0.09,
    "updatedAt": "2025-11-13T21:00:00Z",
    "message": "Settings updated successfully"
  }
}
```

---

### 13. List Users

**Endpoint:** `GET /api/admin/users`

**Description:** List all users

**Authentication:** Required (ADMIN only)

**Request Example:**

```bash
curl -X GET "http://localhost:3000/api/admin/users" \
  -H "Cookie: next-auth.session-token=..."
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user123",
        "email": "admin@company.com",
        "name": "Admin User",
        "role": "ADMIN",
        "createdAt": "2025-01-01T00:00:00Z",
        "lastLoginAt": "2025-11-13T10:00:00Z"
      },
      {
        "id": "user456",
        "email": "planner@company.com",
        "name": "Finance Planner",
        "role": "PLANNER",
        "createdAt": "2025-01-15T00:00:00Z",
        "lastLoginAt": "2025-11-13T15:00:00Z"
      }
    ]
  }
}
```

---

### 14. Update User Role

**Endpoint:** `PATCH /api/admin/users/{userId}`

**Description:** Update user role

**Authentication:** Required (ADMIN only)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID |

**Request Body:**

```json
{
  "role": "PLANNER"
}
```

**Request Example:**

```bash
curl -X PATCH "http://localhost:3000/api/admin/users/user456" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"role":"PLANNER"}'
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "user456",
    "role": "PLANNER",
    "updatedAt": "2025-11-13T22:00:00Z",
    "message": "User role updated successfully"
  }
}
```

---

### 15. Get Audit Logs

**Endpoint:** `GET /api/admin/audit-logs`

**Description:** Get audit logs with filtering

**Authentication:** Required (ADMIN only)

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 50 | Results per page |
| `action` | string | No | - | Filter by action (e.g., `CREATE_VERSION`) |
| `userId` | string | No | - | Filter by user ID |
| `entityType` | string | No | - | Filter by entity type |
| `startDate` | string | No | - | Filter from date (ISO 8601) |
| `endDate` | string | No | - | Filter to date (ISO 8601) |

**Request Example:**

```bash
curl -X GET "http://localhost:3000/api/admin/audit-logs?action=CREATE_VERSION&limit=50" \
  -H "Cookie: next-auth.session-token=..."
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "audit-001",
        "action": "CREATE_VERSION",
        "userId": "user123",
        "userName": "Admin User",
        "entityType": "VERSION",
        "entityId": "660e8400-e29b-41d4-a716-446655440001",
        "metadata": {
          "versionName": "V2 - Fixed Escalation 4%"
        },
        "timestamp": "2025-11-13T16:00:00Z",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 120,
      "totalPages": 3
    }
  }
}
```

---

## Health Check API

### 16. Health Check

**Endpoint:** `GET /api/health`

**Description:** Check API and database health

**Authentication:** Not required (public)

**Request Example:**

```bash
curl -X GET "http://localhost:3000/api/health"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-13T23:00:00Z",
    "uptime": 86400,
    "database": {
      "status": "connected",
      "responseTime": 15
    },
    "version": "1.0.0",
    "environment": "production"
  }
}
```

**Response (503 Service Unavailable):**

```json
{
  "success": false,
  "error": "Service unhealthy",
  "data": {
    "status": "unhealthy",
    "database": {
      "status": "disconnected",
      "error": "Connection timeout"
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    // Optional: Additional error details
  }
}
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request (validation error) |
| 401 | Unauthorized | Not authenticated (missing or invalid session) |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate name) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed (Zod) |
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict (duplicate name, locked version) |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |
| `DATABASE_ERROR` | Database operation failed |
| `CALCULATION_ERROR` | Financial calculation failed |

### Error Examples

**Validation Error (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": ["Name must be at least 3 characters"],
    "curriculumPlans": ["Must provide exactly 2 curriculum plans"],
    "rentPlan.parameters.escalationRate": ["Must be between 0 and 1"]
  }
}
```

**Unauthorized (401):**

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Forbidden (403):**

```json
{
  "success": false,
  "error": "Insufficient permissions. ADMIN role required.",
  "code": "FORBIDDEN"
}
```

**Not Found (404):**

```json
{
  "success": false,
  "error": "Version not found",
  "code": "NOT_FOUND",
  "details": {
    "versionId": "invalid-id"
  }
}
```

**Conflict (409):**

```json
{
  "success": false,
  "error": "Version name already exists",
  "code": "CONFLICT",
  "details": {
    "field": "name",
    "value": "V1 - Partner Model 4.5%"
  }
}
```

**Rate Limit (429):**

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again in 60 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 60
  }
}
```

---

## Rate Limiting

### Default Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| GET requests | 100 requests | 1 minute |
| POST/PATCH/DELETE | 30 requests | 1 minute |
| Report generation | 5 requests | 1 minute |
| Auth endpoints | 10 requests | 5 minutes |

### Rate Limit Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699996800
```

### Exceeding Rate Limit

When rate limit is exceeded, API returns `429 Too Many Requests`:

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again in 60 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 60,
    "limit": 100,
    "window": 60
  }
}
```

---

## Authentication Examples

### Sign In

```bash
# Sign in with email/password
curl -X POST "http://localhost:3000/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"secure-password"}'

# Response sets session cookie (next-auth.session-token)
# Use this cookie in subsequent requests
```

### Sign Out

```bash
curl -X POST "http://localhost:3000/api/auth/signout" \
  -H "Cookie: next-auth.session-token=..."
```

### Check Session

```bash
curl -X GET "http://localhost:3000/api/auth/session" \
  -H "Cookie: next-auth.session-token=..."

# Response:
{
  "user": {
    "id": "user123",
    "email": "admin@company.com",
    "name": "Admin User",
    "role": "ADMIN"
  },
  "expires": "2025-11-20T00:00:00Z"
}
```

---

## Performance Expectations

| Endpoint | Target | Measurement |
|----------|--------|-------------|
| `GET /api/versions` | <200ms | p95 response time |
| `GET /api/versions/{id}` | <300ms | p95 response time |
| `POST /api/versions` | <500ms | p95 response time |
| `GET /api/versions/{id}?includeCalculations=true` | <1000ms | p95 (includes 30-year calculation) |
| `POST /api/reports/generate/{versionId}` | <5000ms | p95 (PDF generation) |
| `POST /api/versions/compare` | <800ms | p95 (compare 3 versions) |

---

## API Versioning

**Current Version:** v1 (implicit, no version in URL)

**Future Versions:** If breaking changes needed, use `/api/v2/...`

**Deprecation Policy:**
- 6 months notice before deprecation
- Legacy endpoints supported for 12 months
- Migration guide provided

---

## Testing the API

### Using cURL

```bash
# Set session token as variable
TOKEN="your-session-token-here"

# List versions
curl -X GET "http://localhost:3000/api/versions" \
  -H "Cookie: next-auth.session-token=$TOKEN"

# Create version
curl -X POST "http://localhost:3000/api/versions" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$TOKEN" \
  -d @version-create.json
```

### Using Postman

1. Import OpenAPI spec (if available)
2. Set environment variable: `baseUrl = http://localhost:3000/api`
3. Set authentication: Cookie `next-auth.session-token`
4. Test endpoints

### Using Automated Tests

See `DELIVERY_PLAN.md` Phase 9 for integration test examples.

---

## Support & Feedback

- **Issues:** Report bugs in GitHub Issues
- **Questions:** Ask in Slack channel #project-zeta
- **API Changes:** Subscribe to API changelog

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Next Review:** After Phase 2 completion  
**Maintained By:** Dev Team

