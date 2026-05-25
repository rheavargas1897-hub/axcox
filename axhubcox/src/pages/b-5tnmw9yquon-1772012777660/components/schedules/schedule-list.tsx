import React from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { cn } from "../../lib/utils"
import { Eye, MoreHorizontal, Pencil } from "lucide-react"

var statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "\u672A\u5F00\u59CB", className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  running: { label: "\u8FDB\u884C\u4E2D", className: "bg-success/15 text-success border-success/30" },
  delayed: { label: "\u5EF6\u8BEF", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  cancelled: { label: "\u5DF2\u53D6\u6D88", className: "bg-destructive/15 text-destructive border-destructive/30" },
}

var schedules = [
  { id: "BC2026022401", route: "\u5E7F\u5DDE-\u6DF1\u5733", departure: "2026-02-24 08:30", status: "running", sold: 38, total: 45, price: 100, vehicleType: "\u5927\u578B\u5BA2\u8F66", rules: ["\u65E9\u9E1F\u7968", "\u5206\u65F6\u9000\u7968"] },
  { id: "BC2026022402", route: "\u5317\u4EAC-\u5929\u6D25", departure: "2026-02-24 09:00", status: "running", sold: 50, total: 50, price: 60, vehicleType: "\u4E2D\u578B\u5BA2\u8F66", rules: ["\u5206\u65F6\u9000\u7968"] },
  { id: "BC2026022403", route: "\u4E0A\u6D77-\u82CF\u5DDE", departure: "2026-02-24 10:00", status: "pending", sold: 22, total: 40, price: 45, vehicleType: "\u5927\u578B\u5BA2\u8F66", rules: [] },
  { id: "BC2026022404", route: "\u6B66\u6C49-\u957F\u6C99", departure: "2026-02-24 07:00", status: "delayed", sold: 30, total: 45, price: 120, vehicleType: "\u5927\u578B\u5BA2\u8F66", rules: ["\u65E9\u9E1F\u7968"] },
  { id: "BC2026022405", route: "\u897F\u5B89-\u6210\u90FD", departure: "2026-02-24 11:30", status: "pending", sold: 45, total: 45, price: 200, vehicleType: "\u5927\u578B\u5BA2\u8F66", rules: ["\u65E9\u9E1F\u7968", "\u5206\u65F6\u9000\u7968"] },
  { id: "BC2026022406", route: "\u676D\u5DDE-\u5B81\u6CE2", departure: "2026-02-24 08:00", status: "running", sold: 28, total: 35, price: 75, vehicleType: "\u4E2D\u578B\u5BA2\u8F66", rules: [] },
  { id: "BC2026022407", route: "\u6210\u90FD-\u91CD\u5E86", departure: "2026-02-24 13:00", status: "pending", sold: 15, total: 50, price: 150, vehicleType: "\u5927\u578B\u5BA2\u8F66", rules: ["\u5206\u65F6\u9000\u7968"] },
  { id: "BC2026022408", route: "\u5357\u4EAC-\u5408\u80A5", departure: "2026-02-24 06:30", status: "running", sold: 42, total: 45, price: 90, vehicleType: "\u5927\u578B\u5BA2\u8F66", rules: ["\u65E9\u9E1F\u7968"] },
  { id: "BC2026022409", route: "\u5E7F\u5DDE-\u73E0\u6D77", departure: "2026-02-24 14:30", status: "cancelled", sold: 5, total: 40, price: 80, vehicleType: "\u4E2D\u578B\u5BA2\u8F66", rules: [] },
  { id: "BC2026022410", route: "\u957F\u6C99-\u5357\u660C", departure: "2026-02-24 15:00", status: "pending", sold: 33, total: 45, price: 110, vehicleType: "\u5927\u578B\u5BA2\u8F66", rules: ["\u65E9\u9E1F\u7968", "\u5206\u65F6\u9000\u7968"] },
]

export function ScheduleList({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Filters */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-5 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u73ED\u6B21\u7F16\u53F7"}</label>
            <input type="text" placeholder={"\u8F93\u5165\u73ED\u6B21\u53F7"} className="h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u7EBF\u8DEF"}</label>
            <input type="text" placeholder={"\u8F93\u5165\u8D77\u8BBE\u7AD9"} className="h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u53D1\u8F66\u65E5\u671F"}</label>
            <input type="date" defaultValue="2026-02-24" className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u72B6\u6001"}</label>
            <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{"\u5168\u90E8"}</option>
              <option>{"\u672A\u5F00\u59CB"}</option>
              <option>{"\u8FDB\u884C\u4E2D"}</option>
              <option>{"\u5EF6\u8BEF"}</option>
              <option>{"\u5DF2\u53D6\u6D88"}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 rounded-md border border-input bg-card text-sm hover:bg-muted transition-colors">{"\u91CD\u7F6E"}</button>
            <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">{"\u641C\u7D22"}</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs">{"\u73ED\u6B21\u7F16\u53F7"}</TableHead>
            <TableHead className="text-xs">{"\u7EBF\u8DEF"}</TableHead>
            <TableHead className="text-xs">{"\u53D1\u8F66\u65F6\u95F4"}</TableHead>
            <TableHead className="text-xs">{"\u8F66\u578B"}</TableHead>
            <TableHead className="text-xs">{"\u72B6\u6001"}</TableHead>
            <TableHead className="text-xs">{"\u5E93\u5B58\u552E\u5356"}</TableHead>
            <TableHead className="text-xs">{"\u7968\u4EF7(\u5143)"}</TableHead>
            <TableHead className="text-xs">{"\u89C4\u5219\u6807\u7B7E"}</TableHead>
            <TableHead className="text-xs">{"\u64CD\u4F5C"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map(function(item) {
            var s = statusMap[item.status]
            var soldRate = Math.round((item.sold / item.total) * 100)
            var isTight = soldRate > 80

            return (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell className="text-sm font-medium text-foreground">{item.id}</TableCell>
                <TableCell className="text-sm text-foreground">{item.route}</TableCell>
                <TableCell className="text-sm text-foreground">{item.departure}</TableCell>
                <TableCell className="text-sm text-foreground">{item.vehicleType}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[11px]", s.className)}>{s.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 min-w-[110px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.sold}/{item.total}</span>
                      <span className={cn("font-medium", isTight ? "text-destructive" : "text-foreground")}>{soldRate}%</span>
                    </div>
                    <Progress
                      value={soldRate}
                      className={cn("h-1.5", isTight && "[&>[data-slot=progress-indicator]]:bg-warning")}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground">{"¥"}{item.price}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.rules.length > 0 ? item.rules.map(function(r) {
                      return <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">{r}</Badge>
                    }) : <span className="text-xs text-muted-foreground">-</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 rounded hover:bg-muted transition-colors"
                      onClick={function() { onSelect(item.id) }}
                      aria-label={"\u67E5\u770B\u8BE6\u60C5"}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted transition-colors" aria-label={"\u7F16\u8F91"}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted transition-colors" aria-label={"\u66F4\u591A"}>
                      <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{"\u5171 "}{schedules.length}{" \u6761\u8BB0\u5F55"}</span>
        <div className="flex items-center gap-1">
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors" disabled>{"<"}</button>
          <button className="h-7 px-2.5 rounded bg-primary text-primary-foreground text-xs">1</button>
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors">{">"}</button>
        </div>
      </div>
    </div>
  )
}
