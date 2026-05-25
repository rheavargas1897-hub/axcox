import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Car, 
  Video, 
  ShieldCheck, 
  CalendarClock,
  X,
  Clock,
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  User,
  LayoutDashboard,
  Wrench,
  Settings,
  Info,
  Server,
  Bell
} from 'lucide-react';

// --- 数据模型 & Mock 模拟数据 ---
type ServiceStatus = {
  statusText: string;
  remainingDays: number;
  totalDays: number;
  startDate: string;
  endDate: string;
};

type FinancialInfo = {
  orderNo?: string;
  receivable?: number;
  received?: number;
  unpaid?: number;
};

type Equipment = {
  id: string;
  type: 'package' | 'single';
  installPosition: string; // 安装部位
  productName: string; // 产品名称
  deviceCode: string; // 设备编码
  warrantyEndDate: string; // 质保截止日期
  warrantyStatus: 'active' | 'expiring' | 'expired' | 'none'; // 质保状态
};

type AfterSalesRecord = {
  id: string;
  installPosition: string;
  productName: string;
  deviceCode: string;
  orderNo: string;
  orderTime: string;
};

type Vehicle = {
  id: string;
  plate: string;
  vin: string;
  hostCode: string;
  simCard: string;
  vehicleType: string;
  packageType: string;
  company: string;
  fleet: string;
  annual: ServiceStatus & FinancialInfo;
  monitor: ServiceStatus & FinancialInfo;
  warranty: ServiceStatus;
  equipments?: Equipment[];
  afterSalesRecords?: AfterSalesRecord[];
};

const sampleEquipments: Equipment[] = [
  { id: 'e1', type: 'package', installPosition: '前置摄像头', productName: '海康威视 DS-2CD3T45FP', deviceCode: 'SN202400018899', warrantyEndDate: '2026-05-24', warrantyStatus: 'expiring' },
  { id: 'e2', type: 'package', installPosition: '车内监控', productName: '大华 DH-IPC-HFW2831S', deviceCode: 'SN202400021122', warrantyEndDate: '2027-03-10', warrantyStatus: 'active' },
  { id: 'e3', type: 'package', installPosition: 'GPS定位器', productName: '途强 GT06N', deviceCode: 'SN202400030099', warrantyEndDate: '2025-01-01', warrantyStatus: 'expired' },
  { id: 'e4', type: 'package', installPosition: '后置摄像头', productName: '—（安装时指定）', deviceCode: '—', warrantyEndDate: '—', warrantyStatus: 'none' },
  { id: 'e5', type: 'single', installPosition: '—', productName: '行车记录仪支架', deviceCode: '—', warrantyEndDate: '—', warrantyStatus: 'none' },
];

const sampleRecords: AfterSalesRecord[] = [
  { id: 'r1', installPosition: '前置摄像头', productName: '海康威视 DS-2CD3T45FP', deviceCode: 'SN202400018899', orderNo: 'SH20250301001', orderTime: '2025-03-01' },
  { id: 'r2', installPosition: 'GPS定位器', productName: '途强 GT06N', deviceCode: 'SN202400030099', orderNo: 'SH20250415002', orderTime: '2025-04-15' },
];

