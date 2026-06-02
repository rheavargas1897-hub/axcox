import React from 'react';
import { CheckCircle2, Clock, Archive, AlertCircle, FileEdit, MinusCircle } from 'lucide-react';

export const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { style: string, label: string, icon: React.ElementType }> = {
    active: { style: 'bg-green-100 text-green-700 border-green-200', label: '当前生效', icon: CheckCircle2 },
    draft: { style: 'bg-slate-100 text-slate-700 border-slate-200', label: '草稿', icon: FileEdit },
    deactivated: { style: 'bg-red-100 text-red-700 border-red-200', label: '已停用', icon: MinusCircle },
    pending: { style: 'bg-blue-100 text-blue-700 border-blue-200', label: '未生效', icon: Clock },
    expired: { style: 'bg-orange-100 text-orange-700 border-orange-200', label: '已过期', icon: Archive },
  };

  const currentConfig = config[status] || { style: 'bg-slate-100 text-slate-700 border-slate-200', label: status, icon: AlertCircle };
  const Icon = currentConfig.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${currentConfig.style}`}>
      <Icon className="w-3.5 h-3.5" />
      {currentConfig.label}
    </span>
  );
};
