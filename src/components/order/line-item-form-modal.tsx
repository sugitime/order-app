"use client";

import { useEffect, useState } from "react";
import { PrimeBadge } from "@/components/order/prime-badge";
import { Button } from "@/components/ui/button";
import type { DraftLineItem } from "@/lib/order-draft";
import { isAmazonUrl } from "@/lib/validators";

type LineItemFormModalProps = {
  open: boolean;
  title: string;
  initialItem: DraftLineItem;
  onClose: () => void;
  onSave: (item: DraftLineItem) => void;
};

type LookupState = {
  loading: boolean;
  title: string | null;
  unitPrice: number | null;
  priceCurrency: string | null;
  priceDisplay: string | null;
  isPrimeEligible: boolean | null;
  error: string | null;
};

const emptyLookup = (): LookupState => ({
  loading: false,
  title: null,
  unitPrice: null,
  priceCurrency: null,
  priceDisplay: null,
  isPrimeEligible: null,
  error: null,
});

function validateItem(item: DraftLineItem, lookup: LookupState): string | null {
  if (!item.amazonUrl.trim()) return "Amazon URL is required.";
  if (!isAmazonUrl(item.amazonUrl.trim())) return "Only Amazon URLs are accepted.";
  if (!item.description.trim()) {
    return lookup.loading
      ? "Loading item details from Amazon..."
      : "Paste a valid Amazon URL and wait for the item name to load.";
  }
  if (!item.quantity || item.quantity < 1) return "Quantity must be at least 1.";
  if (!item.justification.trim()) return "Justification is required.";
  return null;
}

type LookupResponse = {
  title?: string | null;
  unitPrice: number | null;
  priceCurrency: string | null;
  priceDisplay: string | null;
  isPrimeEligible: boolean | null;
  error?: string | null;
};

function toLookupState(data: LookupResponse, loading = false): LookupState {
  return {
    loading,
    title: data.title?.trim() || null,
    unitPrice: data.unitPrice ?? null,
    priceCurrency: data.priceCurrency ?? null,
    priceDisplay: data.priceDisplay ?? null,
    isPrimeEligible: data.isPrimeEligible ?? null,
    error: data.error ?? null,
  };
}

export function LineItemFormModal({
  open,
  title,
  initialItem,
  onClose,
  onSave,
}: LineItemFormModalProps) {
  const [item, setItem] = useState<DraftLineItem>(initialItem);
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState<LookupState>(emptyLookup());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setItem(initialItem);
      setError("");
      setLookup({
        loading: false,
        title: initialItem.description || null,
        unitPrice: initialItem.unitPrice ?? null,
        priceCurrency: initialItem.priceCurrency ?? null,
        priceDisplay: initialItem.priceDisplay ?? null,
        isPrimeEligible: initialItem.isPrimeEligible ?? null,
        error: initialItem.priceLookupError ?? null,
      });
    }
  }, [open, initialItem]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const url = item.amazonUrl.trim();
    if (!url || !isAmazonUrl(url)) {
      setLookup(emptyLookup());
      setItem((current) => ({ ...current, description: "" }));
      return;
    }

    const fallbackDescription =
      url === initialItem.amazonUrl.trim() ? initialItem.description : "";

    const timer = setTimeout(async () => {
      setLookup((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await fetch("/api/amazon/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amazonUrl: url }),
        });
        const data = (await response.json()) as LookupResponse & { error?: string };
        if (!response.ok) {
          setLookup({ ...emptyLookup(), error: data.error ?? "Failed to look up product." });
          setItem((current) => ({ ...current, description: fallbackDescription }));
          return;
        }

        const nextLookup = toLookupState(data);
        setLookup(nextLookup);
        setItem((current) => ({
          ...current,
          description: nextLookup.title ?? fallbackDescription,
        }));
      } catch {
        setLookup({ ...emptyLookup(), error: "Failed to look up product." });
        setItem((current) => ({ ...current, description: fallbackDescription }));
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [open, item.amazonUrl, initialItem.amazonUrl, initialItem.description]);

  if (!open) return null;

  function updateField(field: keyof DraftLineItem, value: string | number) {
    setItem((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function fetchLatestLookup(url: string) {
    const response = await fetch("/api/amazon/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amazonUrl: url }),
    });
    const data = (await response.json()) as LookupResponse & { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to look up product.");
    }
    return toLookupState(data);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      let latestLookup = lookup;
      if (!lookup.loading) {
        latestLookup = await fetchLatestLookup(item.amazonUrl.trim());
        setLookup(latestLookup);
        setItem((current) => ({
          ...current,
          description: latestLookup.title ?? current.description,
        }));
      }

      const itemToSave = {
        ...item,
        description: latestLookup.title ?? item.description,
      };
      const validationError = validateItem(itemToSave, latestLookup);
      if (validationError) {
        setError(validationError);
        return;
      }

      onSave({
        description: itemToSave.description.trim(),
        amazonUrl: item.amazonUrl.trim(),
        quantity: item.quantity,
        justification: item.justification.trim(),
        unitPrice: latestLookup.unitPrice,
        priceCurrency: latestLookup.priceCurrency,
        priceDisplay: latestLookup.priceDisplay,
        isPrimeEligible: latestLookup.isPrimeEligible,
        priceLookupError: latestLookup.error,
      });
    } catch (lookupError) {
      setError(
        lookupError instanceof Error ? lookupError.message : "Failed to look up product."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="line-item-modal-title"
        className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-surface-raised p-6 shadow-2xl shadow-black/40"
      >
        <h3 id="line-item-modal-title" className="mb-4 text-lg font-semibold text-text">
          {title}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="item-url">Amazon URL</label>
            <input
              id="item-url"
              value={item.amazonUrl}
              onChange={(e) => updateField("amazonUrl", e.target.value)}
              placeholder="https://www.amazon.com/dp/..."
              type="url"
              autoFocus
            />
            {item.amazonUrl.trim() && isAmazonUrl(item.amazonUrl.trim()) && (
              <div className="mt-2 rounded-lg border border-border bg-surface-muted/50 px-3 py-2 text-sm">
                {lookup.loading ? (
                  <p className="text-text-muted">Loading item details...</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-text">
                      {lookup.priceDisplay ?? "Price unavailable"}
                    </span>
                    <PrimeBadge isPrimeEligible={lookup.isPrimeEligible} />
                    {lookup.error && (
                      <span className="text-xs text-amber-400">{lookup.error}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-text-muted">Item description</p>
            <p className="rounded-lg border border-border bg-surface-muted/50 px-3 py-2 text-sm text-text">
              {lookup.loading
                ? "Loading from Amazon..."
                : item.description || "Paste an Amazon URL above to load the item name."}
            </p>
          </div>

          <div>
            <label htmlFor="item-quantity">Quantity</label>
            <input
              id="item-quantity"
              type="number"
              min={1}
              max={999}
              value={item.quantity}
              onChange={(e) =>
                updateField("quantity", parseInt(e.target.value, 10) || 1)
              }
            />
          </div>

          <div>
            <label htmlFor="item-justification">Justification</label>
            <textarea
              id="item-justification"
              rows={3}
              value={item.justification}
              onChange={(e) => updateField("justification", e.target.value)}
              placeholder="Why is this item needed for your work?"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || lookup.loading}>
              {saving ? "Saving..." : "Save item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}