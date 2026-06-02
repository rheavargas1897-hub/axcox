/**
 * @name 创建权限分配
 *
 * 参考资料：
 * - BMW 主题 DESIGN.md (src/themes/bmw/DESIGN.md)
 * - 旭利车联网组织架构与车辆关系三态模型
 * - rules/prototype-development-guide.md
 */

import './style.css';
import React, { useState, useCallback, useMemo } from 'react';

// ====== Types ======

type RelationshipType = 'direct' | 'managed' | 'authorized';

interface OrgNode {
  id: string;
  name: string;
  type: 'enterprise' | 'department' | 'fleet';
  children: OrgNode[];
  vehicleCount: number;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
  department: string;
}

interface FormData {
  subjectId: string;
  relationship: RelationshipType;
  isPermanent: boolean;
  startDate: string;
  endDate: string;
  selectedOrgIds: Set<string>;
  permRealtime: boolean;
  permHistory: boolean;
  permAlarm: boolean;
  dataLevel: 'view' | 'edit';
  notes: string;
}

interface FormErrors {
  subjectId?: string;
  endDate?: string;
  orgScope?: string;
  permissions?: string;
}

// ====== Mock Data ======

const MOCK_USERS: UserOption[] = [
  { id: 'u1', name: '张建国', role: '车队队长', department: '运输一队' },
  { id: 'u2', name: '李明辉', role: '调度员', department: '运输一队' },
  { id: 'u3', name: '王秀英', role: '部门经理', department: '中山运营部' },
  { id: 'u4', name: '陈志强', role: '安全主管', department: '广州运营部' },
  { id: 'u5', name: '刘美玲', role: '监控员', department: '冷链运输队' },
  { id: 'u6', name: '赵文博', role: '副总经理', department: '管理层' },
  { id: 'u7', name: '孙丽华', role: '车辆管理员', department: '危化品运输队' },
  { id: 'u8', name: '周大伟', role: '外部合作方', department: '安途物流' },
];

const MOCK_ROLES: UserOption[] = [
  { id: 'r1', name: '企业管理员', role: '系统角色', department: '全局' },
  { id: 'r2', name: '车队队长', role: '系统角色', department: '全局' },
  { id: 'r3', name: '调度员', role: '系统角色', department: '全局' },
  { id: 'r4', name: '监控员', role: '系统角色', department: '全局' },
  { id: 'r5', name: '只读观察员', role: '系统角色', department: '全局' },
];

function buildOrgTree(): OrgNode {
  return {
    id: 'ent-1',
    name: '稳捷物流',
    type: 'enterprise',
    vehicleCount: 21,
    children: [
      {
        id: 'dept-1',
        name: '中山运营部',
        type: 'department',
        vehicleCount: 8,
        children: [
          { id: 'fleet-1', name: '运输一队', type: 'fleet', vehicleCount: 5, children: [] },
          { id: 'fleet-2', name: '运输二队', type: 'fleet', vehicleCount: 3, children: [] },
        ],
      },
      {
        id: 'dept-2',
        name: '广州运营部',
        type: 'department',
        vehicleCount: 10,
        children: [
          { id: 'fleet-3', name: '危化品运输队', type: 'fleet', vehicleCount: 6, children: [] },
          { id: 'fleet-4', name: '冷链运输队', type: 'fleet', vehicleCount: 4, children: [] },
        ],
      },
      {
        id: 'dept-3',
        name: '珠海办事处',
        type: 'department',
        vehicleCount: 3,
        children: [
          { id: 'fleet-5', name: '珠海车队', type: 'fleet', vehicleCount: 3, children: [] },
        ],
      },
    ],
  };
}

function getAllNodeIds(node: OrgNode): string[] {
  const ids = [node.id];
  for (const child of node.children) {
    ids.push(...getAllNodeIds(child));
  }
  return ids;
}

