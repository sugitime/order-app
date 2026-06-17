export type DraftLineItem = {
  description: string;
  amazonUrl: string;
  quantity: number;
  justification: string;
};

export type OrderDraft = {
  requesterName: string;
  departmentId: string;
  departmentName?: string;
  acknowledged: boolean;
  lineItems: DraftLineItem[];
};

const STORAGE_KEY = "qm-order-draft";

export function getOrderDraft(): OrderDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderDraft;
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
    departmentId: "",
    acknowledged: false,
    lineItems: [],
  };
}