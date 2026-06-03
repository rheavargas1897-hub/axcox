import React, { useState } from 'react';
import { X, Edit, Power, PowerOff } from 'lucide-react';
import { OperationLog } from '../components/OperationLog';

export default function CommissionDetail({ onClose }: { onClose: () => void }) {
  const [commissionType] = useState('sales'); // active is 'sales' for preview
  const [salesDimension] = useState('mixed'); // 'device' | 'package' | 'mixed'
  const [status, setStatus] = useState('active');

  const installRules = [
    { vehicleType: '客运车', parts: [{ name: '前方摄像头', amount: '50', type: 'amount' }] },
  ];

  const salesRoles = ['销售', '商务', '销售助理'];
  const salesProductRules = [
     { 
        id: '1', product: '倒车摄像头', 
        vehicles: [
           { id: '1-1', vehicle: '客运车', roles: { '销售': { value: '3', type: 'percentage' }, '商务': { value: '1', type: 'percentage' } } },
           { id: '1-2', vehicle: '其他车型', roles: { '销售': { value: '5', type: 'percentage' } } }
        ] 
     }
  ];
  const salesPackageRules = [
     { 
        id: 'p1', package: '基础安全套餐', 
        vehicles: [
           { id: 'p1-1', vehicle: '客运车', roles: { '销售': { value: '4', type: 'percentage' } } },
           { id: 'p1-2', vehicle: '货车', roles: { '销售': { value: '6', type: 'percentage' } } }
        ] 
     }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="w-[800px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">提成方案详情</h2>
            {status === 'active' ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium border border-green-200/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>启用
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-medium border border-slate-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>停用
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
              <Edit className="w-4 h-4" />
              编辑
            </button>
            <button 
              onClick={() => setStatus(status === 'active' ? 'deactivated' : 'active')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
            >
              {status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
              {status === 'active' ? '停用' : '启用'}
            </button>
            <div className="w-px h-4 bg-slate-200 mx-2"></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 bg-slate-50/50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
              <span className="w-1 h-3.5 bg-blue-500 rounded-full"></span>
              基本信息
            </h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-slate-500">方案名称</span>
                <span className="text-sm font-medium text-slate-900">高级销售提成方案</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-slate-500">提成类型</span>
                <span className="text-sm font-medium text-slate-900">销售提成</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-slate-500">创建人</span>
                <span className="text-sm font-medium text-slate-900">管理员 (admin)</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-slate-500">创建时间</span>
                <span className="text-sm font-medium text-slate-900 font-mono">2023-11-01 10:00:00</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
              <span className="w-1 h-3.5 bg-blue-500 rounded-full"></span>
              规则配置详细
            </h3>
            
            {commissionType === 'install' && (
              <div className="space-y-4">
                {installRules.map((rule, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-medium text-sm text-slate-800">
                      车型: {rule.vehicleType}
                    </div>
                    <div className="p-4 bg-white">
                      <table className="w-[400px] text-sm text-left">
                        <thead>
                          <tr className="text-slate-500 text-xs border-b border-slate-100">
                            <th className="pb-2 font-medium">安装部位</th>
                            <th className="pb-2 font-medium text-right">提成配置</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {rule.parts.map((p: any, pIdx) => (
                            <tr key={pIdx}>
                              <td className="py-2.5 text-slate-700">{p.name}</td>
                              <td className="py-2.5 text-slate-900 font-medium text-right">
                                {p.type === 'percentage' ? `${p.amount}%` : `¥${p.amount}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {commissionType === 'sales' && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">参与销售角色</h4>
                  <div className="flex flex-wrap gap-2">
                    {salesRoles.map((role, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">销售维度类型</h4>
                  <span className="text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg inline-block">混合模式 (设备+套餐)</span>
                </div>

                {(salesDimension === 'device' || salesDimension === 'mixed') && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">提成比例配置 (按单产品)</h4>
                    <div className="space-y-4">
                      {salesProductRules.map(rule => (
                        <div key={rule.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-medium text-sm text-slate-800">
                            产品: {rule.product}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-[#fdfdfd] border-b border-slate-100 text-slate-500">
                                <tr>
                                  <th className="px-4 py-3 font-medium border-r border-slate-100 w-48">车型</th>
                                  {salesRoles.map(role => (
                                    <th key={role} className="px-4 py-3 font-medium border-r border-slate-100 text-center">{role}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {rule.vehicles.map(v => (
                                  <tr key={v.id}>
                                    <td className="px-4 py-3 border-r border-slate-100 font-medium text-slate-700 bg-[#fbfbfc]">{v.vehicle}</td>
                                    {salesRoles.map(role => {
                                      const rInfo = (v.roles as any)[role];
                                      return (
                                        <td key={role} className="px-4 py-3 border-r border-slate-100 text-center font-medium text-blue-600">
                                          {rInfo ? (rInfo.type === 'percentage' ? `${rInfo.value}%` : `¥${rInfo.value}`) : '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(salesDimension === 'package' || salesDimension === 'mixed') && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">提成比例配置 (按套餐)</h4>
                    <div className="space-y-4">
                      {salesPackageRules.map(rule => (
                        <div key={rule.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-medium text-sm text-slate-800">
                            套餐: {rule.package}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-[#fdfdfd] border-b border-slate-100 text-slate-500">
                                <tr>
                                  <th className="px-4 py-3 font-medium border-r border-slate-100 w-48">车型</th>
                                  {salesRoles.map(role => (
                                    <th key={role} className="px-4 py-3 font-medium border-r border-slate-100 text-center">{role}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {rule.vehicles.map(v => (
                                  <tr key={v.id}>
                                    <td className="px-4 py-3 border-r border-slate-100 font-medium text-slate-700 bg-[#fbfbfc]">{v.vehicle}</td>
                                    {salesRoles.map(role => {
                                      const rInfo = (v.roles as any)[role];
                                      return (
                                        <td key={role} className="px-4 py-3 border-r border-slate-100 text-center font-medium text-blue-600">
                                          {rInfo ? (rInfo.type === 'percentage' ? `${rInfo.value}%` : `¥${rInfo.value}`) : '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
          <OperationLog />
        </div>
      </div>
    </div>
  );
}
