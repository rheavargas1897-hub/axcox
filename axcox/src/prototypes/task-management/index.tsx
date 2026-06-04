/**
 * @name 任务管理
 * @mode axure
 *
 * 参考资料：
 * - /Users/rheavargas/Desktop/AI-任务管理-complete.zip
 */

import React, { useState } from 'react';
import {
  Bell,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Database,
  FileText,
  Filter,
  Home,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
} from 'lucide-react';
import './style.css';

type TaskRow = {
  id: number;
  status: '已退回' | '待派单';
  type: '售后';
  taskNo: string;
  relatedNo: string;
  follower: string;
  creator: string;
  handler: string;
  department: string;
  company: string;
  audit: '未审核';
  contact: string;
  phone: string;
  plate: string;
  vin: string;
};

const menuIcons = [
  LayoutDashboard,
  Home,
  ShieldCheck,
  FileText,
  Database,
  Truck,
  ClipboardList,
  Car,
  Filter,
  Settings,
  CircleHelp,
  RefreshCw,
];

const rows: TaskRow[] = [
  {
    id: 1,
    status: '已退回',
    type: '售后',
    taskNo: 'RW20260430080',
    relatedNo: 'SH20260430061',
    follower: '客服2',
    creator: '黎浩鹏',
    handler: '邱峰',
    department: '--',
    company: '广州市盛生运输服务有限公司',
    audit: '未审核',
    contact: '',
    phone: '13686701768',
    plate: '粤AFF791',
    vin: 'LNXAEL',
  },
  {
    id: 2,
    status: '待派单',
    type: '售后',
    taskNo: 'RW20260514048',
    relatedNo: 'SH20260514036',
    follower: '售后微信',
    creator: '何伊颖',
    handler: '任务待分配',
    department: '--',
    company: '广州豪沃运输有限公司',
    audit: '未审核',
    contact: '司机/红姐',
    phone: '18127267586...',
    plate: '粤ADR728',
    vin: 'LNXAEL',
  },
  {
    id: 3,
    status: '待派单',
    type: '售后',
    taskNo: 'RW20260514054',
    relatedNo: 'SH20260514042',
    follower: '售后微信',
    creator: '何伊颖',
    handler: '任务待分配',
    department: '--',
    company: '广州市铜城物流有限公司',
    audit: '未审核',
    contact: '赖克生',
    phone: '13926643500',
    plate: '粤AJR009',
    vin: 'LZZ1BC',
  },
  {
    id: 4,
    status: '待派单',
    type: '售后',
    taskNo: 'RW20260526056',
    relatedNo: 'SH20260526030',
    follower: '售后微信',
    creator: '梁小燃',
    handler: '任务待分配',
    department: '--',
    company: '广州市平志物流有限公司',
    audit: '未审核',
    contact: '',
    phone: '18279455333',
    plate: '粤AGC305',
    vin: 'LGGX3C',
  },
  {
    id: 5,
    status: '待派单',
    type: '售后',
    taskNo: 'RW20260527003',
    relatedNo: 'SH20260527003',
    follower: '售后微信',
    creator: '刘海波',
    handler: '任务待分配',
    department: '--',
    company: '广东羊城之旅旅游运输有限公司',
    audit: '未审核',
    contact: '19864097...',
    phone: '19864097779',
    plate: '粤A02388D',
    vin: 'L66BBC',
  },
  {
    id: 6,
    status: '待派单',
    type: '售后',
    taskNo: 'RW20260603001',
    relatedNo: 'SH20260603001',
    follower: '客服2',
    creator: '凌海峰',
    handler: '任务待分配',
    department: '--',
    company: '广州东运汽车服务有限公司',
    audit: '未审核',
    contact: '朱小姐',
    phone: '13434321663',
    plate: '粤A21193D',
    vin: 'LZYTBT',
  },
  {
    id: 7,
    status: '待派单',
    type: '售后',
    taskNo: 'RW20260603002',
    relatedNo: 'SH20260603002',
    follower: '客服1',
    creator: '廖浩智',
    handler: '任务待分配',
    department: '--',
    company: '广州市恒誉光明客运有限公司',
    audit: '未审核',
    contact: '陈嘉驹',
    phone: '13533228229',
    plate: '粤ABF560',
    vin: 'LNLG3E',
  },
  {
    id: 8,
    status: '待派单',
    type: '售后',
    taskNo: 'RW20260604009',
    relatedNo: 'SH20260604008',
    follower: '客服1',
    creator: '苏小晴',
    handler: '任务待分配',
    department: '--',
    company: '广州顺曦运输有限公司',
    audit: '未审核',
    contact: '',
    phone: '18917154685',
    plate: '粤AJW578',
    vin: 'LZZ8BC',
  },
  {
    id: 9,
    status: '待派单',
    type: '售后',
    taskNo: 'RW20260510027',
    relatedNo: 'SH20260510023',
    follower: '客服1',
    creator: '黄浩楷',
    handler: '任务待分配',
    department: '安装部',
    company: '广州市泽昌物流有限公司',
    audit: '未审核',
    contact: '',
    phone: '13058511736',
    plate: '粤AGE695',
    vin: 'LGAX3C',
  },
  {
    id: 10,
    status: '待派单',
    type: '售后',
    taskNo: 'RW20260510028',
    relatedNo: 'SH20260510024',
    follower: '售后微信',
    creator: '黄浩楷',
    handler: '任务待分配',
    department: '安装部',
    company: '广州市平志物流有限公司',
    audit: '未审核',
    contact: '欧阳斌',
    phone: '13922462264',
    plate: '粤AHX882',
    vin: 'LNXBEC',
  },
];

