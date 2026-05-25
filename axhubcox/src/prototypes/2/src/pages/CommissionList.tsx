import React, { useState } from 'react';
import { Search, Plus, Calendar, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const MOCK_COMMISSIONS = [
  { id: '1', status: 'active', name: '标准安装提成方案', type: '安装提成', vehicleTypes: '客运车、货车', creator: '系统管理员', createdAt: '2023-11-01 10:00:00', config: {} },
  { id: '2', status: 'active', name: '高级销售提成方案', type: '销售提成', vehicleTypes: '客运车、其他车型', creator: '张三', createdAt: '2023-10-15 14:30:00', config: {} },
  { id: '3', status: 'deactivated', name: '定制提成方案', type: '综合提成', vehicleTypes: '渣土车', creator: '李四', createdAt: '2023-09-01 09:15:00', config: {} },
];

export default function CommissionList({ onViewDetail, onCreate, onEdit, onCopy }: { onViewDetail: () => void, onCreate: () => void, onEdit: (item: any) => void, onCopy: (item: any) => void }) {
  const [list, setList] = useState(MOCK_COMMISSIONS);

  const handleCopy = (item: any) => {
    onCopy(item);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">提成管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理各业务环节的提成比例与固定金额配置</p>
        </div>
        <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          新增提成方案
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                 <label className="w-[84px] text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">提成方案名称</label>
                 <input type="text" placeholder="请输入提成方案名称" className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-400" />
              </div>
              <div className="flex items-center gap-3">
                 <label className="w-[84px] text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">提成类型</label>
                 <select className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-500">
                    <option value="">请选择提成类型</option>
                    <option value="install">安装提成</option>
                    <option value="sales">销售提成</option>
                    <option value="combo">综合提成</option>
                 </select>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                 <button className="flex items-center justify-center gap-1.5 px-4 h-[34px] bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors">
                    <Search className="w-4 h-4" />
                    搜索
                 </button>
                 <button className="flex items-center justify-center gap-1.5 px-4 h-[34px] bg-white border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    重置
                 </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f4f5f7] border-b border-slate-200 text-slate-700">
              <tr>
                <th className="px-4 py-4 font-medium w-16 text-center">序号</th>
                <th className="px-4 py-4 font-medium">状态</th>
                <th className="px-4 py-4 font-medium">方案名称</th>
                <th className="px-4 py-4 font-medium">提成类型</th>
                <th className="px-4 py-4 font-medium">适用车型</th>
                <th className="px-4 py-4 font-medium">创建人</th>
                <th className="px-4 py-4 font-medium">创建时间</th>
                <th className="px-4 py-4 font-medium text-right sticky right-0 bg-slate-50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {list.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-4 py-4 text-center text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-4 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-4 text-slate-700">{item.type}</td>
                  <td className="px-4 py-4 text-slate-700">{item.vehicleTypes}</td>
                  <td className="px-4 py-4 text-slate-700">{item.creator}</td>
                  <td className="px-4 py-4 text-slate-500 font-mono text-xs">{item.createdAt}</td>
                  <td className="px-4 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
                    <button onClick={onViewDetail} className="text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">查看详情</button>
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
    </div>
  );
}
