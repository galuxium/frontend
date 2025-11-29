"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Download,
  ArrowUpRight,
  BarChart2,
  Clock,
  FileText,
  RefreshCcw,
  ShieldCheck,
  Database,
} from "lucide-react";

/* ============================
   Strict Types
   ============================ */

export type PlanTier = "free" | "pro" | "business" | "enterprise";

export interface BillingInfo {
  plan: PlanTier;
  nextBillingDate?: string; // ISO date
  usageThisPeriodTokens: number;
  usageLimitTokens?: number | null; // null = unlimited
  currency: string; // "USD"
  estimatedCostUSD?: number;
}

export interface UsagePoint {
  date: string; // ISO date (YYYY-MM-DD)
  tokens: number;
}

export interface Invoice {
  id: string;
  createdAt: string; // ISO
  amountUSD: number;
  pdfUrl?: string;
  status: "paid" | "pending" | "failed";
  periodStart?: string;
  periodEnd?: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

/* ============================
   Stubbed API functions (typed)
   Replace these with real fetch calls.
   ============================ */

async function fetchBillingInfo(): Promise<BillingInfo> {
  // TODO: replace with `await fetch('/api/billing/info')`
  return {
    plan: "pro",
    nextBillingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    usageThisPeriodTokens: 123456,
    usageLimitTokens: 500000,
    currency: "USD",
    estimatedCostUSD: 61.728,
  };
}

async function fetchUsageSeries(): Promise<UsagePoint[]> {
  // TODO: replace with real data. Return last 30 days.
  const points: UsagePoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({
      date: d.toISOString().slice(0, 10),
      tokens: Math.round(2000 + Math.random() * 20000),
    });
  }
  return points;
}

async function fetchInvoices(): Promise<Invoice[]> {
  return [
    {
      id: "inv_2025_001",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      amountUSD: 24.5,
      pdfUrl: "/invoices/inv_2025_001.pdf",
      status: "paid",
      periodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      periodEnd: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    },
    {
      id: "inv_2025_002",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      amountUSD: 37.12,
      pdfUrl: "/invoices/inv_2025_002.pdf",
      status: "paid",
      periodStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
      periodEnd: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    },
  ];
}

async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  return [
    { id: "pm_1", brand: "visa", last4: "4242", expMonth: 12, expYear: 2026, isDefault: true },
    { id: "pm_2", brand: "mastercard", last4: "4444", expMonth: 9, expYear: 2027, isDefault: false },
  ];
}

async function apiExportUsageCSV(points: UsagePoint[]): Promise<Blob> {
  const header = "date,tokens\n";
  const rows = points.map((p) => `${p.date},${p.tokens}`).join("\n");
  return new Blob([header + rows], { type: "text/csv" });
}

/* ============================
   Small Helper Components
   ============================ */

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
      <div className="text-xs text-neutral-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-neutral-400 mt-1">{subtitle}</div>}
    </div>
  );
}

/* Small line chart using SVG (no external libs) */
function UsageChart({ points }: { points: UsagePoint[] }) {
  // normalize to 0..1
  const values = points.map((p) => p.tokens);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const width = 600;
  const height = 160;
  const pad = 10;
  const stepX = (width - pad * 2) / Math.max(points.length - 1, 1);

  const toXY = (i: number) => {
    const x = pad + i * stepX;
    const v = values[i];
    const y = pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
    return [x, y];
  };

  const pathD = points.map((_, i) => {
    const [x, y] = toXY(i);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="160" className="rounded">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* area */}
      <path d={`${pathD} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z`} fill="url(#g1)" stroke="none" />

      {/* line */}
      <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* dots */}
      {points.map((p, i) => {
        const [x, y] = toXY(i);
        return <circle key={p.date} cx={x} cy={y} r={2.5} fill="#7c3aed" />;
      })}
    </svg>
  );
}

