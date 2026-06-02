import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const VEHICLES = ['客运车', '货运车', '冷藏车', '渣土车', '乘用车', '出租车', '网约车', '工程车', '其他车型'];

type WarrantyFormProps = {
  value: any;
  onChange?: (val: any) => void;
  readOnly?: boolean;
  type?: 'package' | 'product';
};

const defaultFirstBuyConfigs = [
  { vehicle: '客运车', giveFree: true, supportAdd: false, addFee: '' },
  { vehicle: '货运车', giveFree: false, supportAdd: true, addFee: '300' },
];

const defaultMonitorConfigs = [
  {
    vehicle: '客运车',
    serviceType: 'paid',
    monitorFee: '',
    renewalFee: '150',
    linkedToPackageYears: true,
  },
  {
    vehicle: '货运车',
    serviceType: 'paid',
    monitorFee: '',
    renewalFee: '200',
    linkedToPackageYears: false,
  },
];

const defaultExtendConfigs = [
  {
    vehicle: '客运车',
    supportExtend: true,
    fixedExtendFee: '800',
    renewDiscountPrice: '650',
    linkedToPackageYears: true,
  },
  {
    vehicle: '货运车',
    supportExtend: true,
    fixedExtendFee: '1000',
    renewDiscountPrice: '',
    linkedToPackageYears: false,
  },
];

