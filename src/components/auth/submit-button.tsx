import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = Omit<
  ComponentProps<typeof Button>,
  "type" | "disabled"
> & {
  isPending: boolean;
  pendingLabel: string;
};

export function SubmitButton({
  isPending,
  pendingLabel,
  children,
  ...buttonProps
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isPending} {...buttonProps}>
      {isPending && (
        <LoaderCircle
          className="animate-spin"
          data-icon="inline-start"
          aria-hidden="true"
        />
      )}
      {isPending ? pendingLabel : children}
    </Button>
  );
}
