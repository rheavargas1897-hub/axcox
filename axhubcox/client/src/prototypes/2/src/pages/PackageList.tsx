import React, { useState } from 'react';
import { Search, Plus, Calendar, X, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import WarrantyDrawer from './WarrantyDrawer';
import PackageCreate from './PackageCreate';

const MOCK_PACKAGES = [
  { id: '1', status: 'active', name: '商用车高级盲区监控套餐', version: 'V2.1', effectiveTime: '2023-10-01 10:00:00', businessType: '普通视频', terminalType: '主动安全', isNetworkTransfer: '否', salesPlan: '普通销售', warrantyPlan: '高级3年质保', installCommission: '标准安装提成方案', salesCommission: '高级销售提成方案', partsCount: 4, description: '专为大货车及渣土车定制的盲区监控...' },
  { id: '2', status: 'draft', name: '乘用车基础定位套餐', version: 'V1.0', effectiveTime: '-', businessType: '普通定位GPS', terminalType: '部标', isNetworkTransfer: '是', salesPlan: '特惠套餐', warrantyPlan: '标准1年质保', installCommission: '标准安装提成方案', salesCommission: '基础销售提成方案', partsCount: 1, description: '基础定位服务...' },
  { id: '3', status: 'deactivated', name: '冷链物流温控套餐', version: 'V1.5', effectiveTime: '2023-01-01 00:00:00', businessType: '普通视频', terminalType: '非标', isNetworkTransfer: '否', salesPlan: '普通销售', warrantyPlan: '高级2年质保', installCommission: '无', salesCommission: '高级销售提成方案', partsCount: 3, description: '专属冷链温度...' },
  { id: '4', status: 'pending', name: '出租车内外双录套餐', version: 'V3.0', effectiveTime: '2024-01-01 00:00:00', businessType: '网约车（粤A）', terminalType: '普通视频', isNetworkTransfer: '否', salesPlan: '以租代购', warrantyPlan: '基础1年质保', installCommission: '特殊车安装补贴提成', salesCommission: '定制销售提成', partsCount: 2, description: '内外双录设备服务...' },
  { id: '5', status: 'expired', name: '网约车安全防护套餐', version: 'V1.2', effectiveTime: '2022-05-01 00:00:00', businessType: '网约车（粤A）', terminalType: '主动安全', isNetworkTransfer: '是', salesPlan: '普通销售', warrantyPlan: '标准1年质保', installCommission: '标准安装提成方案', salesCommission: '基础销售提成方案', partsCount: 3, description: '综合安全防护...' },
];

const MOCK_WARRANTIES = [
  { 
    id: '1', 
    status: 'active', 
    name: '高级3年质保', 
    type: 'package',
    boundItems: ['高级监控套餐', '按揭特别套餐'],
    firstBuyDetails: { giveFree: true, freeYears: '3年', addPrice: '50 - 150' },
    monitorServiceDetails: { freeTypes: ['渣土车', '普货'], price: '100', bindPackage: false, renewPrice: '100 - 300' },
    extendedWarrantyDetails: { supportTypes: ['客运', '危运'], price: '50', bindPackage: true },
    updatedAt: '2023-11-01 10:00:00' 
  },
  { 
    id: '2', 
    status: 'active', 
    name: '标准1年质保', 
    type: 'product',
    boundItems: ['1072部标机', 'T-Box'],
    firstBuyDetails: { giveFree: true, freeYears: '1年', addPrice: '100' },
    monitorServiceDetails: null,
    extendedWarrantyDetails: { supportTypes: [], price: '0', bindPackage: false },
    updatedAt: '2023-10-15 14:30:00' 
  },
  { 
    id: '3', 
    status: 'deactivated', 
    name: '高级2年质保', 
    type: 'package',
    boundItems: ['冷链物流温控套餐'],
    firstBuyDetails: { giveFree: true, freeYears: '2年', addPrice: '100' },
    monitorServiceDetails: { freeTypes: ['冷藏车'], price: '100', bindPackage: true, renewPrice: '100' },
    extendedWarrantyDetails: { supportTypes: ['全系'], price: '50', bindPackage: false },
    updatedAt: '2023-09-01 09:15:00' 
  },
];

export default function PackageList({ onViewDetail, onCreate }: { onViewDetail: () => void, onCreate: () => void }) {
  const [showFilters, setShowFilters] = useState(false);
  const [warrantyDrawer, setWarrantyDrawer] = useState<{isOpen: boolean, data?: any}>({isOpen: false});
  const [commissionDrawer, setCommissionDrawer] = useState<{isOpen: boolean, planName?: string}>({isOpen: false});
  const [editingPackage, setEditingPackage] = useState<any>(null);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {editingPackage && (
        <PackageCreate 
          initialData={editingPackage} 
          onBack={() => setEditingPackage(null)} 
          onSave={() => setEditingPackage(null)} 
        />
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">套餐管理</h1>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新建套餐
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-4">
              <div className="flex items-center gap-3">
                 <label className="w-20 text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">套餐名称</label>
                 <input type="text" placeholder="请输入套餐名称" className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-400" />
              </div>
              <div className="flex items-center gap-3">
                 <label className="w-20 text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">套餐状态</label>
                 <select className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-500">
                    <option value="">全部状态</option>
                    <option value="active">当前生效</option>
                    <option value="draft">草稿</option>
                    <option value="deactivated">已停用</option>
                    <option value="pending">未生效</option>
                    <option value="expired">已过期</option>
                 </select>
              </div>
              <div className="flex items-center gap-3">
                 <label className="w-20 text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">业务类型</label>
                 <select className="w-[200px] h-[34px] px-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-500">
                    <option value="">请选择业务类型</option>
                    <option value="video">普通视频</option>
                    <option value="taxi">网约车（粤A）</option>
                    <option value="gps">普通定位GPS</option>
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
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-4">
              <div className="flex items-center gap-3">
                 <label className="w-20 text-right text-sm font-medium text-slate-700 whitespace-nowrap shrink-0">生效时间</label>
                 <div className="relative w-[340px]">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="开始日期  至  结束日期" className="w-full h-[34px] pl-9 pr-3 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-400" />
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-4 font-medium">序号</th>
                <th className="px-4 py-4 font-medium">状态</th>
                <th className="px-4 py-4 font-medium">套餐名称</th>
                <th className="px-4 py-4 font-medium">当前版本</th>
                <th className="px-4 py-4 font-medium">安装部位数</th>
                <th className="px-4 py-4 font-medium">生效时间</th>
                <th className="px-4 py-4 font-medium">业务类型</th>
                <th className="px-4 py-4 font-medium">终端类型</th>
                <th className="px-4 py-4 font-medium">是否转网</th>
                <th className="px-4 py-4 font-medium">销售方案</th>
                <th className="px-4 py-4 font-medium">质保方案</th>
                <th className="px-4 py-4 font-medium">安装提成方案</th>
                <th className="px-4 py-4 font-medium">销售提成方案</th>
                <th className="px-4 py-4 font-medium w-48">套餐描述</th>
                <th className="px-4 py-4 font-medium text-right sticky right-0 bg-slate-50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_PACKAGES.map((pkg, index) => (
                <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4"><StatusBadge status={pkg.status} /></td>
                  <td className="px-4 py-4 font-medium text-slate-900">{pkg.name}</td>
                  <td className="px-4 py-4 font-mono text-slate-700">{pkg.version}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">{pkg.partsCount}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-500 font-mono text-xs">{pkg.effectiveTime}</td>
                  <td className="px-4 py-4 text-slate-700">{pkg.businessType}</td>
                  <td className="px-4 py-4 text-slate-700">{pkg.terminalType}</td>
                  <td className="px-4 py-4 text-slate-700">{pkg.isNetworkTransfer}</td>
                  <td className="px-4 py-4 text-slate-700">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{pkg.salesPlan}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    <button 
                      onClick={() => setWarrantyDrawer({ isOpen: true, data: MOCK_WARRANTIES.find(w => w.name === pkg.warrantyPlan) || { name: pkg.warrantyPlan } })}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                    >
                      {pkg.warrantyPlan}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {pkg.installCommission === '无' ? (
                      <span className="text-slate-500">无</span>
                    ) : (
                      <button 
                        onClick={() => setCommissionDrawer({ isOpen: true, planName: pkg.installCommission })}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {pkg.installCommission}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {pkg.salesCommission === '无' ? (
                      <span className="text-slate-500">无</span>
                    ) : (
                      <button 
                        onClick={() => setCommissionDrawer({ isOpen: true, planName: pkg.salesCommission })}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {pkg.salesCommission}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-500 truncate max-w-xs">{pkg.description}</td>
                  <td className="px-4 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
                    <button 
                      onClick={() => setEditingPackage({
                        ...pkg,
                        selectedPartIds: ['cam_f', 'cam_b'], // mock parts
                        partConfigs: {
                           'cam_f': { bindType: 'product', bindTargetName: '海康威视 DS-2CD2T47G2' },
                           'cam_b': { bindType: 'category', bindTargetName: '盲区摄像头类', excludedDevices: ['cam-b1'] }
                        }
                      })}
                      className="text-blue-600 font-medium hover:text-blue-800 transition-colors mr-3"
                    >
                      编辑
                    </button>
                    <button 
                      onClick={onViewDetail}
                      className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/50">
          <span>共 {MOCK_PACKAGES.length} 条记录</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50">上一页</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>

      {warrantyDrawer.isOpen && (
        <WarrantyDrawer 
          mode="view" 
          data={warrantyDrawer.data} 
          onClose={() => setWarrantyDrawer({ isOpen: false })} 
        />
      )}

      {commissionDrawer.isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[500px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100/80 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900">提成方案详情</h2>
              <button 
                onClick={() => setCommissionDrawer({ isOpen: false })}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">方案名称</label>
                  <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {commissionDrawer.planName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">包含提成角色</label>
                  <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    销售、代理商
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">关联业务模块</label>
                  <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    首次购买、续费
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 z-10">
              <button 
                onClick={() => setCommissionDrawer({ isOpen: false })}
                className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
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
