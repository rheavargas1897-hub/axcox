/**
 * @name 数据权限管理 - 车辆归属调整
 *
 * 参考资料：
 * - BMW 主题 DESIGN.md (src/themes/bmw/DESIGN.md)
 * - rules/prototype-development-guide.md
 * - 旭利车联网组织架构与车辆关系三态模型
 */

import './style.css';
import React, { useState, useCallback, useMemo } from 'react';

// ====== Types ======

type RelationshipType = 'direct' | 'managed' | 'authorized';

interface Vehicle {
  id: string;
  plateNumber: string;
  vin: string;
  vehicleType: string;
  relationship: RelationshipType;
  registrationCompany: string;
}

interface OrgNode {
  id: string;
  name: string;
  type: 'enterprise' | 'department' | 'fleet';
  children: OrgNode[];
  vehicles: Vehicle[];
}

// ====== Mock Data: 稳捷物流 ======

const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
  direct: '直属',
  managed: '托管',
  authorized: '授权',
};

const VEHICLE_TYPE_ORDER = ['货车', '客运车', '网约车', '校车', '危化品车', '冷链车'];

const MOCK_VEHICLES: Record<string, Vehicle[]> = {
  'fleet-1': [
    { id: 'v1', plateNumber: '粤T·A3821', vin: 'LSVAK41Z6A2123456', vehicleType: '货车', relationship: 'direct', registrationCompany: '稳捷物流' },
    { id: 'v2', plateNumber: '粤T·H7293', vin: 'LZZ5BLNF4AN123789', vehicleType: '货车', relationship: 'managed', registrationCompany: '安途物流' },
    { id: 'v3', plateNumber: '粤T·F1084', vin: 'LGAX5D652B1003456', vehicleType: '危化品车', relationship: 'direct', registrationCompany: '稳捷物流' },
    { id: 'v4', plateNumber: '粤T·C5629', vin: 'LL3BCADD6DA001234', vehicleType: '客运车', relationship: 'authorized', registrationCompany: '广州迅通' },
    { id: 'v5', plateNumber: '粤T·E3347', vin: 'LJ16AK2305C012345', vehicleType: '冷链车', relationship: 'direct', registrationCompany: '稳捷物流' },
  ],
  'fleet-2': [
    { id: 'v6', plateNumber: '粤T·G7742', vin: 'LGAX5D658C3007890', vehicleType: '网约车', relationship: 'direct', registrationCompany: '稳捷物流' },
    { id: 'v7', plateNumber: '粤T·B9105', vin: 'LSVAK41Z8B1123456', vehicleType: '校车', relationship: 'managed', registrationCompany: '安途物流' },
    { id: 'v8', plateNumber: '粤T·D4478', vin: 'LL3BCADD7EA009876', vehicleType: '货车', relationship: 'direct', registrationCompany: '稳捷物流' },
  ],
  'fleet-3': [
    { id: 'v9', plateNumber: '粤T·A6621', vin: 'LJ16AK2307D014567', vehicleType: '危化品车', relationship: 'direct', registrationCompany: '稳捷物流' },
    { id: 'v10', plateNumber: '粤T·K3358', vin: 'LZZ5BLNF5BN234567', vehicleType: '货车', relationship: 'authorized', registrationCompany: '中山通达' },
  ],
  'fleet-4': [
    { id: 'v11', plateNumber: '粤T·M8802', vin: 'LGAX5D654D4001234', vehicleType: '冷链车', relationship: 'direct', registrationCompany: '稳捷物流' },
    { id: 'v12', plateNumber: '粤T·N1574', vin: 'LL3BCADD8FB005678', vehicleType: '客运车', relationship: 'managed', registrationCompany: '安途物流' },
    { id: 'v13', plateNumber: '粤T·P4429', vin: 'LSVAK41Z3C1145678', vehicleType: '货车', relationship: 'direct', registrationCompany: '稳捷物流' },
    { id: 'v14', plateNumber: '粤T·Q7793', vin: 'LJ16AK2309E016789', vehicleType: '网约车', relationship: 'direct', registrationCompany: '稳捷物流' },
  ],
};

