import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { INITIAL_OPTIONS } from './DictionaryConfig';
import CommissionForm from '../components/CommissionForm';
import WarrantyForm from '../components/WarrantyForm';
import { MOCK_COMMISSIONS } from './CommissionList';
import { MOCK_WARRANTIES } from './WarrantyList';

const INSTALL_PARTS = (INITIAL_OPTIONS['2'] || []).filter(o => o.status === 'active');

export default function PackageCreate({ onBack, onSave, initialData }: { onBack: () => void, onSave: () => void, initialData?: any }) {
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [effectiveTimeType, setEffectiveTimeType] = useState<'immediate' | 'custom'>(initialData ? 'custom' : 'immediate');
  const [warrantyMode, setWarrantyMode] = useState<'existing' | 'custom'>(initialData?.warrantyMode || 'existing');
  const [selectedWarrantyId, setSelectedWarrantyId] = useState(initialData?.selectedWarrantyId || '');
  const [customWarrantyData, setCustomWarrantyData] = useState<any>(initialData?.customWarrantyData || {});
  const [customWarrantySaveMode, setCustomWarrantySaveMode] = useState<'once'|'save'>(initialData?.customWarrantySaveMode || 'once');
  const [customWarrantySaveName, setCustomWarrantySaveName] = useState(initialData?.customWarrantySaveName || '');
  const [canAddOnProduct, setCanAddOnProduct] = useState(initialData?.canAddOnProduct ?? false);
  const [isNetworkTransfer, setIsNetworkTransfer] = useState(initialData?.isNetworkTransfer === '是');

  // Bound Products Configuration States
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>(initialData?.selectedPartIds || []);
  const [partConfigs, setPartConfigs] = useState<Record<string, { bindType: 'product' | 'category', bindTargetName: string, excludedDevices?: string[], qty?: number }>>(initialData?.partConfigs || {});
  const [expandedCategoryPartId, setExpandedCategoryPartId] = useState<string | null>(null);

  // Install Commission Info
  const [installCommissionMode, setInstallCommissionMode] = useState<'existing'|'custom'>(initialData?.installCommissionMode || 'existing');
  const [selectedInstallCommissionId, setSelectedInstallCommissionId] = useState(initialData?.selectedInstallCommissionId || '');
  const [customInstallCommissionData, setCustomInstallCommissionData] = useState<any>(initialData?.customInstallCommissionData || {});
  const [customInstallSaveMode, setCustomInstallSaveMode] = useState<'once'|'save'>(initialData?.customInstallSaveMode || 'once');
  const [customInstallSaveName, setCustomInstallSaveName] = useState(initialData?.customInstallSaveName || '');

  // Sales Commission Info
  const [salesCommissionMode, setSalesCommissionMode] = useState<'existing'|'custom'>(initialData?.salesCommissionMode || 'existing');
  const [selectedSalesCommissionId, setSelectedSalesCommissionId] = useState(initialData?.selectedSalesCommissionId || '');
  const [customSalesCommissionData, setCustomSalesCommissionData] = useState<any>(initialData?.customSalesCommissionData || {});
  const [customSalesSaveMode, setCustomSalesSaveMode] = useState<'once'|'save'>(initialData?.customSalesSaveMode || 'once');
  const [customSalesSaveName, setCustomSalesSaveName] = useState(initialData?.customSalesSaveName || '');

  // Form Fields
  const [packageName, setPackageName] = useState(initialData?.name || '');
  const [packageDescription, setPackageDescription] = useState(initialData?.description || '');
  const [businessType, setBusinessType] = useState(initialData?.businessType || '');
  const [terminalType, setTerminalType] = useState(initialData?.terminalType || '');

  // Mock devices in categories
  const CATEGORY_DEVICES: Record<string, { id: string, name: string, category: string, brand: string, model: string }[]> = {
    '前方摄像头类': [
      { id: 'cam-f1', name: '海康威视 DS-2CD2T47G2', category: '前端摄像头', brand: '海康威视', model: 'DS-2CD2T47G2' },
      { id: 'cam-f2', name: '大华 高清前方探头 A-1', category: '前端摄像头', brand: '大华', model: 'A-1' },
      { id: 'cam-f3', name: '鹰眼 前置记录仪 F4', category: '前端摄像头', brand: '鹰眼', model: 'F4' }
    ],
    '盲区摄像头类': [
      { id: 'cam-b1', name: '鹰眼 BSD盲区摄像头', category: '盲区摄像头', brand: '鹰眼', model: 'BSD-1' },
      { id: 'cam-b2', name: '海康威视 盲区雷达套件', category: '盲区摄像头', brand: '海康威视', model: 'DS-B1' }
    ],
    '定位追踪器类': [
      { id: 'gps-1', name: '华为 MT700 定位终端', category: '定位终端', brand: '华为', model: 'MT700' },
      { id: 'gps-2', name: '中导 北斗高精度终端', category: '定位终端', brand: '中导', model: 'ZD-BD1' }
    ],
    '车厢内部摄像头类': [
      { id: 'cam-in1', name: '海康 客流统计摄像头', category: '车内摄像头', brand: '海康威视', model: 'DS-IN1' }
    ]
  };

  const togglePartSelection = (partId: string) => {
    setSelectedPartIds(prev => 
      prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId]
    );
  };

  const handleConfigChange = (partId: string, config: { bindType: 'product' | 'category', bindTargetName: string, excludedDevices?: string[], qty?: number }) => {
    setPartConfigs(prev => ({
      ...prev,
      [partId]: config
    }));
  };

  const toggleExcludeDevice = (partId: string, deviceId: string) => {
    setPartConfigs(prev => {
      const config = prev[partId];
      if (!config) return prev;
      const excluded = config.excludedDevices || [];
      const newExcluded = excluded.includes(deviceId) ? excluded.filter(id => id !== deviceId) : [...excluded, deviceId];
      return { ...prev, [partId]: { ...config, excludedDevices: newExcluded } };
    });
  };

  const internalOnSave = () => {
    if (selectedPartIds.length > 0) {
      const isComplete = selectedPartIds.every(partId => {
        const config = partConfigs[partId];
        return config && config.bindTargetName.trim() !== '';
      });
      if (!isComplete) {
        alert('请为每个已选的安装部位完成产品或类别绑定！');
        return;
      }
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[1000px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">新增套餐</h2>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1">
          {/* Top Section: Basic Info */}
          <div className="flex flex-col gap-y-6">
            <div className="flex items-start gap-4">
              <label className="w-28 text-right text-sm text-slate-700 whitespace-nowrap pt-2"><span className="text-red-500 mr-1">*</span>套餐名称:</label>
              <input type="text" value={packageName} onChange={e => setPackageName(e.target.value)} className="w-[400px] px-3 py-2 border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all" />
            </div>
            <div className="flex items-start gap-4">
              <label className="w-28 text-right text-sm text-slate-700 whitespace-nowrap pt-2"><span className="text-red-500 mr-1">*</span>套餐描述:</label>
              <textarea rows={3} value={packageDescription} onChange={e => setPackageDescription(e.target.value)} className="w-[600px] px-3 py-2 border border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all resize-none" />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-28 text-right text-sm text-slate-700 whitespace-nowrap">业务类型:</label>
              <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-[400px] px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-600 bg-white">
                <option value="">请选择业务类型</option>
                <option value="普通视频">普通视频-仅具备录像回放，无主动安全算法</option>
                <option value="网约车（粤A）">网约车（粤A）-网约车部标安装服务</option>
                <option value="普通定位GPS">普通定位GPS-(隐藏安装通用)</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-28 text-right text-sm text-slate-700 whitespace-nowrap">是否为转网套餐:</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isNetworkTransfer} onChange={(e) => setIsNetworkTransfer(e.target.checked)} />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                <span className="ml-3 text-sm font-medium text-slate-700">{isNetworkTransfer ? '是' : '否'}</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-28 text-right text-sm text-slate-700 whitespace-nowrap">终端类型:</label>
              <select value={terminalType} onChange={e => setTerminalType(e.target.value)} className="w-[400px] px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-600 bg-white">
                <option value="">请选择终端类型</option>
                <option value="主动安全">主动安全</option>
                <option value="普通视频">普通视频</option>
                <option value="部标">部标</option>
                <option value="非标">非标</option>
                <option value="OBD设备">OBD设备</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="w-28 text-right text-sm text-slate-700 whitespace-nowrap">销售方案:</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  普通销售
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  以租代购
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  特惠套餐
                </label>
              </div>
            </div>
          </div>

          {/* Middle Section: Price Settings */}
          <div className="mt-12 pt-8 relative">
            <div className="absolute top-0 left-0 w-8 h-[1px] bg-slate-200"></div>
            <h3 className="text-base font-bold text-slate-900 mb-6">价格设置</h3>
            <div className="flex items-center gap-4 mb-6">
              <label className="text-sm text-slate-700">价格生效时间</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="radio" 
                    name="effectiveTime" 
                    checked={effectiveTimeType === 'immediate'}
                    onChange={() => setEffectiveTimeType('immediate')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  立刻生效
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="radio" 
                    name="effectiveTime" 
                    checked={effectiveTimeType === 'custom'}
                    onChange={() => setEffectiveTimeType('custom')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  自定义时间
                </label>
              </div>
              {effectiveTimeType === 'custom' && (
                <div className="flex items-center gap-2 ml-4 relative">
                  <input type="datetime-local" className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-600" />
                  <span className="text-sm text-slate-500">至</span>
                  <input type="datetime-local" className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-600" />
                </div>
              )}
            </div>
            
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium text-slate-700 w-16">序号</th>
                    <th className="px-6 py-3 font-medium text-slate-700 text-center">服务年限（年）</th>
                    <th className="px-6 py-3 font-medium text-slate-700 text-center">套餐价格（元）</th>
                    <th className="px-6 py-3 font-medium text-slate-700 text-center">续费价格（元）</th>
                    <th className="px-6 py-3 font-medium text-slate-700 w-20 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-6 py-4 text-slate-500">1</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-red-500">*</span>
                        <span className="text-slate-700 mr-2 whitespace-nowrap">服务年限（年）</span>
                        <input type="text" placeholder="请输入年限" className="w-32 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-red-500">*</span>
                        <span className="text-slate-700 mr-2 whitespace-nowrap">套餐价格（元）</span>
                        <input type="text" placeholder="请输入套餐价格" className="w-32 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-red-500">*</span>
                        <span className="text-slate-700 mr-2 whitespace-nowrap">续费价格（元）</span>
                        <input type="text" placeholder="请输入续费价格" className="w-32 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors">删除</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button className="mt-4 flex items-center gap-1 text-sm text-emerald-500 hover:text-emerald-600 font-medium">
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>

          {/* Bottom Section: Bound Product Info */}
          <div className="mt-10 border-t border-slate-100 pt-8">
            <h3 className="text-base font-bold text-slate-900 mb-6">绑定产品及部位配置</h3>
            
            <div className="mb-6 flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-sm font-medium text-slate-800">下单时是否支持额外加购产品:</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" checked={canAddOnProduct} onChange={() => setCanAddOnProduct(true)} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" /> 是
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" checked={!canAddOnProduct} onChange={() => setCanAddOnProduct(false)} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" /> 否
                </label>
              </div>
              <span className="text-sm text-slate-400 ml-2">加购的产品享受跟套餐一样的质保方案</span>
            </div>

            <div className="space-y-6">
              {/* 1. Select Install Parts */}
              <div>
                <h4 className="font-medium text-slate-800 text-sm mb-3">第一步：选择安装部位（多选）</h4>
                <div className="flex flex-wrap gap-3 p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg">
                  {INSTALL_PARTS.map(part => (
                    <label 
                      key={part.id} 
                      className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                        selectedPartIds.includes(part.id) 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedPartIds.includes(part.id)}
                        onChange={() => togglePartSelection(part.id)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                      />
                      <span className="text-sm font-medium">{part.name}</span>
                    </label>
                  ))}
                  {INSTALL_PARTS.length === 0 && (
                    <div className="text-sm text-slate-500 py-2">暂无启用的安装部位选项，请前往信息配置表添加。</div>
                  )}
                </div>
              </div>

              {/* 2. Configure Products per Part */}
              {selectedPartIds.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-800 text-sm mb-3">第二步：为每个安装部位绑定产品</h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#fdfdfd] border-b border-slate-100 text-slate-600">
                        <tr>
                          <th className="px-6 py-3 font-medium w-48 border-r border-slate-100">安装部位</th>
                          <th className="px-6 py-3 font-medium">绑定配置</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPartIds.map(partId => {
                          const part = INSTALL_PARTS.find(p => p.id === partId);
                          const config = partConfigs[partId] || { bindType: 'product', bindTargetName: '', qty: 1 };
                          
                          return (
                            <tr key={partId} className="hover:bg-slate-50/30">
                              <td className="px-6 py-4 font-medium text-slate-800 border-r border-slate-100 bg-[#fbfbfc]">
                                {part?.name}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-4 border-r border-slate-200 pr-6 shrink-0">
                                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        checked={config.bindType === 'product'} 
                                        onChange={() => handleConfigChange(partId, { bindType: 'product', bindTargetName: '', qty: config.qty || 1 })}
                                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                                      />
                                      指定产品
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        checked={config.bindType === 'category'} 
                                        onChange={() => handleConfigChange(partId, { bindType: 'category', bindTargetName: '', qty: config.qty || 1 })}
                                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" 
                                      />
                                      指定产品类别
                                    </label>
                                  </div>
                                  
                                  <div className="flex-1 max-w-md">
                                    {config.bindType === 'product' ? (
                                      <div className="relative">
                                        <select 
                                          value={config.bindTargetName}
                                          onChange={(e) => handleConfigChange(partId, { ...config, bindTargetName: e.target.value })}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        >
                                          <option value="">请搜索并选择具体产品...</option>
                                          <option value="海康威视 DS-2CD2T47G2">海康威视 DS-2CD2T47G2</option>
                                          <option value="华为 MT700 定位终端">华为 MT700 定位终端</option>
                                          <option value="大华 高清摄像头 A-1">大华 高清摄像头 A-1</option>
                                        </select>
                                      </div>
                                    ) : (
                                      <div className="relative">
                                        <div className="flex items-center gap-2 w-full">
                                          <select 
                                            value={config.bindTargetName}
                                            onChange={(e) => handleConfigChange(partId, { ...config, bindTargetName: e.target.value, excludedDevices: [] })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                          >
                                            <option value="">请选择产品分类...</option>
                                            <option value="前方摄像头类">前方摄像头类</option>
                                            <option value="盲区摄像头类">盲区摄像头类</option>
                                            <option value="车厢内部摄像头类">车厢内部摄像头类</option>
                                            <option value="定位追踪器类">定位追踪器类</option>
                                          </select>
                                          {config.bindTargetName && CATEGORY_DEVICES[config.bindTargetName] && (
                                            <button 
                                              type="button"
                                              onClick={() => setExpandedCategoryPartId(expandedCategoryPartId === partId ? null : partId)}
                                              className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap px-2 py-1"
                                            >
                                              {expandedCategoryPartId === partId ? '收起明细' : '查看明细'}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-[#8C8C8C]">数量</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={config.qty || 1}
                                      onChange={(event) => handleConfigChange(partId, { ...config, qty: Math.max(1, Number(event.target.value) || 1) })}
                                      className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                
                                {config.bindType === 'category' && config.bindTargetName && expandedCategoryPartId === partId && CATEGORY_DEVICES[config.bindTargetName] && (
                                  <div className="mt-4 border border-slate-200 rounded-md bg-slate-50 overflow-hidden">
                                    <table className="w-full text-left text-sm table-auto">
                                      <thead className="bg-[#f4f5f7] border-b border-slate-200 text-slate-600">
                                        <tr>
                                          <th className="px-4 py-2 font-medium">设备名称</th>
                                          <th className="px-4 py-2 font-medium">品牌</th>
                                          <th className="px-4 py-2 font-medium">型号</th>
                                          <th className="px-4 py-2 font-medium text-right w-24">操作</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {CATEGORY_DEVICES[config.bindTargetName].map(device => {
                                          const isExcluded = (config.excludedDevices || []).includes(device.id);
                                          return (
                                            <tr key={device.id} className="bg-white">
                                              <td className="px-4 py-2">
                                                <span className={`${isExcluded ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                  {device.name}
                                                </span>
                                              </td>
                                              <td className={`px-4 py-2 ${isExcluded ? 'text-slate-400' : 'text-slate-600'}`}>{device.brand}</td>
                                              <td className={`px-4 py-2 ${isExcluded ? 'text-slate-400' : 'text-slate-600'}`}>{device.model}</td>
                                              <td className="px-4 py-2 text-right">
                                                {isExcluded ? (
                                                  <button onClick={() => toggleExcludeDevice(partId, device.id)} className="text-blue-500 hover:text-blue-700 font-medium">撤销移除</button>
                                                ) : (
                                                  <button onClick={() => toggleExcludeDevice(partId, device.id)} className="text-red-500 hover:text-red-700 font-medium">移除</button>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Package Preview */}
              {selectedPartIds.length > 0 && (
                <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-800 text-sm mb-4 flex items-center before:content-[''] before:w-1 before:h-3 before:bg-blue-500 before:mr-2 before:rounded-full">套餐内容预览</h4>
                  <table className="w-full text-left text-sm whitespace-nowrap border-collapse bg-white border border-slate-200">
                    <thead className="bg-[#f4f5f7] text-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-medium border-b border-slate-200 text-center w-12">#</th>
                        <th className="px-4 py-3 font-medium border-b border-slate-200 text-center">安装部位</th>
                        <th className="px-4 py-3 font-medium border-b border-slate-200 text-center">产品范围</th>
                        <th className="px-4 py-3 font-medium border-b border-slate-200">产品明细</th>
                        <th className="px-4 py-3 font-medium border-b border-slate-200 text-center w-[60px]">数量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPartIds.map((partId, index) => {
                        const part = INSTALL_PARTS.find(p => p.id === partId) || { name: partId };
                        const config = partConfigs[partId] || { bindType: 'product', bindTargetName: '', qty: 1 };
                        
                        return (
                          <tr key={partId} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0 pointer-events-none">
                            <td className="px-4 py-3 text-center text-slate-600">{index + 1}</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-700">{part.name}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 bg-slate-100 rounded text-slate-600">
                                {config.bindType === 'product' ? '指定产品' : '指定类别'}
                              </span>
                              {config.bindType === 'category' && (
                                <div className="text-xs text-slate-500 mt-1">{config.bindTargetName}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {config.bindTargetName ? (
                                config.bindType === 'product' ? (
                                  <div className="text-slate-700">{config.bindTargetName}-前端摄像头-海康威视-DS-2CD2T47G2</div>
                                ) : (
                                  <ul className="space-y-1">
                                    {(CATEGORY_DEVICES[config.bindTargetName] || []).map(device => {
                                      const isExcluded = (config.excludedDevices || []).includes(device.id);
                                      return (
                                        <li key={device.id} className={`flex items-center gap-2 ${isExcluded ? 'text-slate-400' : 'text-slate-700'}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${isExcluded ? 'bg-slate-300' : 'bg-emerald-500'}`}></span>
                                          <span className={isExcluded ? 'line-through' : ''}>
                                            {device.name}-{device.category}-{device.brand}-{device.model}
                                          </span>
                                          {isExcluded && <span className="text-xs text-red-500 ml-2 bg-red-50 px-1 py-0.5 rounded pointer-events-auto">已排除</span>}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )
                              ) : (
                                <span className="text-red-400 italic font-normal">未完成配置</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-700">{config.qty || 1}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Warranty Plan Section */}
          <div className="mt-12 pt-8 relative">
            <div className="absolute top-0 left-0 w-8 h-[1px] bg-slate-200"></div>
            <h3 className="text-base font-bold text-slate-900 mb-6">质保方案</h3>

            <div className="flex items-center gap-6 mb-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  value="existing"
                  checked={warrantyMode === 'existing'} 
                  onChange={() => setWarrantyMode('existing')} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" 
                />
                选择已有质保方案
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input 
                  type="radio" 
                  value="custom"
                  checked={warrantyMode === 'custom'} 
                  onChange={() => setWarrantyMode('custom')} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" 
                />
                自定义质保方案
              </label>
            </div>

            {warrantyMode === 'existing' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-slate-700 w-24">质保方案:</label>
                  <div className="flex-1 max-w-sm flex gap-2">
                    <select 
                      value={selectedWarrantyId}
                      onChange={(e) => setSelectedWarrantyId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">请选择质保方案</option>
                      {MOCK_WARRANTIES.filter(w => w.status === 'active' && w.type === 'package').map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      disabled={!selectedWarrantyId}
                      onClick={() => {
                         const plan = MOCK_WARRANTIES.find(w => w.id === selectedWarrantyId);
                         if (plan) {
                            setCustomWarrantyData(plan.config || {});
                            setWarrantyMode('custom');
                         }
                      }}
                      className="px-4 py-2 bg-slate-100 text-blue-600 rounded text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      复制并自定义
                    </button>
                  </div>
                </div>
                
                {selectedWarrantyId && MOCK_WARRANTIES.find(w => w.id === selectedWarrantyId) && (
                  <div className="mt-4 border border-slate-200 rounded p-4 bg-slate-50 opacity-80 pointer-events-none">
                    <WarrantyForm type="package" readOnly value={MOCK_WARRANTIES.find(w => w.id === selectedWarrantyId)?.config} />
                  </div>
                )}
              </div>
            )}

            {warrantyMode === 'custom' && (
              <div className="space-y-4">
                <WarrantyForm type="package" value={customWarrantyData} onChange={setCustomWarrantyData} />

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                  <h4 className="text-sm font-medium text-slate-800">保存选项 (质保方案)</h4>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="once" checked={customWarrantySaveMode === 'once'} onChange={() => setCustomWarrantySaveMode('once')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                      <span className="text-sm text-slate-700">仅应用本次 (不保存为模板)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="save" checked={customWarrantySaveMode === 'save'} onChange={() => setCustomWarrantySaveMode('save')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                      <span className="text-sm text-slate-700">保存为质保方案</span>
                    </label>
                  </div>
                  {customWarrantySaveMode === 'save' && (
                    <div className="flex items-center gap-4 mt-2">
                       <label className="text-sm text-slate-700 w-24">方案名称:</label>
                       <input 
                         type="text" 
                         value={customWarrantySaveName}
                         onChange={e => setCustomWarrantySaveName(e.target.value)}
                         placeholder="请输入新质保方案名称" 
                         className="w-64 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                       />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Commission Plan Section */}
          <div className="mt-12 pt-8 relative">
            <div className="absolute top-0 left-0 w-8 h-[1px] bg-slate-200"></div>
            <h3 className="text-base font-bold text-slate-900 mb-6">提成方案</h3>
            
            <div className="space-y-10">
              
              {/* Install Commission Configuration */}
              <div className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-800 flex items-center before:content-[''] before:w-1 before:h-3 before:bg-blue-500 before:mr-2 before:rounded-full">安装提成</h4>
                 <div className="flex items-center gap-6 pb-2 border-b border-slate-100">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="radio" 
                       value="existing" 
                       checked={installCommissionMode === 'existing'} 
                       onChange={() => setInstallCommissionMode('existing')} 
                       className="text-blue-600 focus:ring-blue-500 w-4 h-4" 
                     />
                     <span className="text-sm font-medium text-slate-700">选择已有安装提成方案</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="radio" 
                       value="custom" 
                       checked={installCommissionMode === 'custom'} 
                       onChange={() => setInstallCommissionMode('custom')} 
                       className="text-blue-600 focus:ring-blue-500 w-4 h-4" 
                     />
                     <span className="text-sm font-medium text-slate-700">自定义安装提成方案</span>
                   </label>
                 </div>

                 {installCommissionMode === 'existing' && (
                   <div className="space-y-4">
                     <div className="flex items-center gap-4">
                       <label className="text-sm font-medium text-slate-700 w-24">提成方案:</label>
                       <div className="flex-1 max-w-sm flex gap-2">
                          <select 
                            value={selectedInstallCommissionId}
                            onChange={e => setSelectedInstallCommissionId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                          >
                            <option value="">请选择安装提成方案</option>
                            {MOCK_COMMISSIONS.filter(c => c.status === 'active' && (c.type === '安装提成' || c.type === '综合提成')).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <button 
                            type="button"
                            disabled={!selectedInstallCommissionId}
                            onClick={() => {
                               const plan = MOCK_COMMISSIONS.find(c => c.id === selectedInstallCommissionId);
                               if (plan) {
                                  setCustomInstallCommissionData(plan.config || {});
                                  setInstallCommissionMode('custom');
                               }
                            }}
                            className="px-4 py-2 bg-slate-100 text-blue-600 rounded text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            复制并自定义
                          </button>
                       </div>
                     </div>
                     {selectedInstallCommissionId && MOCK_COMMISSIONS.find(c => c.id === selectedInstallCommissionId) && (
                       <div className="mt-4 border border-slate-200 rounded p-4 bg-slate-50 opacity-80 pointer-events-none">
                          <CommissionForm type="install" readOnly value={MOCK_COMMISSIONS.find(c => c.id === selectedInstallCommissionId)?.config} />
                       </div>
                     )}
                   </div>
                 )}

                 {installCommissionMode === 'custom' && (
                   <div className="space-y-4">
                     <CommissionForm type="install" value={customInstallCommissionData} onChange={setCustomInstallCommissionData} />

                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                        <h4 className="text-sm font-medium text-slate-800">保存选项 (安装提成)</h4>
                        <div className="flex items-center gap-6">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" value="once" checked={customInstallSaveMode === 'once'} onChange={() => setCustomInstallSaveMode('once')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                              <span className="text-sm text-slate-700">仅应用本次 (不保存为模板)</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" value="save" checked={customInstallSaveMode === 'save'} onChange={() => setCustomInstallSaveMode('save')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                              <span className="text-sm text-slate-700">保存为提成方案</span>
                           </label>
                        </div>
                        {customInstallSaveMode === 'save' && (
                           <div className="flex items-center gap-4 mt-2">
                              <label className="text-sm text-slate-700 w-24">方案名称:</label>
                              <input 
                                type="text" 
                                value={customInstallSaveName}
                                onChange={e => setCustomInstallSaveName(e.target.value)}
                                placeholder="请输入新安装提成方案名称" 
                                className="w-64 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                              />
                           </div>
                        )}
                     </div>
                   </div>
                 )}
              </div>

              {/* Sales Commission Configuration */}
              <div className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-800 flex items-center before:content-[''] before:w-1 before:h-3 before:bg-blue-500 before:mr-2 before:rounded-full">销售提成</h4>
                 <div className="flex items-center gap-6 pb-2 border-b border-slate-100">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="radio" 
                       value="existing" 
                       checked={salesCommissionMode === 'existing'} 
                       onChange={() => setSalesCommissionMode('existing')} 
                       className="text-blue-600 focus:ring-blue-500 w-4 h-4" 
                     />
                     <span className="text-sm font-medium text-slate-700">选择已有销售提成方案</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="radio" 
                       value="custom" 
                       checked={salesCommissionMode === 'custom'} 
                       onChange={() => setSalesCommissionMode('custom')} 
                       className="text-blue-600 focus:ring-blue-500 w-4 h-4" 
                     />
                     <span className="text-sm font-medium text-slate-700">自定义销售提成方案</span>
                   </label>
                 </div>

                 {salesCommissionMode === 'existing' && (
                   <div className="space-y-4">
                     <div className="flex items-center gap-4">
                       <label className="text-sm font-medium text-slate-700 w-24">提成方案:</label>
                       <div className="flex-1 max-w-sm flex gap-2">
                          <select 
                            value={selectedSalesCommissionId}
                            onChange={e => setSelectedSalesCommissionId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                          >
                            <option value="">请选择销售提成方案</option>
                            {MOCK_COMMISSIONS.filter(c => c.status === 'active' && (c.type === '销售提成' || c.type === '综合提成')).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <button 
                            type="button"
                            disabled={!selectedSalesCommissionId}
                            onClick={() => {
                               const plan = MOCK_COMMISSIONS.find(c => c.id === selectedSalesCommissionId);
                               if (plan) {
                                  setCustomSalesCommissionData(plan.config || {});
                                  setSalesCommissionMode('custom');
                               }
                            }}
                            className="px-4 py-2 bg-slate-100 text-blue-600 rounded text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            复制并自定义
                          </button>
                       </div>
                     </div>
                     {selectedSalesCommissionId && MOCK_COMMISSIONS.find(c => c.id === selectedSalesCommissionId) && (
                       <div className="mt-4 border border-slate-200 rounded p-4 bg-slate-50 opacity-80 pointer-events-none">
                          <CommissionForm type="sales" readOnly value={MOCK_COMMISSIONS.find(c => c.id === selectedSalesCommissionId)?.config} />
                       </div>
                     )}
                   </div>
                 )}

                 {salesCommissionMode === 'custom' && (
                   <div className="space-y-4">
                     <CommissionForm type="sales" value={customSalesCommissionData} onChange={setCustomSalesCommissionData} />

                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                        <h4 className="text-sm font-medium text-slate-800">保存选项 (销售提成)</h4>
                        <div className="flex items-center gap-6">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" value="once" checked={customSalesSaveMode === 'once'} onChange={() => setCustomSalesSaveMode('once')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                              <span className="text-sm text-slate-700">仅应用本次 (不保存为模板)</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" value="save" checked={customSalesSaveMode === 'save'} onChange={() => setCustomSalesSaveMode('save')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                              <span className="text-sm text-slate-700">保存为提成方案</span>
                           </label>
                        </div>
                        {customSalesSaveMode === 'save' && (
                           <div className="flex items-center gap-4 mt-2">
                              <label className="text-sm text-slate-700 w-24">方案名称:</label>
                              <input 
                                type="text" 
                                value={customSalesSaveName}
                                onChange={e => setCustomSalesSaveName(e.target.value)}
                                placeholder="请输入新销售提成方案名称" 
                                className="w-64 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                              />
                           </div>
                        )}
                     </div>
                   </div>
                 )}
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={internalOnSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            保存
          </button>
        </div>
      </div>

      {/* Device Modal */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">查看设备</h3>
              <button onClick={() => setIsDeviceModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-700">产品名称</th>
                      <th className="px-4 py-3 font-medium text-slate-700">品名</th>
                      <th className="px-4 py-3 font-medium text-slate-700">品牌</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-center">型号</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-center">单价</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[1,2,3,4].map(i => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-700">视频设备-BSD盲区摄像头-鹰眼-..</td>
                        <td className="px-4 py-3 text-slate-700">BSD盲区摄像头</td>
                        <td className="px-4 py-3 text-slate-700">鹰眼</td>
                        <td className="px-4 py-3 text-center text-slate-400">—</td>
                        <td className="px-4 py-3 text-center text-slate-700 tabular-nums">500.00</td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-red-500 hover:text-red-700 text-xs">移除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
