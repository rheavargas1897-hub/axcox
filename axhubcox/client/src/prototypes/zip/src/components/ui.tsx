import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    '草稿': 'bg-slate-100 text-slate-600 border-slate-200',
    '待审核': 'bg-orange-50 text-orange-600 border-orange-200',
    '已驳回': 'bg-red-50 text-red-600 border-red-200',
    '待到货': 'bg-cyan-50 text-cyan-600 border-cyan-200',
    '部分到货': 'bg-amber-50 text-amber-600 border-amber-200',
    '已到货': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    '待入库': 'bg-cyan-50 text-cyan-600 border-cyan-200',
    '待出库': 'bg-indigo-50 text-indigo-600 border-indigo-200',
    '待退款': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
    '已完成': 'bg-green-50 text-green-700 border-green-300',
  };
  
  const defaultStyle = 'bg-slate-100 text-slate-600 border-slate-200';
  
  return (
    <span className={cn(`px-2 py-0.5 text-xs font-medium border rounded-sm`, styles[status] || defaultStyle)}>
      {status}
    </span>
  );
};
