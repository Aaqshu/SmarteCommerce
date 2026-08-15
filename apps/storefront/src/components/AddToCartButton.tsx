'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart-context';

export function AddToCartButton({ productId, stock }: { productId: string; stock: number }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (stock === 0) {
    return (
      <button className="btn-primary flex-1" disabled>
        Out of Stock
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn-primary flex-1"
      onClick={() => {
        addItem(productId);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? '✓ Added to Cart' : 'Add to Cart'}
    </button>
  );
}
