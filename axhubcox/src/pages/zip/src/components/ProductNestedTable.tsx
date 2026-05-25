import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PackageSearch } from 'lucide-react';
import { ProductAggregated } from '../types';
import { EquipmentNestedTable } from './EquipmentNestedTable';

export const ProductNestedTable = ({ products }: { products: ProductAggregated[] }) => {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const toggleProduct = (id: string) => {
    setExpandedProduct(expandedProduct === id ? null : id);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 text-slate-600 font-medium border-b border-slate-200">
          <tr>
            <th className="px-4 py-2 w-8"></th>
            <th className="px-4 py-2">产品信息 (类型-品名-品牌-型号)</th>
            <th className="px-4 py-2 text-right">预计量(总)</th>
            <th className="px-4 py-2 text-right">可用量</th>
            <th className="px-4 py-2 text-right">占用量</th>
            <th className="px-4 py-2 text-right">冻结量</th>
            <th className="px-4 py-2 text-right">在途量</th>
            <th className="px-4 py-2 text-center">预警状态</th>
            <th className="px-4 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {products.map(p => (
            <React.Fragment key={p.id}>
              <tr 
                className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedProduct === p.id ? 'bg-indigo-50/30' : ''}`}
                onClick={() => toggleProduct(p.id)}
              >
                <td className="px-4 py-2 text-slate-400">
                  {expandedProduct === p.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </td>
                <td className="px-4 py-2 font-medium text-slate-700 flex items-center gap-2">
                  <PackageSearch size={16} className="text-indigo-400"/>
                  {p.type}-{p.name}-{p.brand}-{p.model}
                </td>
                <td className="px-4 py-2 text-right font-semibold">{p.total}</td>
                <td className="px-4 py-2 text-right text-emerald-600">{p.available}</td>
                <td className="px-4 py-2 text-right text-blue-600">{p.occupied}</td>
                <td className="px-4 py-2 text-right text-rose-600">{p.frozen}</td>
                <td className="px-4 py-2 text-right text-amber-600">{p.inTransit}</td>
                <td className="px-4 py-2 text-center">
                  {p.warning === '正常' ? (
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">正常</span>
                  ) : (
                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs">库存不足</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs" onClick={(e) => e.stopPropagation()}>查看流水</button>
                </td>
              </tr>
              {expandedProduct === p.id && (
                <tr className="bg-slate-50/50">
                  <td colSpan={9} className="px-4 py-4 border-t border-slate-100">
                    <div className="pl-6 border-l-2 border-indigo-200">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">设备明细</h4>
                      <EquipmentNestedTable equipments={p.equipments} />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-4 text-center text-slate-500">
                该仓库下暂无产品
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
