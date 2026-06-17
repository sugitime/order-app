import { cn } from "@/lib/utils";

const steps = [
  { number: 1, label: "Your Info" },
  { number: 2, label: "Disclaimer" },
  { number: 3, label: "Line Items" },
];

export function OrderProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                currentStep >= step.number
                  ? "bg-brand-600 text-white"
                  : "bg-surface-muted text-text-muted"
              )}
            >
              {step.number}
            </div>
            <span
              className={cn(
                "hidden text-xs sm:block",
                currentStep >= step.number ? "text-brand-400" : "text-text-muted"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-8 sm:w-16",
                currentStep > step.number ? "bg-brand-600" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}