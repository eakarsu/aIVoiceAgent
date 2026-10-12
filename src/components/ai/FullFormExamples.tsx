"use client";

import { Button } from "@/components/ui/button";

const examples = ["Quick example", "Detailed example", "Executive example"];

export default function FullFormExamples({ onSelect, disabled = false }: {
  onSelect: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1" role="group" aria-label="Fill every AI field with a fictional example">
      <p className="text-xs text-muted-foreground">Fictional examples · fill only, no AI request or record</p>
      <div className="flex flex-wrap gap-2">
        {examples.map((label, index) => (
          <Button key={label} type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onSelect(index)}>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
