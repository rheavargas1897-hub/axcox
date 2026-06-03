import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

const INITIAL_FIELDS = [
  { id: '1', name: '车辆类型', code: 'VEHICLE_TYPE', remark: '' },
  { id: '2', name: '安装部位', code: 'INSTALL_PART', remark: '' },
  { id: '3', name: '设备类型', code: 'DEVICE_TYPE', remark: '' }
];

const INITIAL_OPTIONS: Record<string, any[]> = {
  '1': [
    { id: 'o1', name: '客运车辆', code: 'PASSENGER', sort: 1, status: 'active', isReferenced: true, remark: '' },
    { id: 'o2', name: '货运车辆', code: 'FREIGHT', sort: 2, status: 'active', isReferenced: true, remark: '' },
    { id: 'o3', name: '泥头车', code: 'DUMP_TRUCK', sort: 3, status: 'active', isReferenced: false, remark: '' },
    { id: 'o4', name: '渣土车', code: 'MUCK_TRUCK', sort: 4, status: 'deactivated', isReferenced: true, remark: '' }
  ],
  '2': [
    { id: 'p1', name: '前方摄像头', code: 'FRONT_CAM', sort: 1, status: 'active', isReferenced: false, remark: '' },
    { id: 'p2', name: '盲区摄像头', code: 'BLIND_CAM', sort: 2, status: 'active', isReferenced: false, remark: '' },
    { id: 'p3', name: '倒车摄像头', code: 'REAR_CAM', sort: 3, status: 'active', isReferenced: false, remark: '' },
    { id: 'p4', name: '驾驶员监控', code: 'DMS', sort: 4, status: 'active', isReferenced: false, remark: '' },
    { id: 'p5', name: 'ADAS 探头', code: 'ADAS', sort: 5, status: 'active', isReferenced: false, remark: '' },
    { id: 'p6', name: '车厢监控', code: 'CABIN_CAM', sort: 6, status: 'active', isReferenced: false, remark: '' },
    { id: 'p7', name: '北斗定位', code: 'BEIDOU', sort: 7, status: 'active', isReferenced: false, remark: '' }
  ]
};

export { INITIAL_FIELDS, INITIAL_OPTIONS };

