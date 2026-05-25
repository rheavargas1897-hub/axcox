import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { TrendingUp, DollarSign, Percent, Clock } from "lucide-react"

var detailData: Record<string, any> = {
  "BC2026022401": { id: "BC2026022401", route: "\u5E7F\u5DDE-\u6DF1\u5733", departure: "2026-02-24 08:30", sold: 38, total: 45, revenue: 3420, conversionRate: 84.4 },
  "BC2026022402": { id: "BC2026022402", route: "\u5317\u4EAC-\u5929\u6D25", departure: "2026-02-24 09:00", sold: 50, total: 50, revenue: 3000, conversionRate: 100 },
}

var defaultDetail = { id: "-", route: "-", departure: "-", sold: 30, total: 45, revenue: 2700, conversionRate: 66.7 }

var recentOrders = [
  { id: "ORD001", passenger: "\u5F20\u4E09", amount: 100, time: "10:02", status: "\u5DF2\u652F\u4ED8" },
  { id: "ORD002", passenger: "\u674E\u56DB", amount: 60, time: "09:45", status: "\u5DF2\u652F\u4ED8" },
  { id: "ORD003", passenger: "\u738B\u4E94", amount: 100, time: "09:30", status: "\u5DF2\u9000\u6B3E" },
  { id: "ORD004", passenger: "\u8D75\u516D", amount: 100, time: "09:15", status: "\u5DF2\u652F\u4ED8" },
]

var operationLogs = [
  { time: "2026-02-24 08:00", operator: "\u7CFB\u7EDF", action: "\u73ED\u6B21\u81EA\u52A8\u521B\u5EFA", note: "\u6BCF\u65E5\u5B9A\u65F6\u4EFB\u52A1" },
  { time: "2026-02-24 07:30", operator: "\u7BA1\u7406\u5458", action: "\u4FEE\u6539\u53D1\u8F66\u65F6\u95F4", note: "\u539F08:00\u8C03\u6574\u4E3A08:30" },
  { time: "2026-02-23 18:00", operator: "\u7CFB\u7EDF", action: "\u5F00\u653E\u552E\u7968", note: "\u552E\u7968\u7A97\u53E3\u5F00\u542F" },
]

export function ScheduleDetailDrawer({ scheduleId, open, onClose }: { scheduleId: string | null; open: boolean; onClose: () => void }) {
  if (!scheduleId) return null

  var detail = detailData[scheduleId] || Object.assign({}, defaultDetail, { id: scheduleId })

  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{"\u73ED\u6B21\u8BE6\u60C5 - "}{detail.id}</SheetTitle>
          <SheetDescription>{detail.route}{" | "}{detail.departure}</SheetDescription>
        </SheetHeader>

        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3 px-4 py-3">
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
            <TrendingUp className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">{"\u5DF2\u552E\u5E93\u5B58"}</p>
              <p className="text-sm font-semibold text-foreground">{detail.sold}/{detail.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
            <DollarSign className="w-4 h-4 text-success shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">{"\u7D2F\u8BA1\u8425\u6536"}</p>
              <p className="text-sm font-semibold text-foreground">{"¥"}{detail.revenue}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
            <Percent className="w-4 h-4 text-chart-2 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">{"\u8F6C\u5316\u7387"}</p>
              <p className="text-sm font-semibold text-foreground">{detail.conversionRate}%</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="trend" className="px-4 py-2">
          <TabsList className="w-full">
            <TabsTrigger value="trend">{"\u9500\u552E\u8D8B\u52BF"}</TabsTrigger>
            <TabsTrigger value="orders">{"\u8FD1\u671F\u8BA2\u5355"}</TabsTrigger>
            <TabsTrigger value="logs">{"\u64CD\u4F5C\u65E5\u5FD7"}</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="mt-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">{"\u8FC724\u5C0F\u65F6\u9500\u552E\u8D70\u52BF"}</p>
              <div className="flex items-end gap-0.5 h-28">
                {[0,0,0,2,5,8,12,15,20,25,28,30,32,34,35,36,36,37,37,38,38,38,38,38].map(function(v, i) {
                  var h = detail.total > 0 ? Math.round((v / detail.total) * 100) : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors"
                        style={{ height: Math.max(h, 2) + "%" }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{"0:00"}</span>
                <span>{"6:00"}</span>
                <span>{"12:00"}</span>
                <span>{"18:00"}</span>
                <span>{"23:00"}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-3">
            <div className="flex flex-col gap-1">
              {recentOrders.map(function(order) {
                return (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{order.id}</span>
                      <span className="text-xs text-muted-foreground">{order.passenger}{" | "}{order.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{"¥"}{order.amount}</span>
                      <Badge variant={order.status === "\u5DF2\u9000\u6B3E" ? "destructive" : "secondary"} className="text-[10px]">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-3">
            <div className="flex flex-col gap-1">
              {operationLogs.map(function(log, i) {
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{log.action}</span>
                        <span className="text-[10px] text-muted-foreground">{log.time}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.operator}{" | "}{log.note}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
