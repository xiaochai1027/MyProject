define(['jquery', 'underscore', 'l10n',		// 这些很基础, 肯定有强依赖
		'knockout', 'coreKit', 'networkKit', 'dataTable', 'DTbootstrap','jquery-placeholder',
		// Some module don't need for a variable
		'bootstrap', 'bootstrap-autocomplete', 'bootstrap-modal', 'datetimepicker', 'daterangepicker', 'jqgrid'],
	function ($, _, l10n, ko, cKit, netKit, dataTable, DTbootstrap) {
		'use strict';

		/** 基本修改点概述 ver 0.3.x
		 * -- 现在不完全使用id来定位一个控件，但是顶层控件必须还是由id来定位；其他子控件可以通过uid来进行绑定，uid是用来生成id的一种手段，并且可以直接说明绑定的node
		 * -- bind节点被移除了，现在所有节点都在根配置项上
		 * -- bind.data改名为node了
		 * -- 好多名词减肥了，没有那么长
		 * -- 所有的function绑定，暂时的参数列表为（data本身）；而且，this指针为当前的Controller对象
		 * -- Controller对象可以直接通过getViewModel()方法获得viewModel
		 * -- Controller对象可以通过getContainerForm()获得FormController
		 * -- FormController的onSubmit -> submit
		 */

		// 配置
		var VERSION = '0.3.0';
		var CONFIG = {
			IE_VERSION: ko.utils.ieVersion,
			DEBUG: true
		};

		var LOG_CONFIG = {
			module: 'uiKit3',
			debugLevel: 'DEBUG'
		};
		var commonHeader =  {
			"shbj-device":"BROWSER"
		};
		var log = new cKit.Log(LOG_CONFIG);

		/**
		 * 设置jqGrid默认属性
		 */

		try{
			$.jgrid.defaults;
		}catch(e){
			location.reload();
		}

		$.extend($.jgrid.defaults, {
			autowidth: true,
			datatype : "local",
			gridview : true,
			height : 'auto',
			hidegrid : false,
			jsonReader : {
				total : 'totalPage',
				page : 'pageNumber',
				records : 'recordNumber',
				repeatitems : false
			},
			ajaxGridOptions:{
				headers : commonHeader,

				xhrFields: {
					withCredentials: true
				}
			},
			loadComplete : function(data) {
				if(data.hasOwnProperty('code') && data.code != netKit.STATUS_CODE.SUCCESS) {
					alert(data.message + '(' + data.code + ')');
				}else if(data.hasOwnProperty('resultCode') && data.resultCode != netKit.STATUS_CODE.SUCCESS){
					alert(data.message + '(' + data.resultCode + ')');
				}
				var code = data.hasOwnProperty('code') ? data.code : data.resultCode;
				if(code == netKit.STATUS_CODE.SESSION_TIMEOUT || code == netKit.STATUS_CODE.SESSION_TIMEOUT2){
					var url = "/index.html";
					var obj = {
						type : 'changeLoaction',
						url : url
					};
					window.parent.postMessage($.toJSON(obj),"*");
				}
			},
			multiselect : false,
			mtype : 'POST',
			pager : '#pager',
			prmNames : {page : "pageNumber", rows : "pageSize", sort : "orderingBy", order : "ordering"},
			rowNum : 10,
			rowList : [10, 20, 30, 50],
			sortable : false,
			viewrecords : true,
			width : '100%'
		});

		DTbootstrap();
		$.extend(dataTable.defaults,{
			language: {
				"sProcessing":   "处理中...",
				"sLengthMenu":   "每页 _MENU_ 项",
				"sZeroRecords":  "没有匹配结果",
				"sInfo":         "当前显示第 _START_ 至 _END_ 项，共 _TOTAL_ 项。",
				"sInfoEmpty":    "当前显示第 0 至 0 项，共 0 项",
				"sInfoFiltered": "",
				"sInfoPostFix":  "",
				"sSearch":       "搜索:",
				"sUrl":          "",
				"sEmptyTable":     "表中数据为空",
				"sLoadingRecords": "载入中...",
				"sInfoThousands":  ",",
				"oPaginate": {
					"sFirst":    "首页",
					"sPrevious": "上页",
					"sNext":     "下页",
					"sLast":     "末页",
					"sJump":     "跳转"
				},
				"oAria": {
					"sSortAscending":  ": 以升序排列此列",
					"sSortDescending": ": 以降序排列此列"
				}
			},
			autoWidth: false,   //禁用自动调整列宽
			stripeClasses: ["odd", "even"],//为奇偶行加上样式，兼容不支持CSS伪类的场合
			order: [],          //取消默认排序查询,否则复选框一列会出现小箭头
			processing: false,  //隐藏加载提示,自行处理
			serverSide: true,   //启用服务器端分页
			searching: false,  //禁用原生搜索,
			ordering: false
		});

		/** 原则如下
		 * 所有的控件的基类应该是Widget
		 * 所有callback，比如onClick都需要重置this指针，this指针指向将于java保持一致，永远指向当前Widget对象（可通过self配置重置）
		 *
		 */

		// Wrappers, 这样做可以少打字，减少与require的内部依赖，并且引用浅了，性能更好
		var label = l10n.label;
		var message = l10n.message;
		var DomUtils = cKit.DomUtils;
		var ValueUtils = cKit.ValueUtils;

		var Constant = {
			DATE_FORMAT : 'yyyy-MM-dd'
		};

		var DummyFunction = function() {};

		var Binding = {
			TEXT: 'text',
			IF: 'if',
			FOREACH: 'foreach',
			KEY_UP: 'keyup',
			CHANGE: 'change',
			HTML: 'html',
			VALUE: 'value',
			OPTIONS: 'options',
			CLICK: 'click',
			SINGLE_CLICK: 'singleClick',
			DOUBLE_CLICK: 'doubleClick',
			CHECKED: 'checked',
			OPTIONS_TEXT: 'optionsText',
			OPTIONS_VALUE: 'optionsValue',
			WITH: 'with',
			VISIBLE: 'visible',
			ENABLE: 'enable',
			SUBMIT: 'submit',
			KEY_PRESS : 'keypress',
			KEY_DOWN : 'keydown',
			VALUE_UPDATE: 'valueUpdate',
			UPDATE: (Constant.IE_VERSION >= 6 && Constant.IE_VERSION <= 8) ? 'propertychange': 'input',
			PROPERTY_CHANGE: 'propertychange'
		};

		var Knockout = {
			OBSERVABLE: 'observable',
			OBSERVALBE_COMPUTED: 'dependentObservable',
			OBSERVABLE_ARRAY: 'observableArray',

			OBSERVABLE_COMMON_FUNCTION_MARK: '__uikit_observable_common_function_mark__',
			OBSERVABLE_FUNCTION_MARK: '__uikit_observable_function_mark__',
			OBSERVABLE_COMPUTED_FUNCTION_MARK: '__uikit_observable_computed_function_mark__',
			OBSERVABLE_ARRAY_FUNCTION_MARK: '__uikit_observable_array_function_mark__'
		};

		// 扩展ko的一些binding，使其可以直接使用，而不必要放到event{}绑定中
		(function __extends_ko_handlers(extensions) {
			// 这些函数扩展只是为了识别各种observable
			ko.subscribable.fn[Knockout.OBSERVABLE_COMMON_FUNCTION_MARK] = DummyFunction;
			ko.observable.fn[Knockout.OBSERVABLE_FUNCTION_MARK] = DummyFunction;
			ko.observableArray.fn[Knockout.OBSERVABLE_ARRAY_FUNCTION_MARK] = DummyFunction;
			ko.computed.fn[Knockout.OBSERVABLE_COMPUTED_FUNCTION_MARK] = DummyFunction;

			function __create_ko_event_handler(eventName) {
				return {
					init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
						var newValueAccessor = function () {
							var result = {};
							result[eventName] = valueAccessor();

							if(eventName == Binding.UPDATE) {
								var value = element.value;
								var allBindings = allBindingsAccessor();
								var elementValueAccessor = allBindings['value'] || allBindings['valueWithInit'];
								if(elementValueAccessor && _.isFunction(elementValueAccessor) && _.isString(value) && value.length > 0) {
									elementValueAccessor(element.value);
								}
							}

							return result;
						};
						return ko.bindingHandlers.event.init.call(this, element, newValueAccessor, allBindingsAccessor, viewModel);
					}
				};
			}


			for (var index in extensions) {
				var extension = extensions[index];
				ko.bindingHandlers[extension] = __create_ko_event_handler(extension);
			}

			// 当chrome等浏览器进行自动填充时，ko并不会对填充数据进行响应，viewModel中的内容不会被更新，这个valueWithInit绑定可以取值，并更新vm内部数据
			ko.bindingHandlers.valueWithInit = {
				init: function(element, valueAccessor, allBindingsAccessor, context) {
					var observable = valueAccessor();
					var value = element.value;

					observable(value);

					ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor, context);
				},
				update: ko.bindingHandlers.value.update
			};

			// src 属性控制
			ko.bindingHandlers.src = {
				init: function(element, valueAccessor, allBindingsAccessor, context) {
					var observable = valueAccessor();
					var value = ko.utils.unwrapObservable(observable);

					element.src = value;
				},

				update: function(element, valueAccessor, allBindingsAccessor, context) {
					var observable = valueAccessor();
					var value = ko.utils.unwrapObservable(observable);

					element.src = value;
				}
			};

			// 单击控制
			ko.bindingHandlers.doubleClick = {
				init : function(element, valueAccessor, allBindingsAccessor, context) {
					var handler = valueAccessor(), delay = 200, clickTimeout = false;
					var cont = context;
					$(element).dblclick(function(e) {
						handler(cont, e);
					});
				}
			};

			// 单击控制
			ko.bindingHandlers.singleClick = {
				init : function(element, valueAccessor, allBindingsAccessor, context) {
					var handler = valueAccessor(), delay = 200, clickTimeout = false;
					var cont = context;
					$(element).click(function(e) {
						if (clickTimeout !== false) {
							clearTimeout(clickTimeout);
							clickTimeout = false;
						} else {
							clickTimeout = setTimeout(function() {
								clickTimeout = false;
								handler(cont, e);
							}, delay);
						}
					});
				}
			};

		}) ([Binding.UPDATE, Binding.CHANGE, Binding.KEY_PRESS, Binding.KEY_UP, Binding.KEY_DOWN, Binding.SUBMIT]);

		(function __init_under_score() {
			// 配置underscore的template模板转义符，因为默认的转义符<%= %> 与jsp的冲突
			_.templateSettings = {
				interpolate: /\{\{=(.+?)\}\}/g,
				evaluate: /\{\{(.+?)\}\}/g
			};
		}) ();

		/** Icon 图标
		 *
		 */
		var Icon = {
			OK: 'icon-ok icon-white',
			REMOVE: 'icon-remove icon-white',
			ADD: 'icon-plus icon-white'
		};

		/** 验证器
		 *
		 * 提供默认的几类实现
		 *
		 * @return false	验证失败
		 * @return text		验证成功，并且验证可以修改本身的值
		 *
		 */
		var Validator = {
			Utils: {
				// 将数字和字符串转换为字符串
				toString: function toString(text) {
					if(_.isNumber(text)) {
						return '' + text;
					} else if(_.isString(text)) {
						return text;
					} else {
						return '';
					}
				},
				// 生成ValidatorResult
				createValidatorResult: function(result, message) {
					return {
						result: result,
						message: message
					};
				},
				existingActionValidator: function(mainForm, controllerUid, url) {
					var returnVal = true;
					var action = new netKit.SimpleGetAction(this,
						url,
						function(self,  result) {
							if (result.resultCode == STATUS_SUCCESS) {
								if (result.existing) {
									mainForm.getControllerByUid(controllerUid).presentValidatorResult(Validator.Utils.createValidatorResult(false, message.duplicateMessage));
									returnVal = false;
								}
							} else {
								alert(result.resultMessage);
							}
						},
						function() {});
					action.submit();
					return returnVal;
				}

			}
		};

		(function __init_validators(_no_args_) {
			Validator.create = function create (message, v) {
				if(_.isUndefined(message)) {
					throw ('Incorrect validator message!');
				}

				var va = function Validator() {
					return v.apply(this, arguments);
				};
				va.message = message;

				return va;
			};

			Validator.createWithRegEx = function createWithRegEx (message, regex) {
				var _regex = regex;
				return Validator.create(message, function(text) {
					if (text) {
						return _regex.test(text);
					}

					return false;
				});
			};

			// 可为空的验证器
			Validator.createEmptyWithRegEx = function createWithRegEx (message, regex) {
				var _regex = regex;
				return Validator.create(message, function(text) {
					if (text) {
						return _regex.test(text);
					}

					return true;
				});
			};

			Validator.createWithNumericRegEx = function createWithNumericRegEx (message, regex) {
				var _regex = regex;
				return Validator.create(message, function(text) {
					if (text || text === 0) {
						return (regex.test(text) || (text =='0'));
					}

					return false;
				});
			};

			// 自定义
			Validator.DEFINE = Validator.create;

			// 不验证
			Validator.NULL = Validator.create(message.nullValidator,
				function (text) {
					return true;
				}
			);

			// 可以为空，总是返回true，只作为一个flag使用
			Validator.ALLOW_EMPTY = Validator.create("",
				function (text) {
					return true
				}
			);

			// 非空验证器(null,'','NONE','-1')
			Validator.NONEMPTY = Validator.create(message.nonemptyValidator,
				function (text) {
					return !(cKit.ValueUtils.isEmpty(text));
				}
			);
			// 非空验证器('null')
			Validator.RadioGroupNONEMPTY = Validator.create(message.nonemptyValidator,
				function (text) {
					return text != "null";
				}
			);
			// 非空验证器(null,'')(非SELECT输入框使用)
			Validator.NONEMPTYV2 = Validator.create(message.nonemptyValidator,
				function (text) {
					return (text !== null && text !== '');
				}
			);
			//非0验证器
			Validator.NONZERO = Validator.create(message.nonzeroValidator,
				function(text) {
					if(parseFloat(text) === 0) {
						return false;
					}
					return true;
				});

			// 百分比小数验证器[0,1]
			Validator.PERCENTAGE_NUMERIC = Validator.create(message.percentageNumericValidator,
				function (text) {
					return cKit.ValueUtils.isValidPercentageNumeric(text);
				}
			);
			//最多能输入两位小数
			Validator.PERCENTAGE_NUMERIC_2DECIMAL  = Validator.create(message.percentageNumeric2decimal,
				function (text) {
					var str = Validator.Utils.toString(text);
					var reg = /^[0-9]+(\.[0-9]{1,2}){0,1}$/;
					if(str){
						if(reg.test(str)) {
							return true;
						} else {
							return false;
						}
					}else{
						return true;
					}

				}
			);
			//最多能输入两位小数正负都可以
			Validator.PERCENTAGE_NUMERIC_2DECIMALV2  = Validator.create(message.percentageNumeric2decimal,
				function (text) {
					var str = Validator.Utils.toString(text);
					var reg = /^[-+]?[0-9]+(\.[0-9]{1,2}){0,1}$/;
					if(str){
						if(reg.test(str)) {
							return true;
						} else {
							return false;
						}
					}else{
						return true;
					}

				}
			);
			// 密码验证器
			Validator.PASSWORD = Validator.create(message.passwordValidator,
				function (text) {
					var str = Validator.Utils.toString(text);
					var regx = /^(?=.*[a-zA-Z].*)([a-zA-Z0-9]{6,16})$/;
					if(regx.test(str)) {
						return true;
					} else {
						return false;
					}
				}
			);
			//微信验证器  第一位为字母 6-20位数字字母下划线减号组成

			Validator.WEIXIN = Validator.create(message.loginNamValidatorWeixin,
				function (text) {
					var str = Validator.Utils.toString(text);
					var regx = /(^[a-zA-Z]{1})([a-zA-Z0-9_-]{5,19})/g;
					if(str == "" || regx.test(str)) {
						return true;
					} else {
						return false;
					}
				}
			);
			// 登录名证器
			Validator.LOGIN_NAME = Validator.create(message.loginNamValidator,
				function (text) {
					var str = Validator.Utils.toString(text);
					var regx = /^(?=.*[a-zA-Z].*)([a-zA-Z0-9]{4,20})$/;
					if(regx.test(str)) {
						return true;
					} else {
						return false;
					}
				}
			);

			/* 范围验证器
			 * @param min 数字 范围最小值
			 * @param max 数字 范围最大值
			 * 假设x为能过验证的数字 min <= x <= max
			 * 当min不需要时，用null代替
			 */
			Validator.RANGE = function(min, max, step) {
				if (min !== null && (min === undefined || !_.isNumber(min)) ) {
					throw ('Params should be numbers!');
				}
				if (min === null && (max === null || max === undefined)) {
					throw ('At least one param required!');
				}
				if (!_.isUndefined(max) && !_.isNumber(max)) {
					throw ('Params should be numbers!');
				}
				var errorMessage = '';
				if (min === null) {
					errorMessage = message.rangeValidatorFormatString1.format('' + max);
				} else if (max === null || max === undefined) {
					errorMessage = message.rangeValidatorFormatString2.format('' + min);
				} else {
					errorMessage = message.rangeValidatorFormatString3.format('' + min, '' + max);
				}
				return Validator.create(errorMessage,
					function(text) {
						var value = parseFloat(text)

						if (min === null) {
							return value <= max;
						} else if (max === null || max === undefined) {
							return value >= min;
						} else {
							return value >= min && value <=max;
						}
						return false;
					}
				);
			}
			Validator.FILE_SUFFIX = function(fileType, fileSuffix){

				return  Validator.create(fileType+ message.fileSuffixValidator + fileSuffix,
					function (text,model) {
						if(!text){
							return true;
						}
						var suffixArr = text.split('.');
						if (suffixArr.length) {
							var suffix = suffixArr[suffixArr.length -1];
							return suffix == fileSuffix;
						} else {
							return false;
						}

					}
				);
			}
			// 固定电话验证器
			Validator.FIXED_LINE = Validator.create(message.fixedLineValidator,
				function(text, model) {
					if(model.regionCode || model.phoneNumber || model.extension) {
						return cKit.ValueUtils.isValidFixedLine(model.regionCode, model.phoneNumber, model.extension);
					}
					return true;
				}
			);

			// 固定电话验证器
			Validator.NONEMPTY_FIXED_LINE = Validator.create(message.fixedLineValidator,
				function(text, model) {
					return cKit.ValueUtils.isValidFixedLine(model.regionCode, model.phoneNumber, model.extension);
				});
			//手机验证 ，手机号可为空

			Validator.ALLOW_Empty_MOBILE = Validator.create(message.mobileValidator,
				function (text,model) {
					if(cKit.ValueUtils.isEmpty(text)) {
						return true;
					} else {
						return cKit.ValueUtils.isValidMobile(text);
					}
				}
			);
			// 条形码验证器
			Validator.BARCODE = Validator.createWithNumericRegEx(message.barcodeValidator,
				/^((\d{13})|(\d{6})|(\d{8}))$/);
			//全数字条形码验证
			Validator.BARCODENUMBER = Validator.createWithNumericRegEx(message.barcodeNumberValidator,
				/^[0-9]+([0-9]+)?$/);

			//全数字验证
			Validator.ALLNUMBER = Validator.createWithNumericRegEx(message.allNumberValidator,
				/^[0-9]{1,8}?$/);

			// 小数验证器（可为负）
			Validator.NUMERIC = Validator.createWithNumericRegEx(message.numericValidator,
				/^[-+]?[0-9]+(\.[0-9]+)?$/);


			// 小数验证器（0和正数）
			Validator.POSITIVE_NUMERIC = Validator.createWithNumericRegEx(message.positiveNumericValidator,
				/^[0-9]+(\.[0-9]+)?$/);
			// 可为空小数验证器（0和正数）
			Validator.EMPTY_POSITIVE_NUMERIC = Validator.createEmptyWithRegEx(message.positiveNumericValidator,
				/^[0-9]+(\.[0-9]+)?$/);

			// 整数验证器（可为负）
			Validator.INTEGER = Validator.createWithNumericRegEx(message.integerValidator,
				/^[-+]?[1-9]+[0-9]*$/);
			// 正整数验证器（0和正整数）
			Validator.POSITIVE_INTEGER = Validator.createWithNumericRegEx(message.positiveIntegerValidator,
				/^[1-9]+[0-9]*$/);
			// 正整数验证器(可空，非0) ///^\+?[1-9][0-9]*$/
			Validator.POSITIVE_INTEGER_NONZERO = Validator.createEmptyWithRegEx(message.positiveIntegerValidator,
				/^[1-9]+[0-9]*$/);

			// 经度验证器
			Validator.LONGITUDE = Validator.createWithRegEx(message.longitudeValidator,
				/^[1-9]{1}[0-9]{1,2}\.[0-9]{1,6}$/);
			// 纬度验证器
			Validator.LATITUDE = Validator.createWithRegEx(message.latitudeValidator,
				/^[1-9]{1}[0-9]{1,2}\.[0-9]{1,6}$/);
			// 手机号验证器
			Validator.MOBILE = Validator.createWithRegEx(message.mobileValidator,
				/^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(16[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/);
			// EMAIL验证器
			Validator.EMAIL = Validator.createWithRegEx(message.emailValidator,
				/^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/);

			//URL验证器
			Validator.URL = Validator.createEmptyWithRegEx('输入正确的url', /(^http:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?)|(^https:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?)/);

			// 身份证号验证器
			Validator.IDENTITYCARDNUMBER = Validator.createEmptyWithRegEx(message.identityCardNumberValidator,
				/(^$)|(^((\d{15})|(\d{17}([0-9]|X)))$)/);
			//TODO 正小数验证器

			// 固话和手机
			Validator.PHONE_NUMBER = Validator.createWithRegEx(message.phoneNumberValidator,
				/^(([0-9]{3,4}-?([0-9]{7,8}))|(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8}))$/);
			//可为空固话和手机
			Validator.EMPTY_PHONE_NUMBER = Validator.create(message.phoneNumberValidator,
				function(text) {
					if(cKit.ValueUtils.isEmpty(text)) {
						return true;
					}
					var regx = /^(([0-9]{3,4}-?([0-9]{7,8}))|(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8}))$/;
					if(regx.test(text)) {
						return true;
					}
					return false;
				}
			);
			//可为空小数验证器
			Validator.EMPTY_NUMERIC = Validator.create(message.numericValidator,
				function(text) {
					if(cKit.ValueUtils.isEmpty(text)) {
						return true;
					}
					var regx = /^[-+]?([0-9]*)?(\.[0-9]+)?$/ig;
					if(regx.test(text)) {
						return true;
					}
					return false;
				}
			);
			Validator.TIME_RANGE = Validator.create(message.timeRangeValidator,
				function (text) {
					if (cKit.ValueUtils.isEmpty(text)) {
						return false;
					}

					if(text == false){
						return false;
					}

					var times = text.split("-");

					if (times == null || times.length < 2) {
						return false;
					}

					var time1 = times[0].split(":");
					if (time1 == null || time1.length < 3) {
						return false;
					}

					var time2 = times[1].split(":");
					if (time2 == null || time2.length < 3) {
						return false;
					}

					var time1InSeconds = parseInt(time1[0]) * 3600 + parseInt(time1[1]) * 60 + parseInt(time1[2]);
					var time2InSeconds = parseInt(time2[0]) * 3600 + parseInt(time2[1]) * 60 + parseInt(time2[2]);

					if (time1InSeconds >= time2InSeconds) {
						return false;
					}
				}
			);
			Validator.TIME_RANGE_ALLOW_EMPTY = Validator.create(message.timeRangeValidator,
				function (text) {
					if (text == null || text == "null-null") {
						return true;
					}

					if(text == false){
						return false;
					}

					var times = text.split("-");

					if (times == null || times.length < 2) {
						return false;
					}

					var time1 = times[0].split(":");
					if (time1 == null || time1.length < 3) {
						return false;
					}

					var time2 = times[1].split(":");
					if (time2 == null || time2.length < 3) {
						return false;
					}

					var time1InSeconds = parseInt(time1[0]) * 3600 + parseInt(time1[1]) * 60 + parseInt(time1[2]);
					var time2InSeconds = parseInt(time2[0]) * 3600 + parseInt(time2[1]) * 60 + parseInt(time2[2]);

					if (time1InSeconds >= time2InSeconds) {
						return false;
					}
				}
			);
			Validator.STRING_MAX_LENGTH = function(max) {
				var errorMessage = message.stringMaxLengthFormatString.format(max);

				return Validator.create(errorMessage,
					function(text) {
						if (!text) {
							return true;
						}

						if (text.length > max) {
							return false;
						}

						return true;
					}
				);
			}

			/** 选项数量验证器
			 *
			 * @param min 最小选择数量
			 * @param max 最大选择数量，可以不给出
			 */
			Validator.CAPACITY = function(min, max) {
				if(min == 'undefined' || !_.isNumber(min)) {
					throw ('Params should be numbers!');
				}
				if(max == 'undefined') {
					max = min;
				} else if(!_.isNumber(max)) {
					throw ('Params should be numbers!');
				}
				var errorMessage = '';
				if(min == max) {
					errorMessage = message.sizeValidatorFormatString1.format(min);
				} else {
					errorMessage = message.sizeValidatorFormatString2.format(min, max);
				}

				return Validator.create(errorMessage,
					function(args) {
						if(!args.hasOwnProperty('length')) {
							throw ('BUG! Argument should be an array!');
						}

						var length = args.length;
						if(length >= min && length <= max) {
							return true;
						}

						return false;
					});
			};


			/** 重复性验证器
			 *
			 * @param id 一个控件的id, 内容将通过.val()函数获得，并且保证与之一致
			 *
			 */
			Validator.REPEAT = function(uid) {
				return Validator.create(message.repeatValidator,
					function(text) {
						var str = text;
						if (!_.isString(uid)) {
							throw 'param [uid] should be a string for REPEAT validator'
						}
						var str2 = '';
						str2 = this.getContainerForm().getNodeValue(uid);
						if(str === str2) {
							return true;
						} else {
							return false;
						}
					});
			};

			/* 由于验证器的验证规则是逻辑与
			 * 所以下面的验证器遵循最小化原则 
			 * 每一个验证器都只验证一个属性
			 * 注意： 每个验证器都保证空值能够通过验证!
			 * 这样可以避免可以为空的字段没法验证的情况
			 */

			// 可为空的整数验证器（0和正整数）
			Validator.EMPTY_POSITIVE_INTEGER = Validator.createEmptyWithRegEx(message.positiveIntegerValidator,
				/^([1-9]+[0-9]*)|0$/);

		}) ();


		/** 处理对个target的多个binding列表
		 * 对于一个target的所有binding会被合并
		 * 对于一个target的相同的binding将会被覆盖
		 */
		var BindingContainer = (function (_super) {
			cKit.__extends(BindingContainer, _super);
			function BindingContainer() {
				this.contexts = [];
				this.maps = [];
			}

			BindingContainer.prototype.getContexts = function() {
				return this.contexts;
			};

			BindingContainer.prototype.getMaps = function() {
				return this.maps;
			};

			BindingContainer.prototype.getBindingContent = function(obj) {
				var contexts = this.contexts;
				var maps = this.maps;

				var index = contexts.indexOf(obj);
				if(index >= 0) {
					return maps[index];
				} else {
					contexts.push(obj);
					maps.push('');
					return maps[maps.length - 1];
				}
			};

			BindingContainer.prototype.setBindingContent = function(obj, content) {
				var contexts = this.contexts;
				var maps = this.maps;
				var index = contexts.indexOf(obj);
				if(index >= 0) {
					maps[index] = content;
				} else {
					throw 'Can not find content!';
				}
			};

			return BindingContainer;

		}) (cKit.CoreObject);

		var UiUtils = {
			BIND_FLAG_INSIDE_FOREACH : 0x1,       // insideForeach 是否处于ko的foreach作用域内
			BIND_FLAG_USE_BINDING_MAP : 0x2,      // 所有内容都绑定到target上，忽略bindingMap

			BIND_FLAG_CREATE_NODE : 0x4,          // 对拥有field的config，决定是否在viewModel中创建子节点

			BIND_FLAG_DURING_BINDING : 0x8,       // node是否在绑定过程中
			BIND_FLAG_EVALUABLE : 0x10,           // node是否可估值

			/** 从一个target的父节点中搜索class='controls'的节点
			 *
			 * @throws 当没有任何controls节点时抛出异常
			 */
			findControlsTag: function(target, id, attrClass) {
				var foundControlElement = false;
				var groupId = id + '_group';
				attrClass = attrClass || 'controls';
				// 寻找controls节点
				while(target.length && target.length > 0) {
					if(target.hasClass(attrClass)) {
						foundControlElement = true;
						break;
					} else if(target.attr('id') === groupId) {
						break;
					}
					target = $(target.get(0).parentElement);

				}
				if(!foundControlElement) {
					throw 'We can not find class="' + attrClass + '" element for id="' + id + '"!';
				}
				return target;
			},


			/** 对FieldGroupController, TableController, FormController中的config.field域逐个构造子Controller
			 *
			 *  @param config           父controller的config
			 *  @param viewModel        controller对应的viewModel
			 *  @param createNodeFlags  为BIND_FLAG_CREATE_NODE时，表示为controller在viewModel上建立节点
			 */
			bindControllers: function(config, viewModel, createNodeFlags) {
				if(!_.isNumber(createNodeFlags)) {
					createNodeFlags = 0;
				}

				var fieldConfigs = config.fields;
				var COUNT = fieldConfigs.length,
					i = 0,
					fieldConfig,
					fieldId,
					isArray;

				/** 遍历所有的field配置，对field进行初始化
				 */
				this.controllers = new Array(COUNT);
				for(; i < COUNT; ++i) {
					fieldConfig = fieldConfigs[i];
					fieldId = fieldConfig.id;
					if(!fieldConfig.type) {
						fieldConfig.type = Controller.LABEL_CONTROLLER;
					}

					if (config.type === cKit.DataType.ARRAY)  {
						isArray = true;
					} else {
						isArray = false;
					}

					fieldConfig.parent = this;
					var controller = Controller.CreateController(fieldConfig.type, fieldConfig);
					this.controllers[i] = controller;
					/**
					 *  data_bind 的操作 全部移至各个控件的构造函数中
					 */

					if (isArray) {
						if(!config.node) {
							throw ('config need a node field to indentify the data binding role.');
						}

						var capacity = config.capacity;
						if(_.isNull(capacity) || _.isUndefined(capacity)) {
							var observableArray = this.getNode();
							if(_.isFunction(observableArray)) {
								observableArray = observableArray();
							}
							observableArray = observableArray[config.node];
							config.capacity = observableArray().length;
						}

						if(this.alignCapacity) {
							this.alignCapacity(fieldConfig);
						}

						/* 这里做两件事
						 * 
						 * 给controls绑定foreach,给control-group绑定with作用域
						 * 
						 */
						var insertPos = UiUtils.findControlsTag(controller.target, fieldConfig.id);

						UiUtils.applyBindingsForObject(insertPos, config, [{
							key: Binding.FOREACH,
							value: '$data'
						}], viewModel);

						insertPos = controller.groupTarget;
						if(!insertPos.length || insertPos.length < 1) {
							throw 'ARRAY node need "control-group"!';
						}
						UiUtils.applyBindingsForObject(insertPos, config, [{
							key: Binding.WITH,
							value: controller.getNodeName()
						}], viewModel);


						/* 增加值更新监听器,这个监听器主要是解决, 在ko中,ObservableArray如果含有的数据
						 * 都是原始数据类型,并非复合对象(忽略是否被observable包裹);则在数据值通过
						 * inputbox等控件更新后,并不会反应到数组元素上来的问题.
						 */
						if(controller.target) {
							controller.addBinding(Binding.CHANGE, 'function(data, event) { return $root["' + ViewModelUtils.OPERATION_ROOT + '"].' + fieldId + '_array_element_update($parent, $index(), $element); }');

							// 值改变的处理函数
							viewModel[ViewModelUtils.OPERATION_ROOT][fieldId + '_array_element_update'] = function(array, arrayIndex, element) {
								// 这里只能通过dom操作或者jQuery操作获取值,并不能通过ko
								var itemValue = element.value;
								// 这里值更新可以，但是删除和添加无效, 原因不明
								array.splice(arrayIndex, 1, itemValue);
								return true;
							};
						}
					}

					// 对field对象进行数据绑定
					if(createNodeFlags === UiUtils.BIND_FLAG_CREATE_NODE) {
						controller.createNode();
					}
					controller.applyBindings();

					// 如果是数组的情况,会产生多个controls节点,其中包括了很多重复的id,需要在foreach产生出多个节点之前移除id
					if(isArray) {
						controller.clearTargetIds();
					}
				}
			},

			/**  按照bindings生成绑定参数
			 *
			 * @note 对于click绑定，实际的接收参数应该为(data, viewModel, event index)
			 *
			 * @param target jQuery目标,只想生成data_bind的目标
			 * @param config 该widget的配置
			 * @param bindings 绑定参数
			 * @param viewModel 当前Form的viewModel
			 * @param flags 参数，详见BIND_FLAG_*
			 */
			applyBindingsForObject: function applyBindingsForObject(target, config, bindings, viewModel, flags, controller) {
				var bindingMap = config.bindingMap || {};

				if(!target.hasOwnProperty('length')) {
					throw ('"target" should be a jQuery object!');
				}

				if(!_.isArray(bindings)) {
					throw ('"bindings" should be an array!');
				}

				if(bindings.length > 0) {
					var bindingContainer = new BindingContainer();

					for(var index in bindings) {
						var binding = bindings[index];

						if(!binding.hasOwnProperty('key') || !binding.hasOwnProperty('value')) {
							throw ('Missing binding key or value for binding[' + index + '], which is ' + binding);
						}

						var value = binding.value;
						if(viewModel && _.isFunction(value)) {
							viewModel[ViewModelUtils.OPERATION_ROOT][config.id + '_' + binding.key] = value;
							var nodeName = controller ? controller.getNodeName(config.node) : null;
							var nodeValue = nodeName && (nodeName != '$root') ? (nodeName + '()') : '$data';
							var prefix = '';
							var suffix = '';
							var param = '';
							// var thisParam = controller ? (nodeName + '.controller') : 'null'; 
							var thisParam = '"' + config.id + '"';
							switch(binding.key) {
								case Binding.UPDATE:
								case Binding.CLICK:
								case Binding.SINGLE_CLICK:
								case Binding.DOUBLE_CLICK:
								case Binding.KEY_UP:
								case Binding.KEY_DOWN:
								case Binding.KEY_PRESS:
									prefix = 'function(data, event) { return ';
									suffix = '; }';
									param = nodeValue + ', event' + (flags & UiUtils.BIND_FLAG_INSIDE_FOREACH === true ? ', $index()' : '');
									break;
								// FIXME
								case Binding.VISIBLE:
								default:
									param = nodeValue;
									break;
							}
							var functionName = config.id + '_' + binding.key;
							// 生成跳转
							value = prefix + '$root["' + ViewModelUtils.OPERATION_ROOT + '"].callFunction.call(null, ' + thisParam + ', $root, "' + functionName + '", ' + param + ')' + suffix;
						}
						var bindTarget = null;

						// 如果flag有BIND_FLAG_USE_BINDING_MAP就都绑定到target上
						if(flags & UiUtils.BIND_FLAG_USE_BINDING_MAP) {
							bindTarget = bindingMap[binding.key];
						}

						if(!bindTarget || bindTarget.length < 1) {
							bindTarget = target;
						}

						var bindingContent = bindingContainer.getBindingContent(bindTarget);
						bindingContent += (bindingContent.length > 0 ? ', ' : '') + binding.key + ': ' + value;
						bindingContainer.setBindingContent(bindTarget, bindingContent);
					}

					var bindingContexts = bindingContainer.getContexts();
					var bindingMaps = bindingContainer.getMaps();
					for(var i in bindingContexts) {
						bindTarget = bindingContexts[i];
						bindingContent = bindingMaps[i];

						if(bindingContent.length > 0) {
							bindTarget.attr('data-bind', bindingContent);
						}
					}

				}
			},
		};


		var KoUtils = {
			// 判断参数是否为一个ko.computed函数
			isComputed: function isComputed(func) {
				if(!_.isFunction(func) || !_.isFunction(func[Knockout.OBSERVABLE_COMPUTED_FUNCTION_MARK])) {
					return false;
				}

				return true;
			},
			// 判断参数是否为一个ko.ovservable函数
			isObservable: function isObservable(func) {
				if(!_.isFunction(func) || !_.isFunction(func[Knockout.OBSERVABLE_FUNCTION_MARK])) {
					return false;
				}

				return true;
			},

			// 判断是否为一个ko.observableArray函数
			isObservableArray: function isObservableArray(func) {
				if(!_.isFunction(func) || !_.isFunction(func[Knockout.OBSERVABLE_ARRAY_FUNCTION_MARK])) {
					return false;
				}
				return true;
			},
			// 判断是否为任意一个ko节点
			isObservableNode: function isObservableNode(func) {
				if(!_.isFunction(func) || !_.isFunction(func[Knockout.OBSERVABLE_COMMON_FUNCTION_MARK])) {
					return false;
				}

				return true;
			},

			unwrapObservableTree: function unwrapObservableTree(obj) {
				var root = KoUtils.isObservableNode(obj) ? ko.utils.unwrapObservable(obj) : obj;


				var result = null;
				if(_.isObject(root)) {
					result = {};
					for(var p in root) {
						var node = root[p];
						var nodeValue = node;
						if(KoUtils.isObservableNode(node)) {
							nodeValue = KoUtils.unwrapObservableTree(node);
						}
						result[p] = nodeValue;
					}
				} else {
					result = root;
				}

				return result;
			}
		};

		var Alert = {
			show: function(msg) {
				var alertArea = $('#alertArea');
				alertArea.html('');
				alertArea.append('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>' +
					'<h4>' + msg + '</h4>' + '</div>');
			},

			clear: function() {
				var alertArea = $('#alertArea');
				alertArea.html('');
			}
		};

		/** VAR_ARGS, 多出来的都是Default，并优先级递减排列
		 *
		 */
		var ConfigUtils = {
			mergeConfig: function mergeConfig(VA_ARGS) {
				// Get config specs
				var i,
					config = {},
					COUNT = arguments.length;

				for(i = COUNT; i >= 0; --i) {
					config = $.extend(true, {}, config, arguments[i]);
				}
				//将参数2中的属性填充到参数1的属性中（相同属性不覆盖）
				config = $.extend(true, {}, DEFAULT_WIDGET_CONTROLLER_CONFIG, config);
				//最后来源将覆盖以前参数相同的属性

				return config;
			}
		};



		var ViewModelUtils = {
			/** 附加节点
			 */
			BINDING_ROOT: 'uiKit_bindings',			// 绑定的额外值,比如options等等
			OPERATION_ROOT: 'uiKit_operations',		// 绑定的各种操作
			CONTROLLER_ROOT: 'uiKit_controllers',	// 当前viewModel所指向的FormController的所有Controller
			EXTRA_ROOT: 'extra',					// 给外接扩展用的节点，这个节点会体现到viewModel上，但不会变成observable，并且转换回对象时会自动去除这个节点

			FLAG_MERGE: 0x2,						// 更新viewModel时，只是想新数据添加进去，并不影响旧有节点，当节点相同，则做值覆盖

			/** 增加一个函数调用
			 *
			 * 这个函数将会在ko.applyBindings()之后被调用
			 *
			 */
			addPostCall: function(viewModel, func) {
				if(!_.isFunction(func)) {
					throw ('Incorrect parameter(s): addPostCall(Function func)!');
				}

				viewModel[ViewModelUtils.OPERATION_ROOT].postCalls.push(func);
			},

			clearPostCalls: function(viewModel) {
				viewModel[ViewModelUtils.OPERATION_ROOT].postCalls = [];
			},

			/** 获取所有的postCalls
			 *
			 */
			getPostCalls: function(viewModel) {
				return viewModel[ViewModelUtils.OPERATION_ROOT].postCalls;
			},

			/** 从js对象转换成viewModel
			 *
			 * 映射规则，所有的节点都会被映射到ko的observable中，对象也是一样的。其中子节点的子节点也会变成observable
			 *
			 * @param root js对象
			 * @param viewModel 需要更新的viewModel，如果不给出则认为需要重新创建一个新的viewModel
			 * @param ignoreNodes 需要忽略的根节点（只能为根节点，出于性能考虑）
			 * @param isRoot 当前viewModel是否为根节点（内部使用）
			 */
			fromJS: function fromJS(root, viewModel, ignoreNodes, notRoot, flags) {
				flags = flags || 0;
				if(!root) {
					throw 'Incorrect argument!';
				}

				viewModel = viewModel || {};
				var viewModelValue = null;
				var value = null;
				var attr = null;
				var array, element, index;

				// 如果是数组,则直接返回一个observableArray
				if(_.isArray(root)) {
					value = root;
					array = KoUtils.isObservableArray(viewModel) ? viewModel : ko.observableArray([]);
					array.removeAll();
					for(index in root) {
						element = root[index];
						var converted = null;
						if(ValueUtils.isTypeofObject(element) || _.isArray(element)) {
							converted = {};
							converted = ViewModelUtils.fromJS(element, converted, null, true, flags);
						} else {
							converted = element;
						}

						array.push(converted);
					}

					return array;
				}

				var keys1 = ValueUtils.isTypeofObject(root) ? _.keys(root) : [];
				var vm = viewModel;
				if(KoUtils.isObservableNode(viewModel)) {
					vm = viewModel();
				}
				var keys2 = (ValueUtils.isTypeofObject(vm) && null !== vm) ? _.keys(vm) : [];
				var keys = _.union(keys1, keys2);
				for(index in keys) {
					var p = keys[index];

					if((flags & ViewModelUtils.FLAG_MERGE) && !root.hasOwnProperty(p)) {
						continue;
					}

					if(_.include(ViewModelUtils.EXTRA_NODES, p)) {
						continue;
					}

					if((!notRoot) && (_.isArray(ignoreNodes) ? (_.include(ignoreNodes, p)) : false)) {
						continue;
					}

					attr = root[p];
					value = null;
					if(_.isUndefined(attr) || null === attr) {
						value = null;
					} else if(ValueUtils.isTypeofObject(attr)) {
						viewModelValue = ko.utils.unwrapObservable(viewModel[p]);
						value = ViewModelUtils.fromJS(attr, viewModelValue, null, true, flags);
					} else {
						value = attr;
					}

					if(KoUtils.isObservableArray(value)) {
						if(!KoUtils.isObservableArray(viewModel[p])) {
							viewModel[p] = ko.observableArray([]);
						}
						array = viewModel[p];
						var elements = _.clone(value());
						array.removeAll();
						for(var index2 in elements) {
							element = elements[index2];
							array.push(element);
						}
					} else if(KoUtils.isObservableNode(viewModel[p])) {
						var node = viewModel[p];
						node(value);
					} else {
						value = ko.observable(value);
						viewModel[p] = value;
					}
				}
				return viewModel;
			},

			/** 从viewModel转换成js
			 *
			 * @param viewModel
			 * @param ignoreNodes 需要忽略的根节点
			 * @param notRoot 当前viewModel是否为根节点（内部使用）
			 *
			 */
			toJS: function toJS(viewModel, ignoreNodes, notRoot) {
				if(!viewModel || !ValueUtils.isTypeofObject(viewModel)) {
					throw 'Incorrect argument!';
				}

				var result = {};
				var resultValue = null;
				var value = null;
				var attr = null;

				if(_.isArray(viewModel)) {
					var array = [];
					for(var index in viewModel) {
						var element = viewModel[index];
						if(KoUtils.isObservableNode(element)) {
							element = element();
						}
						var converted = null;
						if(ValueUtils.isTypeofObject(element) || _.isArray(element)) {
							converted = {};
							converted = ViewModelUtils.toJS(element, null, true);
						} else {
							converted = element;
						}

						array.push(converted);
					}
					return array;
				}

				for(var p in viewModel) {
					if((!notRoot) && (_.isArray(ignoreNodes) ? (_.include(ignoreNodes, p)) : false)) {
						continue;
					}

					attr = viewModel[p];
					if(KoUtils.isObservableNode(attr)) {
						attr = attr();
					}

					value = null;
					if(_.isUndefined(attr) || null === attr) {
						value = null;
					} else if(ValueUtils.isTypeofObject(attr)) {
						value = ViewModelUtils.toJS(attr, null, true);
					} else {
						value = attr;
					}

					result[p] = value;
				}
				return result;
			},

			toModel: function toModel(model) {
				// 控件绑定只支持String，所以需要把model里面的Boolean和Number类型统一改成String类型
				for (var key in model) {
					var value = model[key];
					if (_.isBoolean(value) || _.isNumber(value)) {
						model[key] = value.toString();
					}
				}

				var res = ViewModelUtils.fromJS(model, null, [ViewModelUtils.EXTRA_ROOT]);

				// 附加节点
				if(this.operation) {
					res[ViewModelUtils.OPERATION_ROOT] = this.operation;
				} else {
					res[ViewModelUtils.OPERATION_ROOT] = {};
				}
				res[ViewModelUtils.OPERATION_ROOT].postCalls = [];
				res[ViewModelUtils.OPERATION_ROOT].callFunction = function(id, $root, functionName /* , VA_ARGS */) {
					var func = $root[ViewModelUtils.OPERATION_ROOT][functionName];
					var args = _.toArray(arguments).slice(3);
					var controllerMap = $root[ViewModelUtils.CONTROLLER_ROOT];

					return func.apply(controllerMap[id], args);
				};
				res[ViewModelUtils.BINDING_ROOT] = {};
				res[ViewModelUtils.CONTROLLER_ROOT] = {};
				if(model.hasOwnProperty(ViewModelUtils.EXTRA_ROOT)) {
					res[ViewModelUtils.EXTRA_ROOT] = model[ViewModelUtils.EXTRA_ROOT];
				}
				return res;
			}
		};

		ViewModelUtils.EXTRA_NODES = [ViewModelUtils.BINDING_ROOT, ViewModelUtils.CONTROLLER_ROOT,
			ViewModelUtils.OPERATION_ROOT, '__ko_mapping__', ViewModelUtils.EXTRA_ROOT];


		///////////////////////////////// UI Kit Framework //////////////////////////////////////////


		//////////////////////////////////////////=================================== NEW COMPONENTS

		var DEFAULT_WIDGET_CONTROLLER_CONFIG = {
			self: null,		// 指向自己
			manualId: false // 强制不产生任何多余的id
		};

		/** WidgetController 所有的空间基类
		 *
		 * 提供target搜寻，reset，config的merge等操作
		 *
		 * target定义：html节点中id属性值等于config.id；另有groupTarget等其他组合
		 */
		var WidgetController = (function (_super) {
			cKit.__extends(WidgetController, _super);
			function WidgetController(config) {
				_super.call(this);
				this.config = config;

				// parent 参数必须尽早设置，以后会用到
				if(config.parent) {
					this.setParent(config.parent);
				}

				// 用uid弥补id
				if(!config.manualId) {
					if(_.isString(config.uid)) {
						// 这里的节点需要从父节点的所有子节点种寻找，不可以直接全局查找，因为有可能有很多重名
						var target = $(DomUtils.getElementByAttribute(this.getParent().getTarget().get(0), 'uid', config.uid));
						if(target.length != 1) {
							throw ('Can not indentify the uid with [' + config.uid + ']!');
						}
						var generatedId = this.generateId();
						target.attr('id', generatedId);
						config.id = generatedId;
					}

					if(!config.id) {
						throw ('At least a widget needs an id config spec for identification!');
					}
					this.$target = $('#' + config.id);
					if(this.$target.length != 1) {
						throw ('Can not indentify the id with [' + (config.id || config.uid) + ']');
					}
				} else {
					this.updateTarget();
				}
			}

			WidgetController.prototype.getTarget = function () {
				return this.$target;
			};

			WidgetController.prototype.getConfig = function () {
				return this.config;
			};

			/** 根据父Controller树生成id
			 */
			WidgetController.prototype.generateId = function () {

				var parent = this.getParent();
				var result = this.config.uid;
				if(parent) {
					result = parent.getId() + '_' + result;
				}

				return result;
			};

			/** 获取id
			 */
			WidgetController.prototype.getId = function () {
				return this.config.id;
			};

			/** 禁用控件
			 *
			 */
			WidgetController.prototype.disable = function () {
				if(!this.$target) {
					throw ('BUG! We need a target!');
				}

				this.$target.addClass('disabled');
			};

			/** 使能控件,使控件可以使用
			 *
			 */
			WidgetController.prototype.enable = function () {
				if(!this.$target) {
					throw ('BUG! we need a target!');
				}
				this.$target.removeClass('disabled');
			};

			/** 更新操作目标
			 *
			 * 获取所有需要操作的目标，比如target只想当前的控件，
			 * groupTarget指向当前控件组件（外围，参考control-group）
			 */
			WidgetController.prototype.updateTarget = function() {
				this.$target = $('#' + this.config.id);
			};

			WidgetController.prototype.updateConfig = function(config) {
				var conf = ConfigUtils.mergeConfig(config, this.config);
				this.config = conf;
			};

			WidgetController.prototype.getViewModel = function() {
				var parent = this.getParent();
				if(this.parent) {
					return this.parent.getViewModel();
				}

				return this.viewModel;
			};

			WidgetController.prototype.getParent = function() {
				return this.parent;
			};

			WidgetController.prototype.setParent = function(p) {
				this.parent = p;
			};

			WidgetController.prototype.show = function() {
				if(this.$groupTarget && this.$groupTarget.length > 0) {
					this.$groupTarget.show();
				} else if(this.$target && this.$target.length > 0) {
					this.$target.show();
				}
			};

			WidgetController.prototype.hide = function() {
				if(this.$groupTarget && this.$groupTarget.length > 0) {
					this.$groupTarget.hide();
				} else if(this.$target && this.$target.length > 0) {
					this.$target.hide();
				}
			};

			return WidgetController;
		}) (cKit.CoreObject);

		var DEFAULT_DIALOG_CONTROLLER_CONFIG = {
			onShow: null, //必须是个function,在show()方法执行之前调用
			onHide: null  //必须是个function,在hide()方法之后调用
		};


		// 对话框类 继承WidgetController
		var Dialog = (function (_super) {
			cKit.ConfigManager.getNode('dialog').setValue('zIndexCounter', 2000)

			var DEFAULT_MODAL_CONFIG = {
				backdrop: 'static',
				keyboard: false,
				show: false
			};

			cKit.__extends(Dialog, _super);
			function Dialog(id, config) {
				var dialogSelf = this;
				config.id = id;
				config = ConfigUtils.mergeConfig(config, DEFAULT_DIALOG_CONTROLLER_CONFIG);
				_super.call(this, config);
				this.updateTarget();

				// callback
				$('#' + id).on('hide', function (event) {
					if(event.target !== this) {
						return;
					}
					dialogSelf.onHide();
				});

				$('#' + id).on('hidden', function (event) {
					if(event.target !== this) {
						return;
					}
					dialogSelf.onHidden();
				});

				$('#' + id).on('show', function (event) {
					if(event.target !== this) {
						return;
					}
					dialogSelf.onShow();
				});

				$('#' + id).on('shown', function (event) {
					if(event.target !== this) {
						return;
					}
					dialogSelf.onShown();
				});
			}

			Dialog.prototype.onHide = function() {
			};

			Dialog.prototype.onHidden = function() {
			};

			Dialog.prototype.onShow = function() {
			};

			Dialog.prototype.onShown = function() {
			};

			Dialog.prototype.show = function() {
				var config = this.config;
				if (_.isFunction(config.onShow)) {
					config.onShow.call(null);
				}else {
					if (config.onShow) {
						throw 'the property "onShow" in config must be a function';
					}
				}

				// WORKAROUND backdrop 被清错了
				this.$target.modal(_.clone(DEFAULT_MODAL_CONFIG));
				this.$target.modal('show');

				var scroll = this.$target.parent();
				var backdrop = scroll.next();
				this.scrollZIndex = scroll.css('zIndex');
				this.backdropZIndex = backdrop.css('zIndex');
				var zIndexCounter = cKit.ConfigManager.getNode('dialog').getValue('zIndexCounter');
				scroll.css({
					zIndex: ( zIndexCounter += 10 )
				});

				backdrop.css({
					zIndex: zIndexCounter - 5
				});
				cKit.ConfigManager.getNode('dialog').setValue('zIndexCounter', zIndexCounter);
			};

			Dialog.prototype.hide = function() {
				var config = this.config;

				// WORKAROUND backdrop 被清错了
				this.$target.modal('hide');
				this.$target.modal(_.clone(DEFAULT_MODAL_CONFIG));

				if (config.onHide && _.isFunction(config.onHide)) {
					config.onHide.call(null);
				}else {
					if (config.onHide) {
						throw 'the property "onHide" in config must be a function';
					}
				}

				if(this.scrollZIndex) {
					var scroll = this.$target.parent();
					var backdrop = scroll.next();
					scroll.css({
						zIndex: this.scrollZIndex
					});
					backdrop.css({
						zIndex: this.backdropZIndex
					});
					this.scrollZIndex = null;
					this.backdropZIndex = null;
				}
			};

			return Dialog;
		}) (WidgetController);


		/**
		 * 所有能setModel的全部是view,继承WidgetController
		 *
		 * 指定的data属性将会被传递给内部的model，但对data对象本身的改变并不会被体现在view上，因为传递过程为复制
		 *
		 * viewController 提供各种对viewModel的操作
		 */
		var DEFAULT_VIEW_CONTROLLER_CONFIG = {
			binder: 'value',	// knockout 的数据绑定规则value:2 checked:false等等
			bindings: []		// 对应的{key:'aa', value:'dddd'}对儿，对应data-bind语法
		};

		var ViewController = (function (_super) {
			cKit.__extends(ViewController, _super);
			function ViewController(config) {
				// 合并默认的View配置
				config = ConfigUtils.mergeConfig(config, DEFAULT_VIEW_CONTROLLER_CONFIG);
				_super.call(this, config);
			}

			/** 重置控件
			 *
			 */
			ViewController.prototype.reset = function reset() {

			};

			/** 与viewModel进行绑定
			 *
			 */
			ViewController.prototype.parseBindings =function parseBindings() {

			};

			/** 在ViewModel上创建相应的数据节点
			 *
			 * 一般数据节点定义由parent控件节点中的config.node值决定
			 * @param 当前Form的viewModels
			 */
			ViewController.prototype.createNode = function createNode() {
				var viewModel = this.getViewModel();
				var config = this.config;
				var isArray = false;

				if (config.type === cKit.DataType.ARRAY)  {
					isArray = true;
				}

				var bindNames = null;
				if(config.node) {
					if(_.isString(config.node) && config.node.indexOf('.') < 0) {
						bindNames = [config.node];
					} else if(_.isArray(config.node)) {
						bindNames = config.node;
					}
				}

				for(var index in bindNames) {
					var bindName = bindNames[index];
					if(_.isString(bindName)) {
						//在viewModel 中通过getNote()判断是否存在该节点，若不存在则创建节点
						var node = this.getNode(bindName);
						if(!node) {
							if(config.autoCreate === true) {
								var objectType = isArray ? 'ARRAY' : 'normal';
								log.d('FormController: WARNING! Source data is missing property field["' + bindName + '"], fill it with ' + objectType + ' object.');

								node = (isArray || _.isArray(config.defaults)) ? ko.observableArray([]) : ko.observable(config.defaults);
								this.setNode(bindName, node);
							}
						}
						node.controller = this;
					}
				}

			};

			/** 应用bindings
			 *
			 * @param 当前Form的viewModels
			 *
			 */
			ViewController.prototype.applyBindings = function applyBindings() {
				var viewModel = this.getViewModel();
				var config = this.config;
				var isArray = false;

				if (config.type === cKit.DataType.ARRAY) {
					isArray = true;
				}

				var createdFlag = true;
				var bindNames = null;
				if(config.node) {
					if(_.isString(config.node) && config.node.indexOf('.') < 0) {
						bindNames = [config.node];
					} else if(_.isArray(config.node)) {
						bindNames = config.node;
					}
				}

				for(var index in bindNames) {
					var bindName = bindNames[index];
					if(_.isString(bindName)) {
						var node = this.getNode(bindName);
						if(!node) {
							if(config.autoCreate !== true) {
								createdFlag = false;
							}
						}
					}
				}

				if(createdFlag) {
					this.parseBindings();
					if(_.isFunction(this.getNode)) {
						viewModel[ViewModelUtils.CONTROLLER_ROOT][config.id] = this;
					}

					UiUtils.applyBindingsForObject(this.$target, config, this.getBindings(), viewModel, UiUtils.BIND_FLAG_USE_BINDING_MAP, this);
				} else {
					log.d('Ignoring binding for id="' + config.id + '"');
				}

			};

			/** 获取当前控件的值
			 *
			 */
			ViewController.prototype.getValue = function getValue() {
				var viewModel = this.getViewModel();
				var binder = this.config.binder;

				var result = null;
				if(binder === 'value') {
					result = this.$target.val();
				} else if(binder === 'text') {
					result = this.$target.text();
				} else if(binder === 'html') {
					result = this.$target.html();
				} else {
					var config = this.config;
					if(config.node && _.isString(config.node)) {
						var node = this.getNodeValue.apply(this, arguments);
						return KoUtils.unwrapObservableTree(node);
					} else {
						// log.d('WidgetController.getValue(): Can not get value!');
						result = null;
					}
				}

				return result;
			};

			/** 获取当前数据节点
			 *
			 * 一般数据节点为Object或者某类observable
			 *
			 *  @param nodeName 节点名称(最后的属性名称,如viewModel.a.b.c时为"c")
			 *
			 */
			ViewController.prototype.getNode = function getNode(nodeName) {
				var viewModel = this.getViewModel();
				var argCount = arguments.length;
				if(argCount > 2) {
					throw 'Incorrect arguments!';
				}

				var config = this.config;
				var parent = this.getParent();
				nodeName = nodeName || config.options || config.node;

				if(!_.isString(nodeName)) {
					return viewModel;
				}

				if(parent) {
					viewModel = parent.getNode();
				}
				if(_.isUndefined(viewModel) || null === viewModel) {
					return null;
				}

				if(KoUtils.isObservableNode(viewModel)) {
					var vm = viewModel();
					if(vm) {
						return vm[nodeName];
					} else {
						return null;
					}
				}

				return viewModel[nodeName];
			};

			/** 获取数据节点的值
			 *
			 * @param nodeName 节点名称(最后的属性名称,如viewModel.a.b.c时为"c")
			 *
			 */
			ViewController.prototype.getNodeValue = function getNodeValue(nodeName) {
				var node = this.getNode.apply(this, arguments);
				return ko.utils.unwrapObservable(node);
			};

			/** 设置某个节点的值
			 *
			 * @param nodeName 节点名称(最后的属性名称,如viewModel.a.b.c时为"c")
			 * @param value 节点数据值
			 *
			 */
			ViewController.prototype.setNode = function setNode(nodeName, value) {
				var viewModel = this.getViewModel();
				var argCount = arguments.length;
				if(argCount < 1 || argCount > 5) {
					throw 'Incorrect arguments!';
				}

				var config = this.config;
				var parent = this.getParent();
				var vm = viewModel;

				if(parent !== null) {
					vm = parent.getNode();
				}
				if (KoUtils.isObservableNode(vm)) {
					vm = vm();
				}

				if(KoUtils.isObservableNode(value)) {
					vm[nodeName] = value;
				} else if(typeof value === Knockout.OBSERVABLE) {
					throw 'Assigning a invalid object to nodeName="' + nodeName + '"!';
				} else if(!KoUtils.isObservableNode(vm[nodeName])){
					throw 'nodeName="' + nodeName + '" is not a observable object!';
				} else {
					vm[nodeName](value);
				}
			};

			/** 获取节点全名
			 *
			 * 这个全名直接指向节点数据域,所以其中有可能带有求值表达式(函数访问,如viewModel.a().b)
			 *
			 * @param flags UiUtils.BIND_FLAG_EVALUABLE           是否为可估值的名称,如果是,则有可能在末尾添加求值表达式
			 *              UiUtils.BIND_FLAG_DURING_BINDING        此node是否在绑定的过程中。如果是，并且Controller有相应的获取节点全名函数，那么就调用相应的函数
			 */
			ViewController.prototype.getNodeName = function getNodeName(nodeName, flags) {
				if(!_.isNumber(flags)) {
					flags = 0;
				}

				if((flags & UiUtils.BIND_FLAG_DURING_BINDING) && this.getNodeNameDuringBind !== null) {
					return this.getNodeNameDuringBind(nodeName, flags);
				}
				var config = this.config;
				var parent = this.getParent();
				nodeName = nodeName || config.node;
				if(!_.isString(nodeName)) {
					return '$root';
				}

				var node = this.getNode(nodeName);
				var suffix = '';
				if((flags & UiUtils.BIND_FLAG_EVALUABLE) && KoUtils.isObservableNode(node)) {
					suffix = '()';
				}

				if(parent) {
					var name = parent.getNodeNameEvaluable(null, flags) + '.' + nodeName + suffix;
					return name;
				} else {
					return '$root' + '.' + nodeName + suffix;
				}
			};

			ViewController.prototype.getNodeNameDuringBind = null;

			/** 快捷访问方法
			 *
			 * @see getNodeName
			 */
			ViewController.prototype.getNodeNameEvaluable = function getNodeNameEvaluable(nodeName, flags) {
				return this.getNodeName(nodeName, UiUtils.BIND_FLAG_EVALUABLE | flags);
			};

			/** 添加一个绑定
			 *
			 * 如果key已经存在，则覆盖原来的绑定关系
			 *
			 * @param key 绑定key，如value
			 * @param value
			 */
			ViewController.prototype.addBinding = function(key, value) {
				var addFlag = false;
				var bindings = this.config.bindings;
				for(var i in bindings) {
					var binding = bindings[i];
					if(binding.key == key) {
						binding.value = value;
						addFlag = true;
					}
				}

				if(!addFlag) {
					bindings.push({
						key: key,
						value: value
					});
				}
			};

			ViewController.prototype.getBindings = function() {
				return this.config.bindings;
			};

			return ViewController;
		}) (WidgetController);

		/** 控件类型
		 *
		 */
		var FieldType = {
			INDEPENDENT_FIELD: 'independent_field',		// 独立的控件
			COMPOSED_FIELD: 'composed_field',			// 组合控件,一般为多个独立控件组
			GROUP_FIELD: 'group_field'					// 控件组
		};

		var DEFAULT_FIELD_CONTROLLER_CONFIG = {
			hint: '',
			fieldType: FieldType.INDEPENDENT_FIELD,
			defaults: null,
			autoCreate: true,					// 当节点不存在时，是否自动创建
			node: null,							// data 绑定的属性，可以为多级属性，如name.a.b.c，但必须以点作为分隔
			type: cKit.DataType.PREMITIVE,		// 绑定的数据类型,如果是Array则为ARRAY; Optional
			capacity: null,						// 在数组情况下描述允许的元素数量，如果不给出则不允许添加新元素；给出一个则需要恰好满足这个数量，给出2个则为一个区间（数组，前大后小）
			key: null,							// 如果数组模式下,每个元素为一个对象,则需要给出操作的属性名称,不可以用点分隔
			visible: null,						// 可见性控制函数
			readOnly: false,					// 是否为只读,只读则不可以更改内容
			exists: null,						// 是否存在
			bindingMap: {
				// 这里用来以key-value对的形式说明bind中的哪个绑定会应用到那个target节点上，比如，visible会被应用到groupTarget，
				// 但是如果groupTarget不存在,则会默认bind到target节点上
			},
			parent: null		// 父field节点
		};

		/** Form内部控件，实现验证输入数据，显示验证结果功能
		 *
		 */
		var FieldController = (function (_super) {
			cKit.__extends(FieldController, _super);
			function FieldController(config1) {
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_FIELD_CONTROLLER_CONFIG);
				_super.call(this, config);

				config = this.config;

				// 可以选择右侧显示错误，或者下方显示错误
				var $target = this.$target;
				var id = config.id;
				var hint = config.hint ? config.hint : '';
				var deleteAttributes = false,
					capacity,
					readOnly;
				// If the config.dataType is a Array, then we need do some extra work to keep it sure
				// it works with each item in the array object.
				if(config.hasOwnProperty('type') && (config.type === cKit.DataType.ARRAY))  {
					deleteAttributes = true;
					capacity = config.capacity;
					if(!config.key) {
						// throw 'missing key!';
						config.key = '$data';
					}

					// 这里主要负责capacity的控制，capacity因为可以接受一个数字或者两个数字的数组，所以需要分别处理
					if(_.isArray(capacity)) {
						if(capacity.length != 2 || !_.isNumber(capacity[0]) || !_.isNumber(capacity[1])) {
							throw ('config.capacity should be an array contains 2 numbers, or a single number instead!');
						}
						config.capacityMin = capacity[0];
						config.capacityMax = capacity[1];
					} else if(_.isNumber(config.capacity)) {
						config.capacityMin = capacity;
						config.capacityMax = capacity;
					} else if(_.isNull(config.capacity)) {
						config.capacityMin = 0;
						config.capacityMax = 9999;
					} else {
						throw ('config.capacity should be an array contains 2 numbers, or a single number instead!');
					}

				}

				readOnly = config.readOnly;

				if ($target) {
					// 本函数统一gid，uid和hid控件的id值
					// gid，uid，hid名称必须保持一致
					var target = $target;

					// hint空间和数据控件是兄弟关系
					target.siblings().each(function () {
						if ($(this).attr('hid') === config.uid) {
							$(this).attr('id', config.id + '_hint');

							// break
							return false;
						} else {
							// continue
							return true;
						}
					});

					// group控件和数据控件是父子关系
					var p = this.getParent().getTarget();
					while (target.length && target.length > 0) {
						if (target.attr('gid') === config.uid) {
							target.attr('id', config.id + '_group');
							break;
						} else if (target === p) {
							break;
						}

						target = $(target.get(0).parentElement);
					}
				}

				this.updateTarget();
				$target = this.$target && this.$target.length > 0 ? this.$target : null;
				if(readOnly && $target) {
					$target.attr('disabled','');
				}

				// 对于数组形式的数据来说，id和value会出现多次，这样不合理，全部清除
				if(deleteAttributes && $target) {
					$target.removeAttr('id');
					$target.removeAttr('value');
				}

				// Hint
				if(this.$hintTarget && this.$hintTarget.length > 1) {
					if(!cKit.ValueUtils.isEmpty(this.$hintTarget.text()) && cKit.ValueUtils.isEmpty(config.hint)) {
						this.config.hint = this.$hintTarget.text();
					}
					this.$hintTarget.text(this.config.hint);
				}

			}


			/** 查找当前field的Form
			 *
			 *
			 */
			FieldController.prototype.getContainerForm = function getContainerForm() {
				var form = this.getParent();
				do {
					if(form.config.isForm) {
						return form;
					}

					form = form.getParent();
					if(!form) {
						throw 'Can not find parent!';
					}
				} while(true);
			};

			/** 清理所有的id,因为groupTarget的Id最多存在一个，因此不需要清理
			 *
			 */
			FieldController.prototype.clearTargetIds = function clearTargetIds() {
				this.$target.removeAttr('id');
				//	this.$groupTarget.removeAttr('id');
				this.$hintTarget.removeAttr('id');
			};

			// @Override
			FieldController.prototype.updateTarget = function() {
				var config = this.config;

				var result = this.findTarget(-1);
				this.$target = result.target;				// Input 或者button 等这个Field中的核心组件
				this.$groupTarget = result.groupTarget;		// Group 组件, 包裹整个Field, 用来设置错误或者成功外观
				this.$hintTarget = result.hintTarget;		// Hint 组件, 显示提示信息

				this.$target.attr('name', result.target.attr('id'));
				this.$groupTarget.attr('name', result.groupTarget.attr('id'));
				this.$hintTarget.attr('name', result.hintTarget.attr('id'));

				// 这里定义了一些bindings需要绑定到那个target上
				// 如果目标target不存在，则绑定到target上
				config.bindingMap.visible = this.$groupTarget;
				config.bindingMap.exists = this.$groupTarget;
			};

			// private
			// 当index < 0时将会采用id进行搜寻
			FieldController.prototype.findTarget = function(index) {
				var config = this.config;

				var target = $('#' + config.id);
				var groupTarget = $('#' + config.id + '_group');
				var hintTarget = $('#' + config.id +  '_hint');

				if(index < 0) {

				} else {
					target = $(document.getElementsByName(config.id)[index]);
					groupTarget = $(document.getElementsByName(config.id + '_group')[index]);
					hintTarget = $(document.getElementsByName(config.id +  '_hint')[index]);
				}

				return {
					target: target,				// 指向controls Div里面的第一个元素（一般情况下可以为input或者按钮）
					hintTarget: hintTarget,		// 显示hint的
					groupTarget: groupTarget	// controlGroup Div
				};
			};

			/** 执行验证
			 *
			 * @return boolean 验证是否通过
			 */
			FieldController.prototype.validate = function validate(model) {
				var config = this.config;
				var items = this.getValidateData();
				var result = true;
				for(var i in items) {
					var data = items[i];
					result = this.validateData(data, model);
					if(result === false) {
						break;
					}
				}
				return result;

			};

			/** 返回需要验证的数据
			 *
			 * @return 一个包含所有要验证数据的数组
			 *
			 */
			FieldController.prototype.getValidateData = function getValidateData() {
				var config = this.config;

				var bindData = null;
				if(_.isArray(config.node)) {
					bindData = config.node;
				} else if(_.isString(config.node)) {
					bindData = [config.node];
				} else {
					// null or undefined
					return true;
				}

				var result = [];
				var viewModel = this.getViewModel();
				for(var i in bindData) {
					var d = bindData[i];
					result.push(this.getNodeValue(d));
				}

				return result;
			};

			FieldController.prototype.validateData = function validateData(data, model) {
				var validatorResult = null;
				if(this.config.validators) {
					validatorResult = this.getValidatorResult(data, model);
				} else {
					validatorResult = {
						result: true
					};
				}

				this.presentValidatorResult(validatorResult);

				return validatorResult.result;
			};

			/** 只执行验证过程，并返回验证结果
			 *
			 */
			FieldController.prototype.getValidatorResult = function getValidatorResult(data, model) {
				var config = this.config,
					text = data,
					i,
					validators = this.config.validators,
					COUNT = validators.length,
					validator,
					res;

				// 如果有ALLOW_EMPTY验证器，并且text字段为空则返回验证通过
				for (i = 0; i < COUNT; ++i) {
					validator = validators[i];
					if (Validator.ALLOW_EMPTY === validator) {
						if (cKit.ValueUtils.isEmpty(text)) {
							return {
								result: true
							};
						}
					}
				}

				// 检查验证器chain
				for (i = 0; i < COUNT; ++i) {
					validator = validators[i];
					res = validator.call(this, text, model);

					if(res === false) {
						return {
							result: false,
							message: validator.message
						};
					}
				}

				return {
					result: true
				};
			};

			/** 展示验证结果
			 *
			 * 一般情况下，验证通过为绿色；不通过为红色，并且hint位置显示错误信息
			 *
			 */
			FieldController.prototype.presentValidatorResult = function presentValidatorResult(validatorResult) {
				// 根据结果显示hint或者错误message
				this.updateTarget();
				var groupTarget = this.$groupTarget;
				var hintTarget = this.$hintTarget;
				if(validatorResult.result) {
					if(groupTarget) {
						groupTarget.removeClass('error');
						groupTarget.addClass('success');
					}

					if(hintTarget) {
						hintTarget.text(this.config.hint);
					}
				} else {
					if(groupTarget) {
						groupTarget.addClass('error');
						groupTarget.removeClass('success');
					}

					if(hintTarget) {
						hintTarget.text(validatorResult.message);
					}
				}
			};

			/** 对数组类型的数据模型进行验证（有增删按钮的数据）
			 *
			 */
			FieldController.prototype.validateArray = function validateArray(dataArray, model) {
				if(arguments.length < 1 || !_.isArray(dataArray)) {
					throw ('First param should be a Array object which contains data array to validate!');
				}

				var COUNT = dataArray.length,
					i = 0,
					result = true,
					target,
					data,
					groupTarget,
					hintTarget,
					validatorResult,
					validatorResults = [];

				// 首先对数组中每个元素都进行验证
				// 如果有一个验证结果为false，那么所有的验证结果都重置为false，用来统一所有groupTarget的颜色显示
				for (; i < COUNT; ++i) {
					data = dataArray[i];

					validatorResult = this.getValidatorResult(data, model);
					if(!validatorResult.result) {
						result = false;
					}
					validatorResults.push(validatorResult);
				}

				for (i = 0; i < COUNT; ++i) {
					target = this.findTarget(i);
					target.config = this.config;

					validatorResults[i].result = result;
					this.presentValidatorResult(validatorResults[i]);
				}
				return result;
			};

			/** 重置验证结果
			 *
			 * @Override
			 */
			FieldController.prototype.reset = function reset() {
				var viewModel = this.getViewModel();
				if (this.config) {
					this.updateTarget();
				}

				var groupTarget = this.$groupTarget;
				var hintTarget = this.$hintTarget;

				if(groupTarget) {
					groupTarget.removeClass('error');
					groupTarget.removeClass('success');
				}

				if(hintTarget) {
					hintTarget.text(this.config.hint);
				}
			};

			/**
			 *   parseBindings()只是将需要绑定的数据以key-value形式存入bindings数组当中。
			 *	 真正的绑定操作由UiUitils的applyBindingsForObject完成
			 */
			FieldController.prototype.parseBindings =function parseBindings() {
				var viewModel = this.getViewModel();
				var config = this.config,
					target = this.$target;
				//bind data
				var id = config.id,
					bindConfig,
					bindTemp;

				bindConfig = {
					data: null,
					visible: null
				};

				// 在bind过程中，有可能key起作用，或者直接value起作用
				if(config.node) {
					if(config.hasOwnProperty('type') && (config.type === cKit.DataType.ARRAY))  {
						bindConfig.node = config.key;
					} else {
						bindConfig.node = this.getNodeName(config.node, UiUtils.BIND_FLAG_DURING_BINDING);
					}
				}

				if(!_.isEmpty(bindConfig)) {
					if(bindConfig.node && config.binder) {
						// 因为有的数据使用value，有的使用checked，所以这里使用这个变量来bind数据
						this.addBinding(config.binder, bindConfig.node);
					}

					// 提交式表单需要name字段用来生成提交对应的数据
					// FIXME 生成name 的操作可不要
					if(!this.getParent()) {
						target.attr('name', bindConfig.node);
					}
				}

				// exists 判断
				if(config.exists) {
					var bindContent = config.exists;
					if(viewModel && _.isFunction(config.exists)) {
						viewModel[ViewModelUtils.OPERATION_ROOT][config.id + '_exists'] = config.exists;
						var prefix = '';
						var suffix = '';
						var param = '$data, $root';
						// 生成跳转
						bindContent = prefix + '$root["' + ViewModelUtils.OPERATION_ROOT + '"].' + config.id + '_exists.call($element, ' + param + ')' + suffix;
					}

					var target = config.bindingMap.exists;
					if(!target || target.length < 1) {
						target = this.$target;
					}

					target.before('<!-- ko if: ' + bindContent + ' -->');
					target.after('<!-- /ko -->');
				}

				var genernalBindings = ['click', 'enable', 'keyup', 'visible', 'keypress', 'keydown', 'valueUpdate'];
				for(var i in genernalBindings) {
					var b = genernalBindings[i];
					if(!_.isNull(config[b]) && !_.isUndefined(config[b])) {
						this.addBinding(b, config[b]);
					}
				}
			};

			FieldController.prototype.setValue = function(value, flag) {
				var flag = flag || 0;
				var config = this.config;

				var model = value;
				if(flag & FormController.FLAG_MERGE) {
					var originalValue = this.getValue();
					var model = ConfigUtils.mergeConfig(model, originalValue);
				}

				if(config.hasOwnProperty('node') && _.isString(config.node)) {
					this.setNode(config.node, model);
				}
			};

			return FieldController;
		}) (ViewController);


		/**
		 *  Image
		 */
		var DEFAULT_IMAGE_CONTROLLER_CONFIG = {
			binder: 'src'
		};

		var ImageController = (function (_super) {
			cKit.__extends(ImageController, _super);

			function ImageController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, {}, DEFAULT_IMAGE_CONTROLLER_CONFIG);
				_super.call(this, config);

				this.updateTarget();
			}

			return ImageController;
		}) (FieldController);

		/**
		 *   Button
		 */
		var DEFAULT_BUTTON_CONTROLLER_CONFIG = {
			binder: 'html',
			click: null
		};

		var ButtonController = (function (_super) {
			cKit.__extends(ButtonController, _super);
			function ButtonController(config1, config2) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, config2, DEFAULT_BUTTON_CONTROLLER_CONFIG);
				_super.call(this, config);

				this.updateTarget();
			};

			return ButtonController;

		}) (FieldController);

		/**
		 *  NodeController 主要是控制一个HTML种的TAG（比如div ）下的子元素是否显示及存在等问题
		 * 与FieldGroupController主要不同在于，FieldGroupController会强调父子关系（比如某个根节点的子Controller节点们），但是
		 * NodeController只会专注于当前的HTML的TAG及其子TAG节点，两种节点类型不同。
		 */

		var DEFAULT_NODE_CONTROLLER_CONFIG = {
			binder: null
		};

		var NodeController = (function (_super) {
			cKit.__extends(NodeController, _super);
			function NodeController(config1, config2) {

				var config = ConfigUtils.mergeConfig(config1, config2, DEFAULT_NODE_CONTROLLER_CONFIG);
				_super.call(this, config);

				this.updateTarget();
			}

			return NodeController;
		}) (FieldController);

		/**
		 *   Label
		 */

		var DEFAULT_LABEL_CONTROLLER_CONFIG = {
			binder: 'html'
		};

		var LabelController = (function (_super) {
			cKit.__extends(LabelController, _super);
			function LabelController(config1, config2) {

				var config = ConfigUtils.mergeConfig(config1, config2, DEFAULT_LABEL_CONTROLLER_CONFIG);
				_super.call(this, config);

				this.updateTarget();
			}

			LabelController.prototype.parseBindings =function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var config = this.config;
				var id = config.id;

				//bind data
				if (config.change) {
					this.addBinding(Binding.CHANGE, config.change);
				}
			}


			return LabelController;
		}) (FieldController);

		var DEFAULT_TABLE_HEAD_CONTROLLER_CONFIG = {
			binder: 'html'
		};

		var TableHeadController = (function (_super) {
			cKit.__extends(TableHeadController, _super);
			function TableHeadController(config1, config2) {

				var config = ConfigUtils.mergeConfig(config1, config2, DEFAULT_TABLE_HEAD_CONTROLLER_CONFIG);
				_super.call(this, config);

				this.updateTarget();

				if(this.$target.get(0).tagName.toLowerCase() !== 'th') {
					throw 'You have to use me with a <th> tag!';
				}
			}

			TableHeadController.prototype.parseBindings =function() {
				var viewModel = this.getViewModel();
				_super.prototype.parseBindings.call(this);

				var config = this.config;
				// exists 判断
				if(config.exists) {
					var currentTh = this.$target.get(0);
					// 先看看自己是第几个th
					var thIndex = this.$target.get(0).cellIndex;
					// 找table
					var foundFlag = false;
					var table = this.$target;
					do {
						var e = table.get(0);
						if(e.tagName.toLowerCase() === 'table') {
							foundFlag = true;
							break;
						} else if(e === document) {
							break;
						}
						table = table.parent();
					} while(true);

					if(!foundFlag) {
						throw 'Can not find <table> tag!';
					}

					foundFlag = false;
					try {
						// 找th对应的td
						var tdTarget = table.children('tbody').children('tr:eq(0)').children('td:eq(' + thIndex + ')');
						if(tdTarget.length > 0) {
							foundFlag = true;
						}
					} catch (e) {}

					if(!foundFlag) {
						throw 'Can not find <td>s for the first <tr> in current table!';
					}

					var bindContent = config.exists;
					if(viewModel && _.isFunction(config.exists)) {
						viewModel[ViewModelUtils.OPERATION_ROOT][config.id + '_td_exists'] = config.exists;
						var prefix = '';
						var suffix = '';
						var param = '$data, $root';
						// 生成跳转
						bindContent = prefix + '$root["' + ViewModelUtils.OPERATION_ROOT + '"].' + config.id + '_exists.call($element, ' + param + ')' + suffix;
					}

					tdTarget.before('<!-- ko if: ' + bindContent + ' -->');
					tdTarget.after('<!-- /ko -->');
				}
			};

			return TableHeadController;
		}) (LabelController);



		/** 所有可在Form当中出现的控件的基类
		 *
		 * 支持Group操作
		 *
		 */
		var DEFAULT_INPUT_CONTROLLER_CONFIG = {
			value: '',							// 默认内容
			validators: [Validator.NULL],		// 验证器列表
			binder: 'value'
		};


		var InputController = (function (_super) {
			cKit.__extends(InputController, _super);
			function InputController(config1, config2) {
				var self = this,
					config,
					bindTemp;

				config = ConfigUtils.mergeConfig.apply(this, _.union(_.last(arguments, arguments.length), [DEFAULT_INPUT_CONTROLLER_CONFIG]));
				_super.call(this, config);
				config = this.config;

				// 检查验证器
				if(!_.isArray(this.config.validators)) {
					throw ('config.validators should be an Array object, which contains a validator chain!');
				}

				// 检查 InputController 的 change 事件前置条件
				if(config.change && !_.isFunction(config.change)) {
					throw '"Config.change should be an function!"';
				}
			}

			InputController.prototype.parseBindings =function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var config = this.config;
				var id = config.id;

				//bind data
				if (config.change) {
					this.addBinding(Binding.CHANGE, config.change);
				}
			}

			return InputController;
		}) (FieldController);



		/**
		 *  自动完成输入框
		 */
		var DEFAULT_AUTO_COMPLETE_CONTROLLER_CONFIG = {
			binder: null,
			select: null,		// 函数，当一个选项被用户点击时触发，参数为(data, viewModel)
			options: null,			// function(keyword, callback) 如果是异步方式，需要毁掉callback(data)，否则直接返回数组
			formatter: null,
			root: null,				// 每个item中用来代表值得属性名称
			filter: null			// function 过滤器
		};

		var AutoCompleteController = (function (_super) {
			cKit.__extends(AutoCompleteController, _super);
			function AutoCompleteController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_AUTO_COMPLETE_CONTROLLER_CONFIG);
				_super.call(this, config);
				var config = this.config;

				var options = config.options;
				if(!_.isArray(options) && !_.isFunction(options)) {
					throw '"Config.options" should be an array or a function returns an array!';
				}

				if(config.formatter && !_.isFunction(config.formatter)) {
					throw '"Config.formatter" should be a function!';
				}

				if(config.data && !_.isString(config.data)) {
					throw '"Config.data" should be a string!';
				}

				if(config.filter && !_.isFunction(config.filter)) {
					throw '"Config.filter" should be a filter function(item, keyword)!';
				}

				if(config.select && !_.isFunction(config.select)) {
					throw '"Config.select should be an function!"';
				}
			}

			AutoCompleteController.prototype.reset = function reset() {
				_super.prototype.reset.call(this);
				var config = this.config;

				var nodeValue = this.getNodeValue(this.config.node);
				if(nodeValue) {
					for(var index in config.options) {
						var option = config.options[index];
						var value = config.root ? option[config.root] : option;
						if(value === nodeValue) {
							var attr = this.autoCompleteConfig.setValue(option);
							this.$target.val(attr['data-value']);
							this.$target.attr('real-value', attr['real-value']);
							break;
						}
					}
				} else {
					this.$target.val('');
					this.$target.removeAttr('real-value');
				}
			};

			AutoCompleteController.prototype.parseBindings =function parseBindings() {
				_super.prototype.parseBindings.call(this);

				var config = this.config;
				var id = config.id;
				var self = this;


				var formatItem = function(item) {
					if(config.formatter) {
						return config.formatter(item);
					} else {
						return item;
					}
				};

				/* 这里主要的方式是监视auto complete输入框的改变来对viewModel中的节点进行值更改
				 * 
				 */
				this.autoCompleteConfig = {
					source: function(keyword, callback) {
						// 数据有可能为三种情况,一种为纯数据,一种为function返回纯数据,最后为function是个异步回调
						// 头两种直接返回数据，第三种需要内部回调callback(data)
						var data = null;
						if(_.isFunction(config.options)) {
							data = config.options(keyword, callback);
						} else {
							data = _.filter(config.options, function(item) {
								if(config.root && config.filter) {
									return config.filter(item, keyword);
								}
								return String.prototype.contains.call(item.toString(), keyword, true);
							});
						}

						if(!data || data.length < 1) {
							self.setNode(config.node, null);
						}

						if(data) {
							return data;
						} else {
							return null;
						}
					},
					formatItem: formatItem,
					setValue:function(item){
						var value = config.root ? item[config.root] : item;

						return {
							'data-value':formatItem(item),
							'real-value':value
						};
					},
					listener: function(value) {
						var latestValue = self.getNodeValue(config.node);
						if (value != latestValue && config.change) {
							config.change.call(self,value);
						}
						self.setNode(config.node, value);
						if(config.select) {
							config.select.call(self, value);
						};
					}
				};
				$('#' + id).autocomplete(this.autoCompleteConfig);

				this.reset();
			};

			return AutoCompleteController;
		}) (FieldController);


		/**
		 *  数量编辑器
		 */
		var DEFAULT_QUANTITY_EDIT_CONTROLLER_CONFIG = {
			onChange: null,
			capacity: [0, 3]
		};

		var QuantityEditController = (function (_super) {
			cKit.__extends(QuantityEditController, _super);
			function QuantityEditController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_QUANTITY_EDIT_CONTROLLER_CONFIG);
				_super.call(this, config);
				config = this.config;

				if(config.change && !_.isFunction(config.change)) {
					throw '"Config.change" should be a callback function(data)!';
				}
				if(config.capacity && (!_.isArray(config.capacity) || config.capacity[0] > config.capacity[1] )) {
					throw '"Config.capacity" should be an array with 2 numbers!';
				}
			}

			QuantityEditController.prototype.parseBindings =function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var viewModel = this.getViewModel();
				var config = this.config;
				var id = config.id;
				var self = this;

				var inputTarget = $('#' + id);
				var groupTarget = UiUtils.findControlsTag(inputTarget, id);
				var plusTarget = groupTarget.find("[uid='plus']");
				var minusTarget = groupTarget.find("[uid='minus']");
				if (plusTarget.size() && minusTarget.size()) {
				} else {
					throw 'not found plus or minus button for filter edit controller id=' + id;
				}

				inputTarget.attr('name', 'input');
				plusTarget.attr('name', 'plus');
				minusTarget.attr('name', 'minus');

				var MIN = config.capacity[0];
				var MAX = config.capacity[1];

				/** 根据quantity数量更新button状态
				 *
				 * 参数中plus和minus只有一个就行了
				 *
				 * @param plus 加号按钮的jQuery对象
				 * @param minus 减号对应的jQuery对象
				 *
				 */
				var updateButtonState = function(data, plus, minus) {
					var element = this;
					var quantity = null;
					if(data) {
						quantity = data[config.node]();
					} else {
						quantity = self.getNodeValue(config.node);
					}

					if(!plus) {
						plus = cKit.JDomUtils.getSibling(minus, 'plus');
						plus = $(plus);
					}
					if(!minus) {
						minus = cKit.JDomUtils.getSibling(plus, 'minus');
						minus = $(minus);
					}
					//var quantity = self.getNodeValue(config.node);
					try {
						quantity = parseInt(quantity, 10);
					} catch(ex) {
						quantity = MIN;
					}

					if(quantity > MAX) {
						if(data) {
							data[config.node](MAX);
						} else {
							self.setNode(config.node, MAX);
						}
						quantity = MAX;
					}
					if(quantity < MIN) {
						if(data) {
							data[config.node](MIN);
						} else {
							self.setNode(config.node, MIN);
						}
						quantity = MIN;
					}

				};

				// 余下的就是一些加减的操作
				var plusConfig = _.clone(config);
				plusConfig.id = plusConfig.id + '_plus';
				UiUtils.applyBindingsForObject(plusTarget, plusConfig, [{
					key: Binding.CLICK,
					value: function(data, viewModel) {
						var quantity = data[config.node]();
						try {
							quantity = parseInt(quantity, 10);
						} catch(ex) {
							quantity = MIN;
						}
						quantity = quantity >= 0 ? (quantity + 1) : (MIN + 1);
						quantity = quantity >= MAX ? MAX : quantity;
						data[config.node](quantity);

						updateButtonState.call(this, data, $(this));
					}
				}], viewModel);

				var minusConfig = _.clone(config);
				minusConfig.id = minusConfig.id + '_minus';
				UiUtils.applyBindingsForObject(minusTarget, minusConfig, [{
					key: Binding.CLICK,
					value: function(data, viewModel) {
						var quantity = data[config.node]();
						try {
							quantity = parseInt(quantity, 10);
						} catch(ex) {
							quantity = MIN;
						}
						quantity = quantity > 0 ? (quantity - 1) : 0;
						quantity = quantity <= MIN ? MIN : quantity;
						data[config.node](quantity);

						updateButtonState.call(this, data, null, $(this));
					}
				}], viewModel);

				if (config.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(config.node);
						config.change.call(self, value, viewModel);
					});
				}

				this.addBinding(config.binder, this.getNodeName(null, UiUtils.BIND_FLAG_DURING_BINDING));


			};

			return QuantityEditController;
		}) (FieldController);



		var DEFAULT_FILTER_EDIT_CONTROLLER_CONFIG = {
			binder: null,
			select: null,		// function, 当某个选项被选中时调用
			options: null,			// function(keyword, callback) 如果是异步方式，需要毁掉callback(data)，否则直接返回数组
			formatter: null,
			minKeywordsLength: 1,
			root: null,				// 每个item中用来代表值得属性名称
			filter: null			// function 过滤器，返回true代表保留 filter(item, keyword)
		};


		//FIXME 不能正常work
		//TODO 增加change配置
		var FilterEditController = (function (_super) {
			cKit.__extends(FilterEditController, _super);
			function FilterEditController(config1) {
				var self = this;
				_super.call(this, config1, {}, DEFAULT_FILTER_EDIT_CONTROLLER_CONFIG);
				var config = this.config;

				var options = config.options;
				if(!_.isArray(options) && !_.isFunction(options)) {
					throw '"Config.options" should be an array or a function returns an array!';
				}

				if(config.formatter && !_.isFunction(config.formatter)) {
					throw '"Config.formatter" should be a function!';
				}

				if(config.data && !_.isString(config.data)) {
					throw '"Config.data" should be a string!';
				}

				if(config.filter && !_.isFunction(config.filter)) {
					throw '"Config.filter" should be a filter function(item, keyword)!';
				}

				if(config.select && !_.isFunction(config.select)) {
					throw '"Config.select should be an function!"';
				}

				if(config.change && !_.isFunction(config.change)) {
					throw '"Config.change should be an function!"';
				}
			}

			function updateItems(items, viewModel, config) {
				// 同时更新值与显示
				var id = config.id;
				var displayNode = viewModel[ViewModelUtils.BINDING_ROOT]['display_' + id + '_values'];
				var valueNode = viewModel[ViewModelUtils.BINDING_ROOT][id + '_values'];
				config.items = items;
				displayNode.removeAll();
				valueNode.removeAll();
				for(var index in items) {
					var value = items[index];
					if(config.formatter) {
						value = config.formatter(value);
					}
					displayNode.push(value);

					value = items[index];
					if(config.root) {
						value = value[config.root];
					}
					valueNode.push(value);
				}
				if(items.length < 1) {
					viewModel[ViewModelUtils.OPERATION_ROOT][id + '_click'](-1, null);
				}

			}

			FilterEditController.prototype.parseBindings =function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var config = this.config;
				var id = config.id;
				var self = this;
				var viewModel = this.getViewModel();

				var formatItem = function(item) {
					if(config.formatter) {
						return config.formatter(item);
					} else {
						return item;
					}
				};

				// 一个只负责显示,一个只负责存放值
				viewModel[ViewModelUtils.BINDING_ROOT]['display_' + id + '_values'] = ko.observableArray([]);
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_values'] = ko.observableArray([]);

				// target只绑定事件,不绑定任何值更改
				this.addBinding(Binding.KEY_UP, 'function() { return $root["' + ViewModelUtils.OPERATION_ROOT + '"].keyup_' + id + '($element); }');

				/** 为按钮组绑定数据，只在按钮组有按钮时可见
				 *
				 */
				var target = $('#' + id);
				var groupTarget = UiUtils.findControlsTag(target, id, 'control-group');
				var resultTarget = groupTarget.find("[uid='result']");
				if (resultTarget.size()) {
					resultTarget.before('<!-- ko foreach: $root["' + ViewModelUtils.BINDING_ROOT + '"].display_' + id + '_values -->' );
					resultTarget.after('<!-- /ko -->');
				} else {
					throw 'not found result button for filter edit controller id=' + id;
				}
				/** 为按钮绑定事件
				 *
				 */
				target = resultTarget;
				target.removeAttr('id');
				UiUtils.applyBindingsForObject(target, config, [{
					key: Binding.CLICK,
					value: 'function() { return $root["' + ViewModelUtils.OPERATION_ROOT + '"].' + id + '_click($index(), $element); }'
				}, {
					key: Binding.VALUE,
					value: '$data'
				}], viewModel);

				viewModel[ViewModelUtils.OPERATION_ROOT][id + '_click'] = function(index, element) {
					var data = null;
					if(self.lastElement !== element) {
						if(self.lastElement) {
							$(self.lastElement).removeClass('active btn-primary');
						}
						$(element).addClass('active btn-primary');

					}
					if(index >= 0) {
						data = viewModel[ ViewModelUtils.BINDING_ROOT ][id + '_values'].slice(index, index + 1)[0];
						self.lastElement = element;
					}

					self.setNode(config.node, data);
					if(index >= 0) {
						var item = config.items[index];
						if(config.select) {
							var value = config.root ? item[config.root] : item;
							config.select.call(self, value, viewModel);
						}
					}
					return true;
				};

				viewModel[ViewModelUtils.OPERATION_ROOT]['keyup_' + id] = function(element) {
					var keyword = element.value;
					var items = [];
					var minKeywordsLength = DEFAULT_FILTER_EDIT_CONTROLLER_CONFIG.minKeywordsLength;
					if(self.config.minKeywordsLength != undefined) {
						minKeywordsLength = self.config.minKeywordsLength;
					}
					if(keyword.length >= minKeywordsLength) {
						if(_.isFunction(config.options)) {
							items = config.options(keyword, function(items) {
								updateItems(items, viewModel, config);
							});
						} else {
							items = _.filter(config.options, function(item) {
								if(config.root && config.filter) {
									return config.filter.call(self, item, keyword);
								}
								return String.prototype.contains.call(item.toString(), keyword, true);
							});
						}
					}

					if(items) {
						updateItems(items, viewModel, config);
					}
					return true;
				};

				if (config.change) {
					this.addBinding(Binding.CHANGE, function(arg1, arg2){
						var value = self.getNodeValue(config.node);
						config.change.call(self, value, viewModel);
					});
				};

				this.reset(true);
			};

			/** 更新按钮组的数据
			 *
			 */

			FilterEditController.prototype.reset = function reset(delay) {
				_super.prototype.reset.call(this);
				var config = this.config;
				var property = config.root;
				var viewModel = this.getViewModel();

				var nodeValue = this.getNodeValue(config.node);
				if(nodeValue) {
					for(var index in config.options) {
						var option = config.options[index];
						var optionValue = property ? option[property] : option;
						if(optionValue === nodeValue) {
							//this.$target.val(optionValue);
							updateItems([option], viewModel, config);

							var postCall = function() {
								var item = $('#' + config.id + '_results input:first');
								if(item && item.length === 1) {
									item.click();
								}
							};

							if(delay) {
								ViewModelUtils.addPostCall(viewModel, postCall);
							} else {
								postCall();
							}
							break;
						}
					}
				}  else {
					this.$target.val('');
					updateItems([], viewModel, config);
				}
			};

			//TODO 使所有控件（目前有chooserController）的setOptions方法保持参数一致
			FilterEditController.prototype.setOptions = function setOptions(newOptions){
				var viewModel = this.getViewModel();
				if (!_.isArray(newOptions)) {
					throw 'the param must be an Array!';
				}

				var config = this.config;

				updateItems(newOptions, viewModel, config);
				config.options = newOptions;

			};

			//FIXME 对外提供只更新items,但是更新options的接口
			FilterEditController.prototype.updateItems = function (newOptions, viewModel, config){
				if(!config) {
					config = this.config;
				}
				updateItems(newOptions, viewModel, config);
			};

			return FilterEditController;
		}) (InputController);

		/**
		 * Table控件
		 *
		 *  页面需指定table的id: ID 和 tbody 的id：ID_Body
		 *  列的内容分为 纯文本和操作控件，binding值的配置全用String类型（包括函数的配置）
		 *  文本暂时只支持 text,style绑定；操作控件暂时只支持visible,click绑定
		 */

		var DEFAULT_TABLE_CONTROLLER_CONFIG = {
			fields: [],
			headers: [],	// 表头控制器
			binder: null,
			defaults: []
		};

		var TableController = (function (_super) {
			cKit.__extends(TableController, _super);
			function TableController (config1,config2) {
				var self = this,
					config,
					id;
				config = ConfigUtils.mergeConfig.apply(this, _.union(_.last(arguments, arguments.length), [DEFAULT_TABLE_CONTROLLER_CONFIG]));
				_super.call(this, config);
				config = this.config;
				id = config.id;

				if (!_.isArray(config.fields) || config.fields.length < 1) {
					throw ('the param "config.fields" should be an Array!');
				}

				if (!_.isArray(config.headers)) {
					throw ('the param "config.headers" should be an Array!');
				}

				if(!config.node) {
					throw 'Missing "config.node" field!';
				}

			}

			TableController.prototype.parseBindings =function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var self = this;
				var config = this.config;
				var id = config.id;

				var target = $('#' + id + ' tbody');
				if(target.length < 0) {
					throw 'No embedded <tbody> found for config.id="' + config.id + '"';
				}
				var modelBinder = this.getNodeName(config.node);
				UiUtils.applyBindingsForObject(target, config, [{
					key: Binding.FOREACH,
					value: modelBinder
				}], viewModel, UiUtils.BIND_FLAG_INSIDE_FOREACH);

				for(var index in config.fields) {
					var fieldConfig = config.fields[index];
					config.fields[index] = ConfigUtils.mergeConfig(fieldConfig, {
						type: Controller.LABEL_CONTROLLER,
						parent: this
					});
				}

				for(var index in config.headers) {
					var fieldConfig = config.headers[index];
					fieldConfig = ConfigUtils.mergeConfig(fieldConfig, {
						type: Controller.TABLE_HEAD_CONTROLLER,
						parent: this
					});
					if(_.isEqual(fieldConfig.type, Controller.TABLE_HEADER_CONTROLLER)) {
						throw '"Config.headers" should only contain TABLE_HEADER_CONTROLLER(s)!';
					}
					// 添加到fields里面一起处理
					config.fields.push(fieldConfig);
				}



				UiUtils.bindControllers.call(this, config, viewModel);
			};

			TableController.prototype.getNodeNameDuringBind = function getNodeNameDuringBind(nodeName, flags) {
				return '$data';
			};

			return TableController;
		}) (FieldController);


		/**
		 *  Chooser  radio,checkbox,select的父类
		 *
		 *  支持group操作
		 */

		var DEFAULT_CHOOSER_GRUP_CONTROLLER_CONFIG = {
			binder: 'checked',
			isChooserGroup: false		//控件是否为group，是的话则需要生成相应的options
		};

		var ChooserGroupController = (function (_super) {
			cKit.__extends(ChooserGroupController, _super);
			function ChooserGroupController (config1, config2) {
				var self = this,
					config,
					id,
					insertPos,
					options;
				config = ConfigUtils.mergeConfig.apply(this, _.union(_.last(arguments, arguments.length), [DEFAULT_CHOOSER_GRUP_CONTROLLER_CONFIG]));
				_super.call(this, config);
				config = this.config;
				id = config.id;

				if (!config.isChooserGroup) {//只有单个控件的情况
					insertPos = $('#' + id );
					insertPos.attr('value', config.value);
					if (config.hasOwnProperty('node')) {
						insertPos.attr('checked', config.node);
					}
				}else {		//控件组成一个group的情况
					if (!config.hasOwnProperty('options')) {
						throw ('the config of id "'+ id +'" has no param "options"!');
					}else if (!_.isArray(config.options)) {
						throw ('the param of "options" in id "'+ id +'" should be an Array!');
					}

					//验证options
					options = config.options;
					for (var i = 0; i<options.size; i++){
						if (!(options[i].hasOwnProperty('label') && options[i].hasOwnProperty('value'))) {
							throw ('id "'+ id +'" --->the Object in options must be included in the label and value properties!');
						}
					}
				}

				this.updateTarget();

			}

			ChooserGroupController.prototype.parseBindings =function parseBindings() {
				var viewModel = this.getViewModel();
				var config = this.config;
				var id = config.id;

				//生成 options
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_options'] = ko.observableArray(config.options || []);

				var target = UiUtils.findControlsTag(this.$target, this.config.id);
				//生成group
				UiUtils.applyBindingsForObject(target, config, [{
					key: Binding.FOREACH,
					value: '$root["' + ViewModelUtils.BINDING_ROOT + '"].' + id + '_options'
				}], viewModel, UiUtils.BIND_FLAG_INSIDE_FOREACH);


				var spanTarget = $('#' + id + '~ span');
				//规定radio的label必须包在 span标签中
				if (spanTarget.size() === 0) {
					$('#' + id).after("<span></span>");
				}
				target = $('#' + id + '~ span');
				if (config.displayType == 'HTML') {
					UiUtils.applyBindingsForObject(target, config, [{
						key: Binding.HTML,
						value: '$data.label'
					}], viewModel, UiUtils.BIND_FLAG_INSIDE_FOREACH);
				} else {
					UiUtils.applyBindingsForObject(target, config, [{
						key: Binding.TEXT,
						value: '$data.label'
					}], viewModel, UiUtils.BIND_FLAG_INSIDE_FOREACH);
				}
				this.addBinding(Binding.VALUE, '$data.value');

				//生成group后，多个控件的id相同，所以要清除
				target.removeAttr('id');
				_super.prototype.parseBindings.call(this);
			};

			ChooserGroupController.prototype.setOptions = function setOptions() {
			};

			return ChooserGroupController;
		}) (FieldController);

		/** Edit -> input type="text" 标签
		 *
		 */
		var DEFAULT_EDIT_CONTROLLER_CONFIG = {
		};

		var EditController = (function (_super) {
			cKit.__extends(EditController, _super);
			function EditController (config1) {
				var self = this;
				var default_config = ConfigUtils.mergeConfig({}, DEFAULT_EDIT_CONTROLLER_CONFIG);
				_super.call(this, config1, {}, default_config);

				var config = this.config;
				var type = $('#' + config1.id).attr('type');
				var name = $('#' + config1.id).attr('name');
				if('password' == type || 'username' == name || 'password' == name) {
					this.config.binder = 'valueWithInit';
				}

			};

			EditController.prototype.parseBindings =function parseBindings () {
				_super.prototype.parseBindings.call(this);
				var viewModel = this.getViewModel();
				var self = this;
				var config = this.config;
				if (config.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getValue();
						var args = arguments.length >= 1 ? _.toArray(arguments) : [null];
						args[0] = value;
						return config.change.apply(self, args);
					});
				}

				this.addBinding(Binding.VALUE_UPDATE, '"input"');

				this.reset();
			};

			EditController.prototype.getFileUrl = function getFileUrl() {
				if (!this.$target.get(0) || this.$target.get(0).type != 'file') {
					throw 'ERROR: EDIT controller must be file!'
				}
				var url = '';
				var element = this.$target.get(0);
				if (navigator.userAgent.indexOf("MSIE")>=1) { // IE 
					url = element.value;
				} else if(navigator.userAgent.indexOf("Firefox")>0) { // Firefox 
					if (element.files.item(0)) {
						url = window.URL.createObjectURL(element.files.item(0));
					}
				} else if(navigator.userAgent.indexOf("Chrome")>0) { // Chrome 
					url = window.URL.createObjectURL(element.files.item(0));
				}
				return url;
			};

			return EditController;
		}) (InputController);

		/** TextArea
		 *
		 */
		var DEFAULT_TEXT_AREA_CONTROLLER_CONFIG = {
			binder: 'value',
			value: '',						// 默认内容
			validators: [Validator.NULL]	// 验证器列表
		};

		var TextAreaController = (function (_super) {
			cKit.__extends(TextAreaController, _super);
			function TextAreaController (config1) {
				var self = this;
				_super.call(this, config1, {}, DEFAULT_TEXT_AREA_CONTROLLER_CONFIG);
			};

			TextAreaController.prototype.parseBindings =function parseBindings(){
				_super.prototype.parseBindings.call(this);
				var self = this;
				var config = this.config;
				if (config.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(config.node);
						config.change.call(self, value, viewModel);
					});
				}
			};

			return TextAreaController;
		}) (InputController);

		/** RadioGroup 标签
		 *
		 */
		var DEFAULT_RADIO_GROUP_CONFIG = {
			isChooserGroup: true
		};

		var RadioGroupController = (function (_super) {
			cKit.__extends(RadioGroupController, _super);
			function RadioGroupController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_RADIO_GROUP_CONFIG);
				_super.call(this, config);
			}

			RadioGroupController.prototype.parseBindings = function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var config = this.config;
				var self = this;
				var lastValue = this.getNodeValue(config.node);
				var value = lastValue;
				var viewModel = this.getViewModel();
				viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_value'] = ko.observable(value || null);

				if (config.formatter) {
					var newOptions = [];
					for (var index in config.options) {
						newOptions.push(config.formatter.call(self, config.options[index]));
					}
					viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_options'] = ko.observableArray(newOptions || []);
				}


				this.setNode(config.node, ko.computed({
					/** 节点写入处理函数
					 *
					 * fieldGroup节点必须为observable对象,不可以为单值对象
					 *
					 */
					write: function(options) {
						viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_value'](options);
					},
					read: function() {
						var value = viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_value']();
						return '' + value;
					},
					owner: viewModel
				}));



				if (config.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(config.node);
						if(value != lastValue) {
							config.change.call(self, value);
						}
						lastValue = value;
					});
				}
			};

			RadioGroupController.prototype.setOptions = function parseBindings(options) {
				var viewModel = this.getViewModel();
				var config = this.config;
				var newOptions = options;
				if (config.formatter) {
					newOptions = [];
					for (var index in options) {
						newOptions.push(config.formatter.call(self, options[index]));
					}
				}
				viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_options'](newOptions);
			}

			return RadioGroupController;
		}) (ChooserGroupController);



		/**
		 * checkBox
		 */
		var DEFAULT_CHECK_BOX_CONFIG = {
			binder: 'checked',
			defaults: cKit.Bool.N
		};

		/** 这里接收'Y'和'N'作为输入输出
		 *
		 */
		var CheckBoxController = (function (_super) {
			cKit.__extends(CheckBoxController, _super);
			function CheckBoxController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_CHECK_BOX_CONFIG);
				_super.call(this, config);
			}

			CheckBoxController.prototype.parseBindings =function() {
				_super.prototype.parseBindings.call(this);
				var viewModel = this.getViewModel();
				var config = this.config;
				var self = this;

				// this.addBinding(Binding.CHECKED, '$root["' + ViewModelUtils.BINDING_ROOT + '"].' + config.id + '_checked');

				// viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_checked'] = ko.computed({
				// 	read: function () {
				// 		var value = this[config.node]();

				// 		if(value === cKit.Bool.Y) {
				// 			return true;
				// 		}
				// 		return false;
				// 	},
				// 	write: function(data) {
				// 		if(!_.isBoolean(data)) {
				// 			return;
				// 		}

				// 		this[config.node](data === true ? cKit.Bool.Y : cKit.Bool.N);
				// 	},
				// 	owner: viewModel
				// });

				var lastValue = this.getNodeValue(config.node);
				if (config.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(config.node);
						//var lastValueSize = lastValue.length;
						//var valueSize = value.length;
						if(lastValue != value) {
							config.change.call(self, value, viewModel);
						}
						lastValue = value;
					});
				}
			};

			return CheckBoxController;

		}) (FieldController);

		/** CheckBoxGroup
		 *
		 */
		var DEFAULT_CHECK_BOX_GROUP_CONFIG = {
			isChooserGroup : true,
			defaults: []
		};

		var CheckBoxGroupController = (function (_super) {
			cKit.__extends(CheckBoxGroupController, _super);
			function CheckBoxGroupController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1,DEFAULT_CHECK_BOX_GROUP_CONFIG);
				_super.call(this, config);
				config = this.config;
				var id = config.id;

			}

			CheckBoxGroupController.prototype.parseBindings =function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var config = this.config;
				var self = this;

				var lastValueSize = (this.getNodeValue(config.node)).length;
				if (config.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(config.node);
						var valueSize = value.length;
						if(lastValueSize != valueSize) {
							config.change.call(self, value);
						}
						lastValueSize = valueSize;
					});
				}
			};

			return CheckBoxGroupController;
		}) (ChooserGroupController);


		/** Select 标签
		 *
		 */
		var DEFAULT_SELECT_CONFIG = {
			isChooserGroup: true,
			defaults: null
		};

		var SelectController = (function (_super) {
			cKit.__extends(SelectController, _super);
			function SelectController(config1) {
				var self = this;

				if(config1.options && _.isArray(config1.options) && config1.options.length != 0 && !cKit.ValueUtils.isEmpty(config1.options[0].value)){
					config1.options.unshift({value: 'NONE', label: ''});
				}

				var config = _.defaults(config1,DEFAULT_SELECT_CONFIG);

				_super.call(this, config);

				if(!_.isArray(config.options)) {
					throw 'Config.options should be an array!';
				}

				if(config.select && !_.isFunction(config.select)) {
					throw '"Config.select should be an function!"';
				}

			}

			SelectController.prototype.parseBindings =function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var viewModel = this.getViewModel();
				var config = this.config;
				var id = config.id;

				//生成 options
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_options'] = ko.observableArray(config.options || []);
				this.addBinding(Binding.OPTIONS, '$root["' + ViewModelUtils.BINDING_ROOT + '"].' + id + '_options');
				this.addBinding(Binding.OPTIONS_TEXT, "'label'");
				this.addBinding(Binding.OPTIONS_VALUE, "'value'");

				//bind data
				if (config.change) {
					this.addBinding(Binding.CHANGE, config.change);
				}
			};

			SelectController.prototype.getOptions = function getOptions() {
				var viewModel = this.getViewModel();
				var id = this.config.id;
				return viewModel[ViewModelUtils.BINDING_ROOT][id + '_options'];
			};

			SelectController.prototype.reset = function reset() {
				var viewModel = this.getViewModel();
				_super.prototype.reset.call(this);

				if(!this.getValue()) {
					var config = this.config;
					var option = viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_options']()[0];
					if(option && option.value) {
						this.setNode(config.node, viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_options']()[0].value);
					}
				}

			};

			/**
			 * @note 也可以使用可选模式
			 */
			SelectController.prototype.setOptions = function setOptions(newOptions) {
				var viewModel = this.getViewModel();
				if (!_.isArray(newOptions)) {
					throw 'the second param must be an Array!';
				}
				for (var i = 0; i<newOptions.size; i++){
					if (!(newOptions[i].hasOwnProperty('label') && newOptions[i].hasOwnProperty('value'))) {
						throw ('id "'+ id +'" --->the item Object in options must have two properties "label" and "value"');
					}
				}
				var config = this.config;
				//绑定新的Options
				viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_options'](newOptions);
				//默认将值置为options第一个元素的值
				var value = null;
				if(_.isArray(newOptions) && newOptions.length > 0) {
					value = newOptions[0].value;
				}
				viewModel[config.node](value);
			}

			return SelectController;
		}) (FieldController);


		var DEFAULT_MULTIPART_SELECT_CONTROLLER = {
			ids: null,			// 各个select的id，按层级书序
			entries: null,		// 各个select在model中的入口, 比如city里面有districtMap
			options: null,		// 数据模型,描述层级关系,每个entry需要包含{label: xx, value: xx, 入口: options}
			fieldType: FieldType.COMPOSED_FIELD,
			leafNode: '',
			defaults: null,
			filter : null, //值是一个对象{name:'',value:'',entry:''}  过滤条件的的name，filter[name]==value,需要过滤的值entry
			change: null,	// 最后一个select数据被更改时触发
			anyChange: null // 随便什么被更改都会触发
		};

		var MultipartSelectController = (function (_super) {
			cKit.__extends(MultipartSelectController, _super);
			function MultipartSelectController(config) {
				var self = this;
				config = ConfigUtils.mergeConfig(config, DEFAULT_MULTIPART_SELECT_CONTROLLER);
				_super.call(this, config);
				config = this.config;

				config.node = _.clone(config.uids);

				if (config.leafNode) {
					config.node.push(config.leafNode);
				}

				if (!this.$hintTarget.length) {
					this.$hintTarget = this.$target.find("[hid='" + config.uid + "']");
					if (this.$hintTarget.length) {
						this.$hintTarget.attr('id', config.id +  '_hint');
					}
				}

				// 参数检查
				if(!_.isArray(config.uids)) {
					throw ('"config.uids" should be an array contains all sub ids for select nodes!');
				}

				if(!_.isArray(config.entries)) {
					throw ('"config.entries" should be an array contains all sub entries for each level of the select node!');
				}

				if(!config.options) {
					throw ('"config.options" should be a js object!');
				}

				if(config.uids.length !== (config.entries.length + 1)) {
					throw ('config.uids.length !== (config.entries.length + 1)');
				}

				if(config.change && !_.isFunction(config.change)) {
					throw '"Config.change" should be a function!';
				}

				// 为每个select生成controller
				self.controllers = [];
				var id = config.id;
				var uids = config.uids;

				var readOnly = config.readOnly;
				if (_.isUndefined(readOnly)) {
					readOnly = false;
				}

				for(var index in uids) {
					var functionName = config.id + '_' + uids[index] + '_event_change';
					var uid = uids[index];
					self.controllers.push(new SelectController({
						uid : uid,
						type : Controller.SELECT_CONTROLLER,
						readOnly : readOnly,
						options: [],
						node : config.node[index],
						parent: config.parent,
						change: 'function(data, event) {return $root["' + ViewModelUtils.OPERATION_ROOT + '"].' + functionName + '($root, ' + index + ',"' + id + '","' + uid + '", event);}'
					}));
				}
			}

			MultipartSelectController.prototype.parseBindings =function parseBindings() {
				var multipartSelectControllerSelf = this;
				var viewModel = this.getViewModel();
				var config = this.config;
				var id = config.id;
				var uids = config.uids;
				var index;

				var originValues = [];

				// 需要将model复制到viewModel中，并且对每个select建立节点
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_model'] = config.options;
				for(index in uids) {
					var uid = uids[index];
					var self = this;
					var vmo = viewModel[config.node[index]];
					var originValue = (vmo && _.isFunction(vmo)) ? vmo() : null;
					originValues.push(originValue);


					viewModel[ViewModelUtils.OPERATION_ROOT][config.id + '_' + uids[index] + '_event_change'] =
						/** 当select组中的其中一个发生变化的时候的处理函数
						 *
						 * @param viewModel		当前Form的viewModel
						 * @param index			当前Select控件是在组中的索引（0起点）
						 * @param id			当前组的id
						 * @param uid			当前组中select控件的id
						 */
							function onSelectChange (viewModel, index, id, uid, event) {
							// 首先要去的当前select控件改变后的值,不可以使用ko取,只能取到改变前的
							var value = $('#' + uids[index]).val();
							var options = viewModel[ViewModelUtils.BINDING_ROOT][id + '_model'];
							var nodes = options;
							var node;
							var nodeValue;
							/* 这里主要顺着map数组一直向下查找,找到改变后的元素,
							 * 并对下一个select进行重新赋值,这样就可以产生级联效果.
							 * 如果更改了下一个select的值,则会再次出发下一个select的
							 * change事件.这个函数将会被对此调用,一直应用到最后一个
							 * select.
							 * 
							 */
							if (config.anyChange) {
								config.anyChange.call(self.getContainerForm().getControllerByUid(uid), value);
							}
							for(var uidIndex in uids) {
								var subControllerTarget = multipartSelectControllerSelf.controllers[uidIndex].getTarget();
								nodeValue = subControllerTarget.val();
								if (config.leafNode) {
									if (!cKit.ValueUtils.isEmpty(nodeValue)) {
										viewModel[config.leafNode](nodeValue);
									} else if (index === 0) {
										viewModel[config.leafNode](null);
									}
								}
								if(uidIndex == index) {
									for(var i in nodes) {
										node = nodes[i];
										if(node.value === nodeValue) {
											// 对下一个select进行赋值
											var nextControllerIndex = parseInt(uidIndex, 10) + 1;
											if(nextControllerIndex < uids.length) {
												options = self.controllers[nextControllerIndex].getOptions();
												var targetEntry = config.entries[uidIndex];
												if(!node[targetEntry] || !node[targetEntry].length) {
													node[targetEntry] = [{label: '', value: 'NONE'}];
												}
												var targetValues = node[targetEntry];
												// 赋值本身采用ko方式
												options.removeAll();
												for(var index3 in targetValues) {
													//过滤条件
													if(config.filter){
														if(targetEntry == config.filter.entry && !cKit.ValueUtils.isEmpty(targetValues[index3].value)){
															if(targetValues[index3][config.filter.name] == config.filter.value){
																options.push(targetValues[index3]);
															}
														}else{
															options.push(targetValues[index3]);
														}
													}else{
														options.push(targetValues[index3]);
													}
												}
											} else {
												if(config.change) {
													var changedValue = {};
													for ( var l = 0; l < self.controllers.length; l++) {
														var controller = self.controllers[l];
														changedValue[controller.getConfig().node] = controller.getValue();
													}

													config.change.call(multipartSelectControllerSelf, changedValue);
												}
											}
											return;
										}
									}

								} else if(uidIndex < index) {
									for(var nodeIndex in nodes) {
										node = nodes[nodeIndex];
										if(node.value === nodeValue) {
											nodes = node[config.entries[uidIndex]];
											break;
										}
									}
								} else {
									break;
								}
							}

							return true;
						};
				}

				for(index in this.controllers) {
					this.controllers[index].applyBindings();
				}

				this.reset(false);
			};

			/** @Override
			 */
			MultipartSelectController.prototype.reset = function reset(delay) {
				_super.prototype.reset.call(this, delay);

				var viewModel = this.getViewModel();
				var config = this.config;
				var uids = config.uids;
				var self = this;

				// 第一个没有初值的controller
				var firstEmptyIndex = this.controllers.length - 1;
				// 初始化从第一个select到最后一个有初值的select的Options
				var optionsRoot = config.options;
				for(var index in uids) {
					var array = this.controllers[index].getOptions();
					var controller = this.controllers[index];
					var nodeValue = controller.getNodeValue(controller.config.node);

					array.removeAll();
					for(var arrayIndex in optionsRoot) {
						array.push(optionsRoot[arrayIndex]);
					}

					for(var subIndex in optionsRoot) {
						var subRoot = optionsRoot[subIndex];
						if(subRoot.value === nodeValue) {
							// array相关操作有可能将已选择的item重置成index=0，所以这里需要设置回去
							controller.setNode(controller.config.node, nodeValue);
							optionsRoot = subRoot[config.entries[index]];
							break;
						}
					}
					if(!nodeValue) {
						firstEmptyIndex = index;
						break;
					}
				}

				var postCall = function () {
					for(var index in uids) {
						if(index < firstEmptyIndex) {
							continue;
						}

						var uid = uids[index];
						cKit.DomUtils.fireEvent(self.controllers[index].getTarget().get(0), 'change');
						break;
					}
				};
				if(delay) {
					ViewModelUtils.addPostCall(viewModel, postCall);
				} else {
					postCall();
				}
			};

			MultipartSelectController.prototype.update = function(model) {
				var viewModel = this.getViewModel();
				for (var index in model) {
					if (viewModel[index]) {
						viewModel[index](model[index]);
					}
				}
			}

			// 根据最后一个节点的值来设置之前的值
			MultipartSelectController.prototype.updateLeafNode = function (nodeValue) {
				var viewModel = this.getViewModel();
				var config = this.config;
				var uids = config.uids;
				var self = this;
			}

			return MultipartSelectController;
		}) (FieldController);

		var TimePickerUtils = {
			generateTime: function(value1, value2) {
				var value = null;
				if(cKit.ValueUtils.isEmpty(value1) || cKit.ValueUtils.isEmpty(value2)) {
					if(cKit.ValueUtils.isEmpty(value1) && cKit.ValueUtils.isEmpty(value2)){
						value = null;
					}else{
						value = false;
					}
				} else {
					if(_.isNumber(value1) && value1 < 10) {
						value1 = '0' + value1;
					}
					if(_.isNumber(value2) && value2 < 10) {
						value2 = '0' + value2;
					}

					value = value1 + ':' + value2 + ':00';
				}
				return value;
			}
		};

		var DEFAULT_TIME_PICKER_CONTROLLER = {
			fieldType: FieldType.COMPOSED_FIELD,
			defaults: null,
			manualId: true
		};

		var TimePickerController = (function (_super) {
			cKit.__extends(TimePickerController, _super);
			function TimePickerController(config) {
				var self = this;
				config = ConfigUtils.mergeConfig(config, DEFAULT_TIME_PICKER_CONTROLLER);
				_super.call(this, config);
				config = this.config;

				if(!config.options || !_.isArray(config.options.hours) || !_.isArray(config.options.mins)) {
					throw ('config.options.hours and config.options.mins should be arrays!');
				}
				var id = config.id;
				this.controllers = [];
				var uids = ['hour', 'min'];
				var options = [config.options.hours, config.options.mins];
				for(var index in uids) {
					var uid = uids[index];
					self.controllers.push(new SelectController({
						uid : uids[index],
						type : Controller.SELECT_CONTROLLER,
						options: options[index],
						parent: config.parent,
						node: ViewModelUtils.BINDING_ROOT + '.' + id + '_' + uids[index]
					}));
				}
			}

			TimePickerController.prototype.updateTarget =function updateTarget() {
				var config = this.config;

				if(!config.parent) {
					throw 'I need a parent!';
				}
				if(config.id) {
					this.$target = $('#' + config.id);
				} else {
					config.id = this.generateId();
				}
				if(_.isString(config.uid)) {
					this.$target = $(DomUtils.getElementByAttribute(config.parent.getTarget().get(0), 'uid', config.uid));
				}
			};

			TimePickerController.prototype.parseBindings =function parseBindings() {
				var viewModel = this.getViewModel();
				var config = this.config;
				var id = config.id;
				var index;

				var hourNode = viewModel[ViewModelUtils.BINDING_ROOT][id + '_hour'] = ko.observable();
				var minNode = viewModel[ViewModelUtils.BINDING_ROOT][id + '_min'] = ko.observable();

				var computedOption = {
					read: function () {
						var value1 = hourNode(),
							value2 = minNode();

						return TimePickerUtils.generateTime(value1, value2);
					},
					write: function(data) {
						if(!data || !_.isString(data)) {
							return;
						}

						var parts = data.split(':');
						hourNode(parts[0]);
						minNode(parts[1]);
					},
					owner: viewModel
				};
				var computed = ko.computed(computedOption, viewModel);
				var originValue = viewModel[config.node];
				viewModel[config.node] = computed;

				var self = this;
				var lastValue = self.getNodeValue(config.node);
				if (config.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(config.node);
						if (value && lastValue != value) {
							config.change.call(self, value, viewModel);
						}
						lastValue = value;
					});
				}

				for(index in this.controllers) {
					this.controllers[index].applyBindings();
				}

				// 恢复默认值
				if(_.isFunction(originValue)) {
					viewModel[config.node](originValue());
				} else {
					viewModel[config.node](originValue);
				}


			};

			return TimePickerController;
		}) (FieldController);

		var DEFAULT_DATE_PICKER_CONTROLLER = {
			binder: 'value',
			defaults: null,
			minDate: null,		// 起始时间
			maxDate: null,		// 截止时间
			month: null,
			initialDate:null
		};

		var DatePickerController = (function (_super) {
			cKit.__extends(DatePickerController, _super);
			function DatePickerController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_DATE_PICKER_CONTROLLER);
				_super.call(this, config);
				config = this.config;

				var picker = $('#' + config.id);
				if (!picker || picker.length < 1) {
					throw 'Can not find "_datePicker" element!';
				}
				if(config.month){
					picker.datetimepicker({
						format: 'yyyy-mm',
						autoclose: true,
						pickerPosition: 'bottom-left',
						startDate: config.minDate,
						endDate: config.maxDate,
						minView: 3,
						maxView:3,
						startView:3,
						initialDate: config.initialDate || ""
					});
				}else{
					picker.datetimepicker({
						format: 'yyyy-mm-dd',
						autoclose: true,
						pickerPosition: 'bottom-left',
						startDate: config.minDate,
						endDate: config.maxDate,
						minView: 2,
						initialDate: config.initialDate || ""
					});

				}
				var picker_icon = $('#' + config.id +'~ span');
				picker_icon.click(function(){
					picker.trigger("focus");
				});


			}

			DatePickerController.prototype.parseBindings = function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var viewModel = this.getViewModel();
				var config = this.config;
				var id = config.id;
				var index;

				var self = this;

				$('#' + config.id).change(function() {
					var value = this.value;

					self.setNode(config.node, value);
				});

				if (config.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(config.node);
						config.change.call(self, value, viewModel);
					});
				}

				this.reset(false);
			};

			DatePickerController.prototype.reset = function reset(delay) {
				_super.prototype.reset(this);
				var config = this.config;
				var id = config.id;
				var index;

				var value = this.getNodeValue(config.node);
				if(value) {
					$('#' + config.id).val(value);
				}
			};

			return DatePickerController;
		}) (FieldController);

		var DEFAULT_DATE_RANGE_PICKER_CONTROLLER = {
			fieldType: FieldType.COMPOSED_FIELD,
			binder: null,
			defaults: null,
			node: [],		// minDate, maxDate 需要两个字段
			handlerFunction: null
		};

		var DateRangePickerController = (function (_super) {
			cKit.__extends(DateRangePickerController, _super);
			function DateRangePickerController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_DATE_RANGE_PICKER_CONTROLLER);
				_super.call(this, config);
				config = this.config;

				if(!_.isArray(config.node) || config.node.length !== 2) {
					throw '"Config.node" should be an Array[2] object!';
				}

				var ranges = {};
				ranges[label.today] = ['today', 'today'];
				ranges[label.yesterday] = [Date.today().add({ days: -1 }), Date.today().add({ days: -1 })];
				ranges[label.last7Days] = [Date.today().add({ days: -6 }), 'today'];
				ranges[label.last30Days] = [Date.today().add({ days: -29 }), 'today'];
				ranges[label.thisMonth] = [Date.today().moveToFirstDayOfMonth(), Date.today().moveToLastDayOfMonth()];
				ranges[label.lastMonth] = [Date.today().moveToFirstDayOfMonth().add({ months: -1 }), Date.today().moveToFirstDayOfMonth().add({ days: -1 })];

				var id = config.id;
				var self = this;

				var localOption = _.clone(l10n.dateRangePicker);
				localOption.daysOfWeek = _.clone(l10n.dateRangePicker.daysOfWeek);
				$('#' + id).daterangepicker({
					ranges: ranges,
					opens: 'right',
					format: 'yyyy-MMdd',
					validators : config.validators,
					separator: label.dateSeparator,
					startDate: Date.today(),
					endDate: Date.today(),
					minDate: config.minDate,
					maxDate: config.maxDate,
					dateLimit: config.dateLimit,
					locale: localOption,
					showWeekNumbers: true,
					buttonClasses: ['btn-danger']
				}, function(start, end) {
					self.dateRangeChangeHandler(start, end);

				});
			}

			DateRangePickerController.prototype.dateRangeChangeHandler = function dateRangeChangeHandler(start, end) {
				if(_.isFunction(this.config.handlerFunction)) {
					this.config.handlerFunction.call(this, start, end);
				}
			}

			DateRangePickerController.prototype.parseBindings =function parseBindings() {
				_super.prototype.parseBindings.call(this, viewModel);

				var config = this.config;
				var id = config.id;
				var self = this;

				function parseDate(date) {
					var d = new Date();
					var parts = date.split('-');
					d.setYear(parseInt(parts[0]));
					d.setDate(1);
					d.setMonth(parseInt(parts[1]) - 1);
					d.setDate(parseInt(parts[2]));

					return d;
				}

				config.handlerFunction = function dateRangeChangeHandler (start, end) {
					if(start === null && end === null) {
						this.setNode(config.node[0], null);
						this.setNode(config.node[1], null);
						$('#' + id + ' span').html('选择日期');
						return ;
					}

					var sDate = start.toString(Constant.DATE_FORMAT);
					var eDate = end.toString(Constant.DATE_FORMAT);

					var startDate = parseDate(sDate,'Y-m-d');
					var endDate = parseDate(eDate,'Y-m-d');

					// 0 -> start ; 1 -> end
					this.setNode(config.node[0], sDate);
					this.setNode(config.node[1], eDate);

					$('#' + id + ' span').html(startDate.toString(label.yyyyMMddFormat) + label.dateSeparator + endDate.toString(label.yyyyMMddFormat));
				}

				//FIXME 当两个值都改变时，change会被调用两次
				var changeMark = 0;
				if (config.change) {
					var viewModel = this.getViewModel();
					this.addBinding(Binding.CHANGE, function(){
						var beginDateValue = self.getNodeValue(config.node[0]);
						var endDateValue = self.getNodeValue(config.node[1]);
						var value = new Object();
						value.beginDate = beginDateValue;
						value.endDate = endDateValue;
						config.change.call(self, value, viewModel);
					});
				}
				this.reset(false);
			};

			DateRangePickerController.prototype.reset = function reset(delay) {
				_super.prototype.reset(this, delay);
				var config = this.config;
				var id = config.id;
				var index;

				var startValue = this.getNodeValue(config.node[0]);
				var endValue = this.getNodeValue(config.node[1]);

				var invokeHandler = true;
				if(startValue) {
					if(!endValue) {
						endValue = startValue;
					}
				} else if(endValue) {
					startValue = endValue;
				}

				if(invokeHandler) {
					this.dateRangeChangeHandler(startValue, endValue);
				}

			};

			return DateRangePickerController;
		}) (FieldController);

		var DEFAULT_TIME_RANGE_PICKER_CONTROLLER = {
			fieldType: FieldType.COMPOSED_FIELD,
			defaults: null
		};

		var TimeRangePickerController = (function (_super) {
			cKit.__extends(TimeRangePickerController, _super);
			function TimeRangePickerController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_DATE_RANGE_PICKER_CONTROLLER);
				_super.call(this, config);
				config = this.config;

				if(!config.options || !_.isArray(config.options.hours) || !_.isArray(config.options.mins)) {
					throw ('config.options.hours and config.options.mins should be arrays!');
				}
				var uid = config.uid;
				this.controllers = [];
				var uids = [uid + '_hour_from', uid + '_min_from', uid + '_hour_to', uid + '_min_to'];
				var options = [config.options.hours, config.options.mins, config.options.hours, config.options.mins];

				var readOnly = config.readOnly;
				if (_.isUndefined(readOnly)) {
					readOnly = false;
				}

				for(var index in uids) {
					var uid = uids[index];
					self.controllers.push(new SelectController({
						uid : uid,
						type : Controller.SELECT_CONTROLLER,
						readOnly : readOnly,
						options: options[index],
						node : ViewModelUtils.BINDING_ROOT + '.' + uid,
						parent: config.parent
					}));
				}
			}

			TimeRangePickerController.prototype.reset = function(delay) {
				_super.prototype.reset.call(this, delay);

				for(var index in this.controllers) {
					var c = this.controllers[index];
					c.reset(delay);
				}
			};

			TimeRangePickerController.prototype.parseBindings = function parseBindings() {
				_super.prototype.parseBindings.call(this);
				var viewModel = this.getViewModel();
				var config = this.config;
				var uid = config.uid;
				var index;
				/* 会在binding节点上创造出多个与select绑定的值节点,真正接受外界data输入的节点为一个computed节点
				 * 通过它来向各个值节点写入数据或者由各个节点合成出目标数据
				 */
				viewModel[ViewModelUtils.BINDING_ROOT][uid + '_hour_from'] = ko.observable();
				viewModel[ViewModelUtils.BINDING_ROOT][uid + '_min_from'] = ko.observable();
				viewModel[ViewModelUtils.BINDING_ROOT][uid + '_hour_to'] = ko.observable();
				viewModel[ViewModelUtils.BINDING_ROOT][uid + '_min_to'] = ko.observable();

				var vm = viewModel;

				var computedOption = {
					read: function () {
						var suffix = '_from';
						var value1 = TimePickerUtils.generateTime(this[ViewModelUtils.BINDING_ROOT][uid + '_hour' + suffix](), this[ViewModelUtils.BINDING_ROOT][uid + '_min' + suffix]());
						suffix = '_to';
						var value2 = TimePickerUtils.generateTime(this[ViewModelUtils.BINDING_ROOT][uid + '_hour' + suffix](), this[ViewModelUtils.BINDING_ROOT][uid + '_min' + suffix]());
						if (config.getFullValue){
							return value1 + '-' + value2;
						}
						if (null === value1 && null === value2) {
							return null;
						}
						if (!value1 || !value2) {
							return false;
						}
						return value1 + '-' + value2;

					},
					write: function(data) {
						var times = {
							'0': {
								parts: [null, null]
							},
							'1': {
								parts: [null, null]
							}
						};

						if (_.isString(data)) {
							var tempTimes = data.split('-');

							for(var index in tempTimes) {
								times[index].parts = tempTimes[index].split(':');
							}
						}

						var suffixes = ['_from', '_to'];
						for(var index in times) {
							var suffix = suffixes[index];
							vm[ViewModelUtils.BINDING_ROOT][uid + '_hour' + suffix](times[index].parts[0]);
							vm[ViewModelUtils.BINDING_ROOT][uid + '_min' + suffix](times[index].parts[1]);
						}
					},
					owner: vm
				};
				var computed = ko.computed(computedOption, viewModel);
				var originValue = viewModel[config.node];
				viewModel[config.node] = computed;

				var self = this;
				var lastValue = self.getNodeValue(config.node);
				if (config.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(config.node);
						if (value && lastValue != value) {
							config.change.call(self, value, viewModel);
						}
						lastValue = value;
					});
				}

				if (config.enable) {
					for(index in this.controllers) {
						this.controllers[index].addBinding(Binding.ENABLE, function(){
							var value = self.getNodeValue(config.node);
							return config.enable.call(self, value, viewModel);
						});
					}
				}

				for(index in this.controllers) {
					this.controllers[index].applyBindings();
				}

				// 恢复默认值
				viewModel[config.node](originValue());
			};

			return TimeRangePickerController;
		}) (FieldController);

		var DEFAULT_FIELD_GROUP_CONTROLLER_CONFIG = {
			fieldType: FieldType.GROUP_FIELD,
			binder: null,
			node: null,
			autoCreate: true
		};

		/** 普通Group的controller，同时也是输入框组的controller
		 *
		 *
		 */
		var FieldGroupController = (function (_super) {
			cKit.__extends(FieldGroupController, _super);
			function FieldGroupController(config1) {
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_FIELD_GROUP_CONTROLLER_CONFIG);

				_super.call(this, config);

				this.updateTarget();
			}

			/**
			 * @param uid 当前controllers列表中的uid名字
			 */
			FieldGroupController.prototype.getController = function getController(uid) {
				var config = this.getConfig();
				var controllers = this.controllers;
				var groupId = config.id;
				for (var index in controllers) {
					var controller = controllers[index];
					var controllerConfig = controller.getConfig();
					if(controllerConfig.uid === uid) {
						var id = groupId + '_' + uid;
						return this.getContainerForm().getControllerById(id);
					}
				}

				throw 'BUG! Can not find uid with ' + uid;
			};

			/** 为fieldGroup 建立子节点
			 *
			 * 子节点必须为observable的一种，不可以直接为值
			 *  @param root 当前层级根节点
			 *
			 */
			FieldGroupController.prototype.createSubNode = function createNode(controller, root) {
				var config = controller.config;
				var isArray = false;

				if (config.type === cKit.DataType.ARRAY)  {
					isArray = true;
				}

				var bindNames = null;
				if(_.isArray(config.node)) {
					bindNames = config.node;
				} else if(_.isString(config.node) && config.node.indexOf('.') < 0) {
					bindNames = [config.node];
				}

				for(var index in bindNames) {
					var bindName = bindNames[index];
					if(_.isString(bindName)) {
						var node = root[bindName];
						if(!node) {
							if(config.autoCreate === true) {
								var objectType = isArray ? 'ARRAY' : 'normal';
								log.w('FieldGroupController: WARNING! Source data is missing property field["' + bindName + '"], fill it with ' + objectType + ' object.');

								var nodeObject = null;
								if(isArray) {
									nodeObject = ko.observableArray([]);

									var times;
									var capacityMin = config.capacity[0];
									var capacityMax = config.capacity[1];
									var viewModelCapacity = nodeObject().length;

									if (viewModelCapacity  > capacityMax) {
										times = viewModelCapacity - capacityMin;
										for (var k = 0; k < times; k++) {
											nodeObject.pop();
										}
									} else if (viewModelCapacity < capacityMin) {
										times = capacityMin - viewModelCapacity;
										for (var j = 0; j < times; j++) {
											var defaults = config.defaults;
											var item = _.clone(defaults);
											nodeObject.push(item);

										}
									}
								} else {
									nodeObject = ko.observable(config.defaults);
								}
								root[bindName] = nodeObject;
							}
						}
					}
				}

			},

				FieldGroupController.prototype.parseBindings =function parseBindings() {
					_super.prototype.parseBindings.call(this);
					var config = this.config;
					var viewModel = this.getViewModel();
					var $target = this.$target;

					var nodeName = config.node || null;
					if(nodeName) {
						$target.before('<!-- ko if: ' + this.getNodeName(nodeName) + '  -->');
						$target.after('<!-- /ko -->');
					} else {
						throw '"Config.node" should be an object!';
					}

					UiUtils.applyBindingsForObject(this.$target, config, this.getBindings(), viewModel);

					var self = this;
					var vm = viewModel;
					var node = this.getNode(nodeName);
					if(_.isUndefined(node)) {
						node = null;
					}
					node = KoUtils.isObservable(node) ? node : ko.observable(node);
					viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_group'] = node;
					var computedNode = ko.computed({
						/** 节点写入处理函数
						 *
						 * fieldGroup节点必须为observable对象,不可以为单值对象
						 *
						 */
						write: function(newValue) {
							if(null !== newValue && !_.isUndefined(newValue)) {
								for(var index in self.controllers) {
									var controller = self.controllers[index];
									// 为节点填充所需子节点
									self.createSubNode(controller, newValue);
								}
							}
							/* 这里检查是否是observable的唯一原因是，当FormController.updateModel()时,
							 * 传入的newValue有可能为一个observable对象,这里只需要根节点为object的对象
							 * 所以,去掉包裹的observable
							 * 
							 */
							newValue = KoUtils.unwrapObservableTree(newValue);
							var groupNode = viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_group'];
							var root = groupNode();
							if (newValue) {
								if(!root) {
									root = {};
									ViewModelUtils.fromJS(newValue, root, null, false);
									groupNode(root);
								} else {
									ViewModelUtils.fromJS(newValue, root, null, false);
								}
							} else {
								groupNode(null);
							}

							var changeFunc = config.change;
							if (changeFunc && _.isFunction(changeFunc)) {
								changeFunc.call(self, newValue);
							}

							if(null !== newValue && !_.isUndefined(newValue)) {
								for(var index in self.controllers) {
									var controller = self.controllers[index];
									// 更新节点目标
									controller.updateTarget();
								}
							}
						},
						read: function() {
							var node = viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_group'];
							if(_.isFunction(node)) {
								node = node();
							}
							if(_.isFunction(node)) {
								return node();
							} else if(node) {
								return node;
							}
							return null;
						},
						owner: viewModel
					});
					this.setNode(nodeName, computedNode);
					UiUtils.bindControllers.call(this, config, vm);

					var groupValue = this.getValue();
					computedNode(groupValue);
					this.reset();
				};
			//当viewModel中的绑定的数组长度不等于controllers中配置的capacity数组的长度时，根据配置情况增加或者减少控件
			FieldGroupController.prototype.alignCapacity = function alignCapacity() {
				var viewModel = this.getViewModel();
				var config = this.config;
				var times;
				if (_.isArray(config.capacity)) {
					var capacityMin = config.capacity[0];
					var capacityMax = config.capacity[1];
					var node = this.getNodeValue();
					var viewModelCapacity = 0;

					if(node) {
						node = node[config.node];
						if(node) {
							viewModelCapacity = node().length;
						}
					}

					if (capacityMin == capacityMax){
						if (viewModelCapacity  > capacityMax) {
							times = viewModelCapacity - capacityMin;
							for (var k = 0; k < times; k++) {
								node.pop();
							}
						}else if (viewModelCapacity < capacityMin) {
							times = capacityMin - viewModelCapacity;
							for (var j = 0; j < times; j++) {
								var defaults = config.defaults;
								var item = _.clone(defaults);
								node.push(item);

							}
						}
					}
				}
			};

			FieldGroupController.prototype.validate = function validate(model) {
				var COUNT = this.controllers.length,
					i = 0,
					controller,
					config,
					viewModelValue,
					validateResult = true;

				// 如果fieldGroup在viewModel下的值为null，那么就不需要判断它的节点。
				viewModelValue = this.getNodeValue(this.config.node);
				if (viewModelValue) {
					for(; i < COUNT; ++i) {
						controller = this.controllers[i];
						config = this.config.fields[i];
						if(config.type === cKit.DataType.ARRAY) {
							if(cKit.ObjectUtils.hasMethod(controller, 'validateArray')) {
								var arrayData = controller.getNodeValue(config.node);
								if(!controller.validateArray(arrayData, viewModelValue)) {
									validateResult = false; // failed with controller validation
								}
							}
						} else if(config.node && controller.validate(viewModelValue) === false) {
							validateResult = false; // failed with controller validation
						}
					}
				}
				return validateResult;
			}

			FieldGroupController.prototype.reset = function reset() {
				var config = this.config;
				var fieldConfigs = config.fields;
				var COUNT = fieldConfigs.length,
					i = 0,
					fieldConfig,
					controller;

				if(this.getValue() === null) {
					// 如果这个节点没有值，就不重置了
					return;
				}
				// reset fields
				for(; i < COUNT; ++i) {

					fieldConfig = fieldConfigs[i];
					controller = this.controllers[i];

					if (config.hasOwnProperty('capacity') && controller.alignCapacity) {
						controller.alignCapacity(fieldConfig);
					}
					controller.reset();
				}
			}

			return FieldGroupController;
		}) (FieldController);

		/** 这里存有所有支持的字段操作方式（控件）
		 *
		 * name		属性随意
		 * __ctor	指向构造器
		 *
		 */
		var Controller = {
			NODE: {
				name: 'NodeController',
				__ctor: NodeController
			},

			EDIT: {
				name: 'EditController',
				__ctor: EditController
			},

			DATE_PICKER: {
				name: 'DatePickerController',
				__ctor: DatePickerController
			},

			DATE_RANGE_PICKER: {
				name: 'DateRangePickerController',
				__ctor: DateRangePickerController
			},

			TEXT_AREA: {
				name: 'TextAreaController',
				__ctor: TextAreaController
			},

			LABEL: {
				name: 'LabelController',
				__ctor: LabelController
			},

			BUTTON: {
				name: 'ButtonController',
				__ctor: ButtonController
			},

			CHECK_BOX: {
				name: 'CheckBoxController',
				__ctor: CheckBoxController
			},

			RADIO_GROUP: {
				name: 'RadioGroupController',
				__ctor: RadioGroupController
			},

			CHECK_BOX_GROUP: {
				name: 'CheckBoxGroupController',
				__ctor: CheckBoxGroupController
			},

			SELECT: {
				name: 'SelectController',
				__ctor: SelectController
			},

			TIME_PICKER: {
				name: 'TimePickerController',
				__ctor: TimePickerController
			},

			TIME_RANGE_PICKER: {
				name: 'TimeRangePickerController',
				__ctor: TimeRangePickerController
			},

			TABLE: {
				name: 'TableController',
				__ctor: TableController
			},

			TABLE_HEAD: {
				name: 'TableHeadController',
				__ctor: TableHeadController
			},

			FIELD_GROUP: {
				name: 'FieldGroupController',
				__ctor: FieldGroupController
			},

			MULTIPART_SELECT: {
				name: 'MultipartSelectController',
				__ctor: MultipartSelectController
			},

			AUTO_COMPLETE: {
				name: 'AutoCompleteController',
				__ctor: AutoCompleteController
			},

			FILTER_EDIT: {
				name: 'FilterEditController',
				__ctor: FilterEditController
			},

			QUANTITY_EDIT: {
				name: 'QuantityEditController',
				__ctor: QuantityEditController
			},

			IMAGE: {
				name: 'ImageController',
				__ctor: ImageController
			},

			CreateController: function CreateController (field, arg1, arg2, arg3, arg4, arg5, arg6) {
				if(!field.hasOwnProperty('__ctor')) {
					throw ('First param should be a FormField, second and on should be config spec(s) for the field!');

				}

				// 构造ctor要用的参数列表 TODO make it dynamic
				return new field.__ctor(arg1, arg2, arg3, arg4, arg5, arg6);
			}
		};


		var DEFAULT_FORM_CONTROLLER_CONFIG = {
			fields: [],
			submit: null,
			action: null,
			method: 'post',
			reset: true, 			// 设置非表单提交之后，表单内容是否重置为初始值
			isForm: true/*,			// 是否是Form节点
			 delayBindings: true		// 是否在最后ko.applyBindings时延迟绑定*/
		};


		var FormController = (function (_super) {
			cKit.__extends(FormController, _super);
			function FormController (config1, config2) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, config2, DEFAULT_FORM_CONTROLLER_CONFIG);
				_super.call(this, config);
				config = this.config;

				if(!config.model) {
					throw ('Config.model is empty!');
				}

				// 与knockout绑定viewModel
				// 这里有点需要注意，knockout2.2.1不能对纯数据数组进行有效的数据同步支持
				// 现象就是,一个数组都是input,内容改变后重新获取这个数据,总是之前最初的值
				// 但是,knockout对一个由具名object组成的数组却支持的很好,所以这里要做wrapper
				this.operation = {
					self: this,
					postCalls: [], // 需要在applyBindings之后调用的函数们
				};
				this.viewModel = this.toModel(config);
				this.model = config.model;

				var viewModel = this.viewModel;

				// 参数检查
				if(!_.isArray(config.fields)) {
					throw ('config.fields should be an array contains settings for each form field!');
				}

				if(config.action) {
					this.$target.attr('action', config.action);
					if(!config.method) {
						throw ('config.method should be "post" or other avaiable string!');
					}

					this.$target.attr('method', config.method);
				}
				// --参数检查

				var fieldConfigs = config.fields;

				// 如果FormController设置了readOnly属性，则为每一个没有设置readOnly属性的子控件设置该属性
				if (!_.isUndefined(config.readOnly)) {
					for (var i = 0; i < fieldConfigs.length; i++) {
						var fieldConfig = fieldConfigs[i];

						if (_.isUndefined(fieldConfig.readOnly)) {
							fieldConfig.readOnly = config.readOnly;
						}
					}
				}

				// alert area
				var alertArea = $('#alertArea');
				this.alertArea = alertArea;

				this.addBinding(Binding.SUBMIT, 'function(data, event) { return $root["' + ViewModelUtils.OPERATION_ROOT + '"].submit(data, event); }');

				viewModel[ViewModelUtils.OPERATION_ROOT].submit = function(data, event) {
					var result = self.submit(event);
					return result;
				};

				UiUtils.bindControllers.call(this, config, viewModel, UiUtils.BIND_FLAG_CREATE_NODE);

				this.applyViewModelBindings();

			}

			FormController.prototype.getViewModel = function() {
				return this.viewModel;
			};

			FormController.prototype.setDelayBindings = function(delay) {
				this.config.delayBindings = delay;
			};

			FormController.prototype.getValue = function() {
				return this.fromModel(this.viewModel);
			};

			FormController.prototype.validate = function() {
				var config, value, controller, i = 0;
				var COUNT = this.config.fields.length;
				var data = this.getValue();
				var validateResult = true;
				for(; i < COUNT; ++i) {
					controller = this.controllers[i];
					config = this.config.fields[i];

					if(config.type === cKit.DataType.ARRAY) {
						if(cKit.ObjectUtils.hasMethod(controller, 'validateArray')) {
							if(!controller.validateArray(data[config.node], data)) {
								validateResult = false; // failed with field validation
							}
						}
					} else if(config.node && controller.validate(data) === false) {
						validateResult = false; // failed with field validation
					}
				}

				// We need wait for every validator to be passed
				// If anything went wrong, we will abort submit action
				return validateResult;
			};

			FormController.prototype.submit = function() {
				var data = this.getValue();
				var self = this;
				var viewModel = this.getViewModel();
				// validate each field
				var COUNT = this.config.fields.length,
					i = 0,
					controller,
					config,
					value;
				var retResult = true;


				if(!this.validate()) {
					return false;
				}

				var submitResult = false;
				if(this.config.submit) {
					submitResult = (this.config.submit(data) !== false);
				}

				// 如果不是提交式表单，则阻止提交动作
				if(!this.config.action) {
					retResult = false;
				}

				if(!submitResult) {
					retResult = false;
				} else {
					if(this.config.reset) {
						var reset = this.config.reset;
						_.defer(function() {
							if (reset) {
								self.reset();
							}
						});
					}
				}

				return retResult;
			};

			FormController.prototype.showAlert = function(alertContent,status) {
				if (status == 'success') {
					status = 'alert-success';
				}else if (status == 'error') {
					status = 'alert-error';
				}else if (status == 'info') {
					status = 'alert-info';
				}else {
					throw ('the param "status"(second param) in function showAlert must be "success" or "error" or "info"!');
				}

				var alertHtml = '<div class="alert ' + status + '"><button type="button" class="close" data-dismiss="alert">&times;</button>' + alertContent + '</div>';
				this.alertArea.html(alertHtml);
			};

			FormController.prototype.clearAlert = function() {
				this.alertArea.html('');
			};

			FormController.prototype.showNotification = function(notifyHtml) {
				this.notifyArea.html(notifyHtml);
			};

			FormController.prototype.clearNotification = function() {
				this.notifyArea.html('');
			};

			/** 更新Form内部的数据
			 *
			 * @param 新的数据，为js对象
			 *
			 */
			FormController.prototype.update = function(model, flags) {
				// reset the ViewModel
				flags = flags || 0;

				var mergeFlags = flags & FormController.FLAG_MERGE ? ViewModelUtils.FLAG_MERGE : 0;
				if (mergeFlags) {
					this.model = $.extend(true, {}, this.model, model);
				} else {
					this.model = model;
				}
				var viewModel = this.getViewModel();
				ViewModelUtils.fromJS(model, viewModel, null, null, mergeFlags);
				// reset each field in the form to original state
				var fieldConfigs = this.config.fields;
				var COUNT = fieldConfigs.length,
					i = 0,
					fieldConfig,
					controller;
				// reset fields
				for(; i < COUNT; ++i) {

					fieldConfig = fieldConfigs[i];
					controller = this.controllers[i];

					if (_.isFunction(controller.alignCapacity)) {
						controller.alignCapacity();
					}

					controller.reset();
				}
			};

			FormController.prototype.reset = function reset() {
				// clear alert ONLY, notify not included.
				this.update(this.model);
			};

			// 将js对象编程viewModel
			FormController.prototype.toModel = function toModel(config) {
				var model = config.model;
				return ViewModelUtils.toModel(model);
			};

			// 从ViewModel逆转出原始data格式
			FormController.prototype.fromModel = function fromModel(viewModel) {
				var model = ViewModelUtils.toJS(viewModel, ViewModelUtils.EXTRA_NODES);
				return model;
			};

			FormController.prototype.applyViewModelBindings = function applyViewModelBindings () {
				this.applyBindings();
				var self = this;

				var config = this.config;
				function applyBindings() {
					ko.applyBindings(self.viewModel, self.$target.get(0));
					var postCalls = ViewModelUtils.getPostCalls(self.viewModel);
					ViewModelUtils.clearPostCalls(self.viewModel);
					for(var index in postCalls) {
						postCalls[index]();
					}
					postCalls = null;
				}

				// no config.delayBindings
				applyBindings();
			};

			FormController.prototype.getControllerById = function getControllerById (controllerId) {
				var viewModel = this.getViewModel();
				var formControllers = viewModel[ViewModelUtils.CONTROLLER_ROOT];
				if (formControllers[controllerId]){
					return formControllers[controllerId];
				}else {
					throw 'can not find controller with id "'+ controllerId +'"';
				}
			};

			FormController.prototype.getControllerByUid = function getControllerByUid (controllerUid) {
				var viewModel = this.getViewModel();
				var formControllers = viewModel[ViewModelUtils.CONTROLLER_ROOT];

				var controllerId = this.config.id + "_" + controllerUid;

				if (formControllers[controllerId]) {
					return formControllers[controllerId];
				} else {
					throw 'can not find controller with uid "'+ controllerUid +'"';
				}
			};

			FormController.FLAG_MERGE = ViewModelUtils.FLAG_MERGE;

			return FormController;
		}) (ViewController);

		var DiffUtils = {
			toString: function toString(obj, defaults) {
				if(_.isUndefined(obj) || _.isNull(obj)) {
					return defaults;
				} else {
					return '' + obj;
				}
			},

			diff: function(model1, model2) {
				// 有可能有undefined的情况，按null处理
				if(_.isUndefined(model1)) {
					model1 = null;
				}
				if(_.isUndefined(model2)) {
					model2 = null;
				}

				// 如果两个节点都是null,则返回null
				if(model1 === model2 && model1 === null) {
					return null;
				}

				var isArray = false;		// 手否为数组
				if(_.isArray(model1) || _.isArray(model2)) {
					// 只要其中一个是数组,我们就认为这个字段是个数组
					isArray = true;
				} else if((model1 !== null || model2 !== null) && (!ValueUtils.isTypeofObject(model1) || !ValueUtils.isTypeofObject(model2))) {
					// 两个中的一个原始类型的话
					model1 = DiffUtils.toString(model1, '');
					model2 = DiffUtils.toString(model2, '');
					if(model1 !== model2) {
						if(model1.length > 0) {
							if(model2.length > 0) {
								return model1 + '&nbsp;<span class="label label-info">' + model2 + '</span>';
							} else {
								return '<span class="label label-important"><del>' + model1 + '<del></span>';
							}
						} else if(model2.length > 0) {
							return '<span class="label label-success">' + model2 + '</span>';
						}

						return model1;
					} else {
						return model1;
					}
				}

				// 从这段开始,只有数组或者对象,两种可能
				if(model1 === null) {
					model1 = isArray ? [] : {};
				}
				if(model2 === null) {
					model2 = isArray ? [] : {};
				}

				var result = isArray ? [] : {};
				var keys = _.union(_.keys(model1), _.keys(model2));
				var index = null;
				var key, value1, value2, value;
				for(index in keys) {
					key = keys[index];
					value1 = model1[key];
					value2 = model2[key];
					value = DiffUtils.diff(value1, value2);
					if(isArray) {
						result.push(value);
					} else {
						result[key] = value;
					}
				}
				return result;
			},

			/**
			 *  数组转化函数，使得两个数组中相同的元素的下标相同
			 *
			 *  @param array1 对比数组中左边的数组
			 *  @param array2 对比数组中右边的数组
			 *
			 * 	返回一个包含两个元素的数组分别为转化后的 array1和array2
			 */
			constructDiffArrays : function constructDiffArrays(array1, array2){
				var result = [];

				//转化后的新数组
				var array1Trancefer = [];
				var array2Trancefer = [];

				//需要转化的数组的深拷贝
				var array1Cache = cKit.CommonUtils.arrayDeepCopy(array1);
				var array2Cache = cKit.CommonUtils.arrayDeepCopy(array2);

				var i, j ;
				for (i = 0; i < array1.length; i++) {
					var item1 = array1[i];
					for(j = 0; j < array2.length; j++) {
						var item2 = array2[j];
						if (item1.id == item2.id) {
							array1Trancefer.push(item1);
							array2Trancefer.push(item2);
							array1Cache.splice(array1Cache.indexOf(item1),1);
							array2Cache.splice(array2Cache.indexOf(item2),1);
						}
					}
				}

				for (i = 0; i < array1Cache.length; i++) {
					array1Trancefer.push(array1Cache[i]);
				}

				for (j = 0; j < array2Cache.length; j++) {
					array2Trancefer.push(array2Cache[j]);
				}

				/*array1 = array1Trancefer;
				 array2 = array2Trancefer;*/

				result.push(array1);
				result.push(array2);

				return result;
			}
		};

		var DEFAULT_DIFF_FORM_CONTROLLER = {
			originalModel: null,		// 原来的config.model
			diffModel: null				// 另一个model
		};

		var DiffFormController = (function (_super) {
			cKit.__extends(DiffFormController, _super);
			function DiffFormController (config1, config2) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, config2, DEFAULT_DIFF_FORM_CONTROLLER);

				if(config.diffModel && config.model) {
				} else {
					throw '"Config.diffModel" and "Config.model" should not be null!';
				}

				config.originalModel = config.model;
				config.model = DiffUtils.diff(config.originalModel, config.diffModel);

				_super.call(this, config);
			}

			DiffFormController.prototype.updateModels = function updateModels(originalModel, diffModel) {
				var config = this.config;
				config.originalModel = originalModel;
				config.diffModel = diffModel;

				var model = DiffUtils.diff(config.originalModel, config.diffModel);
				this.update(model);
			};

			return DiffFormController;
		}) (FormController);

		/**
		 *  FormController 工具类
		 *
		 *  支持自动生成控件，条件是html中所有需要自动生成的控件 id 遵循格式 : (父组件id)_(自己的id)
		 */
		var FormUtils = {

			autoCreateFields : ['INPUT', 'LABEL', 'SPAN'],

			fieldMap: {
				'input' : {
					'text': {
						fieldType: Controller.EDIT
					},
					'textarea': {
						fieldType: Controller.TEXT_AREA
					},
					'checkbox': {
						fieldType: Controller.CHECK_BOX
					},
					'button': {
						fieldType: Controller.BUTTON
					}
				},
				'div': {
					null: {
						fieldType: Controller.FIELD_GROUP
					}
				},
				'button': {
					'button': {
						fieldType: Controller.BUTTON
					},
					null: {
						fieldType: Controller.BUTTON
					}
				}
			},

			autoCreateFieldType : {
				INPUT : Controller.EDIT_CONTROLLER,
				LABEL : Controller.LABEL_CONTROLLER,
				SPAN : Controller.LABEL_CONTROLLER
			},

			/** 根据fields配置，为node节点的所有子节点生成配置
			 */
			createFieldConfigs : function createFieldConfigs(scopeId, node, fields) {
				//判断是否是元素节点  
				if(node.nodeType == 1){
					var ignoreChildNodes = false;
					var nodeName = node.nodeName.toLowerCase();
					var idNode = node.attributes['id'] || null;
					var typeNode = node.attributes['type'] || null;
					var uidNode = node.attributes['uid'] || null;

					//获得id属性节点
					var id = idNode ? idNode.nodeValue : null,
						uid = uidNode ? uidNode.nodeValue : null,
						type = typeNode ? typeNode.nodeValue : null;
					type = _.isString(type) ? type.toLowerCase() : null;
					if(uid) {
						id = scopeId + '_' + uid;
					}

					var idPoint = id ? id.substring(0,id.lastIndexOf('_')) : null;
					if (idPoint == scopeId){
						var fieldMap = this.fieldMap;
						var nodeMap = null;
						var fieldType = Controller.LABEL;

						if(nodeMap = fieldMap[nodeName]) {
							var typeMap = null;
							if(typeMap = nodeMap[type]) {
								fieldType = typeMap.fieldType;
							}
						}

						var subFields = [];
						if(id) {
							scopeId = id;
						} else if(uid) {
							scopeId = scopeId + '_' + id;
						}

						if(node.hasChildNodes) {
							ignoreChildNodes = true;
							var childNodes = node.childNodes;
							for (var i = 0; i < childNodes.length; i++) {
								var childNode = childNodes.item(i);
								this.createFieldConfigs(scopeId, childNode, subFields);
							}
						}

						var idPostfix = id.substring(id.lastIndexOf('_') + 1, id.length);
						fields.push({
							id: id,
							uid: uid,
							node: idPostfix,
							type: fieldType,
							fields: subFields.length > 0 ? subFields : null
						});
					}
					//判断该元素节点是否有子节点 (出口) 
					if(!ignoreChildNodes && node.hasChildNodes){
						var childNodes = node.childNodes;
						for (var i = 0; i < childNodes.length; i++) {
							var childNode = childNodes.item(i);
							this.createFieldConfigs(scopeId, childNode, fields);
						}
					}
				}
			},

			generateFields : function generateFields (scopeId, manualConfigs){

				manualConfigs = manualConfigs || [];
				if (arguments.length != 2 && (!_.isString(scopeId) || (manualConfigs && !_.isArray(manualConfigs)))) {
					throw 'this function need two params, first must be a String and the other must be an Array';
				}

				var configs = [];

				var rootElement = document.getElementById(scopeId);
				this.createFieldConfigs(scopeId, rootElement, configs);

				configs = this.getMergedConfigs(configs, manualConfigs);

				// 打印fields属性，线上环境应该去掉
				log.d(cKit.ObjectUtils.dump(configs));

				return configs;
			},

			getMergedConfigs: function getMergedConfigs (autoConfigs, manualConfigs) {
				autoConfigs = autoConfigs || [];
				manualConfigs = manualConfigs || [];

				var autoConfigsLength = autoConfigs.length;
				var manualConfigsLength = manualConfigs.length;
				var configs = [];

				for (var j = 0; j < autoConfigsLength; j++) {
					var foundFlag = false;
					var autoConfig = autoConfigs[j];
					for (var i = 0; i < manualConfigs.length; i++) {
						var manualConfig = manualConfigs[i];
						if ((manualConfig.id && autoConfig.id && (manualConfig.id === autoConfig.id))
							|| (manualConfig.uid && autoConfig.uid && (manualConfig.uid === autoConfig.uid))) {
							foundFlag = true;
							var mergedConfig = ConfigUtils.mergeConfig(manualConfig, autoConfig);

							if(_.isArray(manualConfig.fields) || _.isArray(autoConfig.fields)) {
								mergedConfig.fields = this.getMergedConfigs(autoConfig.fields, manualConfig.fields);
							}
							configs.push(mergedConfig);
						}
					}
					if(!foundFlag) {
						configs.push(autoConfig);
					}
				}

				return configs;
			},

			generateDefaultConfig : function generateDefaultConfig(autoCreateElement){
				var autoCreateConfig = {
					id: autoCreateElement.id,
					type: FormUtils.autoCreateFieldType[autoCreateElement.type],
					node: autoCreateElement.node

				};
				//若html存在_hint域，则默认给控件加上 非空验证 FIXME 可不要
				if (autoCreateElement.type === 'INPUT' && $('#' + autoCreateElement.id + '_hint').length > 0) {
					autoCreateConfig.validators = [Validator.NONEMPTY];
				}

				return autoCreateConfig;
			}
		};


		//全局变量
		var PageController = (function (_super) {
			cKit.__extends(PageController, _super);
			function PageController(page) {
				if(!page) {
					throw ('Incorrect parameter(s): when calling PageController(Object page)!');
				}

				/* Page initialization
				 */
				$('input, textarea').placeholder();

				window.currentPage = function currentPage() {
					return window.page;
				};

				window.page = page;
			}
			return PageController;
		}) (cKit.CoreObject);


		var ConfirmDialog = (function(_super) {
			cKit.__extends(ConfirmDialog, _super);
			var thiz;
			function ConfirmDialog(id, config) {
				_super.call(this, id, config);

				thiz = this;
			}
			return ConfirmDialog;
		})(Dialog);

		//三个参数 description：string fnYes:fn fnNo:fn
		var Confirm = function(config){
			window.systermCommonConfirmDialog = new ConfirmDialog("commonConfirmDialog",{});
			var description = config.des;
			$("#commonConfirmDialogBtnYes").unbind("click");
			$("#commonConfirmDialogBtnNo").unbind("click");
			$("#commonConfirmDialogDescription").html("");

			$("#commonConfirmDialogDescription").html(description);
			$("#commonConfirmDialogBtnYes").bind("click",function(){

				systermCommonConfirmDialog.hide();
				if(config.fnYes){
					config.fnYes();
				}
			});
			$("#commonConfirmDialogBtnNo").bind("click",function(){
				systermCommonConfirmDialog.hide();
				if(config.fnNo){
					config.fnNo();
				}
			});
			systermCommonConfirmDialog.show();
			return systermCommonConfirmDialog;
		};


		var AlertDialog = (function(_super) {
			cKit.__extends(AlertDialog, _super);
			var thiz;
			function AlertDialog(id, config) {
				_super.call(this, id, config);

				thiz = this;
			}
			return AlertDialog;
		})(Dialog);

		//只要一个参数 config.des
		var AlertDlg = function(config){
			var alertDialog = new AlertDialog('alertDialog', {});
			var description = config.des;
			$("#alertDialogBtnOk").unbind("click");
			$("#alertDialogDescription").html("");

			$("#alertDialogDescription").html(description);
			$("#alertDialogBtnOk").bind("click",function(){
				if(config.fnOk){
					config.fnOk();
				}
				alertDialog.hide();
			});
			alertDialog.show();
		};

		///// 暴露的东西
		return {
			Validator: Validator,
			Alert: Alert,
			AlertDlg: AlertDlg,
			Icon: Icon,

			Dialog: Dialog,
			Confirm: Confirm,
			// New Components
			WidgetController: WidgetController,
			NodeController: NodeController,
			ButtonController: ButtonController,
			LabelController: LabelController,
			EditController: EditController,
			TextAreaController: TextAreaController,
			CheckBoxController: CheckBoxController,
			RadioGroupController: RadioGroupController,
			CheckBoxGroupController: CheckBoxGroupController,
			SelectController: SelectController,
			TimePickerController: TimePickerController,
			TableController: TableController,
			MultipartSelectController: MultipartSelectController,

			// Forms		
			FormController: FormController,
			DiffFormController: DiffFormController,
			FormUtils : FormUtils,
			Controller: Controller,


			// Page Component
			PageController: PageController,

			internal: {
				KoUtils: KoUtils,
				ViewModelUtils: ViewModelUtils,
				DiffUtils: DiffUtils,
				UiUtils: UiUtils,
				ConfigUtils: ConfigUtils
			}
		};

		/* Controller继承关系
		 WidgetController
		 Dialog
		 ViewController
		 FieldController
		 AutoCompleteController
		 ButtonController
		 CheckBoxController
		 ChooserGroupController
		 CheckBoxGroupController
		 RadioGroupController
		 DatePickerController
		 DateRangePickerController
		 FieldGroupController
		 InputController
		 EditController
		 FilterEditController
		 LabelController
		 TableHeadController
		 MultipartSelectController
		 QuantityEditController
		 SelectController
		 TableController
		 TimePickerController
		 TimeRangePickerController
		 FormController
		 DiffFormController
		 */
	});
