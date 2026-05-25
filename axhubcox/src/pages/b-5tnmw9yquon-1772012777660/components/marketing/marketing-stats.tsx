import React from "react"
import { Ticket, TrendingUp, Users, Percent } from "lucide-react"
import { cn } from "../../lib/utils"

var stats = [
  { label: "\u6D3B\u52A8\u603B\u6570", value: "12", icon: Ticket, color: "text-primary" },
  { label: "\u8FDB\u884C\u4E2D", value: "5", icon: TrendingUp, color: "text-success" },
  { label: "\u603B\u53D1\u5238\u91CF", value: "8,500", icon: Users, color: "text-chart-2" },
  { label: "\u5E73\u5747\u6838\u9500\u7387", value: "72%", icon: Percent, color: "text-warning-foreground" },
]

export function MarketingStats() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map(function(item) {
        return (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
              <item.icon className={cn("w-5 h-5", item.color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-semibold text-foreground">{item.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
