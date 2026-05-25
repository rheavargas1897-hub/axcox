import React from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../lib/utils"
import { Eye, RotateCcw, FileText } from "lucide-react"

var statusStyles: Record<string, { className: string }> = {
  "\u5F85\u652F\u4ED8": { className: "bg-warning/15 text-warning-foreground border-warning/30" },
  "\u5DF2\u652F\u4ED8": { className: "bg-success/15 text-success border-success/30" },
  "\u5DF2\u4E58\u8F66": { className: "bg-primary/15 text-primary border-primary/30" },
  "\u672A\u4E58\u8F66": { className: "bg-muted text-muted-foreground border-border" },
  "\u5DF2\u9000\u6B3E": { className: "bg-muted text-muted-foreground border-border" },
  "\u90E8\u5206\u9000\u6B3E": { className: "bg-chart-5/15 text-chart-5 border-chart-5/30" },
  "\u53D6\u6D88\u8BA2\u5355": { className: "bg-destructive/15 text-destructive border-destructive/30" },
}

var orders = [
  { id: "ORD20260224001", time: "2026-02-24 10:00", passenger: "\u5F20\u4E09", phone: "138****8888", route: "\u5E7F\u5DDE-\u6DF1\u5733", departure: "02-25 08:30", seat: "05\u53F7\u5EA7", amount: 100, paid: 90, status: "\u5DF2\u652F\u4ED8", subStatus: "\u5F85\u6838\u9500", payment: "\u5FAE\u4FE1\u652F\u4ED8", payStatus: "\u5DF2\u652F\u4ED8", refunded: 0 },
  { id: "ORD20260224002", time: "2026-02-24 09:15", passenger: "\u674E\u56DB", phone: "139****9999", route: "\u4E0A\u6D77-\u676D\u5DDE", departure: "02-24 08:00", seat: "12\u53F7\u5EA7", amount: 50, paid: 50, status: "\u5DF2\u9000\u6B3E", subStatus: "", payment: "\u652F\u4ED8\u5B9D", payStatus: "\u5168\u989D\u9000\u56DE", refunded: 50 },
  { id: "ORD20260224003", time: "2026-02-24 09:00", passenger: "\u738B\u4E94", phone: "137****7777", route: "\u4E0A\u6D77-\u82CF\u5DDE", departure: "02-24 10:00", seat: "08\u53F7\u5EA7", amount: 45, paid: 40, status: "\u5DF2\u4E58\u8F66", subStatus: "08:00\u6838\u9500", payment: "\u5FAE\u4FE1\u652F\u4ED8", payStatus: "\u5DF2\u652F\u4ED8", refunded: 0 },
  { id: "ORD20260224004", time: "2026-02-22 10:00", passenger: "\u8D75\u516D", phone: "136****6666", route: "\u6B66\u6C49-\u957F\u6C99", departure: "02-22 07:00", seat: "20\u53F7\u5EA7", amount: 120, paid: 120, status: "\u672A\u4E58\u8F66", subStatus: "\u5DF2\u8FC7\u671F", payment: "\u73B0\u91D1", payStatus: "\u5DF2\u652F\u4ED8", refunded: 0 },
  { id: "ORD20260224005", time: "2026-02-21 08:00", passenger: "\u5B59\u4E03", phone: "135****5555", route: "\u897F\u5B89-\u6210\u90FD", departure: "02-22 11:30", seat: "03\u53F7\u5EA7", amount: 200, paid: 200, status: "\u5DF2\u9000\u6B3E", subStatus: "", payment: "\u652F\u4ED8\u5B9D", payStatus: "\u539F\u8DEF\u9000\u56DE", refunded: 180 },
  { id: "ORD20260224006", time: "2026-02-24 11:00", passenger: "\u5468\u516B", phone: "134****4444", route: "\u676D\u5DDE-\u5B81\u6CE2", departure: "02-25 08:00", seat: "15\u53F7+16\u53F7\u5EA7", amount: 160, paid: 150, status: "\u90E8\u5206\u9000\u6B3E", subStatus: "\u5468\u516B\u5DF2\u9000", payment: "\u5FAE\u4FE1\u652F\u4ED8", payStatus: "\u90E8\u5206\u9000\u56DE", refunded: 75 },
  { id: "ORD20260224007", time: "2026-02-24 11:30", passenger: "\u5434\u4E5D", phone: "133****3333", route: "\u5317\u4EAC-\u5929\u6D25", departure: "02-25 09:00", seat: "22\u53F7\u5EA7", amount: 60, paid: 0, status: "\u5F85\u652F\u4ED8", subStatus: "\u526914:59", payment: "-", payStatus: "\u5F85\u652F\u4ED8", refunded: 0 },
  { id: "ORD20260224008", time: "2026-02-24 08:30", passenger: "\u90D1\u5341", phone: "132****2222", route: "\u5357\u4EAC-\u5408\u80A5", departure: "02-24 06:30", seat: "30\u53F7\u5EA7", amount: 90, paid: 90, status: "\u5DF2\u4E58\u8F66", subStatus: "06:20\u6838\u9500", payment: "\u652F\u4ED8\u5B9D", payStatus: "\u5DF2\u652F\u4ED8", refunded: 0 },
]

