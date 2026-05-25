import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../lib/utils"
import { User, MapPin, ShoppingCart, Phone, CreditCard, Calendar } from "lucide-react"

var tripHistory = [
  { date: "2026-02-24", route: "\u5E7F\u5DDE-\u6DF1\u5733", orderId: "ORD001", amount: 100, status: "\u5DF2\u4E58\u8F66" },
  { date: "2026-02-20", route: "\u5E7F\u5DDE-\u6DF1\u5733", orderId: "ORD002", amount: 100, status: "\u5DF2\u4E58\u8F66" },
  { date: "2026-02-15", route: "\u5E7F\u5DDE-\u73E0\u6D77", orderId: "ORD003", amount: 80, status: "\u5DF2\u4E58\u8F66" },
  { date: "2026-02-10", route: "\u4E0A\u6D77-\u676D\u5DDE", orderId: "ORD004", amount: 50, status: "\u5DF2\u9000\u6B3E" },
  { date: "2026-01-28", route: "\u5317\u4EAC-\u5929\u6D25", orderId: "ORD005", amount: 60, status: "\u5DF2\u4E58\u8F66" },
]

export function PassengerDetailDrawer({ passenger, open, onClose }: { passenger: any; open: boolean; onClose: () => void }) {
  if (!passenger) return null
  var isBlacklisted = passenger.status === "\u9ED1\u540D\u5355"

  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            {"\u4E58\u5BA2\u8BE6\u60C5 - "}{passenger.name}
            <Badge
              variant="outline"
              className={cn(
                "text-[11px]",
                isBlacklisted
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : "bg-success/15 text-success border-success/30"
              )}
            >
              {passenger.status}
            </Badge>
          </SheetTitle>
          <SheetDescription>{"\u67E5\u770B\u4E58\u5BA2\u8BE6\u7EC6\u4FE1\u606F\u4E0E\u51FA\u884C\u8BB0\u5F55"}</SheetDescription>
        </SheetHeader>

        <div className="px-4 py-3 flex flex-col gap-5">
          {/* Basic Info */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u57FA\u672C\u4FE1\u606F"}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">{"\u59D3\u540D"}</span>
                <p className="text-sm font-medium text-foreground">{passenger.name}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u624B\u673A\u53F7"}</span>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <p className="text-sm text-foreground">{passenger.phone}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u8BC1\u4EF6\u53F7"}</span>
                <p className="text-sm text-foreground">{passenger.idCard}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u6CE8\u518C\u6E20\u9053"}</span>
                <Badge variant="secondary" className="text-[10px] mt-0.5">{passenger.source}</Badge>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <ShoppingCart className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-semibold text-foreground">{passenger.orderCount}</p>
              <p className="text-xs text-muted-foreground">{"\u603B\u8BA2\u5355"}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <CreditCard className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-semibold text-foreground">{"\u00A5"}{passenger.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{"\u7D2F\u8BA1\u6D88\u8D39"}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-semibold text-foreground">{passenger.lastTrip}</p>
              <p className="text-xs text-muted-foreground">{"\u6700\u8FD1\u51FA\u884C"}</p>
            </div>
          </div>

          {/* Common Routes */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u5E38\u7528\u8DEF\u7EBF"}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">{"\u5E7F\u5DDE-\u6DF1\u5733 (8\u6B21)"}</Badge>
              <Badge variant="secondary" className="text-xs">{"\u5E7F\u5DDE-\u73E0\u6D77 (4\u6B21)"}</Badge>
              <Badge variant="secondary" className="text-xs">{"\u4E0A\u6D77-\u676D\u5DDE (2\u6B21)"}</Badge>
            </div>
          </div>

          {/* Trip History */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">{"\u51FA\u884C\u8BB0\u5F55"}</h3>
            </div>
            <div className="flex flex-col gap-1">
              {tripHistory.map(function(trip, i) {
                var isRefund = trip.status === "\u5DF2\u9000\u6B3E"
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20">{trip.date}</span>
                      <span className="text-sm text-foreground">{trip.route}</span>
                      <span className="text-xs text-primary">{trip.orderId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", isRefund ? "text-muted-foreground line-through" : "text-foreground")}>{"\u00A5"}{trip.amount}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          isRefund
                            ? "bg-muted text-muted-foreground border-border"
                            : "bg-success/15 text-success border-success/30"
                        )}
                      >
                        {trip.status}
                      </Badge>
                    </div>
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