function buildOrgTree(): OrgNode {
  return {
    id: 'ent-1',
    name: '稳捷物流',
    type: 'enterprise',
    vehicles: [],
    children: [
      {
        id: 'dept-1',
        name: '中山运营部',
        type: 'department',
        vehicles: [],
        children: [
          { id: 'fleet-1', name: '运输一队', type: 'fleet', vehicles: MOCK_VEHICLES['fleet-1'] || [], children: [] },
          { id: 'fleet-2', name: '运输二队', type: 'fleet', vehicles: MOCK_VEHICLES['fleet-2'] || [], children: [] },
        ],
      },
      {
        id: 'dept-2',
        name: '广州运营部',
        type: 'department',
        vehicles: [],
        children: [
          { id: 'fleet-3', name: '危化品运输队', type: 'fleet', vehicles: MOCK_VEHICLES['fleet-3'] || [], children: [] },
          { id: 'fleet-4', name: '冷链运输队', type: 'fleet', vehicles: MOCK_VEHICLES['fleet-4'] || [], children: [] },
        ],
      },
      {
        id: 'dept-3',
        name: '珠海办事处',
        type: 'department',
        vehicles: [],
        children: [],
      },
    ],
  };
}

// ====== Helpers ======

function countAllVehicles(node: OrgNode): number {
  let count = node.vehicles.length;
  for (const child of node.children) {
    count += countAllVehicles(child);
  }
  return count;
}

function findNodeById(root: OrgNode, id: string): OrgNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function getNodePath(root: OrgNode, targetId: string): OrgNode[] {
  const path: OrgNode[] = [];
  function walk(node: OrgNode): boolean {
    path.push(node);
    if (node.id === targetId) return true;
    for (const child of node.children) {
      if (walk(child)) return true;
    }
    path.pop();
    return false;
  }
  walk(root);
  return path;
}

function getAllFleetNodes(root: OrgNode): OrgNode[] {
  const fleets: OrgNode[] = [];
  function walk(node: OrgNode) {
    if (node.type === 'fleet') {
      fleets.push(node);
    }
    for (const child of node.children) {
      walk(child);
    }
  }
  walk(root);
  return fleets;
}

// ====== Icons (inline SVGs to avoid dependency) ======

const IconChevronRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconChevronDown = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconTruck = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconBuilding = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="9" y1="6" x2="9" y2="6.01" />
    <line x1="15" y1="6" x2="15" y2="6.01" />
    <line x1="9" y1="10" x2="9" y2="10.01" />
    <line x1="15" y1="10" x2="15" y2="10.01" />
    <line x1="9" y1="14" x2="9" y2="14.01" />
    <line x1="15" y1="14" x2="15" y2="14.01" />
    <path d="M9 18h6v4H9z" />
  </svg>
);

const IconLayers = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
    <polyline points="2 15.5 12 22 22 15.5" />
  </svg>
);

const IconFolder = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconPlus = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconMove = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 9 2 12 5 15" />
    <polyline points="9 5 12 2 15 5" />
    <polyline points="15 19 12 22 9 19" />
    <polyline points="19 9 22 12 19 15" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
);

const IconSearch = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPackage = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" y1="22" x2="12" y2="12" />
  </svg>
);

// ====== Components ======

