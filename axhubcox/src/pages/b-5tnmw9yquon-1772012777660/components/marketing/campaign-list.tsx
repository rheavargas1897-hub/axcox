import React from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { cn } from "../../lib/utils"
import { Eye, Pencil, Power } from "lucide-react"

var statusStyles: Record<string, { className: string }> = {
  "\u8FDB\u884C\u4E2D": { className: "bg-success/15 text-success border-success/30" },
  "\u672A\u5F00\u59CB": { className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  "\u5DF2\u7ED3\u675F": { className: "bg-muted text-muted-foreground border-border" },
  "\u5DF2\u505C\u7528": { className: "bg-destructive/15 text-destructive border-destructive/30" },
}

var campaigns = [
  { id: "C001", name: "\u65B0\u5E74\u7279\u60E0\u5B63", type: "\u6298\u6263\u5238", discount: "8\u6298", startDate: "2026-01-01", endDate: "2026-03-31", totalIssued: 2000, used: 1420, status: "\u8FDB\u884C\u4E2D", routes: ["\u5168\u90E8\u8DEF\u7EBF"], budget: 20000, spent: 14200 },
  { id: "C002", name: "\u5468\u672B\u51CF\u514D\u6D3B\u52A8", type: "\u6EE1\u51CF\u5238", discount: "\u6EE180\u51CF15", startDate: "2026-02-01", endDate: "2026-02-28", totalIssued: 1500, used: 890, status: "\u8FDB\u884C\u4E2D", routes: ["\u5E7F\u5DDE-\u6DF1\u5733", "\u4E0A\u6D77-\u82CF\u5DDE"], budget: 15000, spent: 8900 },
  { id: "C003", name: "\u5B66\u751F\u4F18\u60E0\u5B63", type: "\u6298\u6263\u5238", discount: "7\u6298", startDate: "2026-03-01", endDate: "2026-06-30", totalIssued: 3000, used: 0, status: "\u672A\u5F00\u59CB", routes: ["\u5168\u90E8\u8DEF\u7EBF"], budget: 30000, spent: 0 },
  { id: "C004", name: "\u5143\u65E6\u62A2\u7968", type: "\u7ACB\u51CF\u5238", discount: "\u51CF20\u5143", startDate: "2025-12-30", endDate: "2026-01-02", totalIssued: 500, used: 480, status: "\u5DF2\u7ED3\u675F", routes: ["\u5317\u4EAC-\u5929\u6D25"], budget: 10000, spent: 9600 },
  { id: "C005", name: "\u65E9\u9E1F\u7279\u4EF7", type: "\u6298\u6263\u5238", discount: "6\u6298", startDate: "2026-02-15", endDate: "2026-04-15", totalIssued: 1000, used: 320, status: "\u8FDB\u884C\u4E2D", routes: ["\u5E7F\u5DDE-\u6DF1\u5733"], budget: 8000, spent: 3200 },
  { id: "C006", name: "\u8001\u5E74\u4EBA\u5173\u7231\u8BA1\u5212", type: "\u6EE1\u51CF\u5238", discount: "\u6EE160\u51CF20", startDate: "2026-02-01", endDate: "2026-12-31", totalIssued: 500, used: 180, status: "\u8FDB\u884C\u4E2D", routes: ["\u5168\u90E8\u8DEF\u7EBF"], budget: 10000, spent: 3600 },
  { id: "C007", name: "\u590F\u5B63\u63A8\u5E7F", type: "\u7ACB\u51CF\u5238", discount: "\u51CF10\u5143", startDate: "2026-06-01", endDate: "2026-08-31", totalIssued: 0, used: 0, status: "\u672A\u5F00\u59CB", routes: ["\u5168\u90E8\u8DEF\u7EBF"], budget: 25000, spent: 0 },
]

export function CampaignList({ onSelect }: { onSelect: (c: any) => void }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Filters */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u6D3B\u52A8\u540D\u79F0"}</label>
            <input type="text" placeholder={"\u641C\u7D22\u6D3B\u52A8"} className="h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u6D3B\u52A8\u7C7B\u578B"}</label>
            <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{"\u5168\u90E8"}</option>
              <option>{"\u6298\u6263\u5238"}</option>
              <option>{"\u6EE1\u51CF\u5238"}</option>
              <option>{"\u7ACB\u51CF\u5238"}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u72B6\u6001"}</label>
            <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{"\u5168\u90E8"}</option>
              <option>{"\u8FDB\u884C\u4E2D"}</option>
              <option>{"\u672A\u5F00\u59CB"}</option>
              <option>{"\u5DF2\u7ED3\u675F"}</option>
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
            <TableHead className="text-xs">{"\u6D3B\u52A8\u540D\u79F0"}</TableHead>
            <TableHead className="text-xs">{"\u7C7B\u578B/\u4F18\u60E0"}</TableHead>
            <TableHead className="text-xs">{"\u6709\u6548\u671F"}</TableHead>
            <TableHead className="text-xs">{"\u53D1\u653E/\u4F7F\u7528"}</TableHead>
            <TableHead className="text-xs">{"\u9884\u7B97\u6D88\u8017"}</TableHead>
            <TableHead className="text-xs">{"\u72B6\u6001"}</TableHead>
            <TableHead className="text-xs">{"\u64CD\u4F5C"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map(function(c) {
            var ss = statusStyles[c.status] || statusStyles["\u5DF2\u505C\u7528"]
            var usedRate = c.totalIssued > 0 ? Math.round((c.used / c.totalIssued) * 100) : 0
            var budgetRate = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0

            return (
              <TableRow key={c.id} className="hover:bg-muted/30 cursor-pointer" onClick={function() { onSelect(c) }}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <Badge variant="secondary" className="text-[10px] w-fit">{c.type}</Badge>
                    <span className="text-xs text-primary mt-0.5">{c.discount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs text-foreground">{c.startDate}</span>
                    <span className="text-xs text-muted-foreground">{"\u81F3 "}{c.endDate}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 min-w-[100px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{c.used}/{c.totalIssued}</span>
                      <span className="font-medium text-foreground">{usedRate}%</span>
                    </div>
                    <Progress value={usedRate} className="h-1.5" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 min-w-[100px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{"\u00A5"}{c.spent.toLocaleString()}</span>
                      <span className={cn("font-medium", budgetRate > 80 ? "text-destructive" : "text-foreground")}>{budgetRate}%</span>
                    </div>
                    <Progress
                      value={budgetRate}
                      className={cn("h-1.5", budgetRate > 80 && "[&>[data-slot=progress-indicator]]:bg-warning")}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[11px]", ss.className)}>{c.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 rounded hover:bg-muted transition-colors"
                      onClick={function(e) { e.stopPropagation(); onSelect(c) }}
                      aria-label={"\u67E5\u770B\u8BE6\u60C5"}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted transition-colors" aria-label={"\u7F16\u8F91"}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {c.status === "\u8FDB\u884C\u4E2D" && (
                      <button className="p-1 rounded hover:bg-muted transition-colors" aria-label={"\u505C\u7528"}>
                        <Power className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{"\u5171 "}{campaigns.length}{" \u6761\u8BB0\u5F55"}</span>
        <div className="flex items-center gap-1">
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors" disabled>{"<"}</button>
          <button className="h-7 px-2.5 rounded bg-primary text-primary-foreground text-xs">1</button>
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors">{">"}</button>
        </div>
      </div>
    </div>
  )
}
