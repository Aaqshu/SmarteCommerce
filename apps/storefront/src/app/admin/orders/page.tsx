'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchOrders, updateOrderStatus, createInvoiceForOrder, downloadInvoicePDF, type Order, type Invoice } from '@/lib/api';
import { formatINR } from '@/lib/utils';

const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'rto',
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  packed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  returned: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  rto: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [invoices, setInvoices] = useState<Record<string, Invoice>>({});
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [creatingInvoice, setCreatingInvoice] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await fetchOrders(statusFilter || undefined);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      await updateOrderStatus(orderId, newStatus);
      // Update local state
      setOrders(prev =>
        prev.map(order =>
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  }

  async function handleCreateInvoice(orderId: string) {
    setCreatingInvoice(prev => ({ ...prev, [orderId]: true }));
    try {
      const invoice = await createInvoiceForOrder(orderId);
      setInvoices(prev => ({ ...prev, [orderId]: invoice }));
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setCreatingInvoice(prev => ({ ...prev, [orderId]: false }));
    }
  }

  function handleDownloadPDF(invoiceId: string) {
    downloadInvoicePDF(invoiceId);
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-5xl font-serif font-bold text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
            Orders
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {loading ? 'Loading...' : `${orders.length} orders`}
        </p>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="">All Orders</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="elegant-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-100 dark:bg-stone-900 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  GST Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--color-foreground)]">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {order.orderId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">
                      {formatDate(order.createdOn)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">
                      <div>{order.paymentMethod.toUpperCase()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{order.paymentStatus}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">
                      {order.gstType}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--color-foreground)]">
                      {formatINR(order.grandTotal)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-y-2">
                      <div>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                          disabled={updatingStatus[order.orderId]}
                          className="px-2 py-1 text-xs border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        {invoices[order.orderId] ? (
                          <div className="text-xs">
                            <div className="text-gray-600 dark:text-gray-400">
                              Invoice: {invoices[order.orderId].invoiceNo}
                            </div>
                            <button
                              onClick={() => handleDownloadPDF(invoices[order.orderId].invoiceId)}
                              className="text-[var(--color-accent)] hover:underline font-medium mt-1"
                            >
                              Download PDF
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCreateInvoice(order.orderId)}
                            disabled={creatingInvoice[order.orderId]}
                            className="text-[var(--color-accent)] hover:underline font-medium disabled:opacity-50"
                          >
                            {creatingInvoice[order.orderId] ? 'Creating...' : 'Create Invoice'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/admin" className="text-[var(--color-accent)] hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