function getChildIds(node: OrgNode): string[] {
  return node.children.flatMap(c => getAllNodeIds(c));
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

// ====== Icons ======

const IconSearch = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconChevronRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconChevronDown = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconArrowLeft = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconUser = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconGlobe = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconShield = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconClock = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconInfo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// ====== Sub-components ======

interface SubjectPickerProps {
  value: string;
  users: UserOption[];
  roles: UserOption[];
  onChange: (id: string) => void;
  error?: string;
}

const SubjectPicker: React.FC<SubjectPickerProps> = ({ value, users, roles, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'user' | 'role'>('user');

  const selectedItem = [...users, ...roles].find(u => u.id === value);

  const filtered = (tab === 'user' ? users : roles).filter(u =>
    !search || u.name.includes(search) || u.department.includes(search)
  );

  return (
    <div className="search-dropdown">
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--bmw-muted-soft)', display: 'flex' }}>
          <IconSearch size={16} />
        </span>
        <input
          className={`input input-with-icon ${error ? 'input-error' : ''}`}
          placeholder="搜索用户或角色名称…"
          value={selectedItem ? `${selectedItem.name} — ${selectedItem.role}` : search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </div>
      {error && <div className="error-text">{error}</div>}
      {open && (
        <div className="search-dropdown-menu">
          <div style={{ display: 'flex', borderBottom: '1px solid var(--bmw-hairline)' }}>
            <button
              onClick={() => setTab('user')}
              style={{
                flex: 1, padding: '10px', border: 'none', background: 'none',
                fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
                textTransform: 'uppercase', cursor: 'pointer',
                color: tab === 'user' ? 'var(--bmw-ink)' : 'var(--bmw-muted-soft)',
                borderBottom: tab === 'user' ? '2px solid var(--bmw-ink)' : '2px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              按用户
            </button>
            <button
              onClick={() => setTab('role')}
              style={{
                flex: 1, padding: '10px', border: 'none', background: 'none',
                fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
                textTransform: 'uppercase', cursor: 'pointer',
                color: tab === 'role' ? 'var(--bmw-ink)' : 'var(--bmw-muted-soft)',
                borderBottom: tab === 'role' ? '2px solid var(--bmw-ink)' : '2px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              按角色
            </button>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-hint">无匹配结果</div>
          ) : (
            filtered.map(u => (
              <div
                key={u.id}
                className={`search-dropdown-item ${value === u.id ? 'selected' : ''}`}
                onMouseDown={() => { onChange(u.id); setOpen(false); }}
              >
                <div className="search-dropdown-item-avatar">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: value === u.id ? 700 : 400 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--bmw-muted)', fontWeight: 300 }}>
                    {u.role} · {u.department}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface OrgTreeCheckboxProps {
  node: OrgNode;
  depth: number;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

const OrgTreeCheckbox: React.FC<OrgTreeCheckboxProps> = ({
  node, depth, selectedIds, expandedIds, onToggle, onToggleExpand,
}) => {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const childIds = hasChildren ? getChildIds(node) : [];
  const allChildrenSelected = childIds.length > 0 && childIds.every(id => selectedIds.has(id));
  const someChildrenSelected = childIds.some(id => selectedIds.has(id));

  const isIndeterminate = !isSelected && someChildrenSelected;

  return (
    <div className="tree-item">
      <div className="tree-item-row" style={{ paddingLeft: 12 + depth * 20 }}>
        {hasChildren ? (
          <span
            onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}
            style={{ display: 'flex', alignItems: 'center', color: 'var(--bmw-muted)', cursor: 'pointer', flexShrink: 0 }}
          >
            {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
          </span>
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}
        <input
          type="checkbox"
          checked={isSelected || allChildrenSelected}
          ref={el => {
            if (el) el.indeterminate = isIndeterminate;
          }}
          onChange={() => onToggle(node.id)}
        />
        <span style={{ fontSize: 14, fontWeight: isSelected || allChildrenSelected ? 700 : 400, color: 'var(--bmw-ink)', flex: 1 }}>
          {node.name}
        </span>
        <span className="tag tag-muted">{node.vehicleCount} 辆车</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <OrgTreeCheckbox
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ====== Main Page ======

const PermissionCreatePage: React.FC = () => {
  const orgTree = useMemo(() => buildOrgTree(), []);

  const [form, setForm] = useState<FormData>({
    subjectId: '',
    relationship: 'direct',
    isPermanent: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    selectedOrgIds: new Set<string>(),
    permRealtime: true,
    permHistory: true,
    permAlarm: true,
    dataLevel: 'view',
    notes: '',
  });

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['ent-1', 'dept-1', 'dept-2']));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }, [errors]);

  const handleToggleOrg = useCallback((id: string) => {
    setForm(prev => {
      const next = new Set(prev.selectedOrgIds);
      const node = findNodeById(orgTree, id);
      if (!node) return prev;

      const allDescendantIds = getAllNodeIds(node);

      if (next.has(id) || allDescendantIds.every(did => next.has(did))) {
        for (const did of allDescendantIds) next.delete(did);
      } else {
        for (const did of allDescendantIds) next.add(did);
      }

      return { ...prev, selectedOrgIds: next };
    });
  }, [orgTree]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!form.subjectId) errs.subjectId = '请选择授权对象';
    if (!form.isPermanent && !form.endDate) errs.endDate = '请选择结束日期';
    if (form.selectedOrgIds.size === 0) errs.orgScope = '请至少选择一个组织节点';
    if (!form.permRealtime && !form.permHistory && !form.permAlarm) {
      errs.permissions = '请至少开启一项功能权限';
    }
    return errs;
  }, [form]);

  const handleSubmit = useCallback(() => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitted(true);
    setToast('权限分配已创建成功');
    setTimeout(() => setToast(null), 3000);
  }, [validate]);

  const handleReset = useCallback(() => {
    setForm({
      subjectId: '',
      relationship: 'direct',
      isPermanent: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      selectedOrgIds: new Set<string>(),
      permRealtime: true,
      permHistory: true,
      permAlarm: true,
      dataLevel: 'view',
      notes: '',
    });
    setErrors({});
    setSubmitted(false);
  }, []);

  const selectedSubject = [...MOCK_USERS, ...MOCK_ROLES].find(u => u.id === form.subjectId);

  const selectedOrgNames = useMemo(() => {
    const names: string[] = [];
    for (const id of form.selectedOrgIds) {
      const node = findNodeById(orgTree, id);
      if (node && node.type === 'fleet') {
        const path = getNodePath(orgTree, id);
        names.push(path.map(n => n.name).join(' › '));
      }
    }
    return names;
  }, [form.selectedOrgIds, orgTree]);

  const selectedFleetCount = useMemo(() => {
    let count = 0;
    for (const id of form.selectedOrgIds) {
      const node = findNodeById(orgTree, id);
      if (node && node.type === 'fleet') count++;
    }
    return count;
  }, [form.selectedOrgIds, orgTree]);

  const totalVehicles = useMemo(() => {
    let count = 0;
    const counted = new Set<string>();
    for (const id of form.selectedOrgIds) {
      const node = findNodeById(orgTree, id);
      if (node && !counted.has(id)) {
        count += node.vehicleCount;
        counted.add(id);
      }
    }
    return count;
  }, [form.selectedOrgIds, orgTree]);

  // Success state
  if (submitted) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-link" onClick={handleReset}>
            <IconArrowLeft size={14} /> 返回权限列表
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: 0 }}>创建权限分配</h1>
        </div>
        <div className="page-body">
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-body" style={{ padding: '60px 40px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#e8f5e9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px', color: '#2e7d32',
              }}>
                <IconCheck size={32} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>权限分配创建成功</h2>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 300, color: 'var(--bmw-body)' }}>
                已为 <strong>{selectedSubject?.name}</strong> 分配 {totalVehicles} 辆车的数据权限
              </p>
              <p style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 300, color: 'var(--bmw-muted)' }}>
                权限范围：{selectedFleetCount} 个车队 · 功能：实时定位、历史轨迹、报警信息
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={handleReset}>创建新分配</button>
                <button className="btn btn-primary">查看权限列表</button>
              </div>
            </div>
          </div>
        </div>
        {toast && <div className="toast toast-success">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <button className="back-link">
          <IconArrowLeft size={14} /> 返回权限列表
        </button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: 0 }}>创建权限分配</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 300, color: 'var(--bmw-body)' }}>
          为指定用户或角色分配车辆数据的查看和操作权限
        </p>
      </div>

      <div className="page-body">
        {/* ===== Card 1: Basic Info ===== */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon"><IconUser size={18} /></div>
            <div className="card-header-text">
              <h3>基本信息</h3>
              <p>选择授权对象、关系类型和有效期</p>
            </div>
          </div>
          <div className="card-body">
            {/* Subject */}
            <div className="form-group">
              <label className="form-label">授权对象</label>
              <SubjectPicker
                value={form.subjectId}
                users={MOCK_USERS}
                roles={MOCK_ROLES}
                onChange={id => updateField('subjectId', id)}
                error={errors.subjectId}
              />
              <div className="form-hint">支持按用户或按角色授权，角色授权将应用于该角色的所有成员</div>
            </div>

            {/* Relationship */}
            <div className="form-group">
              <label className="form-label">关系类型</label>
              <div className="radio-group">
                {([
                  { value: 'direct' as RelationshipType, label: '直属车辆', desc: '本企业自持车辆\n完整数据权限' },
                  { value: 'managed' as RelationshipType, label: '托管车辆', desc: '其他企业持有\n运营方可查看和操作' },
                  { value: 'authorized' as RelationshipType, label: '授权车辆', desc: '外部企业授权\n限时数据查看' },
                ]).map(opt => (
                  <label key={opt.value} className="radio-card">
                    <input
                      type="radio"
                      name="relationship"
                      value={opt.value}
                      checked={form.relationship === opt.value}
                      onChange={() => updateField('relationship', opt.value)}
                    />
                    <div className="radio-card-content">
                      <span className="radio-card-label">{opt.label}</span>
                      <span className="radio-card-desc" style={{ whiteSpace: 'pre-line' }}>{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Validity */}
            <div className="form-group">
              <label className="form-label">有效期</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={form.isPermanent}
                    onChange={e => updateField('isPermanent', e.target.checked)}
                    style={{ accentColor: 'var(--bmw-primary)', width: 16, height: 16 }}
                  />
                  永久有效
                </label>
              </div>
              {!form.isPermanent && (
                <div className="form-row">
                  <div>
                    <input
                      type="date"
                      className="input"
                      value={form.startDate}
                      onChange={e => updateField('startDate', e.target.value)}
                    />
                    <div className="form-hint">开始日期</div>
                  </div>
                  <div>
                    <input
                      type="date"
                      className={`input ${errors.endDate ? 'input-error' : ''}`}
                      value={form.endDate}
                      onChange={e => updateField('endDate', e.target.value)}
                    />
                    <div className="form-hint">结束日期</div>
                    {errors.endDate && <div className="error-text">{errors.endDate}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== Card 2: Data Scope ===== */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon"><IconGlobe size={18} /></div>
            <div className="card-header-text">
              <h3>数据范围</h3>
              <p>选择该授权对象可以查看的组织节点和车辆数据</p>
            </div>
          </div>
          <div className="card-body">
            {errors.orgScope && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bmw-error-bg)', borderRadius: 'var(--bmw-radius-sm)' }}>
                <span className="error-text">{errors.orgScope}</span>
              </div>
            )}
            <div style={{
              border: `1px solid ${errors.orgScope ? 'var(--bmw-error)' : 'var(--bmw-hairline)'}`,
              borderRadius: 'var(--bmw-radius)',
              maxHeight: 340, overflow: 'auto', padding: '8px 0',
            }}>
              <OrgTreeCheckbox
                node={orgTree}
                depth={0}
                selectedIds={form.selectedOrgIds}
                expandedIds={expandedIds}
                onToggle={handleToggleOrg}
                onToggleExpand={handleToggleExpand}
              />
            </div>
            <div className="form-hint" style={{ marginTop: 8 }}>
              已选 {form.selectedOrgIds.size} 个节点，覆盖约 {totalVehicles} 辆车
            </div>
          </div>
        </div>

        {/* ===== Card 3: Function Permissions ===== */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon"><IconShield size={18} /></div>
            <div className="card-header-text">
              <h3>功能权限</h3>
              <p>配置该授权对象可用的具体功能</p>
            </div>
          </div>
          <div className="card-body">
            {errors.permissions && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bmw-error-bg)', borderRadius: 'var(--bmw-radius-sm)' }}>
                <span className="error-text">{errors.permissions}</span>
              </div>
            )}
            <div style={{ border: '1px solid var(--bmw-hairline)', borderRadius: 'var(--bmw-radius)' }}>
              <div style={{ padding: '0 14px' }}>
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">实时定位</div>
                    <div className="toggle-desc">查看车辆实时位置和状态信息</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={form.permRealtime}
                      onChange={e => updateField('permRealtime', e.target.checked)}
                    />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">历史轨迹</div>
                    <div className="toggle-desc">回放车辆历史行驶轨迹和停留点</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={form.permHistory}
                      onChange={e => updateField('permHistory', e.target.checked)}
                    />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">报警信息</div>
                    <div className="toggle-desc">接收和查看车辆报警通知与记录</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={form.permAlarm}
                      onChange={e => updateField('permAlarm', e.target.checked)}
                    />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label className="form-label">数据操作级别</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', border: `1px solid ${form.dataLevel === 'view' ? 'var(--bmw-primary)' : 'var(--bmw-hairline)'}`,
                  borderRadius: 'var(--bmw-radius)', cursor: 'pointer',
                  background: form.dataLevel === 'view' ? 'var(--bmw-primary-bg)' : undefined,
                }}>
                  <input
                    type="radio" name="dataLevel" value="view"
                    checked={form.dataLevel === 'view'}
                    onChange={() => updateField('dataLevel', 'view')}
                    style={{ accentColor: 'var(--bmw-primary)' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>仅查看</div>
                    <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--bmw-muted)' }}>可查看数据，不可修改</div>
                  </div>
                </label>
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', border: `1px solid ${form.dataLevel === 'edit' ? 'var(--bmw-primary)' : 'var(--bmw-hairline)'}`,
                  borderRadius: 'var(--bmw-radius)', cursor: 'pointer',
                  background: form.dataLevel === 'edit' ? 'var(--bmw-primary-bg)' : undefined,
                }}>
                  <input
                    type="radio" name="dataLevel" value="edit"
                    checked={form.dataLevel === 'edit'}
                    onChange={() => updateField('dataLevel', 'edit')}
                    style={{ accentColor: 'var(--bmw-primary)' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>可编辑</div>
                    <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--bmw-muted)' }}>可查看和调整车辆归属</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Card 4: Summary Preview ===== */}
        {form.subjectId && form.selectedOrgIds.size > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon"><IconInfo size={18} /></div>
              <div className="card-header-text">
                <h3>权限预览</h3>
                <p>创建前确认权限分配内容</p>
              </div>
            </div>
            <div className="card-body">
              <div style={{ border: '1px solid var(--bmw-hairline)', borderRadius: 'var(--bmw-radius)', padding: '0 16px' }}>
                <div className="summary-item">
                  <span className="summary-label">授权对象</span>
                  <span className="summary-value" style={{ fontWeight: 700 }}>
                    {selectedSubject?.name}
                    <span className="tag tag-muted" style={{ marginLeft: 8 }}>{selectedSubject?.role}</span>
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">关系类型</span>
                  <span className="summary-value">
                    <span className={`tag ${form.relationship === 'direct' ? 'tag-green' : form.relationship === 'managed' ? 'tag-blue' : 'tag-orange'}`}>
                      {{ direct: '直属车辆', managed: '托管车辆', authorized: '授权车辆' }[form.relationship]}
                    </span>
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">有效期</span>
                  <span className="summary-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconClock size={14} />
                    {form.isPermanent ? '永久有效' : `${form.startDate} 至 ${form.endDate}`}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">数据范围</span>
                  <span className="summary-value">
                    {selectedFleetCount} 个车队（{totalVehicles} 辆车）
                    {selectedOrgNames.length > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 300, color: 'var(--bmw-muted)', marginLeft: 4 }}>
                        — {selectedOrgNames.slice(0, 2).join('、')}{selectedOrgNames.length > 2 ? ` 等${selectedOrgNames.length}个` : ''}
                      </span>
                    )}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">功能权限</span>
                  <span className="summary-value" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {form.permRealtime && <span className="tag tag-green">实时定位</span>}
                    {form.permHistory && <span className="tag tag-blue">历史轨迹</span>}
                    {form.permAlarm && <span className="tag tag-orange">报警信息</span>}
                    <span className="tag tag-muted">{form.dataLevel === 'view' ? '仅查看' : '可编辑'}</span>
                  </span>
                </div>
                {form.notes && (
                  <div className="summary-item">
                    <span className="summary-label">备注</span>
                    <span className="summary-value" style={{ fontSize: 13, fontWeight: 300 }}>{form.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== Notes ===== */}
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">备注（可选）</label>
              <textarea
                className="input"
                rows={2}
                placeholder="添加备注说明此权限分配的目的或背景…"
                value={form.notes}
                onChange={e => updateField('notes', e.target.value)}
                style={{ height: 'auto', resize: 'vertical', minHeight: 64 }}
              />
            </div>
          </div>
        </div>

        {/* ===== Action Bar ===== */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 12,
          position: 'sticky', bottom: 24,
        }}>
          <button className="btn btn-secondary" onClick={handleReset}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <IconShield size={16} />
            创建权限分配
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast toast-success">{toast}</div>
      )}
    </div>
  );
};

export default PermissionCreatePage;
