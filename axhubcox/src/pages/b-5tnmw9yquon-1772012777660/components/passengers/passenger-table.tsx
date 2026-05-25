import React from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../lib/utils"
import { Eye, ShieldOff } from "lucide-react"

var passengers = [
  { id: "P001", name: "\u5F20\u4E09", phone: "138****8888", idCard: "4401**********1234", orderCount: 15, totalSpent: 2300, lastTrip: "2026-02-24", status: "\u6B63\u5E38", source: "\u5C0F\u7A0B\u5E8F", isActive: true },
  { id: "P002", name: "\u674E\u56DB", phone: "139****9999", idCard: "3101**********5678", orderCount: 8, totalSpent: 980, lastTrip: "2026-02-22", status: "\u6B63\u5E38", source: "\u5C0F\u7A0B\u5E8F", isActive: true },
  { id: "P003", name: "\u738B\u4E94", phone: "137****7777", idCard: "3201**********9012", orderCount: 42, totalSpent: 6500, lastTrip: "2026-02-24", status: "\u6B63\u5E38", source: "\u5C0F\u7A0B\u5E8F", isActive: true },
  { id: "P004", name: "\u8D75\u516D", phone: "136****6666", idCard: "4201**********3456", orderCount: 3, totalSpent: 360, lastTrip: "2026-01-15", status: "\u6B63\u5E38", source: "\u540E\u53F0\u6DFB\u52A0", isActive: false },
  { id: "P005", name: "\u5B59\u4E03", phone: "135****5555", idCard: "6101**********7890", orderCount: 22, totalSpent: 4200, lastTrip: "2026-02-21", status: "\u9ED1\u540D\u5355", source: "\u5C0F\u7A0B\u5E8F", isActive: false },
  { id: "P006", name: "\u5468\u516B", phone: "134****4444", idCard: "3301**********1235", orderCount: 12, totalSpent: 1800, lastTrip: "2026-02-23", status: "\u6B63\u5E38", source: "\u5C0F\u7A0B\u5E8F", isActive: true },
  { id: "P007", name: "\u5434\u4E5D", phone: "133****3333", idCard: "1101**********5679", orderCount: 5, totalSpent: 750, lastTrip: "2026-02-20", status: "\u6B63\u5E38", source: "\u540E\u53F0\u6DFB\u52A0", isActive: true },
  { id: "P008", name: "\u90D1\u5341", phone: "132****2222", idCard: "3201**********9013", orderCount: 30, totalSpent: 4800, lastTrip: "2026-02-24", status: "\u6B63\u5E38", source: "\u5C0F\u7A0B\u5E8F", isActive: true },
]

export function PassengerTable({ onSelect, onBlacklist }: { onSelect: (p: any) => void; onBlacklist: (p: any) => void }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{"\u4E58\u5BA2\u5217\u8868"}</h2>
        <span className="text-xs text-muted-foreground">{"\u5171 "}{passengers.length}{" \u6761\u8BB0\u5F55"}</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs">{"\u4E58\u5BA2\u4FE1\u606F"}</TableHead>
            <TableHead className="text-xs">{"\u8BC1\u4EF6\u53F7"}</TableHead>
            <TableHead className="text-xs">{"\u8BA2\u5355\u6570"}</TableHead>
            <TableHead className="text-xs">{"\u7D2F\u8BA1\u6D88\u8D39"}</TableHead>
            <TableHead className="text-xs">{"\u6700\u8FD1\u51FA\u884C"}</TableHead>
            <TableHead className="text-xs">{"\u6E20\u9053"}</TableHead>
            <TableHead className="text-xs">{"\u72B6\u6001"}</TableHead>
            <TableHead className="text-xs">{"\u64CD\u4F5C"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {passengers.map(function(p) {
            var isBlacklisted = p.status === "\u9ED1\u540D\u5355"
            return (
              <TableRow
                key={p.id}
                className={cn("hover:bg-muted/30 cursor-pointer", isBlacklisted && "bg-destructive/5")}
                onClick={function() { onSelect(p) }}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.phone}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.idCard}</TableCell>
                <TableCell className="text-sm text-foreground">{p.orderCount}</TableCell>
                <TableCell className="text-sm text-foreground">{"\u00A5"}{p.totalSpent.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.lastTrip}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">{p.source}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px]",
                        isBlacklisted
                          ? "bg-destructive/15 text-destructive border-destructive/30"
                          : p.isActive
                            ? "bg-success/15 text-success border-success/30"
                            : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {p.status}
                    </Badge>
                    {p.isActive && !isBlacklisted && (
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 rounded hover:bg-muted transition-colors"
                      onClick={function(e) { e.stopPropagation(); onSelect(p) }}
                      aria-label={"\u67E5\u770B\u8BE6\u60C5"}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </button>
                    {!isBlacklisted && (
                      <button
                        className="p-1 rounded hover:bg-muted transition-colors"
                        onClick={function(e) { e.stopPropagation(); onBlacklist(p) }}
                        aria-label={"\u52A0\u5165\u9ED1\u540D\u5355"}
                      >
                        <ShieldOff className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{"\u5171 "}{passengers.length}{" \u6761"}</span>
        <div className="flex items-center gap-1">
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors" disabled>{"<"}</button>
          <button className="h-7 px-2.5 rounded bg-primary text-primary-foreground text-xs">1</button>
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors">{">"}</button>
        </div>
      </div>
    </div>
  )
}
