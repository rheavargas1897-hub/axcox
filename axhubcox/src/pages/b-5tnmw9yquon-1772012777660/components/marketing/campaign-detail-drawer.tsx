import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { cn } from "../../lib/utils"
import { Calendar, Tag, MapPin, BarChart3, DollarSign } from "lucide-react"

var statusStyles: Record<string, { className: string }> = {
  "\u8FDB\u884C\u4E2D": { className: "bg-success/15 text-success border-success/30" },
  "\u672A\u5F00\u59CB": { className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  "\u5DF2\u7ED3\u675F": { className: "bg-muted text-muted-foreground border-border" },
  "\u5DF2\u505C\u7528": { className: "bg-destructive/15 text-destructive border-destructive/30" },
}

var dailyUsage = [
  { date: "02-18", count: 45 },
  { date: "02-19", count: 62 },
  { date: "02-20", count: 38 },
  { date: "02-21", count: 71 },
  { date: "02-22", count: 55 },
  { date: "02-23", count: 80 },
  { date: "02-24", count: 68 },
]

export function CampaignDetailDrawer({ campaign, open, onClose }: { campaign: any; open: boolean; onClose: () => void }) {
  if (!campaign) return null
  var ss = statusStyles[campaign.status] || statusStyles["\u5DF2\u505C\u7528"]
  var usedRate = campaign.totalIssued > 0 ? Math.round((campaign.used / campaign.totalIssued) * 100) : 0
  var budgetRate = campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0
  var maxCount = Math.max.apply(null, dailyUsage.map(function(d) { return d.count }))

  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            {"\u6D3B\u52A8\u8BE6\u60C5 - "}{campaign.name}
            <Badge variant="outline" className={cn("text-[11px]", ss.className)}>{campaign.status}</Badge>
          </SheetTitle>
          <SheetDescription>{campaign.type}{" | "}{campaign.discount}</SheetDescription>
        </SheetHeader>

        <div className="px-4 py-3 flex flex-col gap-5">
          {/* Basic Info */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u57FA\u672C\u4FE1\u606F"}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">{"\u6D3B\u52A8\u7C7B\u578B"}</span>
                <p className="text-sm text-foreground">{campaign.type}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u4F18\u60E0\u5F3A\u5EA6"}</span>
                <p className="text-sm font-medium text-primary">{campaign.discount}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u5F00\u59CB\u65E5\u671F"}</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <p className="text-sm text-foreground">{campaign.startDate}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u7ED3\u675F\u65E5\u671F"}</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <p className="text-sm text-foreground">{campaign.endDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Applicable Routes */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u9002\u7528\u8DEF\u7EBF"}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {campaign.routes.map(function(r: string) {
                return <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
              })}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u4F7F\u7528\u7EDF\u8BA1"}</h3>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{"\u53D1\u653E\u91CF / \u4F7F\u7528\u91CF"}</span>
                  <span className="text-foreground font-medium">{campaign.used}{" / "}{campaign.totalIssued}</span>
                </div>
                <Progress value={usedRate} className="h-2" />
                <span className="text-xs text-muted-foreground mt-1">{"\u6838\u9500\u7387: "}{usedRate}{"%"}</span>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u9884\u7B97\u6D88\u8017"}</h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{"\u603B\u9884\u7B97"}</span>
                <span className="text-foreground">{"\u00A5"}{campaign.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{"\u5DF2\u82B1\u8D39"}</span>
                <span className={cn("font-medium", budgetRate > 80 ? "text-destructive" : "text-foreground")}>{"\u00A5"}{campaign.spent.toLocaleString()}</span>
              </div>
              <Progress
                value={budgetRate}
                className={cn("h-2", budgetRate > 80 && "[&>[data-slot=progress-indicator]]:bg-warning")}
              />
              <span className="text-xs text-muted-foreground">{"\u5269\u4F59\u9884\u7B97: \u00A5"}{(campaign.budget - campaign.spent).toLocaleString()}{" ("}{100 - budgetRate}{"%)"}</span>
            </div>
          </div>

          {/* Daily Usage Chart */}
          {campaign.used > 0 && (
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">{"\u8FD17\u65E5\u6838\u9500\u8D8B\u52BF"}</h3>
              <div className="flex items-end gap-1.5 h-24">
                {dailyUsage.map(function(d) {
                  var h = maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">{d.count}</span>
                      <div
                        className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors"
                        style={{ height: h + "%" }}
                      />
                      <span className="text-[9px] text-muted-foreground">{d.date}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {campaign.status === "\u8FDB\u884C\u4E2D" && (
              <button className="h-8 px-3 rounded-md border border-destructive/30 text-xs text-destructive hover:bg-destructive/5 transition-colors">
                {"\u505C\u7528\u6D3B\u52A8"}
              </button>
            )}
            {campaign.status === "\u672A\u5F00\u59CB" && (
              <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                {"\u7ACB\u5373\u542F\u52A8"}
              </button>
            )}
            <button className="h-8 px-3 rounded-md border border-input text-xs hover:bg-muted transition-colors">
              {"\u7F16\u8F91\u6D3B\u52A8"}
            </button>
            <button className="h-8 px-3 rounded-md border border-input text-xs hover:bg-muted transition-colors">
              {"\u5BFC\u51FA\u62A5\u8868"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