export default function WarrantyForm({ value, onChange, readOnly = false, type = 'package' }: WarrantyFormProps) {
  const [firstBuyConfigs, setFirstBuyConfigs] = useState(value?.firstBuyConfigs || defaultFirstBuyConfigs);
  const [monitorVehicleConfigs, setMonitorVehicleConfigs] = useState(
    value?.monitorVehicleConfigs || defaultMonitorConfigs,
  );
  const [extendVehicleConfigs, setExtendVehicleConfigs] = useState(
    value?.extendVehicleConfigs || defaultExtendConfigs,
  );

  const emitChange = (next: Record<string, any>) => {
    onChange?.({
      firstBuyConfigs,
      monitorVehicleConfigs,
      extendVehicleConfigs,
      ...next,
    });
  };

  const updateFirstBuyConfigs = (next: any[]) => {
    if (readOnly) return;
    setFirstBuyConfigs(next);
    emitChange({ firstBuyConfigs: next });
  };

  const updateMonitorRows = (next: any[]) => {
    if (readOnly) return;
    setMonitorVehicleConfigs(next);
    emitChange({ monitorVehicleConfigs: next });
  };

  const updateExtendRows = (next: any[]) => {
    if (readOnly) return;
    setExtendVehicleConfigs(next);
    emitChange({ extendVehicleConfigs: next });
  };

  const updateFirstBuyConfig = (index: number, field: string, nextValue: any) => {
    const next = firstBuyConfigs.map((item: any, itemIndex: number) =>
      itemIndex === index ? { ...item, [field]: nextValue } : item,
    );
    updateFirstBuyConfigs(next);
  };

  const addFirstBuyConfig = () => {
    const nextVehicle = VEHICLES.find((vehicle) => !firstBuyConfigs.some((item: any) => item.vehicle === vehicle));
    updateFirstBuyConfigs([
      ...firstBuyConfigs,
      { vehicle: nextVehicle || '其他车型', giveFree: true, supportAdd: false, addFee: '' },
    ]);
  };

  const removeFirstBuyConfig = (index: number) => {
    updateFirstBuyConfigs(firstBuyConfigs.filter((_: any, itemIndex: number) => itemIndex !== index));
  };

  const updateMonitorRow = (index: number, field: string, nextValue: any) => {
    const next = monitorVehicleConfigs.map((item: any, itemIndex: number) =>
      itemIndex === index ? { ...item, [field]: nextValue } : item,
    );
    updateMonitorRows(next);
  };

  const updateExtendRow = (index: number, field: string, nextValue: any) => {
    const next = extendVehicleConfigs.map((item: any, itemIndex: number) =>
      itemIndex === index
        ? {
            ...item,
            [field]: nextValue,
            ...(field === 'supportExtend' && !nextValue ? { fixedExtendFee: '', renewDiscountPrice: '' } : {}),
          }
        : item,
    );
    updateExtendRows(next);
  };

  const addMonitorRow = () => {
    const nextVehicle = VEHICLES.find((vehicle) => !monitorVehicleConfigs.some((item: any) => item.vehicle === vehicle));
    updateMonitorRows([
      ...monitorVehicleConfigs,
      {
        vehicle: nextVehicle || '其他车型',
        serviceType: 'free',
        monitorFee: '',
        renewalFee: '',
        linkedToPackageYears: false,
      },
    ]);
  };

  const addExtendRow = () => {
    const nextVehicle = VEHICLES.find((vehicle) => !extendVehicleConfigs.some((item: any) => item.vehicle === vehicle));
    updateExtendRows([
      ...extendVehicleConfigs,
      {
        vehicle: nextVehicle || '其他车型',
        supportExtend: true,
        fixedExtendFee: '',
        renewDiscountPrice: '',
        linkedToPackageYears: false,
      },
    ]);
  };

  const fieldClass =
    'w-full h-9 px-3 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500';

  const NumberField = ({
    value: fieldValue,
    onValueChange,
    placeholder = '金额',
    disabled = false,
    unit = '元/年',
  }: {
    value: string;
    onValueChange: (nextValue: string) => void;
    placeholder?: string;
    disabled?: boolean;
    unit?: string;
  }) => (
    <div className="flex items-center gap-2">
      <input
        type="number"
        placeholder={placeholder}
        value={fieldValue || ''}
        disabled={readOnly || disabled}
        onChange={(event) => onValueChange(event.target.value)}
        className={fieldClass}
      />
      <span className="text-xs text-slate-500 whitespace-nowrap">{unit}</span>
    </div>
  );

  const renderRenewDiscountPrice = (item: any, index: number) => {
    const disabled = !item.supportExtend;
    const fixed = Number(item.fixedExtendFee || 0);
    const discount = item.renewDiscountPrice === '' || item.renewDiscountPrice == null ? null : Number(item.renewDiscountPrice);
    const invalid = !disabled && discount !== null && discount > fixed;

    if (readOnly) {
      if (disabled || discount === null || Number.isNaN(discount)) return <span className="text-slate-400">—</span>;
      if (discount === 0) return <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-600">免费</span>;
      return <span className="font-medium text-[#52C41A]">¥{discount}</span>;
    }

    return (
      <div className="flex items-center gap-2" title={invalid ? '优惠价不应高于原价' : ''}>
        <input
          type="number"
          min={0}
          placeholder="优惠价（选填）"
          value={item.renewDiscountPrice ?? ''}
          disabled={disabled}
          onChange={(event) => updateExtendRow(index, 'renewDiscountPrice', event.target.value)}
          className={`${fieldClass} ${invalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        />
        <span className="text-xs text-slate-500 whitespace-nowrap">元</span>
        {discount === 0 && !disabled && <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-600">免费</span>}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
          <span>模块一：首次购买设置</span>
          {!readOnly && (
            <button
              type="button"
              onClick={addFirstBuyConfig}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 bg-blue-50 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> 添加车型
            </button>
          )}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          从系统车型列表中选择车型，每个车型独立配置是否赠送质保；不赠送时可继续配置是否支持加购及加购费用。
        </p>

        <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium w-40">车型</th>
                <th className="px-4 py-3 font-medium w-36">是否赠送质保</th>
                <th className="px-4 py-3 font-medium w-36">是否支持加购</th>
                <th className="px-4 py-3 font-medium w-44">加购费用</th>
                {!readOnly && <th className="px-4 py-3 font-medium w-20 text-right">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {firstBuyConfigs.map((item: any, index: number) => (
                <tr key={`${item.vehicle}-${index}`} className="hover:bg-blue-50/30">
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="font-medium text-slate-800">{item.vehicle}</span>
                    ) : (
                      <select
                        value={item.vehicle}
                        onChange={(event) => updateFirstBuyConfig(index, 'vehicle', event.target.value)}
                        className={fieldClass}
                      >
                        {VEHICLES.map((vehicle) => (
                          <option key={vehicle} value={vehicle}>
                            {vehicle}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.giveFree ? 'yes' : 'no'}
                      disabled={readOnly}
                      onChange={(event) => updateFirstBuyConfig(index, 'giveFree', event.target.value === 'yes')}
                      className={fieldClass}
                    >
                      <option value="yes">是</option>
                      <option value="no">否</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {!item.giveFree ? (
                      <select
                        value={item.supportAdd ? 'yes' : 'no'}
                        disabled={readOnly}
                        onChange={(event) => updateFirstBuyConfig(index, 'supportAdd', event.target.value === 'yes')}
                        className={fieldClass}
                      >
                        <option value="yes">是</option>
                        <option value="no">否</option>
                      </select>
                    ) : (
                      <span className="text-slate-400">赠送质保无需加购</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!item.giveFree && item.supportAdd ? (
                      <NumberField
                        value={item.addFee}
                        onValueChange={(nextValue) => updateFirstBuyConfig(index, 'addFee', nextValue)}
                      />
                    ) : (
                      <span className="text-slate-400">{item.giveFree ? '不适用' : '不支持加购'}</span>
                    )}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeFirstBuyConfig(index)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {type === 'package' && (
        <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
            <span>模块二：监控服务配置（仅套餐质保）</span>
            {!readOnly && (
              <button
                type="button"
                onClick={addMonitorRow}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 bg-blue-50 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> 添加车型
              </button>
            )}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            每个车型独立配置监控服务类型、监控费用、续费年费价格和是否与套餐服务年限挂钩；挂钩后套餐服务年限到期不允许继续续费监控服务。
          </p>

          <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm min-w-[980px]">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium w-40">车型</th>
                  <th className="px-4 py-3 font-medium w-36">监控服务类型</th>
                  <th className="px-4 py-3 font-medium w-44">监控费用</th>
                  <th className="px-4 py-3 font-medium w-44">续费年费价格</th>
                  <th className="px-4 py-3 font-medium w-40">与套餐年限挂钩</th>
                  {!readOnly && <th className="px-4 py-3 font-medium w-20 text-right">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monitorVehicleConfigs.map((item: any, index: number) => (
                  <tr key={`${item.vehicle}-${index}`} className="hover:bg-blue-50/30">
                    <td className="px-4 py-3">
                      {readOnly ? (
                        <span className="font-medium text-slate-800">{item.vehicle}</span>
                      ) : (
                        <select
                          value={item.vehicle}
                          onChange={(event) => updateMonitorRow(index, 'vehicle', event.target.value)}
                          className={fieldClass}
                        >
                          {VEHICLES.map((vehicle) => (
                            <option key={vehicle} value={vehicle}>
                              {vehicle}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.serviceType}
                        disabled={readOnly}
                        onChange={(event) => updateMonitorRow(index, 'serviceType', event.target.value)}
                        className={fieldClass}
                      >
                        <option value="free">免费</option>
                        <option value="paid">收费</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {item.serviceType === 'paid' ? (
                        <NumberField
                          value={item.monitorFee}
                          onValueChange={(nextValue) => updateMonitorRow(index, 'monitorFee', nextValue)}
                        />
                      ) : (
                        <span className="text-slate-400">免费无需填写</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <NumberField
                        value={item.renewalFee}
                        onValueChange={(nextValue) => updateMonitorRow(index, 'renewalFee', nextValue)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.linkedToPackageYears ? 'yes' : 'no'}
                        disabled={readOnly}
                        onChange={(event) => updateMonitorRow(index, 'linkedToPackageYears', event.target.value === 'yes')}
                        className={fieldClass}
                      >
                        <option value="yes">是</option>
                        <option value="no">否</option>
                      </select>
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            updateMonitorRows(monitorVehicleConfigs.filter((_: any, itemIndex: number) => itemIndex !== index))
                          }
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
          <span>模块三：延保配置</span>
          {!readOnly && (
            <button
              type="button"
              onClick={addExtendRow}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 bg-blue-50 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> 添加车型
            </button>
          )}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          从系统车型列表中选择车型，每个车型独立配置是否支持延保、固定延保费用、同套餐续费优惠价
          {type === 'package' ? '，以及是否与套餐服务年限挂钩。' : '。'}
        </p>

        <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
          <table className="w-full text-left text-sm min-w-[1060px]">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium w-40">车型</th>
                <th className="px-4 py-3 font-medium w-36">是否支持延保</th>
                <th className="px-4 py-3 font-medium w-44">固定延保费用</th>
                <th className="px-4 py-3 font-medium w-52">同套餐续费优惠价</th>
                {type === 'package' && <th className="px-4 py-3 font-medium w-40">与套餐年限挂钩</th>}
                {!readOnly && <th className="px-4 py-3 font-medium w-20 text-right">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {extendVehicleConfigs.map((item: any, index: number) => (
                <tr key={`${item.vehicle}-${index}`} className="hover:bg-blue-50/30">
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="font-medium text-slate-800">{item.vehicle}</span>
                    ) : (
                      <select
                        value={item.vehicle}
                        onChange={(event) => updateExtendRow(index, 'vehicle', event.target.value)}
                        className={fieldClass}
                      >
                        {VEHICLES.map((vehicle) => (
                          <option key={vehicle} value={vehicle}>
                            {vehicle}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.supportExtend ? 'yes' : 'no'}
                      disabled={readOnly}
                      onChange={(event) => updateExtendRow(index, 'supportExtend', event.target.value === 'yes')}
                      className={fieldClass}
                    >
                      <option value="yes">是</option>
                      <option value="no">否</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {item.supportExtend ? (
                      <NumberField
                        value={item.fixedExtendFee}
                        onValueChange={(nextValue) => updateExtendRow(index, 'fixedExtendFee', nextValue)}
                        unit="元"
                      />
                    ) : (
                      <span className="text-slate-400">不支持</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {renderRenewDiscountPrice(item, index)}
                  </td>
                  {type === 'package' && (
                    <td className="px-4 py-3">
                      {item.supportExtend ? (
                        <select
                          value={item.linkedToPackageYears ? 'yes' : 'no'}
                          disabled={readOnly}
                          onChange={(event) => updateExtendRow(index, 'linkedToPackageYears', event.target.value === 'yes')}
                          className={fieldClass}
                        >
                          <option value="yes">是</option>
                          <option value="no">否</option>
                        </select>
                      ) : (
                        <span className="text-slate-400">不适用</span>
                      )}
                    </td>
                  )}
                  {!readOnly && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          updateExtendRows(extendVehicleConfigs.filter((_: any, itemIndex: number) => itemIndex !== index))
                        }
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
