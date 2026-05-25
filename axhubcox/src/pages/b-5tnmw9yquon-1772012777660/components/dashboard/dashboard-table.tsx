import React from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { cn } from "../../lib/utils"
import { MapPin, MessageSquare, FileDown, Eye } from "lucide-react"

var statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "\u672A\u5F00\u59CB", className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  running: { label: "\u8FDB\u884C\u4E2D", className: "bg-success/15 text-success border-success/30" },
  delayed: { label: "\u5EF6\u8BEF", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  cancelled: { label: "\u5DF2\u53D6\u6D88", className: "bg-destructive/15 text-destructive border-destructive/30" },
}

var scheduleData = [
  { id: "BC20260224001", route: "\u5E7F\u5DDE-\u6DF1\u5733", departure: "08:30", status: "running", sold: 38, total: 45, verified: 35, plate: "\u7CA4A12345", driver: "\u674E\u5E08\u5085", location: "\u4E1C\u839E\u5E02\u533A", tag: null },
  { id: "BC20260224002", route: "\u5317\u4EAC-\u5929\u6D25", departure: "09:00", status: "running", sold: 50, total: 50, verified: 48, plate: "\u4EACA56789", driver: "\u738B\u5E08\u5085", location: "\u5ECA\u574A\u670D\u52A1\u533A", tag: null },
  { id: "BC20260224003", route: "\u4E0A\u6D77-\u82CF\u5DDE", departure: "10:00", status: "pending", sold: 22, total: 40, verified: 0, plate: "\u6CAAB11111", driver: "\u5F20\u5E08\u5085", location: "\u4E0A\u6D77\u5BA2\u8FD0\u7AD9", tag: null },
  { id: "BC20260224004", route: "\u6B66\u6C49-\u957F\u6C99", departure: "07:00", status: "delayed", sold: 30, total: 45, verified: 8, plate: "\u9102A22222", driver: "\u9648\u5E08\u5085", location: "\u54B8\u5B81\u670D\u52A1\u533A", tag: "\u6838\u9500\u7387\u4F4E" },
  { id: "BC20260224005", route: "\u897F\u5B89-\u6210\u90FD", departure: "11:30", status: "pending", sold: 45, total: 45, verified: 0, plate: "\u9655A33333", driver: "\u8D75\u5E08\u5085", location: "\u897F\u5B89\u5BA2\u8FD0\u7AD9", tag: "\u5E93\u5B58\u5F02\u5E38" },
  { id: "BC20260224006", route: "\u676D\u5DDE-\u5B81\u6CE2", departure: "08:00", status: "running", sold: 28, total: 35, verified: 25, plate: "\u6D59A44444", driver: "\u5468\u5E08\u5085", location: "\u7ECD\u5174\u670D\u52A1\u533A", tag: null },
  { id: "BC20260224007", route: "\u6210\u90FD-\u91CD\u5E86", departure: "13:00", status: "pending", sold: 15, total: 50, verified: 0, plate: "\u5DDD A55555", driver: "\u5434\u5E08\u5085", location: "\u6210\u90FD\u5BA2\u8FD0\u7AD9", tag: null },
  { id: "BC20260224008", route: "\u5357\u4EAC-\u5408\u80A5", departure: "06:30", status: "running", sold: 42, total: 45, verified: 5, plate: "\u82CFAB6666", driver: "\u90D1\u5E08\u5085", location: "\u6ED1\u5DDE\u670D\u52A1\u533A", tag: "\u6838\u9500\u7387\u4F4E" },
  { id: "BC20260224009", route: "\u5E7F\u5DDE-\u73E0\u6D77", departure: "14:30", status: "cancelled", sold: 5, total: 40, verified: 0, plate: "\u7CA4B77777", driver: "\u5B59\u5E08\u5085", location: "-", tag: null },
  { id: "BC20260224010", route: "\u957F\u6C99-\u5357\u660C", departure: "15:00", status: "pending", sold: 33, total: 45, verified: 0, plate: "\u6E58A88888", driver: "\u6731\u5E08\u5085", location: "\u957F\u6C99\u5BA2\u8FD0\u7AD9", tag: null },
]

export function DashboardTable({ onSelectSchedule }: { onSelectSchedule: (s: any) => void }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{"\u73ED\u6B21\u5217\u8868"}</h2>
        <span className="text-xs text-muted-foreground">{"\u5171 "}{scheduleData.length}{" \u4E2A\u73ED\u6B21"}</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs">{"\u73ED\u6B21\u53F7"}</TableHead>
            <TableHead className="text-xs">{"\u7EBF\u8DEF"}</TableHead>
            <TableHead className="text-xs">{"\u8BA1\u5212\u53D1\u8F66"}</TableHead>
            <TableHead className="text-xs">{"\u72B6\u6001"}</TableHead>
            <TableHead className="text-xs">{"\u5E93\u5B58\u552E\u5356"}</TableHead>
            <TableHead className="text-xs">{"\u6838\u9500\u72B6\u6001"}</TableHead>
            <TableHead className="text-xs">{"\u8F66\u8F86\u4F4D\u7F6E"}</TableHead>
            <TableHead className="text-xs">{"\u64CD\u4F5C"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scheduleData.map(function(item) {
            var s = statusMap[item.status]
            var soldRate = Math.round((item.sold / item.total) * 100)
            var verifyRate = item.sold > 0 ? Math.round((item.verified / item.sold) * 100) : 0
            var isSoldOut = soldRate >= 100
            var isLowVerify = item.status === "running" && verifyRate < 20

            return (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={function() { onSelectSchedule(item) }}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{item.id}</span>
                    {item.tag && (
                      <Badge variant="destructive" className="mt-0.5 text-[10px] px-1.5 py-0 w-fit">
                        {item.tag}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-foreground">{item.route}</TableCell>
                <TableCell className="text-sm text-foreground">{item.departure}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[11px]", s.className)}>
                    {s.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 min-w-[120px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.sold}/{item.total}</span>
                      <span className={cn("font-medium", isSoldOut ? "text-destructive" : "text-foreground")}>{soldRate}%</span>
                    </div>
                    <Progress
                      value={soldRate}
                      className={cn("h-1.5", isSoldOut && "[&>[data-slot=progress-indicator]]:bg-destructive")}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 min-w-[120px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.verified}/{item.sold}</span>
                      <span className={cn("font-medium", isLowVerify ? "text-destructive" : "text-foreground")}>{verifyRate}%</span>
                    </div>
                    <Progress
                      value={verifyRate}
                      className={cn("h-1.5", isLowVerify && "[&>[data-slot=progress-indicator]]:bg-destructive")}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[100px]">{item.location}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 rounded hover:bg-muted transition-colors"
                      aria-label={"\u67E5\u770B\u8BE6\u60C5"}
                      onClick={function(e) { e.stopPropagation(); onSelectSchedule(item) }}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted transition-colors" aria-label={"\u901A\u77E5\u53F8\u673A"}>
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted transition-colors" aria-label={"\u5BFC\u51FA\u540D\u5355"}>
                      <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
