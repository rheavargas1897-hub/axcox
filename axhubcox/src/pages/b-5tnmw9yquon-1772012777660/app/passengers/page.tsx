import React from "react"
import { AdminLayout } from "../../components/admin-layout"
import { PassengerStats } from "../../components/passengers/passenger-stats"
import { PassengerFilters } from "../../components/passengers/passenger-filters"
import { PassengerTable } from "../../components/passengers/passenger-table"
import { PassengerDetailDrawer } from "../../components/passengers/passenger-detail-drawer"
import { PassengerCreateDialog } from "../../components/passengers/passenger-create-dialog"
import { BlacklistDialog } from "../../components/passengers/blacklist-dialog"

export default function PassengersPage() {
  var _selectedPassenger = React.useState(null as any)
  var selectedPassenger = _selectedPassenger[0]
  var setSelectedPassenger = _selectedPassenger[1]

  var _showCreate = React.useState(false)
  var showCreate = _showCreate[0]
  var setShowCreate = _showCreate[1]

  var _blacklistTarget = React.useState(null as any)
  var blacklistTarget = _blacklistTarget[0]
  var setBlacklistTarget = _blacklistTarget[1]

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{"\u4E58\u5BA2\u7BA1\u7406"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{"\u7BA1\u7406\u4E58\u5BA2\u4FE1\u606F\u3001\u51FA\u884C\u8BB0\u5F55\u4E0E\u9ED1\u540D\u5355"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 rounded-md border border-input bg-card text-sm hover:bg-muted transition-colors">{"\u5BFC\u51FA"}</button>
            <button
              onClick={function() { setShowCreate(true) }}
              className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {"\u65B0\u5EFA\u4E58\u5BA2"}
            </button>
          </div>
        </div>

        <PassengerStats />
        <PassengerFilters />
        <PassengerTable
          onSelect={setSelectedPassenger}
          onBlacklist={setBlacklistTarget}
        />
        <PassengerDetailDrawer
          passenger={selectedPassenger}
          open={selectedPassenger !== null}
          onClose={function() { setSelectedPassenger(null) }}
        />
        <PassengerCreateDialog
          open={showCreate}
          onClose={function() { setShowCreate(false) }}
        />
        <BlacklistDialog
          target={blacklistTarget}
          open={blacklistTarget !== null}
          onClose={function() { setBlacklistTarget(null) }}
        />
      </div>
    </AdminLayout>
  )
}
