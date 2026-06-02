import React, { useEffect } from 'react';
import { ArrowLeft, Package, User, MapPin, FileText, CheckCircle, Truck, CornerDownRight, AlertCircle, CreditCard, X } from 'lucide-react';
import { StatusBadge } from '../components/ui';

export default function PurchaseReturnDetail({ navigateTo, returnId }: { navigateTo: (page: string, id?: string) => void, returnId: string | null }) {
  const id = returnId === 'NEW' ? 'RT-20231026-001' : (returnId || 'RT-20231026-001');
  const isNew = returnId === 'NEW';
  
  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => navigateTo('return_list')}>
      <div className="w-full max-w-4xl bg-slate-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigateTo('return_list')} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">采购退货单</h1>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{id}</span>
                <StatusBadge status={isNew ? "草稿" : "待审核"} />
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            {isNew ? (
              <>
                <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors shadow-sm">
                  保存草稿
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center transition-colors shadow-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  提交审核
                </button>
              </>
            ) : (
              <>
                <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors shadow-sm">
                  驳回
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center transition-colors shadow-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  审核通过
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Content - Two Columns */}
          <div className="grid grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="col-span-2 flex flex-col space-y-4">
          
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-slate-500" />
                基础信息
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">供应商</label>
                <div className="text-sm text-slate-900 font-medium">杭州精密机械制造厂</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">退货日期</label>
                <div className="text-sm text-slate-900">2023-10-26</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">退货联系人</label>
                <div className="text-sm text-slate-900 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  张建国 (13800138000)
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">退货地址</label>
                <div className="text-sm text-slate-900 flex items-start">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-slate-400 shrink-0" />
                  浙江省杭州市余杭区仓前街道文一西路999号
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <Package className="w-4 h-4 mr-2 text-slate-500" />
                退货明细
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">共 1 项</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">商品名称/规格</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">可退数量</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">退货数量</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">退货单价</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">退货小计</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">退货原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">电机设备-高精度伺服电机-汇川-750W 220V</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-500 text-right">2</td>
                    <td className="px-4 py-3 text-sm font-mono text-red-600 font-bold text-right">2</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600 text-right">350.00</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right font-medium">700.00</td>
                    <td className="px-4 py-3 text-sm text-slate-700">质量不合格 (外包装破损)</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-4 py-2 text-sm font-medium text-slate-700 text-right">合计：</td>
                    <td className="px-4 py-2 text-sm font-bold font-mono text-slate-900 text-right">700.00</td>
                    <td colSpan={1}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial & Logistics */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-slate-500" />
                财务与物流
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">退款方式</label>
                <div className="text-sm text-slate-900">原路退回</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">退款账户</label>
                <div className="text-sm text-slate-900">中国工商银行 (尾号 8888)</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">出库仓库</label>
                <div className="text-sm text-slate-900">华东中心仓</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">物流信息</label>
                <div className="text-sm text-slate-500 italic">待出库后填写</div>
              </div>
            </div>
          </div>

          {/* Outbound Details */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <Truck className="w-4 h-4 mr-2 text-slate-500" />
                出库详情
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">出库单号</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">出库日期</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">仓库</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">出库数量</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">操作人</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">操作时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600 cursor-pointer hover:underline">OUT-20231026-005</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">2023-10-26</td>
                    <td className="px-4 py-3 text-sm text-slate-700">华东中心仓</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right font-medium">2</td>
                    <td className="px-4 py-3 text-sm text-slate-700">李仓管</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">2023-10-26 16:30:00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="col-span-1 flex flex-col space-y-4">
          
          {/* Related Documents */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <CornerDownRight className="w-4 h-4 mr-2 text-slate-500" />
                关联单据
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">源采购订单</label>
                <div 
                  className="text-sm font-mono text-blue-600 cursor-pointer hover:underline"
                  onClick={() => navigateTo('detail', 'CG20231023000089')}
                >
                  CG20231023000089
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">源入库异常单</label>
                <div className="text-sm font-mono text-slate-900">EXC-20231026-001</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">退货出库单</label>
                <div className="text-sm font-mono text-blue-600 cursor-pointer hover:underline">OUT-20231026-005</div>
              </div>
            </div>
          </div>

          {/* Approval Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-slate-500" />
                审批流程
              </h2>
            </div>
            <div className="p-5">
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-500">财务审核</div>
                      <div className="text-xs text-slate-400 mt-0.5">待处理</div>
                    </div>
                  </div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-900">采购主管审核</div>
                      <div className="text-xs text-slate-500 mt-0.5">王主管</div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">审批中</div>
                  </div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-900">发起退货申请</div>
                      <div className="text-xs text-slate-500 mt-0.5">张采购</div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">10-26 14:45</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
