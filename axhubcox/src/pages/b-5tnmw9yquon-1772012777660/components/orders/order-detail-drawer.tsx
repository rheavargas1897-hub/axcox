import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../lib/utils"
import { CheckCircle, Circle, Clock, XCircle, User, CreditCard, Ticket, FileText, RotateCcw, MessageSquare, Printer } from "lucide-react"

var statusStyles: Record<string, { className: string }> = {
  "\u5F85\u652F\u4ED8": { className: "bg-warning/15 text-warning-foreground border-warning/30" },
  "\u5DF2\u652F\u4ED8": { className: "bg-success/15 text-success border-success/30" },
  "\u5DF2\u4E58\u8F66": { className: "bg-primary/15 text-primary border-primary/30" },
  "\u672A\u4E58\u8F66": { className: "bg-muted text-muted-foreground border-border" },
  "\u5DF2\u9000\u6B3E": { className: "bg-muted text-muted-foreground border-border" },
  "\u90E8\u5206\u9000\u6B3E": { className: "bg-chart-5/15 text-chart-5 border-chart-5/30" },
  "\u53D6\u6D88\u8BA2\u5355": { className: "bg-destructive/15 text-destructive border-destructive/30" },
}

var auditLogs = [
  { time: "2026-02-24 10:02:01", operator: "\u7CFB\u7EDF", action: "\u652F\u4ED8\u6210\u529F", note: "\u5FAE\u4FE1\u652F\u4ED8\u56DE\u8C03" },
  { time: "2026-02-24 10:00:00", operator: "\u7CFB\u7EDF", action: "\u521B\u5EFA\u8BA2\u5355", note: "\u5C0F\u7A0B\u5E8F\u4E0B\u5355" },
]