interface TreeNodeProps {
  node: OrgNode;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (node: OrgNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, selectedId, expandedIds, onToggle, onSelect }) => {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  const vehicleCount = countAllVehicles(node);

  const nodeIcon = node.type === 'enterprise'
    ? <IconBuilding size={16} />
    : node.type === 'department'
    ? <IconLayers size={16} />
    : <IconFolder size={14} />;

  return (
    <div>
      <div
        className={`tree-node ${isSelected ? 'selected' : ''}`}
        style={{ padding: '10px 12px 10px ' + (12 + depth * 20) + 'px', display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={() => {
          onSelect(node);
          if (hasChildren) onToggle(node.id);
        }}
      >
        {hasChildren ? (
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--bmw-muted)', flexShrink: 0 }}>
            {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
          </span>
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}
        <span style={{ display: 'flex', alignItems: 'center', color: isSelected ? 'var(--bmw-primary)' : 'var(--bmw-muted)', flexShrink: 0 }}>
          {nodeIcon}
        </span>
        <span className="tree-node-title" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        {vehicleCount > 0 && (
          <span className="count-badge">{vehicleCount}</span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface VehicleTableProps {
  vehicles: Vehicle[];
  selectedNode: OrgNode | null;
  onMoveOut: (vehicle: Vehicle) => void;
  onMoveIn: () => void;
}

const VehicleTable: React.FC<VehicleTableProps> = ({ vehicles, selectedNode, onMoveOut, onMoveIn }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return vehicles;
    const term = searchTerm.trim().toLowerCase();
    return vehicles.filter(v =>
      v.plateNumber.toLowerCase().includes(term) ||
      v.vin.toLowerCase().includes(term) ||
      v.vehicleType.includes(term) ||
      v.registrationCompany.toLowerCase().includes(term)
    );
  }, [vehicles, searchTerm]);

  if (!selectedNode) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <IconTruck size={48} />
        </div>
        <p className="empty-state-title">请选择一个车队或部门</p>
        <p className="empty-state-desc">从左侧组织树中选择节点，查看和管理其车辆归属</p>
      </div>
    );
  }

  const isFleet = selectedNode.type === 'fleet';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--bmw-hairline)',
        gap: 16,
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bmw-muted-soft)', display: 'flex' }}>
            <IconSearch size={16} />
          </span>
          <input
            className="input"
            type="text"
            placeholder="搜索车牌号、车架号、车型…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
        {isFleet && (
          <button className="btn btn-primary" onClick={onMoveIn} style={{ whiteSpace: 'nowrap' }}>
            <IconPlus size={16} />
            移入车辆
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <IconPackage size={48} />
          </div>
          <p className="empty-state-title">
            {searchTerm ? '没有匹配的车辆' : '暂无车辆'}
          </p>
          <p className="empty-state-desc">
            {searchTerm
              ? '试试其他关键词'
              : isFleet ? '点击「移入车辆」将其他车队的车辆归入此处' : '选择一个车队查看其车辆'}
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>车牌号</th>
                <th>车架号</th>
                <th>车型</th>
                <th>关系</th>
                <th>上牌公司</th>
                {isFleet && <th style={{ width: 80 }}>操作</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 700, color: 'var(--bmw-ink)' }}>{v.plateNumber}</td>
                  <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 13 }}>
                    {v.vin}
                  </td>
                  <td>{v.vehicleType}</td>
                  <td>
                    <span className={`tag-${v.relationship}`}>
                      {RELATIONSHIP_LABEL[v.relationship]}
                    </span>
                  </td>
                  <td>{v.registrationCompany}</td>
                  {isFleet && (
                    <td>
                      <button className="btn-ghost-danger" onClick={() => onMoveOut(v)}>
                        移出
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!isFleet && filtered.length > 0 && (
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--bmw-hairline)',
          fontSize: 13,
          fontWeight: 300,
          color: 'var(--bmw-muted)',
        }}>
          共 {filtered.length} 辆车，展开下方车队可调整车辆归属
        </div>
      )}
    </div>
  );
};

interface MoveVehicleModalProps {
  open: boolean;
  vehicles: Vehicle[];
  allFleets: OrgNode[];
  currentFleetId: string | null;
  onClose: () => void;
  onConfirm: (vehicleIds: string[], targetFleetId: string) => void;
}

