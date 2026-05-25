import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { User, Phone, Bus, MapPin, Clock, AlertTriangle } from "lucide-react"

var channelData = [
  { channel: "\u7A97\u53E3", adult: 12, child: 2 },
  { channel: "\u5C0F\u7A0B\u5E8F", adult: 15, child: 1 },
  { channel: "\u643A\u7A0B", adult: 8, child: 0 },
]

export function ScheduleDetailDrawer({ schedule, open, onClose }: { schedule: any; open: boolean; onClose: () => void }) {
  if (!schedule) return null

  var soldRate = Math.round((schedule.sold / schedule.total) * 100)
  var verifyRate = schedule.sold > 0 ? Math.round((schedule.verified / schedule.sold) * 100) : 0
  var remaining = schedule.total - schedule.sold
  var pendingVerify = schedule.sold - schedule.verified

  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            {"\u73ED\u6B21\u8BE6\u60C5 - "}{schedule.id}
          </SheetTitle>
          <SheetDescription>{schedule.route}{" | \u8BA1\u5212\u53D1\u8F66 "}{schedule.departure}</SheetDescription>
        </SheetHeader>

        {/* Real-time indicators */}
        <div className="grid grid-cols-4 gap-3 px-4 py-3">
          {[
            { label: "\u5DF2\u552E", value: schedule.sold, color: "text-primary" },
            { label: "\u4F59\u7968", value: remaining, color: remaining <= 5 ? "text-destructive" : "text-foreground" },
            { label: "\u5DF2\u6838\u9500", value: schedule.verified, color: "text-success" },
            { label: "\u5F85\u6838\u9500", value: pendingVerify, color: "text-warning-foreground" },
          ].map(function(item) {
            return (
              <div key={item.label} className="flex flex-col items-center p-2 rounded-md bg-muted/50">
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <span className={"text-lg font-semibold " + item.color}>{item.value}</span>
              </div>
            )
          })}
        </div>

        {/* Schedule Info Cards */}
        <div className="px-4 py-2 flex flex-col gap-2">
          <div className="flex items-center gap-4 p-3 rounded-md border border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{"\u8F66\u724C:"}</span>
              <span className="text-sm font-medium text-foreground">{schedule.plate}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{"\u53F8\u673A:"}</span>
              <span className="text-sm font-medium text-foreground">{schedule.driver}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">138****8888</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="inventory" className="px-4 py-2">
          <TabsList className="w-full">
            <TabsTrigger value="inventory">{"\u5E93\u5B58\u660E\u7EC6"}</TabsTrigger>
            <TabsTrigger value="verify">{"\u6838\u9500\u8D8B\u52BF"}</TabsTrigger>
            <TabsTrigger value="location">{"\u8F66\u8F86\u4F4D\u7F6E"}</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-3">
            <div className="flex flex-col gap-3">
              {/* Summary bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{"\u5E93\u5B58\u4F7F\u7528\u7387"}</span>
                <div className="flex-1">
                  <Progress value={soldRate} className="h-2" />
                </div>
                <span className="text-xs font-medium text-foreground">{soldRate}%</span>
              </div>

              {/* Channel breakdown */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs font-medium text-muted-foreground">{"\u6E20\u9053"}</th>
                    <th className="text-center py-2 text-xs font-medium text-muted-foreground">{"\u6210\u4EBA\u7968"}</th>
                    <th className="text-center py-2 text-xs font-medium text-muted-foreground">{"\u513F\u7AE5\u7968"}</th>
                    <th className="text-right py-2 text-xs font-medium text-muted-foreground">{"\u5408\u8BA1"}</th>
                  </tr>
                </thead>
                <tbody>
                  {channelData.map(function(ch) {
                    return (
                      <tr key={ch.channel} className="border-b border-border/50">
                        <td className="py-2 text-foreground">{ch.channel}</td>
                        <td className="py-2 text-center text-foreground">{ch.adult}</td>
                        <td className="py-2 text-center text-foreground">{ch.child}</td>
                        <td className="py-2 text-right font-medium text-foreground">{ch.adult + ch.child}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="verify" className="mt-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{"\u53D1\u8F66\u524D\u540E30\u5206\u949F\u6838\u9500\u5206\u5E03"}</span>
              </div>
              {/* Simple bar chart representation */}
              <div className="flex items-end gap-1 h-32">
                {[2,5,8,15,22,28,18,10,5,3].map(function(v, i) {
                  var h = Math.round((v / 28) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                        style={{ height: h + "%" }}
                      />
                      <span className="text-[9px] text-muted-foreground">{(-25 + i * 5) > 0 ? "+" : ""}{-25 + i * 5}{"'"}</span>
                    </div>
                  )
                })}
              </div>
              <div className="text-center text-[10px] text-muted-foreground">{"\u2191 \u53D1\u8F66\u65F6\u95F4\u57FA\u51C6\u7EBF"}</div>
            </div>
          </TabsContent>

          <TabsContent value="location" className="mt-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{"\u5F53\u524D\u4F4D\u7F6E: "}{schedule.location}</span>
              </div>
              {/* Map placeholder */}
              <div className="w-full h-48 rounded-lg bg-muted border border-border flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <MapPin className="w-8 h-8" />
                  <span className="text-xs">{"\u5730\u56FE\u533A\u57DF - "}{schedule.route}</span>
                  <span className="text-[10px]">{"\u5F53\u524D\u4F4D\u4E8E: "}{schedule.location}</span>
                </div>
              </div>
              {schedule.tag === "\u5B9A\u4F4D\u4E22\u5931" && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-xs text-destructive">{"\u8B66\u544A: \u8F66\u8F86\u8D85\u8FC710\u5206\u949F\u672AGPS\u4FE1\u53F7\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u5907"}</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Alert Section */}
        {schedule.tag && (
          <div className="px-4 py-3 mt-2">
            <div className="flex items-center justify-between p-3 rounded-md bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-xs font-medium text-destructive">{"\u5F02\u5E38\u544A\u8B66: "}{schedule.tag}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{"\u70B9\u51FB\u5904\u7406\u5F02\u5E38\u5E76\u586B\u5199\u5907\u6CE8"}</p>
                </div>
              </div>
              <button className="h-7 px-3 rounded-md border border-destructive/30 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                {"\u5904\u7406\u5F02\u5E38"}
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
