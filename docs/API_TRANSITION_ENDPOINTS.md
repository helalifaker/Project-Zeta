# Transition Period API Endpoints Reference

Quick reference guide for transition period (2025-2027) management API endpoints.

## Base URL

All endpoints are under `/api/admin/transition`

## Authentication

All endpoints require:

- Valid session (authentication)
- ADMIN role (authorization)

## Endpoints

### 1. GET /api/admin/transition

Get complete transition configuration (settings + all years).

**Request:**

```bash
GET /api/admin/transition
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "settings": {
      "capacityCap": 1850,
      "rentAdjustmentPercent": 10.0
    },
    "yearData": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "year": 2025,
        "targetEnrollment": 1850,
        "staffCostBase": "8500000.00",
        "notes": "Full capacity - year 1",
        "createdAt": "2025-11-20T12:00:00Z",
        "updatedAt": "2025-11-20T12:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "year": 2026,
        "targetEnrollment": 1850,
        "staffCostBase": "9000000.00",
        "notes": "Full capacity - year 2",
        "createdAt": "2025-11-20T12:00:00Z",
        "updatedAt": "2025-11-20T12:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "year": 2027,
        "targetEnrollment": 1850,
        "staffCostBase": "9500000.00",
        "notes": "Full capacity - year 3",
        "createdAt": "2025-11-20T12:00:00Z",
        "updatedAt": "2025-11-20T12:00:00Z"
      }
    ]
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not ADMIN role
- `500 Internal Server Error` - Server error

---

### 2. PUT /api/admin/transition/settings

Update global transition settings.

**Request:**

```bash
PUT /api/admin/transition/settings
Content-Type: application/json
Authorization: Bearer <token>

