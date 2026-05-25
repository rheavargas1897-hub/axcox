import React from "react"
import { Users, ShieldOff, UserPlus, Zap } from "lucide-react"
import { cn } from "../../lib/utils"

var stats = [
  { label: "\u603B\u4E58\u5BA2\u6570", value: "12,458", icon: Users, color: "text-primary" },
  { label: "\u9ED1\u540D\u5355\u4EBA\u6570", value: "23", icon: ShieldOff, color: "text-destructive" },
  { label: "\u4ECA\u65E5\u65B0\u589E", value: "36", icon: UserPlus, color: "text-success" },
  { label: "\u6D3B\u8DC3\u4EBA\u6570", value: "3,892", icon: Zap, color: "text-warning-foreground" },
]

export function PassengerStats() {
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
