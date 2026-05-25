import React from "react"

export function DashboardFilters() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{"\u65F6\u95F4\u7EF4\u5EA6"}</label>
          <select className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option>{"\u4ECA\u65E5"}</option>
            <option>{"\u660E\u65E5"}</option>
            <option>{"\u81EA\u5B9A\u4E49\u65E5\u671F"}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{"\u7EBF\u8DEF/\u8D77\u8BBE\u7AD9"}</label>
          <input
            type="text"
            placeholder={"\u8F93\u5165\u7EBF\u8DEF\u6216\u7AD9\u70B9\u540D\u79F0"}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{"\u73ED\u6B21\u72B6\u6001"}</label>
          <select className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="">{"\u5168\u90E8\u72B6\u6001"}</option>
            <option>{"\u672A\u5F00\u59CB"}</option>
            <option>{"\u8FDB\u884C\u4E2D"}</option>
            <option>{"\u5EF6\u8BEF"}</option>
            <option>{"\u5DF2\u53D6\u6D88"}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-4 rounded-md border border-input bg-card text-sm text-foreground hover:bg-muted transition-colors">
            {"\u91CD \u7F6E"}
          </button>
          <button className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            {"\u641C \u7D22"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mt-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{"\u73ED\u6B21\u53F7"}</label>
          <input
            type="text"
            placeholder={"\u8F93\u5165\u73ED\u6B21\u53F7"}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{"\u8F66\u724C\u53F7"}</label>
          <input
            type="text"
            placeholder={"\u8F93\u5165\u8F66\u724C\u53F7"}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{"\u5F02\u5E38\u6807\u7B7E"}</label>
          <select className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="">{"\u5168\u90E8"}</option>
            <option>{"\u6838\u9500\u7387\u4F4E"}</option>
            <option>{"\u5B9A\u4F4D\u4E22\u5931"}</option>
            <option>{"\u5E93\u5B58\u5F02\u5E38"}</option>
          </select>
        </div>
      </div>
    </div>
  )
}
