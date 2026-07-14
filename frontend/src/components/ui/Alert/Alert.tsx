"use client";

import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "../types";

export type AlertVariant = "error" | "success" | "warning" | "info";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  isClosable?: boolean;
  onClose?: () => void;
  icon?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
  error: "bg-red-50 border-red-200 text-red-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconStyles: Record<AlertVariant, string> = {
  error: "text-red-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  error: <AlertCircle className="w-5 h-5" />,
  success: <CheckCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  description,
  isClosable,
  onClose,
  icon,
  className,
  children,
  ...props
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "relative flex w-full gap-4 rounded-xl border p-4 transition-all duration-200",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className={cn("flex-shrink-0", iconStyles[variant])}>
        {icon || defaultIcons[variant]}
      </div>

      <div className="flex-1 space-y-1">
        {title && <h5 className="font-bold leading-tight">{title}</h5>}
        {description && <p className="text-sm leading-relaxed opacity-90">{description}</p>}
        {children && <div className="text-sm opacity-90">{children}</div>}
      </div>

      {isClosable && (
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-lg p-1 opacity-60 transition-opacity hover:bg-black/5 hover:opacity-100"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

Alert.displayName = "Alert";
