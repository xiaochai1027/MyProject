define(['jquery', 'underscore', 'l10n',		// 这些很基础, 肯定有强依赖
		'knockout', 'coreKit', 'networkKit', 'jquery-placeholder',
		// Some module don't need for a variable
		'bootstrap', 'bootstrap-autocomplete', 'bootstrap-modal', 'datetimepicker', 'daterangepicker', 'jqgrid'],
	function($, _, l10n, ko, cKit, netKit) {
		// 配置
		var VERSION = '0.2.0';
		var CONFIG = {
			BINDING_DELAY_MS: 33,	// ko对chrome类浏览器种，自动填充表格支持不良，过早绑定会导致填充结果无法反映到viewModel种，这个参数用来控制绑定延时
			IE_VERSION: ko.utils.ieVersion
		};
	var commonHeader = {
		"shbj-device":"BROWSER"
	};
		/**
		 * 设置jqGrid默认属性
		 */
		$.extend($.jgrid.defaults, {
			autowidth: true,
			datatype : "local",
			gridview : true,
			height : 'auto',
			hidegrid : false,
			ajaxGridOptions:{
				headers : commonHeader,
				xhrFields: {
					withCredentials: true
				}
			},
			jsonReader : {
				total : 'totalPage',
				page : 'pageNumber',
				records : 'recordNumber',
				repeatitems : false
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

		//'use strict';

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
			TITLE: 'title',
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

			// title 属性控制
			ko.bindingHandlers.title = {
				init: function(element, valueAccessor, allBindingsAccessor, context) {
					var observable = valueAccessor();
					var value = ko.utils.unwrapObservable(observable);

					element.title = value;
				},

				update: function(element, valueAccessor, allBindingsAccessor, context) {
					var observable = valueAccessor();
					var value = ko.utils.unwrapObservable(observable);

					element.title = value;
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

		/** 方向
		 *
		 */
		var Orientation = {
			VERTICAL: 0,
			HORIZONTAL: 1
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
					if (_.isString(text)) return true;
					return false;
				});
			};

			Validator.createWithNumericRegEx = function createWithNumericRegEx (message, regex) {
				var _regex = regex;
				return Validator.create(message, function(text) {
					if (text) {
						return (regex.test(text) || (text =='0'));
					}

					return false;
				});
			};
			Validator.createWithNumeric2RegEx = function createWithNumericRegEx (message, regex) {
				var _regex = regex;
				return Validator.create(message, function(text) {
					var num = 0.0;
					try {
						num = parseFloat(text);
					} catch (e) {
						return false;
					}
					if(('' + num).indexOf('.') < 0) {
						text = num + '.00';
					}

					var rr = regex.test(text);

					return rr && (num > 0.000001);

				});
			};
			// 自定义
			Validator.DEFINE = Validator.create;

			// 不验证
			Validator.NULL = Validator.create(message.nullValidator,
				function(text) {
					return true;
				});

			// 非空验证器
			Validator.NONEMPTY = Validator.create(message.nonemptyValidator,
				function(text) {
					var str = Validator.Utils.toString(text);

					if(str.length > 0) {
						if (str == 'NONE') {
							return false;
						}
						return true;
					} else {
						return false;
					}
				});

			//非0验证器
			Validator.NONZERO = Validator.create(message.nonzeroValidator,
				function(text) {
					var str = Validator.Utils.toString(text);

					if(parseInt(str) == 0) {
						return false;
					}
					return true;
				});

			// 可以为空的订单号验证器
			Validator.ORDER_NUMBER = Validator.create(message.orderNumberValidator,
				function(text) {
					var str = Validator.Utils.toString(text);
					var regex =  /(^\d-(\d{4})-\d{6}$)|(^\d{6}$)/;
					if(str) {
						return regex.test(str);
					};
					return true;
				});


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
			//登录名验证器  第一位为字母 6-20位数字字母下划线组成

			Validator.LOGIN_NAME2 = Validator.create(message.loginNamValidator2,
				function (text) {
					var str = Validator.Utils.toString(text);
					var regx = /(^[a-zA-Z]{1})([a-zA-Z0-9_]{5,19})/g;
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
			// 固定电话验证器
			Validator.FIXED_LINE = Validator.create(message.fixedLineValidator,
				function(text, model) {
					if(model.regionCode || model.phoneNumber || model.extension) {
						return cKit.ValueUtils.isValidFixedLine(model.regionCode, model.phoneNumber, model.extension);
					}
					return true;
				});

			// 固定电话验证器
			Validator.NONEMPTY_FIXED_LINE = Validator.create(message.fixedLineValidator,
				function(text, model) {
					return cKit.ValueUtils.isValidFixedLine(model.regionCode, model.phoneNumber, model.extension);
				});

			// 条形码验证器
			Validator.BARCODE = Validator.createWithNumericRegEx(message.barcodeValidator,
				/^((\d{13})|(\d{6})|(\d{8}))$/);

			// 小数验证器（可为负）
			Validator.NUMERIC = Validator.createWithNumericRegEx(message.numericValidator,
				/^[-+]?[0-9]+(\.[0-9]{0,2})?$/);
			// 整数验证器（可为负）
			Validator.INTEGER = Validator.createWithNumericRegEx(message.integerValidator,
				/^[1-9]+[0-9]*$/);
			// 整数验证器（可为负）
			Validator.POSITIVE_INTEGER = Validator.createWithNumericRegEx(message.positiveIntegerValidator,
				/^[1-9]+[0-9]*$/);
			// 经度验证器
			Validator.LONGITUDE = Validator.createWithRegEx(message.longitudeValidator,
				/^[1-9]{1}[0-9]{1,2}\.[0-9]{0,6}$/);
			// 纬度验证器
			Validator.LATITUDE = Validator.createWithRegEx(message.latitudeValidator,
				/^[1-9]{1}[0-9]{1,2}\.[0-9]{0,6}$/);
			// 手机号验证器
			Validator.MOBILE = Validator.createWithRegEx(message.mobileValidator,
				/^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(16[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/);
		// 1-8的正数验证器
		Validator.NONPOSITIVE_laborHour = Validator.createWithNumericRegEx(message.laborHourNumericValidator,
			/^[1-8]/);

			Validator.EMAIL = Validator.createWithRegEx(message.emailValidator,
				/^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/);

			// 非负小数验证器
			Validator.NONPOSITIVE_NUMERIC = Validator.createWithNumericRegEx(message.nonPositiveNumericValidator,
				/^[0-9]+((\.[0-9]{0,2}))?$/);

			// 大于0的小数验证器
			Validator.NONPOSITIVE_NUMERIC2 = Validator.createWithNumeric2RegEx(message.nonPositiveNumericValidator,
				/^([0-9]+(\.[0-9]{0,2}))?$/);
			//可为空手机号验证
			Validator.ALLOW_Empty_MOBILE = Validator.create(message.mobileValidator,
				function (text,model) {
					if(cKit.ValueUtils.isEmpty(text)) {
						return true;
					} else {
						return cKit.ValueUtils.isValidMobile(text);
					}
				}
			);


			//TODO 正小数验证器


			//TODO 正整数验证器

			/** 选项数量验证器
			 *
			 * @param min 最小选择数量
			 * @param max 最大选择数量，可以不给出
			 */
			Validator.CAPACITY = function(min, max) {
				if(min === undefined || !_.isNumber(min)) {
					throw ('Params should be numbers!');
				}
				if(max === undefined) {
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
						var value = parseInt(text)

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

			//字符串长度验证器
			Validator.STRLENGTH = function(strlength) {
				if (!_.isNumber(strlength)) {
					throw ('Params should be numbers!');
				}
				var errorMessage = message.invalidStringLength.format(strlength);
				return Validator.create(errorMessage,
					function(text) {
						if(_.isString(text) && text.length == strlength) {
							return true;
						}
						return false;
					}
				);
			}

			Validator.MAXLENGTH = function(strlength) {
				if (!_.isNumber(strlength)) {
					throw ('Params should be numbers!');
				}
				var errorMessage = message.invalidStringLength.format(strlength);
				return Validator.create(errorMessage,
					function(text) {
						if(_.isString(text) && text.length <= strlength) {
							return true;
						}
						return false;
					}
				);
			}

			/** 重复性验证器
			 *
			 * @param id 一个控件的id, 内容将通过.val()函数获得，并且保证与之一致
			 *
			 */
			Validator.REPEAT = function(id) {
				return Validator.create(message.repeatValidator,
					_.bind(function(text) {
						var str = text;
						var str2 = $('#' + id).val();

						if(str === str2) {
							return true;
						} else {
							return false;
						}
					},  {id: id}));
			};
		}) ();


		var Utils = {
			displayError: function displayError(widget, error) {
				$('#' + widget).css('visibility', 'visible').text(error);
			},

			hideWidget: function hideWidget(widget) {
				$('#' + widget).css('visibility', 'hidden');
			},

			hideAllWidgets:	function hideAllWidgets(widgets) {
				for (var i in widgets) {
					var widget = widgets[i];
					$('#' + widget).css('visibility', 'hidden');
				}
			}
		};

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
			findControlsTag: function(target, id) {
				var foundControlElement = false;
				var groupId = id + '_group';
				// 寻找controls节点
				while(target.length && target.length > 0) {
					if(target.hasClass('controls')) {
						foundControlElement = true;
						break;
					} else if(target.attr('id') === groupId) {
						break;
					}
					target = $(target.get(0).parentElement);

				}
				if(!foundControlElement) {
					throw 'We can not find class="controls" element for id="' + id + '"!';
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


				var bind = config.bind;

				var fieldConfigs = config.fields;

				var COUNT = fieldConfigs.length,
					i = 0,
					fieldConfig,
					fieldId,
					isArray;

				/** 遍历所有的field配置，对field进行初始化
				 */
				this.fields = new Array(COUNT);
				for(; i < COUNT; ++i) {
					fieldConfig = fieldConfigs[i];
					fieldId = fieldConfig.id;
					if(!fieldConfig.type) {
						fieldConfig.type = ControllerFactory.LABEL_CONTROLLER;
						//throw ('config.fields[' + fieldId + '] with id[' + fieldConfig.id + '] missing with field type[ControllerFactory.?]!');
					}

					bind = fieldConfig.bind;

					if (fieldConfig.hasOwnProperty('bind') && bind.hasOwnProperty('type') && (bind.type === cKit.DataType.ARRAY))  {
						isArray = true;
					} else {
						isArray = false;
					}

					fieldConfig.parent = this;
					var controller = ControllerFactory.CreateController(fieldConfig.type, fieldConfig);
					this.fields[i] = controller;
					/**
					 *  data_bind 的操作 全部移至各个控件的构造函数中
					 */

					if (isArray) {
						if(!bind.data) {
							throw ('config.bind need a data field to indentify the data binding role.');
						}

						var capacity = bind.capacity;
						if(_.isNull(capacity) || _.isUndefined(capacity)) {
							var observableArray = this.getNode(viewModel);
							if(_.isFunction(observableArray)) {
								observableArray = observableArray();
							}
							observableArray = observableArray[bind.data];
							bind.capacity = observableArray().length;
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
							value: controller.getNodeName(viewModel)
						}], viewModel);


						/* 增加值更新监听器,这个监听器主要是解决, 在ko中,ObservableArray如果含有的数据
						 * 都是原始数据类型,并非复合对象(忽略是否被observable包裹);则在数据值通过
						 * inputbox等控件更新后,并不会反应到数组元素上来的问题.
						 */
						if(controller.target) {
							controller.addBinding(Binding.CHANGE, 'function(data, event) { return $root["' + ViewModelUtils.OPERATION_ROOT + '"].' + fieldId + '_array_element_update($parent, $index(), $element); }');

							// 值改变的处理函数
							viewModel[ViewModelUtils.OPERATION_ROOT][fieldId + '_array_element_update'] = function(array, arrayIndex, element) {
								// console.log('update_array_element_field_' + fieldId);
								// 这里只能通过dom操作或者jQuery操作获取值,并不能通过ko
								var itemValue = element.value;
								// 这里值更新可以，但是删除和添加无效; 原因不明
								array.splice(arrayIndex, 1, itemValue);
								return true;
							};
						}
					}

					// 对field对象进行数据绑定
					if(createNodeFlags === UiUtils.BIND_FLAG_CREATE_NODE) {
						controller.createNode(viewModel);
					}
					controller.applyBindings(viewModel);

					// 如果是数组的情况,会产生多个controls节点,其中包括了很多重复的id,需要在foreach产生出多个节点之前移除id
					if(isArray) {
						controller.clearTargetIds();
					}

					/** 删除按钮
					 *
					 */
					if(isArray && this.fields[i].removeTarget) {
						// bind for-each data binders
						var removeTarget = this.fields[i].removeTarget;
						UiUtils.applyBindingsForObject(removeTarget, config, [
							{
								key: Binding.VISIBLE,
								value: '$root["' + ViewModelUtils.OPERATION_ROOT + '"].' + fieldId + '_remove_field_visible($root["' + ViewModelUtils.OPERATION_ROOT + '"].self, "'+ fieldId + '", $parent.length, $parentContext, "' + fieldConfig.bind.data + '", $root)'
							},
							{
								key: Binding.CLICK,
								value: 'function(data, event) {$root["' + ViewModelUtils.OPERATION_ROOT + '"].' + fieldId + '_remove_field_click($root["' + ViewModelUtils.OPERATION_ROOT + '"].self, "' + fieldId + '", $parentContext, "' + fieldConfig.bind.data + '", $root, $index());}'
							}], viewModel);

						// 删除按钮是否可见
						viewModel[ViewModelUtils.OPERATION_ROOT][fieldId + '_remove_field_visible'] = function(self, fieldId, length, nodeContext, nodeName, viewModel) {
							var root = nodeContext.$parent;	// 指向数组的父元素
							var arrayNode = root[nodeName];
							var controller = viewModel[ViewModelUtils.CONTROLLER_ROOT][fieldId];
							var config = controller.config;
							var bind = config.bind;

							// 直接设置数据内容时，添加按钮得不到更新
							var addFunc = viewModel[ViewModelUtils.OPERATION_ROOT][fieldId +  'add_field_visible_update'];
							if(_.isFunction(addFunc)) {
								addFunc(self, fieldId, arrayNode, nodeName, viewModel);
							}
							if(!bind.readOnly && length > bind.capacityMin) {
								return true;
							}


							return false;
						};

						// 删除按钮,删除当前index的数据元素
						viewModel[ViewModelUtils.OPERATION_ROOT][fieldId + '_remove_field_click'] = function(self, fieldId, nodeContext, nodeName, viewModel, arrayIndex) {
							// console.log(fieldId + 'remove_field_click');
							var root = nodeContext.$parent;	// 指向数组的父元素
							var arrayNode = root[nodeName];
							var controller = viewModel[ViewModelUtils.CONTROLLER_ROOT][fieldId];

							arrayNode.splice(arrayIndex, 1);
							viewModel[ViewModelUtils.OPERATION_ROOT][fieldId +  '_add_field_visible_update'](self, fieldId, arrayNode, nodeName, viewModel);
						};
					}

					if(isArray) {
						// 添加按钮
						var addButton = $('#' + fieldConfig.id + '_add');
						if(addButton && addButton.length > 0) {
							UiUtils.applyBindingsForObject(addButton, config, [{
								key: Binding.VISIBLE,
								value: '$root["' + ViewModelUtils.OPERATION_ROOT + '"].' + fieldId +  '_add_field_visible()'
							}, {
								key: Binding.CLICK,
								value: 'function(data, event) {$root["' + ViewModelUtils.OPERATION_ROOT + '"].' + fieldId + '_add_field_click($root["' + ViewModelUtils.OPERATION_ROOT + '"].self, "' + fieldConfig.id + '", $parent, "' + fieldConfig.bind.data + '", $root);}'
							}], viewModel);

							// 添加按钮可见性控制变量
							viewModel[ViewModelUtils.OPERATION_ROOT][fieldId +  '_add_field_visible'] = ko.observable(true);

							/** 更新添加按钮的可见性
							 *
							 */
							viewModel[ViewModelUtils.OPERATION_ROOT][fieldId +  '_add_field_visible_update'] = function(self, fieldId, arrayNode, nodeName, viewModel) {
								// console.log(fieldId +  '_add_field_visible_update');
								var controller = viewModel[ViewModelUtils.CONTROLLER_ROOT][fieldId];
								var bind = controller.config.bind;
								var root = controller.getNode(viewModel);
								var addButtonVisible = viewModel[ViewModelUtils.OPERATION_ROOT][fieldId +  '_add_field_visible'];
								var length = root ? root().length : 0;
								if(!bind.readOnly && length < bind.capacityMax) {
									return addButtonVisible(true);
								} else {
									return addButtonVisible(false);
								}
							};

							// 添加按钮的处理函数
							viewModel[ViewModelUtils.OPERATION_ROOT][fieldId + '_add_field_click'] = function(self, fieldId, node, nodeName, viewModel) {
								// console.log(fieldId + '_add_field_click');
								// 主要思路,寻找到数组对象,进行添加,并更新添加按钮可见性
								// 删除按钮的可见性将会被自动触发更新
								var controller = viewModel[ViewModelUtils.CONTROLLER_ROOT][fieldId];
								var defaults = controller.config.bind.defaults;
								var arrayNode = controller.getNode(viewModel);//node[nodeName];
								var item;
								if(Object.prototype.toString.call(defaults).slice(8, -1) === 'Object') {
									item = _.clone(defaults);
								} else {
									item = defaults;
								}
								arrayNode.push(item);
								viewModel[ViewModelUtils.OPERATION_ROOT][fieldId +  '_add_field_visible_update'](self, fieldId, arrayNode, nodeName, viewModel);
							};

							viewModel[ViewModelUtils.OPERATION_ROOT][fieldId +  '_add_field_visible_update'](this, fieldId, controller.getNode(viewModel), controller.config.bind.data, viewModel);
						}

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
			applyBindingsForObject: function applyBindingsForObject(target, config, bindings, viewModel, flags) {
				var bindingMap = config.bindingMap || {};

				if(!target.hasOwnProperty('length')) {
					throw ('"target" should be a jQuery object!');
				}

				if(!_.isArray(bindings)) {
					throw ('"bindings" should be an array!');
				}

				if(bindings.length > 0) {
					var bindContext = [];	// index -> obj
					var bindMap = [];		// index -> string

					function getBindingContent(context, map, obj) {
						var index = context.indexOf(obj);
						if(index >= 0) {
							return map[index];
						} else {
							context.push(obj);
							map.push('');
							return map[map.length - 1];
						}
					}

					function setBindingContent(context, map, obj, content) {
						var index = context.indexOf(obj);
						if(index >= 0) {
							map[index] = content;
						} else {
							throw 'Can not find content!';
						}
					}

					for(var index in bindings) {
						var binding = bindings[index];

						if(!binding.hasOwnProperty('key') || !binding.hasOwnProperty('value')) {
							throw ('Missing binding key or value for binding[' + index + '], which is ' + binding);
						}

						var value = binding.value;
						if(viewModel && _.isFunction(value)) {
							viewModel[ViewModelUtils.OPERATION_ROOT][config.id + '_' + binding.key] = value;
							var prefix = '';
							var suffix = '';
							var param = '';
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
									param = 'data, $root, event' + (flags & UiUtils.BIND_FLAG_INSIDE_FOREACH === true ? ', $index()' : '');
									break;
								case Binding.VISIBLE:
									param = '$data, $root';
									break;
								default:
									param = '$data, $root';
									break;
							}
							// 生成跳转
							value = prefix + '$root["' + ViewModelUtils.OPERATION_ROOT + '"].' + config.id + '_' + binding.key + '.call($element, ' + param + ')' + suffix;
						}
						var bindTarget = null;

						// 如果flag有BIND_FLAG_USE_BINDING_MAP就都绑定到target上
						if(flags & UiUtils.BIND_FLAG_USE_BINDING_MAP) {
							bindTarget = bindingMap[binding.key];
						}

						if(!bindTarget || bindTarget.length < 1) {
							bindTarget = target;
						}

						var bindingContent = getBindingContent(bindContext, bindMap, bindTarget);
						bindingContent += (bindingContent.length > 0 ? ', ' : '') + binding.key + ': ' + value;
						setBindingContent(bindContext, bindMap, bindTarget, bindingContent);
					}

					for(var i in bindContext) {
						bindTarget = bindContext[i];
						bindingContent = bindMap[i];

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


		var ViewModelUtils = {
			/** 附加节点
			 */
			BINDING_ROOT: 'uiKit_bindings',			// 绑定的额外值,比如options等等
			OPERATION_ROOT: 'uiKit_operations',		// 绑定的各种操作
			CONTROLLER_ROOT: 'uiKit_controllers',	// 当前viewModel所指向的FormController的所有Controller
			EXTRA_ROOT: 'extra',					// 给外接扩展用的节点，这个节点会体现到viewModel上，但不会变成observable，并且转换回对象时会自动去除这个节点

			FLAG_MERGE_WITH_VIEW_MODEL: 0x2,		// 更新viewModel时，只是想新数据添加进去，并不影响旧有节点，当节点相同，则做值覆盖

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

				viewModel = viewModel || (_.isArray(root) ? [] : {});
				var viewModelValue = null;
				var value = null;
				var attr = null;
				var array, element, index;

				// 如果是数组,则直接返回一个observableArray
				if(_.isArray(root)) {
					value = root;
					array = KoUtils.isObservableArray(viewModel) && viewModel() != null ? viewModel : ko.observableArray([]);
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

					if((flags & ViewModelUtils.FLAG_MERGE_WITH_VIEW_MODEL) && !root.hasOwnProperty(p)) {
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
						if(KoUtils.isComputed(viewModel[p])) {
							viewModelValue = viewModel[p]();
						} else {
							viewModelValue = viewModel[p];
						}

						value = ViewModelUtils.fromJS(attr, viewModelValue, null, true, flags);
					} else {
						value = attr;
					}

					if(KoUtils.isObservableArray(value)) {
						if(!KoUtils.isObservableArray(viewModel[p]) || viewModel[p]() == null) {
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
				var res = ViewModelUtils.fromJS(model, null, [ViewModelUtils.EXTRA_ROOT]);

				// 附加节点
				if(this.operation) {
					res[ViewModelUtils.OPERATION_ROOT] = this.operation;
				} else {
					res[ViewModelUtils.OPERATION_ROOT] = {};
				}
				res[ViewModelUtils.OPERATION_ROOT].postCalls = [];
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

		///////////////////////////////// UI Kit Framework //////////////////////////////////////////


		//////////////////////////////////////////=================================== NEW COMPONENTS

		var DEFAULT_WIDGET_CONTROLLER_CONFIG = {
			self: null,		// 指向自己
			bind: {
			}
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

				if(!this.config.id) {
					throw ('At least a widget needs an id config spec for identification!');
				}
				this.target = $('#' + this.config.id);
				var target = this.target;

				if(target.length != 1) {
					throw ('Can not indentify the id with [' + config.id + ']');
				}
				// init value/text
				if(config.value) {
					target.attr('value', config.value);
				}
				if(config.text) {
					try {
						target.text(config.text);
					} catch(e) {
					}
				}

			}

			/** 禁用控件
			 *
			 */
			WidgetController.prototype.disable = function () {
				if(!this.target) {
					throw ('BUG! We need a target!');
				}

				this.target.addClass('disabled');
			};

			/** 使能控件,使控件可以使用
			 *
			 */
			WidgetController.prototype.enable = function () {
				if(!this.target) {
					throw ('BUG! we need a target!');
				}
				this.target.removeClass('disabled');
			};

			/** 更新操作目标
			 *
			 * 获取所有需要操作的目标，比如target只想当前的控件，
			 * groupTarget指向当前控件组件（外围，参考control-group）
			 */
			WidgetController.prototype.updateTarget = function() {
				this.target = $('#' + this.config.id);
			};

			WidgetController.prototype.updateConfig = function(config) {
				var conf = ConfigUtils.mergeConfig(config, this.config);
				this.config = conf;
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

			// bootstrap modal的配置
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

				var cssConfig = {};

				// 或者推荐使用bootstrap的功能data-width
				if(config.width) {
					var widthFunction = null;
					var widthString = '' + config.width;
					var index = widthString.indexOf('%');
					if(index >= 0) {
						widthString = widthString.slice(0, index);
					}
					var width = 0;
					try {
						width = parseInt(widthString, 10);
					} catch(e) {
						throw '"Config.width" should be a number based on pixel or a percentage value ends with "%"!';
					}

					if(index >= 0) {
						width = width / 100;
						widthFunction = function () {
							return ($(document).width() * width) + 'px';
						};
					} else {
						widthFunction = function () {
							return '' + width + 'px';
						};
					}

					cssConfig.width = widthFunction;
				}

				cssConfig['margin-left'] = function () {
					var width = $(this).width();
					return -(width / 2);
				};

				// modal是bootstrap的方法
				// bootstrap扩展了jquery
				this.target.modal(_.clone(DEFAULT_MODAL_CONFIG)).css(cssConfig);

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
				// 可以在config里面自己定义onShow回调方法
				if (_.isFunction(config.onShow)) {
					config.onShow.call(null);
				} else {
					if (config.onShow) {
						throw 'the property "onShow" in config must be a function';
					}
				}

				// WORKAROUND backdrop 被清错了
				this.target.modal(_.clone(DEFAULT_MODAL_CONFIG));
				this.target.modal('show');

				var scroll = this.target.parent();
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
				this.target.modal('hide');
				this.target.modal(_.clone(DEFAULT_MODAL_CONFIG));

				// 可以在config里面自己定义onHide回调方法
				if (config.onHide && _.isFunction(config.onHide)) {
					config.onHide.call(null);
				} else {
					if (config.onHide) {
						throw 'the property "onHide" in config must be a function';
					}
				}

				if (this.scrollZIndex) {
					var scroll = this.target.parent();
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
		 * bind : {
     *     data : 'abc',
     *     binder: 'value',
     *     type ：'ARRAY',
     *     autoCreate : true, // 非computed类型
     *     defaults : '123'
     * }
		 */
		var DEFAULT_VIEW_CONTROLLER_CONFIG = {
			bind: {
				binder: 'value',	// knockout 的数据绑定规则value:2 checked:false等等
			},
			bindings: []		// 对应的{key:'aa', value:'dddd'}对儿，对应data-bind语法
		};

		var ViewController = (function (_super) {
			cKit.__extends(ViewController, _super);
			function ViewController(config) {
				// 合并默认的View配置
				config = ConfigUtils.mergeConfig(config, DEFAULT_VIEW_CONTROLLER_CONFIG);
				_super.call(this, config);
			}

			/**
			 * 重置控件
			 *
			 */
			ViewController.prototype.reset = function reset(viewModel) {

			};

			/**
			 * 与viewModel进行绑定
			 * 生成bindings数组
			 */
			ViewController.prototype.parseBindings = function parseBindings(viewModel) {

			};

			/**
			 * 在ViewModel上为data binder创建相应的数据节点
			 *
			 * 一般数据节点定义由parent控件节点中的config.bind.data值决定
			 * @param 当前Form的viewModels
			 */
			ViewController.prototype.createNode = function createNode(viewModel) {
				var config = this.config;
				var bind = config.bind;
				var isArray = false;

				if (bind && bind.hasOwnProperty('type') && (bind.type === cKit.DataType.ARRAY))  {
					isArray = true;
				}

				var bindNames = null;
				if (bind && bind.data) {
					// "." 表示直接引用了knockout的context，这里不做处理
					if (_.isString(bind.data) && bind.data.indexOf('.') < 0) {
						// bind : {
						//     data : 'name'
						// }
						bindNames = [bind.data];
					} else if(_.isArray(bind.data)) {
						// bind : {
						//     data : ['beginDate', 'endDate']
						// }
						bindNames = bind.data;
					}
				}

				for (var index in bindNames) {
					var bindName = bindNames[index];
					if (_.isString(bindName)) {
						//在viewModel 中通过getNote()判断是否存在该节点，若不存在则创建节点
						var node = this.getNode(viewModel, bindName);
						if (!node) {
							if (bind.autoCreate === true) {
								var objectType = isArray ? 'ARRAY' : 'normal';
								if (config.type && config.type.name == 'CheckBoxGroupController') {
									throw 'CheckBoxGroupController: Source data is missing property field["' + bindName + '"], fill it with ' + objectType + ' array in model.'
								} else {
									console.warn('FormController: WARNING! Source data is missing property field["' + bindName + '"], fill it with ' + objectType + ' object.');
								}
								var nodeObject = (isArray || _.isArray(bind.defaults)) ? ko.observableArray([]) : ko.observable(bind.defaults);
								this.setNode(viewModel, bindName, nodeObject);
							}
						}
					}
				}

			};

			/** 应用bindings
			 *
			 * @param 当前Form的viewModels
			 *
			 */
			ViewController.prototype.applyBindings = function applyBindings(viewModel) {
				var config = this.config;
				var bind = config.bind;
				var isArray = false;

				if (bind && bind.hasOwnProperty('type') && (bind.type === cKit.DataType.ARRAY))  {
					isArray = true;
				}

				// 表示所需的viewModel是否都已经创建好了
				var createdFlag = true;
				var bindNames = null;
				if(bind && bind.data) {
					if(_.isString(bind.data) && bind.data.indexOf('.') < 0) {
						bindNames = [bind.data];
					} else if(_.isArray(bind.data)) {
						bindNames = bind.data;
					}
				}

				for(var index in bindNames) {
					var bindName = bindNames[index];
					if (_.isString(bindName)) {
						var node = this.getNode(viewModel, bindName);
						if (!node) {
							if (bind.autoCreate !== true) {
								createdFlag = false;
							}
						}
					}
				}

				// viewModel都创建好了才能绑定
				if(createdFlag) {
					this.parseBindings(viewModel);
					if (_.isFunction(this.getNode)) {
						// 方便后续数据处理
						viewModel[ViewModelUtils.CONTROLLER_ROOT][config.id] = this;
					}

					if (!config.bind) {
						return;
					}
					UiUtils.applyBindingsForObject(this.target, config, this.getBindings(), viewModel, UiUtils.BIND_FLAG_USE_BINDING_MAP);
				} else {
					console.debug('Ignoring binding for id="' + config.id + '"');
				}

			};

			/** 获取当前控件的值
			 *
			 * @param viewModel 当前Form的viewModel
			 *
			 */
			ViewController.prototype.getValue = function getValue(viewModel) {
				var binder = this.config.bind.binder;

				var result = null;
				if(binder === 'value') {
					result = this.target.val();
				} else if(binder === 'text') {
					result = this.target.text();
				} else if(binder === 'html') {
					result = this.target.html();
				} else {
					var config = this.config;
					if(config.bind && config.bind.data && _.isString(config.bind.data)) {
						result = this.getNodeValue(viewModel, config.bind.data);
					} else {
						// console.log('WidgetController.getValue(): Can not get value!');
						result = null;
					}
				}

				return result;
			};

			/** 获取当前数据节点
			 *
			 * 一般数据节点为Object或者某类observable
			 *
			 *  @param viewModel 当前Form的viewModel
			 *  @param nodeName 节点名称(最后的属性名称,如viewModel.a.b.c时为"c")
			 *
			 */
			ViewController.prototype.getNode = function getNode(viewModel, nodeName) {
				var argCount = arguments.length;
				if(argCount < 1 || argCount > 3) {
					throw 'Incorrect arguments!';
				}

				var config = this.config;
				var parent = config.parent;
				nodeName = nodeName || config.options || config.bind.data;

				// nodeName == null
				if(!_.isString(nodeName)) {
					return viewModel;
				}

				if(parent) {
					viewModel = parent.getNode(viewModel);
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
			 * @param viewModel 当前Form的viewModel
			 * @param nodeName 节点名称(最后的属性名称,如viewModel.a.b.c时为"c")
			 *
			 */
			ViewController.prototype.getNodeValue = function getNodeValue(viewModel, nodeName) {
				var node = this.getNode.apply(this, arguments);
				return ko.utils.unwrapObservable(node);
			};

			/** 设置某个节点的值
			 *
			 * @param viewModel 当前Form的viewModel，即root viewModel
			 * @param nodeName 节点名称(最后的属性名称,如viewModel.a.b.c时为"c")
			 * @param value 节点数据值
			 *
			 */
			ViewController.prototype.setNode = function setNode(viewModel, nodeName, value) {
				var argCount = arguments.length;
				if(argCount < 1 || argCount > 5) {
					throw 'Incorrect arguments!';
				}

				var config = this.config;

				// parent controller
				var parent = config.parent;

				if (parent !== null) {
					// 获取parent controller的viewModel节点
					viewModel = parent.getNode(viewModel);
				}

				if (KoUtils.isObservableNode(value)) {
					viewModel[nodeName] = value;
				} else if (typeof value === Knockout.OBSERVABLE) {
					throw 'Assigning a invalid object to nodeName="' + nodeName + '"!';
				} else if (!KoUtils.isObservableNode(viewModel[nodeName])) {
					throw 'nodeName="' + nodeName + '" is not a observable object!';
				} else {
					// viewModel[nodeName]已经存在，并且是observable，把value设置为初始值
					viewModel[nodeName](value);
				}
			};

			/** 获取节点全名
			 *
			 * 这个全名直接指向节点数据域,所以其中有可能带有求值表达式(函数访问,如viewModel.a().b)
			 *
			 * @param flags UiUtils.BIND_FLAG_EVALUABLE           是否为可估值的名称,如果是,则有可能在末尾添加求值表达式
			 *              UiUtils.BIND_FLAG_DURING_BINDING        此node是否在绑定的过程中。如果是，并且Controller有相应的获取节点全名函数，那么就调用相应的函数
			 */
			ViewController.prototype.getNodeName = function getNodeName(viewModel, nodeName, flags) {
				if(!_.isNumber(flags)) {
					flags = 0;
				}

				if((flags & UiUtils.BIND_FLAG_DURING_BINDING) && this.getNodeNameDuringBind !== null) {
					return this.getNodeNameDuringBind(viewModel, nodeName, flags);
				}
				var config = this.config;
				var parent = config.parent;
				nodeName = nodeName || config.bind.data;
				if(!_.isString(nodeName)) {
					return '$root';
				}

				var node = this.getNode(viewModel, nodeName);
				var suffix = '';
				if((flags & UiUtils.BIND_FLAG_EVALUABLE) && KoUtils.isObservableNode(node)) {
					suffix = '()';
				}

				if(parent) {
					var name = parent.getNodeNameEvaluable(viewModel, null, flags) + '.' + nodeName + suffix;
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
			ViewController.prototype.getNodeNameEvaluable = function getNodeNameEvaluable(viewModel, nodeName, flags) {
				return this.getNodeName(viewModel, nodeName, UiUtils.BIND_FLAG_EVALUABLE | flags);
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
			bind: {
				defaults: null,
				autoCreate: true,					// 当节点不存在时，是否自动创建
				data: null,							// data 绑定的属性，可以为多级属性，如name.a.b.c，但必须以点作为分隔
				type: cKit.DataType.PREMITIVE,		// 绑定的数据类型,如果是Array则为ARRAY; Optional
				capacity: null,						// 在数组情况下描述允许的元素数量，如果不给出则不允许添加新元素；给出一个则需要恰好满足这个数量，给出2个则为一个区间（数组，前大后小）
				key: null,							// 如果数组模式下,每个元素为一个对象,则需要给出操作的属性名称,不可以用点分隔
				visible: null,						// 可见性控制函数
				readOnly: false,					// 是否为只读,只读则不可以更改内容
				exists: null						// 是否存在
			},
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
				var config = config1;
				// 处理 permission
				if(config1.hasOwnProperty('permissions')) {
					var permissions = config1.permissions;
					if(!_.isArray(permissions)) {
						throw 'config.permissions should be an array!';
					}

					for(var index in permissions) {
						var permission = permissions[index];
						if(permission) {
							config = ConfigUtils.mergeConfig(permission, config);
						}
					}

				}
				config = ConfigUtils.mergeConfig(config, DEFAULT_FIELD_CONTROLLER_CONFIG);
				_super.call(this, config);

				config = this.config;

				// 可以选择右侧显示错误，或者下方显示错误
				var target = this.target;
				var id = config.id;
				var hint = config.hint ? config.hint : '';
				var bind = config.bind;
				var deleteAttributes = false,
					capacity,
					readOnly;
				// If the bind.dataType is a Array, then we need do some extra work to keep it sure
				// it works with each item in the array object.
				if(config.hasOwnProperty('bind')) {
					if(bind.hasOwnProperty('type') && (bind.type === cKit.DataType.ARRAY))  {
						deleteAttributes = true;
						capacity = bind.capacity;
						if(!bind.key) {
							// throw 'missing key!';
							bind.key = '$data';
						}

						// 这里主要负责capacity的控制，capacity因为可以接受一个数字或者两个数字的数组，所以需要分别处理
						if(_.isArray(capacity)) {
							if(capacity.length != 2 || !_.isNumber(capacity[0]) || !_.isNumber(capacity[1])) {
								throw ('config.capacity should be an array contains 2 numbers, or a single number instead!');
							}
							bind.capacityMin = capacity[0];
							bind.capacityMax = capacity[1];
						} else if(_.isNumber(bind.capacity)) {
							bind.capacityMin = capacity;
							bind.capacityMax = capacity;
						} else if(_.isNull(bind.capacity)) {
							bind.capacityMin = 0;
							bind.capacityMax = 9999;
						} else {
							throw ('config.capacity should be an array contains 2 numbers, or a single number instead!');
						}

					}

					readOnly = bind.readOnly;
				}

				this.updateTarget();
				if(readOnly) {
					this.target.attr('disabled','');
				}

				// 对于数组形式的数据来说，id和value会出现多次，这样不合理，全部清除
				// bindType = ARRAY，例如点击+创建一个新的input
				if(deleteAttributes) {
					this.target.removeAttr('id');
					this.target.removeAttr('value');
				}

				// Hint
				if(!cKit.ValueUtils.isEmpty(this.hintTarget.text()) && cKit.ValueUtils.isEmpty(config.hint)) {
					this.config.hint = this.hintTarget.text();
				}
				this.hintTarget.text(this.config.hint);

			}


			/** 查找当前field的Form
			 *
			 *
			 */
			FieldController.prototype.getContainerForm = function getContainerForm() {
				var form = this.config.parent;

				do {
					if(form.config.isForm) {
						return form;
					}

					form = form.config.parent;
					if(!form) {
						throw 'Can not find parent!';
					}
				} while(true);
			};

			/**
			 * 清理所有的id,因为groupTarget的Id最多存在一个，因此不需要清理
			 *
			 */
			FieldController.prototype.clearTargetIds = function clearTargetIds() {
				this.target.removeAttr('id');
				//	this.groupTarget.removeAttr('id');
				this.hintTarget.removeAttr('id');
				this.removeTarget.removeAttr('id');
			};

			// @Override
			FieldController.prototype.updateTarget = function() {
				var config = this.config;

				var result = this.findTarget(-1);
				this.target = result.target;				// Input 或者button 等这个Field中的核心组件
				this.groupTarget = result.groupTarget;		// Group 组件, 包裹整个Field, 用来设置错误或者成功外观
				this.hintTarget = result.hintTarget;		// Hint 组件, 显示提示信息
				this.removeTarget = result.removeTarget;	// remove 组件， 用来对数组进行操作时提供删除单项的功能

				this.target.attr('name', result.target.attr('id'));
				this.groupTarget.attr('name', result.groupTarget.attr('id'));
				this.hintTarget.attr('name', result.hintTarget.attr('id'));
				this.removeTarget.attr('name', result.removeTarget.attr('id'));

				// 这里定义了一些bindings需要绑定到那个target上
				// 如果目标target不存在，则绑定到target上
				// visible和exists都有groupTarget来控制
				config.bindingMap.visible = this.groupTarget;
				config.bindingMap.exists = this.groupTarget;
			};

			// private
			// 当index < 0时将会采用id进行搜寻
			FieldController.prototype.findTarget = function(index) {
				var config = this.config;

				var target = $('#' + config.id);
				var groupTarget = $('#' + config.id + '_group');
				var hintTarget = $('#' + config.id +  '_hint');
				var removeTarget = $('#' + config.id +  '_remove');

				if(index < 0) {

				} else {
					target = $(document.getElementsByName(config.id)[index]);
					groupTarget = $(document.getElementsByName(config.id + '_group')[index]);
					hintTarget = $(document.getElementsByName(config.id +  '_hint')[index]);
					removeTarget = $(document.getElementsByName(config.id +  '_remove')[index]);
				}

				return {
					target: target,				// 指向controls Div里面的第一个元素（一般情况下可以为input或者按钮）
					hintTarget: hintTarget,		// 显示hint的
					groupTarget: groupTarget,	// controlGroup Div
					removeTarget: $(removeTarget)	// 删除按钮（只有在可增删的数组形式时才会出现
				};
			};

			/** 执行验证
			 *
			 * @return boolean 验证是否通过
			 */
			FieldController.prototype.validate = function validate(model) {
				var config = this.config;
				var bind = config.bind;

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
				var bind = config.bind;

				var bindData = null;
				if(_.isArray(config.bind.data)) {
					bindData = config.bind.data;
				} else if(_.isString(config.bind.data)) {
					bindData = [config.bind.data];
				} else {
					// null or undefined
					return true;
				}

				var result = [];

				// 拿到root viewModel
				var viewModel = this.getContainerForm().getViewModel();
				for(var i in bindData) {
					var d = bindData[i];
					result.push(this.getNodeValue(viewModel, d));
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

				// 检查验证器chain
				for (i = 0; i < COUNT; ++i) {
					validator = validators[i];
					res = validator(text, model);

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
				var groupTarget = this.groupTarget;
				var hintTarget = this.hintTarget;
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
			FieldController.prototype.reset = function reset(viewModel) {
				if (this.config) {
					this.updateTarget();
				}

				var groupTarget = this.groupTarget;
				var hintTarget = this.hintTarget;

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
			FieldController.prototype.parseBindings =function parseBindings(viewModel) {
				var config = this.config,
					target = this.target;
				//bind data
				var id = config.id,
					bind,
					bindConfig,
					bindTemp;

				if(config.hasOwnProperty('bind')) {
					bind = config.bind;
					bindConfig = {
						data: null,
						visible: null
					};

					// 在bind过程中，有可能key起作用，或者直接value起作用
					if(bind.data) {
						if(bind.hasOwnProperty('type') && (bind.type === cKit.DataType.ARRAY))  {
							bindConfig.data = bind.key;
						} else {
							bindConfig.data = this.getNodeName(viewModel, bind.data, UiUtils.BIND_FLAG_DURING_BINDING);
						}
					}

					if(!_.isEmpty(bindConfig)) {
						if(bindConfig.data && bind.binder) {
							// 因为有的数据使用value，有的使用checked，所以这里使用这个变量来bind数据
							this.addBinding(bind.binder, bindConfig.data);
						}

						// 提交式表单需要name字段用来生成提交对应的数据
						// FIXME 生成name 的操作可不要
						if(!config.parent) {
							target.attr('name', config.bind.data);
						}
					}

					// exists 判断
					if(bind.exists) {
						var bindContent = bind.exists;
						if(viewModel && _.isFunction(bind.exists)) {
							viewModel[ViewModelUtils.OPERATION_ROOT][config.id + '_exists'] = bind.exists;
							var prefix = '';
							var suffix = '';
							var param = '$data, $root';
							// 生成跳转
							bindContent = prefix + '$root["' + ViewModelUtils.OPERATION_ROOT + '"].' + config.id + '_exists.call($element, ' + param + ')' + suffix;
						}

						var target = config.bindingMap.exists;
						if(!target || target.length < 1) {
							target = this.target;
						}

						target.before('<!-- ko if: ' + bindContent + ' -->');
						target.after('<!-- /ko -->');
					}

					var genernalBindings = ['click', 'enable', 'keyup', 'visible', 'keypress', 'keydown', 'valueUpdate'];
					for(var i in genernalBindings) {
						var b = genernalBindings[i];
						// NEWFIX
						if(!_.isUndefined(bind[b]) && !_.isNull(bind[b])) {
							this.addBinding(b, bind[b]);
						}
					}
				}
			};

			FieldController.prototype.setValue = function(viewModel, value) {
				var config = this.config;
				if(config.bind && config.bind.hasOwnProperty('data') && _.isString(config.bind.data)) {
					this.setNode(viewModel, config.bind.data, value);
				}
			};

			return FieldController;
		}) (ViewController);


		/**
		 *  Image
		 */
		var DEFAULT_IMAGE_CONTROLLER_CONFIG = {
			bind: {
				binder: 'src'
			}
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
			bind: {
				binder: 'html',
				click: null
			}
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
			bind: {
				binder: null
			}
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
			bind: {
				binder: 'html'
			}
		};

		var LabelController = (function (_super) {
			cKit.__extends(LabelController, _super);
			function LabelController(config1, config2) {

				var config = ConfigUtils.mergeConfig(config1, config2, DEFAULT_LABEL_CONTROLLER_CONFIG);
				_super.call(this, config);

				this.updateTarget();
			}

			return LabelController;
		}) (FieldController);

		var DEFAULT_TABLE_HEAD_CONTROLLER_CONFIG = {
			bind: {
				binder: 'html'
			}
		};

		var TableHeadController = (function (_super) {
			cKit.__extends(TableHeadController, _super);
			function TableHeadController(config1, config2) {

				var config = ConfigUtils.mergeConfig(config1, config2, DEFAULT_TABLE_HEAD_CONTROLLER_CONFIG);
				_super.call(this, config);

				this.updateTarget();

				if(this.target.get(0).tagName.toLowerCase() !== 'th') {
					throw 'You have to use me with a <th> tag!';
				}
			}

			TableHeadController.prototype.parseBindings =function(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);

				var config = this.config;
				var bind = config.bind;

				// exists 判断
				if(bind && bind.exists) {
					var currentTh = this.target.get(0);
					// 先看看自己是第几个th
					var thIndex = this.target.get(0).cellIndex;
					// 找table
					var foundFlag = false;
					var table = this.target;
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

					var bindContent = bind.exists;
					if(viewModel && _.isFunction(bind.exists)) {
						viewModel[ViewModelUtils.OPERATION_ROOT][config.id + '_td_exists'] = bind.exists;
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
			bind: {
				binder: 'value'
			}
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
				if(config.bind && config.bind.change && !_.isFunction(config.bind.change)) {
					throw '"Config.bind.select should be an function!"';
				}
			}

			InputController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var config = this.config;
				var id = config.id;

				//bind data
				if (config.bind.change) {
					this.addBinding(Binding.CHANGE, config.bind.change);
				}
			}

			return InputController;
		}) (FieldController);



		/**
		 *  自动完成输入框
		 */
		var DEFAULT_AUTO_COMPLETE_CONTROLLER_CONFIG = {
			bind: {
				binder: null,
				select: null		// 函数，当一个选项被用户点击时触发，参数为(data, viewModel)
			},
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

				if(config.bind && config.bind.select && !_.isFunction(config.bind.select)) {
					throw '"Config.bind.select should be an function!"';
				}
			}

			AutoCompleteController.prototype.reset = function reset(viewModel) {
				_super.prototype.reset.call(this, viewModel);
				var config = this.config;

				var nodeValue = this.getNodeValue(viewModel, this.config.bind.data);
				if(nodeValue) {
					for(var index in config.options) {
						var option = config.options[index];
						var value = config.root ? option[config.root] : option;
						if(value === nodeValue) {
							var attr = this.autoCompleteConfig.setValue(option);
							this.target.val(attr['data-value']);
							this.target.attr('real-value', attr['real-value']);
							break;
						}
					}
				} else {
					this.target.val('');
					this.target.removeAttr('real-value');
				}
			};

			AutoCompleteController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);

				var config = this.config;
				var bind = config.bind;
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
							self.setNode(viewModel, config.bind.data, null);
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

						self.setNode(viewModel, config.bind.data, item);

						if(config.bind.select) {
							config.bind.select.call(self, item, viewModel);
						}

						return {
							'data-value':formatItem(item),
							'real-value':value
						};
					},
					listener: function(value) {
						self.setNode(viewModel, self.config.bind.data, value);
					}
				};
				$('#' + id).autocomplete(this.autoCompleteConfig);

				this.reset(viewModel);
			};

			return AutoCompleteController;
		}) (FieldController);


		/**
		 *  数量编辑器
		 */
		var DEFAULT_QUANTITY_EDIT_CONTROLLER_CONFIG = {
			bind: {
				onChange: null,
				capacity: [0, 4]
			}
		};

		var QuantityEditController = (function (_super) {
			cKit.__extends(QuantityEditController, _super);
			function QuantityEditController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_QUANTITY_EDIT_CONTROLLER_CONFIG);
				_super.call(this, config);
				config = this.config;

				if(config.bind) {
					if(config.bind.change && !_.isFunction(config.bind.change)) {
						throw '"Config.bind.change" should be a callback function(data)!';
					}
					if(config.bind.capacity && (!_.isArray(config.bind.capacity) || config.bind.capacity[0] > config.bind.capacity[1] )) {
						throw '"Config.bind.capacity" should be an array with 2 numbers!';
					}
				}
			}

			QuantityEditController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var config = this.config;
				var bind = config.bind;
				var id = config.id;
				var self = this;

				var inputTarget = $('#' + id);
				var plusTarget = $('#' + id + '_plus');
				var minusTarget = $('#' + id + '_minus');

				inputTarget.attr('name', 'input');
				plusTarget.attr('name', 'plus');
				minusTarget.attr('name', 'minus');

				var MIN = config.bind.capacity[0];
				var MAX = config.bind.capacity[1];

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
						quantity = data[config.bind.data]();
					} else {
						quantity = self.getNodeValue(viewModel, config.bind.data);
					}

					if(!plus) {
						plus = cKit.JDomUtils.getSibling(minus, 'plus');
						plus = $(plus);
					}
					if(!minus) {
						minus = cKit.JDomUtils.getSibling(plus, 'minus');
						minus = $(minus);
					}
					//var quantity = self.getNodeValue(viewModel, config.bind.data);
					try {
						quantity = parseInt(quantity, 10);
					} catch(ex) {
						quantity = MIN;
					}

					if(quantity > MAX) {
						if(data) {
							data[config.bind.data](MAX);
						} else {
							self.setNode(viewModel, config.bind.data, MAX);
						}
						quantity = MAX;
					}
					if(quantity < MIN) {
						if(data) {
							data[config.bind.data](MIN);
						} else {
							self.setNode(viewModel, config.bind.data, MIN);
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
						var quantity = data[config.bind.data]();
						try {
							quantity = parseInt(quantity, 10);
						} catch(ex) {
							quantity = MIN;
						}
						quantity = quantity >= 0 ? (quantity + 1) : (MIN + 1);
						quantity = quantity >= MAX ? MAX : quantity;
						data[config.bind.data](quantity);

						updateButtonState.call(this, data, $(this));
					}
				}], viewModel);

				var minusConfig = _.clone(config);
				minusConfig.id = minusConfig.id + '_minus';
				UiUtils.applyBindingsForObject(minusTarget, minusConfig, [{
					key: Binding.CLICK,
					value: function(data, viewModel) {
						var quantity = data[config.bind.data]();
						try {
							quantity = parseInt(quantity, 10);
						} catch(ex) {
							quantity = MIN;
						}
						quantity = quantity > 0 ? (quantity - 1) : 0;
						quantity = quantity <= MIN ? MIN : quantity;
						data[config.bind.data](quantity);

						updateButtonState.call(this, data, null, $(this));
					}
				}], viewModel);

				if (config.bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(viewModel, bind.data);
						config.bind.change.call(bind, value, viewModel);
					});
				}

				this.addBinding(config.bind.binder, this.getNodeName(viewModel, null, UiUtils.BIND_FLAG_DURING_BINDING));


			};

			return QuantityEditController;
		}) (FieldController);



		var DEFAULT_FILTER_EDIT_CONTROLLER_CONFIG = {
			bind: {
				binder: null,
				select: null		// function, 当某个选项被选中时调用
			},
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
				config = this.config;

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

				if(config.bind && config.bind.select && !_.isFunction(config.bind.select)) {
					throw '"Config.bind.select should be an function!"';
				}
			}

			function updateItems(items, viewModel, config) {
				// 同时更新值与显示
				var id = config.id;
				var displayNode = viewModel[ViewModelUtils.BINDING_ROOT]['display_' + id + '_values'];
				var valueNode = viewModel[ViewModelUtils.BINDING_ROOT][id + '_values'];
				this.config.items = items;
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

			FilterEditController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var config = this.config;
				var bind = config.bind;
				var id = config.id;
				var self = this;


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
				var target = $('#' + id + '_results');
				UiUtils.applyBindingsForObject(target, config, [{
					key: Binding.FOREACH,
					value: '$root["' + ViewModelUtils.BINDING_ROOT + '"].display_' + id + '_values'
				}, {
					key: Binding.VISIBLE,
					value: '$root["' + ViewModelUtils.BINDING_ROOT + '"].display_' + id + '_values().length > 0'
				}

				], viewModel);
				/** 为按钮绑定事件
				 *
				 */
				target = $('#' + id + '_result');
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
							$(self.lastElement).removeClass('active');
						}
						$(element).addClass('active');

					}
					if(index >= 0) {
						data = viewModel[ ViewModelUtils.BINDING_ROOT ][id + '_values'].slice(index, index + 1)[0];
						self.lastElement = element;
					}

					self.setNode(viewModel, config.bind.data, data);
					if(index >= 0) {
						var item = config.items[index];
						if(config.bind.select) {
							config.bind.select(item, viewModel);
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

				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(arg1, arg2){
						var value = self.getNodeValue(viewModel, bind.data);
						bind.change.call(bind, value, viewModel);
					});
				};

				this.reset(viewModel, true);
			};

			/** 更新按钮组的数据
			 *
			 */

			FilterEditController.prototype.reset = function reset(viewModel, delay) {
				_super.prototype.reset.call(this, viewModel);
				var config = this.config;
				var property = config.root;

				var nodeValue = this.getNodeValue(viewModel, config.bind.data);
				if(nodeValue) {
					for(var index in config.options) {
						var option = config.options[index];
						var optionValue = property ? option[property] : option;
						if(optionValue === nodeValue) {
							//this.target.val(optionValue);
							updateItems([option], viewModel, config);

							postCall = function() {
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
					this.target.val('');
					updateItems([], viewModel, config);
				}
			};

			//TODO 使所有控件（目前有chooserController）的setOptions方法保持参数一致
			FilterEditController.prototype.setOptions = function setOptions(viewModel, newOptions){
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
			bind: {
				binder: null,
				defaults: []
			}
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

				if(!config.bind) {
					throw 'Missing Config.bind field!';
				}

				if (!_.isArray(config.fields) || config.fields.length < 1) {
					throw ('the param "config.fields" should be an Array!');
				}

				if (!_.isArray(config.headers)) {
					throw ('the param "config.headers" should be an Array!');
				}

				if(!config.bind.data) {
					throw 'Missing "config.bind.data" field!';
				}

			}

			TableController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var self = this;
				var config = this.config;
				var bind = config.bind;
				var id = config.id;

				var target = $('#' + id + ' tbody');
				if(target.length < 0) {
					throw 'No embedded <tbody> found for config.id="' + config.id + '"';
				}
				var modelBinder = this.getNodeName(viewModel, bind.data);
				UiUtils.applyBindingsForObject(target, config, [{
					key: Binding.FOREACH,
					value: modelBinder
				}], viewModel, UiUtils.BIND_FLAG_INSIDE_FOREACH);

				for(var index in config.fields) {
					var fieldConfig = config.fields[index];
					config.fields[index] = ConfigUtils.mergeConfig(fieldConfig, {
						type: ControllerFactory.LABEL_CONTROLLER,
						parent: this
					});
				}

				for(var index in config.headers) {
					var fieldConfig = config.headers[index];
					fieldConfig = ConfigUtils.mergeConfig(fieldConfig, {
						type: ControllerFactory.TABLE_HEAD_CONTROLLER,
						parent: this
					});
					if(_.isEqual(fieldConfig.type, ControllerFactory.TABLE_HEADER_CONTROLLER)) {
						throw '"Config.headers" should only contain TABLE_HEADER_CONTROLLER(s)!';
					}
					// 添加到fields里面一起处理
					config.fields.push(fieldConfig);
				}



				UiUtils.bindControllers.call(this, config, viewModel);
			};

			TableController.prototype.getNodeNameDuringBind = function getNodeNameDuringBind(viewModel, nodeName, flags) {
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
			bind: {
				binder: 'checked'
			},
			isChooserGroup: false,		//控件是否为group，是的话则需要生成相应的options
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
					if (config.hasOwnProperty('bind') && config.bind.hasOwnProperty('data')) {
						insertPos.attr('checked', config.bind.data);
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

			ChooserGroupController.prototype.parseBindings =function parseBindings(viewModel) {
				var config = this.config;
				var id = config.id;

				//生成 options
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_options'] = ko.observableArray(config.options || []);

				var target = UiUtils.findControlsTag(this.target, this.config.id);
				//生成group
				UiUtils.applyBindingsForObject(target, config, [{
					key: Binding.FOREACH,
					value: '$root["' + ViewModelUtils.BINDING_ROOT + '"].' + id + '_options'
				}], viewModel, UiUtils.BIND_FLAG_INSIDE_FOREACH);

				target = $('#' + id + '~ span');
				//规定radio的label必须包在 span标签中
				if (target.size() === 0) {
					throw ('the label of Radio tag must be wrapped in span !');
				}

				UiUtils.applyBindingsForObject(target, config, [{
					key: Binding.TEXT,
					value: '$data.label'
				}], viewModel, UiUtils.BIND_FLAG_INSIDE_FOREACH);

				this.addBinding(Binding.VALUE, '$data.value');

				//生成group后，多个控件的id相同，所以要清除
				target.removeAttr('id');
				_super.prototype.parseBindings.call(this, viewModel);
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
					this.config.bind.binder = 'valueWithInit';
					this.getContainerForm().setDelayBindings(true);
				}

			};

			EditController.prototype.parseBindings =function parseBindings(viewModel){
				_super.prototype.parseBindings.call(this, viewModel);
				var self = this;
				var config = this.config;
				var bind = config.bind;
				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(viewModel, bind.data);
						bind.change.call(bind, value, viewModel);
					});
				}

				// html5中对于input的任何修改（自动填充，打字都有一个新的事件，通过这个可以修正一些自动填充相关的问题
				this.addBinding(Binding.UPDATE, function(data, viewModel) {
					var value = this.value;
					self.setNode(viewModel, config.bind.data, value);
				});

				this.reset(viewModel);
			};

			return EditController;
		}) (InputController);

		/** TextArea
		 *
		 */
		var DEFAULT_TEXT_AREA_CONTROLLER_CONFIG = {
			bind: {
				binder: 'value'
			},
			value: '',						// 默认内容
			validators: [Validator.NULL]	// 验证器列表
		};

		var TextAreaController = (function (_super) {
			cKit.__extends(TextAreaController, _super);
			function TextAreaController (config1) {
				var self = this;
				_super.call(this, config1, {}, DEFAULT_TEXT_AREA_CONTROLLER_CONFIG);
			};

			TextAreaController.prototype.parseBindings =function parseBindings(viewModel){
				_super.prototype.parseBindings.call(this, viewModel);
				var self = this;
				var config = this.config;
				var bind = config.bind;
				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(viewModel, bind.data);
						bind.change.call(bind, value, viewModel);
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
				var bind = config.bind;

				_super.call(this, config);
			}

			RadioGroupController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var config = this.config;

				var value = this.getNodeValue(viewModel, config.bind.data);
				viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_value'] = ko.observable(value === false ? false : value || null);

				this.setNode(viewModel, config.bind.data, ko.computed({
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

				var self = this;
				var bind = config.bind;
				var lastValue = this.getNodeValue(viewModel, config.bind.data);
				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(viewModel, bind.data);
						if(value != lastValue) {
							bind.change.call(bind, value, viewModel);
						}
						lastValue = value;
					});
				}
			};

			return RadioGroupController;
		}) (ChooserGroupController);



		/**
		 * checkBox
		 */
		var DEFAULT_CHECK_BOX_CONFIG = {
			bind: {
				binder: 'checked',
				defaults: cKit.Bool.N
			},
		};

		/** 这里接收true和false作为输入输出
		 *
		 */
		var CheckBoxController = (function (_super) {
			cKit.__extends(CheckBoxController, _super);
			function CheckBoxController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_CHECK_BOX_CONFIG);
				_super.call(this, config);
			}

			CheckBoxController.prototype.parseBindings =function(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var config = this.config;
				var bind = config.bind;
				var self = this;

				/*this.addBinding(Binding.CHECKED, '$root["' + ViewModelUtils.BINDING_ROOT + '"].' + config.id + '_checked');

				 viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_checked'] = ko.computed({
				 read: function () {
				 var value = this[bind.data]();

				 if(value === cKit.Bool.Y) {
				 return true;
				 }
				 return false;
				 },
				 write: function(data) {
				 if(!_.isBoolean(data)) {
				 return;
				 }

				 this[bind.data](data === true ? cKit.Bool.TRUE : cKit.Bool.FALSE);
				 },
				 owner: viewModel
				 });*/

				var lastValue = this.getNodeValue(viewModel, config.bind.data);
				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(viewModel, bind.data);
						//var lastValueSize = lastValue.length;
						//var valueSize = value.length;
						if(lastValue != value) {
							bind.change.call(bind, value, viewModel);
						}
						lastValue = value;
					});

					// bind.change.call(bind, lastValue, viewModel);
				}
			};

			return CheckBoxController;

		}) (FieldController);

		/** CheckBoxGroup
		 *
		 */
		var DEFAULT_CHECK_BOX_GROUP_CONFIG = {
			isChooserGroup : true,
			bind: {
				defaults: []
			}
		};

		var CheckBoxGroupController = (function (_super) {
			cKit.__extends(CheckBoxGroupController, _super);
			function CheckBoxGroupController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1,DEFAULT_CHECK_BOX_GROUP_CONFIG);
				_super.call(this, config);
				config = this.config;
				var id = config.id;

				//规定checkBox的label必须包在 span标签中
				if ($('#' + id + ' ~ span').size() === 0) {
					throw ('the label of CheckBox tag must be wrapped in span !');
				}
			}

			CheckBoxGroupController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var config = this.config;
				var bind = config.bind;
				var self = this;

				var lastValueSize = (this.getNodeValue(viewModel, config.bind.data)).length;
				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(viewModel, bind.data);
						var valueSize = value.length;
						if(lastValueSize != valueSize) {
							bind.change.call(bind, value, viewModel);
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
			bind: {
				defaults: null
			}
		};

		var SelectController = (function (_super) {
			cKit.__extends(SelectController, _super);
			function SelectController(config1) {
				var self = this;
				var config = _.defaults(config1,DEFAULT_SELECT_CONFIG);
				_super.call(this, config);

				if(!_.isArray(config.options)) {
					throw 'Config.options should be an array!';
				}

			}

			SelectController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var config = this.config;
				var id = config.id;

				//生成 options
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_options'] = ko.observableArray(config.options || []);
				this.addBinding(Binding.OPTIONS, '$root["' + ViewModelUtils.BINDING_ROOT + '"].' + id + '_options');
				this.addBinding(Binding.OPTIONS_TEXT, "'label'");
				this.addBinding(Binding.OPTIONS_VALUE, "'value'");

				//bind data
				if (config.bind.change) {
					this.addBinding(Binding.CHANGE, config.bind.change);
				}
			};

			SelectController.prototype.getOptions = function getOptions(viewModel) {
				var id = this.config.id;
				return viewModel[ViewModelUtils.BINDING_ROOT][id + '_options'];
			};

			SelectController.prototype.reset = function reset(viewModel) {
				_super.prototype.reset.call(this);

				if(!this.getValue(viewModel)) {
					var config = this.config;
					var option = viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_options']()[0];
					if(option && option.value) {
						this.setNode(viewModel, config.bind.data, viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_options']()[0].value);
					}
				}

			};

			/**
			 * @note 也可以使用可选模式
			 */
			SelectController.prototype.setOptions = function setOptions(viewModel /* viewModel参数可选，不给也行 */, newOptions) {
				if(arguments.length == 1 && _.isArray(arguments[0])) {
					newOptions = arguments[0];
					viewModel = this.getContainerForm().getViewModel();
				}

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
				viewModel[config.bind.data](value);
				// NEWFIX
				if(_.isFunction(config.bind.change)) {
					config.bind.change.call(null, value, viewModel);
				}
			}

			return SelectController;
		}) (FieldController);


		var DEFAULT_MULTIPART_SELECT_CONTROLLER = {
			ids: null,			// 各个select的id，按层级书序
			entries: null,		// 各个select在model中的入口, 比如city里面有districtMap
			options: null,		// 数据模型,描述层级关系,每个entry需要包含{label: xx, value: xx, 入口: options}
			fieldType: FieldType.COMPOSED_FIELD,
			bind: {
				defaults: null,
				change: null	// 最后一个select数据被更改时触发
			}
		};

		var MultipartSelectController = (function (_super) {
			cKit.__extends(MultipartSelectController, _super);
			function MultipartSelectController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_MULTIPART_SELECT_CONTROLLER);
				_super.call(this, config);
				config = this.config;

				// 参数检查
				if(!_.isArray(config.ids)) {
					throw ('"config.ids" should be an array contains all sub ids for select nodes!');
				}
				if(!_.isArray(config.entries)) {
					throw ('"config.entries" should be an array contains all sub entries for each level of the select node!');
				}

				if(!config.options) {
					throw ('"config.options" should be a js object!');
				}

				if(config.hasOwnProperty('bind')) {
					if(!_.isArray(config.bind.data)) {
						throw ('"config.bind.data" should be an array which contains all data bindings with config.ids!');
					}
					if(config.bind.data.length != config.ids.length) {
						throw ('"config.bind.data" should share same element amount with config.ids!');
					}

					if(config.change && !_.isFunction(config.change)) {
						throw '"Config.change" should be a function!';
					}
				}

				// 为每个select生成controller
				self.controllers = [];
				var bind = config.bind;
				var subId;
				var id = config.id;
				var ids = config.ids;
				for(var index in ids) {
					var functionName = config.id + '_' + ids[index] + '_event_change';
					subId = ids[index];
					self.controllers.push(new SelectController({
						id : ids[index],
						type : ControllerFactory.SELECT_CONTROLLER,
						options: [],
						bind : {
							data : bind.data[index],
							change: 'function(data, event) {return $root["' + ViewModelUtils.OPERATION_ROOT + '"].' + functionName + '($root, ' + index + ',"' + id + '","' + ids[index] + '", event);}'
						}
					}));
				}
			}

			MultipartSelectController.prototype.parseBindings =function parseBindings(viewModel) {
				var config = this.config;
				var id = config.id;
				var ids = config.ids;
				var bind = config.bind;
				var index;

				var originValues = [];

				// 需要将model复制到viewModel中，并且对每个select建立节点
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_model'] = config.options;
				for(index in ids) {
					var subId = ids[index];
					var self = this;
					var vmo = viewModel[bind.data[index]];
					var originValue = (vmo && _.isFunction(vmo)) ? vmo() : null;
					originValues.push(originValue);


					viewModel[ViewModelUtils.OPERATION_ROOT][config.id + '_' + ids[index] + '_event_change'] =
						/** 当select组中的其中一个发生变化的时候的处理函数
						 *
						 * @param viewModel		当前Form的viewModel
						 * @param index			当前Select控件是在组中的索引（0起点）
						 * @param id			当前组的id
						 * @param subId			当前组中select控件的id
						 */
							function(viewModel, index, id, subId, event) {
							// 首先要去的当前select控件改变后的值,不可以使用ko取,只能取到改变前的
							var value = $('#' + ids[index]).val();
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
							for(var index2 in ids) {
								nodeValue = $('#' + ids[index2]).val();
								if(index2 == index) {
									for(var i in nodes) {
										node = nodes[i];
										// NEWFIX 这里不这么做，有可能引起数值比较错误，比如"1"和1比较结果为不相等
										if(('' + node.value) === ('' + nodeValue)) {
											// 对下一个select进行赋值
											var newIndex = parseInt(index2, 10) + 1;
											if(newIndex < ids.length) {
												options = self.controllers[newIndex].getOptions(viewModel);
												var targetEntry = config.entries[index2];
												if(!node[targetEntry] || !node[targetEntry].length) {
													node[targetEntry] = [{label: '', value: 'NONE'}];
												}
												var targetValues = node[targetEntry];
												// 赋值本身采用ko方式
												options.removeAll();
												for(var index3 in targetValues) {
													options.push(targetValues[index3]);
												}
											} else {
												if(bind.change) {
													var array = [];
													for ( var l = 0; l < self.controllers.length; l++) {
														array.push(self.controllers[l].getValue(viewModel));
													}

													bind.change.call(config.self, value, viewModel, event, array);
												}
											}
											return;
										}
									}

								} else if(index2 < index) {
									for(var nodeIndex in nodes) {
										node = nodes[nodeIndex];
										// NEWFIX 这里不这么做，有可能引起数值比较错误，比如"1"和1比较结果为不相等
										if(('' + node.value) === ('' + nodeValue)) {
											nodes = node[config.entries[index2]];
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
					this.controllers[index].applyBindings(viewModel);
				}

				this.reset(viewModel, false);
			};

			/** @Override
			 */
			MultipartSelectController.prototype.reset = function reset(viewModel, delay) {
				_super.prototype.reset.call(this, viewModel, delay);

				var config = this.config;
				var bind = config.bind;
				var ids = config.ids;

				// 第一个没有初值的controller
				var firstEmptyIndex = this.controllers.length - 1;
				// 初始化从第一个select到最后一个有初值的select的Options
				var optionsRoot = config.options;
				for(var index in ids) {
					var array = this.controllers[index].getOptions(viewModel);
					var controller = this.controllers[index];
					var nodeValue = controller.getNodeValue(viewModel, controller.config.bind.data);

					array.removeAll();
					for(var arrayIndex in optionsRoot) {
						array.push(optionsRoot[arrayIndex]);
					}

					for(var subIndex in optionsRoot) {
						var subRoot = optionsRoot[subIndex];
						// NEWFIX 这里不这么做，有可能引起数值比较错误，比如"1"和1比较结果为不相等
						if(('' + subRoot.value) === ('' + nodeValue)) {
							// array相关操作有可能将已选择的item重置成index=0，所以这里需要设置回去
							controller.setNode(viewModel, controller.config.bind.data, nodeValue);
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
					for(var index in ids) {
						if(index < firstEmptyIndex) {
							continue;
						}

						var subId = ids[index];
						cKit.DomUtils.fireEvent($('#' + subId).get(0), 'change');
						break;
					}
				};
				if(delay) {
					ViewModelUtils.addPostCall(viewModel, postCall);
				} else {
					postCall();
				}
			};

			return MultipartSelectController;
		}) (FieldController);

		// NEWFIX
		var TimePickerUtils = {
			generateTime: function(value1, value2) {
				var value = null;
				if(!TimePickerUtils.isValidOption(value1) || !TimePickerUtils.isValidOption(value1)) {
					value = null;
				} else {
					value = value1 + ':' + value2 + ':00';
				}
				return value;
			},

			// NEWFIX
			isValidOption: function (option) {
				if(option === null || _.isUndefined(option) || option === 'NONE') {
					return false;
				}
				return true;
			}
		};

		var DEFAULT_TIME_PICKER_CONTROLLER = {
			fieldType: FieldType.COMPOSED_FIELD,
			bind: {
				defaults: null
			}
		};

		var TimePickerController = (function (_super) {
			cKit.__extends(TimePickerController, _super);
			function TimePickerController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_TIME_PICKER_CONTROLLER);
				_super.call(this, config);
				config = this.config;

				if(!config.options || !_.isArray(config.options.hours) || !_.isArray(config.options.mins)) {
					throw ('config.options.hours and config.options.mins should be arrays!');
				}
				var id = config.id;
				this.controllers = [];
				var ids = [id + '_hour', id + '_min'];
				var options = [config.options.hours, config.options.mins];
				for(var index in ids) {
					var subId = ids[index];
					self.controllers.push(new SelectController({
						id : ids[index],
						type : ControllerFactory.SELECT_CONTROLLER,
						options: options[index],
						bind : {
							data : ViewModelUtils.BINDING_ROOT + '.' + ids[index]
						}
					}));
				}
			}

			TimePickerController.prototype.parseBindings =function parseBindings(viewModel) {
				var config = this.config;
				var id = config.id;
				var bind = config.bind;
				var index;

				viewModel[ViewModelUtils.BINDING_ROOT][id + '_hour'] = ko.observable();
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_min'] = ko.observable();

				var vm = viewModel;

				var computedOption = {
					read: function () {
						var value1 = this[ViewModelUtils.BINDING_ROOT][id + '_hour'](),
							value2 = this[ViewModelUtils.BINDING_ROOT][id + '_min']();

						return TimePickerUtils.generateTime(value1, value2);
					},
					write: function(data) {
						if(!data || !_.isString(data)) {
							return;
						}

						var parts = data.split(':');
						vm[ViewModelUtils.BINDING_ROOT][id + '_hour'](parts[0]);
						vm[ViewModelUtils.BINDING_ROOT][id + '_min'](parts[1]);
					},
					owner: vm
				};
				var computed = ko.computed(computedOption, viewModel);
				var originValue = viewModel[config.bind.data];
				viewModel[config.bind.data] = computed;

				var self = this;
				var lastValue = self.getNodeValue(viewModel, bind.data);
				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(viewModel, bind.data);
						if (value && lastValue != value) {
							bind.change.call(bind, value, viewModel);
						}
						lastValue = value;
					});
				}

				for(index in this.controllers) {
					this.controllers[index].applyBindings(viewModel);
				}

				// 恢复默认值
				if(_.isFunction(originValue)) {
					viewModel[config.bind.data](originValue());
				} else {
					viewModel[config.bind.data](originValue);
				}


			};

			return TimePickerController;
		}) (FieldController);

		var DEFAULT_DATE_PICKER_CONTROLLER = {
			bind: {
				binder: 'value',
				defaults: null
			},
			minDate: null,		// 起始时间
			maxDate: null			// 截止时间
		};

		var DatePickerController = (function (_super) {
			cKit.__extends(DatePickerController, _super);
			function DatePickerController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_DATE_PICKER_CONTROLLER);
				_super.call(this, config);
				config = this.config;

				var picker = $('#' + config.id);
				if(!picker || picker.length < 1) {
					throw 'Can not find "_datePicker" element!';
				}
				picker.datetimepicker({
					format: 'yyyy-mm-dd',
					autoclose: true,
					pickerPosition: 'bottom-left',
					startDate: config.minDate,
					endDate: config.maxDate,
					minView: 2
				});

			}

			DatePickerController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var config = this.config;
				var id = config.id;
				var bind = config.bind;
				var index;

				var self = this;

				$('#' + config.id).change(function() {
					var value = this.value;

					self.setNode(viewModel, bind.data, value);
				});

				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(viewModel, bind.data);
						bind.change.call(bind, value, viewModel);
					});
				}

				this.reset(viewModel, false);
			};

			DatePickerController.prototype.reset = function reset(viewModel, delay) {
				_super.prototype.reset(this, viewModel);
				var config = this.config;
				var id = config.id;
				var bind = config.bind;
				var index;

				var value = this.getNodeValue(viewModel, bind.data);
				if(value) {
					$('#' + config.id).val(value);
				}
			};

			return DatePickerController;
		}) (FieldController);

		var DEFAULT_DATE_RANGE_PICKER_CONTROLLER = {
			fieldType: FieldType.COMPOSED_FIELD,
			bind: {
				binder: null,
				defaults: null,
				data: []		// minDate, maxDate 需要两个字段
			},
			handlerFunction: null
		};

		var DateRangePickerController = (function (_super) {
			cKit.__extends(DateRangePickerController, _super);
			function DateRangePickerController(config1) {
				var self = this;
				var config = ConfigUtils.mergeConfig(config1, DEFAULT_DATE_RANGE_PICKER_CONTROLLER);
				_super.call(this, config);
				config = this.config;

				if(config.bind && (!_.isArray(config.bind.data) || config.bind.data.length !== 2)) {
					throw '"Config.bind.data" should be an Array[2] object!';
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

			DateRangePickerController.prototype.parseBindings =function parseBindings(viewModel) {
				_super.prototype.parseBindings.call(this, viewModel);
				var config = this.config;
				var id = config.id;
				var bind = config.bind;
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
						this.setNode(viewModel, bind.data[0], null);
						this.setNode(viewModel, bind.data[1], null);
						$('#' + id + ' span').html('选择日期');
						return ;
					}

					var sDate = start.toString(Constant.DATE_FORMAT);
					var eDate = end.toString(Constant.DATE_FORMAT);

					var startDate = parseDate(sDate,'Y-m-d');
					var endDate = parseDate(eDate,'Y-m-d');

					// 0 -> start ; 1 -> end
					this.setNode(viewModel, bind.data[0], sDate);
					this.setNode(viewModel, bind.data[1], eDate);

					$('#' + id + ' span').html(startDate.toString(label.yyyyMMddFormat) + label.dateSeparator + endDate.toString(label.yyyyMMddFormat));
				}

				//FIXME 当两个值都改变时，change会被调用两次
				var changeMark = 0;
				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var beginDateValue = self.getNodeValue(viewModel, bind.data[0]);
						var endDateValue = self.getNodeValue(viewModel, bind.data[1]);
						var value = new Object();
						value.beginDate = beginDateValue;
						value.endDate = endDateValue;
						bind.change.call(bind, value, viewModel);
					});
				}
				this.reset(viewModel, false);
			};

			DateRangePickerController.prototype.reset = function reset(viewModel, delay) {
				_super.prototype.reset(this, viewModel, delay);
				var config = this.config;
				var id = config.id;
				var bind = config.bind;
				var index;

				var startValue = this.getNodeValue(viewModel, bind.data[0]);
				var endValue = this.getNodeValue(viewModel, bind.data[1]);

				var invokeHandler = true;
				if(startValue) {
					if(!endValue) {
						endValue = startValue;
					}
				} else if(endValue) {
					startValue = endValue;
				} else {
					invokeHandler = false;
				}

				if(invokeHandler) {
					this.dateRangeChangeHandler(startValue, endValue);
				}

			};

			return DateRangePickerController;
		}) (FieldController);

		var DEFAULT_TIME_RANGE_PICKER_CONTROLLER = {
			fieldType: FieldType.COMPOSED_FIELD,
			bind: {
				defaults: null
			}
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
				var id = config.id;
				this.controllers = [];
				var ids = [id + '_hour_from', id + '_min_from', id + '_hour_to', id + '_min_to'];
				var options = [config.options.hours, config.options.mins, config.options.hours, config.options.mins];
				for(var index in ids) {
					var subId = ids[index];
					self.controllers.push(new SelectController({
						id : ids[index],
						type : ControllerFactory.SELECT_CONTROLLER,
						options: options[index],
						bind : {
							data : ViewModelUtils.BINDING_ROOT + '.' + ids[index]
						}
					}));
				}
			}

			TimeRangePickerController.prototype.reset = function(viewModel, delay) {
				_super.prototype.reset.call(this, viewModel, delay);

				for(var index in this.controllers) {
					var c = this.controllers[index];
					c.reset(viewModel, delay);
				}
			};

			TimeRangePickerController.prototype.parseBindings =function parseBindings(viewModel) {
				var config = this.config;
				var id = config.id;
				var bind = config.bind;
				var index;
				/* 会在binding节点上创造出多个与select绑定的值节点,真正接受外界data输入的节点为一个computed节点
				 * 通过它来向各个值节点写入数据或者由各个节点合成出目标数据
				 */
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_hour_from'] = ko.observable();
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_min_from'] = ko.observable();
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_hour_to'] = ko.observable();
				viewModel[ViewModelUtils.BINDING_ROOT][id + '_min_to'] = ko.observable();

				var vm = viewModel;

				var computedOption = {
					read: function () {
						var suffix = '_from';
						var value1 = TimePickerUtils.generateTime(this[ViewModelUtils.BINDING_ROOT][id + '_hour' + suffix](), this[ViewModelUtils.BINDING_ROOT][id + '_min' + suffix]());
						suffix = '_to';
						var value2 = TimePickerUtils.generateTime(this[ViewModelUtils.BINDING_ROOT][id + '_hour' + suffix](), this[ViewModelUtils.BINDING_ROOT][id + '_min' + suffix]());

						if(null === value1 || null === value2) {
							return null;
						}
						if('NONE' == value1 || 'NONE' == value2) {
							return null;
						}

						return value1 + '-' + value2;
					},
					write: function(data) {
						var times = {
							'0': {
								parts: [null, null],
							},
							'1': {
								parts: [null, null],
							}
						};

						if(_.isString(data)) {
							var tempTimes = data.split('-');


							for(var index in tempTimes) {
								times[index].parts = tempTimes[index].split(':');
							}
						}

						var suffixes = ['_from', '_to'];
						for(var index in times) {
							var suffix = suffixes[index];
							vm[ViewModelUtils.BINDING_ROOT][id + '_hour' + suffix](times[index].parts[0]);
							vm[ViewModelUtils.BINDING_ROOT][id + '_min' + suffix](times[index].parts[1]);
						}
					},
					owner: vm
				};
				var computed = ko.computed(computedOption, viewModel);
				var originValue = viewModel[config.bind.data];
				viewModel[config.bind.data] = computed;

				var self = this;
				var lastValue = self.getNodeValue(viewModel, bind.data);
				if (bind.change) {
					this.addBinding(Binding.CHANGE, function(){
						var value = self.getNodeValue(viewModel, bind.data);
						if (value && lastValue != value) {
							bind.change.call(bind, value, viewModel);
						}
						lastValue = value;
					});
				}

				for(index in this.controllers) {
					this.controllers[index].applyBindings(viewModel);
				}

				// 恢复默认值
				viewModel[config.bind.data](originValue());
			};

			return TimeRangePickerController;
		}) (FieldController);

		var DEFAULT_FIELD_GROUP_CONTROLLER_CONFIG = {
			fieldType: FieldType.GROUP_FIELD,
			bind: {
				binder: 'if',
				data: null,
				autoCreate: true
			}
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

			/** 为fieldGroup 建立子节点
			 *
			 * 子节点必须为observable的一种，不可以直接为值
			 *
			 */
			FieldGroupController.prototype.createSubNode = function createNode(field, root) {
				var config = field.config;
				var bind = config.bind;
				var isArray = false;

				if (bind && bind.hasOwnProperty('type') && (bind.type === cKit.DataType.ARRAY))  {
					isArray = true;
				}

				var bindName = null;
				if(config.options) {
					bindName = config.options;
				} else if(bind && bind.data && _.isString(bind.data) && bind.data.indexOf('.') < 0) {
					bindName = bind.data;
				}

				if(_.isString(bindName)) {
					var node = root[bindName];
					if(!node) {
						if(bind.autoCreate === true) {
							var objectType = isArray ? 'ARRAY' : 'normal';
							console.warn('FieldGroupController: WARNING! Source data is missing property field["' + bindName + '"], fill it with ' + objectType + ' object.');

							var nodeObject = null;
							if(isArray) {
								nodeObject = ko.observableArray([]);

								var times;
								var capacityMin = bind.capacity[0];
								var capacityMax = bind.capacity[1];
								var viewModelCapacity = nodeObject().length;

								if (viewModelCapacity  > capacityMax) {
									times = viewModelCapacity - capacityMin;
									for (var k = 0; k < times; k++) {
										nodeObject.pop();
									}
								} else if (viewModelCapacity < capacityMin) {
									times = capacityMin - viewModelCapacity;
									for (var j = 0; j < times; j++) {
										var defaults = bind.defaults;
										var item = _.clone(defaults);
										nodeObject.push(item);

									}
								}
							} else {
								nodeObject = ko.observable(bind.defaults);
							}
							root[bindName] = nodeObject;
						}
					}
				}

			},

				FieldGroupController.prototype.parseBindings =function parseBindings(viewModel) {
					var config = this.config;
					var bind = config.bind;

					var nodeName = config.bind ? config.bind.data : null;
					if(nodeName) {
						this.addBinding(Binding.WITH, this.getNodeName(viewModel, nodeName));
						this.addBinding(Binding.VISIBLE, this.getNodeNameEvaluable(viewModel, nodeName));
					} else {
						throw '"Config.bind.data" should be an object!';
					}

					UiUtils.applyBindingsForObject(this.target, config, this.getBindings(), viewModel);
					this.viewModel = viewModel;

					var self = this;
					var vm = viewModel;
					var node = this.getNode(viewModel, nodeName);
					if(_.isUndefined(node)) {
						node = null;
					}
					node = KoUtils.isObservable(node) ? node : ko.observable(node);
					viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_group'] = node;
					this.setNode(viewModel, nodeName, ko.computed({
						/** 节点写入处理函数
						 *
						 * fieldGroup节点必须为observable对象,不可以为单值对象
						 *
						 */
						write: function(options) {
							if(null !== options && !_.isUndefined(options)) {
								for(var index in self.fields) {
									var field = self.fields[index];
									// 为节点填充所需子节点
									self.createSubNode(field, options);
								}
							}
							/* 这里检查是否是observable的唯一原因是，当FormController.updateModel()时,
							 * 传入的options有可能为一个observable对象,这里只需要根节点为object的对象
							 * 所以,去掉包裹的observable
							 * 
							 */
							if(KoUtils.isObservableNode(options)) {
								options = options();
							}
							viewModel[ViewModelUtils.BINDING_ROOT][config.id + '_group'](options);

							if(null !== options && !_.isUndefined(options)) {
								for(var index in self.fields) {
									var field = self.fields[index];
									// 更新节点目标
									field.updateTarget();
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
					}));

					UiUtils.bindControllers.call(this, config, vm);
				};
			//当viewModel中的绑定的数组长度不等于fields中配置的capacity数组的长度时，根据配置情况增加或者减少控件
			FieldGroupController.prototype.alignCapacity = function alignCapacity(fieldConfig) {
				var bind = fieldConfig.bind;
				var times;
				var viewModel = this.viewModel;
				if (_.isArray(bind.capacity)) {
					var capacityMin = bind.capacity[0];
					var capacityMax = bind.capacity[1];
					var node = this.getNodeValue(viewModel);
					var viewModelCapacity = 0;

					if(node) {
						node = node[bind.data];
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
								var defaults = bind.defaults;
								var item = _.clone(defaults);
								node.push(item);

							}
						}
					}
				}
			};

			FieldGroupController.prototype.validate = function validate(model) {
				var COUNT = this.fields.length,
					i = 0,
					field,
					config,
					viewModelValue,
					validateResult = true;

				// 如果fieldGroup在viewModel下的值为null，那么就不需要判断它的节点。
				viewModelValue = this.getNodeValue(this.viewModel, this.config.bind.data);
				if (viewModelValue) {
					for(; i < COUNT; ++i) {
						field = this.fields[i];
						config = this.config.fields[i];
						if(config.hasOwnProperty('bind') && config.bind.type === cKit.DataType.ARRAY) {
							if(cKit.ObjectUtils.hasMethod(field, 'validateArray')) {
								var arrayData = field.getNodeValue(this.viewModel, config.bind.data);
								if(!field.validateArray(arrayData, viewModelValue)) {
									validateResult = false; // failed with field validation
								}
							}
						} else if(config.bind && config.bind.data && field.validate(viewModelValue) === false) {
							validateResult = false; // failed with field validation
						}
					}
				}
				return validateResult;
			}

			FieldGroupController.prototype.reset = function reset(viewModel) {
				var fieldConfigs = this.config.fields;
				var COUNT = fieldConfigs.length,
					i = 0,
					bind,
					fieldConfig,
					field;
				// reset fields
				for(; i < COUNT; ++i) {

					fieldConfig = fieldConfigs[i];
					field = this.fields[i];
					bind = fieldConfig.bind;

					if (fieldConfig.hasOwnProperty('bind') && bind.hasOwnProperty('capacity') && field.alignCapacity) {
						field.alignCapacity(fieldConfig);
					}

					if(_.isFunction(field.reset)) {
						field.reset(viewModel);
					}

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
		var ControllerFactory = {
			NODE_CONTROLLER: {
				name: 'NodeController',
				__ctor: NodeController
			},

			EDIT_CONTROLLER: {
				name: 'EditController',
				__ctor: EditController
			},

			DATE_PICKER_CONTROLLER: {
				name: 'DatePickerController',
				__ctor: DatePickerController
			},

			DATE_RANGE_PICKER_CONTROLLER: {
				name: 'DateRangePickerController',
				__ctor: DateRangePickerController
			},

			TEXT_AREA_CONTROLLER: {
				name: 'TextAreaController',
				__ctor: TextAreaController
			},

			LABEL_CONTROLLER: {
				name: 'LabelController',
				__ctor: LabelController
			},

			BUTTON_CONTROLLER: {
				name: 'ButtonController',
				__ctor: ButtonController
			},

			CHECK_BOX_CONTROLLER: {
				name: 'CheckBoxController',
				__ctor: CheckBoxController
			},

			RADIO_GROUP_CONTROLLER: {
				name: 'RadioGroupController',
				__ctor: RadioGroupController
			},

			CHECK_BOX_GROUP_CONTROLLER: {
				name: 'CheckBoxGroupController',
				__ctor: CheckBoxGroupController
			},

			SELECT_CONTROLLER: {
				name: 'SelectController',
				__ctor: SelectController
			},

			TIME_PICKER_CONTROLLER: {
				name: 'TimePickerController',
				__ctor: TimePickerController
			},

			TIME_RANGE_PICKER_CONTROLLER: {
				name: 'TimeRangePickerController',
				__ctor: TimeRangePickerController
			},

			TABLE_CONTROLLER: {
				name: 'TableController',
				__ctor: TableController
			},

			TABLE_HEAD_CONTROLLER: {
				name: 'TableHeadController',
				__ctor: TableHeadController
			},

			FIELD_GROUP_CONTROLLER: {
				name: 'FieldGroupController',
				__ctor: FieldGroupController
			},

			MULTIPART_SELECT_CONTROLLER: {
				name: 'MultipartSelectController',
				__ctor: MultipartSelectController
			},

			AUTO_COMPLETE_CONTROLLER: {
				name: 'AutoCompleteController',
				__ctor: AutoCompleteController
			},

			FILTER_EDIT_CONTROLLER: {
				name: 'FilterEditController',
				__ctor: FilterEditController
			},

			QUANTITY_EDIT_CONTROLLER: {
				name: 'QuantityEditController',
				__ctor: QuantityEditController
			},

			IMAGE_CONTROLLER: {
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
			onSubmit: null,
			action: null,
			method: 'post',
			reset: true, 			// 设置非表单提交之后，表单内容是否重置为初始值
			isForm: true,			// 是否是Form节点
			delayBindings: true		// 是否在最后ko.applyBindings时延迟绑定
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
					this.target.attr('action', config.action);
					if(!config.method) {
						throw ('config.method should be "post" or other avaiable string!');
					}

					this.target.attr('method', config.method);
				}
				// --参数检查

				var fieldConfigs = config.fields;

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

			FormController.prototype.submit = function() {
				var data = this.getValue();
				var self = this;
				var validateResult = true;
				var viewModel = this.viewModel;
				// validate each field
				var COUNT = this.config.fields.length,
					i = 0,
					field,
					config,
					value;
				var retResult = true;

				for(; i < COUNT; ++i) {
					field = this.fields[i];
					config = this.config.fields[i];

					if(config.hasOwnProperty('bind') && config.bind.type === cKit.DataType.ARRAY) {
						if(cKit.ObjectUtils.hasMethod(field, 'validateArray')) {
							if(!field.validateArray(data[config.bind.data], data)) {
								console.warn('Vaildate failed for id[' + config.id + ']!');
								validateResult = false; // failed with field validation
							}
						}
					} else if(config.bind && config.bind.data && field.validate(data) === false) {
						console.warn('Vaildate failed for id[' + config.id + ']!');
						validateResult = false; // failed with field validation
					}
				}

				// We need wait for every validator to be passed
				// If anything went wrong, we will abort submit action
				if(!validateResult) {
					return false;
				}

				var submitResult = false;
				if(this.config.onSubmit) {
					submitResult = (this.config.onSubmit(data) !== false);
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
								self.reset(viewModel);
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
				this.model = model;

				var mergeFlags = flags & FormController.FLAG_MERGE_WITH_VIEW_MODEL ? ViewModelUtils.FLAG_MERGE_WITH_VIEW_MODEL : 0;
				ViewModelUtils.fromJS(model, this.viewModel, null, null, mergeFlags);
				var viewModel = this.viewModel;
				// reset each field in the form to original state
				var fieldConfigs = this.config.fields;
				var COUNT = fieldConfigs.length,
					i = 0,
					bind,
					fieldConfig,
					field;
				// reset fields
				for(; i < COUNT; ++i) {

					fieldConfig = fieldConfigs[i];
					field = this.fields[i];
					bind = fieldConfig.bind;

					if (fieldConfig.hasOwnProperty('bind') && bind.hasOwnProperty('capacity') && field.alignCapacity) {
						field.alignCapacity(fieldConfig);
					}

					if(!(flags & FormController.FLAG_DO_NOT_RESET) && _.isFunction(field.reset)) {
						field.reset(viewModel);
					}

				}
			};

			FormController.prototype.reset = function reset(viewModel) {
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
				this.applyBindings(this.viewModel);
				var self = this;

				var config = this.config;
				function applyBindings() {
					ko.applyBindings(self.viewModel, self.target.get(0));
					var postCalls = ViewModelUtils.getPostCalls(self.viewModel);
					ViewModelUtils.clearPostCalls(self.viewModel);
					for(var index in postCalls) {
						postCalls[index]();
					}
					postCalls = null;
				}

				if(config.delayBindings) {
					setTimeout(applyBindings, CONFIG.BINDING_DELAY_MS);
				} else {
					applyBindings();
				}
			};

			FormController.prototype.getController = function getController (controllerId) {
				var formControllers = this.viewModel[ViewModelUtils.CONTROLLER_ROOT];
				if (formControllers[controllerId]){
					return formControllers[controllerId];
				}else {
					throw 'can not find controller with id "'+ controllerId +'"';
				}
			};

			FormController.FLAG_DO_NOT_RESET = 0x1;
			FormController.FLAG_MERGE_WITH_VIEW_MODEL = ViewModelUtils.FLAG_MERGE_WITH_VIEW_MODEL;

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

			autoCreateFieldType : {
				INPUT : ControllerFactory.EDIT_CONTROLLER,
				LABEL : ControllerFactory.LABEL_CONTROLLER,
				SPAN : ControllerFactory.LABEL_CONTROLLER
			},

			getAutoCreateNodes : function getAutoCreateNodes(idPrefix, node, elementsArray){
				//判断是否是元素节点  
				if(node.nodeType == 1){
					var nodeName = node.nodeName;
					if (FormUtils.autoCreateFields.indexOf(nodeName) != -1) {
						//获得id属性节点
						var attributeOfId = node.attributes['id'];
						var attributeOfType = node.attributes['type'];
						var id = '',type = '';
						if(attributeOfId){
							id = attributeOfId.nodeValue;
						}
						if(attributeOfType){
							type = attributeOfType.nodeValue;
						}
						//id满足指定格式的LABEL 和  TEXTINPUT的节点存入目标节点数组
						if (id != null && id != '') {
							var idStr = id.split('_');
							if(nodeName == 'INPUT' && type != 'text') {
								return;
							}
							if(nodeName == 'SPAN' && idStr[idStr.length - 1] == 'hint') {
								return;
							}
							var idPoint = id.substring(0,id.lastIndexOf('_'));
							if (idPoint == idPrefix){
								var idPostfix = id.substring(id.lastIndexOf('_') + 1, id.length);
								var eleObj = {};
								eleObj.id = id;
								eleObj.data = idPostfix;
								eleObj.type = node.nodeName;
								elementsArray.push(eleObj);
							}
						}
					}
					//判断该元素节点是否有子节点 (出口) 
					if(node.hasChildNodes){
						var sonnodes = node.childNodes;
						for (var i = 0; i < sonnodes.length; i++) {
							var sonnode = sonnodes.item(i);
							getAutoCreateNodes(idPrefix,sonnode,elementsArray);
						}
					}
				}
			},

			generateFields : function generateFields (idPrefix, targetFields){

				if (arguments.length != 2 && (!_.isString(idPrefix) || (targetFields && !_.isArray(targetFields)))) {
					throw 'this function need two params, first must be a String and the other must be an Array';
				}

				targetFields = targetFields || [];
				var targetElements = [];

				var rootElements = document.getElementById(idPrefix);
				this.getAutoCreateNodes(idPrefix, rootElements, targetElements);

				var length = targetFields.length

				for (var j = 0; j < length; j++) {
					var field = targetFields[j];
					for (var i = 0; i < targetElements.length; i++) {
						var element = targetElements[i];
						var autoCreateConfig = this.generateDefaultConfig(element);
						if (field.id == element.id) {

							var newfield = ConfigUtils.mergeConfig(field, autoCreateConfig);
							var index = targetFields.indexOf(field);
							//将原有的field配置   替换
							targetFields.splice(targetFields.indexOf(field),1,newfield);
							//将处理完的节点从数组中删除
							targetElements.splice(targetElements.indexOf(element),1);
						}
					}

				}

				//最后将节点数组中未处理的节点生成自动配置加到fields中
				for (var i = 0; i < targetElements.length; i++) {
					var element = targetElements[i];
					var autoCreateConfig = this.generateDefaultConfig(element);
					targetFields.push(autoCreateConfig);
				}
				return targetFields;
			},

			generateDefaultConfig : function generateDefaultConfig(autoCreateElement){
				var autoCreateConfig = new Object();
				autoCreateConfig.id = autoCreateElement.id;
				autoCreateConfig.type = FormUtils.autoCreateFieldType[autoCreateElement.type];
				autoCreateConfig.bind = {
					data : autoCreateElement.data
				};
				//若html存在_hint域，则默认给控件加上 非空验证 FIXME 可不要
				if (autoCreateElement.type == 'INPUT' && $('#' + autoCreateElement.id + '_hint').length > 0) {
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
				if(config.fnYes){
					config.fnYes();
				}
				systermCommonConfirmDialog.hide();
			});

			$("#commonConfirmDialogBtnNo").bind("click",function(){
				if(config.fnNo){
					config.fnNo();
				}
				systermCommonConfirmDialog.hide();
			});
			systermCommonConfirmDialog.show();
			return systermCommonConfirmDialog;
		};
		///// 暴露的东西
		return {
			Validator: Validator,
			Orientation: Orientation,
			Utils: Utils,
			Alert: Alert,
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
			ControllerFactory: ControllerFactory,


			// Page Component
			PageController: PageController,

			internal: {
				Utils: Utils,
				KoUtils: KoUtils,
				ViewModelUtils: ViewModelUtils,
				DiffUtils: DiffUtils,
				UiUtils: UiUtils,
				ConfigUtils: ConfigUtils
			}
		};

		/* Controller集成关系
		 WidgetController - target, disable, enable, updateTarget, updateConfig
		 Dialog - onShow, onHide
		 ViewController - parseBinding, addBinding, applyBindings, reset, createNode, getNode, setNode, getValue, getNodeValue, getNodeName
		 FieldController
		 AutoCompleteController （没有使用）
		 ButtonController
		 CheckBoxController
		 ChooserGroupController
		 CheckBoxGroupController
		 RadioGroupController
		 DatePickerController
		 DateRangePickerController
		 FieldGroupController
		 ImageController
		 InputController
		 EditController
		 FilterEditController
		 TextAreaController
		 LabelController
		 TableHeadController
		 MultipartSelectController
		 NodeController （没有使用）
		 QuantityEditController （没有使用）
		 SelectController
		 TableController
		 TimePickerController
		 TimeRangePickerController
		 FormController
		 DiffFormController
		 */
	});
