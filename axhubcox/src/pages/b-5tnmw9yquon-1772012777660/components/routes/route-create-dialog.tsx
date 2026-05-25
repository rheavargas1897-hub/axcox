import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"

export function RouteCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{"\u65B0\u5EFA\u8DEF\u7EBF"}</SheetTitle>
          <SheetDescription>{"\u6DFB\u52A0\u65B0\u7684\u8FD0\u8425\u8DEF\u7EBF"}</SheetDescription>
        </SheetHeader>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u8DEF\u7EBF\u540D\u79F0"}<span className="text-destructive"> *</span></label>
            <input
              type="text"
              placeholder={"\u4F8B\u5982: \u5E7F\u5DDE-\u6DF1\u5733"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u8D77\u59CB\u7AD9"}<span className="text-destructive"> *</span></label>
            <input
              type="text"
              placeholder={"\u8F93\u5165\u8D77\u59CB\u7AD9\u540D\u79F0"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u7EC8\u70B9\u7AD9"}<span className="text-destructive"> *</span></label>
            <input
              type="text"
              placeholder={"\u8F93\u5165\u7EC8\u70B9\u7AD9\u540D\u79F0"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{"\u8DDD\u79BB(km)"}<span className="text-destructive"> *</span></label>
              <input
                type="number"
                placeholder="0"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{"\u9884\u4F30\u65F6\u957F"}<span className="text-destructive"> *</span></label>
              <input
                type="text"
                placeholder={"\u4F8B\u5982: 2h"}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u57FA\u7840\u7968\u4EF7(\u5143)"}<span className="text-destructive"> *</span></label>
            <input
              type="number"
              placeholder="0"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u7ECF\u505C\u7AD9\u70B9"}</label>
            <textarea
              rows={3}
              placeholder={"\u6BCF\u884C\u4E00\u4E2A\u7AD9\u70B9\u540D\u79F0"}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-md border border-input text-sm hover:bg-muted transition-colors"
            >
              {"\u53D6\u6D88"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {"\u786E\u8BA4\u521B\u5EFA"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
