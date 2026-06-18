import type { DisclaimerConfig } from "@/types/config";

export const DEFAULT_DISCLAIMER: DisclaimerConfig = {
  title: "Before you order",
  bodyHtml:
    "<p>QM is not storing anything you order. Consider it disposable, or find a way to store it yourself.</p>" +
    "<p>Please do not order pens, power strips, tape, or paper. QM keeps stock of these items and can hand them out to people who need them.</p>",
  acknowledgmentText:
    "I acknowledge that QM cannot store anything for me and I am responsible for storing everything I order, or disposing of it and reordering next year.",
};

export function mergeDisclaimerConfig(
  current: DisclaimerConfig,
  incoming: Partial<DisclaimerConfig>
): DisclaimerConfig {
  return {
    title: incoming.title?.trim() || current.title,
    bodyHtml: incoming.bodyHtml?.trim() || current.bodyHtml,
    acknowledgmentText: incoming.acknowledgmentText?.trim() || current.acknowledgmentText,
  };
}