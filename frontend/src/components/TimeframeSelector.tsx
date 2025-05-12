import React from "react";
import { Button } from "@/components/ui/button";

type Timeframe = "daily" | "weekly" | "monthly";

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (value: Timeframe) => void;
}

export default function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex items-center bg-secondary/30 rounded-md p-1 border border-border">
      <Button
        variant={value === "daily" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("daily")}
        className={value === "daily" ? "" : "text-muted-foreground"}
      >
        Daily
      </Button>
      <Button
        variant={value === "weekly" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("weekly")}
        className={value === "weekly" ? "" : "text-muted-foreground"}
      >
        Weekly
      </Button>
      <Button
        variant={value === "monthly" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("monthly")}
        className={value === "monthly" ? "" : "text-muted-foreground"}
      >
        Monthly
      </Button>
    </div>
  );
}
