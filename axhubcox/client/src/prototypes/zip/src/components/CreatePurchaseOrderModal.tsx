import React, { useState } from 'react';
import { X, Plus, Trash2, Building2, CreditCard, PackageOpen, Truck } from 'lucide-react';

interface SupplierInfo {
  contact: string;
  phone: string;
  accountName: string;
  accountNo: string;
  bank: string;
}

const MOCK_SUPPLIERS: Record<string, SupplierInfo> = {
  'SUP001': {
    contact: '张建国',
    phone: '13800138000',
    accountName: '深圳市鑫源电子有限公司',
    accountNo: '6222020202020202',
    bank: '招商银行深圳科技园支行'
  },
  'SUP002': {
    contact: '李明',
    phone: '13911112222',
    accountName: '杭州精密机械制造厂',
    accountNo: '6228480404040404',
    bank: '农业银行杭州西湖支行'
  }
};

interface WarehouseInfo {
  manager: string;
  phone: string;
}

const MOCK_WAREHOUSES: Record<string, WarehouseInfo> = {
  'WH001': { manager: '王建国', phone: '13812345678' },
  'WH002': { manager: '李大钊', phone: '13987654321' }
};

export default function CreatePurchaseOrderModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [supplierId, setSupplierId] = useState('');
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo>({
    contact: '', phone: '', accountName: '', accountNo: '', bank: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('现结');
  const [paymentDetails, setPaymentDetails] = useState({
    depositDate: '',
    balanceDate: '',
    installments: '3',
    creditPeriod: '30'
  });

  const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const [deliveryDetails, setDeliveryDetails] = useState({
    purchaseDate: today,
    expectedDate: '',
    warehouseId: '',
    manager: '',
    phone: ''
  });

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSupplierId(id);
    if (MOCK_SUPPLIERS[id]) {
      setSupplierInfo({ ...MOCK_SUPPLIERS[id] });
    } else {
      setSupplierInfo({ contact: '', phone: '', accountName: '', accountNo: '', bank: '' });
    }
  };

  const handleSupplierInfoChange = (field: keyof SupplierInfo, value: string) => {
    setSupplierInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentDetailsChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleDeliveryDetailsChange = (field: string, value: string) => {
    setDeliveryDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (MOCK_WAREHOUSES[id]) {
      setDeliveryDetails(prev => ({ 
        ...prev, 
        warehouseId: id, 
        manager: MOCK_WAREHOUSES[id].manager, 
        phone: MOCK_WAREHOUSES[id].phone 
      }));
    } else {
      setDeliveryDetails(prev => ({ 
        ...prev, 
        warehouseId: id, 
        manager: '', 
        phone: '' 
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">新建采购订单</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* Module 1: Supplier Info */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center mb-4 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 mr-2 text-blue-600" />
              供应商信息
            </h3>
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">选择供应商 <span className="text-red-500">*</span></label>
                <select 
                  value={supplierId} 
                  onChange={handleSupplierChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">请选择供应商...</option>
                  <option value="SUP001">深圳市鑫源电子有限公司</option>
                  <option value="SUP002">杭州精密机械制造厂</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">联系人</label>
                <input 
                  type="text" 
                  value={supplierInfo.contact}
                  onChange={(e) => handleSupplierInfoChange('contact', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">联系电话</label>
                <input 
                  type="text" 
                  value={supplierInfo.phone}
                  onChange={(e) => handleSupplierInfoChange('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono" 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">收款账户名</label>
                <input 
                  type="text" 
                  value={supplierInfo.accountName}
                  onChange={(e) => handleSupplierInfoChange('accountName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">收款账户号</label>
                <input 
                  type="text" 
                  value={supplierInfo.accountNo}
                  onChange={(e) => handleSupplierInfoChange('accountNo', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono" 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">开户支行</label>
                <input 
                  type="text" 
                  value={supplierInfo.bank}
                  onChange={(e) => handleSupplierInfoChange('bank', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>
          </div>

          {/* Module 2: Finance & Payment */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center mb-4 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 mr-2 text-emerald-600" />
              财务与付款
            </h3>
            <div className="grid grid-cols-4 gap-5">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">付款方式 <span className="text-red-500">*</span></label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="现结">现结</option>
                  <option value="记账">记账</option>
                  <option value="定金+尾款">定金+尾款</option>
                  <option value="尾款分期">尾款分期</option>
                </select>
              </div>

              {/* Conditional Fields based on Payment Method */}
              {paymentMethod === '记账' && (
                <div className="col-span-1 animate-in fade-in slide-in-from-left-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">账期 (天) <span className="text-red-500">*</span></label>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      min="1"
                      value={paymentDetails.creditPeriod}
                      onChange={(e) => handlePaymentDetailsChange('creditPeriod', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                    <span className="px-3 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md text-sm text-slate-600">天</span>
                  </div>
                </div>
              )}

              {paymentMethod === '定金+尾款' && (
                <>
                  <div className="col-span-1 animate-in fade-in slide-in-from-left-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">定金付款时间 <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={paymentDetails.depositDate}
                      onChange={(e) => handlePaymentDetailsChange('depositDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div className="col-span-1 animate-in fade-in slide-in-from-left-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">尾款付款时间 <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={paymentDetails.balanceDate}
                      onChange={(e) => handlePaymentDetailsChange('balanceDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </>
              )}

              {paymentMethod === '尾款分期' && (
                <div className="col-span-1 animate-in fade-in slide-in-from-left-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">尾款分期期数 <span className="text-red-500">*</span></label>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      min="2"
                      max="24"
                      value={paymentDetails.installments}
                      onChange={(e) => handlePaymentDetailsChange('installments', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                    <span className="px-3 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md text-sm text-slate-600">期</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Module 3: Delivery Info */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center mb-4 pb-2 border-b border-slate-100">
              <Truck className="w-4 h-4 mr-2 text-purple-600" />
              到货模块
            </h3>
            <div className="grid grid-cols-5 gap-5">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">采购日期 <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  value={deliveryDetails.purchaseDate}
                  onChange={(e) => handleDeliveryDetailsChange('purchaseDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">预计到货日期</label>
                <input 
                  type="date" 
                  value={deliveryDetails.expectedDate}
                  onChange={(e) => handleDeliveryDetailsChange('expectedDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">到货仓库 <span className="text-red-500">*</span></label>
                <select 
                  value={deliveryDetails.warehouseId} 
                  onChange={handleWarehouseChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">请选择仓库...</option>
                  <option value="WH001">华南一号仓</option>
                  <option value="WH002">华东中心仓</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">仓库负责人</label>
                <input 
                  type="text" 
                  value={deliveryDetails.manager}
                  onChange={(e) => handleDeliveryDetailsChange('manager', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50" 
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">联系电话</label>
                <input 
                  type="text" 
                  value={deliveryDetails.phone}
                  onChange={(e) => handleDeliveryDetailsChange('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Module 4: Product Details */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <PackageOpen className="w-4 h-4 mr-2 text-orange-500" />
                采购明细
              </h3>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center bg-blue-50 px-2 py-1 rounded">
                <Plus className="w-3 h-3 mr-1" /> 添加商品
              </button>
            </div>
            
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200">商品名称/规格</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 w-32">数量</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 w-32">含税单价</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 w-32">小计</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 w-16 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-slate-200">
                    <input type="text" placeholder="产品分组-产品名称-品牌-规格" className="w-full px-2 py-1 text-sm border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none" />
                  </td>
                  <td className="px-3 py-2 border border-slate-200">
                    <input type="number" placeholder="0" className="w-full px-2 py-1 text-sm font-mono border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none" />
                  </td>
                  <td className="px-3 py-2 border border-slate-200">
                    <input type="number" placeholder="0.00" className="w-full px-2 py-1 text-sm font-mono border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none" />
                  </td>
                  <td className="px-3 py-2 border border-slate-200 bg-slate-50 text-sm font-mono text-slate-500">
                    0.00
                  </td>
                  <td className="px-3 py-2 border border-slate-200 text-center">
                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end space-x-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
            取消
          </button>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
            保存草稿
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            提交审批
          </button>
        </div>

      </div>
    </div>
  );
}
