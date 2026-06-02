import React from 'react';

const MOCK_LOGS = [
  {
    id: 1,
    time: '2023-11-01 10:00:00',
    operator: '系统管理员',
    type: '新增',
    details: '创建方案'
  },
  {
    id: 2,
    time: '2023-11-02 14:20:00',
    operator: '张三',
    type: '编辑',
    details: '提成规则金额: ¥50.00 → ¥60.00'
  },
  {
    id: 3,
    time: '2023-11-03 09:15:00',
    operator: '李四',
    type: '关联套餐',
    details: '关联套餐: 基础安全套餐'
  },
  {
    id: 4,
    time: '2023-11-04 11:30:00',
    operator: '王五',
    type: '禁用',
    details: '状态: 启用 → 禁用'
  }
];

export function OperationLog() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-8">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
        <span className="w-1 h-3.5 bg-blue-500 rounded-full"></span>
        操作日志
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#f4f5f7] border-b border-slate-200 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-medium w-48">操作时间</th>
              <th className="px-4 py-3 font-medium w-32">操作人</th>
              <th className="px-4 py-3 font-medium w-32">操作类型</th>
              <th className="px-4 py-3 font-medium">操作详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.time}</td>
                <td className="px-4 py-3 text-slate-900">{log.operator}</td>
                <td className="px-4 py-3 text-slate-700">{log.type}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-pre-line leading-relaxed">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
