// @ts-nocheck
import React from "react"

// ============ CreateOrder 组件（右侧抽屉内容）============
var CreateOrderContent = function(props) {
  var onClose = props.onClose

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

  // 质保状态
  var _useState16 = React.useState(false)
  var purchaseWarranty = _useState16[0]
  var setPurchaseWarranty = _useState16[1]
  
  var _useState17 = React.useState(1)
  var warrantyYears = _useState17[0]
  var setWarrantyYears = _useState17[1]

  var _useState17a = React.useState({
    "网约车": 1,
    "货运车": 2,
    "出租车": 0
  })
  var warrantyQuantities = _useState17a[0]
  var setWarrantyQuantities = _useState17a[1]

  // 右侧概览状态
  var _useState18 = React.useState("batch_count")
  var orderMode = _useState18[0]
  var setOrderMode = _useState18[1]
  
  var _useState19 = React.useState(1)
  var vehicleCount = _useState19[0]
  var setVehicleCount = _useState19[1]
  
  var _useState20 = React.useState("")
  var plateNumber = _useState20[0]
  var setPlateNumber = _useState20[1]
  
  var _useState21 = React.useState(0)
  var additionalAmount = _useState21[0]
  var setAdditionalAmount = _useState21[1]
  
  var _useState22 = React.useState(0)
  var f1Amount = _useState22[0]
  var setF1Amount = _useState22[1]
  
  var _useState23 = React.useState(0)
  var discountAmount = _useState23[0]
  var setDiscountAmount = _useState23[1]

  var _useState23f = React.useState(0)
  var extraChargeAmount = _useState23f[0]
  var setExtraChargeAmount = _useState23f[1]

  var _useState23a = React.useState(false)
  var needInstallService = _useState23a[0]
  var setNeedInstallService = _useState23a[1]

  var _useState23b = React.useState(false)
  var needSalesCommission = _useState23b[0]
  var setNeedSalesCommission = _useState23b[1]

  var _useState23c = React.useState("")
  var settlementMethod = _useState23c[0]
  var setSettlementMethod = _useState23c[1]

  var _useState23d = React.useState("")
  var extraChargeReason = _useState23d[0]
  var setExtraChargeReason = _useState23d[1]

  var _useState23e = React.useState("")
  var submitError = _useState23e[0]
  var setSubmitError = _useState23e[1]

  var _useState23g = React.useState(null)
  var deviceModalCategory = _useState23g[0]
  var setDeviceModalCategory = _useState23g[1]

  // 加购配置状态
  var _useState24 = React.useState(false)
  var showAddOnForm = _useState24[0]
  var setShowAddOnForm = _useState24[1]
  
  var _useState25 = React.useState("")
  var addOnPart = _useState25[0]
  var setAddOnPart = _useState25[1]
  
  var _useState26 = React.useState("product")
  var addOnBindType = _useState26[0]
  var setAddOnBindType = _useState26[1]
  
  var _useState27 = React.useState("")
  var addOnTarget = _useState27[0]
  var setAddOnTarget = _useState27[1]
  
  var _useState28 = React.useState(0)
  var addOnPrice = _useState28[0]
  var setAddOnPrice = _useState28[1]

  var _useState28a = React.useState(1)
  var addOnQuantity = _useState28a[0]
  var setAddOnQuantity = _useState28a[1]

  // Mock套餐数据
  var mockPackages = [
    {
      id: "pkg001",
      name: "网约车（粤A）",
      years: 2,
      unitPrice: 500,
      discount: 0,
      supportAddOn: true,
      addOnProducts: [],
      installParts: [
        { part: "前方摄像头", bindType: "product", target: "海康威视 DS-2CD2T47G2", quantity: 2 },
        { part: "盲区摄像头", bindType: "category", target: "广角摄像头类" },
        { part: "北斗定位", bindType: "product", target: "华为 MT700 定位终端", quantity: 1 },
        { part: "主机", bindType: "product", target: "锐明 G600", quantity: 1 }
      ]
    },
    {
      id: "pkg002",
      name: "货运车（粤B）",
      years: 3,
      unitPrice: 800,
      discount: 50,
      supportAddOn: false,
      addOnProducts: [],
      installParts: [
        { part: "前方摄像头", bindType: "product", target: "大华 DH-IPC-HFW2431", quantity: 1 },
        { part: "GPS定位", bindType: "product", target: "博实结 BX110", quantity: 1 }
      ]
    },
    {
      id: "pkg003",
      name: "出租车套餐",
      years: 1,
      unitPrice: 600,
      discount: 0,
      supportAddOn: true,
      addOnProducts: [],
      installParts: [
        { part: "车内摄像头", bindType: "category", target: "车内广角类" },
        { part: "北斗定位", bindType: "product", target: "华为 MT700 定位终端", quantity: 1 },
        { part: "报警按钮", bindType: "product", target: "SOS-200", quantity: 1 }
      ]
    }
  ]

  // 可选安装部位
  var allInstallParts = [
    "前方摄像头", "盲区摄像头", "北斗定位", "主机",
    "左侧摄像头", "右侧摄像头", "OBD接口", "车内摄像头",
    "GPS定位", "报警按钮", "倒车摄像头", "行车记录仪"
  ]

  // 可选产品
  var availableProducts = [
    { id: "p1", name: "海康威视 DS-2CD2T47G2", price: 300 },
    { id: "p2", name: "大华 DH-IPC-HFW2431", price: 280 },
    { id: "p3", name: "华为 MT700 定位终端", price: 350 },
    { id: "p4", name: "锐明 G600", price: 450 },
    { id: "p5", name: "博实结 BX110", price: 200 }
  ]

  // 可选类别
  var availableCategories = [
    "广角摄像头类", "高清摄像头类", "车内广角类", "盲区传感器类", "OBD诊断设备类"
  ]

  // 质保信息
  var mockWarranty = {
    planName: "标准质保方案A",
    isGranted: false,
    giftedYears: 1,
    supportPurchase: true,
    pricePerYear: 200,
    warrantyVehicleRows: [
      { vehicleType: "网约车", count: 1, type: "paid" },
      { vehicleType: "货运车", count: 2, type: "paid" },
      { vehicleType: "出租车", count: 2, type: "paid" }
    ],
    monitorServices: [
      { vehicleType: "网约车", type: "free", feePerYear: 0 },
      { vehicleType: "货运车", type: "paid", feePerYear: 100 },
      { vehicleType: "出租车", type: "paid", feePerYear: 150 }
    ]
  }

  var mockSingleWarranty = {
    planName: "标准质保方案A",
    isGranted: false,
    giftedYears: 1,
    supportPurchase: true,
    pricePerYear: 200
  }

  var categoryDeviceMap = {
    "广角摄像头类": [
      { name: "大华广角摄像头 A100", brand: "大华", model: "DH-WA100" },
      { name: "海康广角摄像头 H200", brand: "海康威视", model: "HK-WH200" }
    ],
    "车内广角类": [
      { name: "锐明车内广角 C1", brand: "锐明", model: "RM-C1" },
      { name: "海康车内广角 C2", brand: "海康威视", model: "HK-C2" }
    ],
    "OBD诊断设备类": [
      { name: "博实结 OBD Pro", brand: "博实结", model: "BX-OBD-PRO" },
      { name: "途强 OBD Lite", brand: "途强", model: "TQ-OBD-L" }
    ],
    "盲区传感器类": [
      { name: "云凡盲区雷达 S1", brand: "云凡", model: "YF-S1" },
      { name: "锐明盲区雷达 R2", brand: "锐明", model: "RM-R2" }
    ]
  }

  // 套餐状态管理
  var _useState29 = React.useState(mockPackages)
  var packageList = _useState29[0]
  var setPackageList = _useState29[1]

  var _useState30 = React.useState([
    { id: "single001", name: "SIM卡-物联卡-云凡-30M", unitPrice: 10, quantity: 1, selected: true },
    { id: "single002", name: "SIM卡-物联卡-云凡-100M", unitPrice: 10, quantity: 2, selected: true },
    { id: "single003", name: "行车记录仪支架", unitPrice: 50, quantity: 1, selected: false }
  ])
  var singleProductList = _useState30[0]
  var setSingleProductList = _useState30[1]

  // 获取选中的套餐
  var getSelectedPackageData = function() {
    for (var i = 0; i < packageList.length; i++) {
      if (packageList[i].id === selectedPackage) {
        return packageList[i]
      }
    }
    return null
  }

  // 更新套餐年限
  var updatePackageYears = function(pkgId, years) {
    var newList = packageList.map(function(pkg) {
      if (pkg.id === pkgId) {
        return Object.assign({}, pkg, { years: years })
      }
      return pkg
    })
    setPackageList(newList)
    // 如果质保年限超过套餐年限，自动调整
    if (warrantyYears > years) {
      setWarrantyYears(years)
    }
  }

  // 更新套餐优惠
  var updatePackageDiscount = function(pkgId, discount) {
    var newList = packageList.map(function(pkg) {
      if (pkg.id === pkgId) {
        return Object.assign({}, pkg, { discount: discount })
      }
      return pkg
    })
    setPackageList(newList)
  }

  // 添加加购产品
  var handleAddOnConfirm = function() {
    if (!addOnPart || !addOnTarget) return
    var price = addOnPrice
    if (addOnBindType === "product") {
      for (var i = 0; i < availableProducts.length; i++) {
        if (availableProducts[i].name === addOnTarget) {
          price = availableProducts[i].price
          break
        }
      }
    }
    var newAddOn = {
      part: addOnPart,
      bindType: addOnBindType,
      target: addOnTarget,
      price: price,
      quantity: addOnQuantity
    }
    var newList = packageList.map(function(pkg) {
      if (pkg.id === selectedPackage) {
        var newAddOns = pkg.addOnProducts.slice()
        newAddOns.push(newAddOn)
        return Object.assign({}, pkg, { addOnProducts: newAddOns })
      }
      return pkg
    })
    setPackageList(newList)
    setShowAddOnForm(false)
    setAddOnPart("")
    setAddOnBindType("product")
    setAddOnTarget("")
    setAddOnPrice(0)
    setAddOnQuantity(1)
  }

  // 移除加购产品
  var handleRemoveAddOn = function(part) {
    var newList = packageList.map(function(pkg) {
      if (pkg.id === selectedPackage) {
        var newAddOns = pkg.addOnProducts.filter(function(a) {
          return a.part !== part
        })
        return Object.assign({}, pkg, { addOnProducts: newAddOns })
      }
      return pkg
    })
    setPackageList(newList)
  }

  // 获取已占用的安装部位
  var getOccupiedParts = function() {
    var pkg = getSelectedPackageData()
    if (!pkg) return []
    var occupied = []
    pkg.installParts.forEach(function(p) {
      occupied.push(p.part)
    })
    pkg.addOnProducts.forEach(function(p) {
      occupied.push(p.part)
    })
    return occupied
  }

  // 计算费用
  var calcPackagePrice = function() {
    var pkg = getSelectedPackageData()
    if (!pkg) return 0
    return (pkg.unitPrice - pkg.discount) * vehicleCount
  }

  var calcAddOnPrice = function() {
    var pkg = getSelectedPackageData()
    if (!pkg) return 0
    var total = 0
    pkg.addOnProducts.forEach(function(a) {
      total = total + a.price * (a.quantity || 1)
    })
    return total
  }

  var calcWarrantyPrice = function() {
    if (!purchaseWarranty) return 0
    var pkg = getSelectedPackageData()
    var years = pkg ? pkg.years : 1
    var total = 0
    getWarrantyVehicleRows().forEach(function(row) {
      if (row.type === "paid") {
        var quantity = warrantyQuantities[row.vehicleType] || 0
        total = total + mockWarranty.pricePerYear * years * quantity
      }
    })
    return total
  }

  var calcMonitorPrice = function() {
    var pkg = getSelectedPackageData()
    if (!pkg) return 0
    if (!mockWarranty.monitorServices || mockWarranty.monitorServices.length === 0) return 0
    var total = 0
    mockWarranty.monitorServices.forEach(function(item) {
      if (item.type === "paid") {
        total = total + item.feePerYear * pkg.years
      }
    })
    return total * vehicleCount
  }

  var calcSelectedSingleProducts = function() {
    return singleProductList.filter(function(product) {
      return product.selected
    })
  }

  var calcSingleProductPrice = function() {
    var total = 0
    calcSelectedSingleProducts().forEach(function(product) {
      total = total + product.unitPrice * product.quantity
    })
    return total
  }

  var calcPackageSubtotal = function() {
    return calcPackagePrice() + calcAddOnPrice() + calcWarrantyPrice()
  }

  var getCategoryDevices = function(categoryName) {
    return categoryDeviceMap[categoryName] || [
      { name: categoryName + " 标准设备 A", brand: "云凡", model: "STD-A" },
      { name: categoryName + " 标准设备 B", brand: "云凡", model: "STD-B" }
    ]
  }

  var getWarrantyVehicleRows = function() {
    var pkg = getSelectedPackageData()
    if (!pkg) return []
    return mockWarranty.warrantyVehicleRows || []
  }

  var updateWarrantyQuantity = function(vehicleType, selectedCount, value) {
    var nextValue = parseInt(value)
    if (isNaN(nextValue)) nextValue = 0
    if (nextValue < 0) nextValue = 0
    if (nextValue > selectedCount) nextValue = selectedCount
    setWarrantyQuantities(Object.assign({}, warrantyQuantities, {
      [vehicleType]: nextValue
    }))
  }

  var renderWarrantyVehicleTable = function() {
    if (!purchaseWarranty) return null
    return (
      <div>
        <table style={styles.partTable}>
          <thead>
            <tr>
              <th style={styles.partTh}>车型</th>
              <th style={styles.partTh}>单价/年</th>
              <th style={styles.partTh}>车辆数</th>
              <th style={styles.partTh}>合计</th>
            </tr>
          </thead>
          <tbody>
            {getWarrantyVehicleRows().map(function(row) {
              var quantity = warrantyQuantities[row.vehicleType] || 0
              var isOverLimit = quantity > row.count
              return (
                <tr key={"warranty-row-" + row.vehicleType}>
                  <td style={styles.partTd}>{row.vehicleType}</td>
                  <td style={styles.partTd}>¥{mockWarranty.pricePerYear}/年</td>
                  <td style={styles.partTd}>
                    <input
                      type="number"
                      min="0"
                      max={row.count}
                      title={isOverLimit ? "不能超过已选车辆数 " + row.count + " 台" : ""}
                      style={Object.assign({}, styles.yearInput, isOverLimit ? { borderColor: "#ff4d4f" } : {})}
                      value={quantity}
                      onChange={function(e) { updateWarrantyQuantity(row.vehicleType, row.count, e.target.value) }}
                    />
                  </td>
                  <td style={styles.partTd}>¥{mockWarranty.pricePerYear * (getSelectedPackageData() ? getSelectedPackageData().years : 1) * quantity}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ color: "#8C8C8C", fontSize: "12px", marginTop: "8px" }}>
          ⚠️ 按实际安装车辆为准，如安装车型与下单车型不符，将变更账单费用
        </div>
      </div>
    )
  }

  var renderProductName = function(item, key) {
    if (item.bindType === "category") {
      return (
        <button
          key={key}
          style={styles.categoryLink}
          onClick={function() { setDeviceModalCategory(item.target) }}
        >
          {item.target}
        </button>
      )
    }
    return <span key={key}>{item.target}</span>
  }

  var getPackageWarrantyMaxYears = function() {
    var pkg = getSelectedPackageData()
    var packageYears = pkg ? pkg.years : 3
    if (mockWarranty.isGranted) {
      return Math.max(packageYears - mockWarranty.giftedYears, 0)
    }
    return packageYears
  }

  var getSingleWarrantyMaxYears = function() {
    return 3
  }

  var toggleSingleProduct = function(productId) {
    setSingleProductList(singleProductList.map(function(product) {
      if (product.id === productId) {
        return Object.assign({}, product, { selected: !product.selected })
      }
      return product
    }))
  }

  var updateSingleProductQuantity = function(productId, quantity) {
    setSingleProductList(singleProductList.map(function(product) {
      if (product.id === productId) {
        return Object.assign({}, product, { quantity: quantity })
      }
      return product
    }))
  }

  var calcTotalPerVehicle = function() {
    return calcTotalPrice()
  }

  var calcTotalPrice = function() {
    var base = calcPackageSubtotal() + calcSingleProductPrice()
    return base + additionalAmount + f1Amount + extraChargeAmount - discountAmount
  }

  var handleSubmit = function() {
    if (!settlementMethod) {
      setSubmitError("请选择结算方式")
      return
    }
    if (extraChargeAmount > 0 && !extraChargeReason) {
      setSubmitError("请选择加收原因")
      return
    }
    setSubmitError("")
    var orderData = {
      company: company,
      salesPerson: salesPerson,
      contact: contact,
      phone: phone,
      remark: remark,
      installDate: installDate,
      installAddress: installAddress,
      area: area,
      salesDate: salesDate,
      orderSource: orderSource,
      orderType: orderType,
      salesPlan: salesPlan,
      needInstallService: needInstallService,
      needSalesCommission: needSalesCommission,
      settlementMethod: settlementMethod,
      additionalAmount: additionalAmount,
      f1Amount: f1Amount,
      extraChargeAmount: extraChargeAmount,
      extraChargeReason: extraChargeReason,
      discountAmount: discountAmount,
      totalAmount: calcTotalPrice()
    }
    console.log("submit create order", orderData)
    onClose()
  }

  var styles = {
    container: {
      display: "flex",
      height: "100%",
      backgroundColor: "#f5f5f5",
      fontFamily: "Arial, sans-serif"
    },
    leftPanel: {
      flex: "0 0 60%",
      overflowY: "auto",
      padding: "24px"
    },
    rightPanel: {
      flex: "0 0 40%",
      backgroundColor: "#fff",
      borderLeft: "1px solid #e8e8e8",
      overflowY: "auto",
      padding: "24px"
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
      paddingBottom: "12px",
      borderBottom: "1px solid #f0f0f0"
    },
    formRow: {
      display: "flex",
      marginBottom: "16px",
      gap: "16px"
    },
    formItem: {
      flex: 1
    },
    label: {
      display: "block",
      fontSize: "14px",
      color: "#666",
      marginBottom: "6px"
    },
    required: {
      color: "#ff4d4f"
    },
    input: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px",
      boxSizing: "border-box"
    },
    select: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px",
      backgroundColor: "#fff",
      boxSizing: "border-box"
    },
    radioGroup: {
      display: "flex",
      gap: "24px",
      padding: "8px 0"
    },
    radioLabel: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "14px",
      cursor: "pointer"
    },
    tabContainer: {
      display: "flex",
      borderBottom: "1px solid #e8e8e8",
      marginBottom: "16px"
    },
    tab: {
      padding: "12px 24px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#666",
      borderBottom: "2px solid transparent",
      marginBottom: "-1px"
    },
    tabActive: {
      padding: "12px 24px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#1890ff",
      borderBottom: "2px solid #1890ff",
      marginBottom: "-1px",
      fontWeight: "500"
    },
    packageTable: {
      width: "100%",
      borderCollapse: "collapse"
    },
    th: {
      padding: "12px 8px",
      textAlign: "left",
      fontSize: "13px",
      color: "#666",
      backgroundColor: "#fafafa",
      borderBottom: "1px solid #e8e8e8"
    },
    td: {
      padding: "12px 8px",
      fontSize: "14px",
      borderBottom: "1px solid #f0f0f0"
    },
    selectedRow: {
      backgroundColor: "#F0FFF4"
    },
    yearInput: {
      width: "60px",
      padding: "4px 8px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      textAlign: "center"
    },
    discountInput: {
      width: "80px",
      padding: "4px 8px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      textAlign: "center"
    },
    addOnBtn: {
      border: "1px dashed #00C853",
      color: "#00C853",
      backgroundColor: "transparent",
      padding: "4px 12px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "13px"
    },
    expandArea: {
      backgroundColor: "#F9FAFB",
      padding: "16px",
      marginTop: "8px",
      borderRadius: "4px"
    },
    partTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "16px"
    },
    partTh: {
      padding: "8px",
      textAlign: "left",
      fontSize: "12px",
      color: "#666",
      backgroundColor: "#fff",
      borderBottom: "1px solid #e8e8e8"
    },
    partTd: {
      padding: "8px",
      fontSize: "13px",
      borderBottom: "1px solid #f0f0f0"
    },
    categoryHint: {
      color: "#999999",
      fontSize: "12px"
    },
    addOnHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px"
    },
    addOnTitle: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#333"
    },
    addOnFormRow: {
      display: "grid",
      gridTemplateRows: "auto auto",
      gap: "10px",
      padding: "12px",
      backgroundColor: "#fff",
      borderRadius: "4px",
      marginTop: "8px"
    },
    addOnFormTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px"
    },
    addOnFormBottom: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap"
    },
    addOnSelect: {
      padding: "6px 8px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "13px"
    },
    addOnModeSwitch: {
      display: "flex",
      gap: "12px",
      alignItems: "center",
      fontSize: "13px"
    },
    addOnModeLabelActive: {
      color: "#00C853",
      fontWeight: "500"
    },
    confirmBtn: {
      backgroundColor: "#00C853",
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "13px"
    },
    cancelBtn: {
      backgroundColor: "#fff",
      color: "#666",
      border: "1px solid #d9d9d9",
      padding: "6px 12px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "13px"
    },
    removeBtn: {
      color: "#ff4d4f",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "13px"
    },
    warrantySection: {
      padding: "12px 0"
    },
    warrantyRow: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "12px"
    },
    warrantyLabel: {
      fontSize: "14px",
      color: "#666"
    },
    warrantyTag: {
      padding: "4px 12px",
      borderRadius: "4px",
      fontSize: "12px"
    },
    warningTag: {
      padding: "4px 10px",
      borderRadius: "4px",
      fontSize: "12px",
      color: "#d46b08",
      backgroundColor: "#fff7e6",
      border: "1px solid #ffd591"
    },
    switch: {
      position: "relative",
      width: "44px",
      height: "22px",
      backgroundColor: "#ccc",
      borderRadius: "11px",
      cursor: "pointer",
      transition: "background-color 0.3s"
    },
    switchOn: {
      position: "relative",
      width: "44px",
      height: "22px",
      backgroundColor: "#00C853",
      borderRadius: "11px",
      cursor: "pointer",
      transition: "background-color 0.3s"
    },
    switchHandle: {
      position: "absolute",
      top: "2px",
      left: "2px",
      width: "18px",
      height: "18px",
      backgroundColor: "#fff",
      borderRadius: "50%",
      transition: "left 0.3s"
    },
    switchHandleOn: {
      position: "absolute",
      top: "2px",
      left: "24px",
      width: "18px",
      height: "18px",
      backgroundColor: "#fff",
      borderRadius: "50%",
      transition: "left 0.3s"
    },
    yearSelect: {
      padding: "4px 8px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      marginLeft: "8px"
    },
    sectionTitle: {
      fontSize: "15px",
      fontWeight: "500",
      marginBottom: "12px",
      color: "#333"
    },
    modeGroup: {
      display: "flex",
      marginBottom: "16px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      overflow: "hidden"
    },
    modeBtn: {
      flex: 1,
      padding: "10px",
      border: "none",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontSize: "14px"
    },
    modeBtnActive: {
      flex: 1,
      padding: "10px",
      border: "none",
      backgroundColor: "#1890ff",
      color: "#fff",
      cursor: "pointer",
      fontSize: "14px"
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      fontSize: "14px"
    },
    summaryLabel: {
      color: "#666"
    },
    summaryValue: {
      color: "#333"
    },
    productDetail: {
      fontSize: "12px",
      color: "#999",
      marginTop: "4px"
    },
    divider: {
      height: "1px",
      backgroundColor: "#e8e8e8",
      margin: "16px 0"
    },
    dashedDivider: {
      height: "1px",
      borderTop: "1px dashed #e8e8e8",
      margin: "12px 0"
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 0"
    },
    totalLabel: {
      fontSize: "16px",
      fontWeight: "500"
    },
    totalValue: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#00C853"
    },
    adjustInput: {
      width: "120px",
      padding: "6px 10px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px"
    },
    adjustSelect: {
      width: "120px",
      padding: "6px 10px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px",
      backgroundColor: "#fff"
    },
    adjustFieldRow: {
      display: "grid",
      gridTemplateColumns: "112px 1fr",
      gap: "12px",
      alignItems: "center",
      padding: "8px 0",
      fontSize: "14px"
    },
    adjustControlWrap: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "8px"
    },
    radioButtonGroup: {
      display: "flex",
      gap: "8px",
      justifyContent: "flex-start"
    },
    radioButton: {
      minWidth: "72px",
      padding: "7px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      backgroundColor: "#fff",
      color: "#666",
      cursor: "pointer",
      fontSize: "13px"
    },
    radioButtonActive: {
      minWidth: "72px",
      padding: "7px 12px",
      border: "1px solid #00C853",
      borderRadius: "4px",
      backgroundColor: "#fff",
      color: "#00C853",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "500"
    },
    helpIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      border: "1px solid #d9d9d9",
      color: "#999",
      fontSize: "12px",
      cursor: "help"
    },
    summaryBlock: {
      marginBottom: "16px"
    },
    summaryBlockTitle: {
      fontSize: "15px",
      fontWeight: "700",
      color: "#333",
      paddingBottom: "8px",
      borderBottom: "1px solid #e8e8e8",
      marginBottom: "8px"
    },
    summarySubtotal: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      fontSize: "14px",
      fontWeight: "700"
    },
    summaryAmount: {
      color: "#333",
      textAlign: "right"
    },
    summaryTotalMeta: {
      fontSize: "13px",
      color: "#666",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    categoryLink: {
      border: "none",
      background: "none",
      color: "#00C853",
      textDecoration: "underline",
      cursor: "pointer",
      padding: 0,
      fontSize: "13px",
      textAlign: "left"
    },
    mutedNote: {
      fontSize: "12px",
      color: "#999",
      lineHeight: 1.5,
      marginTop: "8px"
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      zIndex: 1200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    modalPanel: {
      width: "560px",
      maxHeight: "70vh",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
      display: "flex",
      flexDirection: "column"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderBottom: "1px solid #e8e8e8",
      fontSize: "16px",
      fontWeight: "700"
    },
    modalBody: {
      padding: "16px 20px",
      overflowY: "auto"
    },
    modalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      padding: "12px 20px",
      borderTop: "1px solid #e8e8e8"
    },
    switchRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      fontSize: "14px"
    },
    errorText: {
      color: "#ff4d4f",
      fontSize: "13px",
      marginTop: "12px"
    },
    footerBtns: {
      display: "flex",
      gap: "12px",
      marginTop: "16px"
    },
    primaryBtn: {
      flex: 1,
      padding: "12px",
      backgroundColor: "#00C853",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500"
    },
    secondaryBtn: {
      flex: 1,
      padding: "12px",
      backgroundColor: "#fff",
      color: "#333",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px"
    },
    optionalToggle: {
      color: "#1890ff",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      marginTop: "8px"
    }
  }

  return (
    <div style={styles.container}>
      {/* 左侧表单区域 */}
      <div style={styles.leftPanel}>
        {/* 基本信息 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>基本信息</div>
          <div style={styles.formRow}>
            <div style={styles.formItem}>
              <label style={styles.label}><span style={styles.required}>*</span> 所属公司</label>
              <select style={styles.select} value={company} onChange={function(e) { setCompany(e.target.value) }}>
                <option value="">请选择公司</option>
                <option value="company1">深圳市安达物流有限公司</option>
                <option value="company2">广州市顺通运输有限公司</option>
                <option value="company3">东莞市快捷货运有限公司</option>
              </select>
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}><span style={styles.required}>*</span> 销售人员</label>
              <select style={styles.select} value={salesPerson} onChange={function(e) { setSalesPerson(e.target.value) }}>
                <option value="">请选择</option>
                <option value="person1">博洁霞</option>
                <option value="person2">王继锐</option>
                <option value="person3">李明</option>
              </select>
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formItem}>
              <label style={styles.label}><span style={styles.required}>*</span> 联系人</label>
              <input style={styles.input} placeholder="请输入联系人" value={contact} onChange={function(e) { setContact(e.target.value) }} />
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}><span style={styles.required}>*</span> 联系电话</label>
              <input style={styles.input} placeholder="请输入手机号" value={phone} onChange={function(e) { setPhone(e.target.value) }} />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formItem}>
              <label style={styles.label}>备注</label>
              <input style={styles.input} placeholder="选填" value={remark} onChange={function(e) { setRemark(e.target.value) }} />
            </div>
          </div>
          <button style={styles.optionalToggle} onClick={function() { setShowOptional(!showOptional) }}>
            {showOptional ? "收起可选字段 ▲" : "展开可选字段 ▼"}
          </button>
          {showOptional && (
            <div>
              <div style={styles.formRow}>
                <div style={styles.formItem}>
                  <label style={styles.label}>预约安装日期</label>
                  <input type="date" style={styles.input} value={installDate} onChange={function(e) { setInstallDate(e.target.value) }} />
                </div>
                <div style={styles.formItem}>
                  <label style={styles.label}>安装地址</label>
                  <input style={styles.input} placeholder="选填" value={installAddress} onChange={function(e) { setInstallAddress(e.target.value) }} />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formItem}>
                  <label style={styles.label}>所属区域</label>
                  <select style={styles.select} value={area} onChange={function(e) { setArea(e.target.value) }}>
                    <option value="">请选择</option>
                    <option value="area1">深圳市</option>
                    <option value="area2">广州市</option>
                    <option value="area3">东莞市</option>
                  </select>
                </div>
                <div style={styles.formItem}>
                  <label style={styles.label}>销售日期</label>
                  <input type="date" style={styles.input} value={salesDate} onChange={function(e) { setSalesDate(e.target.value) }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 订单类型 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>订单类型</div>
          <div style={styles.formRow}>
            <div style={styles.formItem}>
              <label style={styles.label}>订单来源</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input type="radio" name="orderSource" checked={orderSource === "normal"} onChange={function() { setOrderSource("normal") }} />
                  普通
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" name="orderSource" checked={orderSource === "bid"} onChange={function() { setOrderSource("bid") }} />
                  投标
                </label>
              </div>
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}>订单类型</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input type="radio" name="orderType" checked={orderType === "normal"} onChange={function() { setOrderType("normal") }} />
                  普通
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" name="orderType" checked={orderType === "replace"} onChange={function() { setOrderType("replace") }} />
                  换装
                </label>
              </div>
            </div>
            <div style={styles.formItem}>
              <label style={styles.label}>销售方案</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input type="radio" name="salesPlan" checked={salesPlan === "normal"} onChange={function() { setSalesPlan("normal") }} />
                  普通销售
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" name="salesPlan" checked={salesPlan === "discount"} onChange={function() { setSalesPlan("discount") }} />
                  特惠套餐
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" name="salesPlan" checked={salesPlan === "rent"} onChange={function() { setSalesPlan("rent") }} />
                  以租代购
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 产品选择 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>产品选择</div>
          <div style={styles.tabContainer}>
            <div style={productTab === "package" ? styles.tabActive : styles.tab} onClick={function() { setProductTab("package") }}>套餐产品</div>
            <div style={productTab === "single" ? styles.tabActive : styles.tab} onClick={function() { setProductTab("single") }}>单产品</div>
          </div>
          
          {productTab === "package" && (
            <div>
              <table style={styles.packageTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>选择</th>
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
                  {packageList.map(function(pkg) {
                    var isSelected = selectedPackage === pkg.id
                    var subtotal = (pkg.unitPrice - pkg.discount) * vehicleCount
                    return (
                      <React.Fragment key={pkg.id}>
                        <tr style={isSelected ? styles.selectedRow : {}}>
                          <td style={styles.td}>
                            <input 
                              type="radio" 
                              name="package" 
                              checked={isSelected}
                              onChange={function() { setSelectedPackage(pkg.id) }}
                            />
                          </td>
                          <td style={styles.td}>{pkg.name}</td>
                          <td style={styles.td}>
                            <input 
                              type="number" 
                              style={styles.yearInput}
                              value={pkg.years}
                              min="1"
                              onChange={function(e) { updatePackageYears(pkg.id, parseInt(e.target.value) || 1) }}
                            />
                          </td>
                          <td style={styles.td}>{"¥" + pkg.unitPrice}</td>
                          <td style={styles.td}>
                            <input 
                              type="number" 
                              style={styles.discountInput}
                              value={pkg.discount}
                              min="0"
                              onChange={function(e) { updatePackageDiscount(pkg.id, parseInt(e.target.value) || 0) }}
                            />
                          </td>
                          <td style={styles.td}>{vehicleCount}</td>
                          <td style={styles.td}>{"¥" + subtotal}</td>
                          <td style={styles.td}>
                            {pkg.supportAddOn && (
                              <button style={styles.addOnBtn} onClick={function() { 
                                setSelectedPackage(pkg.id)
                                setShowAddOnForm(true) 
                              }}>
                                加购
                              </button>
                            )}
                          </td>
                        </tr>
                        {/* 选中后自动展开详情 */}
                        {isSelected && (
                          <tr>
                            <td colSpan={8} style={{ padding: 0 }}>
                              <div style={styles.expandArea}>
                                {/* 安装部位配置 */}
                                <div style={{ marginBottom: "16px" }}>
                                  <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>安装部位配置</div>
                                  <table style={styles.partTable}>
                                    <thead>
                                      <tr>
                                        <th style={styles.partTh}>安装部位</th>
                                        <th style={styles.partTh}>绑定方式</th>
                                        <th style={styles.partTh}>产品/类别名称</th>
                                        <th style={Object.assign({}, styles.partTh, { textAlign: "center" })}>数量</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pkg.installParts.map(function(part, idx) {
                                        return (
                                          <tr key={"part-" + idx}>
                                            <td style={styles.partTd}>{part.part}</td>
                                            <td style={styles.partTd}>{part.bindType === "product" ? "指定产品" : "指定类别"}</td>
                                            <td style={styles.partTd}>
                                              {part.bindType === "product" ? (
                                                part.target
                                              ) : (
                                                <span>{part.target} <span style={styles.categoryHint}>（安装时指定）</span></span>
                                              )}
                                            </td>
                                            <td style={Object.assign({}, styles.partTd, { textAlign: "center" })}>
                                              {part.bindType === "product" ? (part.quantity || 1) : "—"}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {/* 加购产品区域 - 仅支持加购的套餐显示 */}
                                {pkg.supportAddOn && (
                                  <div>
                                    <div style={styles.addOnHeader}>
                                      <span style={styles.addOnTitle}>加购产品 ({pkg.addOnProducts.length})</span>
                                      <button style={styles.addOnBtn} onClick={function() { setShowAddOnForm(true) }}>
                                        + 添加加购
                                      </button>
                                    </div>
                                    
                                    {pkg.addOnProducts.length === 0 ? (
                                      <div style={{ color: "#999", fontSize: "13px", padding: "12px 0" }}>暂无加购产品</div>
                                    ) : (
                                      <table style={styles.partTable}>
                                        <thead>
                                          <tr>
                                            <th style={styles.partTh}>安装部位</th>
                                            <th style={styles.partTh}>绑定方式</th>
                                            <th style={styles.partTh}>产品/类别名称</th>
                                            <th style={styles.partTh}>单价</th>
                                            <th style={styles.partTh}>数量</th>
                                            <th style={styles.partTh}>金额小计</th>
                                            <th style={styles.partTh}>操作</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {pkg.addOnProducts.map(function(addOn, idx) {
                                            return (
                                              <tr key={"addon-" + idx}>
                                                <td style={styles.partTd}>{addOn.part}</td>
                                                <td style={styles.partTd}>{addOn.bindType === "product" ? "指定产品" : "指定类别"}</td>
                                                <td style={styles.partTd}>{addOn.target}</td>
                                                <td style={styles.partTd}>{"¥" + addOn.price}</td>
                                                <td style={styles.partTd}>{addOn.quantity || 1}</td>
                                                <td style={styles.partTd}>{"¥" + (addOn.price * (addOn.quantity || 1))}</td>
                                                <td style={styles.partTd}>
                                                  <button style={styles.removeBtn} onClick={function() { handleRemoveAddOn(addOn.part) }}>删除</button>
                                                </td>
                                              </tr>
                                            )
                                          })}
                                        </tbody>
                                      </table>
                                    )}

                                    {/* 内联加购配置行 */}
                                    {showAddOnForm && (
                                      <div style={styles.addOnFormRow}>
                                        <div style={styles.addOnFormTop}>
                                          <select 
                                            style={Object.assign({}, styles.addOnSelect, { width: "200px" })} 
                                            value={addOnPart}
                                            onChange={function(e) { setAddOnPart(e.target.value) }}
                                          >
                                            <option value="">选择安装部位</option>
                                            {allInstallParts.map(function(part) {
                                              var occupied = getOccupiedParts()
                                              var isDisabled = occupied.indexOf(part) > -1
                                              return (
                                                <option key={part} value={part} disabled={isDisabled}>
                                                  {part}{isDisabled ? "（已占用）" : ""}
                                                </option>
                                              )
                                            })}
                                          </select>
                                          <div style={{ display: "flex", gap: "8px" }}>
                                            <button style={styles.confirmBtn} onClick={handleAddOnConfirm}>确认</button>
                                            <button style={styles.cancelBtn} onClick={function() { 
                                              setShowAddOnForm(false)
                                              setAddOnPart("")
                                              setAddOnTarget("")
                                              setAddOnPrice(0)
                                              setAddOnQuantity(1)
                                            }}>取消</button>
                                          </div>
                                        </div>
                                        <div style={styles.addOnFormBottom}>
                                          <span style={addOnBindType === "product" ? styles.addOnModeLabelActive : {}}>指定产品</span>
                                          <div 
                                            style={addOnBindType === "category" ? styles.switchOn : styles.switch}
                                            onClick={function() {
                                              var nextMode = addOnBindType === "product" ? "category" : "product"
                                              setAddOnBindType(nextMode)
                                              setAddOnTarget("")
                                              setAddOnPrice(0)
                                              setAddOnQuantity(1)
                                            }}
                                          >
                                            <div style={addOnBindType === "category" ? styles.switchHandleOn : styles.switchHandle}></div>
                                          </div>
                                          <span style={addOnBindType === "category" ? styles.addOnModeLabelActive : {}}>指定类别</span>
                                          {addOnBindType === "product" ? (
                                            <select 
                                              style={styles.addOnSelect}
                                              value={addOnTarget}
                                              onChange={function(e) { 
                                                setAddOnTarget(e.target.value)
                                                for (var i = 0; i < availableProducts.length; i++) {
                                                  if (availableProducts[i].name === e.target.value) {
                                                    setAddOnPrice(availableProducts[i].price)
                                                    break
                                                  }
                                                }
                                              }}
                                            >
                                              <option value="">选择产品</option>
                                              {availableProducts.map(function(p) {
                                                return <option key={p.id} value={p.name}>{p.name} (¥{p.price})</option>
                                              })}
                                            </select>
                                          ) : (
                                            <React.Fragment>
                                              <select 
                                                style={Object.assign({}, styles.addOnSelect, { width: "180px" })}
                                                value={addOnTarget}
                                                onChange={function(e) {
                                                  setAddOnTarget(e.target.value)
                                                  setAddOnPrice(e.target.value ? 200 : 0)
                                                }}
                                              >
                                                <option value="">选择类别</option>
                                                {availableCategories.map(function(c) {
                                                  return <option key={c} value={c}>{c}</option>
                                                })}
                                              </select>
                                              <input 
                                                type="number"
                                                style={Object.assign({}, styles.addOnSelect, { width: "90px", backgroundColor: "#f5f5f5" })}
                                                placeholder="单价"
                                                value={addOnPrice || ""}
                                                readOnly
                                              />
                                            </React.Fragment>
                                          )}
                                          <input
                                            type="number"
                                            style={Object.assign({}, styles.addOnSelect, { width: "80px" })}
                                            min="1"
                                            value={addOnQuantity}
                                            onChange={function(e) { setAddOnQuantity(parseInt(e.target.value) || 1) }}
                                          />
                                          <span style={{ fontSize: "13px", color: "#666", minWidth: "60px" }}>{"¥" + (addOnPrice * addOnQuantity)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {productTab === "single" && (
            <div>
              <table style={styles.packageTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>选择</th>
                    <th style={styles.th}>产品名称</th>
                    <th style={styles.th}>单价</th>
                    <th style={styles.th}>数量</th>
                    <th style={styles.th}>金额小计</th>
                  </tr>
                </thead>
                <tbody>
                  {singleProductList.map(function(product) {
                    return (
                      <tr key={product.id} style={product.selected ? styles.selectedRow : {}}>
                        <td style={styles.td}>
                          <input
                            type="checkbox"
                            checked={product.selected}
                            onChange={function() { toggleSingleProduct(product.id) }}
                          />
                        </td>
                        <td style={styles.td}>{product.name}</td>
                        <td style={styles.td}>{"¥" + product.unitPrice}</td>
                        <td style={styles.td}>
                          <input
                            type="number"
                            style={styles.yearInput}
                            min="1"
                            value={product.quantity}
                            onChange={function(e) { updateSingleProductQuantity(product.id, parseInt(e.target.value) || 1) }}
                          />
                        </td>
                        <td style={styles.td}>{"¥" + (product.unitPrice * product.quantity)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 质保信息 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>质保信息</div>
          <div style={styles.warrantySection}>
            {productTab === "package" ? (
              <React.Fragment>
                {mockWarranty.isGranted ? (
                  <React.Fragment>
                    <div style={styles.warrantyRow}>
                      <span style={styles.warrantyLabel}>免费质保</span>
                      <span style={Object.assign({}, styles.warrantyTag, { backgroundColor: "#e6f7e6", color: "#52c41a" })}>
                        ✓ 赠送 {mockWarranty.giftedYears} 年
                      </span>
                      <span style={{ color: "#666", fontSize: "14px" }}>{mockWarranty.planName}</span>
                    </div>
                    {getPackageWarrantyMaxYears() > 0 && (
                      <div>
                        <div style={styles.warrantyRow}>
                          <span style={styles.warrantyLabel}>加购质保</span>
                          <div style={purchaseWarranty ? styles.switchOn : styles.switch} onClick={function() { setPurchaseWarranty(!purchaseWarranty) }}>
                            <div style={purchaseWarranty ? styles.switchHandleOn : styles.switchHandle}></div>
                          </div>
                        </div>
                        {renderWarrantyVehicleTable()}
                      </div>
                    )}
                  </React.Fragment>
                ) : mockWarranty.supportPurchase ? (
                  <React.Fragment>
                    <div style={styles.warrantyRow}>
                      <span style={styles.warrantyLabel}>免费质保</span>
                      <span style={Object.assign({}, styles.warrantyTag, { backgroundColor: "#f0f0f0", color: "#999" })}>不含免费质保</span>
                    </div>
                    <div style={styles.warrantyRow}>
                      <span style={styles.warrantyLabel}>加购质保</span>
                      <div style={purchaseWarranty ? styles.switchOn : styles.switch} onClick={function() { setPurchaseWarranty(!purchaseWarranty) }}>
                        <div style={purchaseWarranty ? styles.switchHandleOn : styles.switchHandle}></div>
                      </div>
                    </div>
                    {renderWarrantyVehicleTable()}
                  </React.Fragment>
                ) : (
                  <div style={styles.warrantyRow}>
                    <span style={styles.warrantyLabel}>免费质保</span>
                    <span style={Object.assign({}, styles.warrantyTag, { backgroundColor: "#f0f0f0", color: "#999" })}>不含质保</span>
                  </div>
                )}

                {mockWarranty.monitorServices && mockWarranty.monitorServices.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={styles.warrantyRow}>
                      <span style={styles.warrantyLabel}>监控服务</span>
                      <span style={styles.warningTag}>监控服务收费（仅供参考）</span>
                    </div>
                    {mockWarranty.monitorServices.map(function(item) {
                      var pkg = getSelectedPackageData()
                      var years = pkg ? pkg.years : 1
                      return (
                        <div key={item.vehicleType} style={styles.summaryRow}>
                          <span style={styles.summaryLabel}>{item.vehicleType}</span>
                          {item.type === "free" ? (
                            <span style={{ color: "#52c41a" }}>免费</span>
                          ) : (
                            <span style={styles.summaryValue}>¥{item.feePerYear}/年（合计 ¥{item.feePerYear * years}）</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </React.Fragment>
            ) : (
              <React.Fragment>
                {mockSingleWarranty.isGranted ? (
                  <div style={styles.warrantyRow}>
                    <span style={styles.warrantyLabel}>免费质保</span>
                    <span style={Object.assign({}, styles.warrantyTag, { backgroundColor: "#e6f7e6", color: "#52c41a" })}>
                      ✓ 赠送 {mockSingleWarranty.giftedYears} 年
                    </span>
                    <span style={{ color: "#666", fontSize: "14px" }}>{mockSingleWarranty.planName}</span>
                  </div>
                ) : mockSingleWarranty.supportPurchase ? (
                  <div style={styles.warrantyRow}>
                    <span style={styles.warrantyLabel}>加购质保</span>
                    <div style={purchaseWarranty ? styles.switchOn : styles.switch} onClick={function() { setPurchaseWarranty(!purchaseWarranty) }}>
                      <div style={purchaseWarranty ? styles.switchHandleOn : styles.switchHandle}></div>
                    </div>
                    <span style={{ color: "#666", fontSize: "14px" }}>{mockSingleWarranty.planName}，¥{mockSingleWarranty.pricePerYear}/年</span>
                    {purchaseWarranty && (
                      <select style={styles.yearSelect} value={Math.min(warrantyYears, getSingleWarrantyMaxYears())} onChange={function(e) { setWarrantyYears(parseInt(e.target.value)) }}>
                        {[1, 2, 3].map(function(year) {
                          return <option key={year} value={year}>{year}年</option>
                        })}
                      </select>
                    )}
                  </div>
                ) : (
                  <span style={Object.assign({}, styles.warrantyTag, { backgroundColor: "#f0f0f0", color: "#999" })}>不含质保</span>
                )}
              </React.Fragment>
            )}
          </div>
        </div>
      </div>

      {/* 右侧概览区域 */}
      <div style={styles.rightPanel}>
        {/* 下单方式 */}
        <div style={styles.sectionTitle}>下单方式</div>
        <div style={styles.modeGroup}>
          <button 
            style={orderMode === "batch_count" ? styles.modeBtnActive : styles.modeBtn}
            onClick={function() { setOrderMode("batch_count") }}
          >
            批量（按台数）
          </button>
          <button 
            style={orderMode === "single_plate" ? styles.modeBtnActive : styles.modeBtn}
            onClick={function() { setOrderMode("single_plate") }}
          >
            单车（按车牌）
          </button>
        </div>
        
        {orderMode === "batch_count" ? (
          <div style={styles.formItem}>
            <label style={styles.label}>下单台数</label>
            <input 
              type="number" 
              style={styles.input} 
              value={vehicleCount} 
              min="1"
              onChange={function(e) { setVehicleCount(parseInt(e.target.value) || 1) }}
            />
          </div>
        ) : (
          <div style={styles.formItem}>
            <label style={styles.label}>车牌号码</label>
            <input 
              style={styles.input} 
              placeholder="请输入车牌号" 
              value={plateNumber}
              onChange={function(e) { setPlateNumber(e.target.value) }}
            />
          </div>
        )}

        <div style={styles.divider}></div>

        <div style={styles.switchRow}>
          <span style={styles.summaryLabel}>是否需要安装服务</span>
          <div
            style={needInstallService ? styles.switchOn : styles.switch}
            onClick={function() { setNeedInstallService(!needInstallService) }}
          >
            <span style={needInstallService ? styles.switchHandleOn : styles.switchHandle}></span>
          </div>
        </div>
        <div style={styles.switchRow}>
          <span style={styles.summaryLabel}>是否需要计算销售提成</span>
          <div
            style={needSalesCommission ? styles.switchOn : styles.switch}
            onClick={function() { setNeedSalesCommission(!needSalesCommission) }}
          >
            <span style={needSalesCommission ? styles.switchHandleOn : styles.switchHandle}></span>
          </div>
        </div>

        {getSelectedPackageData() && (
          <div style={styles.summaryBlock}>
            <div style={styles.summaryBlockTitle}>套餐信息</div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>套餐名称</span>
              <span style={styles.summaryAmount}>{getSelectedPackageData().name}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>年限</span>
              <span style={styles.summaryAmount}>{getSelectedPackageData().years}年</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>套餐单价</span>
              <span style={styles.summaryAmount}>{"¥" + getSelectedPackageData().unitPrice}</span>
            </div>
            {calcAddOnPrice() > 0 && (
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>加购产品总额</span>
                <span style={styles.summaryAmount}>{"¥" + calcAddOnPrice()}</span>
              </div>
            )}
            {calcWarrantyPrice() > 0 && (
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>质保加购费</span>
                <span style={styles.summaryAmount}>{"¥" + calcWarrantyPrice()}</span>
              </div>
            )}
            {getSelectedPackageData().installParts.length > 0 && (
              <React.Fragment>
                <div style={styles.dashedDivider}></div>
                {getSelectedPackageData().installParts.map(function(part, index) {
                  return (
                    <div key={"summary-part-" + index} style={styles.summaryRow}>
                      <span style={styles.summaryLabel}>{part.part}</span>
                      <span style={styles.summaryAmount}>{renderProductName(part, "summary-product-" + index)}</span>
                    </div>
                  )
                })}
              </React.Fragment>
            )}
            <div style={styles.dashedDivider}></div>
            <div style={styles.summarySubtotal}>
              <span>套餐小计</span>
              <span>{"¥" + calcPackageSubtotal()}</span>
            </div>
          </div>
        )}

        {calcSelectedSingleProducts().length > 0 && (
          <div style={styles.summaryBlock}>
            <div style={styles.summaryBlockTitle}>单产品信息</div>
            {calcSelectedSingleProducts().map(function(product) {
              return (
                <div key={product.id} style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>{product.name}</span>
                  <span style={styles.summaryAmount}>×{product.quantity}　¥{product.unitPrice * product.quantity}</span>
                </div>
              )
            })}
            <div style={styles.dashedDivider}></div>
            <div style={styles.summarySubtotal}>
              <span>单产品小计</span>
              <span>{"¥" + calcSingleProductPrice()}</span>
            </div>
          </div>
        )}

        {/* 结算调整 */}
        <div style={styles.summaryBlock}>
          <div style={styles.summaryBlockTitle}>结算调整</div>
          <div style={styles.adjustFieldRow}>
            <span style={styles.summaryLabel}><span style={styles.required}>*</span>结算方式</span>
            <div style={styles.radioButtonGroup}>
              <button style={settlementMethod === "cash" ? styles.radioButtonActive : styles.radioButton} onClick={function() { setSettlementMethod("cash") }}>现结</button>
              <button style={settlementMethod === "credit" ? styles.radioButtonActive : styles.radioButton} onClick={function() { setSettlementMethod("credit") }}>记账</button>
              <button style={settlementMethod === "after_install" ? styles.radioButtonActive : styles.radioButton} onClick={function() { setSettlementMethod("after_install") }}>安装后收费</button>
            </div>
          </div>
          <div style={styles.adjustFieldRow}>
            <span style={styles.summaryLabel}>附加金额</span>
            <div style={styles.adjustControlWrap}>
              <input type="number" style={styles.adjustInput} placeholder="请输入附加金额" value={additionalAmount || ""} onChange={function(e) { setAdditionalAmount(parseFloat(e.target.value) || 0) }} />
              <span style={styles.helpIcon} title="手动增加的其他应收费用">?</span>
            </div>
          </div>
          <div style={styles.adjustFieldRow}>
            <span style={styles.summaryLabel}>F1金额</span>
            <div style={styles.adjustControlWrap}>
              <input type="number" style={styles.adjustInput} placeholder="请输入F1金额" value={f1Amount || ""} onChange={function(e) { setF1Amount(parseFloat(e.target.value) || 0) }} />
              <span style={styles.helpIcon} title="F1 相关金额">?</span>
            </div>
          </div>
          <div style={styles.adjustFieldRow}>
            <span style={styles.summaryLabel}>优惠金额</span>
            <div style={styles.adjustControlWrap}>
              <input type="number" style={styles.adjustInput} placeholder="请输入优惠金额" value={discountAmount || ""} onChange={function(e) { setDiscountAmount(parseFloat(e.target.value) || 0) }} />
              <span style={styles.helpIcon} title="从应收金额中扣减">?</span>
            </div>
          </div>
          <div style={styles.adjustFieldRow}>
            <span style={styles.summaryLabel}>加收金额</span>
            <div style={styles.adjustControlWrap}>
              <input
                type="number"
                style={styles.adjustInput}
                placeholder="请输入加收金额"
                value={extraChargeAmount || ""}
                min="0"
                onChange={function(e) {
                  var value = parseFloat(e.target.value) || 0
                  setExtraChargeAmount(value)
                  if (value <= 0) {
                    setExtraChargeReason("")
                  }
                }}
              />
              <span style={styles.helpIcon} title="按原因归类的加收费用">?</span>
            </div>
          </div>
          <div style={styles.adjustFieldRow}>
            <span style={styles.summaryLabel}>{extraChargeAmount > 0 && <span style={styles.required}>*</span>}加收原因</span>
            <div style={styles.radioButtonGroup}>
              <button style={extraChargeReason === "F1" ? styles.radioButtonActive : styles.radioButton} onClick={function() { setExtraChargeReason("F1") }}>F1</button>
              <button style={extraChargeReason === "J1" ? styles.radioButtonActive : styles.radioButton} onClick={function() { setExtraChargeReason("J1") }}>J1</button>
            </div>
          </div>
          {(additionalAmount > 0 || f1Amount > 0 || extraChargeAmount > 0 || discountAmount > 0) && (
            <React.Fragment>
              <div style={styles.dashedDivider}></div>
              {additionalAmount > 0 && <div style={styles.summaryRow}><span style={styles.summaryLabel}>附加金额</span><span style={styles.summaryAmount}>¥{additionalAmount}</span></div>}
              {f1Amount > 0 && <div style={styles.summaryRow}><span style={styles.summaryLabel}>F1金额</span><span style={styles.summaryAmount}>¥{f1Amount}</span></div>}
              {extraChargeAmount > 0 && <div style={styles.summaryRow}><span style={styles.summaryLabel}>加收金额{extraChargeReason ? "(" + extraChargeReason + ")" : ""}</span><span style={styles.summaryAmount}>¥{extraChargeAmount}</span></div>}
              {discountAmount > 0 && <div style={styles.summaryRow}><span style={styles.summaryLabel}>优惠金额</span><span style={styles.summaryAmount}>-¥{discountAmount}</span></div>}
            </React.Fragment>
          )}
        </div>

        <div style={styles.divider}></div>

        {/* 应收汇总 */}
        <div style={styles.totalRow}>
          <span style={styles.totalLabel}>应收总额 / 台</span>
          <span style={styles.totalValue}>{"¥" + calcTotalPrice()}</span>
        </div>
        <div style={styles.summaryTotalMeta}>
          <span>车辆数共 {vehicleCount} 台</span>
          <span style={styles.link}>查看明细 ∧</span>
        </div>

        {/* 操作按钮 */}
        {submitError && <div style={styles.errorText}>{submitError}</div>}
        <div style={styles.footerBtns}>
          <button style={styles.secondaryBtn} onClick={onClose}>取消</button>
          <button style={styles.primaryBtn} onClick={handleSubmit}>确认订单</button>
        </div>
      </div>

      {deviceModalCategory && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalPanel}>
            <div style={styles.modalHeader}>
              <span>设备明细 — {deviceModalCategory}</span>
              <button style={styles.closeBtn} onClick={function() { setDeviceModalCategory(null) }}>×</button>
            </div>
            <div style={styles.modalBody}>
              <table style={styles.packageTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>产品名称</th>
                    <th style={styles.th}>品牌</th>
                    <th style={styles.th}>型号</th>
                  </tr>
                </thead>
                <tbody>
                  {getCategoryDevices(deviceModalCategory).map(function(device, index) {
                    return (
                      <tr key={"device-" + index}>
                        <td style={styles.td}>{device.name}</td>
                        <td style={styles.td}>{device.brand}</td>
                        <td style={styles.td}>{device.model}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={function() { setDeviceModalCategory(null) }}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ OrderDetail 组件（右侧抽屉内容）============
var OrderDetailContent = function(props) {
  var orderId = props.orderId
  var onClose = props.onClose

  var _useState1 = React.useState(true)
  var showPackageDetail = _useState1[0]
  var setShowPackageDetail = _useState1[1]

  // 模拟订单数据
  var orderData = {
    orderId: orderId || "XS2024010800001",
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

  var packageProduct = {
    id: "pkg1",
    name: "商用车高级盲区监控套餐",
    years: 2,
    unitPrice: 2980,
    discount: 0,
    quantity: 1,
    subtotal: 5960,
    installParts: [
      { partName: "前置摄像头", bindType: "product", targetName: "海康威视 DS-2CD3T45FP", quantity: 1 },
      { partName: "后置摄像头", bindType: "category", targetName: "高清摄像头" },
      { partName: "车内监控", bindType: "product", targetName: "大华 DH-IPC-HFW2831S", quantity: 1 },
      { partName: "GPS定位器", bindType: "product", targetName: "途强 GT06N", quantity: 1 },
      { partName: "盲区检测", bindType: "category", targetName: "盲区传感器" }
    ]
  }

  var addOnProducts = [
    { partName: "左侧摄像头", bindType: "product", targetName: "大华 DH-IPC-xxx", unitPrice: 300, quantity: 3, subtotal: 900 },
    { partName: "OBD接口", bindType: "category", targetName: "OBD诊断设备类", unitPrice: 200, quantity: 3, subtotal: 600 }
  ]

  var singleProducts = [
    { name: "行车记录仪支架", unitPrice: 50, discount: 0, quantity: 3, subtotal: 150 }
  ]

  var warrantyInfo = {
    planName: "标准质保方案A",
    isGranted: true,
    isPurchased: true,
    purchaseFee: 400,
    monitorServiceType: "paid",
    monitorServiceFee: 200
  }

  var feesSummary = {
    packageTotal: 5960,
    addOnTotal: 1500,
    singleTotal: 150,
    warrantyFee: 400,
    monitorFee: 200,
    additionalAmount: 0,
    f1Amount: 0,
    discountAmount: 200,
    totalAmount: 8010
  }

  var styles = {
    container: {
      minHeight: "100%",
      backgroundColor: "#f5f5f5",
      fontFamily: "Arial, sans-serif",
      padding: "24px"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px"
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "16px"
    },
    orderId: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333"
    },
    statusTag: {
      padding: "4px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "500"
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
      paddingLeft: "12px",
      borderLeft: "3px solid #52c41a",
      color: "#333"
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "16px"
    },
    infoItem: {
      display: "flex",
      flexDirection: "column"
    },
    infoLabel: {
      fontSize: "12px",
      color: "#999",
      marginBottom: "4px"
    },
    infoValue: {
      fontSize: "14px",
      color: "#333"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse"
    },
    th: {
      padding: "12px 8px",
      textAlign: "left",
      fontSize: "13px",
      color: "#666",
      backgroundColor: "#fafafa",
      borderBottom: "1px solid #e8e8e8"
    },
    td: {
      padding: "12px 8px",
      fontSize: "14px",
      borderBottom: "1px solid #f0f0f0"
    },
    expandBtn: {
      color: "#1890ff",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      padding: "0"
    },
    partRow: {
      backgroundColor: "#fafafa"
    },
    partCell: {
      paddingLeft: "40px",
      fontSize: "13px",
      color: "#666"
    },
    categoryHint: {
      color: "#999",
      fontSize: "12px"
    },
    subTitle: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#333",
      marginTop: "20px",
      marginBottom: "12px",
      paddingTop: "16px",
      borderTop: "1px solid #f0f0f0"
    },
    warrantyRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      fontSize: "14px"
    },
    warrantyLabel: {
      color: "#666"
    },
    warrantyValue: {
      color: "#333"
    },
    warrantyTag: {
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      marginLeft: "8px"
    },
    feeRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      fontSize: "14px"
    },
    feeLabel: {
      color: "#666"
    },
    feeValue: {
      color: "#333"
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "16px 0",
      fontSize: "16px",
      fontWeight: "bold",
      borderTop: "1px solid #e8e8e8",
      marginTop: "8px"
    },
    totalValue: {
      color: "#00C853",
      fontSize: "20px"
    }
  }

  var getStatusStyle = function(status) {
    if (status === "已确认") return { backgroundColor: "#e6f7e6", color: "#52c41a" }
    if (status === "待确认") return { backgroundColor: "#fff7e6", color: "#faad14" }
    if (status === "已取消") return { backgroundColor: "#fff1f0", color: "#ff4d4f" }
    return { backgroundColor: "#f0f0f0", color: "#666" }
  }

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.orderId}>{orderData.orderId}</span>
          <span style={Object.assign({}, styles.statusTag, getStatusStyle(orderData.status))}>{orderData.status}</span>
        </div>
      </div>

      {/* 基本信息 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>基本信息</div>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>所属公司</span>
            <span style={styles.infoValue}>{orderData.company}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>销售人员</span>
            <span style={styles.infoValue}>{orderData.salesPerson}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>联系人</span>
            <span style={styles.infoValue}>{orderData.contact}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>联系电话</span>
            <span style={styles.infoValue}>{orderData.phone}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>下单台数</span>
            <span style={styles.infoValue}>{orderData.vehicleCount}台</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>订单来源</span>
            <span style={styles.infoValue}>{orderData.orderSource}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>订单类型</span>
            <span style={styles.infoValue}>{orderData.orderType}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>销售方案</span>
            <span style={styles.infoValue}>{orderData.salesPlan}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>创建时间</span>
            <span style={styles.infoValue}>{orderData.createTime}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>结算方式</span>
            <span style={styles.infoValue}>{orderData.settlementMethod}</span>
          </div>
        </div>
      </div>

      {/* 产品信息 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>产品信息</div>
        
        {/* 套餐产品 */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>套餐名称</th>
              <th style={styles.th}>年限</th>
              <th style={styles.th}>单价</th>
              <th style={styles.th}>优惠</th>
              <th style={styles.th}>数量</th>
              <th style={styles.th}>小计</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>{packageProduct.name}</td>
              <td style={styles.td}>{packageProduct.years}年</td>
              <td style={styles.td}>{"¥" + packageProduct.unitPrice}</td>
              <td style={styles.td}>{packageProduct.discount > 0 ? "-¥" + packageProduct.discount : "-"}</td>
              <td style={styles.td}>{packageProduct.quantity}</td>
              <td style={styles.td}>{"¥" + packageProduct.subtotal}</td>
              <td style={styles.td}>
                <button style={styles.expandBtn} onClick={function() { setShowPackageDetail(!showPackageDetail) }}>
                  {showPackageDetail ? "收起" : "展开"}
                </button>
              </td>
            </tr>
            {showPackageDetail && packageProduct.installParts.map(function(part, idx) {
              return (
                <tr key={"part-" + idx} style={styles.partRow}>
                  <td style={Object.assign({}, styles.td, styles.partCell)}>{part.partName}</td>
                  <td style={styles.td}>{part.bindType === "product" ? "指定产品" : "指定类别"}</td>
                  <td style={styles.td} colSpan={2}>
                    {part.bindType === "product" ? (
                      <span>{part.targetName}</span>
                    ) : (
                      <span style={styles.categoryHint}>{part.targetName}（安装时指定）</span>
                    )}
                  </td>
                  <td style={Object.assign({}, styles.td, { textAlign: "center" })}>{part.bindType === "product" ? (part.quantity || 1) : "—"}</td>
                  <td style={styles.td}></td>
                  <td style={styles.td}></td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* 加购产品 */}
        <div style={styles.subTitle}>加购产品</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>安装部位</th>
              <th style={styles.th}>绑定方式</th>
              <th style={styles.th}>绑定对象</th>
              <th style={styles.th}>单价</th>
              <th style={styles.th}>数量</th>
              <th style={styles.th}>小计</th>
            </tr>
          </thead>
          <tbody>
            {addOnProducts.map(function(product, idx) {
              return (
                <tr key={"addon-" + idx}>
                  <td style={styles.td}>{product.partName}</td>
                  <td style={styles.td}>{product.bindType === "product" ? "指定产品" : "指定类别"}</td>
                  <td style={styles.td}>
                    {product.bindType === "product" ? (
                      <span>{product.targetName}</span>
                    ) : (
                      <span style={styles.categoryHint}>{product.targetName}（安装时指定）</span>
                    )}
                  </td>
                  <td style={styles.td}>{"¥" + product.unitPrice}</td>
                  <td style={styles.td}>{product.quantity}</td>
                  <td style={styles.td}>{"¥" + product.subtotal}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* 单产品 */}
        <div style={styles.subTitle}>单产品</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>产品名称</th>
              <th style={styles.th}>单价</th>
              <th style={styles.th}>优惠</th>
              <th style={styles.th}>数量</th>
              <th style={styles.th}>小计</th>
            </tr>
          </thead>
          <tbody>
            {singleProducts.map(function(product, idx) {
              return (
                <tr key={"single-" + idx}>
                  <td style={styles.td}>{product.name}</td>
                  <td style={styles.td}>{"¥" + product.unitPrice}</td>
                  <td style={styles.td}>{product.discount > 0 ? "-¥" + product.discount : "-"}</td>
                  <td style={styles.td}>{product.quantity}</td>
                  <td style={styles.td}>{"¥" + product.subtotal}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* 质保信息 */}
        <div style={styles.subTitle}>质保信息</div>
        <div style={styles.warrantyRow}>
          <span style={styles.warrantyLabel}>质保方案</span>
          <span style={styles.warrantyValue}>
            {warrantyInfo.planName}
            {warrantyInfo.isGranted && <span style={Object.assign({}, styles.warrantyTag, { backgroundColor: "#e6f7e6", color: "#52c41a" })}>赠送</span>}
            {warrantyInfo.isPurchased && <span style={Object.assign({}, styles.warrantyTag, { backgroundColor: "#e6f7ff", color: "#1890ff" })}>已购买</span>}
          </span>
        </div>
        <div style={styles.warrantyRow}>
          <span style={styles.warrantyLabel}>质保费用</span>
          <span style={styles.warrantyValue}>{"¥" + warrantyInfo.purchaseFee}</span>
        </div>
        {warrantyInfo.isPurchased && (
          <div style={{ color: "#8C8C8C", fontSize: "12px", marginTop: "-4px", marginBottom: "12px" }}>
            ⚠️ 按实际安装车辆为准，如安装车型与下单车型不符，将变更账单费用
          </div>
        )}
        <div style={styles.warrantyRow}>
          <span style={styles.warrantyLabel}>监控服务</span>
          <span style={styles.warrantyValue}>
            {warrantyInfo.monitorServiceType === "paid" ? "有偿服务" : "免费服务"}
            <span style={{ marginLeft: "8px" }}>{"¥" + warrantyInfo.monitorServiceFee}</span>
          </span>
        </div>
      </div>

      {/* 费用信息 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>费用信息</div>
        <div style={styles.feeRow}>
          <span style={styles.feeLabel}>套餐费用</span>
          <span style={styles.feeValue}>{"¥" + feesSummary.packageTotal}</span>
        </div>
        <div style={styles.feeRow}>
          <span style={styles.feeLabel}>加购费用</span>
          <span style={styles.feeValue}>{"¥" + feesSummary.addOnTotal}</span>
        </div>
        <div style={styles.feeRow}>
          <span style={styles.feeLabel}>单产品费用</span>
          <span style={styles.feeValue}>{"¥" + feesSummary.singleTotal}</span>
        </div>
        <div style={styles.feeRow}>
          <span style={styles.feeLabel}>质保费用</span>
          <span style={styles.feeValue}>{"¥" + feesSummary.warrantyFee}</span>
        </div>
        <div style={styles.feeRow}>
          <span style={styles.feeLabel}>监控服务费</span>
          <span style={styles.feeValue}>{"¥" + feesSummary.monitorFee}</span>
        </div>
        <div style={styles.feeRow}>
          <span style={styles.feeLabel}>附加金额</span>
          <span style={styles.feeValue}>{"¥" + feesSummary.additionalAmount}</span>
        </div>
        <div style={styles.feeRow}>
          <span style={styles.feeLabel}>F1金额</span>
          <span style={styles.feeValue}>{"¥" + feesSummary.f1Amount}</span>
        </div>
        <div style={styles.feeRow}>
          <span style={styles.feeLabel}>优惠减免</span>
          <span style={styles.feeValue}>{"-¥" + feesSummary.discountAmount}</span>
        </div>
        <div style={styles.totalRow}>
          <span>应收金额</span>
          <span style={styles.totalValue}>{"¥" + feesSummary.totalAmount}</span>
        </div>
      </div>
    </div>
  )
}

// ============ 主列表页组件 ============
var Component = function() {
  var _useState1 = React.useState(false)
  var showCreateDrawer = _useState1[0]
  var setShowCreateDrawer = _useState1[1]

  var _useState2 = React.useState(false)
  var showDetailDrawer = _useState2[0]
  var setShowDetailDrawer = _useState2[1]

  var _useState3 = React.useState(null)
  var selectedOrderId = _useState3[0]
  var setSelectedOrderId = _useState3[1]

  var _useState4 = React.useState([])
  var selectedRows = _useState4[0]
  var setSelectedRows = _useState4[1]

  var _useState5 = React.useState("")
  var activeMenu = _useState5[0]
  var setActiveMenu = _useState5[1]

  // Mock 数据
  var mockOrders = [
    { id: "XS20260514001", plate: "粤A·12345", package: "网约车（粤A）", sales: "博洁霞", date: "2026-05-14 14:31:24", status: "待确认" },
    { id: "XS20260514002", plate: "粤A·67890", package: "网约车（粤A）", sales: "王继锐", date: "2026-05-14 15:20:00", status: "已确认" },
    { id: "XS20260513003", plate: "粤B·11111", package: "货运车（粤B）", sales: "博洁霞", date: "2026-05-13 09:00:00", status: "已完成" },
    { id: "XS20260513004", plate: "--", package: "网约车（粤A）", sales: "李明", date: "2026-05-13 10:30:00", status: "待确认" },
    { id: "XS20260512005", plate: "粤A·22222", package: "出租车套餐", sales: "王继锐", date: "2026-05-12 16:45:00", status: "已取消" }
  ]

  // 打开详情抽屉
  var handleOpenDetail = function(orderId) {
    setSelectedOrderId(orderId)
    setShowDetailDrawer(true)
  }

  // 关闭详情抽屉
  var handleCloseDetail = function() {
    setShowDetailDrawer(false)
    setSelectedOrderId(null)
  }

  // 打开新建抽屉
  var handleOpenCreate = function() {
    setShowCreateDrawer(true)
  }

  // 关闭新建抽屉
  var handleCloseCreate = function() {
    setShowCreateDrawer(false)
  }

  // 勾选行
  var handleSelectRow = function(orderId) {
    var newSelected = selectedRows.slice()
    var idx = newSelected.indexOf(orderId)
    if (idx > -1) {
      newSelected.splice(idx, 1)
    } else {
      newSelected.push(orderId)
    }
    setSelectedRows(newSelected)
  }

  // 全选
  var handleSelectAll = function() {
    if (selectedRows.length === mockOrders.length) {
      setSelectedRows([])
    } else {
      var allIds = mockOrders.map(function(o) { return o.id })
      setSelectedRows(allIds)
    }
  }

  // 状态标签样式
  var getStatusStyle = function(status) {
    if (status === "待确认") return { backgroundColor: "#fff7e6", color: "#faad14" }
    if (status === "已确认") return { backgroundColor: "#e6f7e6", color: "#52c41a" }
    if (status === "已完成") return { backgroundColor: "#f0f0f0", color: "#666" }
    if (status === "已取消") return { backgroundColor: "#fff1f0", color: "#ff4d4f" }
    return { backgroundColor: "#f0f0f0", color: "#666" }
  }

  var styles = {
    layout: {
      display: "flex",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif"
    },
    topNav: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "56px",
      backgroundColor: "#fff",
      borderBottom: "1px solid #e8e8e8",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      zIndex: 100
    },
    logo: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#1890ff"
    },
    topMenu: {
      display: "flex",
      gap: "32px"
    },
    topMenuItem: {
      fontSize: "14px",
      color: "#333",
      cursor: "pointer",
      padding: "8px 0"
    },
    topMenuItemActive: {
      fontSize: "14px",
      color: "#1890ff",
      cursor: "pointer",
      padding: "8px 0",
      borderBottom: "2px solid #1890ff"
    },
    topRight: {
      display: "flex",
      alignItems: "center",
      gap: "16px"
    },
    searchInput: {
      width: "200px",
      padding: "8px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px"
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer"
    },
    avatar: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      backgroundColor: "#1890ff",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px"
    },
    sidebar: {
      position: "fixed",
      top: "56px",
      left: 0,
      bottom: 0,
      width: "180px",
      backgroundColor: "#fff",
      borderRight: "1px solid #e8e8e8",
      overflowY: "auto",
      paddingTop: "16px"
    },
    menuGroup: {
      marginBottom: "8px"
    },
    menuGroupTitle: {
      padding: "8px 16px",
      fontSize: "12px",
      color: "#1890ff",
      fontWeight: "500"
    },
    menuItem: {
      padding: "10px 16px",
      fontSize: "14px",
      color: "#333",
      cursor: "pointer"
    },
    menuItemActive: {
      padding: "10px 16px",
      fontSize: "14px",
      color: "#fff",
      cursor: "pointer",
      backgroundColor: "#1890ff"
    },
    mainContent: {
      marginTop: "56px",
      marginLeft: "180px",
      flex: 1,
      padding: "24px",
      backgroundColor: "#f5f5f5",
      minHeight: "calc(100vh - 56px)"
    },
    pageHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px"
    },
    pageTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333"
    },
    createBtn: {
      backgroundColor: "#52c41a",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      padding: "10px 20px",
      cursor: "pointer",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    },
    filterCard: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "16px"
    },
    filterRow: {
      display: "flex",
      gap: "16px",
      alignItems: "flex-end"
    },
    filterItem: {
      flex: 1
    },
    filterLabel: {
      display: "block",
      fontSize: "14px",
      color: "#666",
      marginBottom: "6px"
    },
    filterInput: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px",
      boxSizing: "border-box"
    },
    filterSelect: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      fontSize: "14px",
      backgroundColor: "#fff",
      boxSizing: "border-box"
    },
    filterBtns: {
      display: "flex",
      gap: "8px"
    },
    searchBtn: {
      backgroundColor: "#1890ff",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      padding: "8px 20px",
      cursor: "pointer",
      fontSize: "14px"
    },
    resetBtn: {
      backgroundColor: "#fff",
      color: "#333",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      padding: "8px 20px",
      cursor: "pointer",
      fontSize: "14px"
    },
    toolbar: {
      display: "flex",
      gap: "8px",
      marginBottom: "16px",
      flexWrap: "wrap"
    },
    toolBtn: {
      backgroundColor: "#fff",
      color: "#333",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: "13px"
    },
    tableCard: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      overflow: "hidden"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse"
    },
    th: {
      padding: "14px 12px",
      textAlign: "left",
      fontSize: "13px",
      color: "#666",
      backgroundColor: "#fafafa",
      borderBottom: "1px solid #e8e8e8"
    },
    td: {
      padding: "14px 12px",
      fontSize: "14px",
      borderBottom: "1px solid #f0f0f0"
    },
    link: {
      color: "#1890ff",
      cursor: "pointer",
      textDecoration: "none"
    },
    statusTag: {
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px"
    },
    actionBtn: {
      color: "#1890ff",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      marginRight: "12px"
    },
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px"
    },
    pageInfo: {
      fontSize: "14px",
      color: "#666"
    },
    pageBtns: {
      display: "flex",
      gap: "8px"
    },
    pageBtn: {
      padding: "6px 12px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontSize: "14px"
    },
    drawerOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 999
    },
    leftDrawer: {
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "min(1100px, calc(100vw - 48px))",
      minWidth: "900px",
      backgroundColor: "#fff",
      zIndex: 1000,
      boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
      animation: "slideInRight 0.3s ease"
    },
    rightDrawer: {
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "75vw",
      backgroundColor: "#fff",
      zIndex: 1000,
      boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
      animation: "slideInRight 0.3s ease"
    },
    drawerHeader: {
      height: "60px",
      borderBottom: "1px solid #e8e8e8",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 24px"
    },
    drawerTitle: {
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    drawerTitleText: {
      fontSize: "18px",
      fontWeight: "bold"
    },
    drawerOrderId: {
      fontSize: "14px",
      color: "#666"
    },
    drawerContent: {
      height: "calc(100vh - 60px)",
      overflowY: "auto"
    },
    closeBtn: {
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#999"
    }
  }

  // 左侧菜单数据
  var menuData = [
    {
      group: "销售中心",
      items: ["设备订单", "监控订单", "售后订单", "车辆管理", "公司管理"]
    },
    {
      group: "商品中心",
      items: ["产品管理", "套餐管理", "质保管理", "提成管理"]
    },
    {
      group: "报表管理",
      items: ["销售订单明细", "销售提成明细", "公司对账单"]
    },
    {
      group: "系统设置",
      items: ["信息配置表"]
    }
  ]

  return (
    <div style={styles.layout}>
      {/* 顶部导航 */}
      <div style={styles.topNav}>
        <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
          <span style={styles.logo}>营运通</span>
          <div style={styles.topMenu}>
            <span style={styles.topMenuItem}>工作台</span>
            <span style={styles.topMenuItemActive}>销售中心</span>
            <span style={styles.topMenuItem}>仓储管理</span>
            <span style={styles.topMenuItem}>工单中心</span>
            <span style={styles.topMenuItem}>运营监控</span>
            <span style={styles.topMenuItem}>财务管理</span>
            <span style={styles.topMenuItem}>系统设置</span>
          </div>
        </div>
        <div style={styles.topRight}>
          <input style={styles.searchInput} placeholder="Search" />
          <span style={{ cursor: "pointer" }}>&#128276;</span>
          <span style={{ cursor: "pointer" }}>&#9881;</span>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>U</div>
            <span>账号资料</span>
            <span>&#9660;</span>
          </div>
        </div>
      </div>

      {/* 左侧菜单 */}
      <div style={styles.sidebar}>
        {menuData.map(function(group, gIdx) {
          return (
            <div key={"group-" + gIdx} style={styles.menuGroup}>
              <div style={styles.menuGroupTitle}>{group.group}</div>
              {group.items.map(function(item, iIdx) {
                var isActive = (group.group === "销售中心" && item === "设备订单")
                return (
                  <div 
                    key={"item-" + gIdx + "-" + iIdx} 
                    style={isActive ? styles.menuItemActive : styles.menuItem}
                    onClick={function() { setActiveMenu(item) }}
                  >
                    {item}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* 主内容区 */}
      <div style={styles.mainContent}>
        {/* 页面头部 */}
        <div style={styles.pageHeader}>
          <span style={styles.pageTitle}>销售单管理</span>
          <button style={styles.createBtn} onClick={handleOpenCreate}>
            + 新增销售单
          </button>
        </div>

        {/* 筛选区 */}
        <div style={styles.filterCard}>
          <div style={styles.filterRow}>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>车牌号</label>
              <input style={styles.filterInput} placeholder="请输入车牌号" />
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>销售单号</label>
              <input style={styles.filterInput} placeholder="请输入销售单号" />
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>销售类型</label>
              <select style={styles.filterSelect}>
                <option value="">全部类型</option>
                <option value="normal">普通销售</option>
                <option value="discount">特惠套餐</option>
                <option value="rent">以租代购</option>
              </select>
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>处理人</label>
              <select style={styles.filterSelect}>
                <option value="">全部人员</option>
                <option value="person1">博洁霞</option>
                <option value="person2">王继锐</option>
                <option value="person3">李明</option>
              </select>
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>手机号</label>
              <input style={styles.filterInput} placeholder="请输入手机号" />
            </div>
            <div style={styles.filterBtns}>
              <button style={styles.searchBtn}>&#128269; 搜索</button>
              <button style={styles.resetBtn}>&#8635; 重置</button>
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <div style={styles.toolbar}>
          <button style={styles.toolBtn}>&#9776; 筛选</button>
          <button style={styles.toolBtn}>&#128202; 数据汇总</button>
          <button style={styles.toolBtn}>&#10003; 批量确认销售单</button>
          <button style={styles.toolBtn}>&#128100; 批量指派</button>
          <button style={styles.toolBtn} onClick={handleOpenCreate}>+ 新增销售单</button>
          <button style={styles.toolBtn}>&#128196; 批量创建调整单</button>
          <button style={styles.toolBtn}>&#128190; 批量导出</button>
          <button style={styles.toolBtn}>报单数据导出 &#9660;</button>
        </div>

        {/* 表格 */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input 
                    type="checkbox" 
                    checked={selectedRows.length === mockOrders.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={styles.th}>单据号</th>
                <th style={styles.th}>车牌号</th>
                <th style={styles.th}>套餐名称</th>
                <th style={styles.th}>销售人员</th>
                <th style={styles.th}>销售日期</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map(function(order) {
                return (
                  <tr key={order.id}>
                    <td style={styles.td}>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.indexOf(order.id) > -1}
                        onChange={function() { handleSelectRow(order.id) }}
                      />
                    </td>
                    <td style={styles.td}>
                      <span style={styles.link} onClick={function() { handleOpenDetail(order.id) }}>
                        {order.id}
                      </span>
                    </td>
                    <td style={styles.td}>{order.plate}</td>
                    <td style={styles.td}>{order.package}</td>
                    <td style={styles.td}>{order.sales}</td>
                    <td style={styles.td}>{order.date}</td>
                    <td style={styles.td}>
                      <span style={Object.assign({}, styles.statusTag, getStatusStyle(order.status))}>
                        {order.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.actionBtn}>编辑</button>
                      <button style={styles.actionBtn} onClick={function() { handleOpenDetail(order.id) }}>查看详情</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={styles.pagination}>
            <span style={styles.pageInfo}>共 {mockOrders.length} 条记录</span>
            <div style={styles.pageBtns}>
              <button style={styles.pageBtn}>上一页</button>
              <button style={styles.pageBtn}>下一页</button>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧新建销售单抽屉 */}
      {showCreateDrawer && (
        <React.Fragment>
          <div style={styles.drawerOverlay} onClick={handleCloseCreate}></div>
          <div style={styles.leftDrawer}>
            <div style={styles.drawerHeader}>
              <span style={styles.drawerTitleText}>新建销售单</span>
              <button style={styles.closeBtn} onClick={handleCloseCreate}>×</button>
            </div>
            <div style={styles.drawerContent}>
              <CreateOrderContent onClose={handleCloseCreate} />
            </div>
          </div>
        </React.Fragment>
      )}

      {/* 右侧详情抽屉 */}
      {showDetailDrawer && (
        <React.Fragment>
          <div style={styles.drawerOverlay} onClick={handleCloseDetail}></div>
          <div style={styles.rightDrawer}>
            <div style={styles.drawerHeader}>
              <div style={styles.drawerTitle}>
                <span style={styles.drawerTitleText}>订单详情</span>
                <span style={styles.drawerOrderId}>{selectedOrderId}</span>
              </div>
              <button style={styles.closeBtn} onClick={handleCloseDetail}>×</button>
            </div>
            <div style={styles.drawerContent}>
              <OrderDetailContent orderId={selectedOrderId} onClose={handleCloseDetail} />
            </div>
          </div>
        </React.Fragment>
      )}

      {/* 动画样式 */}
      <style>{"\n        @keyframes slideInRight {\n          from { transform: translateX(100%); }\n          to { transform: translateX(0); }\n        }\n      "}</style>
    </div>
  )
}

export default Component
