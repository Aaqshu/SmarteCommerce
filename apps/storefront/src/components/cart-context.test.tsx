// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { CartProvider, useCart } from './cart-context';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe('CartContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
  });

  it('addItem adds a new item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('p1'));
    expect(result.current.items).toEqual([{ productId: 'p1', quantity: 1 }]);
    expect(result.current.totalItems).toBe(1);
  });

  it('addItem increments quantity for existing item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('p1'));
    act(() => result.current.addItem('p1'));
    expect(result.current.items).toEqual([{ productId: 'p1', quantity: 2 }]);
    expect(result.current.totalItems).toBe(2);
  });

  it('updateQuantity changes quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('p1'));
    act(() => result.current.updateQuantity('p1', 5));
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalItems).toBe(5);
  });

  it('updateQuantity to 0 removes the item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('p1'));
    act(() => result.current.updateQuantity('p1', 0));
    expect(result.current.items).toEqual([]);
  });

  it('removeItem removes the item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('p1'));
    act(() => result.current.addItem('p2'));
    act(() => result.current.removeItem('p1'));
    expect(result.current.items).toEqual([{ productId: 'p2', quantity: 1 }]);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('p1'));
    const stored = JSON.parse(window.localStorage.getItem('jainab_cart_v1') ?? '[]');
    expect(stored).toEqual([{ productId: 'p1', quantity: 1 }]);
  });

  it('clearCart empties the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem('p1'));
    act(() => result.current.clearCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
  });
});
