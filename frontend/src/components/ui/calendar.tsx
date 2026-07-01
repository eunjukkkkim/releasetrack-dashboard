import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/**
 * Atlassian Calendar — shadcn-style wrapper over react-day-picker (v10).
 *
 * Design tokens (DESIGN.md): selection uses the single action color
 * `#1868db` (bg-atlassian-blue, white text); "today" uses the blue tint wash
 * (bg-blue-tint / atlassian-blue text); navigation buttons reuse the existing
 * ghost icon Button look (`buttonVariants`). Day cells are plain tinted hover
 * targets (no pill border) so the grid stays flat per DESIGN. Styled with
 * Tailwind utilities backed by the @theme tokens in index.css.
 */
export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-2",
        month: "relative flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 items-center w-full",
        caption_label: "text-sm font-medium text-midnight-navy",
        nav: "flex items-center absolute top-0 inset-x-0 justify-between pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-7 pointer-events-auto z-10",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-7 pointer-events-auto z-10",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[0.8rem] font-normal text-muted-indigo",
        week: "flex w-full mt-1",
        day: "relative size-9 p-0 text-center text-sm",
        day_button: cn(
          "appearance-none cursor-pointer border-0 bg-transparent",
          "inline-flex size-9 items-center justify-center rounded-input p-0 text-sm font-normal text-midnight-navy outline-none",
          "hover:bg-blue-tint hover:text-atlassian-blue focus:bg-blue-tint focus:text-atlassian-blue",
          "aria-selected:bg-atlassian-blue aria-selected:text-white aria-selected:hover:bg-atlassian-blue aria-selected:hover:text-white",
          "disabled:pointer-events-none disabled:opacity-40",
        ),
        selected: "",
        today: "rounded-input bg-blue-tint text-atlassian-blue",
        outside: "text-muted-indigo/50",
        disabled: "text-muted-indigo/40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClassName)} />
          ) : (
            <ChevronRight className={cn("size-4", chevronClassName)} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";
