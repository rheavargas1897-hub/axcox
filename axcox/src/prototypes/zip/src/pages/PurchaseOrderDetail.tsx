import React, { useEffect } from 'react';
import { ArrowLeft, Edit, Copy, CheckCircle, Package, FileText, Clock, AlertCircle, CornerDownRight, X } from 'lucide-react';
import { StatusBadge } from '../components/ui';

export default function PurchaseOrderDetail({ navigateTo, orderId }: { navigateTo: (page: string, id?: string) => void, orderId: string | null }) {
  const id = orderId || 'CG20231023000089';
  
  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => navigateTo('list')}>
      <div className="w-full max-w-4xl bg-slate-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigateTo('list')} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">采购单详情</h1>
                <span className="text-lg font-mono text-slate-500">{id}</span>
                <StatusBadge status="待到货" />
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-white border border-slate-300 text-orange-600 rounded-md text-sm font-medium hover:bg-orange-50 flex items-center transition-colors shadow-sm">
              反审核
            </button>
            <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors shadow-sm">
              <Copy className="w-4 h-4 mr-2 text-slate-500" />
              复制
            </button>
            <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 flex items-center transition-colors shadow-sm">
              <Edit className="w-4 h-4 mr-2 text-slate-500" />
              编辑
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="grid grid-cols-12 gap-6">
          {/* Supplier Info */}
          <div className="col-span-5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">供应商信息</div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="col-span-2">
                <div className="text-xs text-slate-500">供应商名称</div>
                <div className="text-sm font-medium text-slate-900 mt-0.5">杭州精密机械制造厂</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">联系人及电话</div>
                <div className="text-sm text-slate-900 mt-0.5">李明 / 13911112222</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">收款账户名</div>
                <div className="text-sm text-slate-900 mt-0.5">杭州精密机械制造厂</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">开户支行</div>
                <div className="text-sm text-slate-900 mt-0.5">农业银行杭州西湖支行</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">银行账号</div>
                <div className="text-sm text-slate-900 font-mono mt-0.5">6228 4804 0404 0404</div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="col-span-4 border-l border-slate-100 pl-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">财务与付款</div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <div className="text-xs text-slate-500">付款方式</div>
                <div className="text-sm font-medium text-blue-600 mt-0.5 bg-blue-50 inline-block px-2 py-0.5 rounded">定金 + 尾款</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">收货仓库</div>
                <div className="text-sm text-slate-900 mt-0.5">华东中心仓</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">定金付款时间</div>
                <div className="text-sm text-slate-900 font-mono mt-0.5">2023-10-24</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">尾款付款时间</div>
                <div className="text-sm text-slate-900 font-mono mt-0.5">2023-11-24</div>
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="col-span-3 border-l border-slate-100 pl-6 flex flex-col justify-center">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-500 mb-1">总金额</div>
              <div className="text-2xl font-bold text-slate-900 font-mono">¥ 45,800.00</div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">已付金额:</span>
                  <span className="text-slate-900 font-mono">¥ 13,740.00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">未付金额:</span>
                  <span className="text-orange-600 font-mono font-medium">¥ 32,060.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="col-span-2 flex flex-col space-y-4">
          
          {/* Items Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <Package className="w-4 h-4 mr-2 text-slate-500" />
                商品明细
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">共 2 项</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">商品名称/规格</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">数量</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">已入库</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">单价</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">小计</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">电机设备-高精度伺服电机-汇川-750W 220V</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right">100</td>
                    <td className="px-4 py-3 text-sm font-mono text-emerald-600 text-right">0</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600 text-right">350.00</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right font-medium">35,000.00</td>
                    <td className="px-4 py-3"><StatusBadge status="待到货" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">视频设备-BSD盲区摄像头-中天安驰-P9S</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right">20</td>
                    <td className="px-4 py-3 text-sm font-mono text-emerald-600 text-right">0</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600 text-right">540.00</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right font-medium">10,800.00</td>
                    <td className="px-4 py-3"><StatusBadge status="待到货" /></td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-4 py-2 text-sm font-medium text-slate-700 text-right">合计：</td>
                    <td className="px-4 py-2 text-sm font-bold font-mono text-slate-900 text-right">45,800.00</td>
                    <td colSpan={1}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Records */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <CornerDownRight className="w-4 h-4 mr-2 text-slate-500" />
                到货记录
              </h2>
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">到货单号</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">到货日期</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">到货数量</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">到货仓库</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">收货人</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600 cursor-pointer hover:underline" onClick={() => navigateTo('inbound', 'RCV-20231025-001')}>RCV-20231025-001</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">2023-10-25</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900">50</td>
                    <td className="px-4 py-3 text-sm text-slate-700">华东中心仓</td>
                    <td className="px-4 py-3 text-sm text-slate-700">王建国</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Inbound Records */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <Package className="w-4 h-4 mr-2 text-slate-500" />
                入库记录
              </h2>
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">入库单号</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">入库日期</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">到货总数</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">合格总数</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">不合格总数</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 text-right">入库总数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600 cursor-pointer hover:underline" onClick={() => navigateTo('inspection', 'INB-20231026-001')}>INB-20231026-001</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">2023-10-26</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right">50</td>
                    <td className="px-4 py-3 text-sm font-mono text-emerald-600 text-right">48</td>
                    <td className="px-4 py-3 text-sm font-mono text-red-600 text-right">2</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right font-medium">48</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Exception Records */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-slate-500" />
                异常处理记录
              </h2>
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">关联单据</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">异常类型</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">处理状态</th>
                    <th className="px-4 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600 cursor-pointer hover:underline" onClick={() => navigateTo('inspection', 'INB-20231026-001')}>INB-20231026-001</td>
                    <td className="px-4 py-3 text-sm text-slate-900">入库异常 (不合格: 2)</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-200 rounded-sm">待处理</span></td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">2023-10-26 14:30</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="col-span-1 flex flex-col space-y-4">
          
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
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-900">审批通过</div>
                      <div className="text-xs text-slate-500 mt-1">审批人: 王总监</div>
                      <div className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100">同意采购，注意交期。</div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">10-23 14:30</div>
                  </div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-900">一级审批</div>
                      <div className="text-xs text-slate-500 mt-1">审批人: 李经理</div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">10-23 10:15</div>
                  </div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-900">提交审批</div>
                      <div className="text-xs text-slate-500 mt-1">操作人: 张采购</div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">10-23 09:00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Records */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-slate-500" />
                付款记录
              </h2>
            </div>
            <div className="p-0">
              <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono text-slate-500">PAY-20231024-012</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-green-50 text-green-600 border border-green-200 rounded-sm">已付款</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs text-slate-500">预付款 (30%)</div>
                    <div className="text-xs text-slate-400 font-mono mt-1">2023-10-24 10:00</div>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900">¥ 13,740.00</div>
                </div>
              </div>
            </div>
          </div>

          {/* Operation Logs */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-slate-500" />
                操作日志
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex space-x-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-600">财</span>
                </div>
                <div>
                  <div className="text-sm text-slate-700"><span className="font-medium text-slate-900">赵财务</span> 确认了付款记录</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">2023-10-24 10:05:12</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-600">总</span>
                </div>
                <div>
                  <div className="text-sm text-slate-700"><span className="font-medium text-slate-900">王总监</span> 审批通过了订单</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">2023-10-23 14:30:45</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-600">采</span>
                </div>
                <div>
                  <div className="text-sm text-slate-700"><span className="font-medium text-slate-900">张采购</span> 创建了订单</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">2023-10-23 08:55:10</div>
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