const MOCK_DATA: Vehicle[] = [
  {
    id: 'V1001',
    plate: '粤A·88888',
    vin: 'LBV345678901234',
    hostCode: 'HC82937411',
    simCard: '89860401123456789012',
    vehicleType: '重货车',
    packageType: '穗标1899套餐 (3年质保)',
    company: '广州宏远物流有限公司',
    fleet: '南沙一车队',
    annual: { statusText: '正常服务', remainingDays: 120, totalDays: 365, startDate: '2025-09-09', endDate: '2026-09-09', orderNo: 'AN20250909001', receivable: 1899, received: 1899, unpaid: 0 },
    monitor: { statusText: '免费监控中', remainingDays: 120, totalDays: 365, startDate: '2025-09-09', endDate: '2026-09-09', orderNo: 'MN20250909001', receivable: 0, received: 0, unpaid: 0 },
    warranty: { statusText: '质保中', remainingDays: 850, totalDays: 1095, startDate: '2024-09-09', endDate: '2027-09-09' },
    equipments: sampleEquipments,
    afterSalesRecords: sampleRecords
  },
  {
    id: 'V1002',
    plate: '粤A·66666',
    vin: 'LBV123987654321',
    hostCode: 'HC99882233',
    simCard: '89860401123456789033',
    vehicleType: '泥头车',
    packageType: '新装套餐',
    company: '广州市建安土石方工程',
    fleet: '白云突击队',
    annual: { statusText: '即将到期', remainingDays: 15, totalDays: 365, startDate: '2025-05-25', endDate: '2026-05-24', orderNo: 'AN20250525002', receivable: 1200, received: 1000, unpaid: 200 },
    monitor: { statusText: '免费监控中', remainingDays: 15, totalDays: 365, startDate: '2025-05-25', endDate: '2026-05-24', orderNo: 'MN20250525002', receivable: 0, received: 0, unpaid: 0 },
    warranty: { statusText: '已过保', remainingDays: 0, totalDays: 365, startDate: '2024-05-25', endDate: '2025-05-24' },
    equipments: [],
    afterSalesRecords: []
  },
  {
    id: 'V1003',
    plate: '粤B·99999',
    vin: 'LBV111122223333',
    hostCode: 'HC11223344',
    simCard: '89860401123456789044',
    vehicleType: '两客一危',
    packageType: '转网套餐',
    company: '深圳安捷客运',
    fleet: '城际线一队',
    annual: { statusText: '正常服务', remainingDays: 200, totalDays: 365, startDate: '2025-11-25', endDate: '2026-11-25', orderNo: 'AN20251125003', receivable: 800, received: 800, unpaid: 0 },
    monitor: { statusText: '付费监控中', remainingDays: 80, totalDays: 365, startDate: '2025-07-28', endDate: '2026-07-28', orderNo: 'MN20250728003', receivable: 400, received: 400, unpaid: 0 },
    warranty: { statusText: '无质保', remainingDays: 0, totalDays: 0, startDate: '-', endDate: '-' },
    equipments: [],
    afterSalesRecords: []
  },
  {
    id: 'V1004',
    plate: '粤S·12345',
    vin: 'LBV999988887777',
    hostCode: 'HC55667788',
    simCard: '89860401123456789055',
    vehicleType: '重货车',
    packageType: '年费续费套餐',
    company: '东莞虎门通拓流',
    fleet: '干线车队',
    annual: { statusText: '已过期', remainingDays: -10, totalDays: 365, startDate: '2025-04-29', endDate: '2026-04-29', orderNo: 'AN20250429004', receivable: 600, received: 0, unpaid: 600 },
    monitor: { statusText: '监控已停', remainingDays: -10, totalDays: 365, startDate: '2025-04-29', endDate: '2026-04-29', orderNo: 'MN20250429004', receivable: 0, received: 0, unpaid: 0 },
    warranty: { statusText: '延保服务中', remainingDays: 355, totalDays: 365, startDate: '2026-04-29', endDate: '2027-04-29' },
    equipments: [],
    afterSalesRecords: []
  },
  {
    id: 'V1005',
    plate: '粤C·78787',
    vin: 'LBV444455556666',
    hostCode: 'HC99001122',
    simCard: '89860401123456789066',
    vehicleType: '其他车辆',
    packageType: '新装套餐',
    company: '珠海海滨物流',
    fleet: '市内配送',
    annual: { statusText: '正常服务', remainingDays: 300, totalDays: 365, startDate: '2026-03-05', endDate: '2027-03-05', orderNo: 'AN20260305005', receivable: 1500, received: 1500, unpaid: 0 },
    monitor: { statusText: '免费监控中', remainingDays: 300, totalDays: 365, startDate: '2026-03-05', endDate: '2027-03-05', orderNo: 'MN20260305005', receivable: 0, received: 0, unpaid: 0 },
    warranty: { statusText: '停机保号延后', remainingDays: 140, totalDays: 365, startDate: '2025-01-01', endDate: '2026-09-28' },
    equipments: [],
    afterSalesRecords: []
  }
];

// --- 组件定义 ---

const CustomTooltip = ({ content, children, className = "inline-flex" }: { content: string, children: React.ReactNode, className?: string }) => {
  return (
    <div className={`relative group/tooltip ${className}`}>
      {children}
      {content && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/tooltip:opacity-100 invisible group-hover/tooltip:visible transition-all duration-200 z-[999] flex flex-col items-center pointer-events-none drop-shadow-md">
          <div className="bg-[#2D2D2D] text-white text-[13px] whitespace-nowrap px-3 py-1.5 rounded-[4px] shadow-lg font-normal tracking-wide">
            {content}
          </div>
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#2D2D2D]"></div>
        </div>
      )}
    </div>
  );
};

