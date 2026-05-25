import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Package, HardDrive, Search, Filter, Download, Calendar } from 'lucide-react';
import { allEquipments, MOCK_WAREHOUSES } from './mockData';
import { WarehouseAggregated, ProductAggregated } from './types';
import { WarehouseView } from './components/WarehouseView';
import { ProductView } from './components/ProductView';
import { EquipmentView } from './components/EquipmentView';

type ViewMode = 'warehouse' | 'product' | 'equipment';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('warehouse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  
  // Default to current month
  const [dateRange, setDateRange] = useState<{start: string, end: string}>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });

  const filteredEquipments = useMemo(() => {
    let result = allEquipments;
    
    if (selectedWarehouse) {
      result = result.filter(eq => eq.warehouseId === selectedWarehouse);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(eq => 
        eq.sn.toLowerCase().includes(q) ||
        eq.productName.toLowerCase().includes(q) ||
        eq.warehouseName.toLowerCase().includes(q) ||
        eq.productModel.toLowerCase().includes(q) ||
        eq.productBrand.toLowerCase().includes(q) ||
        eq.ownership.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery, selectedWarehouse]);

  const aggregatedData = useMemo(() => {
    const warehouseMap = new Map<string, WarehouseAggregated>();
    const productMap = new Map<string, ProductAggregated>();

    filteredEquipments.forEach(eq => {
      // Initialize Warehouse
      if (!warehouseMap.has(eq.warehouseId)) {
        warehouseMap.set(eq.warehouseId, {
          id: eq.warehouseId,
          name: eq.warehouseName,
          total: 0, available: 0, occupied: 0, frozen: 0, inTransit: 0,
          pendingRepair: 0, repairing: 0, pendingRecycle: 0, borrowed: 0,
          inbound: 0, outbound: 0,
          products: []
        });
      }
      const w = warehouseMap.get(eq.warehouseId)!;

      // Initialize Product (Global for Product View)
      if (!productMap.has(eq.productId)) {
        productMap.set(eq.productId, {
          id: eq.productId,
          type: eq.productType,
          name: eq.productName,
          brand: eq.productBrand,
          model: eq.productModel,
          total: 0, available: 0, occupied: 0, frozen: 0, inTransit: 0,
          pendingRepair: 0, repairing: 0, pendingRecycle: 0, borrowed: 0,
          inbound: 0, outbound: 0,
          warning: '正常',
          equipments: []
        });
      }
      const p = productMap.get(eq.productId)!;

      // Check if inbound/outbound falls within the selected date range
      const isInboundInRange = eq.inboundTime >= dateRange.start && eq.inboundTime <= dateRange.end;
      const isOutboundInRange = eq.outboundTime && eq.outboundTime >= dateRange.start && eq.outboundTime <= dateRange.end;

      // Aggregate Warehouse
      if (eq.status !== '已出库') w.total++;
      if (eq.status === '可用') w.available++;
      if (eq.status === '占用') w.occupied++;
      if (eq.status === '冻结') w.frozen++;
      if (eq.status === '在途') w.inTransit++;
      if (eq.status === '待维修') w.pendingRepair++;
      if (eq.status === '维修中') w.repairing++;
      if (eq.status === '待回收') w.pendingRecycle++;
      if (eq.status === '已借出') w.borrowed++;
      if (isInboundInRange) w.inbound++;
      if (isOutboundInRange) w.outbound++;

      // Aggregate Product (Global)
      if (eq.status !== '已出库') p.total++;
      if (eq.status === '可用') p.available++;
      if (eq.status === '占用') p.occupied++;
      if (eq.status === '冻结') p.frozen++;
      if (eq.status === '在途') p.inTransit++;
      if (eq.status === '待维修') p.pendingRepair++;
      if (eq.status === '维修中') p.repairing++;
      if (eq.status === '待回收') p.pendingRecycle++;
      if (eq.status === '已借出') p.borrowed++;
      if (isInboundInRange) p.inbound++;
      if (isOutboundInRange) p.outbound++;
      p.equipments.push(eq);
      if (p.available < 5) p.warning = '库存不足';

      // Aggregate Product within Warehouse (for nested view)
      let wp = w.products.find(prod => prod.id === eq.productId);
      if (!wp) {
        wp = {
          id: eq.productId,
          type: eq.productType,
          name: eq.productName,
          brand: eq.productBrand,
          model: eq.productModel,
          total: 0, available: 0, occupied: 0, frozen: 0, inTransit: 0,
          pendingRepair: 0, repairing: 0, pendingRecycle: 0, borrowed: 0,
          inbound: 0, outbound: 0,
          warning: '正常',
          equipments: []
        };
        w.products.push(wp);
      }
      if (eq.status !== '已出库') wp.total++;
      if (eq.status === '可用') wp.available++;
      if (eq.status === '占用') wp.occupied++;
      if (eq.status === '冻结') wp.frozen++;
      if (eq.status === '在途') wp.inTransit++;
      if (eq.status === '待维修') wp.pendingRepair++;
      if (eq.status === '维修中') wp.repairing++;
      if (eq.status === '待回收') wp.pendingRecycle++;
      if (eq.status === '已借出') wp.borrowed++;
      if (isInboundInRange) wp.inbound++;
      if (isOutboundInRange) wp.outbound++;
      wp.equipments.push(eq);
      if (wp.available < 5) wp.warning = '库存不足';
    });

    return {
      warehouses: Array.from(warehouseMap.values()),
      products: Array.from(productMap.values())
    };
  }, [filteredEquipments, dateRange]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">库存统计</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <Calendar size={16} />
              <span>时间范围: {dateRange.start.slice(0, 7)} (本月)</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
              <Download size={16} />
              <span>导出数据</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* View Switcher */}
          <div className="flex bg-slate-200/50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('warehouse')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'warehouse' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2Icon size={16} />
              按仓库统计
            </button>
            <button
              onClick={() => setViewMode('product')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'product' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package size={16} />
              按产品统计
            </button>
            <button
              onClick={() => setViewMode('equipment')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'equipment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardDrive size={16} />
              设备明细
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select 
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="">全部仓库</option>
              {MOCK_WAREHOUSES.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜索编号/名称/车牌号..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64"
              />
            </div>
            <button className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
          {viewMode === 'warehouse' && <WarehouseView warehouses={aggregatedData.warehouses} />}
          {viewMode === 'product' && <ProductView products={aggregatedData.products} />}
          {viewMode === 'equipment' && <EquipmentView equipments={filteredEquipments} />}
        </div>
      </main>
    </div>
  );
}

// Helper icon component since Building2 is not imported from lucide-react in the main block
function Building2Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}

export default App;
