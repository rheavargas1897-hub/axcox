import React, { useState } from 'react';
import { Search, Bell, Settings, ChevronDown, Wrench } from 'lucide-react';
import PackageList from './pages/PackageList';
import PackageCreate from './pages/PackageCreate';
import PackageDetail from './pages/PackageDetail';
import WarrantyList from './pages/WarrantyList';
import WarrantyCreate from './pages/WarrantyCreate';
import CommissionList from './pages/CommissionList';
import CommissionCreate from './pages/CommissionCreate';
import CommissionDetail from './pages/CommissionDetail';
import InstallPartList from './pages/InstallPartList';
import DictionaryConfig from './pages/DictionaryConfig';

export default function App() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [isCommissionCreateOpen, setIsCommissionCreateOpen] = useState(false);
  const [isCommissionDetailOpen, setIsCommissionDetailOpen] = useState(false);
  const [commissionInitialData, setCommissionInitialData] = useState<any>(null);

  const [isWarrantyCreateOpen, setIsWarrantyCreateOpen] = useState(false);
  const [isWarrantyViewOpen, setIsWarrantyViewOpen] = useState(false);
  const [warrantyInitialData, setWarrantyInitialData] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState<'packages' | 'warranties' | 'commissions' | 'parts' | 'dictionaries'>('packages');

  const handleEditCommission = (item: any) => {
    setCommissionInitialData(item);
    setIsCommissionCreateOpen(true);
  };

  const handleCopyCommission = (item: any) => {
    // 复制操作在后端执行深拷贝，生成全新的方案记录
    // 新方案初始状态为未启用
    const copiedData = JSON.parse(JSON.stringify(item));
    copiedData.name = `${copiedData.name} - 副本`;
    copiedData.status = 'deactivated';
    setCommissionInitialData(copiedData);
    setIsCommissionCreateOpen(true);
  };

  const handleEditWarranty = (item: any) => {
    setWarrantyInitialData(item);
    setIsWarrantyViewOpen(false);
    setIsWarrantyCreateOpen(true);
  };

  const handleViewWarranty = (item: any) => {
    setWarrantyInitialData(item);
    setIsWarrantyCreateOpen(false);
    setIsWarrantyViewOpen(true);
  };

  const handleCopyWarranty = (item: any) => {
    const copiedData = JSON.parse(JSON.stringify(item));
    copiedData.name = `${copiedData.name} - 副本`;
    copiedData.status = 'deactivated';
    setWarrantyInitialData(copiedData);
    setIsWarrantyViewOpen(false);
    setIsWarrantyCreateOpen(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 border-t border-slate-200">
      {/* Top Header */}
      <header className="h-[60px] bg-white border-b border-slate-100 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center">
          {/* Logo */}
          <div className="text-xl font-bold text-blue-600 mr-16 tracking-wide">
            营运通
          </div>

          {/* Top Navigation */}
          <nav className="flex items-center space-x-10 text-sm">
            <a href="#" className="font-medium text-slate-700 hover:text-blue-600 transition-colors">工作台</a>
            <a href="#" className="font-medium text-blue-600">销售中心</a>
            <a href="#" className="font-medium text-slate-700 hover:text-blue-600 transition-colors">仓储管理</a>
            <a href="#" className="font-medium text-slate-700 hover:text-blue-600 transition-colors">工单中心</a>
            <a href="#" className="font-medium text-slate-700 hover:text-blue-600 transition-colors">运营监控</a>
            <a href="#" className="font-medium text-slate-700 hover:text-blue-600 transition-colors">财务管理</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('dictionaries'); }} className="font-medium text-slate-700 hover:text-blue-600 transition-colors">系统设置</a>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search" 
              className="w-64 pl-4 pr-10 py-1.5 border border-indigo-200 rounded text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            <Search className="w-4 h-4 text-indigo-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-indigo-500 hover:text-indigo-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="text-indigo-500 hover:text-indigo-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
            <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica&backgroundColor=f8fafc" alt="avatar" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium text-indigo-500">账号资料</span>
            <ChevronDown className="w-4 h-4 text-indigo-500" />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden bg-white">
        {/* Sidebar */}
        <aside className="w-[180px] bg-white border-r border-slate-100 flex flex-col py-6 overflow-y-auto shrink-0 space-y-6">
          <div>
            <div className="px-6 mb-3 text-[13px] font-medium text-blue-600">销售中心</div>
            <a href="#" className="block px-6 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">设备订单</a>
            <a href="#" className="block px-6 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">监控订单</a>
            <a href="#" className="block px-6 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">售后订单</a>
            <a href="#" className="block px-6 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">车辆管理</a>
            <a href="#" className="block px-6 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">公司管理</a>
          </div>

          <div>
            <div className="px-6 mb-3 text-[13px] font-medium text-blue-600">商品中心</div>
            <a href="#" className="block px-6 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">产品管理</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('packages'); }} className={`block px-6 py-2.5 text-sm transition-colors ${currentPage === 'packages' ? 'text-white bg-indigo-500' : 'text-slate-700 hover:bg-slate-50'}`}>套餐管理</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('warranties'); }} className={`block px-6 py-2.5 text-sm transition-colors ${currentPage === 'warranties' ? 'text-white bg-indigo-500' : 'text-slate-700 hover:bg-slate-50'}`}>质保管理</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('commissions'); }} className={`block px-6 py-2.5 text-sm transition-colors ${currentPage === 'commissions' ? 'text-white bg-indigo-500' : 'text-slate-700 hover:bg-slate-50'}`}>提成管理</a>
          </div>

          <div>
            <div className="px-6 mb-3 text-[13px] font-medium text-blue-600">报表管理</div>
            <a href="#" className="block px-6 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">销售订单明细</a>
            <a href="#" className="block px-6 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">销售提成明细</a>
            <a href="#" className="block px-6 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">公司对账单</a>
          </div>

          <div>
            <div className="px-6 mb-3 text-[13px] font-medium text-blue-600">系统设置</div>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('dictionaries'); }} className={`block px-6 py-2.5 text-sm transition-colors ${currentPage === 'dictionaries' ? 'text-white bg-indigo-500' : 'text-slate-700 hover:bg-slate-50'}`}>信息配置表</a>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-white p-6 relative">
          {currentPage === 'packages' && (
            <PackageList 
              onViewDetail={() => setIsDetailOpen(true)} 
              onCreate={() => setIsCreateOpen(true)} 
            />
          )}

          {currentPage === 'warranties' && (
            <WarrantyList 
              onViewDetail={handleViewWarranty}
              onCreate={() => { setWarrantyInitialData(null); setIsWarrantyCreateOpen(true); }}
              onEdit={handleEditWarranty}
              onCopy={handleCopyWarranty}
            />
          )}

          {currentPage === 'commissions' && (
            <CommissionList 
              onViewDetail={() => setIsCommissionDetailOpen(true)}
              onCreate={() => { setCommissionInitialData(null); setIsCommissionCreateOpen(true); }}
              onEdit={handleEditCommission}
              onCopy={handleCopyCommission}
            />
          )}

          {currentPage === 'parts' && (
            <InstallPartList />
          )}

          {currentPage === 'dictionaries' && (
            <DictionaryConfig />
          )}

          {isCreateOpen && currentPage === 'packages' && (
            <PackageCreate 
              onBack={() => setIsCreateOpen(false)} 
              onSave={() => { setIsCreateOpen(false); setIsDetailOpen(true); }} 
            />
          )}
          
          {isDetailOpen && currentPage === 'packages' && (
            <PackageDetail onClose={() => setIsDetailOpen(false)} />
          )}

          {isCommissionCreateOpen && (
            <CommissionCreate 
              initialData={commissionInitialData}
              onBack={() => setIsCommissionCreateOpen(false)}
              onSave={() => { setIsCommissionCreateOpen(false); setIsCommissionDetailOpen(true); }}
            />
          )}

          {isCommissionDetailOpen && (
            <CommissionDetail onClose={() => setIsCommissionDetailOpen(false)} />
          )}

          {isWarrantyCreateOpen && (
            <WarrantyCreate 
              initialData={warrantyInitialData}
              onBack={() => setIsWarrantyCreateOpen(false)}
              onSave={() => { setIsWarrantyCreateOpen(false); setIsWarrantyViewOpen(true); }}
            />
          )}

          {isWarrantyViewOpen && (
            <WarrantyCreate 
              readOnly={true}
              initialData={warrantyInitialData}
              onBack={() => setIsWarrantyViewOpen(false)}
              onSave={() => { setIsWarrantyViewOpen(false); }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
