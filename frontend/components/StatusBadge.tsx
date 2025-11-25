"use client"

interface StatusBadgeProps {
  status: "registered" | "in_transit" | "delivered"
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

const statusConfig = {
  registered: {
    label: "Registered",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "📦",
  },
  in_transit: {
    label: "In Transit",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "🚚",
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "✅",
  },
}

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
}

export default function StatusBadge({
  status,
  size = "md",
  showIcon = true,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizeClass = sizeClasses[size]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.color} ${sizeClass}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}