{
  "capacityCap": 1850,
  "rentAdjustmentPercent": 10.0
}
```

**Request Body Schema:**

```typescript
{
  capacityCap?: number;              // Optional, positive integer
  rentAdjustmentPercent?: number;    // Optional, -100 to 100
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "capacityCap": 1850,
    "rentAdjustmentPercent": 10.0
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input (validation error)
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not ADMIN role
- `500 Internal Server Error` - Server error

**Validation Rules:**

- `capacityCap`: Must be positive integer, reasonable max is 5000
- `rentAdjustmentPercent`: Range -100 to 100 (e.g., 10 = +10%, -5 = -5%)

---

### 3. PUT /api/admin/transition/year/:year

Update specific transition year data.

**Request:**

```bash
PUT /api/admin/transition/year/2025
Content-Type: application/json
Authorization: Bearer <token>

{
  "targetEnrollment": 1850,
  "staffCostBase": 8500000,
  "notes": "Updated capacity"
}
```

**Path Parameters:**

- `year` - Transition year (2025, 2026, or 2027)

**Request Body Schema:**

```typescript
{
  targetEnrollment?: number;    // Optional, positive integer
  staffCostBase?: number;       // Optional, positive number
  notes?: string;               // Optional, max 500 characters
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "year": 2025,
    "targetEnrollment": 1850,
    "staffCostBase": "8500000.00",
    "notes": "Updated capacity",
    "createdAt": "2025-11-20T12:00:00Z",
    "updatedAt": "2025-11-20T13:00:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input or year out of range
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not ADMIN role
- `404 Not Found` - Year data doesn't exist
- `500 Internal Server Error` - Server error

**Validation Rules:**

- `year`: Must be 2025, 2026, or 2027
- `targetEnrollment`: Must be positive integer
- `staffCostBase`: Must be positive number
- `notes`: Max 500 characters

---

### 4. POST /api/admin/transition/recalculate

Recalculate all transition year staff costs from 2028 baseline.

**Formula:** `staffCost(year) = base2028 / (1 + cpiRate)^(2028 - year)`

**Request:**

```bash
POST /api/admin/transition/recalculate
Content-Type: application/json
Authorization: Bearer <token>

{
  "base2028StaffCost": 10000000,
  "cpiRate": 0.03
}
```

**Request Body Schema:**

```typescript
{
  base2028StaffCost: number; // Required, positive number (e.g., 10000000)
  cpiRate: number; // Required, 0 to 1 (e.g., 0.03 for 3%)
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "year": 2025,
      "targetEnrollment": 1850,
      "staffCostBase": "9151416.99",
      "notes": "Full capacity - year 1",
      "createdAt": "2025-11-20T12:00:00Z",
      "updatedAt": "2025-11-20T14:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "year": 2026,
      "targetEnrollment": 1850,
      "staffCostBase": "9425958.99",
      "notes": "Full capacity - year 2",
      "createdAt": "2025-11-20T12:00:00Z",
      "updatedAt": "2025-11-20T14:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "year": 2027,
      "targetEnrollment": 1850,
      "staffCostBase": "9708737.86",
      "notes": "Full capacity - year 3",
      "createdAt": "2025-11-20T12:00:00Z",
      "updatedAt": "2025-11-20T14:00:00Z"
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input (validation error)
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not ADMIN role
- `500 Internal Server Error` - Server error

**Validation Rules:**

- `base2028StaffCost`: Must be positive number
- `cpiRate`: Must be between 0 and 1 (e.g., 0.03 for 3%)

**Calculation Example:**

```
Given:
- base2028StaffCost = 10,000,000
- cpiRate = 0.03 (3%)

Results:
- 2025: 10,000,000 / (1.03^3) = 9,151,416.99
- 2026: 10,000,000 / (1.03^2) = 9,425,958.99
- 2027: 10,000,000 / (1.03^1) = 9,708,737.86
```

---

## Common Error Responses

All endpoints may return these common errors:

### Unauthorized (401)

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Forbidden (403)

```json
{
  "success": false,
  "error": "Admin access required"
}
```

### Bad Request (400)

```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "capacityCap": {
      "_errors": ["Expected number, received string"]
    }
  }
}
```

### Internal Server Error (500)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Frontend Integration Examples

### React Hook Example

```typescript
// hooks/useTransitionConfig.ts
import { useState, useEffect } from 'react';

interface TransitionConfig {
  settings: {
    capacityCap: number;
    rentAdjustmentPercent: number;
  };
  yearData: Array<{
    id: string;
    year: number;
    targetEnrollment: number;
    staffCostBase: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export function useTransitionConfig() {
  const [data, setData] = useState<TransitionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch('/api/admin/transition');
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch transition config');
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { data, loading, error };
}
```

### Update Settings Example

```typescript
async function updateTransitionSettings(capacityCap: number, rentAdjustmentPercent: number) {
  const response = await fetch('/api/admin/transition/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capacityCap, rentAdjustmentPercent }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}
```

### Recalculate Staff Costs Example

```typescript
async function recalculateStaffCosts(base2028StaffCost: number, cpiRate: number) {
  const response = await fetch('/api/admin/transition/recalculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base2028StaffCost, cpiRate }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

// Usage
await recalculateStaffCosts(10000000, 0.03);
```

---

## Testing with cURL

### Get Config

```bash
curl -X GET http://localhost:3000/api/admin/transition \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Settings

```bash
curl -X PUT http://localhost:3000/api/admin/transition/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"capacityCap":1850,"rentAdjustmentPercent":10.0}'
```

### Update Year

```bash
curl -X PUT http://localhost:3000/api/admin/transition/year/2025 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"targetEnrollment":1850,"staffCostBase":8500000,"notes":"Updated"}'
```

### Recalculate

```bash
curl -X POST http://localhost:3000/api/admin/transition/recalculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"base2028StaffCost":10000000,"cpiRate":0.03}'
```

---

## Notes

1. **Decimal.js Precision**: All financial values (staffCostBase, rentAdjustmentPercent) use Decimal.js internally for precision
2. **Audit Logging**: All mutations are logged in `audit_logs` table
3. **Transactions**: Multi-record updates use database transactions for atomicity
4. **Validation**: Input validation happens at multiple levels (Zod, business logic, database)
5. **Authorization**: Only ADMIN users can access these endpoints
6. **Rate Limits**: Consider implementing rate limiting for production use

---

**Last Updated:** 2025-11-20
**API Version:** 1.0
