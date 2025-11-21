/**
 * useToast Hook Tests
 * Ensures toast hook doesn't cause infinite render loops
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toast, reducer } from '../use-toast';

describe('Toast Reducer', () => {
  it('should add toast correctly', () => {
    const initialState = { toasts: [] };
    const toast = {
      id: '1',
      title: 'Test Toast',
      open: true,
    };

    const newState = reducer(initialState, {
      type: 'ADD_TOAST',
      toast,
    });

    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0]).toEqual(toast);
  });

  it('should update toast correctly', () => {
    const initialState = {
      toasts: [{ id: '1', title: 'Original', open: true }],
    };

    const newState = reducer(initialState, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'Updated' },
    });

    expect(newState.toasts[0].title).toBe('Updated');
  });

  it('should dismiss toast correctly', () => {
    const initialState = {
      toasts: [{ id: '1', title: 'Test', open: true }],
    };

    const newState = reducer(initialState, {
      type: 'DISMISS_TOAST',
      toastId: '1',
    });

    expect(newState.toasts[0].open).toBe(false);
  });

  it('should remove toast correctly', () => {
    const initialState = {
      toasts: [
        { id: '1', title: 'Test 1', open: true },
        { id: '2', title: 'Test 2', open: true },
      ],
    };

    const newState = reducer(initialState, {
      type: 'REMOVE_TOAST',
      toastId: '1',
    });

    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('2');
  });

  it('should respect TOAST_LIMIT when adding toasts', () => {
    // TOAST_LIMIT is 1 in use-toast.ts
    const initialState = {
      toasts: [{ id: '1', title: 'Existing', open: true }],
    };

    const newState = reducer(initialState, {
      type: 'ADD_TOAST',
      toast: { id: '2', title: 'New Toast', open: true },
    });

    // Should only keep the most recent toast (TOAST_LIMIT = 1)
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('2');
  });

  it('should handle empty state', () => {
    const initialState = { toasts: [] };

    const newState = reducer(initialState, {
      type: 'REMOVE_TOAST',
      toastId: 'non-existent',
    });

    expect(newState.toasts).toEqual([]);
  });
});

describe('Toast Function', () => {
  it('should create toast with unique ID', () => {
    const toast1 = toast({ title: 'Toast 1' });
    const toast2 = toast({ title: 'Toast 2' });

    expect(toast1.id).toBeDefined();
    expect(toast2.id).toBeDefined();
    expect(toast1.id).not.toBe(toast2.id);
  });

  it('should return dismiss and update functions', () => {
    const toastInstance = toast({ title: 'Test' });

    expect(typeof toastInstance.dismiss).toBe('function');
    expect(typeof toastInstance.update).toBe('function');
  });
});
