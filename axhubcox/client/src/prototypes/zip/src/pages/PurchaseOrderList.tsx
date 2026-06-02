import React, { useState } from 'react';
import { Plus, Upload, Download, Search, Filter, ChevronDown, Eye, Edit, Copy, XCircle } from 'lucide-react';
import { StatusBadge } from '../components/ui';
import CreatePurchaseOrderModal from '../components/CreatePurchaseOrderModal';

export default function PurchaseOrderList({ navigateTo }: { navigateTo: (page: string, id?: string) => void }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const orders = [
    { id: 'CG20231024000001', status: '待审核', supplier: '深圳市鑫源电子有限公司', summary: '电子设备-工业级主板-研华-AIMB-785等 (共5项)', amount: '125,000.00', paid: '0.00', unpaid: '125,000.00', inStock: '0', unStock: '500', date: '2023-10-24', expectDate: '2023-11-05', warehouse: '华南一号仓', creator: '张采购' },
    { id: 'CG20231023000089', status: '待到货', supplier: '杭州精密机械制造厂', summary: '电机设备-高精度伺服电机-汇川-750W 220V等 (共2项)', amount: '45,800.00', paid: '13,740.00', unpaid: '32,060.00', inStock: '0', unStock: '120', date: '2023-10-23', expectDate: '2023-10-30', warehouse: '华东中心仓', creator: '李专员' },
    { id: 'CG20231020000045', status: '部分到货', supplier: '上海包装材料集团', summary: '包装耗材-定制防静电包装箱-南亚-60*40*30cm (共1项)', amount: '18,500.00', paid: '18,500.00', unpaid: '0.00', inStock: '2000', unStock: '3000', date: '2023-10-20', expectDate: '2023-10-25', warehouse: '华东中心仓', creator: '王主管' },
    { id: 'CG20231018000012', status: '已到货', supplier: '北京科创线缆有限公司', summary: '线缆辅料-阻燃电缆-远东-RVV 3*2.5等 (共8项)', amount: '210,000.00', paid: '105,000.00', unpaid: '105,000.00', inStock: '1500', unStock: '0', date: '2023-10-18', expectDate: '2023-10-22', warehouse: '华北二号仓', creator: '张采购' },
    { id: 'CG20231015000003', status: '已驳回', supplier: '广州日用百货批发', summary: '行政物资-办公用品-得力-A4打印纸等 (共15项)', amount: '3,200.00', paid: '0.00', unpaid: '3,200.00', inStock: '0', unStock: '0', date: '2023-10-15', expectDate: '-', warehouse: '行政仓', creator: '赵行政' },
    { id: 'CG20231010000099', status: '已完成', supplier: '苏州半导体科技', summary: '电子元器件-MCU芯片-ST-STM32F407等 (共3项)', amount: '580,000.00', paid: '580,000.00', unpaid: '0.00', inStock: '10000', unStock: '0', date: '2023-10-10', expectDate: '2023-10-15', warehouse: '华东中心仓', creator: '李专员' },
    { id: 'CG20231005000001', status: '草稿', supplier: '未知供应商', summary: '待完善采购信息', amount: '0.00', paid: '0.00', unpaid: '0.00', inStock: '0', unStock: '0', date: '2023-10-05', expectDate: '-', warehouse: '-', creator: '张采购' },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">采购订单</h1>
          <p className="text-sm text-slate-500 mt-1">统一管理采购申请、审批、到货与付款执行进度</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors shadow-sm">
            <Upload className="w-4 h-4 mr-2 text-slate-500" />
            导入
          </button>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            导出
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建采购单
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">采购单号</label>
            <input type="text" placeholder="请输入" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">供应商</label>
            <input type="text" placeholder="请输入" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">状态</label>
            <div className="relative">
              <select className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <option>全部状态</option>
                <option>草稿</option>
                <option>待审核</option>
                <option>待到货</option>
                <option>已驳回</option>
                <option>部分到货</option>
                <option>已到货</option>
                <option>已完成</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">采购日期</label>
            <input type="date" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-600" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium">
            <Filter className="w-4 h-4 mr-1" />
            展开更多筛选
          </button>
          <div className="flex space-x-3">
            <button className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
              重置
            </button>
            <button className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors flex items-center">
              <Search className="w-4 h-4 mr-2" />
              查询
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">采购单号</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">状态</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">供应商</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">商品摘要</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">采购金额</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">已付/未付</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">已入库/未入库</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">采购日期</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">预计到货</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => navigateTo('detail', order.id)}>
                    {order.id}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 truncate max-w-[150px]" title={order.supplier}>
                    {order.supplier}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[200px]" title={order.summary}>
                    {order.summary}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right">
                    {order.amount}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-right">
                    <div className="text-slate-900">{order.paid}</div>
                    <div className="text-xs text-slate-400">{order.unpaid}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-right">
                    <div className="text-emerald-600">{order.inStock}</div>
                    <div className="text-xs text-orange-500">{order.unStock}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                    {order.date}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                    {order.expectDate}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigateTo('detail', order.id)} className="text-blue-600 hover:text-blue-800 font-medium">查看</button>
                      
                      {order.status === '草稿' && (
                        <>
                          <button className="text-blue-600 hover:text-blue-800 font-medium">编辑</button>
                          <button className="text-red-600 hover:text-red-800 font-medium">删除</button>
                        </>
                      )}
                      
                      {order.status === '待审核' && (
                        <button className="text-orange-600 hover:text-orange-800 font-medium">取消审核</button>
                      )}
                      
                      {['待到货', '部分到货', '已到货', '已完成'].includes(order.status) && (
                        <button className="text-orange-600 hover:text-orange-800 font-medium">反审核</button>
                      )}
                      
                      {order.status === '已驳回' && (
                        <>
                          <button className="text-blue-600 hover:text-blue-800 font-medium">重新审批</button>
                          <button className="text-red-600 hover:text-red-800 font-medium">删除</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-white rounded-b-lg shrink-0">
          <div className="text-sm text-slate-500">
            共 <span className="font-medium text-slate-900">128</span> 条记录，当前第 <span className="font-medium text-slate-900">1</span> / 13 页
          </div>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-500 bg-slate-50 cursor-not-allowed">上一页</button>
            <button className="px-3 py-1 border border-blue-600 rounded-md text-sm font-medium text-white bg-blue-600">1</button>
            <button className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">2</button>
            <button className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">3</button>
            <span className="px-2 py-1 text-slate-500">...</span>
            <button className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">下一页</button>
          </div>
        </div>
      </div>

      <CreatePurchaseOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
