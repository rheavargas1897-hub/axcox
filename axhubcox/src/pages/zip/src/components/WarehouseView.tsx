import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { WarehouseAggregated } from '../types';
import { ProductNestedTable } from './ProductNestedTable';

export const WarehouseView = ({ warehouses }: { warehouses: WarehouseAggregated[] }) => {
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(null);

  const toggleWarehouse = (id: string) => {
    setExpandedWarehouse(expandedWarehouse === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">仓库名称</th>
              <th className="px-4 py-3 text-right">库存总体(预计量)</th>
              <th className="px-4 py-3 text-right">可用量</th>
              <th className="px-4 py-3 text-right">占用量</th>
              <th className="px-4 py-3 text-right">冻结量</th>
              <th className="px-4 py-3 text-right">在途量</th>
              <th className="px-4 py-3 text-right">入库量</th>
              <th className="px-4 py-3 text-right">出库量</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {warehouses.map(w => (
              <React.Fragment key={w.id}>
                <tr 
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedWarehouse === w.id ? 'bg-indigo-50/30' : ''}`}
                  onClick={() => toggleWarehouse(w.id)}
                >
                  <td className="px-4 py-3 text-slate-400">
                    {expandedWarehouse === w.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                    <Building2 size={18} className="text-indigo-500"/>
                    {w.name}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700">{w.total}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">{w.available}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{w.occupied}</td>
                  <td className="px-4 py-3 text-right text-rose-600 font-medium">{w.frozen}</td>
                  <td className="px-4 py-3 text-right text-amber-600 font-medium">{w.inTransit}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{w.inbound}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{w.outbound}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs" onClick={(e) => e.stopPropagation()}>查看流水</button>
                  </td>
                </tr>
                {expandedWarehouse === w.id && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={10} className="px-6 py-6 border-t border-slate-100">
                      <div className="pl-4 border-l-2 border-indigo-300">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                          {w.name} 产品库存明细
                        </h3>
                        <ProductNestedTable products={w.products} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {warehouses.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  没有找到匹配的仓库数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
