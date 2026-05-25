import React, { useState } from 'react';
import { Search, Plus, RefreshCw, X } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

const INITIAL_MOCK_PARTS = [
  { id: '1', name: '前方摄像头', code: 'CAM-FRONT', vehicleTypes: ['客运车', '货车', '渣土车'], status: 'active', remark: '安装于驾驶室前方' },
  { id: '2', name: '盲区摄像头', code: 'CAM-BLIND', vehicleTypes: ['大货车', '渣土车'], status: 'active', remark: '右侧盲区监控' },
  { id: '3', name: '倒车摄像头', code: 'CAM-REAR', vehicleTypes: ['客运车', '货车', '工程车'], status: 'deactivated', remark: '尾部倒车辅助' },
];

export default function InstallPartList() {
  const [parts, setParts] = useState(INITIAL_MOCK_PARTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);

  const handleCreate = () => {
    setEditingPart(null);
    setIsModalOpen(true);
  };

  const handleEdit = (part: any) => {
    setEditingPart(part);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">安装部位配置</h1>
          <p className="text-sm text-slate-500 mt-1">全局安装部位基础数据维护</p>
        </div>
        <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          新增部位
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-3">
             <label className="text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">部位名称</label>
             <input type="text" placeholder="请输入部位名称" className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-400" />
          </div>
          <div className="flex items-center gap-3">
             <label className="text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">适用车型</label>
             <select className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-500">
                <option value="">全部车型</option>
                <option value="客运车">客运车</option>
                <option value="货车">货车</option>
                <option value="渣土车">渣土车</option>
                <option value="工程车">工程车</option>
             </select>
          </div>
          <div className="flex items-center gap-3">
             <label className="text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">状态</label>
             <select className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-500">
                <option value="">全部状态</option>
                <option value="active">启用</option>
                <option value="deactivated">停用</option>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f4f5f7] border-b border-slate-200 text-slate-700">
              <tr>
                <th className="px-4 py-4 font-medium w-16 text-center">序号</th>
                <th className="px-4 py-4 font-medium w-24">状态</th>
                <th className="px-4 py-4 font-medium">部位编码</th>
                <th className="px-4 py-4 font-medium">部位名称</th>
                <th className="px-4 py-4 font-medium">适用车型</th>
                <th className="px-4 py-4 font-medium">备注</th>
                <th className="px-4 py-4 font-medium text-right sticky right-0 bg-slate-50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {parts.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-4 py-4 text-center text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-700">{item.code}</td>
                  <td className="px-4 py-4 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-4 text-slate-700">{item.vehicleTypes.join('、')}</td>
                  <td className="px-4 py-4 text-slate-500">{item.remark || '-'}</td>
                  <td className="px-4 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">编辑</button>
                    <button 
                      className="text-slate-600 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors ml-1"
                      onClick={() => setParts(parts.map(p => p.id === item.id ? {...p, status: p.status === 'active' ? 'deactivated' : 'active'} : p))}
                    >
                      {item.status === 'active' ? '停用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[500px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">{editingPart ? '编辑安装部位' : '新增安装部位'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="flex items-center gap-4">
                <label className="w-20 text-right text-sm font-medium text-slate-700"><span className="text-red-500 mr-1">*</span>部位名称:</label>
                <input type="text" defaultValue={editingPart?.name} placeholder="请输入部位名称" className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-900" />
              </div>
              <div className="flex items-center gap-4">
                <label className="w-20 text-right text-sm font-medium text-slate-700"><span className="text-red-500 mr-1">*</span>部位编码:</label>
                <input type="text" defaultValue={editingPart?.code} placeholder="请输入部位编码，如CAM-01" className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-900 font-mono" />
              </div>
              <div className="flex items-start gap-4">
                <label className="w-20 text-right text-sm font-medium text-slate-700 mt-2"><span className="text-red-500 mr-1">*</span>适用车型:</label>
                <div className="flex-1 flex flex-wrap gap-4 mt-2">
                  {['客运车', '货车', '渣土车', '工程车', '乘用车', '出租车', '网约车'].map(vt => (
                    <label key={vt} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked={editingPart?.vehicleTypes?.includes(vt)} className="text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                      {vt}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <label className="w-20 text-right text-sm font-medium text-slate-700 mt-2">备注:</label>
                <textarea defaultValue={editingPart?.remark} rows={3} placeholder="选填，备注信息" className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-900 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">取消</button>
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">保存配置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
