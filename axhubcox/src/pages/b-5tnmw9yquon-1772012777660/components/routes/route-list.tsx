import React from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Switch } from "../../components/ui/switch"
import { cn } from "../../lib/utils"
import { Eye, Pencil, MapPin } from "lucide-react"

var routes = [
  { id: "R001", name: "\u5E7F\u5DDE-\u6DF1\u5733", from: "\u5E7F\u5DDE\u5357\u7AD9", to: "\u6DF1\u5733\u798F\u7530\u7AD9", distance: 140, duration: "2h", stops: 3, basePrice: 100, status: true, scheduleCount: 12, todayRevenue: 8600 },
  { id: "R002", name: "\u5317\u4EAC-\u5929\u6D25", from: "\u5317\u4EAC\u5357\u7AD9", to: "\u5929\u6D25\u4E2D\u5FC3\u7AD9", distance: 120, duration: "1.5h", stops: 2, basePrice: 60, status: true, scheduleCount: 8, todayRevenue: 3200 },
  { id: "R003", name: "\u4E0A\u6D77-\u82CF\u5DDE", from: "\u4E0A\u6D77\u5357\u7AD9", to: "\u82CF\u5DDE\u5317\u7AD9", distance: 100, duration: "1.5h", stops: 2, basePrice: 45, status: true, scheduleCount: 10, todayRevenue: 4100 },
  { id: "R004", name: "\u6B66\u6C49-\u957F\u6C99", from: "\u6B66\u6C49\u5929\u6CB3\u7AD9", to: "\u957F\u6C99\u706B\u8F66\u7AD9", distance: 350, duration: "4h", stops: 4, basePrice: 120, status: true, scheduleCount: 6, todayRevenue: 5400 },
  { id: "R005", name: "\u897F\u5B89-\u6210\u90FD", from: "\u897F\u5B89\u57CE\u5317\u7AD9", to: "\u6210\u90FD\u4E1C\u7AD9", distance: 700, duration: "8h", stops: 6, basePrice: 200, status: true, scheduleCount: 4, todayRevenue: 6800 },
  { id: "R006", name: "\u676D\u5DDE-\u5B81\u6CE2", from: "\u676D\u5DDE\u4E1C\u7AD9", to: "\u5B81\u6CE2\u5BA2\u8FD0\u4E2D\u5FC3", distance: 160, duration: "2h", stops: 3, basePrice: 75, status: false, scheduleCount: 0, todayRevenue: 0 },
  { id: "R007", name: "\u6210\u90FD-\u91CD\u5E86", from: "\u6210\u90FD\u5317\u7AD9", to: "\u91CD\u5E86\u4E3B\u57CE\u7AD9", distance: 320, duration: "3.5h", stops: 4, basePrice: 150, status: true, scheduleCount: 5, todayRevenue: 4500 },
  { id: "R008", name: "\u5357\u4EAC-\u5408\u80A5", from: "\u5357\u4EAC\u5357\u7AD9", to: "\u5408\u80A5\u5BA2\u8FD0\u7AD9", distance: 300, duration: "3h", stops: 3, basePrice: 90, status: true, scheduleCount: 7, todayRevenue: 3800 },
]

export function RouteList({ onSelect }: { onSelect: (route: any) => void }) {
  var _filter = React.useState("")
  var filter = _filter[0]
  var setFilter = _filter[1]

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Filters */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u8DEF\u7EBF\u540D\u79F0"}</label>
            <input
              type="text"
              value={filter}
              onChange={function(e) { setFilter(e.target.value) }}
              placeholder={"\u641C\u7D22\u8DEF\u7EBF\u540D\u79F0\u6216\u7AD9\u70B9"}
              className="h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u72B6\u6001"}</label>
            <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{"\u5168\u90E8"}</option>
              <option>{"\u5DF2\u542F\u7528"}</option>
              <option>{"\u5DF2\u505C\u7528"}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u6392\u5E8F"}</label>
            <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option>{"\u8425\u6536\u964D\u5E8F"}</option>
              <option>{"\u73ED\u6B21\u6570\u964D\u5E8F"}</option>
              <option>{"\u8DDD\u79BB\u5347\u5E8F"}</option>
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
            <TableHead className="text-xs">{"\u8DEF\u7EBF\u540D\u79F0"}</TableHead>
            <TableHead className="text-xs">{"\u8D77\u59CB\u7AD9-\u7EC8\u70B9\u7AD9"}</TableHead>
            <TableHead className="text-xs">{"\u8DDD\u79BB/\u65F6\u957F"}</TableHead>
            <TableHead className="text-xs">{"\u7ECF\u505C\u7AD9"}</TableHead>
            <TableHead className="text-xs">{"\u57FA\u7840\u7968\u4EF7"}</TableHead>
            <TableHead className="text-xs">{"\u4ECA\u65E5\u73ED\u6B21"}</TableHead>
            <TableHead className="text-xs">{"\u4ECA\u65E5\u8425\u6536"}</TableHead>
            <TableHead className="text-xs">{"\u662F\u5426\u542F\u7528"}</TableHead>
            <TableHead className="text-xs">{"\u64CD\u4F5C"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map(function(route) {
            return (
              <TableRow key={route.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{route.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{route.from}</span>
                    <span className="text-xs text-muted-foreground">{"\u2192 "}{route.to}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{route.distance}{"km"}</span>
                    <span className="text-xs text-muted-foreground">{"\u7EA6"}{route.duration}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">{route.stops}{"\u7AD9"}</Badge>
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground">{"\u00A5"}{route.basePrice}</TableCell>
                <TableCell className="text-sm text-foreground">{route.scheduleCount}{"\u73ED"}</TableCell>
                <TableCell>
                  <span className={cn("text-sm font-medium", route.todayRevenue > 0 ? "text-foreground" : "text-muted-foreground")}>
                    {"\u00A5"}{route.todayRevenue.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <Switch checked={route.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 rounded hover:bg-muted transition-colors"
                      onClick={function() { onSelect(route) }}
                      aria-label={"\u67E5\u770B\u8BE6\u60C5"}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted transition-colors" aria-label={"\u7F16\u8F91"}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
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
        <span className="text-xs text-muted-foreground">{"\u5171 "}{routes.length}{" \u6761\u8BB0\u5F55"}</span>
        <div className="flex items-center gap-1">
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors" disabled>{"<"}</button>
          <button className="h-7 px-2.5 rounded bg-primary text-primary-foreground text-xs">1</button>
          <button className="h-7 px-2.5 rounded border border-input text-xs hover:bg-muted transition-colors">{">"}</button>
        </div>
      </div>
    </div>
  )
}
