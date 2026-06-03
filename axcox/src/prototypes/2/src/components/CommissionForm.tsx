import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

const GLOBAL_PARTS = ['前方摄像头', '盲区摄像头', '倒车摄像头', '驾驶员监控', 'ADAS 探头', '车厢监控', '北斗定位'];
const MATRIX_VEHICLES = ['客运车', '货车', '冷藏车', '渣土车', '乘用车', '出租车', '网约车', '工程车', '其他车型'];
const MATRIX_PRODUCTS = ['倒车摄像头', '盲区摄像头', '驾驶员监控ADAS', '普通定位GPS', '部标主机'];
const MATRIX_PACKAGES = ['基础安全套餐', '高级盲区监控套餐', '按揭车定位套餐', '出租车内外双录套餐'];

export default function CommissionForm({ value, onChange, readOnly = false, type = 'both' }: { value: any, onChange?: (val: any) => void, readOnly?: boolean, type?: 'install' | 'sales' | 'both' }) {
  const [salesDimension, setSalesDimension] = useState(value?.salesDimension || 'device');

  const [installRules, setInstallRules] = useState(value?.installRules || [
    { vehicleType: '客运车', parts: [{ name: '前方摄像头', amount: '50', type: 'amount' }] },
  ]);

  const [salesRoles, setSalesRoles] = useState(value?.salesRoles || ['销售', '商务', '销售助理']);
  const [salesProductRules, setSalesProductRules] = useState(value?.salesProductRules || [
     { id: '1', product: '倒车摄像头', vehicles: [{ id: '1-1', vehicle: '客运车', roles: { '销售': { value: '3', type: 'percentage' } } }] }
  ]);
  const [salesPackageRules, setSalesPackageRules] = useState(value?.salesPackageRules || [
     { id: 'p1', package: '基础安全套餐', vehicles: [{ id: 'p1-1', vehicle: '客运车', roles: { '销售': { value: '4', type: 'percentage' } } }] }
  ]);

  const updateParent = (updates: any) => {
    if (!onChange) return;
    onChange({
      salesDimension,
      installRules,
      salesRoles,
      salesProductRules,
      salesPackageRules,
      ...updates
    });
  };

  const setLocalInstallRules = (newRules: any) => {
    setInstallRules(newRules);
    updateParent({ installRules: newRules });
  }

  // Install Handlers
  const handleAddInstallRule = () => {
    if (readOnly) return;
    setLocalInstallRules([...installRules, { vehicleType: '新车型', parts: [{ name: '', amount: '', type: 'amount' }] }]);
  };
  const handleRemoveInstallRule = (index: number) => {
    if (readOnly) return;
    setLocalInstallRules(installRules.filter((_: any, i: number) => i !== index));
  };
  const handleAddInstallPart = (ruleIndex: number) => {
    if (readOnly) return;
    const newRules = [...installRules];
    newRules[ruleIndex].parts.push({ name: '', amount: '', type: 'amount' });
    setLocalInstallRules(newRules);
  };
  const handleRemoveInstallPart = (ruleIndex: number, partIndex: number) => {
    if (readOnly) return;
    const newRules = [...installRules];
    newRules[ruleIndex].parts = newRules[ruleIndex].parts.filter((_: any, i: number) => i !== partIndex);
    setLocalInstallRules(newRules);
  };
  const handleInstallPartChange = (ruleIndex: number, partIndex: number, field: 'name' | 'amount' | 'type', val: string) => {
    if (readOnly) return;
    const newRules = [...installRules];
    newRules[ruleIndex].parts[partIndex] = { ...newRules[ruleIndex].parts[partIndex], [field]: val };
    if (field === 'type') newRules[ruleIndex].parts[partIndex].amount = '';
    setLocalInstallRules(newRules);
  };

  // Sales Handlers
  const setLocalSalesRoles = (newRoles: any) => { setSalesRoles(newRoles); updateParent({ salesRoles: newRoles }); }
  const handleAddRole = () => {
    if (readOnly) return;
    const role = window.prompt('请输入新角色名称');
    if (role && role.trim()) setLocalSalesRoles([...salesRoles, role.trim()]);
  };
  const handleRemoveRole = (index: number) => {
    if (readOnly) return;
    setLocalSalesRoles(salesRoles.filter((_: any, i: number) => i !== index));
  };

  const setLocalSalesProductRules = (newRules: any) => { setSalesProductRules(newRules); updateParent({ salesProductRules: newRules }); }
  const setLocalSalesPackageRules = (newRules: any) => { setSalesPackageRules(newRules); updateParent({ salesPackageRules: newRules }); }
  
  const handleAddSalesRule = (type: 'product' | 'package') => {
    if (readOnly) return;
    const newId = Math.random().toString(36).substr(2, 9);
    if (type === 'product') {
       setLocalSalesProductRules([{ id: newId, product: '', vehicles: [] }, ...salesProductRules]);
    } else {
       setLocalSalesPackageRules([{ id: newId, package: '', vehicles: [] }, ...salesPackageRules]);
    }
  };

  const handleRemoveSalesRule = (type: 'product' | 'package', index: number) => {
    if (readOnly) return;
    if (type === 'product') {
       setLocalSalesProductRules(salesProductRules.filter((_: any, i: number) => i !== index));
    } else {
       setLocalSalesPackageRules(salesPackageRules.filter((_: any, i: number) => i !== index));
    }
  };

  const handleSalesRuleFieldChange = (type: 'product' | 'package', index: number, field: string, val: string) => {
    if (readOnly) return;
    if (type === 'product') {
       const newRules = [...salesProductRules];
       (newRules[index] as any)[field] = val;
       setLocalSalesProductRules(newRules);
    } else {
       const newRules = [...salesPackageRules];
       (newRules[index] as any)[field] = val;
       setLocalSalesPackageRules(newRules);
    }
  };

  const handleAddSalesVehicle = (type: 'product' | 'package', ruleIndex: number) => {
    if (readOnly) return;
    const newId = Math.random().toString(36).substr(2, 9);
    if (type === 'product') {
       const newRules = [...salesProductRules];
       newRules[ruleIndex].vehicles.push({ id: newId, vehicle: '客运车', roles: {} });
       setLocalSalesProductRules(newRules);
    } else {
       const newRules = [...salesPackageRules];
       newRules[ruleIndex].vehicles.push({ id: newId, vehicle: '客运车', roles: {} });
       setLocalSalesPackageRules(newRules);
    }
  };

  const handleRemoveSalesVehicle = (type: 'product' | 'package', ruleIndex: number, vIndex: number) => {
    if (readOnly) return;
    if (type === 'product') {
       const newRules = [...salesProductRules];
       newRules[ruleIndex].vehicles = newRules[ruleIndex].vehicles.filter((_: any, i: number) => i !== vIndex);
       setLocalSalesProductRules(newRules);
    } else {
       const newRules = [...salesPackageRules];
       newRules[ruleIndex].vehicles = newRules[ruleIndex].vehicles.filter((_: any, i: number) => i !== vIndex);
       setLocalSalesPackageRules(newRules);
    }
  };

  const handleSalesVehicleChange = (type: 'product' | 'package', ruleIndex: number, vIndex: number, val: string) => {
    if (readOnly) return;
    if (type === 'product') {
       const newRules = [...salesProductRules];
       newRules[ruleIndex].vehicles[vIndex].vehicle = val;
       setLocalSalesProductRules(newRules);
    } else {
       const newRules = [...salesPackageRules];
       newRules[ruleIndex].vehicles[vIndex].vehicle = val;
       setLocalSalesPackageRules(newRules);
    }
  };

  const handleSalesRoleChange = (type: 'product' | 'package', ruleIndex: number, vIndex: number, role: string, val: string, valType: 'amount' | 'percentage') => {
    if (readOnly) return;
    if (type === 'product') {
       const newRules = [...salesProductRules];
       newRules[ruleIndex].vehicles[vIndex].roles[role] = { value: val, type: valType };
       setLocalSalesProductRules(newRules);
    } else {
       const newRules = [...salesPackageRules];
       newRules[ruleIndex].vehicles[vIndex].roles[role] = { value: val, type: valType };
       setLocalSalesPackageRules(newRules);
    }
  };

  const renderSalesMatrix = (type: 'product' | 'package', rules: any[]) => {
    return (
      <div className="space-y-4">
         {!readOnly && (
           <div className="flex justify-end">
             <button onClick={() => handleAddSalesRule(type)} className="text-blue-600 flex items-center gap-1 text-sm font-medium hover:underline cursor-pointer">
               <Plus className="w-4 h-4" /> {type === 'product' ? '增加单产品' : '增加套餐'}
             </button>
           </div>
         )}
         {rules.map((rule, ruleIdx) => (
           <div key={rule.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
             <div className="bg-[#f8f9fa] border-b border-slate-200 px-4 py-3 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <span className="text-sm font-medium text-slate-700">{type === 'product' ? '单产品选择' : '套餐选择'}</span>
                 <select 
                   value={rule[type]} 
                   onChange={(e) => handleSalesRuleFieldChange(type, ruleIdx, type, e.target.value)}
                   disabled={readOnly}
                   className="w-48 px-3 py-1.5 border border-slate-300 rounded text-sm outline-none text-slate-700 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                 >
                   <option value="">{type === 'product' ? '请选择单产品' : '请选择套餐'}</option>
                   {(type === 'product' ? MATRIX_PRODUCTS : MATRIX_PACKAGES).map((item: string) => (
                     <option key={item} value={item}>{item}</option>
                   ))}
                 </select>
               </div>
               {!readOnly && <button onClick={() => handleRemoveSalesRule(type, ruleIdx)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
             </div>
             {rule.vehicles.length > 0 ? (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-[#fdfdfd] border-b border-slate-100 text-slate-500">
                   <tr>
                     <th className="px-4 py-3 font-medium border-r border-slate-100 w-48">
                       {!readOnly ? (
                         <button onClick={() => handleAddSalesVehicle(type, ruleIdx)} className="text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors">
                           <Plus className="w-3.5 h-3.5" /> 添加车型
                         </button>
                       ) : '车型'}
                     </th>
                     {salesRoles.map((role: string) => (
                        <th key={role} className="px-4 py-3 font-medium border-r border-slate-100 min-w-[140px] text-center bg-slate-50/50">{role}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {rule.vehicles.map((v: any, vIdx: number) => (
                     <tr key={v.id}>
                       <td className="px-3 py-2 border-r border-slate-100 bg-[#fbfbfc]">
                         <div className="flex items-center gap-2">
                           <select 
                             value={v.vehicle}
                             onChange={(e) => handleSalesVehicleChange(type, ruleIdx, vIdx, e.target.value)}
                             disabled={readOnly}
                             className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm outline-none bg-white disabled:bg-slate-50 disabled:text-slate-500"
                           >
                             <option value="">选择车型</option>
                             {MATRIX_VEHICLES.map(mv => (
                               <option key={mv} value={mv}>{mv}</option>
                             ))}
                           </select>
                           {!readOnly && <button onClick={() => handleRemoveSalesVehicle(type, ruleIdx, vIdx)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>}
                         </div>
                       </td>
                       {salesRoles.map((role: string) => (
                         <td key={role} className="px-2 py-2 border-r border-slate-100 text-center">
                           <div className={`flex items-center justify-center gap-0 border border-slate-300 rounded overflow-hidden w-full max-w-[130px] mx-auto bg-white ${readOnly ? 'opacity-80' : ''}`}>
                             <input 
                               type="text"
                               value={v.roles[role]?.value || ''}
                               onChange={(e) => handleSalesRoleChange(type, ruleIdx, vIdx, role, e.target.value, v.roles[role]?.type || 'percentage')}
                               placeholder="数值"
                               disabled={readOnly}
                               className="w-[60px] px-2 py-1.5 border-none text-sm outline-none text-center disabled:bg-white"
                             />
                             <div className="flex items-center bg-slate-50 border-l border-slate-200">
                               <button 
                                 onClick={() => handleSalesRoleChange(type, ruleIdx, vIdx, role, v.roles[role]?.value || '', 'percentage')}
                                 disabled={readOnly}
                                 className={`px-1.5 py-1.5 text-xs font-medium ${v.roles[role]?.type !== 'amount' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'} transition-colors disabled:cursor-default`}
                               >
                                 %
                               </button>
                               <button 
                                 onClick={() => handleSalesRoleChange(type, ruleIdx, vIdx, role, v.roles[role]?.value || '', 'amount')}
                                 disabled={readOnly}
                                 className={`px-1.5 py-1.5 text-xs font-medium ${v.roles[role]?.type === 'amount' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'} transition-colors disabled:cursor-default`}
                               >
                                 元
                               </button>
                             </div>
                           </div>
                         </td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             ) : (
               <div className="p-4 text-center text-sm text-slate-500 bg-white">
                 {!readOnly ? (
                   <button onClick={() => handleAddSalesVehicle(type, ruleIdx)} className="text-blue-600 hover:underline">点击添加车型规则</button>
                 ) : '暂无数据'}
               </div>
             )}
           </div>
         ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Install Commission Section */}
      {(type === 'both' || type === 'install') && (
      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
          安装提成配置
          {!readOnly && (
            <button type="button" onClick={handleAddInstallRule} className="text-blue-600 flex items-center gap-1 text-sm font-medium hover:text-blue-700 cursor-pointer">
              <Plus className="w-4 h-4" /> 新增车型
            </button>
          )}
        </h3>
        <div className="space-y-6">
          {installRules.map((rule: any, ruleIndex: number) => (
            <div key={ruleIndex} className="bg-white p-4 rounded border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <select 
                  className="px-3 py-1.5 border border-slate-300 rounded text-sm outline-none w-48 text-slate-700 disabled:bg-slate-50 disabled:text-slate-500"
                  value={rule.vehicleType}
                  disabled={readOnly}
                  onChange={(e) => {
                    const newRules = [...installRules];
                    newRules[ruleIndex].vehicleType = e.target.value;
                    setLocalInstallRules(newRules);
                  }}
                >
                  <option value="新车型">新车型</option>
                  <option value="客运车">客运车</option>
                  <option value="货车">货车</option>
                  <option value="冷藏车">冷藏车</option>
                  <option value="渣土车">渣土车</option>
                </select>
                {!readOnly && <button type="button" onClick={() => handleRemoveInstallRule(ruleIndex)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
              </div>
              <div className="space-y-3">
                {rule.parts.map((p: any, pIdx: number) => (
                  <div key={pIdx} className="flex flex-wrap items-center gap-4">
                    <select 
                      value={p.name}
                      onChange={(e) => handleInstallPartChange(ruleIndex, pIdx, 'name', e.target.value)}
                      disabled={readOnly}
                      className="flex-1 min-w-[200px] px-3 py-1.5 border border-slate-300 rounded text-sm outline-none text-slate-700 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="">请选择安装部位</option>
                      {GLOBAL_PARTS.map(part => (
                        <option key={part} value={part}>{part}</option>
                      ))}
                    </select>
                    <div className={`flex items-center gap-0 border border-slate-300 rounded overflow-hidden bg-white w-40 ${readOnly ? 'opacity-80' : ''}`}>
                      <input 
                        type="text" 
                        placeholder="输入提成" 
                        value={p.amount} 
                        disabled={readOnly}
                        onChange={(e) => handleInstallPartChange(ruleIndex, pIdx, 'amount', e.target.value)}
                        className="w-[100px] px-3 py-1.5 border-none text-sm outline-none disabled:bg-white" 
                      />
                      <div className="flex items-center bg-slate-50 border-l border-slate-200">
                        <button 
                          type="button"
                          onClick={() => handleInstallPartChange(ruleIndex, pIdx, 'type', 'amount')}
                          disabled={readOnly}
                          className={`px-2 py-1.5 text-xs font-medium ${p.type !== 'percentage' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'} transition-colors disabled:cursor-default`}
                        >
                          元
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleInstallPartChange(ruleIndex, pIdx, 'type', 'percentage')}
                          disabled={readOnly}
                          className={`px-2 py-1.5 text-xs font-medium ${p.type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'} transition-colors disabled:cursor-default`}
                        >
                          %
                        </button>
                      </div>
                    </div>
                    {!readOnly && <button type="button" onClick={() => handleRemoveInstallPart(ruleIndex, pIdx)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
                {!readOnly && <button type="button" onClick={() => handleAddInstallPart(ruleIndex)} className="text-blue-600 text-sm flex items-center gap-1 hover:underline cursor-pointer">
                  <Plus className="w-3 h-3" /> 新增部位
                </button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Sales Commission Section */}
      {(type === 'both' || type === 'sales') && (
      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            销售提成 - 参与角色配置
            {!readOnly && (
              <button type="button" onClick={handleAddRole} className="text-blue-600 flex items-center gap-1 text-sm font-medium hover:text-blue-700 cursor-pointer">
                <Plus className="w-4 h-4" /> 新增角色
              </button>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            {salesRoles.map((role: string, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-700 shadow-sm">
                {role}
                {!readOnly && <button type="button" onClick={() => handleRemoveRole(idx)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            销售维度类型
          </h3>
          <div className="flex items-center gap-6 bg-white p-4 border border-slate-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="device" disabled={readOnly} checked={salesDimension === 'device'} onChange={() => {setSalesDimension('device'); updateParent({ salesDimension: 'device'})}} className="text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
              <span className={`text-sm ${readOnly ? 'text-slate-500' : 'text-slate-700'}`}>按设备配置</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="package" disabled={readOnly} checked={salesDimension === 'package'} onChange={() => {setSalesDimension('package'); updateParent({ salesDimension: 'package'})}} className="text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
              <span className={`text-sm ${readOnly ? 'text-slate-500' : 'text-slate-700'}`}>按套餐配置</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="mixed" disabled={readOnly} checked={salesDimension === 'mixed'} onChange={() => {setSalesDimension('mixed'); updateParent({ salesDimension: 'mixed'})}} className="text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
              <span className={`text-sm ${readOnly ? 'text-slate-500' : 'text-slate-700'}`}>混合模式 (设备+套餐)</span>
            </label>
          </div>
        </div>

        {(salesDimension === 'device' || salesDimension === 'mixed') && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
              提成比例配置 (按单产品)
            </h3>
            {renderSalesMatrix('product', salesProductRules)}
          </div>
        )}

        {(salesDimension === 'package' || salesDimension === 'mixed') && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
              提成比例配置 (按套餐)
            </h3>
            {renderSalesMatrix('package', salesPackageRules)}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
