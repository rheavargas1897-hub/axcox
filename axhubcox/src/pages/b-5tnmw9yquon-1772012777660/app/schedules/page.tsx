import React from "react"
import { AdminLayout } from "../../components/admin-layout"
import { ScheduleList } from "../../components/schedules/schedule-list"
import { ScheduleCreateDialog } from "../../components/schedules/schedule-create-dialog"
import { ScheduleDetailDrawer } from "../../components/schedules/schedule-detail-panel"

export default function SchedulesPage() {
  var _showCreate = React.useState(false)
  var showCreate = _showCreate[0]
  var setShowCreate = _showCreate[1]

  var _selectedId = React.useState(null as string | null)
  var selectedId = _selectedId[0]
  var setSelectedId = _selectedId[1]

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{"\u73ED\u6B21\u7BA1\u7406"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{"\u7BA1\u7406\u548C\u76D1\u63A7\u6240\u6709\u5BA2\u8FD0\u73ED\u6B21\u4FE1\u606F"}</p>
          </div>
          <button
            onClick={function() { setShowCreate(true) }}
            className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {"\u65B0\u5EFA\u73ED\u6B21"}
          </button>
        </div>

        {/* List */}
        <ScheduleList onSelect={setSelectedId} />

        {/* Create Dialog */}
        <ScheduleCreateDialog open={showCreate} onClose={function() { setShowCreate(false) }} />

        {/* Detail Drawer */}
        <ScheduleDetailDrawer
          scheduleId={selectedId}
          open={selectedId !== null}
          onClose={function() { setSelectedId(null) }}
        />
      </div>
    </AdminLayout>
  )
}
