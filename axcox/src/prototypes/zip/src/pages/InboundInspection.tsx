import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle, Save, Info, Camera } from 'lucide-react';
import { StatusBadge } from '../components/ui';

export default function InboundInspection({ navigateTo, orderId }: { navigateTo: (page: string, id?: string) => void, orderId: string | null }) {
  const id = orderId || 'CG20231023000089';
  
  // State for editable table
  const [items, setItems] = useState([
    { id: 1, name: '高精度伺服电机', sku: 'SV-750-220', ordered: 100, arrived: 0, received: 100, qualified: 98, unqualified: 2, reason: '外包装破损，电机划伤' },
    { id: 2, name: '行星减速机', sku: 'PL-10-A', ordered: 20, arrived: 0, received: 20, qualified: 20, unqualified: 0, reason: '' },
  ]);

  const handleInputChange = (itemId: number, field: string, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newItem = { ...item, [field]: value };
        // Auto calculate logic
        if (field === 'received') {
          newItem.qualified = Number(value) - newItem.unqualified;
        } else if (field === 'unqualified') {
          newItem.qualified = newItem.received - Number(value);
        } else if (field === 'qualified') {
          newItem.unqualified = newItem.received - Number(value);
        }
        return newItem;
      }
      return item;
    }));
  };

  const totalReceived = items.reduce((sum, item) => sum + Number(item.received), 0);
  const totalQualified = items.reduce((sum, item) => sum + Number(item.qualified), 0);
  const totalUnqualified = items.reduce((sum, item) => sum + Number(item.unqualified), 0);
  const hasException = totalUnqualified > 0;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigateTo('detail', id)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">采购入库验收</h1>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">关联: {id}</span>
              <span className="text-sm font-medium text-slate-700">杭州精密机械制造厂</span>
              <StatusBadge status="待入库" />
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors shadow-sm">
            <Save className="w-4 h-4 mr-2 text-slate-500" />
            保存草稿
          </button>
          {hasException && (
            <button className="px-4 py-2 bg-orange-50 border border-orange-200 text-orange-600 rounded-md text-sm font-medium hover:bg-orange-100 flex items-center transition-colors shadow-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              发起异常审批
            </button>
          )}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center transition-colors shadow-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            确认入库
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {hasException && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start shadow-sm shrink-0">
          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 mr-3 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-orange-800">存在不合格商品</h3>
            <p className="text-xs text-orange-600 mt-1">本次验收存在 {totalUnqualified} 件不合格商品，不合格商品不可入库。确认入库后，系统将自动生成退货/换货异常处理单，需采购主管审批。</p>
          </div>
        </div>
      )}

      {/* Core Inspection Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg flex justify-between items-center shrink-0">
          <h2 className="text-sm font-bold text-slate-800 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-slate-500" />
            验收明细录入
          </h2>
          <div className="text-xs text-slate-500">
            请仔细核对实收数量与合格情况，<span className="font-medium text-slate-700">入库数量 = 合格数量</span>
          </div>
        </div>
        <div className="overflow-auto flex-1 p-4">
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className={`border rounded-lg p-4 transition-colors ${item.unqualified > 0 ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200 bg-white'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">{idx + 1}</div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.sku}</div>
                    </div>
                  </div>
                  <div className="flex space-x-6 text-right">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">采购数量</div>
                      <div className="text-sm font-mono font-medium text-slate-900">{item.ordered}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">已到货</div>
                      <div className="text-sm font-mono font-medium text-slate-900">{item.arrived}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">待收货</div>
                      <div className="text-sm font-mono font-bold text-blue-600">{item.ordered - item.arrived}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-12 gap-4 items-start bg-slate-50 p-4 rounded-md border border-slate-100">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">本次实收数量 <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={item.received}
                      onChange={(e) => handleInputChange(item.id, 'received', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-emerald-700 mb-1.5">合格数量 <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={item.qualified}
                      onChange={(e) => handleInputChange(item.id, 'qualified', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm font-mono border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50 text-emerald-900" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-orange-700 mb-1.5">不合格数量</label>
                    <input 
                      type="number" 
                      value={item.unqualified}
                      onChange={(e) => handleInputChange(item.id, 'unqualified', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm font-mono border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-orange-50 text-orange-900" 
                    />
                  </div>
                  <div className="col-span-1 flex flex-col items-center justify-center pt-6">
                    <span className="text-slate-400">=</span>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">可入库数量</label>
                    <div className="w-full px-3 py-1.5 text-sm font-mono font-bold text-slate-900 bg-slate-200 rounded-md border border-slate-300 cursor-not-allowed text-center">
                      {item.qualified}
                    </div>
                  </div>
                  
                  {item.unqualified > 0 && (
                    <div className="col-span-12 mt-2 pt-3 border-t border-slate-200 grid grid-cols-12 gap-4">
                      <div className="col-span-6">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">不合格原因说明 <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={item.reason}
                          onChange={(e) => handleInputChange(item.id, 'reason', e.target.value)}
                          placeholder="请详细描述不合格原因..."
                          className="w-full px-3 py-1.5 text-sm border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" 
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">建议处理方式</label>
                        <select className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                          <option>退货退款</option>
                          <option>要求换货</option>
                          <option>折价接收</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">附件凭证</label>
                        <button className="w-full px-3 py-1.5 text-sm border border-dashed border-slate-300 rounded-md text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition-colors">
                          <Camera className="w-4 h-4 mr-2" />
                          上传照片
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Two-Column */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        {/* Rules */}
        <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center mb-3">
            <Info className="w-4 h-4 mr-2 text-slate-500" />
            验收规则说明
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <span className="font-bold text-slate-700 block mb-1">超收规则</span>
              实收数量 &gt; 待收货数量时，系统将拦截直接入库，需发起【超收异常审批】，经主管同意后方可入库。
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <span className="font-bold text-slate-700 block mb-1">少验规则</span>
              实收数量 &lt; 待收货数量时，可正常入库，订单状态将变更为【部分到货】，等待后续批次。
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <span className="font-bold text-slate-700 block mb-1">不合格处理</span>
              不合格商品不计入可入库数量，必须填写原因并上传照片凭证，确认后自动生成退换货任务。
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <span className="font-bold text-slate-700 block mb-1">入库数量控制</span>
              最终增加的库存数量严格等于【合格数量】。财务应付账款将根据合格数量重新核算。
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="col-span-1 bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-5 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none"></div>
          
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-4">本次入库汇总</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-sm text-slate-400">实收总数</span>
                <span className="text-lg font-mono font-medium">{totalReceived}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-sm text-emerald-400">合格总数</span>
                <span className="text-lg font-mono font-medium text-emerald-400">{totalQualified}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-sm text-orange-400">不合格总数</span>
                <span className="text-lg font-mono font-medium text-orange-400">{totalUnqualified}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-700">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-slate-300">可入库总数</span>
              <span className="text-3xl font-bold font-mono text-white">{totalQualified}</span>
            </div>
            <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
              <span>操作人: 张仓库</span>
              <span>2023-10-30 14:20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
