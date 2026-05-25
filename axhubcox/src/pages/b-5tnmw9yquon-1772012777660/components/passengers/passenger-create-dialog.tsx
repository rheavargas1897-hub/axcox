import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"

export function PassengerCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{"\u65B0\u5EFA\u4E58\u5BA2"}</SheetTitle>
          <SheetDescription>{"\u624B\u52A8\u6DFB\u52A0\u4E58\u5BA2\u4FE1\u606F"}</SheetDescription>
        </SheetHeader>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u59D3\u540D"}<span className="text-destructive"> *</span></label>
            <input
              type="text"
              placeholder={"\u8F93\u5165\u4E58\u5BA2\u59D3\u540D"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u624B\u673A\u53F7"}<span className="text-destructive"> *</span></label>
            <input
              type="tel"
              placeholder={"\u8F93\u5165\u624B\u673A\u53F7\u7801"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u8BC1\u4EF6\u7C7B\u578B"}</label>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option>{"\u8EAB\u4EFD\u8BC1"}</option>
              <option>{"\u62A4\u7167"}</option>
              <option>{"\u5176\u4ED6"}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u8BC1\u4EF6\u53F7\u7801"}<span className="text-destructive"> *</span></label>
            <input
              type="text"
              placeholder={"\u8F93\u5165\u8BC1\u4EF6\u53F7\u7801"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u5907\u6CE8"}</label>
            <textarea
              rows={3}
              placeholder={"\u53EF\u9009\u586B\u5199"}
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
              {"\u786E\u8BA4\u6DFB\u52A0"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
