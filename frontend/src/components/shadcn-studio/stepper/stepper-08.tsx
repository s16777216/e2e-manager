import { useState } from "react";
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperNav,
  StepperTitle,
  StepperPanel,
  type StepDefinition,
} from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export interface Stepper08Props {
  steps: StepDefinition[];
  value?: string;
  onValueChange?: (value: string) => void;
  onBeforeNext?: () => Promise<boolean> | boolean;
  onComplete?: () => void;
  isNextDisabled?: boolean;
  nextText?: string;
  completeText?: string;
  showNavigationButtons?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Stepper08({
  steps,
  value,
  onValueChange,
  onBeforeNext,
  onComplete,
  isNextDisabled = false,
  nextText = "Next",
  completeText = "Submit",
  className,
  children,
}: Stepper08Props) {
  const [internalCurrent, setInternalCurrent] = useState(steps[0]?.id || "");
  const [submitted, setSubmitted] = useState(false);

  const current = value !== undefined ? value : internalCurrent;
  const currentIndex = steps.findIndex((s) => s.id === current);

  const handleStepChange = (newId: string) => {
    if (value === undefined) {
      setInternalCurrent(newId);
    }
    onValueChange?.(newId);
  };

  const goNext = () => {
    const nextIdx = Math.min(currentIndex + 1, steps.length - 1);
    handleStepChange(steps[nextIdx].id);
  };

  const goBack = () => {
    const prevIdx = Math.max(currentIndex - 1, 0);
    handleStepChange(steps[prevIdx].id);
  };

  const handleNextClick = async () => {
    if (onBeforeNext) {
      const canProceed = await onBeforeNext();
      if (!canProceed) return;
    }
    if (currentIndex === steps.length - 1) {
      setSubmitted(true);
      onComplete?.();
    } else {
      goNext();
    }
  };

  return (
    <div className={cn("w-full flex flex-col gap-6", className)}>
      <Stepper
        steps={steps}
        value={current}
        onValueChange={(v) => {
          if (!submitted) handleStepChange(v);
        }}
        className="flex flex-col items-center justify-center gap-6 min-h-full"
        orientation="horizontal"
      >
        <StepperNav className="w-full shrink-0">
          {steps.map((step, index) => (
            <StepperItem
              key={step.id}
              stepId={step.id}
              completed={submitted || index < currentIndex}
              className="relative flex-1"
            >
              <StepperTrigger
                className="flex flex-col gap-2.5 items-center w-full pointer-events-none"
                aria-disabled={true}
              >
                <StepperIndicator>{index + 1}</StepperIndicator>
                <StepperTitle
                  className={cn(
                    "text-xs font-medium text-center",
                    submitted ? "text-muted-foreground" : "",
                  )}
                >
                  {step.title}
                </StepperTitle>
              </StepperTrigger>
              {steps.length > index + 1 && (
                <StepperSeparator className="absolute inset-x-0 top-3 right-[calc(-50%+20px)] left-[calc(50%+20px)]" />
              )}
            </StepperItem>
          ))}
        </StepperNav>
        <StepperPanel className="w-full flex-1 flex flex-col">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 flex-1">
            <div className="h-full w-full">{children}</div>
          </div>
        </StepperPanel>
        <div className="w-full flex items-center justify-between">
          {!submitted && (
            <Button
              onClick={goBack}
              disabled={currentIndex === 0}
              variant={currentIndex === 0 ? "secondary" : "outline"}
            >
              <ArrowLeftIcon className="size-4 mr-1" /> 上一步
            </Button>
          )}

          <Button
            onClick={handleNextClick}
            disabled={isNextDisabled}
            className="ml-auto text-zinc-950 font-semibold"
          >
            {currentIndex === steps.length - 1 ? (
              <>{completeText}</>
            ) : (
              <>
                {nextText} <ArrowRightIcon className="size-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </Stepper>
    </div>
  );
}

export default Stepper08;
