

define(function(){
	function getLodop(oOBJECT, oEMBED) {
		/**************************
		 本函数根据浏览器类型决定采用哪个对象作为控件实例：
		 IE系列、IE内核系列的浏览器采用oOBJECT，
		 其它浏览器(Firefox系列、Chrome系列、Opera系列、Safari系列等)采用oEMBED,
		 对于64位浏览器指向64位的安装程序install_lodop64.exe。
		 **************************/
		var strHtmInstall = "<br><font color='#FF00FF'>打印控件未安装!点击这里<a href='/download/plugin/printer/install_lodop32.exe'>执行安装</a>,安装后请刷新页面或重新进入。</font>";
		var strHtmUpdate = "<br><font color='#FF00FF'>打印控件需要升级!点击这里<a href='/download/plugin/printer/install_lodop32.exe'>执行升级</a>,升级后请重新进入。</font>";
		var strHtm64_Install = "<br><font color='#FF00FF'>打印控件未安装!点击这里<a href='/download/plugin/printer/install_lodop64.exe'>执行安装</a>,安装后请刷新页面或重新进入。</font>";
		var strHtm64_Update = "<br><font color='#FF00FF'>打印控件需要升级!点击这里<a href='/download/plugin/printer/install_lodop64.exe'>执行升级</a>,升级后请重新进入。</font>";
		var strHtmFireFox = "<br><br><font color='#FF00FF'>注意：<br>1：如曾安装过Lodop旧版附件npActiveXPLugin,请在【工具】->【附加组件】->【扩展】中先卸它。</font>";
		var LODOP = oEMBED;
	
		var pluginText = $('#pluginText');
		try {
			if (navigator.appVersion.indexOf("MSIE") >= 0)
				LODOP = oOBJECT;
			if ((LODOP == null) || (typeof (LODOP.VERSION) == "undefined")) {
				if (navigator.userAgent.indexOf('Firefox') >= 0) {
					pluginText.html(strHtmFireFox);
				}
	
				if (navigator.userAgent.indexOf('Win64') >= 0) {
					if (navigator.appVersion.indexOf("MSIE") >= 0) {
						pluginText.html(strHtm64_Install);
					} else {
						pluginText.html(strHtm64_Install);
					}
				} else {
					if (navigator.appVersion.indexOf("MSIE") >= 0) {
						pluginText.html(strHtmInstall);
					} else {
						pluginText.html(strHtmInstall);
					}
				}
				return LODOP;
			} else if (LODOP.VERSION < "6.1.2.2") {
				if (navigator.userAgent.indexOf('Win64') >= 0) {
					if (navigator.appVersion.indexOf("MSIE") >= 0) {
						pluginText.html(strHtm64_Update);
					} else {
						pluginText.html(strHtm64_Update);
					}
				} else {
					if (navigator.appVersion.indexOf("MSIE") >= 0) {
						pluginText.html(strHtmUpdate);
					} else {
						pluginText.html(strHtmUpdate);
					}
				}
				return LODOP;
			}
			//=====如下空白位置适合调用统一功能:=====	     
	
			//=======================================
			return LODOP;
		} catch (err) {
			if (navigator.userAgent.indexOf('Win64') >= 0) {
				pluginText.html("Error:" + strHtm64_Install);
			} else {
				pluginText.html("Error:" + strHtmInstall);
			}
			return LODOP;
		}
	}
	
	return {
		getLodop : getLodop
	};
});



