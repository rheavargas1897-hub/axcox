export type Status = '可用' | '占用' | '冻结' | '在途' | '已出库' | '待维修' | '维修中' | '待回收' | '已借出';

export type Equipment = {
  id: string;
  sn: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productType: string;
  productName: string;
  productBrand: string;
  productModel: string;
  status: Status;
  inboundTime: string;
  outboundTime?: string;
  lastOperationTime: string;
  ownership: string;
  purchaseCost: number;
  equipmentType: '新' | '旧';
  source: string;
};

export type ProductAggregated = {
  id: string;
  type: string;
  name: string;
  brand: string;
  model: string;
  total: number;
  available: number;
  occupied: number;
  frozen: number;
  inTransit: number;
  pendingRepair: number;
  repairing: number;
  pendingRecycle: number;
  borrowed: number;
  inbound: number;
  outbound: number;
  warning: string;
  equipments: Equipment[];
};

export type WarehouseAggregated = {
  id: string;
  name: string;
  total: number;
  available: number;
  occupied: number;
  frozen: number;
  inTransit: number;
  pendingRepair: number;
  repairing: number;
  pendingRecycle: number;
  borrowed: number;
  inbound: number;
  outbound: number;
  products: ProductAggregated[];
};
