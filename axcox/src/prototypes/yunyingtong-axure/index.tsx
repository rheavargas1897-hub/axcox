/**
 * @name 营运通 Axure 原型预览
 *
 * 参考资料：
 * - /rules/prototype-development-guide.md
 * - /rules/resource-management-guide.md
 */

import './style.css';

import React, { useMemo, useState } from 'react';

type AxurePage = {
    name: string;
    file: string;
};

type AxureGroup = {
    name: string;
    pages: AxurePage[];
};

const RESOURCE_ROOT = '/resources/axure-yingyuntong';

const PLAYER_PAGE: AxurePage = {
    name: '完整 Axure 播放器',
    file: 'index.html',
};

const PAGE_GROUPS: AxureGroup[] = [
    {
        name: '入口与概览',
        pages: [
            { name: '概述', file: '概述.html' },
            { name: 'Page 1', file: 'page_1.html' },
            { name: '工作台', file: '工作台.html' },
        ],
    },
    {
        name: '销售中心',
        pages: [
            { name: '销售订单', file: '销售订单.html' },
            { name: '售后订单', file: '售后订单.html' },
            { name: '监控订单', file: '监控订单.html' },
            { name: '车辆管理', file: '车辆管理.html' },
        ],
    },
    {
        name: '商品中心',
        pages: [
            { name: '名词解析', file: '名词解析.html' },
            { name: '产品管理', file: '产品管理.html' },
            { name: '组合商品', file: '组合商品.html' },
            { name: '套餐管理', file: '套餐管理.html' },
            { name: '安装报单演示', file: '安装报单演示.html' },
        ],
    },
    {
        name: '仓储管理',
        pages: [
            { name: '库存业务流程图', file: '库存业务流程图.html' },
            { name: '库存统计', file: '库存统计.html' },
            { name: '库存统计（交互参考', file: '库存统计（交互参考.html' },
            { name: '产品入库', file: '产品入库.html' },
            { name: '移动端产品入库（入库验收）', file: '移动端产品入库（入库验收）.html' },
            { name: '产品出库', file: '产品出库.html' },
            { name: '借货管理', file: '借货管理.html' },
            { name: '设备回收', file: '设备回收.html' },
            { name: '库存盘点', file: '库存盘点.html' },
            { name: '移动端盘点', file: '移动端盘点.html' },
            { name: '库存调拨', file: '库存调拨.html' },
        ],
    },
    {
        name: '仓库管理',
        pages: [
            { name: '设备检测', file: '设备检测.html' },
            { name: '仓库管理', file: '仓库管理.html' },
            { name: '标签码管理', file: '标签码管理.html' },
        ],
    },
    {
        name: '采购管理',
        pages: [
            { name: '采购订单', file: '采购订单.html' },
            { name: '到货记录', file: '到货记录.html' },
            { name: '移动端到货记录', file: '移动端到货记录.html' },
            { name: '供应商管理', file: '供应商管理.html' },
        ],
    },
    {
        name: '系统设置',
        pages: [
            { name: '仓储规则', file: '仓储规则.html' },
            { name: '设备质量规则', file: '设备质量规则.html' },
            { name: '销售规则', file: '销售规则.html' },
        ],
    },
    {
        name: '业务扩展',
        pages: [
            { name: '主机配机', file: '主机配机.html' },
            { name: '工单管理', file: '工单管理.html' },
        ],
    },
];

function getPageUrl(file: string): string {
    return `${RESOURCE_ROOT}/${encodeURIComponent(file)}`;
}

export default function Component() {
    const [selectedPage, setSelectedPage] = useState<AxurePage>(PLAYER_PAGE);
    const [viewerMode, setViewerMode] = useState<'player' | 'single'>('player');

    const iframeSrc = useMemo(() => {
        if (viewerMode === 'player') {
            return getPageUrl(PLAYER_PAGE.file);
        }
        return getPageUrl(selectedPage.file);
    }, [selectedPage.file, viewerMode]);

    const currentTitle = viewerMode === 'player' ? PLAYER_PAGE.name : selectedPage.name;

    return (
        <main className="yunyingtong-preview">
            <aside className="preview-sidebar" aria-label="Axure 页面目录">
                <div className="preview-brand">
                    <span className="preview-kicker">Axure Import</span>
                    <h1>营运通原型</h1>
                </div>

                <div className="viewer-toggle" role="tablist" aria-label="预览模式">
                    <button
                        className={viewerMode === 'player' ? 'is-active' : ''}
                        type="button"
                        onClick={() => setViewerMode('player')}
                    >
                        播放器
                    </button>
                    <button
                        className={viewerMode === 'single' ? 'is-active' : ''}
                        type="button"
                        onClick={() => setViewerMode('single')}
                    >
                        单页
                    </button>
                </div>

                <nav className="page-tree">
                    {PAGE_GROUPS.map((group) => (
                        <section className="page-group" key={group.name}>
                            <h2>{group.name}</h2>
                            <div className="page-links">
                                {group.pages.map((page) => {
                                    const isActive = viewerMode === 'single' && selectedPage.file === page.file;
                                    return (
                                        <button
                                            className={isActive ? 'is-active' : ''}
                                            key={page.file}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPage(page);
                                                setViewerMode('single');
                                            }}
                                        >
                                            {page.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </nav>
            </aside>

            <section className="preview-stage" aria-label="原型预览区">
                <header className="stage-toolbar">
                    <div>
                        <span className="stage-eyebrow">当前预览</span>
                        <h2>{currentTitle}</h2>
                    </div>
                    <a href={iframeSrc} target="_blank" rel="noreferrer">
                        新窗口打开
                    </a>
                </header>

                <div className="iframe-shell">
                    <iframe title={currentTitle} src={iframeSrc} />
                </div>
            </section>
        </main>
    );
}
