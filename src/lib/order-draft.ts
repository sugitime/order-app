export type DraftLineItem = {
  description: string;
  amazonUrl: string;
  quantity: number;
  justification: string;
  unitPrice?: number | null;
  priceCurrency?: string | null;
  priceDisplay?: string | null;
  isPrimeEligible?: boolean | null;
  priceLookupError?: string | null;
};

export type OrderDraft = {
  requesterName: string;
  requesterEmail: string;
  departmentName: string;
  acknowledged: boolean;
  lineItems: DraftLineItem[];
};

const STORAGE_KEY = "qm-order-draft";

export function getOrderDraft(): OrderDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OrderDraft> & {
      departmentId?: string;
    };
    return {
      requesterName: parsed.requesterName ?? "",
      requesterEmail: parsed.requesterEmail ?? "",
      departmentName: parsed.departmentName ?? "",
      acknowledged: parsed.acknowledged ?? false,
      lineItems: parsed.lineItems ?? [],
    };
  } catch {
    return null;
  }
}

export function saveOrderDraft(draft: OrderDraft) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearOrderDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function createEmptyDraft(): OrderDraft {
  return {
    requesterName: "",
    requesterEmail: "",
    departmentName: "",
    acknowledged: false,
    lineItems: [],
  };
}