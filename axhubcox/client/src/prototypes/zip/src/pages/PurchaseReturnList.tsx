import React, { useState } from 'react';
import { Plus, Upload, Download, Search, Filter, ChevronDown, X, Calendar } from 'lucide-react';
import { StatusBadge } from '../components/ui';

export default function PurchaseReturnList({ navigateTo }: { navigateTo: (page: string, id?: string) => void }) {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const returns = [
    { id: 'RT-20231026-001', relatedOrder: 'CG20231023000089', supplier: '杭州精密机械制造厂', summary: '电机设备-高精度伺服电机等 (共1项)', amount: '700.00', status: '待审核', refundStatus: '未退款', date: '2023-10-26', creator: '张采购' },
    { id: 'RT-20231025-002', relatedOrder: 'CG20231020000045', supplier: '上海包装材料集团', summary: '包装耗材-定制防静电包装箱等 (共2项)', amount: '1,500.00', status: '待出库', refundStatus: '未退款', date: '2023-10-25', creator: '李专员' },
    { id: 'RT-20231024-001', relatedOrder: 'CG20231018000012', supplier: '北京科创线缆有限公司', summary: '线缆辅料-阻燃电缆等 (共1项)', amount: '4,200.00', status: '待退款', refundStatus: '部分退款', date: '2023-10-24', creator: '王主管' },
    { id: 'RT-20231020-005', relatedOrder: 'CG20231010000099', supplier: '苏州半导体科技', summary: '电子元器件-MCU芯片等 (共3项)', amount: '12,000.00', status: '已完成', refundStatus: '已退款', date: '2023-10-20', creator: '李专员' },
    { id: 'RT-20231018-003', relatedOrder: 'CG20231015000003', supplier: '广州日用百货批发', summary: '行政物资-办公用品等 (共5项)', amount: '350.00', status: '已驳回', refundStatus: '未退款', date: '2023-10-18', creator: '赵行政' },
    { id: 'RT-20231015-001', relatedOrder: 'CG20231005000001', supplier: '未知供应商', summary: '待完善退货信息', amount: '0.00', status: '草稿', refundStatus: '未退款', date: '2023-10-15', creator: '张采购' },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">采购退货</h1>
          <p className="text-sm text-slate-500 mt-1">管理采购退货申请、出库与退款进度</p>
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
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建退货单
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-4 shrink-0">
        <div className="flex-1 min-w-[200px] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="搜索退货单号、关联采购单、供应商..." 
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500">状态:</span>
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
              <option>全部状态</option>
              <option>草稿</option>
              <option>待审核</option>
              <option>待出库</option>
              <option>待退款</option>
              <option>已完成</option>
              <option>已驳回</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <button className="px-3 py-2 bg-slate-50 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-100 flex items-center transition-colors">
          <Filter className="w-4 h-4 mr-2 text-slate-500" />
          更多筛选
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200">退货单号</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200">关联采购单</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200">供应商</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200">退货内容</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">退货金额</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200">退款状态</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200">状态</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200">创建日期</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200">创建人</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map((rtn) => (
                <tr key={rtn.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 text-sm font-mono text-blue-600 cursor-pointer hover:underline" onClick={() => navigateTo('return_detail', rtn.id)}>
                    {rtn.id}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600 cursor-pointer hover:text-blue-600 hover:underline" onClick={() => navigateTo('detail', rtn.relatedOrder)}>
                    {rtn.relatedOrder}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {rtn.supplier}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={rtn.summary}>
                    {rtn.summary}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right font-medium">
                    {rtn.amount}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {rtn.refundStatus}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={rtn.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                    {rtn.date}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {rtn.creator}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-blue-600 hover:text-blue-800 font-medium" onClick={() => navigateTo('return_detail', rtn.id)}>查看</button>
                      
                      {rtn.status === '草稿' && (
                        <>
                          <button className="text-blue-600 hover:text-blue-800 font-medium">编辑</button>
                          <button className="text-red-600 hover:text-red-800 font-medium">删除</button>
                        </>
                      )}
                      
                      {rtn.status === '待审核' && (
                        <button className="text-orange-600 hover:text-orange-800 font-medium">取消审核</button>
                      )}
                      
                      {['待出库', '待退款', '已完成'].includes(rtn.status) && (
                        <button className="text-orange-600 hover:text-orange-800 font-medium">反审核</button>
                      )}
                      
                      {rtn.status === '已驳回' && (
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
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-sm text-slate-500">
            共 <span className="font-medium text-slate-900">{returns.length}</span> 条记录
          </div>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-500 text-sm hover:bg-slate-50 disabled:opacity-50">上一页</button>
            <button className="px-3 py-1 border border-blue-600 rounded bg-blue-50 text-blue-600 text-sm font-medium">1</button>
            <button className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-700 text-sm hover:bg-slate-50">2</button>
            <button className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-700 text-sm hover:bg-slate-50">3</button>
            <button className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-500 text-sm hover:bg-slate-50">下一页</button>
          </div>
        </div>
      </div>

      {/* New Return Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-[90vw] flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-base font-medium text-slate-800">新增</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Form Row */}
              <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                <div className="flex items-center">
                  <label className="w-20 text-right mr-4 text-sm text-slate-600 shrink-0">关联单据</label>
                  <div className="flex-1 relative">
                    <select className="w-full appearance-none border border-slate-200 rounded-sm px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white cursor-pointer">
                      <option value="" className="text-slate-300">请选择关联单据</option>
                      <option value="CG20231023000089">CG20231023000089 (采购单)</option>
                      <option value="INB-20231026-001">INB-20231026-001 (入库单)</option>
                      <option value="EXC-20231026-001">EXC-20231026-001 (异常单)</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2 h-4 w-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <label className="w-20 text-right mr-4 text-sm text-slate-600 shrink-0"><span className="text-red-500 mr-1">*</span>退货日期</label>
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-slate-300" />
                    </div>
                    <input type="text" placeholder="选择退货日期" className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-300" />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <label className="w-16 text-right mr-4 text-sm text-slate-600 shrink-0">供应商</label>
                  <div className="flex-1 relative">
                    <select className="w-full appearance-none border border-slate-200 rounded-sm px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white cursor-pointer">
                      <option value="">请选择供应商</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2 h-4 w-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <label className="w-20 text-right mr-4 text-sm text-slate-600 shrink-0">出库仓库</label>
                  <div className="flex-1">
                    <input type="text" value="旭利总仓" disabled className="w-full px-3 py-1.5 border border-slate-100 bg-slate-50 text-slate-400 rounded-sm text-sm focus:outline-none cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-sm overflow-hidden">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-white border-b border-slate-200">
                    <tr>
                      <th className="w-12 py-3 border-r border-slate-100">
                        <div className="flex justify-center">
                          <div className="w-4 h-4 border border-slate-200 rounded-sm bg-slate-50"></div>
                        </div>
                      </th>
                      <th className="py-3 text-sm font-medium text-slate-700 border-r border-slate-100">产品</th>
                      <th className="py-3 text-sm font-medium text-slate-700 border-r border-slate-100">库存数量</th>
                      <th className="py-3 text-sm font-medium text-slate-700 border-r border-slate-100">采购数量</th>
                      <th className="py-3 text-sm font-medium text-slate-700 border-r border-slate-100">已入库数量</th>
                      <th className="py-3 text-sm font-medium text-slate-700 border-r border-slate-100">本次退货数量</th>
                      <th className="py-3 text-sm font-medium text-slate-700">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={7} className="py-16 text-sm text-slate-400 text-center bg-white">
                        暂无数据
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks */}
              <div className="flex items-start max-w-2xl">
                <label className="w-20 text-right mr-4 text-sm text-slate-600 shrink-0 pt-1.5">单据备注</label>
                <div className="flex-1">
                  <input type="text" placeholder="请输入单据备注" className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-300" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end space-x-3 shrink-0">
              <button onClick={() => setIsNewModalOpen(false)} className="px-5 py-1.5 border border-slate-200 text-slate-600 rounded-sm text-sm hover:bg-slate-50 transition-colors">取消</button>
              <button onClick={() => { setIsNewModalOpen(false); navigateTo('return_detail', 'NEW'); }} className="px-5 py-1.5 bg-blue-600 text-white rounded-sm text-sm hover:bg-blue-700 transition-colors shadow-sm">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