export function OrderTable({ onSelect }: { onSelect: (order: any) => void }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{"\u8BA2\u5355\u5217\u8868"}</h2>
        <span className="text-xs text-muted-foreground">{"\u5171 "}{orders.length}{" \u6761\u8BB0\u5F55"}</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs">{"\u8BA2\u5355\u53F7/\u4E0B\u5355\u65F6\u95F4"}</TableHead>
            <TableHead className="text-xs">{"\u4E58\u5BA2\u4FE1\u606F"}</TableHead>
            <TableHead className="text-xs">{"\u73ED\u6B21/\u5EA7\u4F4D"}</TableHead>
            <TableHead className="text-xs">{"\u8BA2\u5355\u91D1\u989D"}</TableHead>
            <TableHead className="text-xs">{"\u8BA2\u5355\u72B6\u6001"}</TableHead>
            <TableHead className="text-xs">{"\u652F\u4ED8\u4FE1\u606F"}</TableHead>
            <TableHead className="text-xs">{"\u64CD\u4F5C"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(function(item) {
            var ss = statusStyles[item.status] || statusStyles["\u53D6\u6D88\u8BA2\u5355"]
            return (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={function() { onSelect(item) }}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary">{item.id}</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{item.passenger}</span>
                    <span className="text-xs text-muted-foreground">{item.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{item.route}</span>
                    <span className="text-xs text-muted-foreground">{item.departure}{" | "}{item.seat}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{"\u5B9E\u4ED8: \u00A5"}{item.paid}</span>
                    {item.refunded > 0 && (
                      <span className="text-xs text-destructive">{"\u5DF2\u9000: \u00A5"}{item.refunded}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Badge variant="outline" className={cn("text-[11px] w-fit", ss.className)}>
                      {item.status}
                    </Badge>
                    {item.subStatus && (
                      <span className="text-[10px] text-muted-foreground">{item.subStatus}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{item.payment}</span>
                    <span className="text-xs text-muted-foreground">{item.payStatus}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 rounded hover:bg-muted transition-colors"
                      onClick={function(e) { e.stopPropagation(); onSelect(item) }}
                      aria-label={"\u8BE6\u60C5"}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </button>
                    {(item.status === "\u5DF2\u652F\u4ED8" || item.status === "\u90E8\u5206\u9000\u6B3E") && (
                      <button className="p-1 rounded hover:bg-muted transition-colors" aria-label={"\u9000\u7968"}>
                        <RotateCcw className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    )}
                    <button className="p-1 rounded hover:bg-muted transition-colors" aria-label={"\u65E5\u5FD7"}>
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{"\u5171 "}{orders.length}{" \u6761"}</span>
        <div className="flex items-center gap-1">
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors" disabled>{"<"}</button>
          <button className="h-7 px-2.5 rounded bg-primary text-primary-foreground text-xs">1</button>
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors">{">"}</button>
        </div>
      </div>
    </div>
  )
}