/* ============================
   Main Billing Page Component
   ============================ */

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [usage, setUsage] = useState<UsagePoint[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [b, u, inv, pm] = await Promise.all([
          fetchBillingInfo(),
          fetchUsageSeries(),
          fetchInvoices(),
          fetchPaymentMethods(),
        ]);
        if (!mounted) return;
        setBilling(b);
        setUsage(u);
        setInvoices(inv);
        setPayments(pm);
      } catch (err) {
        console.error("Billing load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const usageTotal = useMemo(() => usage.reduce((s, p) => s + p.tokens, 0), [usage]);

  const handleExportCSV = async () => {
    const blob = await apiExportUsageCSV(usage);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadInvoice = (inv: Invoice) => {
    if (inv.pdfUrl) {
      window.open(inv.pdfUrl, "_blank");
    } else {
      alert("Invoice download not available for this invoice.");
    }
  };

  const handleSetDefaultPayment = async (id: string) => {
    setSaving(true);
    try {
      // TODO: call API to set default payment
      setPayments((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePayment = async (id: string) => {
    if (!confirm("Remove this payment method?")) return;
    // TODO: call API
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpgrade = async () => {
    // open billing portal / stripe checkout
    window.open("/billing/upgrade", "_blank");
  };

  return (
    <div className="p-6">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Billing & Usage</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage plan, payment methods, invoices and view usage metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => window.location.reload()} className="px-3 py-2 rounded-md bg-neutral-100 hover:bg-neutral-200 inline-flex items-center gap-2 text-sm">
            <RefreshCcw size={16} /> Refresh
          </button>
          <button onClick={handleExportCSV} className="px-3 py-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 inline-flex items-center gap-2 text-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      <main className="mt-6 grid grid-cols-12 gap-6">
        {/* Left column: summary & chart */}
        <section className="col-span-8 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              title="Current plan"
              value={billing?.plan.toUpperCase() ?? "—"}
              subtitle={billing?.nextBillingDate ? `Next: ${new Date(billing.nextBillingDate).toLocaleDateString()}` : undefined}
            />
            <StatCard
              title="Usage (this period)"
              value={`${billing?.usageThisPeriodTokens ?? 0} tokens`}
              subtitle={billing?.usageLimitTokens ? `${Math.round(((billing?.usageThisPeriodTokens ?? 0) / billing.usageLimitTokens) * 100)}% of limit` : "No limit"}
            />
            <StatCard
              title="Estimated cost"
              value={`$${(billing?.estimatedCostUSD ?? 0).toFixed(2)}`}
              subtitle={`${billing?.currency ?? "USD"}`}
            />
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <BarChart2 size={18} />
                <div>
                  <div className="text-sm font-medium">Usage (last 30 days)</div>
                  <div className="text-xs text-neutral-500">Tokens consumed per day</div>
                </div>
              </div>

              <div className="text-xs text-neutral-500">Total: {usageTotal.toLocaleString()} tokens</div>
            </div>

            <div className="w-full">
              <UsageChart points={usage} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2">Usage Breakdown</h3>
            <p className="text-sm text-neutral-500 mb-4">A daily summary of tokens used. Use this to track spending and spot anomalies.</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-800">
                <div className="text-xs text-neutral-500">Avg per day</div>
                <div className="text-lg font-semibold">{Math.round(usageTotal / Math.max(usage.length, 1)).toLocaleString()} tokens</div>
              </div>
              <div className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-800">
                <div className="text-xs text-neutral-500">Peak day</div>
                <div className="text-lg font-semibold">{usage.reduce((a, b) => (a.tokens > b.tokens ? a : b)).tokens.toLocaleString()} tokens</div>
              </div>
              <div className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-800">
                <div className="text-xs text-neutral-500">Days monitored</div>
                <div className="text-lg font-semibold">{usage.length}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Right column: payments, invoices, upgrade */}
        <aside className="col-span-4 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-neutral-500">Plan</div>
                <div className="text-lg font-semibold">{billing?.plan.toUpperCase() ?? "—"}</div>
                {billing?.nextBillingDate && <div className="text-xs text-neutral-400 mt-1">Next billing: {new Date(billing.nextBillingDate).toLocaleDateString()}</div>}
              </div>
              <div>
                <button onClick={handleUpgrade} className="px-3 py-2 rounded-md bg-primary text-white text-sm">Upgrade</button>
              </div>
            </div>

            <div className="mt-4 text-sm text-neutral-500">
              <div>Estimated cost: <strong>${(billing?.estimatedCostUSD ?? 0).toFixed(2)}</strong></div>
              <div className="mt-2">Currency: {billing?.currency ?? "USD"}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="text-base font-semibold mb-3">Payment methods</h3>

            <div className="space-y-2">
              {payments.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between p-2 rounded-md bg-neutral-50 dark:bg-neutral-800">
                  <div>
                    <div className="font-medium">{pm.brand.toUpperCase()} • •••• {pm.last4}</div>
                    <div className="text-xs text-neutral-500">Exp {pm.expMonth}/{pm.expYear}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {!pm.isDefault && (
                      <button onClick={() => handleSetDefaultPayment(pm.id)} disabled={saving} className="px-2 py-1 text-sm rounded-md bg-neutral-100">Set default</button>
                    )}
                    <button onClick={() => handleRemovePayment(pm.id)} className="px-2 py-1 rounded-md bg-red-600 text-white text-sm">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 rounded-md bg-neutral-100 text-sm">Add payment method</button>
              <button className="px-3 py-2 rounded-md bg-neutral-100 text-sm">Manage billing</button>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="text-base font-semibold mb-3">Invoices</h3>
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-2 rounded-md bg-neutral-50 dark:bg-neutral-800">
                  <div>
                    <div className="font-medium">Invoice #{inv.id}</div>
                    <div className="text-xs text-neutral-500">{new Date(inv.createdAt).toLocaleDateString()} • ${inv.amountUSD.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownloadInvoice(inv)} className="px-2 py-1 rounded-md bg-neutral-100 text-sm inline-flex items-center gap-2"><FileText size={14} /> PDF</button>
                    <a href={inv.pdfUrl ?? "#"} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-md bg-neutral-100 text-sm inline-flex items-center gap-1"><Download size={14} /></a>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <div className="text-sm text-neutral-500">No invoices yet.</div>}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="text-base font-semibold mb-3">Trust & Security</h3>
            <div className="text-sm text-neutral-500 space-y-2">
              <div className="flex items-center gap-2"><Clock size={14} /> <span>99.99% uptime SLA</span></div>
              <div className="flex items-center gap-2"><ShieldCheck size={14} /> <span>SOC 2 & GDPR compliant</span></div>
              <div className="flex items-center gap-2"><Database size={14} /> <span>AES-256 encrypted at rest</span></div>
            </div>
            <div className="mt-3">
              <button className="px-3 py-2 rounded-md bg-neutral-100 text-sm">Download compliance report</button>
            </div>
          </div>

        </aside>
      </main>
    </div>
  );
}