export function OrderDetailDrawer({ order, open, onClose }: { order: any; open: boolean; onClose: () => void }) {
  if (!order) return null
  var ss = statusStyles[order.status] || statusStyles["\u53D6\u6D88\u8BA2\u5355"]

  var steps = [
    { label: "\u4E0B\u5355", time: order.time, done: true },
    { label: "\u652F\u4ED8", time: order.paid > 0 ? order.time.replace(":00", ":02") : null, done: order.paid > 0 },
    { label: "\u53D1\u8F66", time: order.departure, done: order.status === "\u5DF2\u4E58\u8F66" || order.status === "\u672A\u4E58\u8F66" },
    { label: "\u6838\u9500", time: order.subStatus && order.subStatus.includes("\u6838\u9500") ? order.subStatus : null, done: order.status === "\u5DF2\u4E58\u8F66" },
  ]

  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            {"\u8BA2\u5355\u8BE6\u60C5 - "}{order.id}
            <Badge variant="outline" className={cn("text-[11px]", ss.className)}>{order.status}</Badge>
          </SheetTitle>
          <SheetDescription>{order.route}{" | \u53D1\u8F66: "}{order.departure}</SheetDescription>
        </SheetHeader>

        <div className="px-4 py-3 flex flex-col gap-5">
          {/* Status Timeline */}
          <div className="flex items-center gap-0 px-2">
            {steps.map(function(step, i) {
              var isLast = i === steps.length - 1
              return (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-1">
                    {step.done ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/40" />
                    )}
                    <span className={cn("text-xs font-medium", step.done ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
                    <span className="text-[10px] text-muted-foreground">{step.time || "-"}</span>
                  </div>
                  {!isLast && (
                    <div className={cn("flex-1 h-px mx-2 mt-[-16px]", step.done ? "bg-primary" : "bg-border")} />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {order.status === "\u5DF2\u652F\u4ED8" && (
              <>
                <button className="h-7 px-3 rounded-md border border-input text-xs hover:bg-muted flex items-center gap-1.5">
                  <XCircle className="w-3 h-3" />{"\u53D6\u6D88\u8BA2\u5355"}
                </button>
                <button className="h-7 px-3 rounded-md border border-destructive/30 text-xs text-destructive hover:bg-destructive/5 flex items-center gap-1.5">
                  <RotateCcw className="w-3 h-3" />{"\u53D1\u8D77\u9000\u6B3E"}
                </button>
              </>
            )}
            <button className="h-7 px-3 rounded-md border border-input text-xs hover:bg-muted flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />{"\u91CD\u53D1\u77ED\u4FE1"}
            </button>
            <button className="h-7 px-3 rounded-md border border-input text-xs hover:bg-muted flex items-center gap-1.5">
              <Printer className="w-3 h-3" />{"\u6253\u5370\u5BA2\u7968"}
            </button>
            <button className="h-7 px-3 rounded-md border border-input text-xs hover:bg-muted flex items-center gap-1.5">
              <FileText className="w-3 h-3" />{"\u6DFB\u52A0\u5907\u6CE8"}
            </button>
          </div>

          {/* A: Passenger Info */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u4E58\u5BA2\u4FE1\u606F"}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">{"\u8D2D\u7968\u4EBA"}</span>
                <p className="text-sm text-foreground">{order.passenger}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u8054\u7CFB\u7535\u8BDD"}</span>
                <p className="text-sm text-foreground">{order.phone}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u8BC1\u4EF6\u53F7"}</span>
                <p className="text-sm text-foreground">4401**********1234</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u7968\u79CD"}</span>
                <p className="text-sm text-foreground">{"\u6210\u4EBA\u7968"}</p>
              </div>
            </div>
          </div>

          {/* B: Schedule Info */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u73ED\u6B21\u4FE1\u606F"}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">{"\u7EBF\u8DEF"}</span>
                <p className="text-sm font-medium text-foreground">{order.route}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u53D1\u8F66\u65F6\u95F4"}</span>
                <p className="text-sm text-foreground">{order.departure}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u5EA7\u4F4D\u53F7"}</span>
                <p className="text-sm text-foreground">{order.seat}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u68C0\u7968\u53E3"}</span>
                <p className="text-sm text-foreground">A1</p>
              </div>
            </div>
          </div>

          {/* C: Payment Details */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{"\u652F\u4ED8\u660E\u7EC6"}</h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{"\u5E94\u4ED8\u91D1\u989D"}</span>
                <span className="text-foreground">{"\u00A5"}{order.amount.toFixed(2)}</span>
              </div>
              {order.amount !== order.paid && order.paid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{"\u4F18\u60E0\u5238"}</span>
                  <span className="text-success">{"-\u00A5"}{(order.amount - order.paid).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium border-t border-border pt-2">
                <span className="text-foreground">{"\u5B9E\u4ED8\u91D1\u989D"}</span>
                <span className="text-foreground">{"\u00A5"}{order.paid.toFixed(2)}</span>
              </div>
              {order.refunded > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{"\u5DF2\u9000\u91D1\u989D"}</span>
                  <span className="text-destructive">{"\u00A5"}{order.refunded.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{"\u652F\u4ED8\u65B9\u5F0F: "}{order.payment}</span>
                <span>{"\u6D41\u6C34\u53F7: WX2026..."}</span>
              </div>
            </div>
          </div>

          {/* D: Verification Record */}
          {(order.status === "\u5DF2\u4E58\u8F66") && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <h3 className="text-sm font-semibold text-foreground">{"\u6838\u9500\u8BB0\u5F55"}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">{"\u6838\u9500\u72B6\u6001"}</span>
                  <p className="text-sm text-success">{"\u5DF2\u6838\u9500"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{"\u6838\u9500\u65F6\u95F4"}</span>
                  <p className="text-sm text-foreground">{order.subStatus}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{"\u6838\u9500\u70B9"}</span>
                  <p className="text-sm text-foreground">{"\u5E7F\u5DDE\u5357\u7AD9A1\u68C0\u7968\u53E3"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{"\u6838\u9500\u65B9\u5F0F"}</span>
                  <p className="text-sm text-foreground">{"\u95F8\u673A\u626B\u7801"}</p>
                </div>
              </div>
            </div>
          )}

          {/* E: Refund Record */}
          {order.refunded > 0 && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <RotateCcw className="w-4 h-4 text-destructive" />
                <h3 className="text-sm font-semibold text-foreground">{"\u9000\u6B3E\u8BB0\u5F55"}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">{"\u9000\u6B3E\u91D1\u989D"}</span>
                  <p className="text-sm text-foreground">{"\u00A5"}{order.refunded.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{"\u624B\u7EED\u8D39"}</span>
                  <p className="text-sm text-foreground">{"\u00A5"}{(order.amount - order.paid > 0 ? 0 : 5).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{"\u9000\u6B3E\u8DEF\u5F84"}</span>
                  <p className="text-sm text-foreground">{"\u539F\u8DEF\u9000\u56DE"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{"\u72B6\u6001"}</span>
                  <p className="text-sm text-success">{"\u6210\u529F"}</p>
                </div>
              </div>
            </div>
          )}

          {/* F: Audit Log */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">{"\u64CD\u4F5C\u65E5\u5FD7"}</h3>
            </div>
            <div className="flex flex-col gap-1">
              {auditLogs.map(function(log, i) {
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-36">{log.time}</span>
                      <span className="text-xs text-muted-foreground w-12">{log.operator}</span>
                      <span className="text-sm text-foreground">{log.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.note}</span>
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
