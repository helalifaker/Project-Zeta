/**
 * Test user fixtures for E2E tests
 */

export const testUsers = {
  admin: {
    email: 'admin@projectzeta.test',
    password: 'TestPassword123!',
    role: 'ADMIN',
  },
  planner: {
    email: 'planner@projectzeta.test',
    password: 'TestPassword123!',
    role: 'PLANNER',
  },
  viewer: {
    email: 'viewer@projectzeta.test',
    password: 'TestPassword123!',
    role: 'VIEWER',
  },
} as const;

export type TestUser = (typeof testUsers)[keyof typeof testUsers];
