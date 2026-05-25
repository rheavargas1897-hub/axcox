import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PackageSearch } from 'lucide-react';
import { ProductAggregated } from '../types';
import { EquipmentNestedTable } from './EquipmentNestedTable';

export const ProductView = ({ products }: { products: ProductAggregated[] }) => {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const toggleProduct = (id: string) => {
    setExpandedProduct(expandedProduct === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">产品信息 (类型-品名-品牌-型号)</th>
              <th className="px-4 py-3 text-right">在库数量(预计量)</th>
              <th className="px-4 py-3 text-right">待维修数量</th>
              <th className="px-4 py-3 text-right">维修中数量</th>
              <th className="px-4 py-3 text-right">待回收数量</th>
              <th className="px-4 py-3 text-right">已借出数量</th>
              <th className="px-4 py-3 text-center">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <React.Fragment key={p.id}>
                <tr 
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedProduct === p.id ? 'bg-indigo-50/30' : ''}`}
                  onClick={() => toggleProduct(p.id)}
                >
                  <td className="px-4 py-3 text-slate-400">
                    {expandedProduct === p.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                    <PackageSearch size={18} className="text-indigo-500"/>
                    {p.type}-{p.name}-{p.brand}-{p.model}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{p.total}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{p.pendingRepair}</td>
                  <td className="px-4 py-3 text-right text-purple-600">{p.repairing}</td>
                  <td className="px-4 py-3 text-right text-pink-600">{p.pendingRecycle}</td>
                  <td className="px-4 py-3 text-right text-cyan-600">{p.borrowed}</td>
                  <td className="px-4 py-3 text-center">
                    {p.warning === '正常' ? (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">正常</span>
                    ) : (
                      <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-medium">库存不足</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs" onClick={(e) => e.stopPropagation()}>查看流水</button>
                  </td>
                </tr>
                {expandedProduct === p.id && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={9} className="px-6 py-6 border-t border-slate-100">
                      <div className="pl-4 border-l-2 border-indigo-300">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                          {p.name} ({p.model}) 设备明细
                        </h3>
                        <EquipmentNestedTable equipments={p.equipments} showWarehouse={true} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  没有找到匹配的产品数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
