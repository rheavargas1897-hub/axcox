import React from "react"

const Component = function() {
  var _a = React.useState("售后故障"), activeType = _a[0], setActiveType = _a[1];
  var _b = React.useState("拆机移装"), installType = _b[0], setInstallType = _b[1];
  var _c = React.useState(false), isUrgent = _c[0], setIsUrgent = _c[1];
  var _d = React.useState(false), showOptions = _d[0], setShowOptions = _d[1];
  var _e = React.useState(false), showMedia = _e[0], setShowMedia = _e[1];
  var _f = React.useState(false), showHistory = _f[0], setShowHistory = _f[1];
  
  var _g = React.useState({
    card: false,
    host: false
  }), faultProducts = _g[0], setFaultProducts = _g[1];
  
  var _h = React.useState({
    video_remove: false,
    video_transfer: false,
    video_card: false,
    standard_remove: false,
    normal_remove: false
  }), serviceProducts = _h[0], setServiceProducts = _h[1];

  // 车辆信息状态
  var _i = React.useState(""), plateNumber = _i[0], setPlateNumber = _i[1];
  var _j = React.useState(""), vinNumber = _j[0], setVinNumber = _j[1];
  var _k = React.useState(""), orderCompany = _k[0], setOrderCompany = _k[1];
  var _l = React.useState(null as null | { id: string; name: string; plate: string; date: string; vin: string; company: string }), selectedVehicle = _l[0], setSelectedVehicle = _l[1];

  // 模拟现有车辆数据
  var existingVehicles = [
    { id: "1", name: "网约车（粤A）", plate: "粤A12345", date: "2026-03-12", vin: "LVSHDFAC5GE123456", company: "广州运输公司" },
    { id: "2", name: "货运车（粤B）", plate: "粤B67890", date: "2025-08-20", vin: "LVSHDFAC5GE789012", company: "深圳物流公司" },
    { id: "3", name: "出租车（粤C）", plate: "粤C11111", date: "2025-11-15", vin: "LVSHDFAC5GE345678", company: "珠海出租车公司" }
  ];

  var styles = {
    overlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    modal: {
      backgroundColor: "#fff",
      width: "100%",
      maxWidth: "1100px",
      maxHeight: "90vh",
      borderRadius: "8px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column" as const
    },
    header: {
      padding: "16px 24px",
      borderBottom: "1px solid #e5e5e5",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    headerTitle: {
      fontSize: "16px",
      fontWeight: 500,
      color: "#333"
    },
    closeBtn: {
      background: "none",
      border: "none",
      fontSize: "20px",
      cursor: "pointer",
      color: "#999"
    },
    content: {
      flex: 1,
      overflow: "auto",
      padding: "0"
    },
    section: {
      borderBottom: "8px solid #f5f5f5"
    },
    sectionHeader: {
      backgroundColor: "#f0faf5",
      padding: "12px 24px",
      borderLeft: "3px solid #2db77b",
      fontSize: "14px",
      fontWeight: 500,
      color: "#333"
    },
    sectionContent: {
      padding: "20px 24px"
    },
    typeGroup: {
      display: "flex",
      gap: "0"
    },
    typeBtn: {
      padding: "10px 28px",
      border: "1px solid #e5e5e5",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontSize: "14px",
      color: "#666",
      transition: "all 0.2s"
    },
    typeBtnFirst: {
      borderRadius: "4px 0 0 4px"
    },
    typeBtnMiddle: {
      borderLeft: "none"
    },
    typeBtnLast: {
      borderRadius: "0 4px 4px 0",
      borderLeft: "none"
    },
    typeBtnActive: {
      backgroundColor: "#2db77b",
      borderColor: "#2db77b",
      color: "#fff"
    },
    vehicleCard: {
      display: "inline-block",
      padding: "12px 16px",
      border: "1px solid #2db77b",
      borderRadius: "4px",
      backgroundColor: "#f0faf5",
      position: "relative" as const,
      marginTop: "12px"
    },
    vehicleName: {
      fontSize: "14px",
      fontWeight: 500,
      color: "#333"
    },
    vehicleDate: {
      fontSize: "12px",
      color: "#999",
      marginTop: "4px"
    },
    serviceBadge: {
      position: "absolute" as const,
      top: "-8px",
      right: "-8px",
      backgroundColor: "#2db77b",
      color: "#fff",
      fontSize: "10px",
      padding: "2px 6px",
      borderRadius: "2px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      marginTop: "16px"
    },
    th: {
      textAlign: "left" as const,
      padding: "12px 8px",
      borderBottom: "1px solid #e5e5e5",
      fontSize: "13px",
      color: "#666",
      fontWeight: 500
    },
    td: {
      padding: "12px 8px",
      borderBottom: "1px solid #f0f0f0",
      fontSize: "13px",
      color: "#333"
    },
    checkbox: {
      width: "16px",
      height: "16px",
      cursor: "pointer"
    },
    select: {
      padding: "8px 12px",
      border: "1px solid #e5e5e5",
      borderRadius: "4px",
      fontSize: "13px",
      color: "#999",
      backgroundColor: "#fff",
      minWidth: "120px",
      cursor: "pointer"
    },
    input: {
      padding: "8px 12px",
      border: "1px solid #e5e5e5",
      borderRadius: "4px",
      fontSize: "13px",
      width: "100%",
      boxSizing: "border-box" as const
    },
    formRow: {
      display: "flex",
      gap: "24px",
      marginBottom: "16px",
      flexWrap: "wrap" as const
    },
    formItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flex: "1",
      minWidth: "280px"
    },
    label: {
      fontSize: "13px",
      color: "#666",
      whiteSpace: "nowrap" as const,
      minWidth: "56px"
    },
    required: {
      color: "#ff4d4f"
    },
    linkBtn: {
      color: "#2db77b",
      fontSize: "13px",
      cursor: "pointer",
      border: "none",
      background: "none"
    },
    expandSection: {
      padding: "12px 24px",
      borderBottom: "1px solid #f0f0f0",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    expandTitle: {
      color: "#2db77b",
      fontSize: "13px",
      fontWeight: 500
    },
    expandHint: {
      color: "#999",
      fontSize: "12px"
    },
    footer: {
      padding: "16px 24px",
      borderTop: "1px solid #e5e5e5",
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "16px",
      backgroundColor: "#fff"
    },
    urgentLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "#666"
    },
    toggle: {
      width: "44px",
      height: "22px",
      borderRadius: "11px",
      backgroundColor: "#e5e5e5",
      position: "relative" as const,
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    toggleActive: {
      backgroundColor: "#2db77b"
    },
    toggleDot: {
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      backgroundColor: "#fff",
      position: "absolute" as const,
      top: "2px",
      left: "2px",
      transition: "left 0.2s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
    },
    toggleDotActive: {
      left: "24px"
    },
    submitBtn: {
      padding: "10px 24px",
      backgroundColor: "#2db77b",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      cursor: "pointer"
    },
    serviceTable: {
      width: "100%",
      borderCollapse: "collapse" as const,
      border: "1px solid #e5e5e5",
      borderRadius: "4px",
      overflow: "hidden"
    },
    serviceRow: {
      borderBottom: "1px solid #f0f0f0"
    },
    installTypeGroup: {
      display: "flex",
      gap: "12px",
      marginBottom: "20px"
    },
    installTypeBtn: {
      padding: "10px 24px",
      border: "1px solid #e5e5e5",
      borderRadius: "4px",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontSize: "13px",
      color: "#666"
    },
    installTypeBtnActive: {
      backgroundColor: "#f0faf5",
      borderColor: "#2db77b",
      color: "#2db77b"
    },
    infoRow: {
      display: "flex",
      gap: "24px",
      marginBottom: "16px"
    },
    infoItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    infoLabel: {
      fontSize: "13px",
      color: "#666",
      minWidth: "70px"
    },
    smallInput: {
      padding: "8px 12px",
      border: "1px solid #e5e5e5",
      borderRadius: "4px",
      fontSize: "13px",
      width: "160px"
    },
    vinInput: {
      padding: "8px 12px",
      border: "1px solid #e5e5e5",
      borderRadius: "4px",
      fontSize: "13px",
      width: "120px"
    },
    counter: {
      fontSize: "12px",
      color: "#999",
      marginLeft: "8px"
    },
    textarea: {
      padding: "8px 12px",
      border: "1px solid #e5e5e5",
      borderRadius: "4px",
      fontSize: "13px",
      width: "100%",
      minHeight: "80px",
      resize: "vertical" as const,
      boxSizing: "border-box" as const
    },
    vehicleSelectCard: {
      display: "inline-block",
      padding: "12px 16px",
      border: "1px solid #e5e5e5",
      borderRadius: "4px",
      backgroundColor: "#fff",
      cursor: "pointer",
      marginRight: "12px",
      marginBottom: "8px",
      position: "relative" as const,
      transition: "all 0.2s"
    },
    vehicleSelectCardActive: {
      border: "1px solid #2db77b",
      backgroundColor: "#f0faf5"
    },
    requiredField: {
      border: "1px solid #ff4d4f"
    }
  };

  var serviceItems = [
    { key: "video_remove", name: "视频拆机", fee: "140", commission: "80" },
    { key: "video_transfer", name: "视频拆机移装", fee: "400", commission: "190" },
    { key: "video_card", name: "视频换卡（同行单）", fee: "100", commission: "60" },
    { key: "standard_remove", name: "部标拆机", fee: "50", commission: "30" },
    { key: "normal_remove", name: "普通定位拆机", fee: "30", commission: "30" }
  ];

  var afterSalesTypes = ["服务支持", "售后故障", "车辆拆装"];
  var installTypes = ["拆机移装", "我司拆机服务", "我司安装服务"];

  // 模拟套餐设备数据
  var packageDevices = [
    { id: "1", position: "前置摄像", productName: "海康威视 DS-2CD3T45FP", warrantyDate: "2027-03-12", isAddon: false },
    { id: "2", position: "车内监控", productName: "大华 DH-IPC-HFW2831S", warrantyDate: "2027-03-12", isAddon: false },
    { id: "3", position: "GPS定位", productName: "途强 GT06N", warrantyDate: "2027-03-12", isAddon: false },
    { id: "4", position: "后置摄像", productName: "安装时指定", warrantyDate: "2027-03-12", isAddon: true }
  ];

  // 模拟单产品设备数据
  var singleDevices = [
    { id: "5", position: "—", productName: "—", warrantyDate: "—" }
  ];

  // 设备选中状态
  var _m = React.useState({} as Record<string, boolean>), deviceChecked = _m[0], setDeviceChecked = _m[1];
  var _n = React.useState({} as Record<string, string>), deviceFault = _n[0], setDeviceFault = _n[1];
  var _o = React.useState({} as Record<string, string>), deviceRemark = _o[0], setDeviceRemark = _o[1];
  var _p = React.useState({} as Record<string, string>), deviceCommission = _p[0], setDeviceCommission = _p[1];
  var _q = React.useState({} as Record<string, string>), deviceFee = _q[0], setDeviceFee = _q[1];

  // 渲染车辆信息模块
  function renderVehicleInfo() {
    var isServiceSupport = activeType === "服务支持";
    
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>车辆信息</div>
        <div style={styles.sectionContent}>
          {isServiceSupport ? (
            <div style={styles.formRow}>
              <div style={styles.formItem}>
                <span style={styles.label}><span style={styles.required}>*</span> 车牌号</span>
                <input 
                  type="text" 
                  style={styles.input} 
                  placeholder="请输入车牌号" 
                  value={plateNumber}
                  onChange={function(e) { setPlateNumber(e.target.value); }}
                />
              </div>
              <div style={styles.formItem}>
                <span style={styles.label}>车架号</span>
                <input 
                  type="text" 
                  style={styles.input} 
                  placeholder="请输入车架号" 
                  value={vinNumber}
                  onChange={function(e) { setVinNumber(e.target.value); }}
                />
              </div>
              <div style={styles.formItem}>
                <span style={styles.label}>下单公司</span>
                <select 
                  style={Object.assign({}, styles.select, { flex: 1 })}
                  value={orderCompany}
                  onChange={function(e) { setOrderCompany(e.target.value); }}
                >
                  <option value="">请选择下单公司</option>
                  <option value="广州运输公司">广州运输公司</option>
                  <option value="深圳物流公司">深圳物流公司</option>
                  <option value="珠海出租车公司">珠海出租车公司</option>
                </select>
              </div>
            </div>
          ) : (
            <div style={styles.formRow}>
              <div style={styles.formItem}>
                <span style={styles.label}><span style={styles.required}>*</span> 车牌号</span>
                <select 
                  style={Object.assign({}, styles.select, { flex: 1 })}
                  value={selectedVehicle ? selectedVehicle.id : ""}
                  onChange={function(e) { 
                    var vehicleId = e.target.value;
                    if (vehicleId) {
                      var vehicle = existingVehicles.find(function(v) { return v.id === vehicleId; });
                      if (vehicle) {
                        setSelectedVehicle(vehicle);
                        setPlateNumber(vehicle.plate);
                        setVinNumber(vehicle.vin);
                        setOrderCompany(vehicle.company);
                      }
                    } else {
                      setSelectedVehicle(null);
                      setPlateNumber("");
                      setVinNumber("");
                      setOrderCompany("");
                    }
                  }}
                >
                  <option value="">请选择车牌号</option>
                  {existingVehicles.map(function(vehicle) {
                    return (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div style={styles.formItem}>
                <span style={styles.label}>车架号</span>
                <input 
                  type="text" 
                  style={Object.assign({}, styles.input, { backgroundColor: "#f5f5f5" })} 
                  placeholder="选择车牌后自动填充" 
                  value={vinNumber}
                  readOnly
                />
              </div>
              <div style={styles.formItem}>
                <span style={styles.label}>下单公司</span>
                <input 
                  type="text" 
                  style={Object.assign({}, styles.input, { backgroundColor: "#f5f5f5" })} 
                  placeholder="选择车牌后自动填充" 
                  value={orderCompany}
                  readOnly
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function getTypeBtnStyle(type: string, index: number) {
    var baseStyle = Object.assign({}, styles.typeBtn);
    if (index === 0) {
      Object.assign(baseStyle, styles.typeBtnFirst);
    } else if (index === afterSalesTypes.length - 1) {
      Object.assign(baseStyle, styles.typeBtnLast);
    } else {
      Object.assign(baseStyle, styles.typeBtnMiddle);
    }
    if (activeType === type) {
      Object.assign(baseStyle, styles.typeBtnActive);
    }
    return baseStyle;
  }

  function renderServiceSupport() {
    return (
      <div style={styles.section}>
        <div style={styles.sectionContent}>
          <table style={styles.serviceTable}>
            <thead>
              <tr style={styles.serviceRow}>
                <th style={Object.assign({}, styles.th, { width: "40px" })}></th>
                <th style={styles.th}>产品服务</th>
                <th style={styles.th}>收费金额</th>
                <th style={styles.th}>提成金额</th>
              </tr>
            </thead>
            <tbody>
              {serviceItems.map(function(item) {
                return (
                  <tr key={item.key} style={styles.serviceRow}>
                    <td style={styles.td}>
                      <input 
                        type="checkbox" 
                        style={styles.checkbox}
                        checked={serviceProducts[item.key as keyof typeof serviceProducts]}
                        onChange={function() {
                          var newProducts = Object.assign({}, serviceProducts);
                          newProducts[item.key as keyof typeof serviceProducts] = !newProducts[item.key as keyof typeof serviceProducts];
                          setServiceProducts(newProducts);
                        }}
                      />
                    </td>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>
                      <input type="text" style={styles.smallInput} defaultValue={item.fee} />
                    </td>
                    <td style={styles.td}>
                      <input type="text" style={styles.smallInput} defaultValue={item.commission} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderFaultProducts() {
    // 故障问题选项
    var faultOptions = ["无法开机", "信号异常", "设备离线", "画面模糊", "录像异常", "其他"];
    
    // 获取质保时间颜色
    function getWarrantyColor(dateStr: string) {
      if (dateStr === "—") return "#999";
      var warranty = new Date(dateStr);
      var now = new Date();
      var diffDays = Math.floor((warranty.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return "#ff4d4f"; // 已过期 - 红色
      if (diffDays < 30) return "#fa8c16"; // 即将过期 - 橙色
      return "#52c41a"; // 正常 - 绿色
    }

    // 渲染设备行
    function renderDeviceRow(device: { id: string; position: string; productName: string; warrantyDate: string; isAddon?: boolean }, index: number, isAddon?: boolean) {
      var isChecked = deviceChecked[device.id] || false;
      var rowStyle = Object.assign({}, styles.td, isChecked ? { backgroundColor: "#F5FFF0" } : {});
      var disabledStyle = { backgroundColor: "#f5f5f5", color: "#bfbfbf", cursor: "not-allowed" };
      
      // 产品名称样式
      var isInstallTimeSpecified = device.productName === "安装时指定";
      var productNameStyle = isInstallTimeSpecified 
        ? { color: "#BFBFBF", fontStyle: "italic" as const } 
        : { color: "#262626" };
      
      return (
        <tr key={device.id}>
          <td style={Object.assign({}, rowStyle, { width: "40px" })}>
            <input 
              type="checkbox" 
              style={styles.checkbox}
              checked={isChecked}
              onChange={function() {
                var newChecked = Object.assign({}, deviceChecked);
                newChecked[device.id] = !isChecked;
                setDeviceChecked(newChecked);
              }}
            />
          </td>
          <td style={Object.assign({}, rowStyle, { width: "12%" })}>{device.position}</td>
          <td style={Object.assign({}, rowStyle, { width: "15%" }, productNameStyle)}>{device.productName}</td>
          <td style={Object.assign({}, rowStyle, { width: "15%" })}>
            <select 
              style={Object.assign({}, styles.select, !isChecked ? disabledStyle : {})}
              disabled={!isChecked}
              value={deviceFault[device.id] || ""}
              onChange={function(e) {
                var newFault = Object.assign({}, deviceFault);
                newFault[device.id] = e.target.value;
                setDeviceFault(newFault);
              }}
            >
              <option value="">请选择</option>
              {faultOptions.map(function(opt) {
                return <option key={opt} value={opt}>{opt}</option>;
              })}
            </select>
          </td>
          <td style={Object.assign({}, rowStyle, { width: "18%" })}>
            <input 
              type="text" 
              style={Object.assign({}, styles.input, !isChecked ? disabledStyle : {})}
              disabled={!isChecked}
              placeholder="请输入内容" 
              value={deviceRemark[device.id] || ""}
              onChange={function(e) {
                var newRemark = Object.assign({}, deviceRemark);
                newRemark[device.id] = e.target.value;
                setDeviceRemark(newRemark);
              }}
            />
          </td>
          <td style={Object.assign({}, rowStyle, { width: "8%" })}>
            <input 
              type="number" 
              style={Object.assign({}, styles.smallInput, { width: "70px" }, !isChecked ? disabledStyle : {})}
              disabled={!isChecked}
              placeholder="0"
              value={deviceCommission[device.id] || ""}
              onChange={function(e) {
                var newCommission = Object.assign({}, deviceCommission);
                newCommission[device.id] = e.target.value;
                setDeviceCommission(newCommission);
              }}
            />
          </td>
          <td style={Object.assign({}, rowStyle, { width: "8%" })}>
            <input 
              type="number" 
              style={Object.assign({}, styles.smallInput, { width: "70px" }, !isChecked ? disabledStyle : {})}
              disabled={!isChecked}
              placeholder="0"
              value={deviceFee[device.id] || ""}
              onChange={function(e) {
                var newFee = Object.assign({}, deviceFee);
                newFee[device.id] = e.target.value;
                setDeviceFee(newFee);
              }}
            />
          </td>
          <td style={Object.assign({}, rowStyle, { width: "12%", color: getWarrantyColor(device.warrantyDate) })}>
            {device.warrantyDate}
          </td>
        </tr>
      );
    }

    var hasPackageDevices = packageDevices.length > 0;
    var hasSingleDevices = singleDevices.length > 0;
    var packageName = "穗标1899套餐（3年质保）";
    
    // 分离套餐设备和加购产品
    var mainPackageDevices = packageDevices.filter(function(d) { return !d.isAddon; });
    var addonDevices = packageDevices.filter(function(d) { return d.isAddon; });

    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>产品信息</div>
        <div style={styles.sectionContent}>
          {selectedVehicle && (
            <div style={styles.vehicleCard}>
              <div style={styles.serviceBadge}>服务中</div>
              <div style={styles.vehicleName}>{selectedVehicle.name}</div>
              <div style={styles.vehicleDate}>于{selectedVehicle.date}安装完成</div>
            </div>
          )}
          {!selectedVehicle && (
            <div style={{ color: "#999", fontSize: "13px", marginBottom: "12px", textAlign: "center" as const, padding: "40px" }}>
              请先在上方选择车辆
            </div>
          )}
          
          {selectedVehicle && !hasPackageDevices && !hasSingleDevices && (
            <div style={{ color: "#999", fontSize: "13px", textAlign: "center" as const, padding: "40px" }}>
              暂无产品信息
            </div>
          )}

          {selectedVehicle && hasPackageDevices && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#333" }}>套餐设备</span>
                <span style={{ 
                  marginLeft: "12px", 
                  fontSize: "12px", 
                  color: "#8c8c8c", 
                  backgroundColor: "#f5f5f5", 
                  padding: "2px 8px", 
                  borderRadius: "2px" 
                }}>
                  {packageName}
                </span>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={Object.assign({}, styles.th, { width: "40px" })}></th>
                    <th style={Object.assign({}, styles.th, { width: "12%" })}>安装部位</th>
                    <th style={Object.assign({}, styles.th, { width: "15%" })}>产品名称</th>
                    <th style={Object.assign({}, styles.th, { width: "15%" })}>故障问题</th>
                    <th style={Object.assign({}, styles.th, { width: "18%" })}>备注</th>
                    <th style={Object.assign({}, styles.th, { width: "8%" })}>售后提成</th>
                    <th style={Object.assign({}, styles.th, { width: "8%" })}>收费金额</th>
                    <th style={Object.assign({}, styles.th, { width: "12%" })}>质保时间</th>
                  </tr>
                </thead>
                <tbody>
                  {mainPackageDevices.map(function(device, index) {
                    return renderDeviceRow(device, index);
                  })}
                  {addonDevices.length > 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "0" }}>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          padding: "8px 0",
                          borderBottom: "1px solid #f0f0f0"
                        }}>
                          <div style={{ flex: 1, height: "1px", backgroundColor: "#f0f0f0" }}></div>
                          <span style={{ padding: "0 12px", fontSize: "12px", color: "#8c8c8c" }}>加购产品</span>
                          <div style={{ flex: 1, height: "1px", backgroundColor: "#f0f0f0" }}></div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {addonDevices.map(function(device, index) {
                    return renderDeviceRow(device, index, true);
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedVehicle && hasSingleDevices && (
            <div style={{ marginTop: "24px" }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#333", marginBottom: "8px" }}>单产品设备</div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={Object.assign({}, styles.th, { width: "40px" })}></th>
                    <th style={Object.assign({}, styles.th, { width: "12%" })}>安装部位</th>
                    <th style={Object.assign({}, styles.th, { width: "15%" })}>产品名称</th>
                    <th style={Object.assign({}, styles.th, { width: "15%" })}>故障问题</th>
                    <th style={Object.assign({}, styles.th, { width: "18%" })}>备注</th>
                    <th style={Object.assign({}, styles.th, { width: "8%" })}>售后提成</th>
                    <th style={Object.assign({}, styles.th, { width: "8%" })}>收费金额</th>
                    <th style={Object.assign({}, styles.th, { width: "12%" })}>质保时间</th>
                  </tr>
                </thead>
                <tbody>
                  {singleDevices.map(function(device, index) {
                    return renderDeviceRow(Object.assign({}, device, { isAddon: false }), index);
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderVehicleInstall() {
    return (
      <React.Fragment>
        <div style={styles.section}>
          <div style={styles.sectionContent}>
            <div style={styles.infoRow}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>拆/装类型</span>
                <div style={styles.installTypeGroup}>
                  {installTypes.map(function(type) {
                    return (
                      <button
                        key={type}
                        style={Object.assign(
                          {}, 
                          styles.installTypeBtn, 
                          installType === type ? styles.installTypeBtnActive : {}
                        )}
                        onClick={function() { setInstallType(type); }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>车辆套餐</span>
                {selectedVehicle ? (
                  <div style={styles.vehicleCard}>
                    <div style={styles.serviceBadge}>服务中</div>
                    <div style={styles.vehicleName}>{selectedVehicle.name}</div>
                    <div style={styles.vehicleDate}>于{selectedVehicle.date}安装完成</div>
                  </div>
                ) : (
                  <span style={{ color: "#999", fontSize: "13px" }}>请先在上方选择车辆</span>
                )}
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>收费金额</span>
                <input type="text" style={styles.smallInput} defaultValue="60" />
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>售后提成</span>
                <input type="text" style={styles.smallInput} defaultValue="40" />
              </div>
            </div>
          </div>
        </div>
        
        <div style={styles.section}>
          <div style={styles.sectionHeader}>装机车辆信息</div>
          <div style={styles.sectionContent}>
            <div style={styles.formRow}>
              <div style={styles.formItem}>
                <span style={styles.label}>车牌号码</span>
                <input type="text" style={styles.input} placeholder="请输入车牌号" />
              </div>
              <div style={styles.formItem}>
                <span style={styles.label}>车架号码</span>
                <input type="text" style={styles.vinInput} placeholder="" />
                <span style={styles.counter}>0/18</span>
              </div>
              <div style={styles.formItem}>
                <span style={styles.label}>车辆类型</span>
                <select style={styles.select}>
                  <option value="">请选择车辆类</option>
                </select>
              </div>
              <div style={styles.formItem}>
                <span style={styles.label}>上牌公司</span>
                <input type="text" style={styles.input} placeholder="请选择上牌公司" />
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  function renderBasicInfo() {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>基本信息</div>
        <div style={styles.sectionContent}>
          <div style={styles.formRow}>
            <div style={styles.formItem}>
              <span style={styles.label}>处理人</span>
              <select style={Object.assign({}, styles.select, { flex: 1 })}>
                <option value="">请选择处理人,可输入</option>
              </select>
            </div>
            <div style={styles.formItem}>
              <span style={styles.label}>联系人</span>
              <select style={Object.assign({}, styles.select, { flex: 1 })}>
                <option value="">请选择联系人,可输入</option>
              </select>
            </div>
            <div style={styles.formItem}>
              <span style={styles.label}><span style={styles.required}>*</span> 手机号</span>
              <select style={Object.assign({}, styles.select, { flex: 1 })}>
                <option value="">请选择手机号</option>
              </select>
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formItem}>
              <span style={styles.label}>故障描述</span>
              <input type="text" style={styles.input} placeholder="请简单描述您的问题" />
            </div>
            <div style={styles.formItem}>
              <span style={styles.label}>跟单员</span>
              <select style={Object.assign({}, styles.select, { flex: 1 })}>
                <option value="">请选择跟单员</option>
              </select>
            </div>
            <div style={styles.formItem}>
              <span style={styles.label}>售后标签</span>
              <select style={Object.assign({}, styles.select, { flex: 1 })}>
                <option value="">请选择售后标签</option>
              </select>
              <button style={styles.linkBtn}>编辑标签</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderExpandSections() {
    return (
      <React.Fragment>
        <div 
          style={styles.expandSection}
          onClick={function() { setShowOptions(!showOptions); }}
        >
          <span style={{ color: "#2db77b" }}>{showOptions ? "▼" : "▶"}</span>
          <span style={styles.expandTitle}>选填</span>
          <span style={styles.expandHint}>售后区域 | 售后地址 | 下单公司 | 预计售后时间</span>
        </div>
        
        {showOptions && (
          <div style={styles.sectionContent}>
            <div style={styles.formRow}>
              <div style={styles.formItem}>
                <span style={styles.label}>售后区域</span>
                <select style={Object.assign({}, styles.select, { flex: 1 })}>
                  <option value="">请选择</option>
                </select>
              </div>
              <div style={styles.formItem}>
                <span style={styles.label}>售后地址</span>
                <input type="text" style={styles.input} placeholder="请输入售后地址" />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formItem}>
                <span style={styles.label}>下单公司</span>
                <select style={Object.assign({}, styles.select, { flex: 1 })}>
                  <option value="">请选择</option>
                </select>
              </div>
              <div style={styles.formItem}>
                <span style={styles.label}>预计售后时间</span>
                <input type="date" style={styles.input} />
              </div>
            </div>
          </div>
        )}
        
        {activeType === "售后故障" && (
          <React.Fragment>
            <div 
              style={styles.expandSection}
              onClick={function() { setShowMedia(!showMedia); }}
            >
              <span style={{ color: "#2db77b" }}>{showMedia ? "▼" : "▶"}</span>
              <span style={styles.expandTitle}>故障图片及视频</span>
              <span style={styles.expandHint}>可上传故障的视频与图片,方便售后人员快速定位故障问题</span>
            </div>
            
            {showMedia && (
              <div style={styles.sectionContent}>
                <div style={{ 
                  border: "1px dashed #d9d9d9", 
                  borderRadius: "4px", 
                  padding: "40px", 
                  textAlign: "center" as const,
                  color: "#999"
                }}>
                  点击或拖拽上传图片/视频
                </div>
              </div>
            )}
            
            <div 
              style={styles.expandSection}
              onClick={function() { setShowHistory(!showHistory); }}
            >
              <span style={{ color: "#2db77b" }}>{showHistory ? "▼" : "▶"}</span>
              <span style={styles.expandTitle}>历史售后</span>
              <span style={styles.expandHint}>可查看当前车辆历史售后单据</span>
            </div>
            
            {showHistory && (
              <div style={styles.sectionContent}>
                <div style={{ color: "#999", textAlign: "center" as const, padding: "20px" }}>
                  暂无历史售后记录
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>新增售后单</span>
          <button style={styles.closeBtn}>×</button>
        </div>
        
        <div style={styles.content}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>售后类型</div>
            <div style={styles.sectionContent}>
              <div style={styles.typeGroup}>
                {afterSalesTypes.map(function(type, index) {
                  return (
                    <button
                      key={type}
                      style={getTypeBtnStyle(type, index)}
                      onClick={function() { setActiveType(type); }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {renderVehicleInfo()}
          
          {activeType === "服务支持" && renderServiceSupport()}
          {activeType === "售后故障" && renderFaultProducts()}
          {activeType === "车辆拆装" && renderVehicleInstall()}
          
          {renderBasicInfo()}
          {renderExpandSections()}
        </div>
        
        <div style={styles.footer}>
          <div style={styles.urgentLabel}>
            <div 
              style={Object.assign(
                {}, 
                styles.toggle, 
                isUrgent ? styles.toggleActive : {}
              )}
              onClick={function() { setIsUrgent(!isUrgent); }}
            >
              <div style={Object.assign(
                {}, 
                styles.toggleDot, 
                isUrgent ? styles.toggleDotActive : {}
              )}></div>
            </div>
            <span>是否急单</span>
          </div>
          <button style={styles.submitBtn}>确认新增</button>
        </div>
      </div>
    </div>
  );
};

export default Component;
