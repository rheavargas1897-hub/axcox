import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

interface WarrantyDrawerProps {
  mode: 'create' | 'view' | 'edit';
  onClose: () => void;
  data?: any;
}

const VEHICLE_TYPES = ['重型货车', '渣土车', '出租车', '乘用车', '客运', '危运', '普货'];
const MOCK_PRODUCTS = ['1072部标机', 'T-Box', 'ADAS摄像头', '4G行车记录仪'];
const MOCK_PACKAGES = ['高级监控套餐', '基础监控套餐', '按揭特别套餐', '大客户专属套餐'];

export default function WarrantyDrawer({ mode, onClose, data }: WarrantyDrawerProps) {
  const isView = mode === 'view';
  const title = mode === 'create' ? '新增质保方案' : mode === 'edit' ? '编辑质保方案' : '质保方案详情';

  const [warrantyType, setWarrantyType] = useState(data?.type || 'product');
  const [boundItems, setBoundItems] = useState<string[]>(data?.boundItems || []);
  const [selectedFreeTypes, setSelectedFreeTypes] = useState<string[]>(data?.monitorServiceDetails?.freeTypes || ['渣土车', '普货']);
  const [selectedExtendTypes, setSelectedExtendTypes] = useState<string[]>(data?.extendedWarrantyDetails?.supportTypes || ['客运', '危运']);
  const [monitorBindPackage, setMonitorBindPackage] = useState(data?.monitorServiceDetails?.bindPackage ?? false);
  const [extendBindPackage, setExtendBindPackage] = useState(data?.extendedWarrantyDetails?.bindPackage ?? true);
  const [giveFreeWarranty, setGiveFreeWarranty] = useState(data?.firstBuyDetails?.giveFree ?? true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const toggleFreeType = (type: string) => {
    setSelectedFreeTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleExtendType = (type: string) => {
    setSelectedExtendTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleBoundItem = (item: string) => {
    setBoundItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[800px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-8 shadow-sm">
            
            {/* 基础信息 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  方案名称 <span className="text-red-500">*</span>
                </label>
                {isView ? (
                  <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">{data?.name || '高级3年质保'}</div>
                ) : (
                  <input 
                    type="text" 
                    defaultValue={data?.name}
                    placeholder="请输入方案名称" 
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  质保类型 <span className="text-red-500">*</span>
                </label>
                {isView ? (
                  <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">{warrantyType === 'package' ? '套餐' : '产品'}</div>
                ) : (
                  <div className="flex gap-4 items-center h-[42px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="warrantyType" 
                        value="product" 
                        checked={warrantyType === 'product'} 
                        onChange={() => {
                          setWarrantyType('product');
                          setBoundItems([]);
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-sm text-slate-700">产品</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="warrantyType" 
                        value="package" 
                        checked={warrantyType === 'package'} 
                        onChange={() => {
                          setWarrantyType('package');
                          setBoundItems([]);
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-sm text-slate-700">套餐</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  适用{warrantyType === 'package' ? '套餐' : '产品'}
                </label>
                {isView ? (
                  <div className="flex gap-2 flex-wrap">
                    {boundItems.length > 0 ? boundItems.map(item => (
                      <span key={item} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">{item}</span>
                    )) : (
                      <span className="text-sm text-slate-500">未绑定任何{warrantyType === 'package' ? '套餐' : '产品'}</span>
                    )}
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-left min-h-[42px]"
                    >
                      <div className="font-normal text-slate-700 truncate pr-4">
                        {boundItems.length > 0 
                          ? boundItems.join(', ')
                          : `请选择适用${warrantyType === 'package' ? '套餐' : '产品'}`}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-1">
                          {(warrantyType === 'package' ? MOCK_PACKAGES : MOCK_PRODUCTS).map(item => {
                            const isSelected = boundItems.includes(item);
                            return (
                              <div
                                key={item}
                                onClick={() => toggleBoundItem(item)}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                              >
                                <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>
                                <span className="text-sm">{item}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 首次购买设置 */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-3.5 bg-blue-600 rounded-full"></div>
                首次购买设置
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-slate-600 mb-2">是否赠送质保</label>
                  {isView ? (
                    <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {giveFreeWarranty ? (data?.firstBuyDetails?.freeYears || '3年') : '不赠送'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-4 items-center h-[42px]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="giveFreeWarranty" 
                            checked={giveFreeWarranty} 
                            onChange={() => setGiveFreeWarranty(true)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <span className="text-sm text-slate-700">赠送</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="giveFreeWarranty" 
                            checked={!giveFreeWarranty} 
                            onChange={() => setGiveFreeWarranty(false)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <span className="text-sm text-slate-700">不赠送</span>
                        </label>
                      </div>
                      {giveFreeWarranty && (
                        <select defaultValue={data?.firstBuyDetails?.freeYears || '3年'} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                          <option>1年</option>
                          <option>2年</option>
                          <option>3年</option>
                          <option>5年</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-2">加购质保价格 (元/年)</label>
                  {isView ? (
                    <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">{data?.firstBuyDetails?.addPrice || '-'}</div>
                  ) : (
                    <input 
                      type="text" 
                      defaultValue={data?.firstBuyDetails?.addPrice}
                      placeholder="例如: 50" 
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 监控服务配置 */}
            {warrantyType === 'package' && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-blue-600 rounded-full"></div>
                  监控服务配置
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-600 mb-2">免费车辆类型</label>
                    {isView ? (
                      <div className="flex gap-2 flex-wrap">
                        {selectedFreeTypes.map(type => (
                          <span key={type} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">{type}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-4 flex-wrap mt-2">
                        {VEHICLE_TYPES.map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedFreeTypes.includes(type)}
                              onChange={() => toggleFreeType(type)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                            />
                            <span className="text-sm text-slate-700">{type}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-2">收费价格 (元/年)</label>
                    {isView ? (
                      <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">{data?.monitorServiceDetails?.price || '-'}</div>
                    ) : (
                      <input 
                        type="text" 
                        defaultValue={data?.monitorServiceDetails?.price}
                        placeholder="例如: 100" 
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-600 mb-2">续费优惠价格 (元/年)</label>
                    {isView ? (
                      <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {monitorBindPackage ? '跟套餐服务有效期绑定，' : '不跟套餐服务有效期绑定，'}{data?.monitorServiceDetails?.renewPrice || '-'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={monitorBindPackage}
                            onChange={(e) => setMonitorBindPackage(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-slate-700">跟套餐服务有效期绑定</span>
                        </label>
                        <input 
                          type="text" 
                          defaultValue={data?.monitorServiceDetails?.renewPrice}
                          placeholder="例如: 100 - 300" 
                          className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 延保配置 */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-3.5 bg-blue-600 rounded-full"></div>
                延保配置
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-600 mb-2">支持延保车辆类型</label>
                  {isView ? (
                    <div className="flex gap-2 flex-wrap">
                      {selectedExtendTypes.map(type => (
                        <span key={type} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">{type}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-4 flex-wrap mt-2">
                        {VEHICLE_TYPES.map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedExtendTypes.includes(type)}
                              onChange={() => toggleExtendType(type)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                            />
                            <span className="text-sm text-slate-700">{type}</span>
                          </label>
                        ))}
                      </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-2">延保价格 (元/年)</label>
                  {isView ? (
                    <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {data?.extendedWarrantyDetails?.price || '-'} {warrantyType === 'package' && (extendBindPackage ? '(跟套餐服务有效期绑定)' : '(不跟套餐服务有效期绑定)')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {warrantyType === 'package' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={extendBindPackage}
                            onChange={(e) => setExtendBindPackage(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-slate-700">跟套餐服务有效期绑定</span>
                        </label>
                      )}
                      <input 
                        type="text" 
                        defaultValue={data?.extendedWarrantyDetails?.price}
                        placeholder="例如: 50" 
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        {!isView && (
          <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
            >
              保存方案
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
