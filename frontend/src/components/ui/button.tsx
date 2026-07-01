import * as React from "react";
import { Link } from "react-router-dom";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva("rt-button", {
  variants: {
    variant: {
      default: "rt-button-default",
      secondary: "rt-button-secondary",
      outline: "rt-button-outline",
      ghost: "rt-button-ghost",
      destructive: "rt-button-destructive",
      link: "rt-button-ghost",
    },
    size: {
      default: "",
      md: "",
      sm: "rt-button-sm",
      lg: "",
      icon: "rt-button-icon",
      xs: "rt-button-sm",
      "icon-xs": "rt-button-icon",
      "icon-sm": "rt-button-icon",
      "icon-lg": "rt-button-icon",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  to: string;
  children: React.ReactNode;
}

function LinkButton({
  className,
  variant,
  size,
  to,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      to={to}
      {...props}
    >
      {children}
    </Link>
  );
}

export { Button, LinkButton, buttonVariants };
