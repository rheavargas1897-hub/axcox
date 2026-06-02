// @ts-nocheck
import React from "react"

const Component = () => {
  // 基本信息状态
  var _useState1 = React.useState("")
  var company = _useState1[0]
  var setCompany = _useState1[1]
  
  var _useState2 = React.useState("")
  var salesPerson = _useState2[0]
  var setSalesPerson = _useState2[1]
  
  var _useState3 = React.useState("")
  var contact = _useState3[0]
  var setContact = _useState3[1]
  
  var _useState4 = React.useState("")
  var phone = _useState4[0]
  var setPhone = _useState4[1]
  
  var _useState5 = React.useState("")
  var remark = _useState5[0]
  var setRemark = _useState5[1]
  
  var _useState6 = React.useState(false)
  var showOptional = _useState6[0]
  var setShowOptional = _useState6[1]
  
  var _useState7 = React.useState("")
  var installDate = _useState7[0]
  var setInstallDate = _useState7[1]
  
  var _useState8 = React.useState("")
  var installAddress = _useState8[0]
  var setInstallAddress = _useState8[1]
  
  var _useState9 = React.useState("")
  var area = _useState9[0]
  var setArea = _useState9[1]
  
  var _useState10 = React.useState("")
  var salesDate = _useState10[0]
  var setSalesDate = _useState10[1]

  // 订单类型状态
  var _useState11 = React.useState("normal")
  var orderSource = _useState11[0]
  var setOrderSource = _useState11[1]
  
  var _useState12 = React.useState("normal")
  var orderType = _useState12[0]
  var setOrderType = _useState12[1]
  
  var _useState13 = React.useState("normal")
  var salesPlan = _useState13[0]
  var setSalesPlan = _useState13[1]

  // 产品选择状态
  var _useState14 = React.useState("package")
  var productTab = _useState14[0]
  var setProductTab = _useState14[1]
  
  var _useState15 = React.useState("")
  var selectedPackage = _useState15[0]
  var setSelectedPackage = _useState15[1]
  
  var _useState16 = React.useState(1)
  var packageYears = _useState16[0]
  var setPackageYears = _useState16[1]
  
  var _useState17 = React.useState(false)
  var showPackageDetail = _useState17[0]
  var setShowPackageDetail = _useState17[1]

  // 加购产品状态
  var _useState18 = React.useState([])
  var addOnProducts = _useState18[0]
  var setAddOnProducts = _useState18[1]
  
  var _useState19 = React.useState(false)
  var showAddOnModal = _useState19[0]
  var setShowAddOnModal = _useState19[1]

  // 质保状态
  var _useState20 = React.useState(false)
  var purchaseWarranty = _useState20[0]
  var setPurchaseWarranty = _useState20[1]
  
  var _useState21 = React.useState(false)
  var purchaseExtendedWarranty = _useState21[0]
  var setPurchaseExtendedWarranty = _useState21[1]

  // 右侧概览状态
  var _useState22 = React.useState("batch_count")
  var orderMode = _useState22[0]
  var setOrderMode = _useState22[1]
  
  var _useState23 = React.useState(1)
  var vehicleCount = _useState23[0]
  var setVehicleCount = _useState23[1]
  
  var _useState24 = React.useState(false)
  var noInstallService = _useState24[0]
  var setNoInstallService = _useState24[1]
  
  var _useState25 = React.useState(false)
  var noSalesCommission = _useState25[0]
  var setNoSalesCommission = _useState25[1]
  
  var _useState26 = React.useState("cash")
  var settlementMethod = _useState26[0]
  var setSettlementMethod = _useState26[1]
  
  var _useState27 = React.useState(0)
  var additionalAmount = _useState27[0]
  var setAdditionalAmount = _useState27[1]
  
  var _useState28 = React.useState(0)
  var f1Amount = _useState28[0]
  var setF1Amount = _useState28[1]
  
  var _useState29 = React.useState(0)
  var discountAmount = _useState29[0]
  var setDiscountAmount = _useState29[1]

  // 模拟套餐数据
  var packageOptions = [
    { id: "pkg1", name: "商用车高级盲区监控套餐", price: 2980, years: 2 },
    { id: "pkg2", name: "乘用车基础定位套餐", price: 1580, years: 1 },
    { id: "pkg3", name: "冷链物流温控套餐", price: 3680, years: 3 },
  ]

  // 模拟安装部位数据
  var installParts = [
    { id: "part1", name: "前置摄像头", occupied: false },
    { id: "part2", name: "后置摄像头", occupied: true },
    { id: "part3", name: "车内监控", occupied: false },
    { id: "part4", name: "GPS定位器", occupied: false },
    { id: "part5", name: "OBD设备", occupied: false },
  ]

  // 计算费用
  var selectedPkg = packageOptions.find(function(p) { return p.id === selectedPackage })
  var packagePrice = selectedPkg ? selectedPkg.price * packageYears : 0
  var addOnTotal = addOnProducts.reduce(function(sum, item) { return sum + (item.unitPrice * item.quantity) }, 0)
  var warrantyFee = purchaseWarranty ? 200 * packageYears : 0
  var monitorFee = selectedPackage ? 100 * packageYears : 0
  var extendedWarrantyFee = purchaseExtendedWarranty ? 300 : 0
  var totalPerVehicle = packagePrice + addOnTotal + warrantyFee + monitorFee + extendedWarrantyFee + additionalAmount + f1Amount - discountAmount
  var totalAmount = totalPerVehicle * vehicleCount

  // 添加加购产品
  var handleAddProduct = function(partId, partName) {
    var newProduct = {
      id: Date.now(),
      installPartId: partId,
      installPartName: partName,
      bindType: "product",
      productName: "",
      unitPrice: 0,
      quantity: vehicleCount
    }
    setAddOnProducts(addOnProducts.concat([newProduct]))
    setShowAddOnModal(false)
  }

  // 删除加购产品
  var handleRemoveAddOn = function(id) {
    setAddOnProducts(addOnProducts.filter(function(item) { return item.id !== id }))
  }

  // 更新加购产品
  var handleUpdateAddOn = function(id, field, value) {
    setAddOnProducts(addOnProducts.map(function(item) {
      if (item.id === id) {
        var updated = {}
        for (var key in item) {
          updated[key] = item[key]
        }
        updated[field] = value
        return updated
      }
      return item
    }))
  }

  // 样式定义
  var styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      fontFamily: "Arial, sans-serif"
    },
    leftPanel: {
      flex: "0 0 65%",
      padding: "24px",
      overflowY: "auto" as const
    },
    rightPanel: {
      flex: "0 0 35%",
      backgroundColor: "#fafafa",
      padding: "24px",
      borderLeft: "1px solid #e8e8e8",
      position: "sticky" as const,
      top: 0,
      height: "100vh",
      overflowY: "auto" as const
    },
    pageTitle: {
      fontSize: "20px",
      fontWeight: "bold" as const,
      marginBottom: "24px",
      color: "#333"
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
      fontWeight: "bold" as const,
      marginBottom: "16px",
      color: "#333",
      borderBottom: "1px solid #f0f0f0",
      paddingBottom: "12px"
    },
    formRow: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: "16px",
      marginBottom: "16px"
    },
    formItem: {
      flex: "1 1 calc(50% - 8px)",
      minWidth: "200px"
    },
    label: {
      display: "block",
      marginBottom: "6px",
      fontSize: "14px",
      color: "#666"
    },
    required: {
      color: "#ff4d4f",
      marginRight: "4px"
    },
    input: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px",
      boxSizing: "border-box" as const
    },
    select: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px",
      backgroundColor: "#fff",
      boxSizing: "border-box" as const
    },
    textarea: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px",
      minHeight: "60px",
      resize: "vertical" as const,
      boxSizing: "border-box" as const
    },
    expandBtn: {
      background: "none",
      border: "none",
      color: "#1890ff",
      cursor: "pointer",
      fontSize: "14px",
      padding: "0"
    },
    radioGroup: {
      display: "flex",
      gap: "24px",
      alignItems: "center"
    },
    radioLabel: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      cursor: "pointer",
      fontSize: "14px"
    },
    radioInput: {
      cursor: "pointer"
    },
    tabContainer: {
      display: "flex",
      borderBottom: "1px solid #e8e8e8",
      marginBottom: "16px"
    },
    tab: {
      padding: "12px 24px",
      border: "none",
      background: "none",
      cursor: "pointer",
      fontSize: "14px",
      color: "#666",
      borderBottom: "2px solid transparent"
    },
    tabActive: {
      padding: "12px 24px",
      border: "none",
      background: "none",
      cursor: "pointer",
      fontSize: "14px",
      color: "#00C853",
      borderBottom: "2px solid #00C853",
      fontWeight: "bold" as const
    },
    packageItem: {
      display: "flex",
      alignItems: "center",
      padding: "12px",
      border: "1px solid #e8e8e8",
      borderRadius: "4px",
      marginBottom: "8px"
    },
    packageItemSelected: {
      display: "flex",
      alignItems: "center",
      padding: "12px",
      border: "1px solid #00C853",
      borderRadius: "4px",
      marginBottom: "8px",
      backgroundColor: "#f6ffed"
    },
    checkbox: {
      marginRight: "12px",
      cursor: "pointer"
    },
    packageName: {
      flex: 1,
      fontWeight: "bold" as const
    },
    packageField: {
      width: "80px",
      textAlign: "center" as const,
      marginRight: "16px"
    },
    smallInput: {
      width: "60px",
      padding: "4px 8px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      textAlign: "center" as const
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
      padding: "12px",
      borderRadius: "4px",
      marginTop: "8px",
      marginLeft: "32px"
    },
    detailRow: {
      display: "flex",
      alignItems: "center",
      padding: "6px 0",
      fontSize: "13px",
      color: "#666"
    },
    addBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px",
      border: "1px dashed #00C853",
      borderRadius: "4px",
      backgroundColor: "#fff",
      color: "#00C853",
      cursor: "pointer",
      fontSize: "14px",
      width: "100%"
    },
    addBtnHover: {
      border: "1px solid #00C853"
    },
    modal: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "24px",
      width: "500px",
      maxHeight: "80vh",
      overflowY: "auto" as const
    },
    modalTitle: {
      fontSize: "16px",
      fontWeight: "bold" as const,
      marginBottom: "16px"
    },
    modalClose: {
      position: "absolute" as const,
      top: "16px",
      right: "16px",
      background: "none",
      border: "none",
      fontSize: "20px",
      cursor: "pointer"
    },
    partItem: {
      display: "flex",
      alignItems: "center",
      padding: "12px",
      border: "1px solid #e8e8e8",
      borderRadius: "4px",
      marginBottom: "8px",
      cursor: "pointer"
    },
    partItemDisabled: {
      display: "flex",
      alignItems: "center",
      padding: "12px",
      border: "1px solid #e8e8e8",
      borderRadius: "4px",
      marginBottom: "8px",
      backgroundColor: "#f5f5f5",
      color: "#999",
      cursor: "not-allowed"
    },
    addOnTable: {
      width: "100%",
      borderCollapse: "collapse" as const,
      fontSize: "14px"
    },
    th: {
      padding: "10px",
      textAlign: "left" as const,
      borderBottom: "1px solid #e8e8e8",
      backgroundColor: "#fafafa",
      fontWeight: "normal" as const,
      color: "#666"
    },
    td: {
      padding: "10px",
      borderBottom: "1px solid #e8e8e8"
    },
    deleteBtn: {
      background: "none",
      border: "none",
      color: "#ff4d4f",
      cursor: "pointer"
    },
    warrantyTag: {
      display: "inline-block",
      padding: "4px 12px",
      backgroundColor: "#f6ffed",
      color: "#52c41a",
      borderRadius: "4px",
      fontSize: "13px"
    },
    switchContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    switch: {
      width: "44px",
      height: "22px",
      borderRadius: "11px",
      backgroundColor: "#ccc",
      cursor: "pointer",
      position: "relative" as const,
      transition: "background-color 0.3s"
    },
    switchOn: {
      width: "44px",
      height: "22px",
      borderRadius: "11px",
      backgroundColor: "#00C853",
      cursor: "pointer",
      position: "relative" as const,
      transition: "background-color 0.3s"
    },
    switchHandle: {
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      position: "absolute" as const,
      top: "2px",
      left: "2px",
      transition: "left 0.3s"
    },
    switchHandleOn: {
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      position: "absolute" as const,
      top: "2px",
      left: "24px",
      transition: "left 0.3s"
    },
    summaryTitle: {
      fontSize: "16px",
      fontWeight: "bold" as const,
      marginBottom: "16px",
      color: "#333"
    },
    summaryItem: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      fontSize: "14px",
      borderBottom: "1px solid #f0f0f0"
    },
    summaryLabel: {
      color: "#666"
    },
    summaryValue: {
      color: "#333"
    },
    feeRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      fontSize: "14px"
    },
    feeDivider: {
      borderTop: "1px dashed #e8e8e8",
      margin: "12px 0"
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      fontSize: "16px",
      fontWeight: "bold" as const
    },
    totalAmount: {
      fontSize: "24px",
      color: "#00C853",
      fontWeight: "bold" as const
    },
    submitBtn: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#00C853",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      fontSize: "16px",
      fontWeight: "bold" as const,
      cursor: "pointer",
      marginTop: "20px"
    },
    backLink: {
      display: "inline-block",
      marginBottom: "16px",
      color: "#1890ff",
      textDecoration: "none",
      fontSize: "14px"
    },
    modeTab: {
      display: "flex",
      marginBottom: "16px"
    },
    modeBtn: {
      flex: 1,
      padding: "10px",
      border: "1px solid #d9d9d9",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontSize: "13px"
    },
    modeBtnActive: {
      flex: 1,
      padding: "10px",
      border: "1px solid #00C853",
      backgroundColor: "#f6ffed",
      color: "#00C853",
      cursor: "pointer",
      fontSize: "13px"
    },
    checkboxLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      cursor: "pointer",
      marginBottom: "8px"
    }
  }

  return (
    <div style={styles.container}>
      {/* 左侧表单区 */}
      <div style={styles.leftPanel}>
        <a href="/" style={styles.backLink}>{"< 返回销售单列表"}</a>
        <h1 style={styles.pageTitle}>新建销售单</h1>

        {/* 模块1：基本信息 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>基本信息</div>
          <div style={styles.formRow}>
            <div style={styles.formItem}>
              <label style={styles.label}>
                <span style={styles.required}>*</span>下单公司
              </label>
              <select 
                style={styles.select} 
                value={company} 
                onChange={function(e) { setCompany(e.target.value) }}
              >
                <option value="">请选择下单公司</option>
                <option value="company1">深圳市安达物流有限公司</option>
                <option value="company2">广州市顺风运输有限公司</option>
                <option value="company3">东莞市捷运物流有限公司</option>
              </select>
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}>
                <span style={styles.required}>*</span>销售人员
              </label>
              <select 
                style={styles.select} 
                value={salesPerson} 
                onChange={function(e) { setSalesPerson(e.target.value) }}
              >
                <option value="">请选择销售人员</option>
                <option value="sales1">张三</option>
                <option value="sales2">李四</option>
                <option value="sales3">王五</option>
              </select>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formItem}>
              <label style={styles.label}>联系人</label>
              <input 
                type="text" 
                style={styles.input} 
                placeholder="请输入联系人姓名"
                value={contact}
                onChange={function(e) { setContact(e.target.value) }}
              />
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}>手机号码</label>
              <input 
                type="text" 
                style={styles.input} 
                placeholder="请输入11位手机号"
                value={phone}
                onChange={function(e) { setPhone(e.target.value) }}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>下单备注</label>
              <textarea 
                style={styles.textarea} 
                placeholder="请输入备注信息"
                value={remark}
                onChange={function(e) { setRemark(e.target.value) }}
              />
            </div>
          </div>
          <button 
            style={styles.expandBtn}
            onClick={function() { setShowOptional(!showOptional) }}
          >
            {showOptional ? "收起选填区域 ▲" : "展开选填区域 ▼"}
          </button>
          {showOptional && (
            <div style={{ marginTop: "16px" }}>
              <div style={styles.formRow}>
                <div style={styles.formItem}>
                  <label style={styles.label}>安装日期</label>
                  <input 
                    type="date" 
                    style={styles.input}
                    value={installDate}
                    onChange={function(e) { setInstallDate(e.target.value) }}
                  />
                </div>
                <div style={styles.formItem}>
                  <label style={styles.label}>销售日期</label>
                  <input 
                    type="date" 
                    style={styles.input}
                    value={salesDate}
                    onChange={function(e) { setSalesDate(e.target.value) }}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formItem}>
                  <label style={styles.label}>安装地址</label>
                  <input 
                    type="text" 
                    style={styles.input}
                    placeholder="请输入安装地址"
                    value={installAddress}
                    onChange={function(e) { setInstallAddress(e.target.value) }}
                  />
                </div>
                <div style={styles.formItem}>
                  <label style={styles.label}>区域</label>
                  <select 
                    style={styles.select}
                    value={area}
                    onChange={function(e) { setArea(e.target.value) }}
                  >
                    <option value="">请选择区域</option>
                    <option value="area1">华南区</option>
                    <option value="area2">华东区</option>
                    <option value="area3">华北区</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 模块2：订单类型 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>订单类型</div>
          <div style={styles.formRow}>
            <div style={styles.formItem}>
              <label style={styles.label}>单据来源</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="orderSource" 
                    value="normal"
                    checked={orderSource === "normal"}
                    onChange={function(e) { setOrderSource(e.target.value) }}
                    style={styles.radioInput}
                  />
                  普通
                </label>
                <label style={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="orderSource" 
                    value="complaint"
                    checked={orderSource === "complaint"}
                    onChange={function(e) { setOrderSource(e.target.value) }}
                    style={styles.radioInput}
                  />
                  投诉
                </label>
              </div>
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}>单据类型</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="orderType" 
                    value="normal"
                    checked={orderType === "normal"}
                    onChange={function(e) { setOrderType(e.target.value) }}
                    style={styles.radioInput}
                  />
                  普通
                </label>
                <label style={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="orderType" 
                    value="group"
                    checked={orderType === "group"}
                    onChange={function(e) { setOrderType(e.target.value) }}
                    style={styles.radioInput}
                  />
                  团单
                </label>
              </div>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>销售方案</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="salesPlan" 
                    value="normal"
                    checked={salesPlan === "normal"}
                    onChange={function(e) { setSalesPlan(e.target.value) }}
                    style={styles.radioInput}
                  />
                  普通销售
                </label>
                <label style={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="salesPlan" 
                    value="rent"
                    checked={salesPlan === "rent"}
                    onChange={function(e) { setSalesPlan(e.target.value) }}
                    style={styles.radioInput}
                  />
                  以租代购
                </label>
                <label style={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name="salesPlan" 
                    value="discount"
                    checked={salesPlan === "discount"}
                    onChange={function(e) { setSalesPlan(e.target.value) }}
                    style={styles.radioInput}
                  />
                  特惠套餐
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 模块3：产品选择 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>产品选择</div>
          <div style={styles.tabContainer}>
            <button 
              style={productTab === "package" ? styles.tabActive : styles.tab}
              onClick={function() { setProductTab("package") }}
            >
              套餐产品
            </button>
            <button 
              style={productTab === "single" ? styles.tabActive : styles.tab}
              onClick={function() { setProductTab("single") }}
            >
              单产品
            </button>
          </div>

          {productTab === "package" && (
            <div>
              <select 
                style={styles.select}
                value={selectedPackage}
                onChange={function(e) { setSelectedPackage(e.target.value) }}
              >
                <option value="">搜索并选择套餐</option>
                {packageOptions.map(function(pkg) {
                  return (
                    <option key={pkg.id} value={pkg.id}>{pkg.name} - ¥{pkg.price}</option>
                  )
                })}
              </select>

              {selectedPackage && (
                <div style={{ marginTop: "16px" }}>
                  {packageOptions.filter(function(p) { return p.id === selectedPackage }).map(function(pkg) {
                    return (
                      <div key={pkg.id} style={styles.packageItemSelected}>
                        <input type="checkbox" checked readOnly style={styles.checkbox} />
                        <span style={styles.packageName}>{pkg.name}</span>
                        <span style={styles.packageField}>
                          <input 
                            type="number" 
                            style={styles.smallInput}
                            value={packageYears}
                            onChange={function(e) { setPackageYears(Number(e.target.value) || 1) }}
                            min="1"
                          />
                          年
                        </span>
                        <span style={styles.packageField}>¥{pkg.price}</span>
                        <span style={styles.packageField}>x 1</span>
                        <span style={styles.packageField}>¥{pkg.price * packageYears}</span>
                        <button 
                          style={styles.detailBtn}
                          onClick={function() { setShowPackageDetail(!showPackageDetail) }}
                        >
                          {showPackageDetail ? "收起" : "详情"}
                        </button>
                      </div>
                    )
                  })}
                  {showPackageDetail && (
                    <div style={styles.detailPanel}>
                      <div style={styles.detailRow}>
                        <span>前置摄像头</span>
                        <span style={{ margin: "0 8px" }}>→</span>
                        <span>指定产品</span>
                        <span style={{ margin: "0 8px" }}>→</span>
                        <span>海康威视 DS-2CD3T45FP</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span>后置摄像头</span>
                        <span style={{ margin: "0 8px" }}>→</span>
                        <span>指定类别</span>
                        <span style={{ margin: "0 8px" }}>→</span>
                        <span>高清摄像头</span>
                        <span style={{ marginLeft: "8px", color: "#999" }}>安装时指定具体设备</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span>GPS定位器</span>
                        <span style={{ margin: "0 8px" }}>→</span>
                        <span>指定产品</span>
                        <span style={{ margin: "0 8px" }}>→</span>
                        <span>途强 GT06N</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {productTab === "single" && (
            <div>
              <select style={styles.select}>
                <option value="">搜索并选择单产品</option>
                <option value="prod1">海康威视 DS-2CD3T45FP - ¥580</option>
                <option value="prod2">途强 GT06N GPS定位器 - ¥320</option>
                <option value="prod3">大华 DH-HAC-HDW1200E - ¥450</option>
              </select>
            </div>
          )}
        </div>

        {/* 模块4：加购产品 */}
        {selectedPackage && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>加购产品</div>
            
            {addOnProducts.length > 0 && (
              <table style={styles.addOnTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>安装部位</th>
                    <th style={styles.th}>绑定方式</th>
                    <th style={styles.th}>产品/类别</th>
                    <th style={styles.th}>单价</th>
                    <th style={styles.th}>数量</th>
                    <th style={styles.th}>小计</th>
                    <th style={styles.th}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {addOnProducts.map(function(item) {
                    return (
                      <tr key={item.id}>
                        <td style={styles.td}>{item.installPartName}</td>
                        <td style={styles.td}>
                          <select 
                            style={{ padding: "4px", fontSize: "13px" }}
                            value={item.bindType}
                            onChange={function(e) { handleUpdateAddOn(item.id, "bindType", e.target.value) }}
                          >
                            <option value="product">指定产品</option>
                            <option value="category">指定类别</option>
                          </select>
                        </td>
                        <td style={styles.td}>
                          <select 
                            style={{ padding: "4px", fontSize: "13px", width: "120px" }}
                            value={item.productName}
                            onChange={function(e) { 
                              handleUpdateAddOn(item.id, "productName", e.target.value)
                              if (e.target.value) {
                                handleUpdateAddOn(item.id, "unitPrice", 380)
                              }
                            }}
                          >
                            <option value="">请选择</option>
                            <option value="prod1">海康摄像头</option>
                            <option value="prod2">大华摄像头</option>
                          </select>
                        </td>
                        <td style={styles.td}>
                          <input 
                            type="number" 
                            style={{ width: "60px", padding: "4px" }}
                            value={item.unitPrice}
                            onChange={function(e) { handleUpdateAddOn(item.id, "unitPrice", Number(e.target.value)) }}
                          />
                        </td>
                        <td style={styles.td}>{item.quantity}</td>
                        <td style={styles.td}>¥{item.unitPrice * item.quantity}</td>
                        <td style={styles.td}>
                          <button 
                            style={styles.deleteBtn}
                            onClick={function() { handleRemoveAddOn(item.id) }}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            <button 
              style={styles.addBtn}
              onClick={function() { setShowAddOnModal(true) }}
            >
              + 加购产品
            </button>
          </div>
        )}

        {/* 模块5：质保信息 */}
        {selectedPackage && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>质保信息</div>
            <div style={{ marginBottom: "16px" }}>
              <span style={styles.warrantyTag}>已赠送质保</span>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={styles.switchContainer}>
                <span style={{ fontSize: "14px" }}>加购质保</span>
                <div 
                  style={purchaseWarranty ? styles.switchOn : styles.switch}
                  onClick={function() { setPurchaseWarranty(!purchaseWarranty) }}
                >
                  <div style={purchaseWarranty ? styles.switchHandleOn : styles.switchHandle}></div>
                </div>
                {purchaseWarranty && <span style={{ color: "#666", fontSize: "13px" }}>¥200/年</span>}
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>
                监控服务费：¥100/年 {packageYears > 1 && <span>(共 ¥{100 * packageYears})</span>}
              </div>
            </div>
            <div>
              <div style={styles.switchContainer}>
                <span style={{ fontSize: "14px" }}>购买延保</span>
                <div 
                  style={purchaseExtendedWarranty ? styles.switchOn : styles.switch}
                  onClick={function() { setPurchaseExtendedWarranty(!purchaseExtendedWarranty) }}
                >
                  <div style={purchaseExtendedWarranty ? styles.switchHandleOn : styles.switchHandle}></div>
                </div>
                {purchaseExtendedWarranty && <span style={{ color: "#666", fontSize: "13px" }}>¥300</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 右侧信息概览区 */}
      <div style={styles.rightPanel}>
        <div style={styles.summaryTitle}>下单信息概览</div>

        {/* 下单方式 */}
        <div style={{ marginBottom: "20px" }}>
          <label style={styles.label}>下单方式</label>
          <div style={styles.modeTab}>
            <button 
              style={orderMode === "batch_count" ? styles.modeBtnActive : styles.modeBtn}
              onClick={function() { setOrderMode("batch_count") }}
            >
              按台数批量下单
            </button>
            <button 
              style={orderMode === "batch_vehicle" ? styles.modeBtnActive : styles.modeBtn}
              onClick={function() { setOrderMode("batch_vehicle") }}
            >
              按指定车辆下单
            </button>
          </div>
          <div>
            <label style={styles.label}>车辆台数</label>
            <input 
              type="number" 
              style={styles.input}
              value={vehicleCount}
              onChange={function(e) { setVehicleCount(Number(e.target.value) || 1) }}
              min="1"
            />
          </div>
        </div>

        {/* 信息摘要 */}
        <div style={{ marginBottom: "20px" }}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>下单公司</span>
            <span style={styles.summaryValue}>{company ? (company === "company1" ? "深圳市安达物流有限公司" : company === "company2" ? "广州市顺风运输有限公司" : "东莞市捷运物流有限公司") : "-"}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>销售人员</span>
            <span style={styles.summaryValue}>{salesPerson ? (salesPerson === "sales1" ? "张三" : salesPerson === "sales2" ? "李四" : "王五") : "-"}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>联系人</span>
            <span style={styles.summaryValue}>{contact || "-"}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>手机号</span>
            <span style={styles.summaryValue}>{phone || "-"}</span>
          </div>
        </div>

        {/* 服务选项 */}
        <div style={{ marginBottom: "20px" }}>
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={noInstallService}
              onChange={function() { setNoInstallService(!noInstallService) }}
            />
            不需要安装服务
          </label>
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={noSalesCommission}
              onChange={function() { setNoSalesCommission(!noSalesCommission) }}
            />
            不计算销售提成
          </label>
        </div>

        {/* 费用明细 */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: "bold" as const, marginBottom: "12px" }}>费用明细</div>
          {selectedPkg && (
            <div style={styles.feeRow}>
              <span>{selectedPkg.name}</span>
              <span>¥{packagePrice} ({packageYears}年)</span>
            </div>
          )}
          {addOnTotal > 0 && (
            <div style={styles.feeRow}>
              <span>加购产品总额</span>
              <span>¥{addOnTotal}</span>
            </div>
          )}
          {purchaseWarranty && (
            <div style={styles.feeRow}>
              <span>质保加购费用</span>
              <span>¥{warrantyFee}</span>
            </div>
          )}
          {selectedPackage && (
            <div style={styles.feeRow}>
              <span>监控服务费</span>
              <span>¥{monitorFee}</span>
            </div>
          )}
          {purchaseExtendedWarranty && (
            <div style={styles.feeRow}>
              <span>延保费用</span>
              <span>¥{extendedWarrantyFee}</span>
            </div>
          )}
          <div style={styles.feeDivider}></div>
          <div style={styles.feeRow}>
            <span>销售总额 / 台</span>
            <span>¥{totalPerVehicle}</span>
          </div>
        </div>

        {/* 结算与调整 */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: "bold" as const, marginBottom: "12px" }}>结算与调整</div>
          <div style={{ marginBottom: "12px" }}>
            <label style={styles.label}>结算方式</label>
            <div style={styles.modeTab}>
              <button 
                style={settlementMethod === "cash" ? styles.modeBtnActive : styles.modeBtn}
                onClick={function() { setSettlementMethod("cash") }}
              >
                现结
              </button>
              <button 
                style={settlementMethod === "credit" ? styles.modeBtnActive : styles.modeBtn}
                onClick={function() { setSettlementMethod("credit") }}
              >
                记账
              </button>
              <button 
                style={settlementMethod === "after_install" ? styles.modeBtnActive : styles.modeBtn}
                onClick={function() { setSettlementMethod("after_install") }}
              >
                安装后收费
              </button>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>附加金额</label>
              <input 
                type="number" 
                style={styles.input}
                value={additionalAmount}
                onChange={function(e) { setAdditionalAmount(Number(e.target.value) || 0) }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>F1金额</label>
              <input 
                type="number" 
                style={styles.input}
                value={f1Amount}
                onChange={function(e) { setF1Amount(Number(e.target.value) || 0) }}
              />
            </div>
          </div>
          <div>
            <label style={styles.label}>优惠金额</label>
            <input 
              type="number" 
              style={styles.input}
              value={discountAmount}
              onChange={function(e) { setDiscountAmount(Number(e.target.value) || 0) }}
            />
          </div>
        </div>

        {/* 应收金额 */}
        <div style={{ marginBottom: "20px", padding: "16px", backgroundColor: "#f6ffed", borderRadius: "8px" }}>
          <div style={styles.totalRow}>
            <span>应收金额</span>
            <span style={styles.totalAmount}>¥{totalAmount}</span>
          </div>
        </div>

        {/* 底部 */}
        <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
          车辆数：{vehicleCount} 台 <a href="#" style={{ color: "#1890ff" }}>查看明细</a>
        </div>
        <button style={styles.submitBtn}>确认订单</button>
      </div>

      {/* 加购产品弹窗 */}
      {showAddOnModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalTitle}>选择安装部位</div>
            {installParts.map(function(part) {
              var isOccupied = part.occupied || addOnProducts.some(function(p) { return p.installPartId === part.id })
              return (
                <div 
                  key={part.id}
                  style={isOccupied ? styles.partItemDisabled : styles.partItem}
                  onClick={function() { 
                    if (!isOccupied) {
                      handleAddProduct(part.id, part.name)
                    }
                  }}
                  title={isOccupied ? "已在套餐中配置或已选择" : ""}
                >
                  <input 
                    type="checkbox" 
                    disabled={isOccupied}
                    style={{ marginRight: "12px" }}
                  />
                  <span>{part.name}</span>
                  {isOccupied && <span style={{ marginLeft: "auto", fontSize: "12px" }}>已配置</span>}
                </div>
              )
            })}
            <div style={{ marginTop: "16px", textAlign: "right" as const }}>
              <button 
                style={{ padding: "8px 16px", marginRight: "8px", border: "1px solid #d9d9d9", borderRadius: "4px", backgroundColor: "#fff", cursor: "pointer" }}
                onClick={function() { setShowAddOnModal(false) }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Component
