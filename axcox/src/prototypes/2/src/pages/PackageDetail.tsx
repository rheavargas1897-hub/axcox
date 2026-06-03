import React, { useState } from 'react';
import { X, Copy, CheckCircle2, History, AlertCircle, Plus } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import CommissionForm from '../components/CommissionForm';
import WarrantyForm from '../components/WarrantyForm';
import { MOCK_WARRANTIES } from './WarrantyList';

const VERSIONS = [
  { id: 'v2.1', name: 'V2.1', status: 'active', date: '2023-10-01' },
  { id: 'v2.0', name: 'V2.0', status: 'archived', date: '2023-05-15 至 2023-10-01' },
  { id: 'v1.0', name: 'V1.0', status: 'archived', date: '2022-11-01 至 2023-05-15' },
];

export default function PackageDetail({ onClose }: { onClose: () => void }) {
  const [activeVersion, setActiveVersion] = useState('v2.1');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  const handleCopyClick = () => {
    setNewVersionName('');
    setIsCopyModalOpen(true);
  };

  const handleConfirmCopy = () => {
    if (newVersionName.trim()) {
      console.log(`Copied version ${activeVersion} to ${newVersionName}`);
      setIsCopyModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-slate-50 shadow-2xl w-full max-w-[1400px] h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">套餐详情</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Top Card: Package Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">商用车高级盲区监控套餐</h1>
                <StatusBadge status="active" />
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  编辑基础信息
                </button>
                <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                  套餐停用
                </button>
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="flex flex-col gap-y-6 py-4 border-t border-slate-100">
              <div>
                <div className="text-xs text-slate-500 mb-2">套餐描述</div>
                <div className="text-sm font-medium text-slate-900 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-lg">
                  这是一款专为大货车及渣土车定制的高级盲区监控套餐，包括部标机和高清盲区摄像头，提供完整的数据记录和实时视频回传功能。
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-2">业务类型</div>
                <div className="text-sm font-medium text-slate-900 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-lg">
                  普通视频-仅具备录像回放，无主动安全算法
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-2">是否为转网套餐</div>
                <div className="text-sm font-medium text-slate-900 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-lg">
                  否
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-2">终端类型</div>
                <div className="text-sm font-medium text-slate-900 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-lg">
                  主动安全
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-2">销售方案</div>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100 shadow-sm">普通销售</span>
                </div>
              </div>
            </div>
          </div>

          {/* Version Management Area */}
          <div className="flex gap-6">
            {/* Left Sidebar: Version List */}
            <div className="w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">版本管理</h3>
                <button 
                  onClick={handleCopyClick}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="复制当前版本创建新草稿"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {VERSIONS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVersion(v.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between group ${
                      activeVersion === v.id 
                        ? 'bg-blue-50 border border-blue-100' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className={`font-medium ${activeVersion === v.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {v.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{v.date}</div>
                    </div>
                    {v.status === 'active' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {v.status === 'draft' && <div className="w-2 h-2 rounded-full bg-amber-400"></div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content: Version Details */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-900 text-lg">{VERSIONS.find(v => v.id === activeVersion)?.name} 配置详情</h3>
                  <StatusBadge status={VERSIONS.find(v => v.id === activeVersion)?.status || 'draft'} />
                </div>
                {VERSIONS.find(v => v.id === activeVersion)?.status === 'draft' && (
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                    校验并发布
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1 p-6 space-y-8">
                {/* Rules Section */}
                <section>
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    生效规则
                  </h4>
                  <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4 border border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">生效时间</div>
                      <div className="text-sm font-medium text-slate-900">2023-10-01 10:00:00</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">失效时间</div>
                      <div className="text-sm font-medium text-slate-900">长期有效</div>
                    </div>
                  </div>
                </section>

                {/* Pricing Section */}
                <section>
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    价格配置
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">服务年限</th>
                          <th className="px-4 py-3 font-medium text-right">套餐总价 (元)</th>
                          <th className="px-4 py-3 font-medium text-right">首年费用 (元)</th>
                          <th className="px-4 py-3 font-medium text-right">次年起续费 (元/年)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-900">1年</td>
                          <td className="px-4 py-3 text-right tabular-nums">2,800.00</td>
                          <td className="px-4 py-3 text-right tabular-nums">2,800.00</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-500">720.00</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-900">3年</td>
                          <td className="px-4 py-3 text-right tabular-nums">4,000.00</td>
                          <td className="px-4 py-3 text-right tabular-nums">4,000.00</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-500">720.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Items Section */}
                <section>
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    绑定产品信息
                  </h4>
                  <div className="mb-6 flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-800">下单时是否支持额外加购产品:</span>
                    <span className="text-sm text-slate-900">是</span>
                    <span className="text-sm text-slate-400 ml-2">加购的产品享受跟套餐一样的质保方案</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                      <thead className="bg-[#f4f5f7] text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-medium border border-slate-200 text-center w-12">#</th>
                          <th className="px-4 py-3 font-medium border border-slate-200 text-center">安装部位</th>
                          <th className="px-4 py-3 font-medium border border-slate-200 text-center">产品范围</th>
                          <th className="px-4 py-3 font-medium border border-slate-200">产品明细</th>
                          <th className="px-4 py-3 font-medium border border-slate-200 text-center w-[60px]">数量</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {/* Row 1 */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-center border border-slate-200 text-slate-600">1</td>
                          <td className="px-4 py-3 border border-slate-200 text-center font-medium">前方摄像头</td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            <span className="px-2 py-1 bg-slate-100 rounded text-slate-600">指定产品</span>
                          </td>
                          <td className="px-4 py-3 border border-slate-200">
                            <div className="text-slate-700">海康威视 DS-2CD2T47G2-前端摄像头-海康威视-DS-2CD2T47G2</div>
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">2</td>
                        </tr>
                        {/* Row 2 */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-center border border-slate-200 text-slate-600">2</td>
                          <td className="px-4 py-3 border border-slate-200 text-center font-medium">盲区摄像头</td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            <span className="px-2 py-1 bg-slate-100 rounded text-slate-600">指定类别</span>
                          </td>
                          <td className="px-4 py-3 border border-slate-200">
                            <ul className="space-y-1">
                              <li className="text-slate-700 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                鹰眼 BSD盲区摄像头-盲区摄像头-鹰眼-BSD-1
                              </li>
                              <li className="text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <span className="line-through">海康威视 盲区雷达套件-盲区摄像头-海康威视-DS-B1</span>
                                <span className="text-xs text-red-500 ml-2 bg-red-50 px-1 py-0.5 rounded">已排除</span>
                              </li>
                            </ul>
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Warranty Section */}
                <section>
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    质保方案
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 opacity-100 pointer-events-none">
                    <h5 className="font-semibold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-200">高级3年质保</h5>
                    <WarrantyForm type="package" readOnly value={MOCK_WARRANTIES[0]?.config || {}} />
                  </div>
                </section>

                {/* Commission Section */}
                <section>
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    提成方案信息
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 opacity-100 pointer-events-none">
                       <h5 className="font-semibold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-200">安装提成：标准安装提成方案</h5>
                       <CommissionForm type="install" readOnly value={{}} />
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 opacity-100 pointer-events-none">
                       <h5 className="font-semibold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-200">销售提成：高级销售提成方案</h5>
                       <CommissionForm type="sales" readOnly value={{}} />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Audit Log Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              操作日志
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">操作时间</th>
                    <th className="px-4 py-3 font-medium">操作人</th>
                    <th className="px-4 py-3 font-medium">操作类型</th>
                    <th className="px-4 py-3 font-medium">操作详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">2023-10-01 09:30:12</td>
                    <td className="px-4 py-3 text-slate-900">张三 (系统管理员)</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">发布版本</span></td>
                    <td className="px-4 py-3 text-slate-600">发布版本 V2.1，状态变更为生效</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">2023-09-28 14:20:00</td>
                    <td className="px-4 py-3 text-slate-900">李四 (产品经理)</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">修改配置</span></td>
                    <td className="px-4 py-3 text-slate-600">
                      修改价格配置：<br/>
                      <span className="text-slate-400 line-through mr-2">1年期 2600.00</span> 
                      <span className="text-emerald-600">1年期 2800.00</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-500 tabular-nums">2023-09-28 10:00:00</td>
                    <td className="px-4 py-3 text-slate-900">李四 (产品经理)</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">创建版本</span></td>
                    <td className="px-4 py-3 text-slate-600">基于 V2.0 复制创建草稿版本 V2.1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Device Modal */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">查看设备</h3>
              <button onClick={() => setIsDeviceModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-700">产品名称</th>
                      <th className="px-4 py-3 font-medium text-slate-700">品名</th>
                      <th className="px-4 py-3 font-medium text-slate-700">品牌</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-center">型号</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-center">单价</th>
                      <th className="px-4 py-3 font-medium text-slate-700 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700">海康威视 DS-2CD2T47G2</td>
                      <td className="px-4 py-3 text-slate-700">前端摄像头</td>
                      <td className="px-4 py-3 text-slate-700">海康威视</td>
                      <td className="px-4 py-3 text-center text-slate-700">DS-2CD2T47G2</td>
                      <td className="px-4 py-3 text-center text-slate-700 tabular-nums">500.00</td>
                      <td className="px-4 py-3 text-center text-slate-500">—</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 bg-slate-50">
                      <td className="px-4 py-3 text-slate-400 line-through">大华 高清前方探头 A-1</td>
                      <td className="px-4 py-3 text-slate-400">前端摄像头</td>
                      <td className="px-4 py-3 text-slate-400">大华</td>
                      <td className="px-4 py-3 text-center text-slate-400">A-1</td>
                      <td className="px-4 py-3 text-center text-slate-400 tabular-nums">450.00</td>
                      <td className="px-4 py-3 text-center text-red-500 font-medium">已排除</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700">鹰眼 前置记录仪 F4</td>
                      <td className="px-4 py-3 text-slate-700">前端摄像头</td>
                      <td className="px-4 py-3 text-slate-700">鹰眼</td>
                      <td className="px-4 py-3 text-center text-slate-700">F4</td>
                      <td className="px-4 py-3 text-center text-slate-700 tabular-nums">600.00</td>
                      <td className="px-4 py-3 text-center text-slate-500">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Version Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">复制版本</h3>
              <button 
                onClick={() => setIsCopyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>将基于当前选中的 <strong>{VERSIONS.find(v => v.id === activeVersion)?.name}</strong> 复制所有配置（包含基础信息、价格、套餐明细），并生成一个新的草稿版本。</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  新版本号 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="例如: V2.2" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmCopy}
                disabled={!newVersionName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认复制
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
