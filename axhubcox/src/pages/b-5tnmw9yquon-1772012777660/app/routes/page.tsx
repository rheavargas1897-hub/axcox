import React from "react"
import { AdminLayout } from "../../components/admin-layout"
import { RouteList } from "../../components/routes/route-list"
import { RouteCreateDialog } from "../../components/routes/route-create-dialog"
import { RouteDetailDrawer } from "../../components/routes/route-detail-drawer"

export default function RoutesPage() {
  var _selectedRoute = React.useState(null as any)
  var selectedRoute = _selectedRoute[0]
  var setSelectedRoute = _selectedRoute[1]

  var _showCreate = React.useState(false)
  var showCreate = _showCreate[0]
  var setShowCreate = _showCreate[1]

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{"\u8DEF\u7EBF\u7BA1\u7406"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{"\u7BA1\u7406\u8FD0\u8425\u8DEF\u7EBF\u3001\u7AD9\u70B9\u4E0E\u7968\u4EF7\u7B56\u7565"}</p>
          </div>
          <button
            onClick={function() { setShowCreate(true) }}
            className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {"\u65B0\u5EFA\u8DEF\u7EBF"}
          </button>
        </div>

        <RouteList onSelect={setSelectedRoute} />

        <RouteDetailDrawer
          route={selectedRoute}
          open={selectedRoute !== null}
          onClose={function() { setSelectedRoute(null) }}
        />
        <RouteCreateDialog
          open={showCreate}
          onClose={function() { setShowCreate(false) }}
        />
      </div>
    </AdminLayout>
  )
}
