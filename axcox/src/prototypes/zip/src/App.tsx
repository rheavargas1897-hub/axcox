/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PurchaseOrderList from './pages/PurchaseOrderList';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import InboundInspection from './pages/InboundInspection';
import PurchaseReturnList from './pages/PurchaseReturnList';
import PurchaseReturnDetail from './pages/PurchaseReturnDetail';

export default function App() {
  const [currentPage, setCurrentPage] = useState('list');
  const [currentOrderId, setCurrentOrderId] = useState<string | undefined>(undefined);

  const navigateTo = (page: string, id?: string) => {
    setCurrentPage(page);
    if (id) setCurrentOrderId(id);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar currentPage={currentPage} navigateTo={navigateTo} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentPage={currentPage} />
        <main className="flex-1 overflow-auto p-6 relative">
          {['list', 'detail'].includes(currentPage) && <PurchaseOrderList navigateTo={navigateTo} />}
          {currentPage === 'detail' && <PurchaseOrderDetail navigateTo={navigateTo} orderId={currentOrderId || null} />}
          {currentPage === 'inspection' && <InboundInspection navigateTo={navigateTo} orderId={currentOrderId || null} />}
          {['return_list', 'return_detail'].includes(currentPage) && <PurchaseReturnList navigateTo={navigateTo} />}
          {currentPage === 'return_detail' && <PurchaseReturnDetail navigateTo={navigateTo} returnId={currentOrderId || null} />}
        </main>
      </div>
    </div>
  );
}
