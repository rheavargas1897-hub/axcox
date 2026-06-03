// @ts-nocheck
import React from "react"

const Component = function() {
  // 展开状态
  var _useState1 = React.useState(true)
  var showPackageDetail = _useState1[0]
  var setShowPackageDetail = _useState1[1]

  // 模拟订单数据
  var orderData = {
    orderId: "XS2024010800001",
    status: "已确认",
    createTime: "2024-01-08 14:30:00",
    company: "深圳市安达物流有限公司",
    salesPerson: "张三",
    contact: "李经理",
    phone: "13800138000",
    vehicleCount: 3,
    orderSource: "普通",
    orderType: "普通",
    salesPlan: "普通销售",
    settlementMethod: "现结"
  }

  // 套餐产品数据
  var packageProduct = {
    id: "pkg1",
    name: "商用车高级盲区监控套餐",
    years: 2,
    unitPrice: 2980,
    discount: 0,
    quantity: 1,
    subtotal: 5960,
    installParts: [
      { partName: "前置摄像头", bindType: "product", targetName: "海康威视 DS-2CD3T45FP" },
      { partName: "后置摄像头", bindType: "category", targetName: "高清摄像头" },
      { partName: "车内监控", bindType: "product", targetName: "大华 DH-IPC-HFW2831S" },
      { partName: "GPS定位器", bindType: "product", targetName: "途强 GT06N" },
      { partName: "盲区检测", bindType: "category", targetName: "盲区传感器" }
    ]
  }

  // 加购产品数据
  var addOnProducts = [
    { partName: "左侧摄像头", bindType: "product", targetName: "大华 DH-IPC-xxx", unitPrice: 300, quantity: 3, subtotal: 900 },
    { partName: "OBD接口", bindType: "category", targetName: "OBD诊断设备类", unitPrice: 200, quantity: 3, subtotal: 600 }
  ]

  // 单产品数据
  var singleProducts = [
    { name: "行车记录仪支架", unitPrice: 50, discount: 0, quantity: 3, subtotal: 150 }
  ]

  // 质保信息
  var warrantyInfo = {
    planName: "标准质保方案A",
    isGranted: true,
    isPurchased: true,
    purchaseFee: 400,
    monitorServiceType: "paid",
    monitorServiceFee: 200,
    isExtendedWarranty: true,
    extendedWarrantyFee: 300
  }

  // 费用汇总
  var feesSummary = {
    packageTotal: 5960,
    addOnTotal: 1500,
    singleTotal: 150,
    warrantyFee: 400,
    monitorFee: 200,
    extendedFee: 300,
    additionalAmount: 0,
    f1Amount: 0,
    discountAmount: 200,
    totalAmount: 8310
  }

  // 样式定义
  var styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      fontFamily: "Arial, sans-serif",
      padding: "24px"
    },
    backLink: {
      display: "inline-block",
      marginBottom: "16px",
      color: "#1890ff",
      textDecoration: "none",
      fontSize: "14px"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px"
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333"
    },
    statusTag: {
      display: "inline-block",
      padding: "4px 12px",
      backgroundColor: "#e6f7ff",
      color: "#1890ff",
      borderRadius: "4px",
      fontSize: "13px"
    },
    card: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    },
    cardTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      marginBottom: "16px",
      color: "#333",
      borderLeft: "3px solid #00C853",
      paddingLeft: "12px"
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "16px"
    },
    infoItem: {
      fontSize: "14px"
    },
    infoLabel: {
      color: "#999",
      marginBottom: "4px"
    },
    infoValue: {
      color: "#333"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "14px"
    },
    th: {
      padding: "12px 10px",
      textAlign: "left",
      borderBottom: "1px solid #e8e8e8",
      backgroundColor: "#fafafa",
      fontWeight: "normal",
      color: "#666"
    },
    td: {
      padding: "12px 10px",
      borderBottom: "1px solid #e8e8e8",
      color: "#333"
    },
    detailBtn: {
      background: "none",
      border: "none",
      color: "#1890ff",
      cursor: "pointer",
      fontSize: "14px"
    },
    detailPanel: {
      backgroundColor: "#fafafa",
      padding: "12px 16px",
      borderRadius: "4px",
      marginTop: "8px"
    },
    detailRow: {
      display: "flex",
      alignItems: "center",
      padding: "8px 0",
      fontSize: "13px",
      color: "#666",
      borderBottom: "1px dashed #e8e8e8"
    },
    detailRowLast: {
      display: "flex",
      alignItems: "center",
      padding: "8px 0",
      fontSize: "13px",
      color: "#666"
    },
    arrow: {
      margin: "0 12px",
      color: "#999"
    },
    bindType: {
      display: "inline-block",
      padding: "2px 8px",
      backgroundColor: "#e6f7ff",
      color: "#1890ff",
      borderRadius: "4px",
      fontSize: "12px",
      marginRight: "12px"
    },
    bindTypeCategory: {
      display: "inline-block",
      padding: "2px 8px",
      backgroundColor: "#fff7e6",
      color: "#fa8c16",
      borderRadius: "4px",
      fontSize: "12px",
      marginRight: "12px"
    },
    grayText: {
      color: "#999",
      fontSize: "12px",
      marginLeft: "8px"
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "12px",
      marginTop: "16px"
    },
    warrantyGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px"
    },
    warrantyItem: {
      fontSize: "14px"
    },
    warrantyLabel: {
      color: "#999",
      marginBottom: "4px"
    },
    warrantyValue: {
      color: "#333"
    },
    warrantyTag: {
      display: "inline-block",
      padding: "4px 12px",
      backgroundColor: "#f6ffed",
      color: "#52c41a",
      borderRadius: "4px",
      fontSize: "13px"
    },
    warrantyTagNo: {
      display: "inline-block",
      padding: "4px 12px",
      backgroundColor: "#f5f5f5",
      color: "#999",
      borderRadius: "4px",
      fontSize: "13px"
    },
    feeSummary: {
      backgroundColor: "#fafafa",
      padding: "16px",
      borderRadius: "8px"
    },
    feeRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      fontSize: "14px",
      color: "#666"
    },
    feeDivider: {
      borderTop: "1px dashed #e8e8e8",
      margin: "12px 0"
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      fontSize: "18px",
      fontWeight: "bold"
    },
    totalAmount: {
      color: "#00C853",
      fontWeight: "bold"
    },
    actionBar: {
      display: "flex",
      gap: "12px",
      marginTop: "24px"
    },
    primaryBtn: {
      padding: "10px 24px",
      backgroundColor: "#00C853",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      cursor: "pointer"
    },
    secondaryBtn: {
      padding: "10px 24px",
      backgroundColor: "#fff",
      color: "#333",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px",
      cursor: "pointer"
    }
  }

  return (
    <div style={styles.container}>
      <a href="/" style={styles.backLink}>{"< 返回销售单列表"}</a>
      
      {/* 头部 */}
      <div style={styles.header}>
        <div style={styles.title}>
          销售订单详情 - {orderData.orderId}
        </div>
        <span style={styles.statusTag}>{orderData.status}</span>
      </div>

      {/* 基本信息卡片 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>基本信息</div>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>下单公司</div>
            <div style={styles.infoValue}>{orderData.company}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>销售人员</div>
            <div style={styles.infoValue}>{orderData.salesPerson}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>联系人</div>
            <div style={styles.infoValue}>{orderData.contact}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>手机号码</div>
            <div style={styles.infoValue}>{orderData.phone}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>车辆台数</div>
            <div style={styles.infoValue}>{orderData.vehicleCount} 台</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>单据来源</div>
            <div style={styles.infoValue}>{orderData.orderSource}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>单据类型</div>
            <div style={styles.infoValue}>{orderData.orderType}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>销售方案</div>
            <div style={styles.infoValue}>{orderData.salesPlan}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>结算方式</div>
            <div style={styles.infoValue}>{orderData.settlementMethod}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>创建时间</div>
            <div style={styles.infoValue}>{orderData.createTime}</div>
          </div>
        </div>
      </div>

      {/* 产品信息卡片 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>产品信息</div>
        
        {/* 套餐产品 */}
        <div style={styles.sectionTitle}>套餐产品</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>套餐名称</th>
              <th style={styles.th}>年限</th>
              <th style={styles.th}>单价</th>
              <th style={styles.th}>优惠金额</th>
              <th style={styles.th}>数量</th>
              <th style={styles.th}>金额小计</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>{packageProduct.name}</td>
              <td style={styles.td}>{packageProduct.years}年</td>
              <td style={styles.td}>¥{packageProduct.unitPrice}</td>
              <td style={styles.td}>¥{packageProduct.discount}</td>
              <td style={styles.td}>{packageProduct.quantity}</td>
              <td style={styles.td}>¥{packageProduct.subtotal}</td>
              <td style={styles.td}>
                <button 
                  style={styles.detailBtn}
                  onClick={function() { setShowPackageDetail(!showPackageDetail) }}
                >
                  {showPackageDetail ? "收起" : "详情 >"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 套餐详情展开 - 安装部位结构化列表 */}
        {showPackageDetail && (
          <div style={styles.detailPanel}>
            {packageProduct.installParts.map(function(part, index) {
              var isLast = index === packageProduct.installParts.length - 1
              return (
                <div key={index} style={isLast ? styles.detailRowLast : styles.detailRow}>
                  <span style={{ minWidth: "100px" }}>{part.partName}</span>
                  <span style={styles.arrow}>→</span>
                  <span style={part.bindType === "product" ? styles.bindType : styles.bindTypeCategory}>
                    {part.bindType === "product" ? "指定产品" : "指定类别"}
                  </span>
                  <span>{part.targetName}</span>
                  {part.bindType === "category" && (
                    <span style={styles.grayText}>（安装时指定）</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 加购产品 */}
        <div style={styles.sectionTitle}>加购产品({addOnProducts.length})</div>
        {addOnProducts.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>安装部位</th>
                <th style={styles.th}>绑定方式</th>
                <th style={styles.th}>产品/类别名称</th>
                <th style={styles.th}>单价</th>
                <th style={styles.th}>数量</th>
                <th style={styles.th}>金额小计</th>
              </tr>
            </thead>
            <tbody>
              {addOnProducts.map(function(item, index) {
                return (
                  <tr key={index}>
                    <td style={styles.td}>{item.partName}</td>
                    <td style={styles.td}>
                      <span style={item.bindType === "product" ? styles.bindType : styles.bindTypeCategory}>
                        {item.bindType === "product" ? "指定产品" : "指定类别"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {item.targetName}
                      {item.bindType === "category" && (
                        <span style={styles.grayText}>（安装时指定）</span>
                      )}
                    </td>
                    <td style={styles.td}>¥{item.unitPrice}</td>
                    <td style={styles.td}>{item.quantity}</td>
                    <td style={styles.td}>¥{item.subtotal}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ color: "#999", fontSize: "14px", padding: "12px 0" }}>暂无数据</div>
        )}

        {/* 单产品 */}
        <div style={styles.sectionTitle}>单产品({singleProducts.length})</div>
        {singleProducts.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>产品名称</th>
                <th style={styles.th}>单价</th>
                <th style={styles.th}>优惠</th>
                <th style={styles.th}>数量</th>
                <th style={styles.th}>金额小计</th>
              </tr>
            </thead>
            <tbody>
              {singleProducts.map(function(item, index) {
                return (
                  <tr key={index}>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>¥{item.unitPrice}</td>
                    <td style={styles.td}>¥{item.discount}</td>
                    <td style={styles.td}>{item.quantity}</td>
                    <td style={styles.td}>¥{item.subtotal}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ color: "#999", fontSize: "14px", padding: "12px 0" }}>暂无数据</div>
        )}

        {/* 质保信息 */}
        <div style={styles.sectionTitle}>质保信息</div>
        <div style={styles.warrantyGrid}>
          <div style={styles.warrantyItem}>
            <div style={styles.warrantyLabel}>质保方案</div>
            <div style={styles.warrantyValue}>{warrantyInfo.planName}</div>
          </div>
          <div style={styles.warrantyItem}>
            <div style={styles.warrantyLabel}>质保状态</div>
            <div style={styles.warrantyValue}>
              {warrantyInfo.isGranted ? (
                <span style={styles.warrantyTag}>已赠送</span>
              ) : warrantyInfo.isPurchased ? (
                <span style={styles.warrantyTag}>已加购</span>
              ) : (
                <span style={styles.warrantyTagNo}>不含质保</span>
              )}
            </div>
          </div>
          {warrantyInfo.isPurchased && (
            <div style={styles.warrantyItem}>
              <div style={styles.warrantyLabel}>加购费用</div>
              <div style={styles.warrantyValue}>¥{warrantyInfo.purchaseFee}</div>
            </div>
          )}
          <div style={styles.warrantyItem}>
            <div style={styles.warrantyLabel}>监控服务</div>
            <div style={styles.warrantyValue}>
              {warrantyInfo.monitorServiceType === "free" ? "免费" : "¥" + warrantyInfo.monitorServiceFee + "/年"}
            </div>
          </div>
          <div style={styles.warrantyItem}>
            <div style={styles.warrantyLabel}>延保状态</div>
            <div style={styles.warrantyValue}>
              {warrantyInfo.isExtendedWarranty ? (
                <span style={styles.warrantyTag}>已购买</span>
              ) : (
                <span style={styles.warrantyTagNo}>未购买</span>
              )}
            </div>
          </div>
          {warrantyInfo.isExtendedWarranty && (
            <div style={styles.warrantyItem}>
              <div style={styles.warrantyLabel}>延保费用</div>
              <div style={styles.warrantyValue}>¥{warrantyInfo.extendedWarrantyFee}</div>
            </div>
          )}
        </div>
      </div>

      {/* 费用信息卡片 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>费用信息</div>
        <div style={styles.feeSummary}>
          <div style={styles.feeRow}>
            <span>套餐产品总额</span>
            <span>¥{feesSummary.packageTotal}</span>
          </div>
          <div style={styles.feeRow}>
            <span>加购产品总额</span>
            <span>¥{feesSummary.addOnTotal}</span>
          </div>
          <div style={styles.feeRow}>
            <span>单产品总额</span>
            <span>¥{feesSummary.singleTotal}</span>
          </div>
          <div style={styles.feeRow}>
            <span>质保加购费用</span>
            <span>¥{feesSummary.warrantyFee}</span>
          </div>
          <div style={styles.feeRow}>
            <span>监控服务费</span>
            <span>¥{feesSummary.monitorFee}</span>
          </div>
          <div style={styles.feeRow}>
            <span>延保费用</span>
            <span>¥{feesSummary.extendedFee}</span>
          </div>
          {feesSummary.additionalAmount > 0 && (
            <div style={styles.feeRow}>
              <span>附加金额</span>
              <span>¥{feesSummary.additionalAmount}</span>
            </div>
          )}
          {feesSummary.f1Amount > 0 && (
            <div style={styles.feeRow}>
              <span>F1金额</span>
              <span>¥{feesSummary.f1Amount}</span>
            </div>
          )}
          <div style={styles.feeRow}>
            <span>优惠金额</span>
            <span style={{ color: "#ff4d4f" }}>-¥{feesSummary.discountAmount}</span>
          </div>
          <div style={styles.feeDivider}></div>
          <div style={styles.totalRow}>
            <span>应收总额</span>
            <span style={styles.totalAmount}>¥{feesSummary.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div style={styles.actionBar}>
        <button style={styles.primaryBtn}>编辑订单</button>
        <button style={styles.secondaryBtn}>打印订单</button>
        <button style={styles.secondaryBtn}>导出PDF</button>
      </div>
    </div>
  )
}

export default Component
