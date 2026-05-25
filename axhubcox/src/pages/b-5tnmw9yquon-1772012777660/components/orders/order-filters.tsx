import React from "react"

export function OrderFilters() {
  var _showAdvanced = React.useState(false)
  var showAdvanced = _showAdvanced[0]
  var setShowAdvanced = _showAdvanced[1]

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-5 gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{"\u4E0B\u5355\u65F6\u95F4"}</label>
          <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
            <option>{"\u4ECA\u65E5"}</option>
            <option>{"\u8FD17\u5929"}</option>
            <option>{"\u672C\u6708"}</option>
            <option>{"\u81EA\u5B9A\u4E49"}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{"\u8BA2\u5355\u641C\u7D22"}</label>
          <input
            type="text"
            placeholder={"\u8BA2\u5355\u53F7/\u53D6\u7968\u7801/\u7968\u53F7"}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{"\u4E58\u5BA2\u641C\u7D22"}</label>
          <input
            type="text"
            placeholder={"\u59D3\u540D/\u624B\u673A\u53F7/\u8BC1\u4EF6\u53F7"}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{"\u8BA2\u5355\u72B6\u6001"}</label>
          <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{"\u5168\u90E8\u72B6\u6001"}</option>
            <option>{"\u5F85\u652F\u4ED8"}</option>
            <option>{"\u5DF2\u652F\u4ED8"}</option>
            <option>{"\u5DF2\u4E58\u8F66"}</option>
            <option>{"\u672A\u4E58\u8F66"}</option>
            <option>{"\u5DF2\u9000\u6B3E"}</option>
            <option>{"\u90E8\u5206\u9000\u6B3E"}</option>
            <option>{"\u53D6\u6D88\u8BA2\u5355"}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-md border border-input bg-card text-sm hover:bg-muted transition-colors">{"\u91CD\u7F6E"}</button>
          <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">{"\u67E5\u8BE2"}</button>
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        onClick={function() { setShowAdvanced(!showAdvanced) }}
        className="mt-3 text-xs text-primary hover:text-primary/80"
      >
        {showAdvanced ? "\u6536\u8D77\u9AD8\u7EA7\u7B5B\u9009 \u25B2" : "\u5C55\u5F00\u9AD8\u7EA7\u7B5B\u9009 \u25BC"}
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-5 gap-3 mt-3 pt-3 border-t border-border items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u53D1\u8F66\u65E5\u671F"}</label>
            <input type="date" className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u652F\u4ED8\u65B9\u5F0F"}</label>
            <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{"\u5168\u90E8"}</option>
              <option>{"\u5FAE\u4FE1"}</option>
              <option>{"\u652F\u4ED8\u5B9D"}</option>
              <option>{"\u73B0\u91D1"}</option>
              <option>{"\u5BF9\u516C"}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u652F\u4ED8\u6E20\u9053"}</label>
            <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{"\u5168\u90E8"}</option>
              <option>Web</option>
              <option>APP</option>
              <option>{"\u7A97\u53E3"}</option>
              <option>{"\u4EE3\u7406\u5546"}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u53D1\u7968\u72B6\u6001"}</label>
            <select className="h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{"\u5168\u90E8"}</option>
              <option>{"\u5DF2\u5F00\u7968"}</option>
              <option>{"\u672A\u5F00\u7968"}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{"\u7EBF\u8DEF"}</label>
            <input type="text" placeholder={"\u8D77\u8BBE\u7AD9\u641C\u7D22"} className="h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
      )}
    </div>
  )
}
