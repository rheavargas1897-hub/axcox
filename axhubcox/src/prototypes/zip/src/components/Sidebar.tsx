import React from 'react';
import { ShoppingCart, Package, AlertTriangle, Users, BarChart2, Briefcase } from 'lucide-react';
import { cn } from './ui';

export default function Sidebar({ currentPage, navigateTo }: { currentPage: string, navigateTo: (page: string, id?: string) => void }) {
  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0">
      <div className="h-14 flex items-center px-6 border-b border-slate-800 shrink-0">
        <Briefcase className="w-5 h-5 text-blue-500 mr-2" />
        <span className="text-white font-bold text-lg tracking-wide">营运通管理系统</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">采购管理</div>
        <nav className="space-y-1 px-2">
          <button 
            onClick={() => navigateTo('list')} 
            className={cn(
              "w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors",
              ['list', 'detail', 'inspection'].includes(currentPage) 
                ? "bg-blue-600 text-white font-medium" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <ShoppingCart className="w-4 h-4 mr-3" />
            采购订单
          </button>
          <button 
            onClick={() => navigateTo('return_list')} 
            className={cn(
              "w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors",
              ['return_list', 'return_detail'].includes(currentPage) 
                ? "bg-blue-600 text-white font-medium" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <AlertTriangle className="w-4 h-4 mr-3" />
            采购退货
          </button>
        </nav>
      </div>
    </div>
  );
}
