import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"

export function ScheduleCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  var _mode = React.useState("fixed")
  var mode = _mode[0]
  var setMode = _mode[1]

  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{"\u65B0\u5EFA\u73ED\u6B21"}</SheetTitle>
          <SheetDescription>{"\u586B\u5199\u73ED\u6B21\u57FA\u672C\u4FE1\u606F\u548C\u552E\u7968\u914D\u7F6E"}</SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4 flex flex-col gap-5">
          {/* Basic Info */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{"\u57FA\u672C\u4FE1\u606F"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">{"\u7EBF\u8DEF"}<span className="text-destructive">*</span></label>
                <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">{"\u8BF7\u9009\u62E9\u7EBF\u8DEF"}</option>
                  <option>{"\u5E7F\u5DDE-\u6DF1\u5733"}</option>
                  <option>{"\u5317\u4EAC-\u5929\u6D25"}</option>
                  <option>{"\u4E0A\u6D77-\u82CF\u5DDE"}</option>
                  <option>{"\u6B66\u6C49-\u957F\u6C99"}</option>
                  <option>{"\u897F\u5B89-\u6210\u90FD"}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">{"\u53D1\u8F66\u65E5\u671F"}<span className="text-destructive">*</span></label>
                <input type="date" className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">{"\u53D1\u8F66\u65F6\u95F4"}<span className="text-destructive">*</span></label>
                <input type="time" className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">{"\u8F66\u578B"}<span className="text-destructive">*</span></label>
                <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
                  <option>{"\u5927\u578B\u5BA2\u8F66 (45\u5EA7)"}</option>
                  <option>{"\u4E2D\u578B\u5BA2\u8F66 (35\u5EA7)"}</option>
                  <option>{"\u5C0F\u578B\u5BA2\u8F66 (20\u5EA7)"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Mode */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{"\u5E93\u5B58\u6A21\u5F0F"}</h3>
            <div className="flex gap-3">
              <button
                onClick={function() { setMode("fixed") }}
                className={"flex-1 p-3 rounded-lg border text-sm text-left transition-colors " + (mode === "fixed" ? "border-primary bg-primary/5 text-foreground" : "border-input bg-card text-muted-foreground hover:bg-muted/50")}
              >
                <div className="font-medium">{"\u56FA\u5B9A\u8F66\u8F86"}</div>
                <div className="text-xs mt-1 text-muted-foreground">{"\u6709\u9650\u5E93\u5B58\uFF0C\u6839\u636E\u8F66\u8F86\u5EA7\u4F4D\u6570\u786E\u5B9A"}</div>
              </button>
              <button
                onClick={function() { setMode("flexible") }}
                className={"flex-1 p-3 rounded-lg border text-sm text-left transition-colors " + (mode === "flexible" ? "border-primary bg-primary/5 text-foreground" : "border-input bg-card text-muted-foreground hover:bg-muted/50")}
              >
                <div className="font-medium">{"\u7075\u6D3B\u5206\u914D"}</div>
                <div className="text-xs mt-1 text-muted-foreground">{"\u6309\u9700\u6210\u56E2\uFF0C\u8FBE\u5230\u6700\u4F4E\u4EBA\u6570\u540E\u53D1\u8F66"}</div>
              </button>
            </div>
            {mode === "fixed" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{"\u603B\u5E93\u5B58"}</label>
                  <input type="number" defaultValue={45} className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{"\u9884\u7559\u5EA7"}</label>
                  <input type="number" defaultValue={0} className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>
            )}
            {mode === "flexible" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{"\u6700\u4F4E\u6210\u56E2\u4EBA\u6570"}</label>
                  <input type="number" defaultValue={15} className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{"\u6700\u5927\u5E93\u5B58"}</label>
                  <input type="number" defaultValue={50} className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>
            )}
          </div>

          {/* Ticket window */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{"\u552E\u7968\u7A97\u53E3"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">{"\u5F00\u59CB\u552E\u7968\u65F6\u95F4"}</label>
                <input type="datetime-local" className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">{"\u622A\u6B62\u552E\u7968\u65F6\u95F4"}</label>
                <input type="datetime-local" className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{"\u7968\u4EF7\u914D\u7F6E"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">{"\u6210\u4EBA\u7968\u57FA\u51C6\u4EF7(\u5143)"}<span className="text-destructive">*</span></label>
                <input type="number" placeholder="0.00" className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">{"\u513F\u7AE5\u7968\u57FA\u51C6\u4EF7(\u5143)"}</label>
                <input type="number" placeholder="0.00" className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <button className="text-xs text-primary hover:text-primary/80 w-fit">{"\u914D\u7F6E\u9AD8\u7EA7\u7968\u4EF7\u89C4\u5219 >"}</button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-md border border-input text-sm hover:bg-muted transition-colors"
            >
              {"\u53D6\u6D88"}
            </button>
            <button className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              {"\u786E\u8BA4\u521B\u5EFA"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