function MiniInput({ label, placeholder, select = false, wide = false }: { label: string; placeholder: string; select?: boolean; wide?: boolean }) {
  return (
    <label className={wide ? 'filter-field filter-field-wide' : 'filter-field'}>
      <span>{label}</span>
      <div className="filter-control">
        <span className="placeholder">{placeholder}</span>
        {select ? <ChevronDown size={13} strokeWidth={1.7} /> : null}
      </div>
    </label>
  );
}

function App() {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <div className="task-page-shell">
      <aside className="icon-rail">
        <div className="rail-logo">◎</div>
        {menuIcons.map((Icon, index) => (
          <button className={index === 0 ? 'rail-btn rail-btn-active' : 'rail-btn'} key={index} aria-label={`menu-${index}`}>
            <Icon size={14} strokeWidth={1.8} />
          </button>
        ))}
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="top-left">
            <button className="menu-button" aria-label="折叠菜单">
              <Menu size={17} />
            </button>
            <span className="breadcrumb-home">首页</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-current">任务管理</span>
          </div>
          <div className="top-actions">
            <CircleHelp size={15} />
            <div className="bell-wrap">
              <Bell size={15} />
              <span className="notify-dot">0</span>
            </div>
            <div className="avatar">营</div>
            <ChevronDown size={13} />
          </div>
        </header>

        <div className="tagbar">
          <span className="tag tag-home">首页</span>
          <span className="tag tag-active">● 任务管理 ×</span>
        </div>

        <main className={drawerOpen ? 'content with-drawer' : 'content'}>
          <section className="search-card">
            <div className="card-title muted-title">搜索条件</div>
            <div className="filter-actions">
              <button className="link-button">展开 <ChevronDown size={12} /></button>
              <button className="primary-button"><Search size={12} />搜索</button>
              <button className="plain-button">重置</button>
            </div>
            <div className="filter-grid">
              <MiniInput label="车牌号" placeholder="请输入车牌号" />
              <MiniInput label="任务单号" placeholder="请输入任务单号" />
              <MiniInput label="单据状态" placeholder="请选择单据状态" select />
              <MiniInput label="售后审核状态" placeholder="请选择售后审核状态" select />
              <label className="filter-field date-field">
                <span>完成处理时间</span>
                <div className="filter-control">
                  <span className="placeholder">开始日期</span>
                  <span className="date-sep">-</span>
                  <span className="placeholder">结束日期</span>
                </div>
              </label>
              <MiniInput label="车架号" placeholder="请输入车架号" />
              <MiniInput label="关联单据号" placeholder="请输入关联单据号" />
              <MiniInput label="任务类型" placeholder="请选择任务类型" select />
              <MiniInput label="所属公司" placeholder="请选择所属公司" />
              <label className="filter-field date-field">
                <span>创建时间</span>
                <div className="filter-control">
                  <span className="placeholder">开始日期</span>
                  <span className="date-sep">-</span>
                  <span className="placeholder">结束日期</span>
                </div>
              </label>
            </div>
          </section>

          <section className="table-card">
            <div className="table-toolbar">
              <h2><ClipboardList size={15} />任务单管理</h2>
              <div className="toolbar-actions">
                <button className="export-button">报单导出 <ChevronDown size={12} /></button>
                <button className="filter-button"><Filter size={12} />筛选</button>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th className="check-col"><input type="checkbox" /></th>
                    <th>序号</th>
                    <th>单据状态</th>
                    <th>任务类型</th>
                    <th>任务单号</th>
                    <th>关联单据单号</th>
                    <th>跟单员</th>
                    <th>创建人</th>
                    <th>处理人</th>
                    <th>处理人部门</th>
                    <th>所属公司</th>
                    <th>售后问题<br />审核状态</th>
                    <th>联系人</th>
                    <th>手机号</th>
                    <th>车牌号</th>
                    <th>车架号</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={row.id === 1 ? 'row-alert' : undefined}>
                      <td><input type="checkbox" /></td>
                      <td>{row.id}</td>
                      <td><span className={row.status === '已退回' ? 'status status-red' : 'status status-green'}>{row.status}</span></td>
                      <td><span className="task-type">{row.type}</span></td>
                      <td><a>{row.taskNo}</a></td>
                      <td>{row.relatedNo}</td>
                      <td>{row.follower}</td>
                      <td>{row.creator}</td>
                      <td>{row.handler}</td>
                      <td>{row.department}</td>
                      <td title={row.company}>{row.company}</td>
                      <td>{row.audit}</td>
                      <td>{row.contact}</td>
                      <td>{row.phone}</td>
                      <td>{row.plate}</td>
                      <td>{row.vin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>共 71553 条</span>
              <button className="page-size">10条/页 <ChevronDown size={12} /></button>
              <button className="page-arrow disabled"><ChevronLeft size={12} /></button>
              {[1, 2, 3, 4, 5, 6].map((page) => (
                <button key={page} className={page === 1 ? 'page-number page-current' : 'page-number'}>{page}</button>
              ))}
              <button className="page-number">...</button>
              <button className="page-number">7156</button>
              <button className="page-arrow"><ChevronRight size={12} /></button>
              <span>前往</span>
              <input value="1" readOnly />
              <span>页</span>
            </div>
          </section>
        </main>
      </section>

      <aside className={drawerOpen ? 'settings-drawer open' : 'settings-drawer'} aria-label="主题风格设置">
        <button className="drawer-toggle" onClick={() => setDrawerOpen((value) => !value)} aria-label="打开设置">
          <SlidersHorizontal size={16} />
        </button>
        <h3>主题风格设置</h3>
        <div className="theme-swatches">
          <button className="swatch swatch-dark" />
          <button className="swatch swatch-light" />
          <button className="swatch swatch-ok"><Check size={15} /></button>
        </div>
        <div className="drawer-row">
          <span>主题颜色</span>
          <button className="square-select"><ChevronDown size={12} /></button>
        </div>
        <div className="drawer-divider" />
        <h3>系统布局配置</h3>
        {[
          ['开启 TopNav', false],
          ['开启 Tags-Views', true],
          ['固定 Header', false],
          ['显示 Logo', true],
          ['动态标题', true],
        ].map(([label, active]) => (
          <div className="switch-line" key={String(label)}>
            <span>{label}</span>
            <button className={active ? 'switch is-on' : 'switch'}><span /></button>
          </div>
        ))}
        <div className="drawer-buttons">
          <button className="save-button">保存配置</button>
          <button className="reset-button">重置配置</button>
        </div>
      </aside>

      <div className="float-tools">
        <button>☒</button>
        <button>回</button>
        <button>Ⅲ</button>
      </div>
    </div>
  );
}

export default App;
