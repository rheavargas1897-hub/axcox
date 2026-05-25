import React from "react"

export function PassengerFilters() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-5 gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{"\u641C\u7D22"}</label>
          <input
            type="text"
            placeholder={"\u59D3\u540D/\u624B\u673A\u53F7/\u8BC1\u4EF6\u53F7/\u8BA2\u5355\u53F7"}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{"\u72B6\u6001"}</label>
          <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{"\u5168\u90E8"}</option>
            <option>{"\u6B63\u5E38"}</option>
            <option>{"\u9ED1\u540D\u5355"}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{"\u6E20\u9053"}</label>
          <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{"\u5168\u90E8"}</option>
            <option>{"\u5C0F\u7A0B\u5E8F"}</option>
            <option>{"\u540E\u53F0\u6DFB\u52A0"}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{"\u662F\u5426\u6D3B\u8DC3"}</label>
          <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{"\u5168\u90E8"}</option>
            <option>{"\u6D3B\u8DC3"}</option>
            <option>{"\u4E0D\u6D3B\u8DC3"}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-md border border-input bg-card text-sm hover:bg-muted transition-colors">{"\u91CD\u7F6E"}</button>
          <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">{"\u641C\u7D22"}</button>
        </div>
      </div>
    </div>
  )
}
