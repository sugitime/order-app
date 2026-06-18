type LineItemWithStatus = { status: string };

export function orderFullyFulfilled(lineItems: LineItemWithStatus[]): boolean {
  return (
    lineItems.length > 0 && lineItems.every((item) => item.status === "ORDERED")
  );
}

export function orderAwaitingDecision(lineItems: LineItemWithStatus[]): boolean {
  return lineItems.some((item) => item.status === "PENDING");
}

export function orderFullyDecided(lineItems: LineItemWithStatus[]): boolean {
  return (
    lineItems.length > 0 &&
    lineItems.every((item) => item.status !== "PENDING")
  );
}