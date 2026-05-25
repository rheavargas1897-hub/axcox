import React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet"

export function CampaignCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={function(v) { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{"\u521B\u5EFA\u8425\u9500\u6D3B\u52A8"}</SheetTitle>
          <SheetDescription>{"\u65B0\u5EFA\u4F18\u60E0\u5238\u6216\u6298\u6263\u6D3B\u52A8"}</SheetDescription>
        </SheetHeader>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u6D3B\u52A8\u540D\u79F0"}<span className="text-destructive"> *</span></label>
            <input
              type="text"
              placeholder={"\u8F93\u5165\u6D3B\u52A8\u540D\u79F0"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u6D3B\u52A8\u7C7B\u578B"}<span className="text-destructive"> *</span></label>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option>{"\u6298\u6263\u5238"}</option>
              <option>{"\u6EE1\u51CF\u5238"}</option>
              <option>{"\u7ACB\u51CF\u5238"}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u4F18\u60E0\u5F3A\u5EA6"}<span className="text-destructive"> *</span></label>
            <input
              type="text"
              placeholder={"\u4F8B\u5982: 8\u6298 / \u6EE180\u51CF15 / \u51CF20\u5143"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{"\u5F00\u59CB\u65E5\u671F"}<span className="text-destructive"> *</span></label>
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{"\u7ED3\u675F\u65E5\u671F"}<span className="text-destructive"> *</span></label>
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{"\u53D1\u5238\u6570\u91CF"}<span className="text-destructive"> *</span></label>
              <input
                type="number"
                placeholder="0"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{"\u603B\u9884\u7B97(\u5143)"}<span className="text-destructive"> *</span></label>
              <input
                type="number"
                placeholder="0"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u9002\u7528\u8DEF\u7EBF"}</label>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option>{"\u5168\u90E8\u8DEF\u7EBF"}</option>
              <option>{"\u5E7F\u5DDE-\u6DF1\u5733"}</option>
              <option>{"\u5317\u4EAC-\u5929\u6D25"}</option>
              <option>{"\u4E0A\u6D77-\u82CF\u5DDE"}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u6D3B\u52A8\u8BF4\u660E"}</label>
            <textarea
              rows={3}
              placeholder={"\u53EF\u9009\u586B\u5199\u6D3B\u52A8\u89C4\u5219\u8BF4\u660E"}
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
