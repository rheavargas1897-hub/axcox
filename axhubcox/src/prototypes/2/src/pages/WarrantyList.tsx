import React, { useState } from 'react';
import { Search, Plus, Calendar, RefreshCw, X } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import WarrantyCreate from './WarrantyCreate';

export const MOCK_WARRANTIES = [
  { 
    id: '1', 
    status: 'active', 
    name: '高级3年质保', 
    type: 'package',
    creator: '系统管理员',
    config: {
      firstBuyConfigs: [{ id: '1', vehicles: ['渣土车', '普货'], giveFree: false, freeYears: '1年', supportAdd: true, addPrices: { '渣土车': '150', '普货': '200' } }],
      monitorConfigs: [{ id: '1', vehicles: ['渣土车', '普货'], serviceType: 'paid', monitorPrices: { '渣土车': '100', '普货': '200' }, renewYearly: true, renewYearlyPrices: { '渣土车': '100', '普货': '200' }, renewLinked: false }],
      extendConfigs: [{ id: '1', vehicles: ['渣土车', '普货'], supportExtend: true, extendFixed: true, extendFixedPrices: { '渣土车': '100', '普货': '100' }, extendLinked: true, extendLinkedPrices: { '渣土车': '50', '普货': '50' } }]
    },
  },
  { 
    id: '2', 
    status: 'active', 
    name: '标准1年质保', 
    type: 'product',
    creator: '张三',
    boundItems: ['1072部标机', 'T-Box'],
    config: {
      firstBuyConfigs: [{ id: '1', vehicles: ['客运车'], giveFree: true, freeYears: '1年', supportAdd: false, addPrices: {} }],
      monitorConfigs: [{ id: '1', vehicles: ['客运车'], serviceType: 'free', monitorPrices: {}, renewYearly: true, renewYearlyPrices: { '客运车': '100' }, renewLinked: false }],
      extendConfigs: [{ id: '1', vehicles: ['客运车'], supportExtend: true, extendFixed: true, extendFixedPrices: { '客运车': '100' }, extendLinked: false, extendLinkedPrices: {} }]
    },
    updatedAt: '2023-10-15 14:30:00' 
  },
  { 
    id: '3', 
    status: 'deactivated', 
    name: '专属监控质保', 
    type: 'package',
    creator: '李四',
    boundItems: ['大客户专属套餐'],
    config: {},
    updatedAt: '2023-09-01 09:15:00' 
  },
];

export default function WarrantyList({ onViewDetail, onCreate, onEdit, onCopy }: { onViewDetail: (item: any) => void, onCreate: () => void, onEdit: (item: any) => void, onCopy: (item: any) => void }) {
  const [list, setList] = useState(MOCK_WARRANTIES);
  const [boundItemsModal, setBoundItemsModal] = useState<{ isOpen: boolean; data?: any }>({ isOpen: false });

  const handleCopy = (item: any) => {
    onCopy(item);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">质保管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理套餐及产品的质保服务配置和延保规则</p>
        </div>
        <button 
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          新增质保方案
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                 <label className="w-[84px] text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">质保方案名称</label>
                 <input type="text" placeholder="请输入方案名称" className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-400" />
              </div>
              <div className="flex items-center gap-3">
                 <label className="w-[84px] text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">质保类型</label>
                 <select className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-500">
                    <option value="">请选择质保类型</option>
                    <option value="package">套餐质保</option>
                    <option value="product">单产品质保</option>
                 </select>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                 <button className="flex items-center justify-center gap-1.5 px-4 h-[34px] bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors">
                    <Search className="w-4 h-4" />
                    查询
                 </button>
                 <button className="flex items-center justify-center gap-1.5 px-4 h-[34px] bg-white border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    重置
                 </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f4f5f7] border-b border-slate-200 text-slate-700">
              <tr>
                <th className="px-4 py-4 font-medium w-16 text-center">序号</th>
                <th className="px-4 py-4 font-medium">状态</th>
                <th className="px-4 py-4 font-medium">方案名称</th>
                <th className="px-4 py-4 font-medium">质保类型</th>
                <th className="px-4 py-4 font-medium">适用信息</th>
                <th className="px-4 py-4 font-medium">创建人</th>
                <th className="px-4 py-4 font-medium">更新时间</th>
                <th className="px-4 py-4 font-medium text-right sticky right-0 bg-slate-50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {list.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-4 py-4 text-center text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-4 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-4 text-slate-700">{item.type === 'package' ? '套餐质保' : '单产品质保'}</td>
                  <td className="px-4 py-4 text-slate-700">
                    <button 
                      onClick={() => setBoundItemsModal({ isOpen: true, data: item })}
                      className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                    >
                      {(item.boundItems?.length ?? 0) > 0 ? `已应用 (${item.boundItems?.length ?? 0})` : '未应用'}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{item.creator}</td>
                  <td className="px-4 py-4 text-slate-500 font-mono text-xs">{item.updatedAt}</td>
                  <td className="px-4 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
                    <button onClick={() => onViewDetail(item)} className="text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">查看详情</button>
                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors ml-1">编辑</button>
                    <button onClick={() => handleCopy(item)} className="text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors ml-1">复制</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/50">
          <span>共 {list.length} 条记录</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50">上一页</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>

      {boundItemsModal.isOpen && boundItemsModal.data && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900">适用信息</h3>
              <button onClick={() => setBoundItemsModal({ isOpen: false })} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-sm font-medium text-slate-900 mb-3">
                {boundItemsModal.data.type === 'package' ? '适用套餐' : '适用产品'}
              </div>
              <div className="flex flex-wrap gap-2">
                {boundItemsModal.data.boundItems && boundItemsModal.data.boundItems.length > 0 ? (
                  boundItemsModal.data.boundItems.map((item: string) => (
                    <span key={item} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm">{item}</span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">未绑定任何{boundItemsModal.data.type === 'package' ? '套餐' : '产品'}</span>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setBoundItemsModal({ isOpen: false })}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