// 1. 数据概览卡片
const MetricCard = ({ title, value, icon: Icon, colorClass, delay = 0, onClick, isActive }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-4 rounded-xl border ${isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'} shadow-sm flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both hover:-translate-y-1 transition-transform cursor-pointer`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
      <Icon className={`w-8 h-8 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-slate-500 text-xs font-semibold mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  </div>
);

// 2. 双行带进度条的单元格
const StatusBarCell = ({ status }: { status: ServiceStatus }) => {
  const isZero = status.totalDays === 0;
  const isExpired = status.remainingDays < 0;
  const isWarning = status.remainingDays >= 0 && status.remainingDays <= 30 && !isZero;
  
  let pcbColor = "bg-emerald-500";
  let textColor = "text-emerald-600";
  if (isZero) { pcbColor = "bg-slate-300"; textColor = "text-slate-500"; }
  else if (isExpired) { pcbColor = "bg-rose-500"; textColor = "text-rose-500"; }
  else if (isWarning) { pcbColor = "bg-amber-400"; textColor = "text-amber-500"; }

  let percentage = isZero ? 0 : Math.max(0, Math.min(100, (status.remainingDays / status.totalDays) * 100));
  if (isExpired) { percentage = 100; pcbColor = "bg-rose-500 bg-opacity-20"; }

  const activeBarWidth = isExpired ? 0 : percentage;

  return (
    <div className="flex flex-col min-w-[140px]">
      <div className="flex justify-between text-[11px] mb-1 font-medium">
        <span className={textColor}>
          {status.statusText}
        </span>
        <span className="text-slate-400">
          {isZero ? '--' : isExpired ? '剩余 0 天' : `剩余 ${status.remainingDays} 天`}
        </span>
      </div>
      <CustomTooltip content={isZero ? '暂无有效期' : `${status.startDate} ～ ${status.endDate}`} className="w-full flex">
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden cursor-help">
          <div 
            className={`h-full ${pcbColor} transition-all duration-1000 ease-out`} 
            style={{ width: `${activeBarWidth}%` }} 
          />
        </div>
      </CustomTooltip>
    </div>
  );
};


const WarrantyDate = ({ date, status }: { date: string, status: string }) => {
  if (!date || date === '—' || status === 'none') {
    return <span className="text-[#8C8C8C]">—</span>;
  }
  let color = '#8C8C8C';
  if (status === 'active') {
    color = '#52C41A';
  } else if (status === 'expiring') {
    color = '#FA8C16';
  } else if (status === 'expired') {
    color = '#FF4D4F';
  }
  
  return (
    <span className="font-medium" style={{ color }}>{date}</span>
  );
};

// 3. 详情弹窗组件
const VehicleDetailModal = ({ vehicle, onClose }: { vehicle: Vehicle | null, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'basic'|'warranty'|'monitor'|'annual'|'records'|'afterSales'>('basic');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);

  if (!vehicle) return null;

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
        activeTab === id 
        ? 'bg-white text-blue-600 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] border-t border-x border-slate-200 -mb-[1px] relative z-10' 
        : 'text-slate-600 hover:bg-slate-200/50 border-t border-x border-transparent'
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{vehicle.plate} <span className="text-sm font-normal text-slate-400 font-mono ml-2">{vehicle.vin}</span></h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wide">{vehicle.vehicleType}</span>
              {isSuspended && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold rounded tracking-wide">已停机保号</span>}
              {isCanceled && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold rounded tracking-wide">已注销</span>}
            </div>
            <p className="text-sm text-slate-500 mt-1">{vehicle.fleet} | {vehicle.company}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSuspendModal(true)} 
              disabled={isCanceled || isSuspended}
              className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${isCanceled || isSuspended ? 'border-[#F0F0F0] text-[#BFBFBF] cursor-not-allowed bg-[#F5F5F5]' : 'border-[#D9D9D9] text-[#595959] hover:border-[#8C8C8C] hover:text-[#262626] bg-white'}`}
            >
              停机保号
            </button>
            <button 
              onClick={() => setShowCancelModal(true)} 
              disabled={isCanceled}
              className={`px-3 py-1.5 text-[13px] font-medium border rounded transition-colors ${isCanceled ? 'border-[#F0F0F0] text-[#BFBFBF] cursor-not-allowed bg-[#F5F5F5]' : 'border-[#FF4D4F] text-[#FF4D4F] hover:bg-[#FFF1F0]'}`}
            >
              注销
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors ml-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 px-4 pt-2 bg-slate-50 hide-scrollbar shrink-0">
          <TabButton id="basic" label="基本信息" icon={FileText} />
          <TabButton id="annual" label="年费信息" icon={CalendarClock} />
          <TabButton id="monitor" label="监控信息" icon={Video} />
          <TabButton id="warranty" label="质保信息" icon={ShieldCheck} />
          <TabButton id="records" label="服务记录" icon={Clock} />
          <TabButton id="afterSales" label="售后记录" icon={Wrench} />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-200 pb-2">车辆档案</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">车辆类型</span><span className="font-medium text-slate-700">{vehicle.vehicleType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">上牌公司</span><span className="font-medium text-slate-700">{vehicle.company}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">所属车队</span><span className="font-medium text-slate-700">{vehicle.fleet}</span></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-200 pb-2">业务配置</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">当前套餐</span><span className="font-medium text-slate-700">{vehicle.packageType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">主机编码</span><span className="font-medium text-slate-700">{vehicle.hostCode}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">SIM卡卡号</span><span className="font-medium text-slate-700">{vehicle.simCard}</span></div>
                  </div>
                </div>
              </div>

              {/* 设备信息 */}
              <div className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden mt-4">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F0F0F0]">
                  <div className="w-[3px] h-[14px] bg-[#1677FF] rounded-sm"></div>
                  <h3 className="text-[14px] font-bold text-slate-800">设备信息</h3>
                </div>

                <div className="p-5 space-y-6">
                  {/* Package Equipment */}
                  {(vehicle.equipments?.filter(eq => eq.type === 'package').length ?? 0) > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[12px] text-[#8C8C8C] font-medium">套餐设备</span>
                        <span className="px-2 py-0.5 bg-[#F5F5F5] text-[#8C8C8C] text-[11px] rounded-full">「{vehicle.packageType}」</span>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#FAFAFA]">
                            <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[15%]">安装部位</th>
                            <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[30%]">产品名称</th>
                            <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[30%]">设备编码</th>
                            <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[25%]">质保截止日期</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F0]">
                          {vehicle.equipments?.filter(eq => eq.type === 'package').map((eq, i) => (
                            <tr key={i} className="hover:bg-[#F5F7FF] transition-colors h-[48px]">
                              <td className="px-4 text-[13px] text-slate-700">{eq.installPosition || '—'}</td>
                              <td className="px-4 text-[13px] text-slate-700">{eq.productName || '—'}</td>
                              <td className="px-4 text-[13px] text-[#595959] font-mono">{eq.deviceCode || '—'}</td>
                              <td className="px-4 text-[13px]">
                                <WarrantyDate date={eq.warrantyEndDate} status={eq.warrantyStatus} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Single Product Equipment */}
                  {(vehicle.equipments?.filter(eq => eq.type === 'single').length ?? 0) > 0 && (
                    <div>
                      <div className="mb-3">
                        <span className="text-[12px] text-[#8C8C8C] font-medium">单产品设备</span>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#FAFAFA]">
                            <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[15%]">安装部位</th>
                            <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[30%]">产品名称</th>
                            <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[30%]">设备编码</th>
                            <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[25%]">质保截止日期</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F0]">
                          {vehicle.equipments?.filter(eq => eq.type === 'single').map((eq, i) => (
                            <tr key={i} className="hover:bg-[#F5F7FF] transition-colors h-[48px]">
                              <td className="px-4 text-[13px] text-slate-700">{eq.installPosition || '—'}</td>
                              <td className="px-4 text-[13px] text-slate-700">{eq.productName || '—'}</td>
                              <td className="px-4 text-[13px] text-[#595959] font-mono">{eq.deviceCode || '—'}</td>
                              <td className="px-4 text-[13px]">
                                <WarrantyDate date={eq.warrantyEndDate} status={eq.warrantyStatus} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {(!vehicle.equipments || vehicle.equipments.length === 0) && (
                    <div className="py-8 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
                      <Server className="w-8 h-8 text-slate-300 mb-2" />
                      <span className="text-sm text-slate-500">暂无绑定设备</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitor' && (
             <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                 <h3 className="text-xs font-bold text-slate-400 uppercase">视频监控服务</h3>
                 <div className="flex items-center gap-4">
                   <button 
                     disabled={isCanceled}
                     className="px-3 py-1.5 bg-[#1677FF] text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     + 续费
                   </button>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${vehicle.monitor.remainingDays > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {vehicle.monitor.statusText}
                   </span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-8 text-sm">
                 <div className="space-y-4">
                   <div>
                     <p className="text-slate-500 mb-1">监控生效起</p>
                     <p className="text-base font-medium text-slate-700">{vehicle.monitor.startDate}</p>
                   </div>
                   <div>
                     <p className="text-slate-500 mb-1">监控到期日</p>
                     <p className="text-base font-medium text-slate-700">{vehicle.monitor.endDate}</p>
                   </div>
                   <div>
                     <p className="text-slate-500 mb-1">关联单号</p>
                     <a href="#" className="font-medium text-blue-600 hover:underline">{vehicle.monitor.orderNo || '该服务暂无关联订单'}</a>
                   </div>
                 </div>
                 
                 <div className="bg-white p-4 rounded border border-slate-200">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">监控财务信息</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className="text-slate-500">应收金额</span>
                       <span className="font-medium text-slate-700">¥{vehicle.monitor.receivable?.toFixed(2) || '0.00'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">已收金额</span>
                       <span className="font-medium text-emerald-600">¥{vehicle.monitor.received?.toFixed(2) || '0.00'}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-slate-100 mt-2 block">
                       <span className="text-slate-500">未收金额</span>
                       <span className={`font-bold ${vehicle.monitor.unpaid && vehicle.monitor.unpaid > 0 ? 'text-rose-500' : 'text-slate-700'}`}>
                         ¥{vehicle.monitor.unpaid?.toFixed(2) || '0.00'}
                       </span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-4">
              {/* 整体质保 */}
              <div className="bg-white p-6 rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    硬件质保及延保
                  </h3>
                  <div className="flex items-center gap-4">
                    <div title={vehicle.vehicleType === '泥头车' ? '该车型不支持购买延保' : ''}>
                      <button 
                        disabled={isCanceled || isSuspended || vehicle.vehicleType === '泥头车'}
                        className="px-3 py-1.5 bg-[#1677FF] text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + 续保
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {vehicle.warranty.remainingDays > 30 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6FFED] text-[#52C41A] text-xs font-bold border border-[#b7eb8f]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#52C41A]"></div>
                          质保中
                        </div>
                      )}
                      {vehicle.warranty.remainingDays > 0 && vehicle.warranty.remainingDays <= 30 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF7E6] text-[#FA8C16] text-xs font-bold border border-[#ffd591]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FA8C16]"></div>
                          即将到期
                        </div>
                      )}
                      {vehicle.warranty.remainingDays <= 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-[20px] bg-[#F5F5F5] text-[#8C8C8C] text-xs font-bold border border-[#d9d9d9]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8C8C8C]"></div>
                          已过保
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-[13px] mb-2">
                  <div>
                    <p className="text-[#8C8C8C] mb-1">质保生效期</p>
                    <p className="text-[15px] font-bold text-slate-700">{vehicle.warranty.startDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#8C8C8C] mb-1">质保到期日</p>
                    <p className="text-[15px] font-bold text-slate-700">{vehicle.warranty.endDate}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {(() => {
                   const start = new Date(vehicle.warranty.startDate).getTime();
                   const end = new Date(vehicle.warranty.endDate).getTime();
                   const today = new Date().getTime();
                   let percent = 0;
                   let bgColor = '#52C41A';
                   if (!start || !end || isNaN(start) || isNaN(end)) {
                     percent = 0;
                     bgColor = '#d9d9d9';
                   } else if (vehicle.warranty.remainingDays <= 0) {
                     percent = 100;
                     bgColor = '#d9d9d9';
                   } else {
                     const total = end - start;
                     const elapsed = today - start;
                     percent = Math.max(0, Math.min(100, (elapsed / total) * 100));
                     if (vehicle.warranty.remainingDays <= 30) bgColor = '#FA8C16';
                   }

                   return (
                     <div className="h-1 w-full bg-[#f0f0f0] rounded-[2px] mb-6 overflow-hidden">
                       <div className="h-full rounded-[2px]" style={{ width: `${percent}%`, backgroundColor: bgColor }}></div>
                     </div>
                   );
                })()}

                {/* 延保提示说明卡片 */}
                <div className="bg-[#FFFBE6] rounded-[8px] flex items-stretch border border-[#ffe58f] overflow-hidden">
                  <div className="w-[3px] bg-[#FA8C16] shrink-0"></div>
                  <div className="p-3 pl-4 flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#FA8C16] shrink-0 mt-[2px]" />
                    <div>
                      <h4 className="text-[13px] font-bold text-[#AD6800] mb-1">
                        {vehicle.annual.remainingDays < 0 ? '年费已逾期' : '延保提示说明'}
                      </h4>
                      <p className="text-[12px] text-[#8C8C8C] leading-[1.8]">
                        {vehicle.annual.remainingDays < 0 
                          ? '注意：该车辆年费已逾期。年费过期之后，不支持硬件质保服务，也不支持购买延保。'
                          : vehicle.vehicleType === '泥头车' 
                            ? '注意：泥头车不支持购买额外延保，过保后按售后实际发生费用收取。' 
                            : '该车符合延保条件。支持随年费同时购买120元/年，或单独后补200元/年。'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 设备质保卡片 */}
              {vehicle.equipments && vehicle.equipments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicle.equipments.map(eq => (
                    <div key={eq.id} className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] flex items-stretch overflow-hidden">
                       <div className={`w-[4px] shrink-0 ${eq.warrantyStatus === 'active' ? 'bg-[#52C41A]' : eq.warrantyStatus === 'expiring' ? 'bg-[#FA8C16]' : 'bg-[#8C8C8C]'}`}></div>
                       <div className="flex-1 p-4">
                         <div className="flex justify-between items-start mb-3">
                           <div>
                             <div className="text-[14px] font-bold text-[#1F1F1F] flex items-center gap-2">
                               <Video className="w-4 h-4 text-slate-500" />
                               {eq.installPosition}
                             </div>
                             <div className="text-[12px] text-[#8C8C8C] italic mt-1">{eq.type === 'single' ? '独立质保' : '套餐质保'}</div>
                           </div>
                           
                           <div className={`flex items-center gap-1.5 text-xs font-medium ${eq.warrantyStatus === 'active' ? 'text-[#52C41A]' : eq.warrantyStatus === 'expiring' ? 'text-[#FA8C16]' : 'text-[#8C8C8C]'}`}>
                             {eq.warrantyStatus === 'active' ? '质保中' : eq.warrantyStatus === 'expiring' ? '即将到期' : '已过保'}
                             <div className={`w-1.5 h-1.5 rounded-full ${eq.warrantyStatus === 'active' ? 'bg-[#52C41A]' : eq.warrantyStatus === 'expiring' ? 'bg-[#FA8C16]' : 'bg-[#8C8C8C]'}`}></div>
                           </div>
                         </div>
                         
                         <div className="mt-4">
                           <p className="text-[12px] text-[#8C8C8C] mb-1">质保到期日</p>
                           <p className={`text-[16px] font-bold ${eq.warrantyStatus === 'active' ? 'text-[#52C41A]' : eq.warrantyStatus === 'expiring' ? 'text-[#FA8C16]' : 'text-[#8C8C8C]'}`}>
                             {eq.warrantyEndDate}
                           </p>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'annual' && (
             <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                 <h3 className="text-xs font-bold text-slate-400 uppercase">SIM卡及年费服务</h3>
                 <div className="flex items-center gap-4">
                   <button 
                     disabled={isCanceled || isSuspended}
                     className="px-3 py-1.5 bg-[#1677FF] text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     + 续费
                   </button>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${vehicle.annual.remainingDays > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {vehicle.annual.statusText}
                   </span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-8 text-sm">
                 <div className="space-y-4">
                   <div>
                     <p className="text-slate-500 mb-1">年费生效起</p>
                     <p className="text-base font-medium text-slate-700">{vehicle.annual.startDate}</p>
                   </div>
                   <div>
                     <p className="text-slate-500 mb-1">年费到期止</p>
                     <p className="text-base font-medium text-slate-700">{vehicle.annual.endDate}</p>
                   </div>
                   <div>
                     <p className="text-slate-500 mb-1">关联单号</p>
                     <a href="#" className="font-medium text-blue-600 hover:underline">{vehicle.annual.orderNo || '暂无关联订单'}</a>
                   </div>
                 </div>

                 <div className="bg-white p-4 rounded border border-slate-200">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">年费财务信息</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className="text-slate-500">应收金额</span>
                       <span className="font-medium text-slate-700">¥{vehicle.annual.receivable?.toFixed(2) || '0.00'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">已收金额</span>
                       <span className="font-medium text-emerald-600">¥{vehicle.annual.received?.toFixed(2) || '0.00'}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-slate-100 mt-2 block">
                       <span className="text-slate-500">未收金额</span>
                       <span className={`font-bold ${vehicle.annual.unpaid && vehicle.annual.unpaid > 0 ? 'text-rose-500' : 'text-slate-700'}`}>
                         ¥{vehicle.annual.unpaid?.toFixed(2) || '0.00'}
                       </span>
                     </div>
                   </div>
                 </div>
               </div>

               {vehicle.annual.remainingDays < 0 && (
                   <div className="p-4 bg-rose-50 rounded-lg border border-rose-100 flex items-start gap-3 mt-4">
                     <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                     <p className="text-sm text-rose-800">
                        该车辆年费已逾期！根据2026年业务规则，年费到期当日一切质保及配套监控服务自动停止，请尽快跟进续费。
                     </p>
                   </div>
               )}
             </div>
          )}

          {activeTab === 'records' && (
             <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">日期</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">事件类型</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">处理记录</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">操作人</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">2026-03-01</td>
                      <td className="p-4"><span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-600 font-medium rounded text-xs border border-blue-100">停机保号</span></td>
                      <td className="p-4">全量恢复，年费延后2个月</td>
                      <td className="p-4">客服王雪</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">2025-09-09</td>
                      <td className="p-4"><span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-600 font-medium rounded text-xs border border-emerald-100">续签年费</span></td>
                      <td className="p-4">一年基础通讯费</td>
                      <td className="p-4">销售李涛</td>
                    </tr>
                  </tbody>
                </table>
             </div>
          )}

          {activeTab === 'afterSales' && (
            <div className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA]">
                    <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[15%] border-b border-[#F0F0F0]">安装部位</th>
                    <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[25%] border-b border-[#F0F0F0]">产品名称</th>
                    <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[25%] border-b border-[#F0F0F0]">设备编码</th>
                    <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[20%] border-b border-[#F0F0F0]">售后单号</th>
                    <th className="py-2.5 px-4 text-[12px] font-medium text-[#8C8C8C] w-[15%] border-b border-[#F0F0F0]">售后时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {(vehicle.afterSalesRecords && vehicle.afterSalesRecords.length > 0) ? (
                    vehicle.afterSalesRecords.map((record, i) => (
                       <tr key={i} className="hover:bg-[#F5F7FF] transition-colors h-[48px]">
                        <td className="px-4 text-[13px] text-slate-700">{record.installPosition || '—'}</td>
                        <td className="px-4 text-[13px] text-slate-700">{record.productName || '—'}</td>
                        <td className="px-4 text-[13px] text-[#595959] font-mono">{record.deviceCode || '—'}</td>
                        <td className="px-4 text-[13px]">
                          <a href="#" className="font-mono text-[#1677FF] hover:underline cursor-pointer">{record.orderNo}</a>
                        </td>
                        <td className="px-4 text-[13px] text-slate-700">{record.orderTime}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="py-12 flex flex-col items-center justify-center">
                          <Wrench className="w-8 h-8 text-slate-300 mb-2" />
                          <span className="text-sm text-[#8C8C8C]">暂无售后记录</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[999] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-[12px] p-6 w-96 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-3">确认停机保号？</h3>
            <p className="text-sm text-slate-600 leading-[1.8] mb-6">
              停机保号后，该车辆设备将暂停服务，
              SIM 卡号码保留，可随时恢复。
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setShowSuspendModal(false)} className="px-4 py-2 border border-[#D9D9D9] text-[#595959] rounded bg-white hover:bg-slate-50 transition-colors text-sm font-medium">取消</button>
              <button onClick={() => { setIsSuspended(true); setShowSuspendModal(false); }} className="px-4 py-2 bg-[#1677FF] text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium">确认停机保号</button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[999] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-[12px] p-6 w-96 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" /> 确认注销该车辆？
            </h3>
            <p className="text-sm text-slate-600 leading-[1.8] mb-6">
              注销后车辆档案及设备绑定关系将被停用，
              此操作不可撤销，请谨慎操作。
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 border border-[#D9D9D9] text-[#595959] rounded bg-white hover:bg-slate-50 transition-colors text-sm font-medium">取消</button>
              <button onClick={() => { setIsCanceled(true); setShowCancelModal(false); }} className="px-4 py-2 bg-[#FF4D4F] text-white rounded hover:bg-rose-600 transition-colors text-sm font-medium">确认注销</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const PROCESSED_DATA = MOCK_DATA.map(car => {
  if (car.annual.remainingDays < 0) {
    return {
      ...car,
      warranty: {
        ...car.warranty,
        statusText: '不支持质保(年费逾期)',
        remainingDays: -1,
        totalDays: 0
      }
    };
  }
  return car;
});

const uniqueTypes = Array.from(new Set(PROCESSED_DATA.map(d => d.vehicleType)));
const uniquePackages = Array.from(new Set(PROCESSED_DATA.map(d => d.packageType)));
const uniqueCompanies = Array.from(new Set(PROCESSED_DATA.map(d => d.company)));
const uniqueFleets = Array.from(new Set(PROCESSED_DATA.map(d => d.fleet)));

// 4. 主页面
export default function App() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPackage, setFilterPackage] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterFleet, setFilterFleet] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState('服务管理');
  const [activeMetric, setActiveMetric] = useState<string | null>(null);

  const handleMetricClick = (metric: string) => {
    setActiveMetric(prev => prev === metric ? null : metric);
  };

  const baseFilteredData = PROCESSED_DATA.filter(car => {
    const matchSearch = car.plate.toLowerCase().includes(searchQuery.toLowerCase()) || car.vin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = !filterType || car.vehicleType === filterType;
    const matchPackage = !filterPackage || car.packageType === filterPackage;
    const matchCompany = !filterCompany || car.company === filterCompany;
    const matchFleet = !filterFleet || car.fleet === filterFleet;
    return matchSearch && matchType && matchPackage && matchCompany && matchFleet;
  });

  // 计算看板指标 (基于筛选后的数据)
  const totalVehicles = baseFilteredData.length;
  const annualActive = baseFilteredData.filter(v => v.annual.remainingDays > 0).length;
  const monitorActive = baseFilteredData.filter(v => v.monitor.remainingDays > 0).length;
  const warrantyActive = baseFilteredData.filter(v => v.warranty.remainingDays > 0).length;
  const expiringSoon = baseFilteredData.filter(v => v.annual.remainingDays > 0 && v.annual.remainingDays <= 30).length;
  const noWarranty = baseFilteredData.filter(v => v.warranty.totalDays === 0 || v.warranty.remainingDays <= 0).length;

  const filteredData = baseFilteredData.filter(v => {
    if (activeMetric === 'annualActive') return v.annual.remainingDays > 0;
    if (activeMetric === 'monitorActive') return v.monitor.remainingDays > 0;
    if (activeMetric === 'warrantyActive') return v.warranty.remainingDays > 0;
    if (activeMetric === 'expiringSoon') return v.annual.remainingDays > 0 && v.annual.remainingDays <= 30;
    if (activeMetric === 'noWarranty') return v.warranty.totalDays === 0 || v.warranty.remainingDays <= 0;
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5] font-sans text-slate-900 overflow-hidden">
      
      {/* 顶部导航条 */}
      <header className="h-[60px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0 z-30 w-full">
        <div className="flex items-center gap-8 h-full">
          <div className="text-[20px] font-bold text-[#1677FF] flex items-center">
            营运通
          </div>
          <nav className="flex items-center gap-6 h-full text-[15px] font-medium text-slate-600">
            <span className="cursor-pointer hover:text-[#1677FF] transition-colors">工作台</span>
            <span className="text-[#1677FF] h-full flex items-center border-b-2 border-[#1677FF] cursor-pointer">销售中心</span>
            <span className="cursor-pointer hover:text-[#1677FF] transition-colors">仓储管理</span>
            <span className="cursor-pointer hover:text-[#1677FF] transition-colors">工单中心</span>
            <span className="cursor-pointer hover:text-[#1677FF] transition-colors">运营监控</span>
            <span className="cursor-pointer hover:text-[#1677FF] transition-colors">财务管理</span>
            <span className="cursor-pointer hover:text-[#1677FF] transition-colors">系统设置</span>
          </nav>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-64 pl-4 pr-10 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-[13px] focus:outline-none focus:border-[#1677FF] hover:border-[#1677FF] transition-colors"
            />
            <Search className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-[#1677FF] transition-colors" />
          </div>
          <button className="text-[#6B7280] hover:text-[#1677FF] transition-colors"><Bell className="w-5 h-5" /></button>
          <button className="text-[#6B7280] hover:text-[#1677FF] transition-colors"><Settings className="w-5 h-5" /></button>
          <div className="flex items-center cursor-pointer group gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-slate-200 overflow-hidden flex items-center justify-center">
              <div className="w-full h-full bg-[#FFE4D6] flex items-center justify-center text-[#FA8C16] font-bold text-sm">账</div>
            </div>
            <span className="text-sm font-medium text-slate-700">账号资料</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧菜单栏 (参考图片格式) */}
        <aside className="w-[200px] bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 overflow-y-auto z-20">
          <div className="py-4 pb-8 space-y-6">
            {[
              {
                title: '销售中心',
                items: ['设备订单', '监控订单', '售后订单', '车辆管理', '服务管理', '公司管理']
              },
              {
                title: '商品中心',
                items: ['产品管理', '套餐管理', '质保管理', '提成管理']
              },
              {
                title: '报表管理',
                items: ['销售订单明细', '销售提成明细', '公司对账单']
              },
              {
                title: '系统设置',
                items: ['信息配置表']
              }
            ].map((section, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="px-6 py-2 text-[14px] font-bold text-[#1677FF]">
                  {section.title}
                </div>
                <div>
                  {section.items.map(item => (
                    <button
                      key={item}
                      onClick={() => setActiveMenu(item)}
                      className={`w-full text-left px-6 py-3 text-[14px] transition-colors ${
                        activeMenu === item 
                        ? 'bg-[#5B5CFF] text-white font-medium' 
                        : 'text-slate-700 hover:bg-[#F5F7FF] hover:text-[#1677FF]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 右侧主内容区 */}
        <main className="flex-1 overflow-y-auto bg-transparent p-6 flex flex-col relative w-full h-full">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-[20px] font-bold text-slate-900 tracking-wide">{activeMenu}</h2>
            <div className="flex items-center gap-3">
               <button className="px-4 py-1.5 bg-[#1677FF] text-white rounded text-[13px] font-medium hover:bg-blue-600 transition-colors flex items-center">
                  <span className="text-lg leading-none mr-1 inline-block -mt-0.5">+</span> 新建服务
               </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-visible">
            <div className="h-full flex flex-col space-y-6">
              {/* 指标卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard title="服务车辆总数" value={totalVehicles} icon={Car} colorClass="bg-blue-500" delay={0} onClick={() => handleMetricClick('totalVehicles')} isActive={activeMetric === 'totalVehicles'} />
          <MetricCard title="年费服务中" value={annualActive} icon={CalendarClock} colorClass="bg-emerald-500" delay={100} onClick={() => handleMetricClick('annualActive')} isActive={activeMetric === 'annualActive'} />
          <MetricCard title="监控服务中" value={monitorActive} icon={Video} colorClass="bg-indigo-500" delay={200} onClick={() => handleMetricClick('monitorActive')} isActive={activeMetric === 'monitorActive'} />
          <MetricCard title="质保服务中" value={warrantyActive} icon={ShieldCheck} colorClass="bg-teal-500" delay={300} onClick={() => handleMetricClick('warrantyActive')} isActive={activeMetric === 'warrantyActive'} />
          <MetricCard title="即将到期(30天内)" value={expiringSoon} icon={AlertCircle} colorClass="bg-amber-500" delay={400} onClick={() => handleMetricClick('expiringSoon')} isActive={activeMetric === 'expiringSoon'} />
          <MetricCard title="无质保/已过保" value={noWarranty} icon={ShieldAlert} colorClass="bg-rose-500" delay={500} onClick={() => handleMetricClick('noWarranty')} isActive={activeMetric === 'noWarranty'} />
        </div>

        {/* 车辆列表区 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          
          {/* 工具栏 */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <h2 className="text-lg font-semibold text-slate-800">服务状态追踪明细</h2>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="搜索车牌号/车架号..." 
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 bg-slate-50 text-slate-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 text-sm border rounded-lg transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                筛选器
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-4 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">车辆类型</label>
                <select 
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={filterType} onChange={e => setFilterType(e.target.value)}
                >
                  <option value="">全部</option>
                  {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">套餐</label>
                <select 
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={filterPackage} onChange={e => setFilterPackage(e.target.value)}
                >
                  <option value="">全部</option>
                  {uniquePackages.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">上牌公司</label>
                <select 
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
                >
                  <option value="">全部</option>
                  {uniqueCompanies.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">所属车队</label>
                <select 
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={filterFleet} onChange={e => setFilterFleet(e.target.value)}
                >
                  <option value="">全部</option>
                  {uniqueFleets.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* 表格主体 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">车牌号 / 车架号</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">车辆类型 / 套餐</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">上牌公司</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">所属车队</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">年费状态</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">监控状态</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">质保状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((car, idx) => (
                  <tr key={car.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div 
                        className="text-sm font-semibold text-blue-600 underline decoration-blue-200 cursor-pointer"
                        onClick={() => setSelectedVehicle(car)}
                      >
                        {car.plate}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{car.vin}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-700">{car.vehicleType}</div>
                      <CustomTooltip content={car.packageType} className="max-w-[120px] flex mt-0.5">
                        <div className="text-xs text-slate-400 truncate cursor-default w-full">
                          {car.packageType}
                        </div>
                      </CustomTooltip>
                    </td>
                    <td className="p-4">
                      <CustomTooltip content={car.company} className="max-w-[160px] flex">
                        <div className="text-sm text-slate-600 font-medium truncate cursor-default w-full">
                          {car.company}
                        </div>
                      </CustomTooltip>
                    </td>
                    <td className="p-4">
                      <CustomTooltip content={car.fleet} className="max-w-[160px] flex">
                        <div className="text-sm text-slate-600 truncate cursor-default w-full">
                          {car.fleet}
                        </div>
                      </CustomTooltip>
                    </td>
                    <td className="p-4 min-w-[130px]"><StatusBarCell status={car.annual} /></td>
                    <td className="p-4 min-w-[130px]"><StatusBarCell status={car.monitor} /></td>
                    <td className="p-4 min-w-[130px]"><StatusBarCell status={car.warranty} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>显示 1 - {filteredData.length} 条，共 {filteredData.length} 条</span>
            <div className="flex space-x-1">
              <button className="px-3 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50" disabled>上一页</button>
              <button className="px-3 py-1 border border-slate-200 rounded bg-blue-50 text-blue-600 font-medium">1</button>
              <button className="px-3 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50" disabled>下一页</button>
            </div>
          </div>
        </div>
        </div>
        </div>
      </main>
      </div>

      {/* 弹窗占位渲染 */}
      {selectedVehicle && (
        <VehicleDetailModal 
          vehicle={selectedVehicle} 
          onClose={() => setSelectedVehicle(null)} 
        />
      )}

    </div>
  );
}
