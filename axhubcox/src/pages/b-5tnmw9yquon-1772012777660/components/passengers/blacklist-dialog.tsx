import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"
import { AlertTriangle } from "lucide-react"

export function BlacklistDialog({ target, open, onClose }: { target: any; open: boolean; onClose: () => void }) {
  if (!target) return null

  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {"\u52A0\u5165\u9ED1\u540D\u5355"}
          </SheetTitle>
          <SheetDescription>{"\u5C06 "}{target.name}{" \u52A0\u5165\u9ED1\u540D\u5355\u540E\uFF0C\u8BE5\u4E58\u5BA2\u5C06\u65E0\u6CD5\u8D2D\u7968"}</SheetDescription>
        </SheetHeader>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">{"\u59D3\u540D"}</span>
                <p className="text-foreground font-medium">{target.name}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u624B\u673A"}</span>
                <p className="text-foreground">{target.phone}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u8BA2\u5355\u6570"}</span>
                <p className="text-foreground">{target.orderCount}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{"\u7D2F\u8BA1\u6D88\u8D39"}</span>
                <p className="text-foreground">{"\u00A5"}{target.totalSpent}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u62C9\u9ED1\u539F\u56E0"}<span className="text-destructive"> *</span></label>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{"\u8BF7\u9009\u62E9\u539F\u56E0"}</option>
              <option>{"\u6076\u610F\u9000\u7968"}</option>
              <option>{"\u6270\u4E71\u79E9\u5E8F"}</option>
              <option>{"\u865A\u5047\u8EAB\u4EFD"}</option>
              <option>{"\u5176\u4ED6"}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u8BE6\u7EC6\u8BF4\u660E"}</label>
            <textarea
              rows={3}
              placeholder={"\u8BF7\u586B\u5199\u62C9\u9ED1\u7684\u8BE6\u7EC6\u8BF4\u660E"}
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
              className="flex-1 h-9 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              {"\u786E\u8BA4\u62C9\u9ED1"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
