import React from 'react';
import { HardDrive } from 'lucide-react';
import { Equipment } from '../types';
import { StatusBadge } from './StatusBadge';

export const EquipmentNestedTable = ({ equipments, showWarehouse = false }: { equipments: Equipment[], showWarehouse?: boolean }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
          <tr>
            <th className="px-4 py-2">设备编号/SN</th>
            {showWarehouse && <th className="px-4 py-2">所在仓库</th>}
            <th className="px-4 py-2">设备类型</th>
            <th className="px-4 py-2">设备来源</th>
            <th className="px-4 py-2 text-right">采购成本</th>
            <th className="px-4 py-2">状态</th>
            <th className="px-4 py-2">操作时间</th>
            <th className="px-4 py-2">归属/领用</th>
            <th className="px-4 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {equipments.map(e => (
            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-2 font-mono text-slate-700 flex items-center gap-2">
                <HardDrive size={14} className="text-slate-400"/>
                {e.sn}
              </td>
              {showWarehouse && <td className="px-4 py-2 font-medium text-slate-700">{e.warehouseName}</td>}
              <td className="px-4 py-2 text-slate-600">
                <span className={`px-2 py-0.5 rounded text-xs ${e.equipmentType === '新' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{e.equipmentType}</span>
              </td>
              <td className="px-4 py-2 text-slate-600">{e.source}</td>
              <td className="px-4 py-2 text-right text-slate-600 font-mono">¥{e.purchaseCost.toLocaleString()}</td>
              <td className="px-4 py-2"><StatusBadge status={e.status} /></td>
              <td className="px-4 py-2 text-slate-600">{e.lastOperationTime}</td>
              <td className="px-4 py-2 text-slate-600">{e.ownership || '-'}</td>
              <td className="px-4 py-2 text-right">
                <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">查看</button>
              </td>
            </tr>
          ))}
          {equipments.length === 0 && (
            <tr>
              <td colSpan={showWarehouse ? 9 : 8} className="px-4 py-4 text-center text-slate-500">
                暂无设备明细
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
