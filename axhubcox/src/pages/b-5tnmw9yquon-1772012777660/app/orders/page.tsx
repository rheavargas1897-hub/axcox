import React from "react"
import { AdminLayout } from "../../components/admin-layout"
import { OrderFilters } from "../../components/orders/order-filters"
import { OrderTable } from "../../components/orders/order-table"
import { OrderDetailDrawer } from "../../components/orders/order-detail-drawer"

export default function OrdersPage() {
  var _selectedOrder = React.useState(null as any)
  var selectedOrder = _selectedOrder[0]
  var setSelectedOrder = _selectedOrder[1]

  return (
    <AdminLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{"\u8D2D\u7968\u8BA2\u5355"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{"\u7BA1\u7406\u6240\u6709\u8D2D\u7968\u8BA2\u5355\u4FE1\u606F"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 rounded-md border border-input bg-card text-sm hover:bg-muted transition-colors">{"\u5BFC\u51FA"}</button>
            <button className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">{"\u6279\u91CF\u9000\u6B3E"}</button>
          </div>
        </div>

        <OrderFilters />
        <OrderTable onSelect={setSelectedOrder} />
        <OrderDetailDrawer
          order={selectedOrder}
          open={selectedOrder !== null}
          onClose={function() { setSelectedOrder(null) }}
        />
      </div>
    </AdminLayout>
  )
}
