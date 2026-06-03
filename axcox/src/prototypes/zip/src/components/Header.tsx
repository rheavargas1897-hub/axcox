import React from 'react';
import { Search, Bell, ChevronRight } from 'lucide-react';

export default function Header({ currentPage }: { currentPage: string }) {
  const getBreadcrumbs = () => {
    switch (currentPage) {
      case 'list': return ['采购管理', '采购订单'];
      case 'detail': return ['采购管理', '采购订单', '订单详情'];
      case 'inspection': return ['采购管理', '采购订单', '入库验收'];
      default: return ['采购管理'];
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center">
        <div className="flex items-center text-sm text-slate-500">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb}>
              <span className={index === breadcrumbs.length - 1 ? 'text-slate-900 font-medium' : ''}>{crumb}</span>
              {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 mx-1 text-slate-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索单号/供应商..." 
            className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64 bg-slate-50 transition-all" 
          />
        </div>
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center space-x-2 cursor-pointer pl-5 border-l border-slate-200">
          <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
            张
          </div>
          <span className="text-sm font-medium text-slate-700">张采购</span>
        </div>
      </div>
    </header>
  );
}
