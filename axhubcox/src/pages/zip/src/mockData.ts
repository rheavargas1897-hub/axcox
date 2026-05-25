import { Equipment, Status } from './types';

export const MOCK_WAREHOUSES = [
  { id: 'w1', name: '北京中心仓' },
  { id: 'w2', name: '上海分拨仓' },
  { id: 'w3', name: '广州枢纽仓' },
];

const MOCK_PRODUCTS = [
  { id: 'p1', type: 'SIM卡', name: '物联卡', brand: '云凡', model: '30M' },
  { id: 'p2', type: '定位器', name: 'GPS终端', brand: '途强', model: 'GT08' },
  { id: 'p3', type: '摄像头', name: '车载监控', brand: '海康', model: 'C6' },
  { id: 'p4', type: '记录仪', name: '行车记录仪', brand: '盯盯拍', model: 'Mini5' },
];

const STATUSES: Status[] = ['可用', '占用', '冻结', '在途', '已出库', '待维修', '维修中', '待回收', '已借出'];
const SOURCES = ['集中采购', '调拨入库', '捐赠', '租赁'];

export const generateEquipments = (): Equipment[] => {
  const eqs: Equipment[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  for (let i = 1; i <= 200; i++) {
    const w = MOCK_WAREHOUSES[Math.floor(Math.random() * MOCK_WAREHOUSES.length)];
    const p = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    
    // Randomize dates to be either current month or previous months
    const isCurrentMonthInbound = Math.random() > 0.5;
    const inboundMonth = isCurrentMonthInbound ? currentMonth : Math.max(1, currentMonth - Math.floor(Math.random() * 3) - 1);
    const inboundDay = Math.floor(Math.random() * 28) + 1;
    const inboundTime = `${currentYear}-${String(inboundMonth).padStart(2, '0')}-${String(inboundDay).padStart(2, '0')}`;
    
    let outboundTime = undefined;
    if (status === '已出库') {
      const isCurrentMonthOutbound = Math.random() > 0.3;
      const outboundMonth = isCurrentMonthOutbound ? currentMonth : inboundMonth;
      const outboundDay = Math.min(28, inboundDay + Math.floor(Math.random() * 10));
      outboundTime = `${currentYear}-${String(outboundMonth).padStart(2, '0')}-${String(outboundDay).padStart(2, '0')}`;
    }
    
    const needsOwnership = ['占用', '已出库', '已借出'].includes(status);
    const ownership = needsOwnership ? `粤B·${Math.floor(Math.random() * 90000) + 10000}` : '';
    const lastOperationTime = outboundTime ? outboundTime : inboundTime;
    
    eqs.push({
      id: `eq-${i}`,
      sn: `SN${Math.random().toString().slice(2, 10)}`,
      warehouseId: w.id,
      warehouseName: w.name,
      productId: p.id,
      productType: p.type,
      productName: p.name,
      productBrand: p.brand,
      productModel: p.model,
      status,
      inboundTime,
      outboundTime,
      lastOperationTime,
      ownership,
      purchaseCost: Math.floor(Math.random() * 5000) + 100,
      equipmentType: Math.random() > 0.7 ? '旧' : '新',
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    });
  }
  return eqs;
};

export const allEquipments = generateEquipments();
