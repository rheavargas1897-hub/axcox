import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import WarrantyForm from '../components/WarrantyForm';
import { OperationLog } from '../components/OperationLog';

export default function WarrantyCreate({ onBack, onSave, initialData, readOnly = false }: { onBack: () => void, onSave: () => void, initialData?: any, readOnly?: boolean }) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'package' | 'product'>(
    initialData?.type === 'product' ? 'product' : 'package'
  );
  
  // Convert existing format or use mock if editing
  const [formData, setFormData] = useState<any>(initialData?.config || {});

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="h-[60px] border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
             <h2 className="text-lg font-bold text-slate-800">
               {readOnly ? '查看质保方案' : (initialData ? '编辑质保方案' : '新增质保方案')}
             </h2>
             {readOnly && initialData?.status && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                   initialData.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                   {initialData.status === 'active' ? '已启用' : '已停用'}
                </span>
             )}
          </div>
        </div>
        {!readOnly && (
           <div className="flex items-center gap-3">
             <button 
               onClick={onBack}
               className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors"
             >
               取消
             </button>
             <button 
               onClick={onSave}
               className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
             >
               <CheckCircle2 className="w-4 h-4" />
               保存方案
             </button>
           </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-[1000px] mx-auto py-8">
          {readOnly && initialData && (
             <div className="mb-6 flex items-center gap-6 text-sm text-slate-500 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div><span className="text-slate-400 mr-2">创建人</span>{initialData.creator || '黄经理'}</div>
                <div><span className="text-slate-400 mr-2">更新时间</span>{initialData.updatedAt || '2023-11-01 10:00:00'}</div>
             </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
            {/* Step 1 */}
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                基础信息
              </h3>
              
              <div className="grid grid-cols-2 gap-8 max-w-3xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700"><span className="text-red-500 mr-1">*</span>方案名称</label>
                  {readOnly ? (
                     <div className="text-sm text-slate-900 h-[38px] flex items-center">{name}</div>
                  ) : (
                     <input 
                       type="text" 
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       placeholder="请输入质保方案名称" 
                       className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-400" 
                     />
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700"><span className="text-red-500 mr-1">*</span>质保类型</label>
                  {readOnly ? (
                     <div className="text-sm text-slate-900 h-[38px] flex items-center">
                        {type === 'package' ? '套餐质保' : '单产品质保'}
                     </div>
                  ) : (
                     <div className="flex gap-6 h-[38px] items-center">
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input type="radio" checked={type === 'package'} onChange={() => setType('package')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                         <span className="text-sm text-slate-700">套餐质保</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input type="radio" checked={type === 'product'} onChange={() => setType('product')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                         <span className="text-sm text-slate-700">单产品质保</span>
                       </label>
                     </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-6 pt-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                配置模块
              </h3>
              
              <WarrantyForm readOnly={readOnly} type={type} value={formData} onChange={setFormData} />
            </div>
          </div>
          {readOnly && <OperationLog />}
        </div>
      </div>
    </div>
  );
}
