/**
 * User Management Component
 * Table view of all users with CRUD operations
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settings-store';
import { UserFormDialog } from './UserFormDialog';
import { Plus, Search, Loader2, Edit, Trash2 } from 'lucide-react';
import type { UserWithMetadata } from '@/services/admin/users';
import { Role } from '@prisma/client';

export function UserManagement() {
  const {
    users,
    usersTotal,
    usersPage,
    usersLimit,
    usersLoading,
    usersError,
    usersFilters,
    fetchUsers,
    deleteUser,
  } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState(usersFilters.search || '');
  const [roleFilter, setRoleFilter] = useState<string>(usersFilters.role || 'all');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithMetadata | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Load users on mount
  useEffect(() => {
    fetchUsers({ page: 1, limit: usersLimit });
  }, [fetchUsers, usersLimit]);

  const handleSearch = () => {
    const filters: {
      search?: string;
      role?: string;
      page: number;
      limit: number;
    } = {
      page: 1,
      limit: usersLimit,
    };
    if (searchQuery) filters.search = searchQuery;
    if (roleFilter && roleFilter !== 'all') filters.role = roleFilter;
    fetchUsers(filters);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeletingUserId(userId);
    const success = await deleteUser(userId);
    setDeletingUserId(null);

    if (!success) {
      alert('Failed to delete user');
    }
  };

  const handleEdit = (user: UserWithMetadata) => {
    setEditingUser(user);
    setUserDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setUserDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'PLANNER':
        return 'default';
      case 'VIEWER':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage users, roles, and permissions. Total: {usersTotal} users
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="PLANNER">Planner</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        {usersError && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
            {usersError}
          </div>
        )}

        {/* Users Table */}
        {usersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>{user.versionsCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {usersTotal > usersLimit && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((usersPage - 1) * usersLimit) + 1} to {Math.min(usersPage * usersLimit, usersTotal)} of {usersTotal} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers({ ...usersFilters, page: usersPage - 1, limit: usersLimit })}
                disabled={usersPage === 1 || usersLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers({ ...usersFilters, page: usersPage + 1, limit: usersLimit })}
                disabled={usersPage * usersLimit >= usersTotal || usersLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* User Form Dialog */}
        <UserFormDialog
          open={userDialogOpen}
          onOpenChange={setUserDialogOpen}
          user={editingUser}
          onSuccess={() => {
            setUserDialogOpen(false);
            setEditingUser(null);
            fetchUsers({ ...usersFilters, page: usersPage, limit: usersLimit });
          }}
        />
      </CardContent>
    </Card>
  );
}

