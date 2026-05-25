import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"
import { Badge } from "../../components/ui/badge"
import { MapPin, Clock, DollarSign, Bus, TrendingUp } from "lucide-react"

var stops = [
  { name: "\u8D77\u59CB\u7AD9", time: "00:00" },
  { name: "\u4E2D\u90E8\u7AD9\u70B91", time: "+0:45" },
  { name: "\u4E2D\u90E8\u7AD9\u70B92", time: "+1:15" },
  { name: "\u7EC8\u70B9\u7AD9", time: "+2:00" },
]

export function RouteDetailDrawer({ route, open, onClose }: { route: any; open: boolean; onClose: () => void }) {
  if (!route) return null

  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4 text-primary" />
            {"\u8DEF\u7EBF\u8BE6\u60C5 - "}{route.name}
          </SheetTitle>
          <SheetDescription>{route.from}{" \u2192 "}{route.to}</SheetDescription>
        </SheetHeader>

        <div className="px-4 py-3 flex flex-col gap-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{"\u8DDD\u79BB / \u65F6\u957F"}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{route.distance}{"km / "}{route.duration}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{"\u57FA\u7840\u7968\u4EF7"}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{"\u00A5"}{route.basePrice}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1">
                <Bus className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{"\u4ECA\u65E5\u73ED\u6B21"}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{route.scheduleCount}{"\u73ED"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{"\u4ECA\u65E5\u8425\u6536"}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{"\u00A5"}{route.todayRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Stops Timeline */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u7AD9\u70B9\u4FE1\u606F"}</h3>
            </div>
            <div className="flex flex-col gap-0">
              {stops.map(function(stop, i) {
                var isFirst = i === 0
                var isLast = i === stops.length - 1
                return (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={
                        "w-3 h-3 rounded-full border-2 shrink-0 " +
                        ((isFirst || isLast) ? "border-primary bg-primary" : "border-primary bg-card")
                      } />
                      {!isLast && <div className="w-px h-8 bg-border" />}
                    </div>
                    <div className="flex items-center justify-between flex-1 pb-2">
                      <span className="text-sm text-foreground">{isFirst ? route.from : isLast ? route.to : stop.name}</span>
                      <span className="text-xs text-muted-foreground">{stop.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pricing Strategy */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u7968\u4EF7\u7B56\u7565"}</h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-sm text-foreground">{"\u6210\u4EBA\u7968"}</span>
                <span className="text-sm font-medium text-foreground">{"\u00A5"}{route.basePrice}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-sm text-foreground">{"\u513F\u7AE5\u7968"}</span>
                <span className="text-sm font-medium text-foreground">{"\u00A5"}{Math.round(route.basePrice * 0.5)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-sm text-foreground">{"\u8001\u4EBA\u7968"}</span>
                <span className="text-sm font-medium text-foreground">{"\u00A5"}{Math.round(route.basePrice * 0.7)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">{"\u519B\u4EBA\u7968"}</span>
                <span className="text-sm font-medium text-foreground">{"\u00A5"}{Math.round(route.basePrice * 0.6)}</span>
              </div>
            </div>
          </div>

          {/* Recent Performance */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{"\u8FD17\u65E5\u5356\u7968\u8D8B\u52BF"}</h3>
            <div className="flex items-end gap-1 h-20">
              {[65, 72, 58, 80, 90, 75, 85].map(function(v, i) {
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors"
                      style={{ height: v + "%" }}
                    />
                    <span className="text-[9px] text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
