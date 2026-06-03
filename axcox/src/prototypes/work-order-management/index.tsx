import { useState } from 'react';
import { Truck, Monitor, Smartphone, ListTodo, FileText, LayoutDashboard, ClockAlert, Download, ChevronLeft, ChevronRight, User, Cpu, Coins, ShieldCheck, History, Check, UserCheck, Inbox, Users, MapPin, ScanBarcode, Camera, BadgeCheck } from 'lucide-react';

export default function WorkOrderManagement() {
  const [device, setDevice] = useState<'pc' | 'mobile'>('pc');
  const [pcPage, setPcPage] = useState<'list' | 'detail' | 'dispatch'>('list');
  const [currentStep, setCurrentStep] = useState(1);
  const [warranty, setWarranty] = useState<'in' | 'out'>('out');

  const totalSteps = 8;
  const stepNames = [
    "1. 我的工单",
    "2. 工单详情",
    "3. 到场签到",
    "4. 服务执行",
    "5. 设备更换",
    "6. 配件消耗",
    "7. 完工签收",
    "8. 提交审核"
  ];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateFee = () => {
    if (warranty === 'in') {
      return { device: "¥ 0.00 (保内免收)", work: "¥ 0.00 (保内免收)", total: "¥ 0.00", color: "text-emerald-600" };
    }
    return { device: "¥ 800.00", work: "¥ 150.00", total: "¥ 950.00", color: "text-indigo-600" };
  };

  const fees = calculateFee();

  return (
    <div className="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen">
      {/* 顶部全局导航栏 */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">车载设备服务商</h1>
            <span className="text-xs text-slate-400">工单管理系统 · MVP 核心范围预览</span>
          </div>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setDevice('pc')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              device === 'pc' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" /> PC 端运营中心
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              device === 'mobile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" /> 技师端小程序
          </button>
        </div>

        <div className="text-xs text-slate-400">当前版本: V1.0 (MVP)</div>
      </header>

      {/* PC 端视图 */}
      {device === 'pc' && (
        <main className="p-6 max-w-[1600px] mx-auto transition-all duration-300">
          {/* PC 子页面切换 */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setPcPage('list')}
                className={`px-4 py-2 text-sm font-semibold border-b-2 flex items-center gap-2 ${
                  pcPage === 'list' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ListTodo className="w-4 h-4" /> 工单列表
              </button>
              <button
                onClick={() => setPcPage('detail')}
                className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  pcPage === 'detail' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" /> 工单详情
              </button>
              <button
                onClick={() => setPcPage('dispatch')}
                className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  pcPage === 'dispatch' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> 派单工作台
              </button>
            </div>
            <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              💡 提示：点击上方 Tab 切换不同页面设计
            </div>
          </div>

          {/* 1. 工单列表页 */}
          {pcPage === 'list' && (
            <section className="space-y-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">工单检索</label>
                  <input type="text" placeholder="工单号/客户/车牌/技师..." className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">工单状态</label>
                  <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-indigo-600">
                    <option>全部状态</option>
                    <option>待派单</option>
                    <option>处理中</option>
                    <option>待审核</option>
                    <option>已完成</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">保内外属性</label>
                  <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-indigo-600">
                    <option>全部</option>
                    <option>保内</option>
                    <option>保外</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 transition">查询</button>
                  <button className="px-3 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition">重置</button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-800">工单数据大厅</span>
                  <button className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> 批量导出
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-xs font-semibold border-b border-slate-100">
                        <th className="p-4">工单号</th>
                        <th className="p-4">状态</th>
                        <th className="p-4">SLA 状态</th>
                        <th className="p-4">优先级</th>
                        <th className="p-4">客户与车辆</th>
                        <th className="p-4">工单类型</th>
                        <th className="p-4">服务技师</th>
                        <th className="p-4">创建时间</th>
                        <th className="p-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-semibold text-indigo-600 cursor-pointer" onClick={() => setPcPage('detail')}>WO202606020001</td>
                        <td className="p-4"><span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-purple-200">待审核</span></td>
                        <td className="p-4 text-red-600 font-semibold flex items-center gap-1"><ClockAlert className="w-4 h-4" /> 剩余 45m</td>
                        <td className="p-4"><span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-bold border border-red-100">🚨 紧急</span></td>
                        <td className="p-4">
                          <div className="font-medium">深圳某某物流</div>
                          <div className="text-xs text-slate-400">粤B·88888</div>
                        </td>
                        <td className="p-4">设备安装</td>
                        <td className="p-4">张师傅</td>
                        <td className="p-4 text-slate-400">2026-06-02 14:00</td>
                        <td className="p-4 text-right">
                          <button onClick={() => setPcPage('detail')} className="text-indigo-600 hover:text-indigo-800 font-medium">去审核</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-semibold text-indigo-600 cursor-pointer">WO202606020002</td>
                        <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-200">处理中</span></td>
                        <td className="p-4 text-slate-500">剩余 3h 12m</td>
                        <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">普通</span></td>
                        <td className="p-4">
                          <div className="font-medium">顺丰速运分拨中心</div>
                          <div className="text-xs text-slate-400">粤B·99999</div>
                        </td>
                        <td className="p-4">售后维修</td>
                        <td className="p-4">李师傅</td>
                        <td className="p-4 text-slate-400">2026-06-02 13:15</td>
                        <td className="p-4 text-right">
                          <button className="text-slate-600 hover:text-slate-900 font-medium">详情</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>共 2 条记录</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1 border border-slate-200 rounded hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
                    <button className="px-2.5 py-1 bg-indigo-600 text-white rounded">1</button>
                    <button className="p-1 border border-slate-200 rounded hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 2. 工单详情页 */}
          {pcPage === 'detail' && (
            <section className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">WO202606020001</span>
                      <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/30">待审核</span>
                      <span className="bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded text-xs font-bold border border-red-500/30">🚨 SLA 紧急</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">创建时间：2026-06-02 14:00:12 | 来源：销售订单自动触发</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">SLA 剩余处理时间</span>
                    <span className="text-xl font-bold text-red-400">45 分钟</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex gap-6 text-sm">
                    <span className="font-bold text-indigo-600 border-b-2 border-indigo-600 pb-3 cursor-pointer">基本信息</span>
                    <span className="text-slate-500 hover:text-slate-800 pb-3 cursor-pointer">服务记录</span>
                    <span className="text-slate-500 hover:text-slate-800 pb-3 cursor-pointer">设备与配件</span>
                    <span className="text-slate-500 hover:text-slate-800 pb-3 cursor-pointer">费用结算</span>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-indigo-600" /> 客户与车辆信息</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
                        <div><span className="text-slate-400 block text-xs">客户名称</span><span className="font-medium">深圳某某物流有限公司</span></div>
                        <div><span className="text-slate-400 block text-xs">联系电话</span><span className="font-medium">138-0000-0000</span></div>
                        <div><span className="text-slate-400 block text-xs">服务车牌</span><span className="font-medium text-indigo-600">粤B·88888</span></div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5"><Cpu className="w-4 h-4 text-indigo-600" /> 设备与配件更换明细</h3>
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-xs text-slate-400 font-semibold">
                            <tr>
                              <th className="p-3">类型</th>
                              <th className="p-3">名称</th>
                              <th className="p-3">SN 编码</th>
                              <th className="p-3">数量</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="p-3"><span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs">新装设备</span></td>
                              <td className="p-3 font-medium">车载智能T-Box (4G版)</td>
                              <td className="p-3 text-slate-500 font-mono">TB2026060201</td>
                              <td className="p-3">1 台</td>
                            </tr>
                            <tr>
                              <td className="p-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">旧件回收</span></td>
                              <td className="p-3 font-medium">旧款定位器</td>
                              <td className="p-3 text-slate-500 font-mono">TB2020110399</td>
                              <td className="p-3">1 台</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Coins className="w-4 h-4 text-indigo-600" /> 费用结算明细</span>
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">保内外支持人工微调</span>
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                        <div className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">保内外判定:</span>
                            <select
                              value={warranty}
                              onChange={(e) => setWarranty(e.target.value as 'in' | 'out')}
                              className="border border-slate-200 rounded px-2 py-1 text-xs font-semibold bg-white"
                            >
                              <option value="out">保外 (客户自费)</option>
                              <option value="in">保内 (免费核销)</option>
                            </select>
                          </div>
                          <div className="text-xs text-slate-400">系统根据销售合同自动预判</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span>设备硬件费:</span><span className="font-mono font-semibold">{fees.device}</span></div>
                          <div className="flex justify-between"><span>安装工时费:</span><span className="font-mono font-semibold">{fees.work}</span></div>
                          <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold text-base text-indigo-600">
                            <span>应付总金额:</span>
                            <span className={`font-mono ${fees.color}`}>{fees.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-indigo-600 relative overflow-hidden">
                  <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[10px] font-bold px-4 py-2 rotate-45">PENDING</div>
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-1.5"><ShieldCheck className="w-5 h-5 text-indigo-600" /> 审核质检中枢</h3>

                  <div className="space-y-4">
                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">📌 质检要点核对：</div>
                    <div className="space-y-2.5 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                        <span>现场完工照片清晰合格</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                        <span>新设备通电搜星测试成功</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                        <span>客户电子签名确认无误</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">审核意见 (驳回时必填)</label>
                      <textarea placeholder="请输入审核意见..." className="w-full text-sm border border-slate-200 rounded-lg p-2 h-20 focus:outline-indigo-600" />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => alert('工单审核通过，进入结算归档流程')} className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-emerald-700 transition">质检通过</button>
                      <button onClick={() => alert('工单已驳回至技师小程序端')} className="flex-1 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold py-2.5 rounded-lg hover:bg-red-100 transition">驳回</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-1.5"><History className="w-5 h-5 text-slate-600" /> 工单操作日志</h3>
                  <div className="space-y-4 relative before:absolute before:bottom-2 before:top-2 before:left-3.5 before:w-0.5 before:bg-slate-100">
                    <div className="flex gap-3 text-xs relative">
                      <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center z-10 shrink-0"><Check className="w-4 h-4" /></div>
                      <div>
                        <p className="font-semibold text-slate-800">技师提交完工</p>
                        <p className="text-slate-400">操作人：张师傅 | 2026-06-02 15:30</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs relative">
                      <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center z-10 shrink-0"><UserCheck className="w-4 h-4" /></div>
                      <div>
                        <p className="font-semibold text-slate-800">调度员派单</p>
                        <p className="text-slate-400">操作人：系统调度 | 2026-06-02 14:05</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3. 派单工作台 */}
          {pcPage === 'dispatch' && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[650px]">
                <div className="border-b border-slate-100 pb-3 mb-3 flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5"><Inbox className="w-5 h-5 text-indigo-600" /> 待派工单池 (3)</span>
                  <button onClick={() => alert('已触发智能推荐派单')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold px-2.5 py-1 rounded border border-indigo-100">智能推荐</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 hover:border-amber-400 transition cursor-pointer">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">WO202606020003</span>
                      <span className="text-amber-700 font-semibold">待派单</span>
                    </div>
                    <p className="text-sm font-medium">安装车载智能T-Box (重卡)</p>
                    <p className="text-xs text-slate-400">地址：深圳市南山区高新园北区</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-xs text-red-600 font-semibold">SLA: 剩余 1.5h</span>
                      <button onClick={() => alert('已指派给推荐技师')} className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded hover:bg-indigo-700">指派</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[650px]">
                <div className="border-b border-slate-100 pb-3 mb-3 flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5"><Users className="w-5 h-5 text-indigo-600" /> 技师资源看板</span>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                    <span className="bg-white px-2.5 py-1 rounded shadow-sm font-medium cursor-pointer">列表模式</span>
                    <span className="px-2.5 py-1 text-slate-500 hover:text-slate-800 cursor-pointer">地图模式</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 rounded-xl flex items-start gap-3 hover:shadow-sm transition">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0 font-bold">张</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">张师傅</span>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 font-medium">空闲</span>
                        </div>
                        <p className="text-xs text-slate-400">今日已完工: 3 | 擅长: 重卡设备安装</p>
                        <p className="text-xs text-slate-500">当前位置: 南山区科技园 (距离工单 1.2km)</p>
                      </div>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-xl flex items-start gap-3 hover:shadow-sm transition">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0 font-bold">李</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">李师傅</span>
                          <span className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-200 font-medium">服务中</span>
                        </div>
                        <p className="text-xs text-slate-400">今日已完工: 1 | 擅长: 售后故障维修</p>
                        <p className="text-xs text-slate-500">当前位置: 福田区车公庙 (服务中)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      {/* 移动端视图 */}
      {device === 'mobile' && (
        <main className="py-10 flex justify-center items-center">
          <div className="w-[375px] h-[760px] bg-slate-900 rounded-[45px] p-3.5 shadow-2xl border-4 border-slate-800 relative">
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-full z-20 flex justify-center items-center">
              <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
            </div>

            <div className="w-full h-full bg-slate-50 rounded-[32px] overflow-hidden flex flex-col relative border border-slate-700">
              <div className="bg-indigo-600 text-white pt-8 pb-3 px-4 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold">技师助手小程序</span>
                <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full text-[10px]">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> 运行中
                </div>
              </div>

              <div className="bg-white border-b border-slate-100 px-3 py-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>当前步骤:</span>
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">{stepNames[currentStep - 1]}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div className="flex gap-2 border-b border-slate-100 pb-2 text-xs font-semibold text-slate-500">
                      <span className="text-indigo-600 border-b-2 border-indigo-600 pb-1">待接单 (1)</span>
                      <span>进行中 (0)</span>
                      <span>已完工</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">WO202606020001</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">待接单</span>
                      </div>
                      <p className="text-xs font-bold">设备安装 · 粤B·88888</p>
                      <p className="text-[11px] text-slate-400">地址：深圳市南山区高新园北区</p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">工单基础信息</h4>
                      <p><span className="text-slate-400">客户:</span> 某某物流</p>
                      <p><span className="text-slate-400">车型:</span> 解放J6P 重卡</p>
                      <p><span className="text-slate-400">服务内容:</span> 安装 4G T-Box</p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-3 text-center">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto"><MapPin className="w-6 h-6" /></div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-800">GPS 自动定位中...</p>
                        <p className="text-slate-400 mt-1">已匹配客户地址偏差范围内</p>
                      </div>
                      <button className="w-full bg-slate-100 text-slate-700 text-xs py-2 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5"><Camera className="w-4 h-4" /> 拍摄现场车辆合影</button>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 space-y-3 text-xs">
                      <h4 className="font-bold text-slate-800">现场作业检查清单</h4>
                      <label className="flex items-center gap-2 py-1 border-b border-slate-50"><input type="checkbox" defaultChecked className="rounded" /> <span>设备外观完好</span></label>
                      <label className="flex items-center gap-2 py-1 border-b border-slate-50"><input type="checkbox" defaultChecked className="rounded" /> <span>线路隐蔽束扎</span></label>
                      <label className="flex items-center gap-2 py-1"><input type="checkbox" defaultChecked className="rounded" /> <span>通电搜星测试正常</span></label>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 space-y-3 text-xs">
                      <h4 className="font-bold text-slate-800">新旧设备扫码绑定</h4>
                      <button className="w-full bg-indigo-50 text-indigo-700 py-2 rounded border border-indigo-100 font-semibold flex items-center justify-center gap-1"><ScanBarcode className="w-4 h-4" /> 扫码录入新设备 SN</button>
                      <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-500">已扫码: TB2026060201</div>
                    </div>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-800">配件消耗确认</h4>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                        <span>12V电源线束</span>
                        <span className="font-bold">x 2 根</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 7 && (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 space-y-3 text-xs">
                      <h4 className="font-bold text-slate-800">客户手写签名确认</h4>
                      <div className="border-2 border-dashed border-slate-200 rounded-lg h-24 flex items-center justify-center text-slate-400 bg-slate-50 relative overflow-hidden">
                        <span className="text-[10px]">客户手写签名区</span>
                        <svg className="absolute w-24 h-12 text-indigo-600" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 25 C 20 5, 40 45, 60 15 C 80 5, 90 45, 95 25" /></svg>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 8 && (
                  <div className="space-y-3 text-center">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><BadgeCheck className="w-6 h-6" /></div>
                      <h4 className="font-bold text-slate-800 text-sm">工单已成功提交审核</h4>
                      <p className="text-xs text-slate-400">请等待后台质检及财务核算归档。</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border-t border-slate-100 p-3 flex gap-2">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex-1 border border-slate-200 text-slate-600 text-xs py-2 rounded-lg font-medium disabled:opacity-50"
                >上一步</button>
                <button
                  onClick={currentStep === totalSteps ? () => { alert('体验结束！'); setCurrentStep(1); } : nextStep}
                  className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >{currentStep === totalSteps ? '完成体验' : '下一步'}</button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