export default function DictionaryConfig() {
  const [optionsMap, setOptionsMap] = useState<Record<string, any[]>>(INITIAL_OPTIONS);
  
  const [selectedFieldId, setSelectedFieldId] = useState<string>('1');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Option editing state
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingOptionData, setEditingOptionData] = useState<any>(null);
  const [isAddingOption, setIsAddingOption] = useState(false);

  const filteredFields = INITIAL_FIELDS.filter(f => f.name.includes(searchKeyword) || f.code.includes(searchKeyword));
  const currentOptions = optionsMap[selectedFieldId] || [];

  // Option actions
  const handleStartAddOption = () => {
    if (!selectedFieldId) return;
    setIsAddingOption(true);
    setEditingOptionData({ name: '', sort: 1, status: 'active', isReferenced: false, remark: '' });
  };

  const handleSaveNewOption = () => {
    if (!editingOptionData.name) {
      alert('选项名称不能为空');
      return;
    }
    const newId = Math.random().toString(36).substr(2, 9);
    const newOption = { id: newId, code: `OPT_${newId.toUpperCase()}`, ...editingOptionData };
    const updatedOptions = [newOption, ...currentOptions].map((opt, i) => ({ ...opt, sort: i + 1 }));
    setOptionsMap({ ...optionsMap, [selectedFieldId]: updatedOptions });
    setIsAddingOption(false);
  };

  const handleStartEditOption = (option: any) => {
    setEditingOptionId(option.id);
    setEditingOptionData({ ...option });
  };

  const handleSaveEditOption = () => {
    if (!editingOptionData.name) {
      alert('选项名称不能为空');
      return;
    }
    const updatedOptions = currentOptions.map(o => o.id === editingOptionData.id ? editingOptionData : o);
    setOptionsMap({ ...optionsMap, [selectedFieldId]: updatedOptions });
    setEditingOptionId(null);
  };

  const handleDeleteOption = (id: string, name: string) => {
    if (window.confirm(`确定要删除选项【${name}】吗？`)) {
      const updatedOptions = currentOptions.filter(o => o.id !== id).map((opt, i) => ({ ...opt, sort: i + 1 }));
      setOptionsMap({ ...optionsMap, [selectedFieldId]: updatedOptions });
    }
  };

  const handleToggleOptionStatus = (id: string) => {
    const updatedOptions = currentOptions.map(o => o.id === id ? { ...o, status: o.status === 'active' ? 'deactivated' : 'active' } : o);
    setOptionsMap({ ...optionsMap, [selectedFieldId]: updatedOptions });
  };

  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...currentOptions];
    if (direction === 'up' && index > 0) {
      [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    } else if (direction === 'down' && index < newOptions.length - 1) {
      [newOptions[index + 1], newOptions[index]] = [newOptions[index], newOptions[index + 1]];
    }
    
    // Update sort numbers
    const finalOptions = newOptions.map((opt, i) => ({ ...opt, sort: i + 1 }));
    setOptionsMap({ ...optionsMap, [selectedFieldId]: finalOptions });
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newOptions = [...currentOptions];
    const draggedItem = newOptions[draggedIndex];
    newOptions.splice(draggedIndex, 1);
    newOptions.splice(index, 0, draggedItem);
    
    // Update sort numbers
    const finalOptions = newOptions.map((opt, i) => ({ ...opt, sort: i + 1 }));
    setOptionsMap({ ...optionsMap, [selectedFieldId]: finalOptions });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="flex h-full gap-6 max-w-[1600px] mx-auto absolute inset-6">
      {/* Left Column: Fields */}
      <div className="w-[400px] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">字段名称</h2>
            <p className="text-xs text-slate-500 mt-1">全局基础配置字典</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="搜索字段名称或编码" 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredFields.map(field => (
            <div key={field.id}>
              <div 
                onClick={() => setSelectedFieldId(field.id)}
                className={`p-4 mb-2 rounded-xl cursor-pointer border transition-all duration-200 group relative ${
                  selectedFieldId === field.id 
                    ? 'border-blue-200 bg-blue-50/50 shadow-sm shadow-blue-100/50' 
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className={`font-medium mb-1 ${selectedFieldId === field.id ? 'text-blue-700' : 'text-slate-800'}`}>
                      {field.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100 inline-block">
                      {field.code}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredFields.length === 0 && (
             <div className="text-center py-10 text-sm text-slate-400">未找到相关字段</div>
          )}
        </div>
      </div>

      {/* Right Column: Options */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {selectedFieldId ? (
          <>
            <div className="h-[73px] px-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-3">
                  选项内容配置
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                    {INITIAL_FIELDS.find(f => f.id === selectedFieldId)?.name}
                  </span>
                </h2>
              </div>
              <button 
                onClick={handleStartAddOption}
                disabled={isAddingOption}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> 新增选项
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-medium w-20 text-center">排序</th>
                      <th className="px-6 py-4 font-medium w-24">状态</th>
                      <th className="px-6 py-4 font-medium">选项名称</th>
                      <th className="px-6 py-4 font-medium w-1/3">备注</th>
                      <th className="px-6 py-4 font-medium text-right w-32">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isAddingOption && (
                      <tr className="bg-blue-50/30 animate-in fade-in duration-200">
                        <td className="px-6 py-4 text-center">
                          <span className="text-slate-400 bg-white px-2 py-0.5 rounded text-xs border border-slate-200">1</span>
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status="active" />
                        </td>
                        <td className="px-6 py-3">
                          <input 
                            type="text" 
                            value={editingOptionData.name}
                            onChange={e => setEditingOptionData({...editingOptionData, name: e.target.value})}
                            placeholder="选项名称" 
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                            autoFocus
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input 
                            type="text" 
                            value={editingOptionData.remark}
                            onChange={e => setEditingOptionData({...editingOptionData, remark: e.target.value})}
                            placeholder="备注（可选）" 
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={handleSaveNewOption} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setIsAddingOption(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"><X className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {currentOptions.map((opt, index) => (
                      <React.Fragment key={opt.id}>
                        {editingOptionId === opt.id ? (
                          <tr className="bg-blue-50/10 shadow-[inset_0_0_0_1px_#bfdbfe] relative z-10">
                            <td className="px-6 py-4 text-center">
                              <span className="text-slate-500 font-medium">{opt.sort}</span>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={opt.status} />
                            </td>
                            <td className="px-6 py-3">
                              <input 
                                type="text" 
                                value={editingOptionData.name}
                                onChange={e => setEditingOptionData({...editingOptionData, name: e.target.value})}
                                placeholder="选项名称" 
                                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="px-6 py-3">
                              <input 
                                type="text" 
                                value={editingOptionData.remark}
                                onChange={e => setEditingOptionData({...editingOptionData, remark: e.target.value})}
                                placeholder="备注" 
                                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={handleSaveEditOption} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditingOptionId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"><X className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr 
                            className={`hover:bg-slate-50 transition-colors group cursor-move ${draggedIndex === index ? 'opacity-50 bg-slate-100' : ''}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                          >
                            <td className="px-6 py-4 text-center">
                              <span className="text-slate-500 font-medium">{opt.sort}</span>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={opt.status} />
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-800">{opt.name}</td>
                            <td className="px-6 py-4 text-slate-500">{opt.remark || '-'}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleToggleOptionStatus(opt.id)}
                                  className="text-slate-600 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors mr-1"
                                >
                                  {opt.status === 'active' ? '停用' : '启用'}
                                </button>
                                <button 
                                  onClick={() => handleMoveOption(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="上移"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleMoveOption(index, 'down')}
                                  disabled={index === currentOptions.length - 1}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="下移"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-[1px] h-4 bg-slate-200 mx-0.5"></div>
                                <button 
                                  onClick={() => handleStartEditOption(opt)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="编辑"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {opt.isReferenced ? (
                                  <button 
                                    disabled
                                    title="已被引用，不可删除"
                                    className="p-1.5 text-slate-300 rounded cursor-not-allowed"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleDeleteOption(opt.id, opt.name)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                    title="删除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {currentOptions.length === 0 && !isAddingOption && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="text-slate-400 text-sm">该字段下暂无选项内容</div>
                          <button onClick={handleStartAddOption} className="mt-3 text-blue-600 text-sm hover:underline">立即添加</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm bg-slate-50/50">
            请在左侧选择一个字段以查看其选项内容
          </div>
        )}
      </div>
    </div>
  );
}
