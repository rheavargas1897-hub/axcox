// @ts-nocheck
import React from "react"

var Component = function() {
  var _a = React.useState("基本信息"), activeTab = _a[0], setActiveTab = _a[1]
  var _b = React.useState({
    carNumber: "",
    frameNumber: "",
    carType: "",
    installer1: "呵呵",
    installer2: "",
    remark: "",
    address: "",
    oldHostCode: "",
    dismantlePackage: "普通视频-三路-通用",
    hostBrand: "海康"
  }), formData = _b[0], setFormData = _b[1]
  var _c = React.useState(false), showVehicleTypePicker = _c[0], setShowVehicleTypePicker = _c[1]
  var _d = React.useState(false), showInstaller2Picker = _d[0], setShowInstaller2Picker = _d[1]
  var _e = React.useState(false), showDismantlePackagePicker = _e[0], setShowDismantlePackagePicker = _e[1]
  var _f = React.useState(false), showHostBrandPicker = _f[0], setShowHostBrandPicker = _f[1]
  var _g = React.useState(false), showAreaPicker = _g[0], setShowAreaPicker = _g[1]
  var _h = React.useState(false), copied = _h[0], setCopied = _h[1]
  var _i = React.useState([]), uploadedImages = _i[0], setUploadedImages = _i[1]
  
  // 设备选择页面状态
  var _j = React.useState(false), showDeviceSelect = _j[0], setShowDeviceSelect = _j[1]
  var _k = React.useState(null), currentProduct = _k[0], setCurrentProduct = _k[1]
  var _l = React.useState(""), deviceSearchText = _l[0], setDeviceSearchText = _l[1]
  var _m = React.useState(null), selectedDevice = _m[0], setSelectedDevice = _m[1]
  
  // 组合商品弹窗状态
  var _n = React.useState(false), showComboSelect = _n[0], setShowComboSelect = _n[1]
  var _o = React.useState(null), selectedCombo = _o[0], setSelectedCombo = _o[1]
  
  // 产品选型状态
  var _p = React.useState({}), productSelections = _p[0], setProductSelections = _p[1]
  var _q = React.useState({}), productScans = _q[0], setProductScans = _q[1]

  var tabs = ["基本信息", "报单信息", "报单产品", "报单图片"]
  var vehicleTypes = ["小型客车", "中型客车", "大型客车", "货车", "挂车", "特种车辆"]
  var installers = ["张三", "李四", "王五", "赵六", "呵呵"]
  var dismantlePackages = ["普通视频-三路-通用", "普通视频-四路-通用", "高清视频-三路-通用", "高清视频-四路-通用"]
  var hostBrands = ["海康", "大华", "宇视", "天地伟业"]
  var areas = ["广东省深圳市", "广东省广州市", "广东省东莞市", "广东省佛山市"]

  // 产品槽位数据（包含类型：指定型号/品类可选、安装部位）
  var products = [
    { id: 1, category: "主机", name: "AE-AC3141-A", count: 1, type: "fixed", brand: "海康", installLocation: "主机舱" },
    { id: 2, category: "物联卡", name: "", count: 1, type: "selectable", brand: "", installLocation: "主机舱" },
    { id: 3, category: "定位天线", name: "", count: 1, type: "selectable", brand: "", installLocation: "车顶" },
    { id: 4, category: "4G天线", name: "", count: 1, type: "selectable", brand: "", installLocation: "车顶" },
    { id: 5, category: "ADAS摄像头", name: "", count: 1, type: "selectable", brand: "", installLocation: "前挡风玻璃内侧" },
    { id: 6, category: "DSM摄像头", name: "", count: 1, type: "selectable", brand: "", installLocation: "驾驶室内顶" }
  ]

  // 车牌输入相关状态
  var _r = React.useState(false), showCarNumberInput = _r[0], setShowCarNumberInput = _r[1]
  var _s = React.useState(""), carNumberProvince = _s[0], setCarNumberProvince = _s[1]
  var _t = React.useState(""), carNumberRest = _t[0], setCarNumberRest = _t[1]
  var _u = React.useState(0), carInputStep = _u[0], setCarInputStep = _u[1] // 0: 省份, 1: 号码

  var provinces = ["京", "津", "沪", "渝", "冀", "晋", "辽", "吉", "黑", "苏", "浙", "皖", "闽", "赣", "鲁", "豫", "鄂", "湘", "粤", "琼", "川", "贵", "云", "陕", "甘", "青", "蒙", "桂", "宁", "新", "藏", "港", "澳", "台"]
  var carKeyboard = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

  // 可选设备列表（按适配状态分类）
  var deviceOptions = {
    "主机": {
      recommended: [
        { code: "15193122581", name: "主机-海康-AE-AC3141-A", brand: "海康", compatible: true, sameBrand: true },
        { code: "15183125549", name: "主机-海康-AE-AC3141-A", brand: "海康", compatible: true, sameBrand: true }
      ],
      other: [
        { code: "15193122590", name: "主机-海康-AE-AC3141-B", brand: "海康", compatible: null, sameBrand: true }
      ],
      incompatible: []
    },
    "物联卡": {
      recommended: [
        { code: "15193122581", name: "物联卡-云凡-10G", brand: "云凡", compatible: true, sameBrand: false },
        { code: "15183125549", name: "物联卡-移动-5G", brand: "移动", compatible: true, sameBrand: false }
      ],
      other: [
        { code: "15193122590", name: "物联卡-联通-10G", brand: "联通", compatible: null, sameBrand: false }
      ],
      incompatible: []
    },
    "定位天线": {
      recommended: [
        { code: "DW20260001", name: "定位天线-海康-A1", brand: "海康", compatible: true, sameBrand: true },
        { code: "DW20260002", name: "定位天线-海康-A2", brand: "海康", compatible: true, sameBrand: true }
      ],
      other: [
        { code: "DW20260003", name: "定位天线-大华-B1", brand: "大华", compatible: null, sameBrand: false }
      ],
      incompatible: []
    },
    "4G天线": {
      recommended: [
        { code: "4G20260001", name: "4G天线-海康-T1", brand: "海康", compatible: true, sameBrand: true }
      ],
      other: [
        { code: "4G20260002", name: "4G天线-宇视-T2", brand: "宇视", compatible: null, sameBrand: false }
      ],
      incompatible: []
    },
    "ADAS摄像头": {
      recommended: [
        { code: "ADAS20260001", name: "ADAS摄像头-海康-C6S", brand: "海康", compatible: true, sameBrand: true },
        { code: "ADAS20260002", name: "ADAS摄像头-海康-C6L", brand: "海康", compatible: true, sameBrand: true }
      ],
      other: [
        { code: "ADAS20260003", name: "ADAS摄像头-大华-DH200", brand: "大华", compatible: null, sameBrand: false }
      ],
      incompatible: [
        { code: "ADAS20260004", name: "ADAS摄像头-某牌-XX", brand: "某牌", compatible: false, sameBrand: false, reason: "与主机AE-AC3141-A存在兼容问题" }
      ]
    },
    "DSM摄像头": {
      recommended: [
        { code: "DSM20260001", name: "DSM摄像头-海康-D1", brand: "海康", compatible: true, sameBrand: true }
      ],
      other: [
        { code: "DSM20260002", name: "DSM摄像头-大华-D2", brand: "大华", compatible: null, sameBrand: false }
      ],
      incompatible: [
        { code: "DSM20260003", name: "DSM摄像头-某牌-YY", brand: "某牌", compatible: false, sameBrand: false, reason: "与主机AE-AC3141-A存在兼容问题" }
      ]
    }
  }

  // 组合商品列表
  var comboProducts = [
    { 
      id: 1, 
      name: "海康三路标准套装V2", 
      total: 6, 
      compatible: true,
      products: [
        { name: "主机", count: 1, isCore: true, deviceCode: "15193122581" },
        { name: "物联卡", count: 1, isCore: false },
        { name: "定位天线", count: 1, isCore: false },
        { name: "4G天线", count: 1, isCore: false },
        { name: "ADAS摄像头", count: 1, isCore: false },
        { name: "DSM摄像头", count: 1, isCore: false }
      ]
    },
    { 
      id: 2, 
      name: "大华三路经济套装", 
      total: 6, 
      compatible: true,
      products: [
        { name: "主机", count: 1, isCore: true, deviceCode: "15183125549" },
        { name: "物联卡", count: 1, isCore: false },
        { name: "定位天线", count: 1, isCore: false },
        { name: "4G天线", count: 1, isCore: false },
        { name: "ADAS摄像头", count: 1, isCore: false },
        { name: "DSM摄像头", count: 1, isCore: false }
      ]
    }
  ]

  var handleCopy = function() {
    navigator.clipboard.writeText("XS20260415006")
    setCopied(true)
    setTimeout(function() {
      setCopied(false)
    }, 2000)
  }

  var handleInputChange = function(field, value) {
    setFormData(function(prev) {
      var newData = {}
      for (var key in prev) {
        newData[key] = prev[key]
      }
      newData[field] = value
      return newData
    })
  }

  var handleProductClick = function(product) {
    setCurrentProduct(product)
    setSelectedDevice(productSelections[product.id] || null)
    setShowDeviceSelect(true)
  }

  var handleDeviceSelect = function(device) {
    setSelectedDevice(device)
  }

  var handleConfirmDevice = function() {
    if (selectedDevice && currentProduct) {
      setProductSelections(function(prev) {
        var newSelections = {}
        for (var key in prev) {
          newSelections[key] = prev[key]
        }
        newSelections[currentProduct.id] = selectedDevice
        return newSelections
      })
      setShowDeviceSelect(false)
      setCurrentProduct(null)
      setSelectedDevice(null)
    }
  }

  var handleComboSelect = function(combo) {
    setSelectedCombo(combo)
    // 自动填充所有品类可选的槽位
    var newSelections = {}
    products.forEach(function(product) {
      if (product.type === "selectable") {
        var options = deviceOptions[product.category]
        if (options && options.recommended && options.recommended.length > 0) {
          newSelections[product.id] = options.recommended[0]
        }
      }
    })
    setProductSelections(newSelections)
    setShowComboSelect(false)
  }

  var handleClearCombo = function() {
    setSelectedCombo(null)
    setProductSelections({})
  }

  var handleImageUpload = function() {
    var newImage = "https://via.placeholder.com/100x100?text=图片" + (uploadedImages.length + 1)
    setUploadedImages(function(prev) {
      return prev.concat([newImage])
    })
  }

  var handleCarNumberClick = function() {
    // 初始化车牌输入状态
    if (formData.carNumber) {
      setCarNumberProvince(formData.carNumber.charAt(0) || "")
      setCarNumberRest(formData.carNumber.slice(1) || "")
      setCarInputStep(formData.carNumber.length > 0 ? 1 : 0)
    } else {
      setCarNumberProvince("")
      setCarNumberRest("")
      setCarInputStep(0)
    }
    setShowCarNumberInput(true)
  }

  var handleProvinceSelect = function(province) {
    setCarNumberProvince(province)
    setCarInputStep(1)
  }

  var handleCarKeyPress = function(key) {
    if (carNumberRest.length < 6) {
      setCarNumberRest(carNumberRest + key)
    }
  }

  var handleCarKeyDelete = function() {
    if (carNumberRest.length > 0) {
      setCarNumberRest(carNumberRest.slice(0, -1))
    } else if (carNumberProvince) {
      setCarNumberProvince("")
      setCarInputStep(0)
    }
  }

  var handleCarNumberConfirm = function() {
    var fullCarNumber = carNumberProvince + carNumberRest
    handleInputChange("carNumber", fullCarNumber)
    setShowCarNumberInput(false)
  }

  var styles = {
    container: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
      maxWidth: "430px",
      margin: "0 auto",
      position: "relative",
      paddingBottom: "80px"
    },
    header: {
      background: "linear-gradient(135deg, #FF9500 0%, #FF7A00 100%)",
      padding: "12px 16px 20px",
      color: "white"
    },
    headerTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "16px"
    },
    backBtn: {
      fontSize: "24px",
      background: "none",
      border: "none",
      color: "white",
      cursor: "pointer",
      padding: "0"
    },
    headerTitle: {
      fontSize: "17px",
      fontWeight: "500"
    },
    headerRight: {
      display: "flex",
      gap: "8px"
    },
    headerRightBtn: {
      width: "32px",
      height: "32px",
      borderRadius: "16px",
      backgroundColor: "rgba(255,255,255,0.2)",
      border: "none",
      color: "white",
      fontSize: "14px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    orderInfo: {
      marginBottom: "8px"
    },
    orderTitle: {
      fontSize: "22px",
      fontWeight: "600",
      marginBottom: "4px",
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    orderNumber: {
      fontSize: "15px",
      fontWeight: "400",
      opacity: 0.9
    },
    copyBtn: {
      fontSize: "13px",
      background: "none",
      border: "none",
      color: "white",
      cursor: "pointer",
      opacity: 0.9,
      textDecoration: "underline"
    },
    orderStatus: {
      fontSize: "14px",
      opacity: 0.9
    },
    logBtn: {
      backgroundColor: "rgba(255,255,255,0.25)",
      border: "none",
      borderRadius: "16px",
      padding: "6px 14px",
      color: "white",
      fontSize: "13px",
      cursor: "pointer",
      marginTop: "8px"
    },
    tabContainer: {
      backgroundColor: "white",
      borderTopLeftRadius: "16px",
      borderTopRightRadius: "16px",
      marginTop: "-12px",
      position: "relative",
      zIndex: 1
    },
    tabList: {
      display: "flex",
      borderBottom: "1px solid #eee"
    },
    tab: {
      flex: 1,
      padding: "14px 8px",
      textAlign: "center",
      fontSize: "14px",
      color: "#666",
      border: "none",
      background: "none",
      cursor: "pointer",
      position: "relative"
    },
    tabActive: {
      color: "#FF7A00",
      fontWeight: "500"
    },
    tabIndicator: {
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      width: "24px",
      height: "3px",
      backgroundColor: "#FF7A00",
      borderRadius: "2px"
    },
    content: {
      padding: "12px",
      backgroundColor: "#f5f5f5"
    },
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "12px"
    },
    cardTitle: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "12px"
    },
    formRow: {
      display: "flex",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid #f0f0f0"
    },
    formRowLast: {
      borderBottom: "none"
    },
    formLabel: {
      width: "80px",
      fontSize: "14px",
      color: "#333",
      flexShrink: 0
    },
    formInput: {
      flex: 1,
      border: "none",
      outline: "none",
      fontSize: "14px",
      color: "#333",
      backgroundColor: "transparent"
    },
    formPlaceholder: {
      color: "#999"
    },
    formSelect: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer"
    },
    formSelectText: {
      fontSize: "14px",
      color: "#999"
    },
    formSelectValue: {
      fontSize: "14px",
      color: "#333"
    },
    arrow: {
      fontSize: "14px",
      color: "#ccc"
    },
    installerRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 0",
      borderBottom: "1px solid #f0f0f0",
      cursor: "pointer"
    },
    installerLabel: {
      fontSize: "14px",
      color: "#333"
    },
    installerValue: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "14px",
      color: "#333"
    },
    textarea: {
      width: "100%",
      minHeight: "80px",
      border: "1px solid #eee",
      borderRadius: "8px",
      padding: "12px",
      fontSize: "14px",
      resize: "none",
      outline: "none",
      backgroundColor: "#fafafa",
      boxSizing: "border-box"
    },
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "12px"
    },
    sectionTitle: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333"
    },
    addBtn: {
      border: "1px solid #FF7A00",
      borderRadius: "16px",
      padding: "6px 12px",
      backgroundColor: "white",
      color: "#FF7A00",
      fontSize: "13px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    scanBtn: {
      border: "1px solid #FF7A00",
      borderRadius: "4px",
      padding: "6px 12px",
      backgroundColor: "white",
      color: "#FF7A00",
      fontSize: "13px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    productItem: {
      display: "flex",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid #f0f0f0"
    },
    productTag: {
      backgroundColor: "#FF7A00",
      color: "white",
      fontSize: "11px",
      padding: "2px 6px",
      borderRadius: "4px",
      marginRight: "8px"
    },
    productName: {
      flex: 1,
      fontSize: "14px",
      color: "#333"
    },
    productCount: {
      fontSize: "14px",
      color: "#666"
    },
    dismantleHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "16px"
    },
    dismantleTitle: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "15px",
      fontWeight: "600",
      color: "#333"
    },
    checkIcon: {
      width: "20px",
      height: "20px",
      borderRadius: "10px",
      backgroundColor: "#FF7A00",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px"
    },
    recycleBtn: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "13px",
      color: "#666",
      cursor: "pointer"
    },
    productInfoItem: {
      display: "flex",
      flexDirection: "column",
      padding: "14px 0",
      borderBottom: "1px solid #f0f0f0",
      cursor: "pointer"
    },
    // 三行布局样式
    productRow1: {
      marginBottom: "6px"
    },
    productRow2: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "4px"
    },
    productRow2Left: {
      display: "flex",
      alignItems: "center"
    },
    productRow2Right: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    productRow3: {
      marginTop: "2px"
    },
    // 安装部位标签样式（新版：自适应宽度，不截断）
    installLocationTagNew: {
      display: "inline-block",
      backgroundColor: "#FFF3E0",
      border: "1px solid #FA8C16",
      borderRadius: "6px",
      padding: "4px 10px",
      fontSize: "13px",
      fontWeight: "500",
      color: "#FA8C16"
    },
    // 安装部位标签样式
    installLocationTag: {
      backgroundColor: "#FFF3E0",
      border: "1px solid #FA8C16",
      borderRadius: "6px",
      padding: "4px 10px",
      fontSize: "13px",
      fontWeight: "500",
      color: "#FA8C16",
      marginRight: "10px",
      maxWidth: "90px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      flexShrink: 0,
      position: "relative"
    },
    locationCountBadge: {
      position: "absolute",
      top: "-6px",
      right: "-6px",
      backgroundColor: "#FA8C16",
      color: "white",
      fontSize: "10px",
      width: "16px",
      height: "16px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    slotTypeTagNew: {
      fontSize: "11px",
      padding: "2px 6px",
      borderRadius: "4px",
      marginRight: "8px"
    },
    slotTypeFixedNew: {
      backgroundColor: "#F5F5F5",
      color: "#8C8C8C"
    },
    slotTypeSelectableNew: {
      backgroundColor: "#FFF3E0",
      color: "#FA8C16"
    },
    productNameText: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#262626",
      whiteSpace: "nowrap"
    },
    productModelText: {
      fontSize: "12px",
      color: "#8C8C8C"
    },
    productSelectPrompt: {
      fontSize: "12px",
      color: "#FA8C16"
    },
    progressText: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#FA8C16"
    },
    progressTextComplete: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#52C41A"
    },
    countText: {
      fontSize: "12px",
      color: "#8C8C8C",
      marginRight: "8px"
    },
    scanStatus: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "13px",
      color: "#FF7A00"
    },
    uploadArea: {
      width: "120px",
      height: "120px",
      border: "1px dashed #FF7A00",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      backgroundColor: "#fffaf5"
    },
    uploadIcon: {
      fontSize: "32px",
      color: "#FF7A00",
      marginBottom: "8px"
    },
    uploadText: {
      fontSize: "13px",
      color: "#FF7A00"
    },
    imageGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px"
    },
    uploadedImage: {
      width: "100px",
      height: "100px",
      borderRadius: "8px",
      objectFit: "cover"
    },
    footer: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      display: "flex",
      gap: "12px",
      padding: "12px 16px",
      backgroundColor: "white",
      borderTop: "1px solid #eee",
      maxWidth: "430px",
      margin: "0 auto"
    },
    returnBtn: {
      flex: 1,
      padding: "14px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#FF7A00",
      color: "white",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer"
    },
    completeBtn: {
      flex: 1,
      padding: "14px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#52c41a",
      color: "white",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer"
    },
    picker: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "white",
      borderTopLeftRadius: "16px",
      borderTopRightRadius: "16px",
      padding: "16px",
      zIndex: 1000,
      maxWidth: "430px",
      margin: "0 auto"
    },
    pickerOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 999
    },
    pickerHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
      paddingBottom: "12px",
      borderBottom: "1px solid #eee"
    },
    pickerTitle: {
      fontSize: "16px",
      fontWeight: "500",
      color: "#333"
    },
    pickerClose: {
      fontSize: "20px",
      color: "#999",
      background: "none",
      border: "none",
      cursor: "pointer"
    },
    pickerOption: {
      padding: "14px 0",
      fontSize: "15px",
      color: "#333",
      borderBottom: "1px solid #f0f0f0",
      cursor: "pointer"
    },
    infoRow: {
      display: "flex",
      alignItems: "flex-start",
      padding: "12px 0",
      borderBottom: "1px solid #f0f0f0"
    },
    infoLabel: {
      width: "80px",
      fontSize: "14px",
      color: "#666",
      flexShrink: 0
    },
    infoValue: {
      flex: 1,
      fontSize: "14px",
      color: "#333",
      fontWeight: "500"
    },
    infoLink: {
      color: "#1890ff",
      cursor: "pointer"
    },
    infoStatus: {
      color: "#FF7A00"
    },
    infoAction: {
      color: "#FF7A00",
      fontSize: "13px",
      cursor: "pointer"
    },
    areaRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 0",
      borderBottom: "1px solid #f0f0f0",
      cursor: "pointer"
    },
    remarkCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "16px"
    },
    remarkTitle: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "12px",
      paddingBottom: "12px",
      borderBottom: "1px solid #f0f0f0"
    },
    remarkContent: {
      fontSize: "14px",
      color: "#999"
    },
    // 组合商品快捷入口样式
    comboEntry: {
      backgroundColor: "#fffaf5",
      border: "1px dashed #FF7A00",
      borderRadius: "8px",
      padding: "14px 16px",
      marginBottom: "12px",
      cursor: "pointer"
    },
    comboEntrySelected: {
      backgroundColor: "#fff7ed",
      border: "1px solid #FF7A00"
    },
    comboEntryText: {
      fontSize: "14px",
      color: "#FF7A00",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    },
    comboSelectedInfo: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    comboActions: {
      display: "flex",
      gap: "12px"
    },
    comboActionBtn: {
      fontSize: "13px",
      color: "#FF7A00",
      background: "none",
      border: "none",
      cursor: "pointer",
      textDecoration: "underline"
    },
    // 产品槽位类型标签
    slotTypeTag: {
      fontSize: "11px",
      padding: "2px 6px",
      borderRadius: "4px",
      marginRight: "8px"
    },
    slotTypeFixed: {
      backgroundColor: "#f0f0f0",
      color: "#666"
    },
    slotTypeSelectable: {
      backgroundColor: "#fff7ed",
      color: "#FF7A00"
    },
    // 适配状态标识
    compatibleIcon: {
      width: "8px",
      height: "8px",
      borderRadius: "4px",
      marginRight: "6px"
    },
    compatibleGreen: {
      backgroundColor: "#34C759"
    },
    compatibleRed: {
      backgroundColor: "#FF3B30"
    },
    comboFilledTag: {
      fontSize: "11px",
      color: "#999",
      backgroundColor: "#f5f5f5",
      padding: "2px 6px",
      borderRadius: "4px",
      marginLeft: "8px"
    },
    // 设备选择页面样式
    deviceSelectPage: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#f5f5f5",
      zIndex: 2000,
      maxWidth: "430px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column"
    },
    deviceSelectHeader: {
      background: "linear-gradient(135deg, #FF9500 0%, #FF7A00 100%)",
      padding: "12px 16px",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    searchBar: {
      display: "flex",
      alignItems: "center",
      backgroundColor: "white",
      padding: "10px 16px",
      gap: "12px"
    },
    searchInput: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px",
      padding: "10px 12px",
      gap: "8px"
    },
    searchInputField: {
      flex: 1,
      border: "none",
      outline: "none",
      backgroundColor: "transparent",
      fontSize: "14px"
    },
    filterBtn: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      color: "#FF7A00",
      fontSize: "14px",
      cursor: "pointer"
    },
    deviceList: {
      flex: 1,
      overflow: "auto",
      padding: "0 12px"
    },
    deviceSection: {
      marginTop: "12px"
    },
    deviceSectionTitle: {
      fontSize: "13px",
      fontWeight: "500",
      padding: "8px 0",
      display: "flex",
      alignItems: "center",
      gap: "6px"
    },
    deviceCard: {
      backgroundColor: "white",
      borderRadius: "8px",
      marginBottom: "8px",
      overflow: "hidden"
    },
    deviceItem: {
      display: "flex",
      alignItems: "center",
      padding: "14px 16px",
      borderBottom: "1px solid #f0f0f0",
      cursor: "pointer"
    },
    deviceItemLast: {
      borderBottom: "none"
    },
    deviceIcon: {
      width: "40px",
      height: "40px",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginRight: "12px",
      fontSize: "20px"
    },
    deviceInfo: {
      flex: 1
    },
    deviceCode: {
      fontSize: "15px",
      fontWeight: "500",
      color: "#333",
      marginBottom: "4px"
    },
    deviceName: {
      fontSize: "13px",
      color: "#999"
    },
    deviceOldTag: {
      fontSize: "12px",
      color: "#FF3B30",
      marginRight: "12px"
    },
    deviceRadio: {
      width: "22px",
      height: "22px",
      borderRadius: "11px",
      border: "2px solid #ddd",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    deviceRadioSelected: {
      borderColor: "#FF7A00"
    },
    deviceRadioInner: {
      width: "12px",
      height: "12px",
      borderRadius: "6px",
      backgroundColor: "#FF7A00"
    },
    deviceSelectFooter: {
      padding: "12px 16px",
      backgroundColor: "white",
      borderTop: "1px solid #eee"
    },
    confirmSelectBtn: {
      width: "100%",
      padding: "14px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#FF7A00",
      color: "white",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer"
    },
    incompatibleReason: {
      fontSize: "12px",
      color: "#FF3B30",
      marginTop: "4px"
    },
    sameBrandBadge: {
      fontSize: "11px",
      color: "#FF7A00",
      backgroundColor: "#fff7ed",
      padding: "2px 6px",
      borderRadius: "4px",
      marginLeft: "8px"
    },
    // 组合商品弹窗
    comboModal: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "white",
      borderTopLeftRadius: "16px",
      borderTopRightRadius: "16px",
      padding: "16px",
      zIndex: 1000,
      maxWidth: "430px",
      margin: "0 auto",
      maxHeight: "60vh",
      overflow: "auto"
    },
    comboCard: {
      border: "1px solid #eee",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "12px"
    },
    comboName: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "8px"
    },
    comboItems: {
      fontSize: "13px",
      color: "#666",
      marginBottom: "8px"
    },
    comboMeta: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    comboTotal: {
      fontSize: "13px",
      color: "#999"
    },
    comboStatus: {
      fontSize: "13px",
      color: "#34C759"
    },
    comboSelectBtn: {
      backgroundColor: "#FF7A00",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "8px 16px",
      fontSize: "13px",
      cursor: "pointer"
    },
    // 车牌输入组件样式
    carInputModal: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#f5f5f5",
      borderTopLeftRadius: "16px",
      borderTopRightRadius: "16px",
      zIndex: 1000,
      maxWidth: "430px",
      margin: "0 auto"
    },
    carInputHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px",
      backgroundColor: "white",
      borderTopLeftRadius: "16px",
      borderTopRightRadius: "16px",
      borderBottom: "1px solid #eee"
    },
    carInputDisplay: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 16px",
      backgroundColor: "white",
      gap: "6px"
    },
    carInputBox: {
      width: "36px",
      height: "44px",
      border: "1px solid #ddd",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      fontWeight: "500",
      backgroundColor: "white"
    },
    carInputBoxActive: {
      borderColor: "#FF7A00",
      borderWidth: "2px"
    },
    carInputBoxFilled: {
      backgroundColor: "#fff7ed",
      borderColor: "#FF7A00"
    },
    carInputDot: {
      width: "8px",
      height: "8px",
      borderRadius: "4px",
      backgroundColor: "#FF7A00",
      margin: "0 4px"
    },
    provinceGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: "8px",
      padding: "16px",
      backgroundColor: "white"
    },
    provinceBtn: {
      padding: "12px 8px",
      border: "1px solid #eee",
      borderRadius: "6px",
      backgroundColor: "white",
      fontSize: "16px",
      cursor: "pointer",
      textAlign: "center"
    },
    provinceBtnActive: {
      backgroundColor: "#FF7A00",
      color: "white",
      borderColor: "#FF7A00"
    },
    keyboardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(10, 1fr)",
      gap: "4px",
      padding: "8px 16px",
      backgroundColor: "#d1d5db"
    },
    keyboardBtn: {
      padding: "14px 0",
      border: "none",
      borderRadius: "6px",
      backgroundColor: "white",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer",
      textAlign: "center"
    },
    keyboardBtnDelete: {
      gridColumn: "span 2",
      backgroundColor: "#9ca3af",
      color: "white"
    },
    carInputActions: {
      display: "flex",
      gap: "12px",
      padding: "12px 16px",
      backgroundColor: "#d1d5db"
    },
    carInputCancelBtn: {
      flex: 1,
      padding: "14px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "white",
      color: "#333",
      fontSize: "16px",
      cursor: "pointer"
    },
    carInputConfirmBtn: {
      flex: 1,
      padding: "14px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#FF7A00",
      color: "white",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer"
    },
    // 组合商品产品列表样式
    comboProductList: {
      marginTop: "12px",
      borderTop: "1px solid #f0f0f0",
      paddingTop: "12px"
    },
    comboProductItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 0",
      fontSize: "13px",
      color: "#666"
    },
    comboProductLeft: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    coreTag: {
      backgroundColor: "#FF7A00",
      color: "white",
      fontSize: "10px",
      padding: "2px 6px",
      borderRadius: "4px"
    },
    comboDeviceCode: {
      fontSize: "12px",
      color: "#52c41a",
      marginLeft: "8px"
    },
    // 选择完成状态
    selectedCheckIcon: {
      width: "20px",
      height: "20px",
      borderRadius: "10px",
      backgroundColor: "#52c41a",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px"
    },
    deviceCodeDisplay: {
      fontSize: "12px",
      color: "#52c41a",
      marginTop: "2px"
    }
  }

  var renderBasicInfo = function() {
    return (
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.areaRow} onClick={function() { setShowAreaPicker(true) }}>
            <span style={{ fontSize: "14px", color: "#333" }}>区域</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "14px", color: "#999" }}>请输入地区</span>
              <span style={styles.arrow}>{">"}</span>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>销售单号</span>
            <span style={styles.infoValue}>XS20260415006</span>
            <span style={styles.infoAction} onClick={handleCopy}>{copied ? "已复制" : "复制"}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>联系人</span>
            <span style={styles.infoValue}>-- <span style={styles.infoLink}>(--)</span></span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>所属销售</span>
            <span style={styles.infoValue}>张欢 <span style={styles.infoLink}>(18719021112)</span></span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>财务状态</span>
            <span style={Object.assign({}, styles.infoValue, styles.infoStatus)}>未结清</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>结算方法</span>
            <span style={styles.infoValue}>记账(--)</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>关联公司</span>
            <span style={styles.infoValue}>依嘘唏悲哉公司</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>地址信息</span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <input
                type="text"
                placeholder="请输入地址"
                value={formData.address}
                onChange={function(e) { handleInputChange("address", e.target.value) }}
                style={Object.assign({}, styles.formInput, { color: formData.address ? "#333" : "#999" })}
              />
              <span style={{ color: "#FF7A00", fontSize: "18px" }}>@</span>
            </div>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>下单时间</span>
            <span style={styles.infoValue}>2026-04-15 20:12:57</span>
          </div>
          <div style={Object.assign({}, styles.infoRow, { borderBottom: "none" })}>
            <span style={styles.infoLabel}>预约时间</span>
            <span style={styles.infoValue}>-- (预计)</span>
            <span style={styles.infoAction}>调整</span>
          </div>
        </div>

        <div style={styles.remarkCard}>
          <div style={styles.remarkTitle}>单据备注</div>
          <div style={styles.remarkContent}>--</div>
        </div>
      </div>
    )
  }

  var renderReportInfo = function() {
    return (
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>填写信息</div>
          <div style={styles.formRow} onClick={handleCarNumberClick}>
            <span style={styles.formLabel}>车牌号</span>
            <div style={Object.assign({}, styles.formSelect, { cursor: "pointer" })}>
              <span style={formData.carNumber ? styles.formSelectValue : styles.formSelectText}>
                {formData.carNumber || "请输入车牌号"}
              </span>
              <span style={styles.arrow}>{">"}</span>
            </div>
          </div>
          <div style={styles.formRow}>
            <span style={styles.formLabel}>车架号</span>
            <input
              type="text"
              placeholder="请输入车架号"
              value={formData.frameNumber}
              onChange={function(e) { handleInputChange("frameNumber", e.target.value) }}
              style={styles.formInput}
            />
          </div>
          <div style={Object.assign({}, styles.formRow, styles.formRowLast)}>
            <span style={styles.formLabel}>车辆类型</span>
            <div style={styles.formSelect} onClick={function() { setShowVehicleTypePicker(true) }}>
              <span style={formData.carType ? styles.formSelectValue : styles.formSelectText}>
                {formData.carType || "请选择车辆类型"}
              </span>
              <span style={styles.arrow}>{">"}</span>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.installerRow} onClick={function() {}}>
            <span style={styles.installerLabel}>安装师傅1</span>
            <span style={styles.installerValue}>
              {formData.installer1 || "请选择"} <span style={styles.arrow}>{">"}</span>
            </span>
          </div>
          <div style={Object.assign({}, styles.installerRow, { borderBottom: "none" })} onClick={function() { setShowInstaller2Picker(true) }}>
            <span style={styles.installerLabel}>安装师傅2</span>
            <span style={styles.installerValue}>
              <span style={{ color: formData.installer2 ? "#333" : "#999" }}>
                {formData.installer2 || "请选择"}
              </span>
              <span style={styles.arrow}>{">"}</span>
            </span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>报单备注</div>
          <textarea
            placeholder="请在此输入报单备注"
            value={formData.remark}
            onChange={function(e) { handleInputChange("remark", e.target.value) }}
            style={styles.textarea}
          />
        </div>
      </div>
    )
  }

  var renderReportProduct = function() {
    return (
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>下单产品(1)</span>
            <button style={styles.addBtn}>
              <span>+</span> 添加产品
            </button>
          </div>
          <div style={styles.productItem}>
            <span style={styles.productTag}>套餐</span>
            <span style={styles.productName}>以租代购-三年方案</span>
            <span style={styles.productCount}>x1</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.dismantleHeader}>
            <div style={styles.dismantleTitle}>
              <span style={styles.checkIcon}>V</span>
              旧设备拆机
            </div>
            <div style={styles.recycleBtn}>
              旧设备需回收 <span style={styles.arrow}>{">"}</span>
            </div>
          </div>
          <div style={styles.formRow}>
            <span style={styles.formLabel}>选择拆机套餐</span>
            <div style={styles.formSelect} onClick={function() { setShowDismantlePackagePicker(true) }}>
              <span style={styles.formSelectValue}>{formData.dismantlePackage}</span>
              <span style={styles.arrow}>{">"}</span>
            </div>
          </div>
          <div style={styles.formRow}>
            <span style={styles.formLabel}>主机品牌</span>
            <div style={styles.formSelect} onClick={function() { setShowHostBrandPicker(true) }}>
              <span style={styles.formSelectValue}>{formData.hostBrand}</span>
              <span style={styles.arrow}>{">"}</span>
            </div>
          </div>
          <div style={Object.assign({}, styles.formRow, styles.formRowLast)}>
            <span style={styles.formLabel}>旧主机码</span>
            <input
              type="text"
              placeholder="请输入旧主机码"
              value={formData.oldHostCode}
              onChange={function(e) { handleInputChange("oldHostCode", e.target.value) }}
              style={styles.formInput}
            />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>产品信息({Object.keys(productSelections).length}/{products.length}):</span>
            <button style={styles.scanBtn}>
              <span>{"[ ]"}</span> 扫 码
            </button>
          </div>

          {/* 组合商品快捷入口 */}
          {selectedCombo ? (
            <div style={Object.assign({}, styles.comboEntry, styles.comboEntrySelected)}>
              <div style={styles.comboSelectedInfo}>
                <div>
                  <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>已选组合商品</div>
                  <div style={{ fontSize: "14px", color: "#333", fontWeight: "500" }}>{selectedCombo.name}</div>
                </div>
                <div style={styles.comboActions}>
                  <button style={styles.comboActionBtn} onClick={function() { setShowComboSelect(true) }}>更换</button>
                  <button style={styles.comboActionBtn} onClick={handleClearCombo}>清除</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.comboEntry} onClick={function() { setShowComboSelect(true) }}>
              <div style={styles.comboEntryText}>
                <span>{"*"}</span> 选择组合商品，一键完成全部选配 <span style={styles.arrow}>{">"}</span>
              </div>
            </div>
          )}

          {/* 产品槽位列表 */}
          {products.map(function(product, index) {
            var selection = productSelections[product.id]
            var isFixed = product.type === "fixed"
            var displayModel = isFixed ? product.name : (selection ? selection.name : "")
            var isIncompatible = selection && selection.compatible === false
            var isSelected = !!selection || isFixed

            return (
              <div 
                key={index} 
                style={Object.assign({}, styles.productInfoItem, index === products.length - 1 ? { borderBottom: "none" } : {})}
                onClick={function() { handleProductClick(product) }}
              >
                {/* 第一行：安装部位标签 */}
                <div style={styles.productRow1}>
                  <span style={styles.installLocationTagNew}>{product.installLocation}</span>
                </div>

                {/* 第二行：[类型标签] + 产品名称（左）+ x1 进度（右）*/}
                <div style={styles.productRow2}>
                  <div style={styles.productRow2Left}>
                    <span style={Object.assign({}, styles.slotTypeTagNew, isFixed ? styles.slotTypeFixedNew : styles.slotTypeSelectableNew)}>
                      {isFixed ? "指定型号" : "品类可选"}
                    </span>
                    <span style={styles.productNameText}>{product.category}</span>
                  </div>
                  <div style={styles.productRow2Right}>
                    <span style={styles.countText}>x{product.count}</span>
                    {isSelected ? (
                      <span style={styles.progressTextComplete}>1/1</span>
                    ) : (
                      <span style={styles.progressText}>0/1</span>
                    )}
                    <span style={{ color: "#BFBFBF", fontSize: "14px" }}>{">"}</span>
                  </div>
                </div>

                {/* 第三行：型号编码 或 「点击选择型号 >」*/}
                <div style={styles.productRow3}>
                  {isFixed ? (
                    <span style={styles.productModelText}>{product.name}</span>
                  ) : selection ? (
                    <span style={styles.productModelText}>{selection.name}</span>
                  ) : (
                    <span style={styles.productSelectPrompt}>{"点击选择型号 >"}</span>
                  )}
                </div>

                {/* 显示已选设备编码 */}
                {selection && selection.code && (
                  <div style={styles.deviceCodeDisplay}>设备编码: {selection.code}</div>
                )}
                {/* 组合商品填充标签 */}
                {selection && selectedCombo && (
                  <div style={{ marginTop: "4px" }}>
                    <span style={styles.comboFilledTag}>由组合商品填充</span>
                  </div>
                )}
                {/* 不适配警告 */}
                {isIncompatible && selection.reason && (
                  <div style={styles.incompatibleReason}>{selection.reason}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  var renderReportImages = function() {
    return (
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.imageGrid}>
            {uploadedImages.map(function(img, index) {
              return (
                <img key={index} src={img} alt={"上传图片" + (index + 1)} style={styles.uploadedImage} />
              )
            })}
            <div style={styles.uploadArea} onClick={handleImageUpload}>
              <span style={styles.uploadIcon}>{"[O]"}</span>
              <span style={styles.uploadText}>点击上传</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  var renderPicker = function(show, setShow, title, options, field) {
    if (!show) return null
    return (
      <React.Fragment>
        <div style={styles.pickerOverlay} onClick={function() { setShow(false) }} />
        <div style={styles.picker}>
          <div style={styles.pickerHeader}>
            <span style={styles.pickerTitle}>{title}</span>
            <button style={styles.pickerClose} onClick={function() { setShow(false) }}>x</button>
          </div>
          {options.map(function(option, index) {
            return (
              <div
                key={index}
                style={styles.pickerOption}
                onClick={function() {
                  handleInputChange(field, option)
                  setShow(false)
                }}
              >
                {option}
              </div>
            )
          })}
        </div>
      </React.Fragment>
    )
  }

  // 设备选择页面
  var renderDeviceSelectPage = function() {
    if (!showDeviceSelect || !currentProduct) return null

    var options = deviceOptions[currentProduct.category] || { recommended: [], other: [], incompatible: [] }
    
    // 过滤搜索结果
    var filterDevices = function(devices) {
      if (!deviceSearchText) return devices
      return devices.filter(function(d) {
        return d.code.indexOf(deviceSearchText) !== -1 || d.name.indexOf(deviceSearchText) !== -1
      })
    }

    var filteredRecommended = filterDevices(options.recommended)
    var filteredOther = filterDevices(options.other)
    var filteredIncompatible = filterDevices(options.incompatible)

    return (
      <div style={styles.deviceSelectPage}>
        {/* 顶部导航 */}
        <div style={styles.deviceSelectHeader}>
          <button style={styles.backBtn} onClick={function() { setShowDeviceSelect(false); setCurrentProduct(null); setSelectedDevice(null); setDeviceSearchText(""); }}>{"<"}</button>
          <span style={styles.headerTitle}>选择设备</span>
          <div style={styles.headerRight}>
            <button style={styles.headerRightBtn}>{"--"}</button>
            <button style={styles.headerRightBtn}>{"O"}</button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div style={styles.searchBar}>
          <div style={styles.searchInput}>
            <span style={{ color: "#999" }}>Q</span>
            <input 
              type="text" 
              placeholder="搜索设备码或产品名称" 
              style={styles.searchInputField}
              value={deviceSearchText}
              onChange={function(e) { setDeviceSearchText(e.target.value) }}
            />
          </div>
          <div style={styles.filterBtn}>
            筛选 <span>Y</span>
          </div>
        </div>

        {/* 设备列表 */}
        <div style={styles.deviceList}>
          {/* 适配推荐区 */}
          {filteredRecommended.length > 0 && (
            <div style={styles.deviceSection}>
              <div style={Object.assign({}, styles.deviceSectionTitle, { color: "#34C759" })}>
                <span style={Object.assign({}, styles.compatibleIcon, styles.compatibleGreen)}></span>
                适配推荐
              </div>
              <div style={styles.deviceCard}>
                {filteredRecommended.map(function(device, index) {
                  var isSelected = selectedDevice && selectedDevice.code === device.code
                  return (
                    <div 
                      key={device.code}
                      style={Object.assign({}, styles.deviceItem, index === filteredRecommended.length - 1 ? styles.deviceItemLast : {})}
                      onClick={function() { handleDeviceSelect(device) }}
                    >
                      <div style={styles.deviceIcon}>{"[=]"}</div>
                      <div style={styles.deviceInfo}>
                        <div style={styles.deviceCode}>
                          {device.code}
                          {device.sameBrand && <span style={styles.sameBrandBadge}>同品牌</span>}
                        </div>
                        <div style={styles.deviceName}>{device.name}</div>
                      </div>
                      <div style={Object.assign({}, styles.deviceRadio, isSelected ? styles.deviceRadioSelected : {})}>
                        {isSelected && <div style={styles.deviceRadioInner}></div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 其他可选区 */}
          {filteredOther.length > 0 && (
            <div style={styles.deviceSection}>
              <div style={Object.assign({}, styles.deviceSectionTitle, { color: "#999" })}>
                其他可选
              </div>
              <div style={styles.deviceCard}>
                {filteredOther.map(function(device, index) {
                  var isSelected = selectedDevice && selectedDevice.code === device.code
                  return (
                    <div 
                      key={device.code}
                      style={Object.assign({}, styles.deviceItem, index === filteredOther.length - 1 ? styles.deviceItemLast : {})}
                      onClick={function() { handleDeviceSelect(device) }}
                    >
                      <div style={styles.deviceIcon}>{"[=]"}</div>
                      <div style={styles.deviceInfo}>
                        <div style={styles.deviceCode}>{device.code}</div>
                        <div style={styles.deviceName}>{device.name}</div>
                      </div>
                      <div style={Object.assign({}, styles.deviceRadio, isSelected ? styles.deviceRadioSelected : {})}>
                        {isSelected && <div style={styles.deviceRadioInner}></div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 不适配区 */}
          {filteredIncompatible.length > 0 && (
            <div style={styles.deviceSection}>
              <div style={Object.assign({}, styles.deviceSectionTitle, { color: "#FF3B30" })}>
                <span style={Object.assign({}, styles.compatibleIcon, styles.compatibleRed)}></span>
                不适配
              </div>
              <div style={styles.deviceCard}>
                {filteredIncompatible.map(function(device, index) {
                  var isSelected = selectedDevice && selectedDevice.code === device.code
                  return (
                    <div 
                      key={device.code}
                      style={Object.assign({}, styles.deviceItem, index === filteredIncompatible.length - 1 ? styles.deviceItemLast : {})}
                      onClick={function() { handleDeviceSelect(device) }}
                    >
                      <div style={styles.deviceIcon}>{"[=]"}</div>
                      <div style={styles.deviceInfo}>
                        <div style={Object.assign({}, styles.deviceCode, { color: "#999" })}>{device.code}</div>
                        <div style={styles.deviceName}>{device.name}</div>
                        {device.reason && <div style={styles.incompatibleReason}>{device.reason}</div>}
                      </div>
                      <span style={styles.deviceOldTag}>旧</span>
                      <div style={Object.assign({}, styles.deviceRadio, isSelected ? styles.deviceRadioSelected : {})}>
                        {isSelected && <div style={styles.deviceRadioInner}></div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 底部确认按钮 */}
        <div style={styles.deviceSelectFooter}>
          <button style={styles.confirmSelectBtn} onClick={handleConfirmDevice}>确定选择</button>
        </div>
      </div>
    )
  }

  // 组合商品选择弹窗
  var renderComboSelectModal = function() {
    if (!showComboSelect) return null
    return (
      <React.Fragment>
        <div style={styles.pickerOverlay} onClick={function() { setShowComboSelect(false) }} />
        <div style={styles.comboModal}>
          <div style={styles.pickerHeader}>
            <span style={styles.pickerTitle}>选择组合商品</span>
            <button style={styles.pickerClose} onClick={function() { setShowComboSelect(false) }}>x</button>
          </div>
          {comboProducts.map(function(combo) {
            return (
              <div key={combo.id} style={styles.comboCard}>
                <div style={styles.comboName}>{combo.name}</div>
                {/* 产品列表 */}
                <div style={styles.comboProductList}>
                  {combo.products.map(function(product, idx) {
                    return (
                      <div key={idx} style={styles.comboProductItem}>
                        <div style={styles.comboProductLeft}>
                          <span>{product.name}</span>
                          {product.isCore && <span style={styles.coreTag}>核心</span>}
                          {product.isCore && product.deviceCode && (
                            <span style={styles.comboDeviceCode}>设备编码: {product.deviceCode}</span>
                          )}
                        </div>
                        <span>x{product.count}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={styles.comboMeta}>
                  <div>
                    <span style={styles.comboTotal}>共{combo.total}件</span>
                    {combo.compatible && <span style={Object.assign({}, styles.comboStatus, { marginLeft: "12px" })}>V 全部适配</span>}
                  </div>
                  <button style={styles.comboSelectBtn} onClick={function() { handleComboSelect(combo) }}>选择</button>
                </div>
              </div>
            )
          })}
        </div>
      </React.Fragment>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <button style={styles.backBtn}>{"<"}</button>
          <span style={styles.headerTitle}>安装任务单</span>
          <div style={styles.headerRight}>
            <button style={styles.headerRightBtn}>{"--"}</button>
            <button style={styles.headerRightBtn}>{"O"}</button>
          </div>
        </div>
        <div style={styles.orderInfo}>
          <div style={styles.orderTitle}>
            安装单
            <span style={styles.orderNumber}>XS20260415006</span>
            <button style={styles.copyBtn} onClick={handleCopy}>
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={styles.orderStatus}>订单处理中</span>
            <button style={styles.logBtn}>查看日志</button>
          </div>
        </div>
      </div>

      <div style={styles.tabContainer}>
        <div style={styles.tabList}>
          {tabs.map(function(tab) {
            var isActive = activeTab === tab
            return (
              <button
                key={tab}
                style={Object.assign({}, styles.tab, isActive ? styles.tabActive : {})}
                onClick={function() { setActiveTab(tab) }}
              >
                {tab}
                {isActive && <div style={styles.tabIndicator} />}
              </button>
            )
          })}
        </div>

        {activeTab === "基本信息" && renderBasicInfo()}
        {activeTab === "报单信息" && renderReportInfo()}
        {activeTab === "报单产品" && renderReportProduct()}
        {activeTab === "报单图片" && renderReportImages()}
      </div>

      <div style={styles.footer}>
        <button style={styles.returnBtn}>退回重派</button>
        <button style={styles.completeBtn}>完成处理</button>
      </div>

      {renderPicker(showVehicleTypePicker, setShowVehicleTypePicker, "选择车辆类型", vehicleTypes, "carType")}
      {renderPicker(showInstaller2Picker, setShowInstaller2Picker, "选择安装师傅", installers, "installer2")}
      {renderPicker(showDismantlePackagePicker, setShowDismantlePackagePicker, "选择拆机套餐", dismantlePackages, "dismantlePackage")}
      {renderPicker(showHostBrandPicker, setShowHostBrandPicker, "选择主机品牌", hostBrands, "hostBrand")}
      {renderPicker(showAreaPicker, setShowAreaPicker, "选择区域", areas, "area")}
      
      {renderDeviceSelectPage()}
      {renderComboSelectModal()}

      {/* 车牌号输入组件 */}
      {showCarNumberInput && (
        <React.Fragment>
          <div style={styles.pickerOverlay} onClick={function() { setShowCarNumberInput(false) }} />
          <div style={styles.carInputModal}>
            <div style={styles.carInputHeader}>
              <span style={{ fontSize: "16px", fontWeight: "500" }}>输入车牌号</span>
              <button style={styles.pickerClose} onClick={function() { setShowCarNumberInput(false) }}>x</button>
            </div>
            
            {/* 车牌显示区 */}
            <div style={styles.carInputDisplay}>
              <div 
                style={Object.assign({}, styles.carInputBox, carNumberProvince ? styles.carInputBoxFilled : {}, carInputStep === 0 ? styles.carInputBoxActive : {})}
                onClick={function() { setCarInputStep(0) }}
              >
                {carNumberProvince || ""}
              </div>
              <div style={styles.carInputDot}></div>
              {[0, 1, 2, 3, 4, 5].map(function(i) {
                var char = carNumberRest.charAt(i) || ""
                var isActive = carInputStep === 1 && i === carNumberRest.length
                var isFilled = !!char
                return (
                  <div 
                    key={i} 
                    style={Object.assign({}, styles.carInputBox, isFilled ? styles.carInputBoxFilled : {}, isActive ? styles.carInputBoxActive : {})}
                  >
                    {char}
                  </div>
                )
              })}
            </div>

            {/* 省份选择或数字字母键盘 */}
            {carInputStep === 0 ? (
              <div style={styles.provinceGrid}>
                {provinces.map(function(province) {
                  var isActive = carNumberProvince === province
                  return (
                    <button 
                      key={province} 
                      style={Object.assign({}, styles.provinceBtn, isActive ? styles.provinceBtnActive : {})}
                      onClick={function() { handleProvinceSelect(province) }}
                    >
                      {province}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={styles.keyboardGrid}>
                {carKeyboard.map(function(key) {
                  return (
                    <button 
                      key={key} 
                      style={styles.keyboardBtn}
                      onClick={function() { handleCarKeyPress(key) }}
                    >
                      {key}
                    </button>
                  )
                })}
                <button 
                  style={Object.assign({}, styles.keyboardBtn, styles.keyboardBtnDelete)}
                  onClick={handleCarKeyDelete}
                >
                  删除
                </button>
              </div>
            )}

            {/* 操作按钮 */}
            <div style={styles.carInputActions}>
              <button style={styles.carInputCancelBtn} onClick={function() { setShowCarNumberInput(false) }}>取消</button>
              <button style={styles.carInputConfirmBtn} onClick={handleCarNumberConfirm}>确定</button>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  )
}

export default Component
