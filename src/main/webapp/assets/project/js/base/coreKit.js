define(['underscore', 'jquery-json'], function(_) {

	'use strict';

	/** @note 跨浏览器支持
	 *
	 */



	if(!window.console) {
		var dummy = function dummy() {};
		window.console = {
			log: dummy,
			debug: dummy,
			info: dummy,
			warn: dummy,
			error: dummy
		};
	}


	// -- 跨浏览器支持


	var CommonUtils = (function(){
		/** 值拷贝一个对象
		 *
		 * 如果这个对象里面含有函数,则这个属性将被评估(运行函数并取返回值)后进行拼装
		 *
		 */
		var evalObject = function evalObject(obj) {
			var result = {};

			// 开始遍历
			for ( var p in obj) { // 方法
				if (typeof (obj[p]) == 'function') {
					result[p] = obj[p]();
				} else { // p 为属性名称，obj[p]为对应属性的值
					result[p] = obj[p];
				}
			}

			return result;
		};

		/** 断言,如果不符合,则抛出异常
		 *
		 */
		var assert = function assert (value, message) {
			if(arguments.length < 1 || arguments.length > 2) {
				throw 'USAGE: assert(boolean[, message])!';
			}
			if(!value) {
				throw 'assert failed with value=' + value + ', message=' + ( message || 'empty');
			}
		};

		/**
		 *  将服务器获取的mapData转换成select checkBoxGroup等控件的options格式数据
		 *
		 *  参数为字符串，格式: 如评论等级mapData--->  {NONE=,GOOD=好评,NORMAL=中评,BAD=差评}
		 */
		var mapDataToOptions = function mapDataToOptions(mapData) {

			var options = [];

			if (typeof mapData != 'string') {
				throw 'the param should be a String';
			}

			var optionStr = mapData.slice(1,mapData.length-1).split(',');

			for (var i = 0,length = optionStr.length; i < length; i++) {
				var itemStr = optionStr[i];
				var index = itemStr.indexOf('=');
				var value = $.trim(itemStr.slice(0,index));
				var label = itemStr.slice(index+1,optionStr[i].length);

				var option = {};
				option.label = label;
				option.value = value;

				options.push(option);
			}

			return options;
		};

		/**
		 *   数组的深拷贝
		 *
		 */
		var arrayDeepCopy = function arrayDeepCopy(obj) {
			var out = [],i = 0,len = obj.length;
			for (; i < len; i++) {
				if (obj[i] instanceof Array){
					out[i] = arrayDeepCopy(obj[i]);
				}
				else out[i] = obj[i];
			}
			return out;
		}

		/**
		 * 将数值四舍五入(保留2位小数)后格式化成金额形式
		 *
		 * @param num 数值(Number或者String)
		 * @return 金额格式的字符串,如'1,234,567.45'
		 * @type Function
		 */
		var formatToMoney = function formatToMoney(s) {
			var sign = '';
			if(parseFloat(s) < 0){
				sign = '-';
			}
			s = Math.abs(s);
			s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(2) + "";
			var l = s.split(".")[0].split("").reverse(), r = s.split(".")[1];
			var t = "";
			for (var i = 0; i < l.length; i++) {
				t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
			}
			return sign + t.split("").reverse().join("") + "." + r;
		};
		var moneyToNumber = function moneyToNumber(s) {
			return parseFloat(s.replace(/[^\d\.-]/g, ""));
		};

		/**
		 * 数字转换成三位数一逗号
		 * @param s
		 * @returns {string}
		 */
		var formatNumber = function formatToMoney(s) {
			var sign = '';
			if(parseFloat(s) < 0){
				sign = '-';
			}
			s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(0) + "";
			var l = s.split("").reverse();
			var t = "";
			for (var i = 0; i < l.length; i++) {
				t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
			}
			return sign + t.split("").reverse().join("");
		};


		var zIndexCounter = null;

		return {
			zIndexCounter: zIndexCounter,
			evalObject: evalObject,
			assert: assert,
			mapDataToOptions: mapDataToOptions,
			arrayDeepCopy: arrayDeepCopy,
			formatToMoney : formatToMoney,
			moneyToNumber : moneyToNumber,
			formatNumber: formatNumber
		};
	}());

	var JSONUtils = (function() {
		/** 根据值创建json对象
		 *
		 */
		var toJSON = function(obj) {
			var result = commonUtils.evalObject(obj);

			return $.toJSON(result);
		};

		return {
			toJSON: toJSON
		};
	}());

	/** DOM操作工具
	 *
	 */
	var DomUtils = (function() {
		/** 从root的子节点查找第一个name符合要求的元素
		 *
		 */
		var getElementByAttribute = function(root, attribute, value) {
			var childNodes = root.childNodes;
			var COUNT = childNodes.length;
			var i,
				node;
			for(i = 0; i < COUNT; ++i) {
				node = childNodes[i];

				if(_.isElement(node)) {
					if(node.getAttribute(attribute) === value) {
						return node;
					} else if(node.childNodes.length > 0) {
						var result = getElementByAttribute(node, attribute, value);
						if(result) {
							return result;
						}
					}
				}
			}

			return null;
		};

		var getElementByName = function(root, name) {
			return getElementByAttribute(root, 'name', name);
		};

		var getElementsByName = function(root, name, array) {
			array = _.isArray(array) ? array : [];
			var childNodes = root.childNodes;
			var COUNT = childNodes.length;
			var i,
				node;
			for(i = 0; i < COUNT; ++i) {
				node = childNodes[i];

				if(_.isElement(node)) {
					if(node.getAttribute('name') === name) {
						array.push(node);
					} else if(node.childNodes.length > 0) {
						getElementsByName(node, name, array);
					}
				}
			}

			return array;
		};

		var showAlert = function(id,alertContent,status) {
			var alength = arguments.length;
			if (alength != 3) {
				throw 'arguments of function "showAlert" error!';
			}
			if (!$('#id')) {
				throw 'have no id "' + id +'"';
			}
			if (status == 'success') {
				status = 'alert-success';
			}else if (status == 'error') {
				status = 'alert-error';
			}else if (status == 'info') {
				status = 'alert-info';
			}else {
				throw 'the param "status"(second param) in function showAlert must be "success" or "error" or "info"!';
			}

			var alertHtml = '<div class="alert ' + status + '"><button type="button" class="close" data-dismiss="alert">&times;</button>' + alertContent + '</div>';
			$('#' + id).html(alertHtml);
		};

		var clearAlert = function(id){
			if (!$('#id')) {
				throw 'have no id "' + id +'"';
			}
			$('#' + id).html('');
		};

		var fireEvent = function fireEvent(element, event){
			var evt;
			if (document.createEventObject){
				// dispatch for IE
				evt = document.createEventObject();
				return element.fireEvent('on' + event, evt);
			} else {
				// dispatch for firefox + others
				evt = document.createEvent('HTMLEvents');
				evt.initEvent(event, true, true); // event type,bubbling,cancelable
				return !element.dispatchEvent(evt);
			}
		};

		//获取元素的纵坐标
		function getTop(e){
			var offset=e.offsetTop;
			if(e.offsetParent!=null) offset+=getTop(e.offsetParent);
			return offset;
		}
		//获取元素的横坐标
		function getLeft(e){
			var offset=e.offsetLeft;
			if(e.offsetParent!=null) offset+=getLeft(e.offsetParent);
			return offset;
		}

		/** 获取一个DOM元素在屏幕上的绝对坐标
		 *
		 * @return {top:距离屏幕上边缘像素值, left:距离屏幕左边缘像素值}
		 *
		 */
		var getElementPos = function getElementPos(element) {
			var top = getTop(element);
			var left = getLeft(element);

			return {
				top: top,
				left: left
			}
		};

		var getElementMatrix = function getElementMatrix(element) {
			var pos = getElementPos(element);
			pos.width = element.offsetWidth;
			pos.height = element.offsetHeight;

			return pos;
		};

		return {
			getElementByAttribute: getElementByAttribute,
			getElementByName: getElementByName,
			getElementsByName: getElementsByName,
			showAlert: showAlert,
			clearAlert: clearAlert,
			fireEvent: fireEvent,
			getElementPos: getElementPos,
			getElementMatrix: getElementMatrix
		};
	}());

	var JDomUtils = {
		getSibling: function getSibling(target, name) {
			var array = target.siblings('[name="' + name + '"]');
			return array[0];
		}
	};

	/** 关于值得各种工具，判断空，是否符合条件等等
	 *
	 */
	var ValueUtils = {
		isEmpty: function isEmpty(value) {
			if (value === null) {
				return true;
			}
			if(value instanceof Array){
				return false;//数组不判断空
			}

			var str = ValueUtils.toString(value);
			str = str.replace(/(^\s*)|(\s*$)/g, "");
			if (str.length > 0) {
				if (str == 'NONE') {
					return true;
				}

				return false;
			} else {
				return true;
			}
		},

		isInArray: function isInArray(value, array) {
			for(var i in array) {
				if(value === array[i]) {
					return true;
				}
			}
			return false;
		},

		isLessThan: function isLessThan(value, length) {
			if (value !== null) {
				if (value.length < length) {
					return true;

				}
			}
			return false;
		},

		isTooLong: function isTooLong(value, length) {
			if (value !== null) {
				if (value.length > length) {
					return true;
				}
			}
			return false;
		},

		isValidLoginName: function isValidLoginName(value) {
			if (value) {
				var regex = /^(?=.*[a-zA-Z].*)([a-zA-Z0-9]{4,20})$/;

				return regex.test(value);
			}

			return false;
		},

		isValidPassword: function isValidPassword(value) {
			if (value) {
				var regex = /^(?=.*[a-zA-Z].*)([a-zA-Z0-9]{6,16})$/;

				return regex.test(value);
			}

			return false;
		},

		isValidEmail: function isValidEmail(value) {
			if (value) {
				var regex = /^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

				return regex.test(value);
			}

			return false;
		},

		isValidMobile: function isValidMobile(value) {
			if (value) {
				var regex = /^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(16[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;

				return regex.test(value);
			}

			return false;
		},

		isValidFixedLine: function isValidFixedLine(regionCode, phoneNumber, extension) {
			var noExtensionRegex = /(^((0[1,2]{1}\d{1}-?\d{8})|(0[3-9]{1}\d{2}-?\d{7,8}))$)|(^0?(13[0-9]|15[0-35-9]|18[0236789]|14[57])[0-9]{8}$)/;

			var extensionRegex = /^\d{1,6}$/;

			var noExtension = regionCode + '-' + phoneNumber;

			if (noExtensionRegex.test(noExtension)) {
				if (extension) {
					return extensionRegex.test(extension);
				}

				return true;
			}

			return false;
		},

		isValidFullNumber: function isValidFullNumber(fullNumber) {
			var fullNumberRegex = /(^((0[1,2]{1}\d{1}\d{8})|(0[3-9]{1}\d{2}\d{7,8}))(\d{1,6})?$)|(^0?(13[0-9]|15[0-35-9]|18[0236789]|14[57])[0-9]{8}(\d{1,6})?$)/;

			if (fullNumberRegex.test(fullNumber)) {
				return true;
			}

			return false;
		},

		isValidOrderNumber: function isValidOrderNumber(orderNumber) {
			var orderNumberRegex = /(^\d-(\d{4})-\d{6}$)|(^\d{6}$)/;

			if (orderNumberRegex.test(orderNumber)) {
				return true;
			}

			return false;
		},

		isValidFullOrderNumber: function isValidFullOrderNumber(orderNumber) {
			var orderNumberRegex = /^\d-(\d{4})-\d{6}$/;

			if (orderNumberRegex.test(orderNumber)) {
				return true;
			}

			return false;
		},

		isValidLongitude: function isValidLongitude(value) {
			if (value) {
				var regex = /^[1-9]{1}[0-9]{1,2}\.[0-9]{0,6}$/;

				return regex.test(value);
			}

			return false;
		},

		isValidLatitude: function isValidLatitude(value) {
			if (value) {
				var regex = /^[1-9]{1}[0-9]{0,1}\.[0-9]{0,6}$/;

				return regex.test(value);
			}

			return false;
		},

		isValidSpell: function isValidSpell(value) {
			if (value) {
				var regex = /^[A-Za-z]+$/;

				return regex.test(value);
			}

			return false;
		},

		isValidAvailableDay: function isValidAvailableDay(value) {
			if (value) {
				var regex = /^[YN]{7}$/;

				return regex.test(value);
			}

			return false;
		},

		isValidInteger: function isValidInteger(value) {
			if (value) {
				var regex = /^[-+]?[1-9]+[0-9]*$/;

				return (regex.test(value) || (value == '0'));
			}

			return false;
		},

		isValidPositiveInteger: function isValidPositiveInteger(value) {
			if (value) {
				var regex = /^[1-9]+[0-9]*$/;

				return (regex.test(value) || (value == '0'));
			}

			return false;
		},

		isValidNumeric: function isValidNumeric(value) {
			if (value) {
				var regex = /^[-+]?[0-9]+(\.[0-9]+)?$/;

				return (regex.test(value) || (value =='0'));
			}

			return false;
		},

		isValidPositiveNumeric: function isValidPositiveNumeric(value) {
			if (value) {
				var regex = /^[0-9]+(\.[0-9]+)?$/;

				return regex.test(value);
			}

			return false;
		},

		isValidPercentageNumeric: function isValidPercentageNumeric(value) {
			var str = ValueUtils.toString(value);
			if (ValueUtils.isEmpty(str)) {
				return false;
			}

			if (ValueUtils.isValidNumeric(str)) {
				return parseFloat(str) <= 1 && parseFloat(str) >= 0;
			} else {
				return false;
			}
		},

		isTooBigDecimalForMoney: function isTooBigDecimalForMoney(value) {
			if (value > 10000) {
				return true;
			}

			return false;
		},

		isTooBigIntegerForQuantity: function isTooBigIntegerForQuantity(value) {
			if (value > 99) {
				return true;
			}

			return false;
		},

		isValidTimeSlot: function isValidTimeSlot(startHour, startMinute, endHour, endMinute) {
			var startTime = startHour + startMinute;
			var endTime = endHour + endMinute;
			if (startTime < endTime) {
				return true;
			} else {
				return false;
			}
		},

		// timeRanges的格式为["06:00:00-09:30:00", "10:00:00-14:30:00", "18:00:00-21:00:00"]
		isTimeRangesOverlapped: function isTimeRangesOverlapped(timeRanges) {
			if (timeRanges == null || timeRanges.length == 1) {
				return false;
			}

			var timeRangesInSeconds = new Array();
			for (var i = 0; i < timeRanges.length; i ++) {
				var timeRange = timeRanges[i];

				if (ValueUtils.isEmpty(timeRange)) {
					return true;
				}

				var times = timeRange.split("-");

				if (times == null || times.length < 2) {
					return true;
				}

				var time1 = times[0].split(":");
				if (time1 == null || time1.length < 3) {
					return true;
				}

				var time2 = times[1].split(":");
				if (time2 == null || time2.length < 3) {
					return true;
				}

				var timeRangeInSeconds = {
					t1 : parseInt(time1[0]) * 3600 + parseInt(time1[1]) * 60 + parseInt(time1[2]),
					t2 : parseInt(time2[0]) * 3600 + parseInt(time2[1]) * 60 + parseInt(time2[2])
				};

				timeRangesInSeconds.push(timeRangeInSeconds);
			}

			for (var i = 0; i < timeRangesInSeconds.length - 1; i ++) {
				var range1 = timeRangesInSeconds[i];
				for (var j = i + 1; j < timeRangesInSeconds.length; j ++) {
					var range2= timeRangesInSeconds[j];

					if (range1.t1 > range2.t1 && range1.t1 >= range2.t2) {
						continue;
					} else if (range1.t2 < range2.t2 && range1.t2 < range2.t1) {
						continue;
					} else {
						return true;
					}
				}
			}

			return false;
		},

		//允许时间段之间时间衔接  如第一段 "06:00:00-09:30:00"， 第二段"09:30:00-14:30:00"
		isTimeRangesOverlapped2: function isTimeRangesOverlapped(timeRanges) {
			if (timeRanges == null || timeRanges.length == 1) {
				return false;
			}

			var timeRangesInSeconds = new Array();
			for (var i = 0; i < timeRanges.length; i ++) {
				var timeRange = timeRanges[i];

				if (ValueUtils.isEmpty(timeRange)) {
					return true;
				}

				var times = timeRange.split("-");

				if (times == null || times.length < 2) {
					return true;
				}

				var time1 = times[0].split(":");
				if (time1 == null || time1.length < 3) {
					return true;
				}

				var time2 = times[1].split(":");
				if (time2 == null || time2.length < 3) {
					return true;
				}

				var timeRangeInSeconds = {
					t1 : parseInt(time1[0]) * 3600 + parseInt(time1[1]) * 60 + parseInt(time1[2]),
					t2 : parseInt(time2[0]) * 3600 + parseInt(time2[1]) * 60 + parseInt(time2[2])
				};

				timeRangesInSeconds.push(timeRangeInSeconds);
			}

			for (var i = 0; i < timeRangesInSeconds.length - 1; i ++) {
				var range1 = timeRangesInSeconds[i];
				for (var j = i + 1; j < timeRangesInSeconds.length; j ++) {
					var range2= timeRangesInSeconds[j];

					if (range1.t1 >= range2.t1 && range1.t1 >= range2.t2) {
						continue;
					} else if (range1.t2 <= range2.t2 && range1.t2 <= range2.t1) {
						continue;
					} else {
						return true;
					}
				}
			}

			return false;
		},

		// FIXME this is a bug, not a function!
		differDate: function differDate(endDateStr, beginDateStr) {
			beginDateStr = beginDateStr + ' 00:00:00';
			endDateStr = endDateStr + ' 00:00:00';
			beginDateStr = beginDateStr.replace(new RegExp('-', 'g'), '/');
			endDateStr = endDateStr.replace(new RegExp('-', 'g'), '/');
			beginDateStr = Date.parse(beginDateStr);
			endDateStr = Date.parse(endDateStr);
			var beginDate = new Date(beginDateStr);
			var endDate = new Date(endDateStr);
			var diff = endDate - beginDate;
			return diff;
		},

		isTypeofObject: function typeofObject(obj) {
			return typeof obj === 'object';
		},

		toString: function toString(text) {
			if (_.isNumber(text)) {
				return '' + text;
			} else if (_.isBoolean(text)) {
				return text.toString();
			} else if(_.isString(text)) {
				return text;
			} else {
				return '';
			}
		},

		toCh: function(s) {
			if (s === true || s === 'true') {
				return '是';
			} else if (s === false || s === 'false') {
				return '否';
			} else if (s === null) {
				return '未知';
			}
		},

		clearEmptyValue: function clearEmptyValue(data, deleteOldData) {
			var newData = {};
			for (var key in data) {
				if (!ValueUtils.isEmpty(data[key])) {
					newData[key] = data[key];
				} else if (deleteOldData){
					delete data[key];
				}
			}

			return newData;
		},
		encode: function (s) {
			return s.replace(/<|%3C/gi, "&lt;").replace(/>|%3E/gi, "&gt;").replace(/"|%22/g, "&quot;").replace(/'/g, '&apos;');
		},
		decode: function (s) {
			return s.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
		}
	};

	var __extends = function (d, b) {
		for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
		function __() {
			this.constructor = d;
		};
		__.prototype = b.prototype;
		d.prototype = new __();
	};

	var CoreObject = (function () {
		function CoreObject() {
		}

		CoreObject.prototype.overrideMethod = function (methodName, funcWrapper) {
			var self = this;
			var func = funcWrapper(self[methodName]);
			self[methodName] = function() {
				func.apply(self, _.toArray(arguments));
			};
		};

		return CoreObject;
	})();

	/** klass Pattern
	 *
	 * Copied form java.script.pattern by stoyan.stefanov
	 *
	 * 类声明函数
	 *
	 * @param Parent 父类，如果没有或者直接继承与Object，可以为null
	 * @param props 属性，定义在{}内，构造函数为__ctor
	 *
	 */
	var klass = function(Parent, props) {
		var Klass, F, i;
		var CTOR = '__ctor';
		// 1.
		// new constructor
		Klass = function() {
			// 提供访问父类构造函数的能力
			this.__super = function() {
				Klass.uber.constructor.apply(this, arguments);
			};

			// 如果类含有构造函数,则调用
			if (Klass.prototype.hasOwnProperty(CTOR)) {
				Klass.prototype.__ctor.apply(this, arguments);
			}
			// 指向父类的指针
			this.__uber = Klass.uber;
		};
		// 2.
		// inherit
		Parent = Parent || Object;
		var KlassHelper = function() {
		};
		KlassHelper.prototype = Parent.prototype;
		Klass.prototype = new KlassHelper();
		Klass.uber = Parent.prototype;
		Klass.prototype.constructor = Klass;

		// 3.
		// add implementation methods
		for (i in props) {
			if (props.hasOwnProperty(i)) {
				Klass.prototype[i] = props[i];
			}
		}
		// return the 'class'
		return Klass;
	};

	// 数据类型
	var DataType = {
		PREMITIVE: 0,		// 原始类型
		ARRAY: 1			// 数组
	};

	/** URL相关工具
	 *
	 */
	var UrlUtils = {
		// 获取当前页面的url带有的各种参数
		getRequest: function () {
			var url = location.search; //获取url中'?'符后的字串
			var theRequest = {};
			if (url.indexOf('?') != -1) {
				var str = url.substr(1);
				var strs = str.split('&');
				for(var i = 0; i < strs.length; i ++) {
					theRequest[strs[i].split('=')[0]]=decodeURIComponent(strs[i].split('=')[1]);
				}
			}
			return theRequest;
		},
		setRequest: function(url, request) {
			if (typeof url !== 'string') {
				request = url;
				url = '';
			}
			var count = 0;
			for (var index in request) {
				if (request.hasOwnProperty(index)) {
					if (count === 0) {
						url += ('?' + index + '=' + encodeURIComponent(request[index]));
						count++;
					} else {
						url += ('&' + index + '=' + encodeURIComponent(request[index]));
					}
				}
			}
			return url;
		},
		getPathname:function(){
			var url = location.pathname;//pathname 属性是一个可读可写的字符串，可设置或返回当前 URL 的路径部分。

			if(url.indexOf('.html') != -1){
				var str = url.substring(0,url.length-5);
				return str.split("/");
			}
		}
	};

	/** 对象工具
	 *
	 */
	var ObjectUtils = {
		// 是否含有相关方法
		hasMethod: function hasMethod(object, name) {
			if(arguments.length < 2 || object === null || !_.isString(name)) {
				throw 'First parameter should be a object, second should be a string object which contains the method name for the object!';
			}

			return _.isFunction(object[name]);
		},

		MAX_DUMP_DEPTH: 10,

		dump: function dumpObj(obj, name, indent, depth) {
			if(!name) {
				name = 'Object';
			}
			if(!indent) {
				indent = '　';
			}

			if (depth > ObjectUtils.MAX_DUMP_DEPTH) {
				return indent + name + ': <Maximum Depth Reached>\n';
			}

			if (_.isUndefined(obj)) {
				return indent + name + ': undefined,\n';
			} else if(null === obj) {
				return indent + name + ': null,\n';
			} else if (typeof obj == 'object') {
				var child = null;
				var output = indent + name + ': {\n';
				var oriIndent = indent;
				indent += indent;

				var isArray = _.isArray(obj);
				var prefix = isArray ? '[' : '';
				var suffix = isArray ? ']' : '';
				for (var item in obj) {
					try {
						child = obj[item];
					} catch (e) {
						child = '<Unable to Evaluate>';
					}

					if(_.isString(child)) {
						child = '"' + child + '"';
					}
					if (_.isFunction(child)) {
						output += indent + prefix + item + suffix + ': Function ' + child.name + '(),\n';
					} else if (typeof child == 'object') {
						output += dumpObj(child, item, indent, depth + 1);
					} else {
						output += indent + prefix + item + suffix + ': ' + child + ',\n';
					}
				}
				output += oriIndent + '},\n';
				return output;
			} else {
				return obj;
			}
		},

		/** 获取一个对象的属性
		 *
		 * @param obj 目标对象
		 * @param propertyName 属性名称，可以为以点间隔的复合属性，如：a.b.c
		 *
		 * @return 属性值或者当属性不存在时返回null
		 *
		 */
		getProperty: function getProperty(obj, propertyName) {
			if(!obj || !_.isString(propertyName)) {
				throw 'Incorrect argument! (Object, String) required!';
			}
			var pros = propertyName.split('.');
			var result = null;
			var root = obj;
			for(var i in pros) {
				var p = pros[i];
				if(!root.hasOwnProperty(p)) {
					return null;
				}

				root = root[p];
				result = root;
			}

			return result;
		}
	};

	var abort = function(exceptionString) {
		console.log(exceptionString);
		throw exceptionString;
	};

	(function __extendsClassCapabilities() {
		/** @note 功能扩展
		 *
		 */
		String.prototype.format = function() {
			var args = arguments;
			var index = 0;
			return this.replace(/\{(\d+)\}/g, function(){
				var val = args[index++];
				return val ? val : '!#String.foramt()缺少参数#!';
			});
		};

		String.prototype.contains = function(substr, ignoreCase) {
			var srcstr = this;
			if(ignoreCase) {
				substr = substr.toLowerCase();
				srcstr = srcstr.toLowerCase();
			}

			if(srcstr.indexOf(substr) >= 0) {
				return true;
			}

			return false;
		};

		if (!Array.prototype.indexOf) {
			Array.prototype.indexOf = function(elt /*, from */) {
				var len = this.length >>> 0;
				var from = Number(arguments[1]) || 0;
				from = (from < 0) ? Math.ceil(from) : Math.floor(from);
				if (from < 0) {
					from += len;
				}
				for (; from < len; from++) {
					if (from in this && this[from] === elt) {
						return from;
					}
				}
				return - 1;
			};
		}
	}) ();



	var Bool = {
		Y: true,
		N: false,
		TRUE: true,
		FALSE: false,
		isTrue: function(b) {
			if(b === true || b === 'true' || b === 'Y') {
				return true;
			}

			return false;
		},
		isFalse: function(b) {
			if(b === false || b === 'false' || b === 'N') {
				return true;
			}

			return false;
		}
	};

	var TimerManager = (function (_super) {
		__extends(TimerManager, _super);
		function TimerManager(config) {
			_super.call(this);

			this.callbacks = {};
		}

		/** 注册callback
		 *
		 * @param {Object} callback
		 * @param {Object} ms
		 *
		 * @return key 用来注销的键值
		 */
		TimerManager.prototype.register = function (callback, ms) {
			if(!_.isFunction(callback) || !_.isNumber(ms)) {
				throw '"Incorrect function invocation! .register(Function callback, int ms)."';
			}

			var data = {
				callback: callback,
				ms: ms,
				enabled: true
			};
			var key = 'KEY_' + Math.random();
			this.callbacks[key] = data;

			this.wake(key);
			return key;

		};

		TimerManager.prototype.unregister = function (key) {
			if(!key || !this.callbacks[key] || !!this.callbacks[key].enabled) {
				throw 'Incorrect key!';
			}

			var data = this.callbacks[key];
			data.enabled = false;
			delete this.callbacks[key];
		};

		TimerManager.prototype.wake = function(key) {
			var data = this.callbacks[key];
			if(!data || !data.enabled || false === data.callback.call(null)) {
				console.log('Callback disabled!');
				return;
			}
			var self = this;
			setTimeout(function() {
				self.wake(key);
			}, data.ms, null);
		};

		return TimerManager;
	}) (CoreObject);

	var OrderBy = {
		ASC: 'ASC',
		DESC: 'DESC'
	};

	var Log = (function (_super) {
		__extends(Log, _super);
		function Log(config) {
			_super.call(this);

			this.config = config;
		}

		Log.prototype.d = function debug(message) {
			console.log(message);
		};

		Log.prototype.i = function debug(message) {
			console.i(message);
		};

		Log.prototype.w = function debug(message) {
			console.warn(message);
		};

		Log.prototype.e = function debug(message) {
			console.error(message);
		};

		return Log;

	}) (CoreObject);
	var TabelUtils = {
		exportExcel: function(config) {
			var _formStr = config.form || 'searchForm';
			var param = config.param || {};
			var postData = config.postData || {};
			var form = this[_formStr];
			var self = this;
			if(param){
				for(var key in param){
					grid[0].p.postData[key] = param[key];
				}
			}

			var form = self[_formStr];

			if (form != 'thereIsNoForm' && form && form.validate && !form.validate()) {
				return ;
			}
			$.ajax({
				type : 'POST',
				url : config.url,
				data: postData,
				dataType : 'json',
				async : false,
				cache : false,
				contentType: 'application/x-www-form-urlencoded',
				headers: {
					"shbj-export":"EXPORT",
					"shbj-device": "BROWSER"
				},
				xhrFields: {
					withCredentials: true
				},
				success : function(result) {
					if(result.resultCode === '100000'){
						alert('文件已经生成，请到下载中心进行下载!');
						return;
					}else{
						alert(result.resultMessage);
					}

				},
				error : function(err) {
					console.log(err);
				}
			});


		}
	};
	var FormUtils = {
		multiSearchToggel : function(config){
			var formId = config.formId;

			$("#"+ formId +" [name='multiSearchToggelHandel']").click(function(){
				if($('#' + formId + ' .multiSearchToggel').hasClass('open')){
					$('#' + formId + ' .multiSearchToggel').removeClass('open');
					$(this).find(".down").show();
					$(this).find(".up").hide();
					$('#' + formId + ' [name="submit1"]').show();
					$('#' + formId + ' [name="submit2"]').hide();
				}else{
					$('#' + formId + ' .multiSearchToggel').addClass('open');
					$(this).find(".down").hide();
					$(this).find(".up").show();
					$('#' + formId + ' [name="submit1"]').hide();
					$('#' + formId + ' [name="submit2"]').show();
				}
			});
		}
	};
	var GridUtils = {
		exportExcel: function(config) {
			var pager = config.pager || "#pager";
			var _gridStr = config.grid || 'pageGrid';
			var _formStr = config.form || 'searchForm';
			var param = config.param || {};
			var grid = this[_gridStr];
			var form = this[_formStr];
			var self = this;
			if(param){
				for(var key in param){
					grid[0].p.postData[key] = param[key];
				}
			}
			grid.jqGrid('navGrid', pager, {add:false,edit:false,del:false, search: false, refresh: false});

			grid.jqGrid('navButtonAdd',pager,{
				caption:"下载查询结果",
				onClickButton : function (a, b, c) {
					var form = self[_formStr];

					if (form != 'thereIsNoForm' && form && form.validate && !form.validate()) {
						return ;
					}
					$.ajax({
						type : 'POST',
						url : config.url,
						data : grid[0].p.postData,
						dataType : 'json',
						async : false,
						cache : false,
						contentType: 'application/x-www-form-urlencoded',
						headers: {
							"shbj-export":"EXPORT",
							"shbj-device": "BROWSER"
						},
						xhrFields: {
							withCredentials: true
						},
						success : function(result) {
							if(result.resultCode === '100000'){
								alert('文件已经生成，请到下载中心进行下载!');
								return;
							}else{
								alert(result.resultMessage);
							}

						},
						error : function(err) {
							console.log(err);
						}
					});
				}
			});
		},exportIncomeTaxExcel: function(config) {
			var pager = config.pager || "#pager";
			var _gridStr = config.grid || 'pageGrid';
			var _formStr = config.form || 'searchForm';
			var grid = this[_gridStr];
			var form = this[_formStr];
			var self = this;
			grid.jqGrid('navGrid', pager, {add: false, edit: false, del: false, search: false, refresh: false});

			grid.jqGrid('navButtonAdd', pager, {
				caption: "导出个税报表",
				onClickButton: function (a, b, c) {
					var form = self[_formStr];
					if (form && form.validate && !form.validate()) {
						return;
					}
					$.ajax({
						type : 'POST',
						url : config.url,
						data : grid[0].p.postData,
						dataType : 'json',
						async : false,
						cache : false,
						contentType: 'application/x-www-form-urlencoded',
						headers: {
							"shbj-export":"EXPORT"
						},
						success : function(result) {
							if(result.resultCode === '100000'){
								alert(result.resultMessage);
								return;
							}else{
								alert(result.resultMessage);
							}

						},
						error : function(jqXHR, textStatus) {

						}
					});
				}
			});
		},gridExportExcel: function(config) {
			var pager = config.pager || "#pager";
			var _gridStr = config.grid || 'pageGrid';
			var _formStr = config.form || 'searchForm';
			var grid = this[_gridStr];
			var form = this[_formStr];
			var self = this;
			grid.jqGrid('navGrid', pager, {add:false,edit:false,del:false, search: false, refresh: false});

			grid.jqGrid('navButtonAdd',pager,{
				caption:"导出Excel",
				onClickButton : function (a, b, c) {
					var form = self[_formStr];
					if (form && form.validate && !form.validate()) {
						return ;
					}
					grid.jqGrid('excelExport',{"url": config.url});
				}
			});
		},gridExportIncomeTaxExcel: function(config) {
			var pager = config.pager || "#pager";
			var _gridStr = config.grid || 'pageGrid';
			var _formStr = config.form || 'searchForm';
			var grid = this[_gridStr];
			var form = this[_formStr];
			var self = this;
			grid.jqGrid('navGrid', pager, {add: false, edit: false, del: false, search: false, refresh: false});

			grid.jqGrid('navButtonAdd', pager, {
				caption: "导出个税报表",
				onClickButton: function (a, b, c) {
					var form = self[_formStr];
					if (form && form.validate && !form.validate()) {
						return;
					}
					grid.jqGrid('excelExport',{"url": config.url});
				}
			});
		}
	};

	var ConfigManager = (function (_super) {
		__extends(ConfigManager, _super);
		function ConfigManager(config) {
			_super.call(this);
			this.nodeRoot = {};
		}

		function getValue(name) {
			if (!_.isString(name)) {
				throw 'param of getValue should be String';
			};
			if(!this) {
				throw 'caller of getValue should be node of ConfigManager';
			};
			if(this.valueRoot && this.valueRoot[name]) {
				return this.valueRoot[name];
			} else {
				return null;
			};
		}

		function setValue(name, value) {
			if (!_.isString(name)) {
				throw 'param 1 of setValue should be String';
			};
			if(!this) {
				throw 'caller of getValue should be node of ConfigManager';
			};
			if(!this.valueRoot) {
				throw 'error in code, node should has own property "valueRoot"';
			} else {
				this.valueRoot[name] = value;
			}
		}

		ConfigManager.prototype.getNode = function getNode(name) {
			if (!_.isString(name)) {
				throw 'param of getNode should be String'
			}
			if (this.nodeRoot[name]) {
				return this.nodeRoot[name];
			} else {
				this.nodeRoot[name] = {
					getValue: getValue,
					setValue: setValue,
					valueRoot: {}
				};
				return this.nodeRoot[name];
			}
		};

		ConfigManager.prototype.setNode = function setNode(name, obj) {
			if (!_.isString(name)) {
				throw 'param 1 of setNode should be String';
			};
			var	node = {};
			node.getValue = getValue;
			node.setValue = setValue;
			node.valueRoot = {};
			for (var index in obj) {
				node.valurRoot[index] = obj[index];
			}
			var newObj = {name: node};
			this.nodeRoot = $.extend(true, {}, this.nodeRoot, newObj);
		};
		return ConfigManager;

	}) (CoreObject);
	var partnerCode = {
		SHBJ : '1',
		TAOBAO : '2',
		STORE : '3',
		APOLLO : '5'

	};
	var configManager = new ConfigManager();


	function isClass(o){
		if(o===null) return "Null";
		if(o===undefined) return "Undefined";
		return Object.prototype.toString.call(o).slice(8,-1);
	}

	function realDeepClone(obj){
		var result,oClass=isClass(obj);
		//确定result的类型
		if(oClass==="Object"){
			result={};
		}else if(oClass==="Array"){
			result=[];
		}else{
			return obj;
		}
		for(var key in obj){
			var copy=obj[key];
			if(isClass(copy)=="Object"){
				result[key]=realDeepClone(copy);//递归调用
			}else if(isClass(copy)=="Array"){
				result[key]=realDeepClone(copy);
			}else{
				result[key]=obj[key];
			}
		}
		return result;
	}

	var withNone = function(array){
		if(!_.isArray(array)) throw 'the argument is not an Array...'
		var array = _.clone(array);
		array.unshift({value: 'NONE', label: ''});
		return array;
	};

	var businessAreaMapWithNone = function(businessAreaMap){
		var _businessAreaMap = realDeepClone(businessAreaMap);
		var noneArray = [{value: 'NONE', label: '', centerPointlatitude: null, centerPointlongitude: null}];
		if(_businessAreaMap && _businessAreaMap.length > 1){
			_businessAreaMap.unshift({value: 'NONE', label: '', cityMap: []});
		}
		_businessAreaMap.forEach(function(element, index){
			if(element.cityMap && element.cityMap.length > 1){
				element.cityMap.unshift({value: 'NONE', label: '', latitude: null, longitude: null, businessAreaMap: []});
			}
			element.cityMap.forEach(function(ele, indx){
				if(ele.businessAreaMap && ele.businessAreaMap.length > 1){
					ele.businessAreaMap.unshift({value: 'NONE', label: '', centerPointlatitude: null, centerPointlongitude: null});
				}
			})
		});
		return _businessAreaMap;
	};

	var multiLayerWithNone = function(array){
		if(!_.isArray(array)) throw 'the argument is not an Array...';
		var array = realDeepClone(array);
		array.unshift({value: 'NONE', label: ''});
		for(var i = 0; i < array.length; i++){
			var e = array[i];
			for( var p in e ){
				if(e.hasOwnProperty(p) && _.isArray(e[p])){
					// e[p].unshift({value: 'NONE', label: ''});
					e[p] = multiLayerWithNone(e[p]);
				}
			}
		}
		return array;
	};


// 获取功能抽象 END
	return {
		ConfigManager: configManager,
		assert: CommonUtils.assert,
		DataType: DataType,
		JSONUtils: JSONUtils,
		CommonUtils: CommonUtils,
		ObjectUtils: ObjectUtils,
		DomUtils: DomUtils,
		JDomUtils: JDomUtils,
		ValueUtils: ValueUtils,
		UrlUtils: UrlUtils,
		klass: klass,
		TimerManager: TimerManager,
		TabelUtils : TabelUtils,
		__extends: __extends,
		CoreObject: CoreObject,
		abort: abort,
		OrderBy: OrderBy,
		Log: Log,
		GridUtils: GridUtils,
		// Data
		Bool: Bool,
		partnerCode : partnerCode,
		FormUtils : FormUtils,
		withNone: withNone,
		businessAreaMapWithNone: businessAreaMapWithNone,
		multiLayerWithNone: multiLayerWithNone,
		realDeepClone: realDeepClone
	};
});
