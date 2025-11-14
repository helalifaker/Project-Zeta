/**
 * User Form Dialog Component
 * Create/Edit user form in a dialog
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settings-store';
import { Loader2 } from 'lucide-react';
import type { UserWithMetadata } from '@/services/admin/users';
import { Role } from '@prisma/client';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithMetadata | null;
  onSuccess: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const { createUser, updateUser, usersLoading } = useSettingsStore();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'VIEWER' as Role,
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!user;

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          email: user.email,
          name: user.name || '',
          role: user.role,
          password: '', // Don't pre-fill password
        });
      } else {
        setFormData({
          email: '',
          name: '',
          role: 'VIEWER',
          password: '',
        });
      }
      setError(null);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let success = false;
      if (isEditing) {
        // Update user (password optional)
        const updateData: {
          email?: string;
          name?: string;
          role?: Role;
          password?: string;
        } = {
          name: formData.name,
          role: formData.role,
        };

        if (formData.email !== user.email) {
          updateData.email = formData.email;
        }
        if (formData.password) {
          updateData.password = formData.password;
        }

        success = await updateUser(user.id, updateData);
      } else {
        // Create user (password required)
        if (!formData.password) {
          setError('Password is required for new users');
          setSaving(false);
          return;
        }
        success = await createUser({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          password: formData.password,
        });
      }

      if (success) {
        onSuccess();
      } else {
        setError('Failed to save user');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update user information and role. Leave password blank to keep current password.'
              : 'Create a new user account with email, name, role, and password.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isEditing} // Don't allow email changes for now
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as Role })}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="PLANNER">Planner</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!isEditing}
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? 'Leave blank to keep current password. Minimum 8 characters if changing.'
                : 'Minimum 8 characters'}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || usersLoading}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditing ? 'Update User' : 'Create User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

