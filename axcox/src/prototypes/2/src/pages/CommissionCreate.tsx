import React, { useState } from 'react';
import { X } from 'lucide-react';
import CommissionForm from '../components/CommissionForm';

export default function CommissionCreate({ onBack, onSave, initialData }: { onBack: () => void, onSave: () => void, initialData?: any }) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'install'|'sales'|'both'>(
    initialData?.type === '安装提成' ? 'install' :
    initialData?.type === '销售提成' ? 'sales' : 'both'
  );
  const [formData, setFormData] = useState<any>(initialData?.config || {});

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="w-[1000px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{initialData ? '编辑提成方案' : '新增提成方案'}</h2>
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 bg-white">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="w-32 text-right text-sm font-medium text-slate-700 whitespace-nowrap"><span className="text-red-500 mr-1">*</span>提成类型:</label>
              <div className="flex items-center gap-6">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="install" checked={type === 'install'} onChange={() => setType('install')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                    <span className="text-sm text-slate-700">安装提成</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="sales" checked={type === 'sales'} onChange={() => setType('sales')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                    <span className="text-sm text-slate-700">销售提成</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="both" checked={type === 'both'} onChange={() => setType('both')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                    <span className="text-sm text-slate-700">综合提成</span>
                 </label>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-right text-sm font-medium text-slate-700 whitespace-nowrap"><span className="text-red-500 mr-1">*</span>提成方案名称:</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入提成方案名称" 
                className="w-[400px] px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-900" 
              />
            </div>

            <div className="pl-4">
              <CommissionForm type={type} value={formData} onChange={setFormData} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onBack}
            className="px-6 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