const MoveVehicleModal: React.FC<MoveVehicleModalProps> = ({
  open,
  vehicles,
  allFleets,
  currentFleetId,
  onClose,
  onConfirm,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetFleetId, setTargetFleetId] = useState<string>('');
  const [step, setStep] = useState<'select-vehicles' | 'select-target'>('select-vehicles');

  const availableFleets = useMemo(
    () => allFleets.filter(f => f.id !== currentFleetId),
    [allFleets, currentFleetId]
  );

  const toggleVehicle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    if (selectedIds.size > 0) setStep('select-target');
  };

  const handleConfirm = () => {
    if (targetFleetId && selectedIds.size > 0) {
      onConfirm(Array.from(selectedIds), targetFleetId);
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setTargetFleetId('');
    setStep('select-vehicles');
    onClose();
  };

  if (!open) return null;

  const selectedVehicles = vehicles.filter(v => selectedIds.has(v.id));

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>移出车辆</h2>
          <button className="close-btn" onClick={handleClose}><IconX size={18} /></button>
        </div>

        <div className="modal-body">
          {step === 'select-vehicles' && (
            <>
              <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 300, color: 'var(--bmw-body)' }}>
                选择要从当前车队移出的车辆（可多选）：
              </p>
              <div style={{ border: '1px solid var(--bmw-hairline)', borderRadius: 'var(--bmw-radius)' }}>
                {vehicles.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--bmw-muted)', fontSize: 14 }}>
                    当前车队没有车辆
                  </div>
                ) : (
                  vehicles.map(v => (
                    <label
                      key={v.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', cursor: 'pointer',
                        borderBottom: '1px solid var(--bmw-hairline)',
                        fontSize: 14, fontWeight: 300,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(v.id)}
                        onChange={() => toggleVehicle(v.id)}
                        style={{ accentColor: 'var(--bmw-primary)', width: 16, height: 16 }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--bmw-ink)', minWidth: 100 }}>{v.plateNumber}</span>
                      <span style={{ color: 'var(--bmw-muted)', minWidth: 60 }}>{v.vehicleType}</span>
                      <span className={`tag-${v.relationship}`}>{RELATIONSHIP_LABEL[v.relationship]}</span>
                    </label>
                  ))
                )}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--bmw-muted)', fontWeight: 300 }}>
                已选 {selectedIds.size} 辆车
              </div>
            </>
          )}

          {step === 'select-target' && (
            <>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 300, color: 'var(--bmw-body)' }}>
                正将以下车辆移出：
              </p>
              <div style={{
                background: 'var(--bmw-surface-soft)', padding: '12px 16px',
                borderRadius: 'var(--bmw-radius)', marginBottom: 16,
                fontSize: 13, fontWeight: 700, color: 'var(--bmw-ink)',
              }}>
                {selectedVehicles.map(v => v.plateNumber).join('、')}
              </div>

              <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 300, color: 'var(--bmw-body)' }}>
                选择目标车队：
              </p>
              <div className="tree-picker">
                {availableFleets.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--bmw-muted)', fontSize: 14 }}>
                    没有可用的其他车队
                  </div>
                ) : (
                  availableFleets.map(f => {
                    const isSelected = targetFleetId === f.id;
                    return (
                      <div
                        key={f.id}
                        className={`tree-node ${isSelected ? 'selected' : ''}`}
                        style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}
                        onClick={() => setTargetFleetId(f.id)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', color: isSelected ? 'var(--bmw-primary)' : 'var(--bmw-muted)' }}>
                          <IconFolder size={14} />
                        </span>
                        <span className="tree-node-title" style={{ flex: 1 }}>{f.name}</span>
                        <span className="count-badge">{f.vehicles.length}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {step === 'select-vehicles' ? (
            <>
              <button className="btn btn-secondary" onClick={handleClose}>取消</button>
              <button className="btn btn-primary" disabled={selectedIds.size === 0} onClick={handleNext}>
                下一步
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setStep('select-vehicles')}>上一步</button>
              <button className="btn btn-primary" disabled={!targetFleetId} onClick={handleConfirm}>
                确认移入
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ====== Main Page ======

const VehiclePermissionPage: React.FC = () => {
  const [orgTree, setOrgTree] = useState<OrgNode>(buildOrgTree);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['ent-1']));
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => selectedId ? findNodeById(orgTree, selectedId) : null,
    [orgTree, selectedId]
  );

  const allFleets = useMemo(() => getAllFleetNodes(orgTree), [orgTree]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((node: OrgNode) => {
    setSelectedId(node.id);
    if (node.children.length > 0) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        next.add(node.id);
        return next;
      });
    }
  }, []);

  const handleMoveOut = useCallback((_vehicle: Vehicle) => {
    setModalOpen(true);
  }, []);

  const handleMoveIn = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleConfirmMove = useCallback((vehicleIds: string[], targetFleetId: string) => {
    setOrgTree(prev => {
      const newTree = structuredClone(prev);
      const sourceNode = selectedId ? findNodeById(newTree, selectedId) : null;
      const targetNode = findNodeById(newTree, targetFleetId);

      if (!sourceNode || !targetNode) return prev;

      const movedVehicles: Vehicle[] = [];
      sourceNode.vehicles = sourceNode.vehicles.filter(v => {
        if (vehicleIds.includes(v.id)) {
          movedVehicles.push(v);
          return false;
        }
        return true;
      });

      targetNode.vehicles = [...targetNode.vehicles, ...movedVehicles];

      return newTree;
    });

    setModalOpen(false);

    const targetName = findNodeById(orgTree, targetFleetId)?.name || '';
    showToast(`已成功将 ${vehicleIds.length} 辆车移入「${targetName}」`);
  }, [selectedId, orgTree, showToast]);

  const breadcrumbPath = useMemo(
    () => selectedId ? getNodePath(orgTree, selectedId) : [],
    [orgTree, selectedId]
  );

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bmw-canvas)',
      color: 'var(--bmw-ink)',
    }}>
      {/* Left Sidebar — Org Tree */}
      <aside style={{
        width: 280,
        minWidth: 280,
        borderRight: '1px solid var(--bmw-hairline)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bmw-canvas)',
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--bmw-hairline)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ color: 'var(--bmw-primary)', display: 'flex' }}>
            <IconTruck size={20} />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bmw-ink)', letterSpacing: 0 }}>
              组织架构
            </div>
            <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--bmw-muted)' }}>
              {orgTree.name}
            </div>
          </div>
        </div>

        {/* Tree */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          <TreeNode
            node={orgTree}
            depth={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onSelect={handleSelect}
          />
        </nav>

        {/* Sidebar footer — legend */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--bmw-hairline)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--bmw-muted-soft)', marginBottom: 4 }}>
            图例
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: '#2e7d32', display: 'inline-block', borderRadius: 'var(--bmw-radius)' }} />
            <span style={{ fontSize: 12, fontWeight: 300, color: 'var(--bmw-muted)' }}>直属车辆</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: '#1565c0', display: 'inline-block', borderRadius: 'var(--bmw-radius)' }} />
            <span style={{ fontSize: 12, fontWeight: 300, color: 'var(--bmw-muted)' }}>托管车辆</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: '#e65100', display: 'inline-block', borderRadius: 'var(--bmw-radius)' }} />
            <span style={{ fontSize: 12, fontWeight: 300, color: 'var(--bmw-muted)' }}>授权车辆</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Breadcrumb + Header */}
        <header style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--bmw-hairline)',
          background: 'var(--bmw-canvas)',
        }}>
          <div className="breadcrumb">
            <span>数据权限</span>
            <span className="breadcrumb-sep">›</span>
            <span>车辆归属管理</span>
            {breadcrumbPath.length > 0 && (
              <>
                <span className="breadcrumb-sep">›</span>
                {breadcrumbPath.map((node, idx) => (
                  <React.Fragment key={node.id}>
                    {idx > 0 && <span className="breadcrumb-sep">›</span>}
                    <span className={idx === breadcrumbPath.length - 1 ? 'current' : ''}>
                      {node.name}
                    </span>
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
          <h1 style={{
            margin: '12px 0 0',
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--bmw-ink)',
            letterSpacing: 0,
          }}>
            {selectedNode ? selectedNode.name : '车辆归属管理'}
          </h1>
          <p style={{
            margin: '4px 0 0',
            fontSize: 14,
            fontWeight: 300,
            color: 'var(--bmw-body)',
          }}>
            {selectedNode?.type === 'fleet'
              ? `管理该车队下的车辆归属，可移出车辆到其他车队`
              : selectedNode?.type === 'department'
              ? `查看部门下所有车队的车辆，展开具体车队后可调整归属`
              : selectedNode?.type === 'enterprise'
              ? `查看企业下所有车辆，展开到具体车队后可调整归属`
              : '从左侧组织树选择节点开始管理'}
          </p>
        </header>

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <VehicleTable
            vehicles={selectedNode?.vehicles || []}
            selectedNode={selectedNode}
            onMoveOut={handleMoveOut}
            onMoveIn={handleMoveIn}
          />
        </div>
      </main>

      {/* Move Vehicle Modal */}
      <MoveVehicleModal
        open={modalOpen}
        vehicles={selectedNode?.vehicles || []}
        allFleets={allFleets}
        currentFleetId={selectedNode?.type === 'fleet' ? selectedNode.id : null}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmMove}
      />

      {/* Toast */}
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  );
};

export default VehiclePermissionPage;
