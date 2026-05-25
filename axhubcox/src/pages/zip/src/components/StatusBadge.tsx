import React from 'react';
import { Status } from '../types';

export const StatusBadge = ({ status }: { status: Status }) => {
  const styles = {
    '可用': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    '占用': 'bg-blue-100 text-blue-700 border-blue-200',
    '冻结': 'bg-rose-100 text-rose-700 border-rose-200',
    '在途': 'bg-amber-100 text-amber-700 border-amber-200',
    '已出库': 'bg-slate-100 text-slate-700 border-slate-200',
    '待维修': 'bg-orange-100 text-orange-700 border-orange-200',
    '维修中': 'bg-purple-100 text-purple-700 border-purple-200',
    '待回收': 'bg-pink-100 text-pink-700 border-pink-200',
    '已借出': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};
