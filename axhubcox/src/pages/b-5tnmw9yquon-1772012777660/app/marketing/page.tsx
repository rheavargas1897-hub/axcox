import React from "react"
import { AdminLayout } from "../../components/admin-layout"
import { MarketingStats } from "../../components/marketing/marketing-stats"
import { CampaignList } from "../../components/marketing/campaign-list"
import { CampaignCreateDialog } from "../../components/marketing/campaign-create-dialog"
import { CampaignDetailDrawer } from "../../components/marketing/campaign-detail-drawer"

export default function MarketingPage() {
  var _selectedCampaign = React.useState(null as any)
  var selectedCampaign = _selectedCampaign[0]
  var setSelectedCampaign = _selectedCampaign[1]

  var _showCreate = React.useState(false)
  var showCreate = _showCreate[0]
  var setShowCreate = _showCreate[1]

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{"\u8425\u9500\u6D3B\u52A8"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{"\u7BA1\u7406\u4F18\u60E0\u5238\u3001\u6298\u6263\u6D3B\u52A8\u4E0E\u63A8\u5E7F\u7B56\u7565"}</p>
          </div>
          <button
            onClick={function() { setShowCreate(true) }}
            className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {"\u521B\u5EFA\u6D3B\u52A8"}
          </button>
        </div>

        <MarketingStats />
        <CampaignList onSelect={setSelectedCampaign} />

        <CampaignDetailDrawer
          campaign={selectedCampaign}
          open={selectedCampaign !== null}
          onClose={function() { setSelectedCampaign(null) }}
        />
        <CampaignCreateDialog
          open={showCreate}
          onClose={function() { setShowCreate(false) }}
        />
      </div>
    </AdminLayout>
  )
}
