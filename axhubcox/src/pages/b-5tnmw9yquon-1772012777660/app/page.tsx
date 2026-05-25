import React from "react"
import { AdminLayout } from "../components/admin-layout"
import { DashboardKPI } from "../components/dashboard/dashboard-kpi"
import { DashboardFilters } from "../components/dashboard/dashboard-filters"
import { DashboardTable } from "../components/dashboard/dashboard-table"
import { ScheduleDetailDrawer } from "../components/dashboard/schedule-detail-drawer"

export default function DashboardPage() {
  var _selectedSchedule = React.useState(null)
  var selectedSchedule = _selectedSchedule[0] as any
  var setSelectedSchedule = _selectedSchedule[1]

  var _refreshInterval = React.useState(30)
  var refreshInterval = _refreshInterval[0]
  var setRefreshInterval = _refreshInterval[1]

  var _lastUpdated = React.useState(new Date().toLocaleTimeString("zh-CN"))
  var lastUpdated = _lastUpdated[0]
  var setLastUpdated = _lastUpdated[1]

  var handleRefresh = React.useCallback(function() {
    setLastUpdated(new Date().toLocaleTimeString("zh-CN"))
  }, [])

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{"\u552E\u7968\u770B\u677F"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{"\u5B9E\u65F6\u76D1\u63A7\u73ED\u6B21\u552E\u7968\u4E0E\u8FD0\u884C\u72B6\u51B5"}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{"\u6700\u540E\u66F4\u65B0: "}{lastUpdated}</span>
            <select
              value={refreshInterval}
              onChange={function(e) { setRefreshInterval(Number(e.target.value)) }}
              className="h-7 rounded-md border border-input bg-card px-2 text-xs text-foreground"
            >
              <option value={10}>{"10s \u5237\u65B0"}</option>
              <option value={30}>{"30s \u5237\u65B0"}</option>
              <option value={60}>{"60s \u5237\u65B0"}</option>
            </select>
            <button
              onClick={handleRefresh}
              className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              {"\u624B\u52A8\u5237\u65B0"}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <DashboardKPI />

        {/* Filters */}
        <DashboardFilters />

        {/* Table */}
        <DashboardTable onSelectSchedule={setSelectedSchedule} />

        {/* Detail Drawer */}
        <ScheduleDetailDrawer
          schedule={selectedSchedule}
          open={selectedSchedule !== null}
          onClose={function() { setSelectedSchedule(null) }}
        />
      </div>
    </AdminLayout>
  )
}
