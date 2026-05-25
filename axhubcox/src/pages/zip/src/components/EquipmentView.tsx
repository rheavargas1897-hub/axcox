import React from 'react';
import { HardDrive } from 'lucide-react';
import { Equipment } from '../types';
import { StatusBadge } from './StatusBadge';

export const EquipmentView = ({ equipments }: { equipments: Equipment[] }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">设备编号/SN</th>
              <th className="px-4 py-3">所在仓库</th>
              <th className="px-4 py-3">产品信息</th>
              <th className="px-4 py-3">设备类型</th>
              <th className="px-4 py-3">设备来源</th>
              <th className="px-4 py-3 text-right">采购成本</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作时间</th>
              <th className="px-4 py-3">归属/领用</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipments.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-700 flex items-center gap-2">
                  <HardDrive size={16} className="text-slate-400"/>
                  {e.sn}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{e.warehouseName}</td>
                <td className="px-4 py-3 text-slate-600 font-medium">
                  {e.productType}-{e.productName}-{e.productBrand}-{e.productModel}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <span className={`px-2 py-0.5 rounded text-xs ${e.equipmentType === '新' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{e.equipmentType}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{e.source}</td>
                <td className="px-4 py-3 text-right text-slate-600 font-mono">¥{e.purchaseCost.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                <td className="px-4 py-3 text-slate-600">{e.lastOperationTime}</td>
                <td className="px-4 py-3 text-slate-600">{e.ownership || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">查看</button>
                </td>
              </tr>
            ))}
            {equipments.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  没有找到匹配的设备
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
