import React from "react"
import { Bus, Navigation, BarChart3, CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "../../lib/utils"

var kpiData = [
  { label: "\u4ECA\u65E5\u603B\u73ED\u6B21", value: "128", icon: Bus, trend: "+5", color: "text-primary" },
  { label: "\u5728\u9014\u73ED\u6B21", value: "42", icon: Navigation, trend: null, color: "text-chart-2" },
  { label: "\u552E\u7F44\u7387", value: "68.7%", icon: BarChart3, trend: "+2.3%", color: "text-chart-3" },
  { label: "\u6838\u9500\u7387", value: "85.2%", icon: CheckCircle, trend: "+1.1%", color: "text-success" },
  { label: "\u5F02\u5E38\u73ED\u6B21", value: "3", icon: AlertTriangle, trend: null, color: "text-destructive", highlight: true },
]

export function DashboardKPI() {
  return (
    <div className="grid grid-cols-5 gap-4">
      {kpiData.map(function(item) {
        return (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm",
              item.highlight && "border-destructive/30 bg-destructive/5"
            )}
          >
            <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0")}>
              <item.icon className={cn("w-5 h-5", item.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className={cn("text-xl font-semibold text-foreground", item.highlight && "text-destructive")}>
                  {item.value}
                </span>
                {item.trend && (
                  <span className="text-[10px] text-success font-medium">{item.trend}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
