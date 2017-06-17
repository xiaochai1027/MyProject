/**
 * =Network Kit=
 *
 * -=[ jisong's jskit 约定 ]=-
 *
 * 1. *Kit为功能包，只是各种核心功能，不包含O-O特性；每个函数都是自包含 2. 在Kit功能上层开始使用O-O特性，并且启用this指针修正 3.
 * 关于this指针与函数命名，一个类将包含两种函数 a. 一种为普通函数，this指针原则上指向类对象本身。 b.
 * 第二种为回调函数，命名有on开头，例如onSuccess(self, arg1, arg2)；此类函数
 * 接受至少一个参数，并且第一个参数一定为self，并且指向类对象本身。但是this指针 具体指向将有回调者上下文决定。
 */

define(['underscore', 'coreKit', 'jquery-json'], function(_, cKit) {

	var CONTENT_TYPE = {
		JSON: 'application/json; charset=UTF-8',
		MULTIPART: 'multipart/form-data'
	};

	var STATUS_CODE = {
		SUCCESS: '100000',
		ERROR: '100001',
		SESSION_TIMEOUT: '900102',
		SESSION_TIMEOUT2: '900101'
	};
	var commonHeader = {
		"shbj-device":"BROWSER"
	};

	var Base64 = {

		// private property
		_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

		// public method for encoding
		encode: function (input) {
			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;

			input = Base64._utf8_encode(input);

			while (i < input.length) {

				chr1 = input.charCodeAt(i++);
				chr2 = input.charCodeAt(i++);
				chr3 = input.charCodeAt(i++);

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}

				output = output +
					this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
					this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

			}

			return output;
		},

		// public method for decoding
		decode: function (input) {
			var output = "";
			var chr1, chr2, chr3;
			var enc1, enc2, enc3, enc4;
			var i = 0;

			input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

			while (i < input.length) {

				enc1 = this._keyStr.indexOf(input.charAt(i++));
				enc2 = this._keyStr.indexOf(input.charAt(i++));
				enc3 = this._keyStr.indexOf(input.charAt(i++));
				enc4 = this._keyStr.indexOf(input.charAt(i++));

				chr1 = (enc1 << 2) | (enc2 >> 4);
				chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
				chr3 = ((enc3 & 3) << 6) | enc4;

				output = output + String.fromCharCode(chr1);

				if (enc3 != 64) {
					output = output + String.fromCharCode(chr2);
				}
				if (enc4 != 64) {
					output = output + String.fromCharCode(chr3);
				}

			}

			output = Base64._utf8_decode(output);

			return output;

		},

		// private method for UTF-8 encoding
		_utf8_encode: function (string) {
			string = string.replace(/\r\n/g, "\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {

				var c = string.charCodeAt(n);

				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if ((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}

			}

			return utftext;
		},

		// private method for UTF-8 decoding
		_utf8_decode: function (utftext) {
			var string = "";
			var i = 0;
			var c = c1 = c2 = 0;

			while (i < utftext.length) {

				c = utftext.charCodeAt(i);

				if (c < 128) {
					string += String.fromCharCode(c);
					i++;
				}
				else if ((c > 191) && (c < 224)) {
					c2 = utftext.charCodeAt(i + 1);
					string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
					i += 2;
				}
				else {
					c2 = utftext.charCodeAt(i + 1);
					c3 = utftext.charCodeAt(i + 2);
					string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}

			}

			return string;
		}

	}

	/**
	 * @result true 已经被处理，不要继续
	 */
	function preprocessResult(result) {

		var code = "";
		if(result.hasOwnProperty('code')){
			code = result.code;
		}else if(result.hasOwnProperty('resultCode')){
			code = result.resultCode;
		}
		if(code == STATUS_CODE.SESSION_TIMEOUT || code == STATUS_CODE.SESSION_TIMEOUT2) {
			alert('会话已过期，请重新登录！');
			var url = "/index.html";
			var obj = {
				type : 'changeLoaction',
				url : url
			};
			window.parent.postMessage($.toJSON(obj),"*");
			return true;
		} else if(result.resultCode == STATUS_CODE.ERROR) {
			if(result.resultMessage.indexOf(result.errorId) >= 0 || !result.errorId) {
				alert(result.resultMessage);
			} else{
				alert(result.resultMessage + '(' + result.errorId + ')');
			}
			return true;
		}

		return false;
	}

	function processError(jqXHR, textStatus, self, onError) {
		if ((jqXHR.status == '200') && (jqXHR.getResponseHeader('Page-Name') == 'LOGIN')) {
			window.location.href = '/index.html';
		}
		onError.call(self, textStatus, jqXHR);
	}

	function postSync(self, url, request, onSuccess, onError, headers) {
		headers = headers || null;
		if (!url) {
			throw 'invalid url!';
		}

		var data = null;
		var contentType = null;
		var processData = null;
		if (request instanceof FormData) {
			data = request;
			contentType = CONTENT_TYPE.MULTIPART;
			processData = false;
		} else {
			data = $.toJSON(request);
			contentType = CONTENT_TYPE.JSON;
			processData = true;
		}

		$.ajax({
			type : 'POST',
			url : url,
			data : data,
			contentType : contentType,
			processData : processData,
			dataType : 'json',
			async : false,
			headers: headers,
			// cache设置成false，确保每次调用都会发送请求到服务器端
			// If set to false, it will force requested pages not to be
			// cached by the browser.
			// Setting cache to false also appends a query string
			// parameter, '_=[TIMESTAMP]', to the URL.
			cache : false,
			success : function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error : function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}

	function getSync(self, url, onSuccess, onError, headers) {
		headers = headers || null;
		if(!url) {
			throw 'invalid url!';
		}

		$.ajax({
			type : 'GET',
			url : url,
			dataType : 'json',
			async : false,
			cache : false,
			headers: headers,
			success : function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error : function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}

	function postAsync(self, url, request, onSuccess, onError, headers) {
		headers = headers || null;
		if(!url) {
			throw 'invalid url!';
		}

		var data = null;
		var contentType = null;
		var processData = null;
		if (request instanceof FormData) {
			data = request;
			contentType = CONTENT_TYPE.MULTIPART;
			processData = false;
		} else {
			data = $.toJSON(request);
			contentType = CONTENT_TYPE.JSON;
			processData = true;
		}

		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			contentType: contentType,
			processData : processData,
			dataType: 'json',
			async: true,
			cache: false,
			headers: headers,
			xhrFields: {
				withCredentials: true
			},
			timeout: 60000,
			success : function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}

	function getAsync(self, url, onSuccess, onError, headers) {
		headers = headers || null;
		if(!url) {
			throw 'invalid url!';
		}

		$.ajax({
			type: 'GET',
			url: url,
			dataType: 'json',
			async: true,
			cache: false,
			headers: headers,
			timeout: 10000,
			success : function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}
	function crossDomainGet(self, url, onSuccess, onError) {
		if(!url) {
			throw 'invalid url!';
		}

		$.ajax({
			type: 'get',
			url: url,
			dataType: "jsonp",
			success : function(result) {
				var res = _.isFunction(result) ? result() : result;
				if(preprocessResult(res)) {
					return;
				}
				onSuccess.call(self, res);
			},
			error: function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}
	function crossDomainFormPost(self, url, request, onSuccess, onError, headers) {
		headers = headers || null;
		if(!url) {
			throw 'invalid url!';
		}
		$.ajax({
			type: 'POST',
			url: url,
			data: request,
			xhrFields: {
				withCredentials: true
			},
			cache: false,
			headers: headers,
			contentType: "application/x-www-form-urlencoded",
			success : function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}
	function simpleFormPost(self, url, request, onSuccess, onError, headers) {
		headers = headers || null;
		if(!url) {
			throw 'invalid url!';
		}
		$.ajax({
			type: 'POST',
			url: url,
			data: request,
			cache: false,
			headers: headers,
			contentType: "application/x-www-form-urlencoded",
			success : function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}

	function syncCrossDomainFormPost(self, url, request, onSuccess, onError, headers) {
		headers = headers || null;
		if(!url) {
			throw 'invalid url!';
		}
		$.ajax({
			type: 'POST',
			url: url,
			data: request,
			xhrFields: {
				withCredentials: true
			},
			cache: false,
			async : false,
			headers: headers,
			contentType: "application/x-www-form-urlencoded",
			success : function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}
	function crossDomainPost(self, url, request, onSuccess, onError, headers) {
		headers = headers || null;
		if(!url) {
			throw 'invalid url!';
		}
		$.ajax({
			type: 'POST',
			url: url,
			data: $.toJSON(request),
			xhrFields: {
				withCredentials: true
			},
			cache: false,
			headers: headers,
			contentType: "application/json;charset=utf-8",
			success : function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}

	function syncCrossDomainPost(self, url, request, onSuccess, onError, headers) {
		headers = headers || null;
		if (!url) {
			throw 'invalid url!';
		}

		var data = null;
		var contentType = null;
		var processData = null;
		if (request instanceof FormData) {
			data = request;
			contentType = CONTENT_TYPE.MULTIPART;
			processData = false;
		} else {
			data = $.toJSON(request);
			contentType = CONTENT_TYPE.JSON;
			processData = true;
		}
		$.ajax({
			type: 'POST',
			url: url,
			async : false,
			data: $.toJSON(request),
			xhrFields: {
				withCredentials: true
			},
			cache: false,
			headers: headers,
			contentType: "application/json;charset=utf-8",
			success : function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				processError(jqXHR, textStatus, self, onError);
			}
		});
	}



	var ACTION_TYPE = {
		GET: 1,
		POST: 2,
		CROSSDOMAINFORMPOST: 3,
		CROSSDOMAINGET : 4,
		CROSSDOMAINPOST: 5,
		SYNCCROSSDOMAINPOST: 6,
		SIMPLEFORMPOST:7,
		SYNCCROSSDOMAINFORMPOST: 8
	};

	var SYNC_TYPE = {
		SYNC: 1,	//同步
		ASYNC: 2	//异步
	};

	// Base class
	var AbstractAjaxAction = (function (_super) {
		cKit.__extends(AbstractAjaxAction, _super);
		function AbstractAjaxAction (actionType, syncType) {
			this.headers =  commonHeader;
			this.actionType = actionType || ACTION_TYPE.GET;
			this.syncType = syncType || SYNC_TYPE.SYNC;
		}

		AbstractAjaxAction.prototype.submit = function(data) {
			if (this.validate(data)) {
				var func = null;
				switch(this.actionType) {
					case ACTION_TYPE.GET:
						if(this.syncType === SYNC_TYPE.SYNC) {
							func = getSync;
						} else if(this.syncType === SYNC_TYPE.ASYNC) {
							func = getAsync;
						} else {
							throw 'unknown sync type!';
						}
						func(this, this.buildUrl(data),
							this.handleSuccess, this.handleError, this.headers);
						break;
					case ACTION_TYPE.POST:
						if(this.syncType === SYNC_TYPE.SYNC) {
							func = postSync;
						} else if(this.syncType === SYNC_TYPE.ASYNC) {
							func = postAsync;
						} else {
							throw 'unknown sync type!';
						}
						func(this, this.buildUrl(data), this.buildRequest(),
							this.handleSuccess, this.handleError, this.headers);
						break;
					case ACTION_TYPE.CROSSDOMAINFORMPOST:
						func = crossDomainFormPost;
						func(this, this.buildUrl(data), this.buildRequest(),
							this.handleSuccess, this.handleError, this.headers);
						break;
					case ACTION_TYPE.SIMPLEFORMPOST:
						func = simpleFormPost;
						func(this, this.buildUrl(data), this.buildRequest(),
							this.handleSuccess, this.handleError, this.headers);
						break;
					case ACTION_TYPE.CROSSDOMAINPOST:
						func = crossDomainPost;
						func(this, this.buildUrl(data), this.buildRequest(),
							this.handleSuccess, this.handleError, this.headers);
						break;
					case ACTION_TYPE.CROSSDOMAINGET:
						func = crossDomainGet;
						func(this, this.buildUrl(data),
							this.handleSuccess, this.handleError);
						break;
					case ACTION_TYPE.SYNCCROSSDOMAINPOST:
						func = syncCrossDomainPost;
						func(this, this.buildUrl(data), this.buildRequest(),
							this.handleSuccess, this.handleError, this.headers);
						break;
					case ACTION_TYPE.SYNCCROSSDOMAINFORMPOST:
						func = syncCrossDomainFormPost;
						func(this, this.buildUrl(data), this.buildRequest(),
							this.handleSuccess, this.handleError, this.headers);
						break;
					default:
						throw 'unknown action type!';

				}



				this.clear(data);
			}
		};

		AbstractAjaxAction.prototype.setHeaders = function(headers) {
			this.headers = headers;

		};

		AbstractAjaxAction.prototype.getHeaders = function(headers) {
			return this.headers;
		};

		AbstractAjaxAction.prototype.validate = function(data) {
			return true;
		};

		AbstractAjaxAction.prototype.buildUrl = function(data) {
			return '';
		};

		AbstractAjaxAction.prototype.buildRequest = function(data) {
			return null;
		};

		AbstractAjaxAction.prototype.handleSuccess = function(result) {
		};

		AbstractAjaxAction.prototype.handleError = function(result) {
		};

		AbstractAjaxAction.prototype.clear = function(data) {
		};

		return AbstractAjaxAction;
	}) (cKit.CoreObject);

	/*
	 var CommonSyncGetAction = (function (_super) {
	 cKit.__extends(CommonSyncGetAction, _super);
	 function CommonSyncGetAction () {
	 }

	 return CommonSyncGetAction;
	 }) (cKit.CoreObject);
	 */

	/**
	 * AbstractAjaxAction
	 *
	 * @returns
	 */
	var CommonAjaxAction = (function (_super) {
		cKit.__extends(CommonAjaxAction, _super);

		function CommonAjaxAction(actionType, syncType, self, url, successHandler, errorHandler) {
			_super.call(this, actionType, syncType);

			this.self = self;
			this.url = url;
			this.successHandler = successHandler;
			if(!_.isFunction(errorHandler)) {
				console.warn('SimplePostAction: errorHandler should be a function!');
				this.errorHandler = CommonAjaxAction.DEFAULT_ERROR_HANDLER;
			} else {
				this.errorHandler = errorHandler;
			}
		}

		CommonAjaxAction.prototype.validate = function() {
			return true;
		};

		CommonAjaxAction.prototype.buildUrl = function() {
			return this.url;
		};

		CommonAjaxAction.prototype.handleSuccess = function(result) {
			this.successHandler.call(this, this.self, result);
		};

		CommonAjaxAction.prototype.handleError = function(result, jqXHR) {
			var cb = this.errorHandler;
			if(_.isFunction(cb)) {
				cb.call(this, this.self, result, jqXHR);
			}
		};

		CommonAjaxAction.prototype.clear = function() {
		};

		return CommonAjaxAction;
	}) (AbstractAjaxAction);

	CommonAjaxAction.DEFAULT_ERROR_HANDLER = function(self, result, jqXHR) {
		if (result === 'error') {
			alert("电脑上网有问题，可以尝试打开别的网站确认下上网是否正常！");
		} else if (result === 'timeout') {
			alert("你好，系统读取数据有点缓慢，如果连续多次出现此提示，请联系技术支持！");
		} else {
			var code = jqXHR ? 'status: ' + jqXHR.status + '\nreadyState: ' + jqXHR.readyState: '';
			alert('这个操作在服务器端出现问题，请联系技术人员！ \n' + code + '\ntext: ' + result + '\nurl: ' + this.url);
		}
	}

	var SimpleGetAction = (function (_super) {
		cKit.__extends(SimpleGetAction, _super);

		function SimpleGetAction(self, url, successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.GET, SYNC_TYPE.SYNC, self, url, successHandler, errorHandler);
		}
		return SimpleGetAction;
	}) (CommonAjaxAction);

	var SimpleAsyncGetAction = (function (_super) {
		cKit.__extends(SimpleAsyncGetAction, _super);

		function SimpleAsyncGetAction(self, url, successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.GET, SYNC_TYPE.ASYNC, self, url, successHandler, errorHandler);
		}
		return SimpleAsyncGetAction;
	}) (CommonAjaxAction);

	var SimplePostAction = (function (_super) {
		cKit.__extends(SimplePostAction, _super);

		function SimplePostAction(self, url, request, successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.POST, SYNC_TYPE.SYNC, self, url, successHandler, errorHandler);
			this.request = request;
		}

		SimplePostAction.prototype.buildRequest = function() {
			return this.request;
		};
		return SimplePostAction;
	}) (CommonAjaxAction);

	var SimpleAsyncPostAction = (function (_super) {
		cKit.__extends(SimpleAsyncPostAction, _super);

		function SimpleAsyncPostAction(self, url, request, successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.POST, SYNC_TYPE.ASYNC, self, url, successHandler, errorHandler);
			this.request = request;
		}

		SimpleAsyncPostAction.prototype.buildRequest = function() {
			return this.request;
		};
		return SimpleAsyncPostAction;
	}) (CommonAjaxAction);

	var CrossDomainGet = (function (_super) {
		cKit.__extends(CrossDomainGet, _super);

		function CrossDomainGet(self, url, successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.CROSSDOMAINGET, SYNC_TYPE.ASYNC, self, url, successHandler, errorHandler);
		}
		return CrossDomainGet;
	}) (CommonAjaxAction);

	var CrossDomainFormPost = (function (_super) {
		cKit.__extends(CrossDomainFormPost, _super);

		function CrossDomainFormPost(self, url, request,successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.CROSSDOMAINFORMPOST, SYNC_TYPE.ASYNC, self, url, successHandler, errorHandler);
			this.request = request;
		}
		CrossDomainFormPost.prototype.buildRequest = function() {
			return this.request;
		};
		return CrossDomainFormPost;
	}) (CommonAjaxAction);

	var SimpleFormPost = (function (_super) {
		cKit.__extends(SimpleFormPost, _super);

		function SimpleFormPost(self, url, request,successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.SIMPLEFORMPOST, SYNC_TYPE.SYNC, self, url, successHandler, errorHandler);
			this.request = request;
		}
		SimpleFormPost.prototype.buildRequest = function() {
			return this.request;
		};
		return SimpleFormPost;
	}) (CommonAjaxAction);

	var SyncCrossDomainFormPost = (function (_super) {
		cKit.__extends(SyncCrossDomainFormPost, _super);

		function SyncCrossDomainFormPost(self, url, request,successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.SYNCCROSSDOMAINFORMPOST, SYNC_TYPE.SYNC, self, url, successHandler, errorHandler);
			this.request = request;
		}
		SyncCrossDomainFormPost.prototype.buildRequest = function() {
			return this.request;
		};
		return SyncCrossDomainFormPost;
	}) (CommonAjaxAction);

	var CrossDomainPost = (function (_super) {
		cKit.__extends(CrossDomainPost, _super);

		function CrossDomainPost(self, url, request,successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.CROSSDOMAINPOST, SYNC_TYPE.ASYNC, self, url, successHandler, errorHandler);
			this.request = request;
		}
		CrossDomainPost.prototype.buildRequest = function() {
			return this.request;
		};
		return CrossDomainPost;
	}) (CommonAjaxAction);


	//dataTable构造请求
	var TableAction = function(data, callback, settings, param) {//ajax配置为function,手动调用异步查询
		//封装请求参数
		var url = param.url;
		var postData = param.postData || {};
		var serializeGridData = param.serializeGridData || null;
		var root = param.root;
		var actionCallback = param.actionCallback || null;
		if(!url){
			console.error("dataTable needs a url");
			return;
		}
		if(!root){
			console.error("dataTable needs a root");
			return;
		}
		//处理下postdata
		/*_search:false
		 nd:1476951634744
		 pageSize:10
		 pageNumber:1
		 ordering:asc
		 orderingBy:criticalOrderNumber
		 ordering:desc
		 postData.ordering =*/
		postData.pageSize = data.length;
		postData.pageNumber = data.start/data.length + 1;
		postData.nd = (new Date()).getTime();
		if(data.order && data.order.length){
			postData.orderingBy = data.columns[data.order[0].column].data;
			postData.ordering = data.order[0].dir;
		}
		if(serializeGridData){
			serializeGridData(postData);
		}
		postData = cKit.ValueUtils.clearEmptyValue(postData, true);

		$.ajax({
			type: "POST",
			url: url,
			cache : false,  //禁用缓存
			data: postData,    //传入已封装的参数
			headers : commonHeader,
			xhrFields: {
				withCredentials: true
			},
			contentType: "application/x-www-form-urlencoded",
			xhrFields: {
				withCredentials: true
			},
			success: function(result) {
				//封装返回数据，这里仅演示了修改属性名
				var returnData = {};
				returnData.draw = data.draw;//这里直接自行返回了draw计数器,应该由后台返回
				returnData.recordsTotal = result.recordNumber;
				returnData.recordsFiltered = result.recordNumber;//后台不实现过滤功能，每次查询均视作全部结果
				returnData.data = result[root];
				cKit.ValueUtils.clearEmptyValue(returnData);
				//调用DataTables提供的callback方法，代表数据已封装完成并传回DataTables进行渲染
				//此时的数据需确保正确无误，异常判断应在执行此回调前自行处理完毕
				if(actionCallback){
					actionCallback(result);
				}
				callback(returnData);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				alert("查询失败");
			}
		});
	}




	var SyncCrossDomainPost = (function (_super) {
		cKit.__extends(SyncCrossDomainPost, _super);

		function SyncCrossDomainPost(self, url, request,successHandler, errorHandler) {
			_super.call(this, ACTION_TYPE.SYNCCROSSDOMAINPOST, SYNC_TYPE.SYNC, self, url, successHandler, errorHandler);
			this.request = request;
		}
		SyncCrossDomainPost.prototype.buildRequest = function() {
			return this.request;
		};
		return SyncCrossDomainPost;
	}) (CommonAjaxAction);

	// Global functions
	function doPostSync(url, request, onSuccess, onError) {
		$.ajax({
			type: 'POST',
			url: url,
			data: $.toJSON(request),
			contentType: 'application/json; charset=UTF-8',
			dataType: 'json',
			async: false,
			// cache设置成false，确保每次调用都会发送请求到服务器端
			// If set to false, it will force requested pages not to be cached by the browser.
			// Setting cache to false also appends a query string parameter, "_=[TIMESTAMP]", to the URL.
			cache: false,
			success: function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				if ((jqXHR.status == "200") && (jqXHR.getResponseHeader("Page-Name") == "LOGIN")) {
					window.location.href = "/index.html";
				}
				onError(textStatus);
			}
		});
	}

	function doGetSync(url, onSuccess, onError) {
		$.ajax({
			type: 'GET',
			url: url,
			dataType: 'json',
			headers : commonHeader,
			async: false,
			cache: false,
			success: function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				if ((jqXHR.status == "200") && (jqXHR.getResponseHeader("Page-Name") == "LOGIN")) {
					window.location.href = "/index.html";
				}
				onError(textStatus);
			}
		});
	}

	function doGetSyncHTML(url, onSuccess, onError) {
		$.ajax({
			type: 'GET',
			url: url,
			headers : commonHeader,
			async: false,
			cache: false,
			success: function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			success: onError
		});
	}

	function doPostAsync(url, request, onSuccess, onError) {
		$.ajax({
			type: 'POST',
			url: url,
			data: $.toJSON(request),
			headers : commonHeader,
			contentType: 'application/json; charset=UTF-8',
			dataType: 'json',
			async: true,
			cache: false,
			timeout: 10000,
			success: function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				if ((jqXHR.status == "200") && (jqXHR.getResponseHeader("Page-Name") == "LOGIN")) {
					window.location.href = "/index.html";
				}
				onError(textStatus);
			}
		});
	}

	function doGetAsync(url, onSuccess, onError) {
		$.ajax({
			type: 'GET',
			url: url,
			dataType: 'json',
			headers : commonHeader,
			async: true,
			cache: false,
			timeout: 10000,
			success: function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				if ((jqXHR.status == "200") && (jqXHR.getResponseHeader("Page-Name") == "LOGIN")) {
					window.location.href = "/index.html";
				}
				onError(textStatus);
			}
		});
	}

	function doHead(url, onSuccess, onError) {
		$.ajax({
			type: 'HEAD',
			url: url,
			timeout: 10000,
			headers : commonHeader,
			success: function(result) {
				if(preprocessResult(result)) {
					return;
				}
				onSuccess.call(self, result);
			},
			error: function(jqXHR, textStatus) {
				if ((jqXHR.status == "200") && (jqXHR.getResponseHeader("Page-Name") == "LOGIN")) {
					window.location.href = "/index.html";
				}
				onError(textStatus);
			}
		});
	}

	//Parent class for SyncGetAction
	function SyncGetAction() {
		this.submit = function (data) {
			if (this.validate(data)) {
				doGetSync(this.buildUrl(data), this.handleSuccess, this.handleError);

				this.clear(data);
			}
		};

		this.validate = function (data) {return true;};
		this.buildUrl = function(data) {};
		this.handleSuccess = function(result) {};
		this.handleError = function (result) {};
		this.clear = function(data) {};
	}

	//Parent class for SyncGetHtmlAction
	function SyncGetHtmlAction() {
		this.submit = function (data) {
			if (this.validate(data)) {
				doGetSyncHTML(this.buildUrl(data), this.handleSuccess, this.handleError);
				this.clear(data);
			}
		};

		this.validate = function (data) {return true;};
		this.buildUrl = function(data) {};
		this.handleSuccess = function(result) {};
		this.handleError = function (result) {};
		this.clear = function(data) {};
	}

	// Parent class for SyncPostAction
	function SyncPostAction() {
		this.submit = function (data) {
			if (this.validate(data)) {
				doPostSync(this.buildUrl(data), this.buildRequest(data), this.handleSuccess, this.handleError);

				this.clear(data);
			}
		};

		this.validate = function (data) {return true;};
		this.buildUrl = function (data) {};
		this.buildRequest = function (data) {};
		this.handleSuccess = function (result) {};
		this.handleError = function (result) {};
		this.clear = function (data) {};
	}

	//Parent class for AsyncGetAction
	function AsyncGetAction() {
		this.submit = function (data) {
			if (this.validate(data)) {
				doGetAsync(this.buildUrl(data), this.handleSuccess, this.handleError);

				this.clear(data);
			}
		};

		this.validate = function (data) {return true;};
		this.buildUrl = function(data) {};
		this.handleSuccess = function(result) {};
		this.handleError = function (result) {};
		this.clear = function(data) {};
	}

	// Parent class for AsyncPostAction
	function AsyncPostAction() {
		this.submit = function (data) {
			if (this.validate(data)) {
				doPostAsync(this.buildUrl(data), this.buildRequest(data), this.handleSuccess, this.handleError);

				this.clear(data);
			}
		};

		this.validate = function (data) {return true;};
		this.buildUrl = function (data) {};
		this.buildRequest = function (data) {};
		this.handleSuccess = function (result) {};
		this.handleError = function (result) {};
		this.clear = function (data) {};
	}

	function HeadAction() {
		this.submit = function (data) {
			doHead(this.buildUrl(data), this.handleSuccess, this.handleError);
		};

		this.buildUrl = function (data) {};
		this.handleSuccess = function (result) {};
		this.handleError = function (result) {};
	}
	/**
	 * @description 私有方法 ，向content获取签名，获取签名成功后调用上传阿里云方法OssUpload
	 * @parameter sourceCode 必传 file必传 callBack回调函数 必传
	 *                [options] 可添加 isUseOrigFileName 设置是否使用原始文件名
	 *
	 * **/
	function OssAuthorization(sourceCode, file, callBack, options) {
		var request = {
			'sourceCode': sourceCode,
			'fileName': file.name,
			'user': "EMPLOYEE_ACCOUNT",
		};

		if (options) {
			for (var i in options) {
				if (options[i]) {
					request[i] = options[i];
				}
			}
		}


		$.ajax({
			type: 'POST',
			url: CONST_CONTENT_ROOT_URL + "/services/rs/oss/preUploadV2",
			data: request,
			headers : commonHeader,
			xhrFields: {
				withCredentials: true
			},
			beforeSend:function(){
				showLoad()
			},
			contentType: "application/x-www-form-urlencoded",//contentType 为"application/x-www-form-urlencoded"时不会发送option请求
			success: function (result) {
				if (result.resultCode == STATUS_SUCCESS) {
					callBack(result)
				} else {
					closeLoad();
					alert(result.resultMessage);
				}
			},
			error: function (jqXHR, textStatus) {
				closeLoad();
				alert('会话过期');
				window.location.href = "";
			}
		});
	}

	/**
	 * @description 私有方法 ，上传阿里云方法OssUpload
	 * @parameter param必传为content返回的签名结果 file必传 callBack回调函数 必传
	 * @return 返回图片url
	 * **/

	function OssUpload(param, file, callBack,options,say) {
		var policyBase64 = Base64.encode(param.policy);
		var signature = param.signature.split(':')[1];
		var filePathName = param.fullName;
		var fileFullName = param.origUrl;
		var imgFullName = param.url;
		var request = new FormData();
		request.append('OSSAccessKeyId', param.accessKeyId);
		request.append('policy', policyBase64);
		request.append('Signature', signature);
		request.append('key', filePathName);
		if(options){
			for(var item in options){
				request.append(item, options[item]);
			}
		}
		for (var i in param.metaDatas) {
			request.append(i, encodeURI(param.metaDatas[i]).trim());
		}
		request.append('file', file);
		request.append('submit', "Upload to OSS");
		$.ajax({
			url: param.contentHostName,
			data: request,
			processData: false,
			contentType: false,
			headers : commonHeader,
			type: "POST",
			success: function (data, textStatus, request) {
				closeLoad();
				if (textStatus === "nocontent") {
					setAuthorizationUrl({
						origUrl: fileFullName,
						url: imgFullName
					});
					callBack({
						origUrl : fileFullName,
						url : imgFullName
					});
					if(say !== false){
						alert("上传成功");
					}
				} else {
					closeLoad();
					alert(textStatus);
				}
			},
			error:function(){
				closeLoad();
				alert('上传失败，请重新上传');
			}
		});
	}
	/*private 存储所有url和origUrl*/
	var AuthorizationUrls = [];
	function setAuthorizationUrl(url) {
		AuthorizationUrls.push(url);
	}
	function getAuthorizationUrl(url) {
		var AuthorizationUrl = _.findWhere(AuthorizationUrls, {url: url})
		if (AuthorizationUrl) return AuthorizationUrl.origUrl;
	}

	function getUrl(origUrl) {
		var urlItem = _.findWhere(AuthorizationUrls, {origUrl: origUrl})
		if (urlItem) return urlItem.url;
	}

	function getBigPictureUrl(srcUrl) {
		var bigImgSrc;
		if (srcUrl.indexOf('@!') >= 0) {
			bigImgSrc = srcUrl.replace("@!zoom-out-200h-200w", "");
		} else if (srcUrl.indexOf('_little') >= 0) {
			bigImgSrc = srcUrl.replace("_little", "");
		} else if (getAuthorizationUrl(srcUrl)) {
			bigImgSrc = getAuthorizationUrl(srcUrl);
		} else {
			bigImgSrc = srcUrl
		}
		if(!/webp$|jpg$|jpeg$|bmp$|png$/.test(bigImgSrc)){
			bigImgSrc =  "/oas/license/picture/download.html?imgUrl=" + bigImgSrc;
		}
		return bigImgSrc
	}

	function getAttamentUrl(srcUrl){
		var attamentUrl = "/oas/license/picture/download.html?imgUrl=" + srcUrl;
		return attamentUrl;
	}

	function getOrigUrlName(urlName) {
		urlName = urlName.replace(/(\w)/,function(v){return v.toUpperCase()});
		return 'orig' + urlName;
	}

	function getUrlName(origUrlName) {
		urlName = origUrlName.replace('orig',"").replace(/(\w)/,function(v){return v.toLowerCase()})
		return urlName;
	}

	function setOrigUrls(data) {
		for (var i in data) {
			if(i.indexOf('Url') >= 0 && i.indexOf('orig') !== 0){
				var origUrl = getAuthorizationUrl(data[i]);
				var origUrlName = getOrigUrlName(i);
				if (origUrl) {
					data[origUrlName] = origUrl;
				} else {
					data[origUrlName] = data[i];
				}
			}
		}
	}
	/*public 获取数据时存储OrigUrl和url*/
	function storeOrigUrls(obj) {
		for (var i in obj) {
			if (i.indexOf('orig') >= 0 && i.indexOf('Url') >= 0) {
				var urlName = getUrlName(i);
				setAuthorizationUrl({
					origUrl: obj[i],
					url: obj[urlName]
				})
			}
		}
	}

	/**
	 * @description 公有方法 ，上传阿里云方法OssUpload
	 * @parameter sourceCode 必传 file必传 callBack回调函数 必传
	 *                [options]
	 *
	 * **/
	function simpleOssUpload(sourceCode, file, callBack, options,say) {
		if (!file.name) {
			alert("there isn't a name attribute in file object, must sent a fileName to me");
			return;
		} else {
			OssAuthorization(sourceCode, file, function (authorizationResult) {
				OssUpload(authorizationResult, file, callBack,{},say);
			}, options);
		}
	}



	function attachmentOssUpload(sourceCode, file, callBack, options) {
		if (!file.name) {
			alert("there isn't a name attribute in file object, must sent a fileName to me");
			return;
		} else {
			var contentValue = "attachment;filename=" + file.name;
			OssAuthorization(sourceCode, file, function (authorizationResult) {
				OssUpload(authorizationResult, file, callBack,{"contentValue":contentValue});
			}, options);

		}
	}
	function pic_excelUpload(sourceCode, file, callBack, options) {
		if (!file.name) {
			alert("there isn't a name attribute in file object, must sent a fileName to me");
			return;
		} else {
			if(!/webp$|jpg$|jpeg$|xls|bmp$|png$/.test(file.name)){
				alert("只支持webp，jpg，jpeg，bmp，png, xls的图片格式");
				return;
			}
			OssAuthorization(sourceCode, file, function (authorizationResult) {
				OssUpload(authorizationResult, file, callBack);
			}, options);
		}
	}

	function imgOssUpload(sourceCode, file, callBack, options) {
		if (!file.name) {
			alert("there isn't a name attribute in file object, must sent a fileName to me");
			return;
		} else {
			if(!/webp$|jpg$|jpeg$|bmp$|png$/.test(file.name)){
				alert("只支持webp，jpg，jpeg，bmp，png的图片格式");
				return;
			}
			OssAuthorization(sourceCode, file, function (authorizationResult) {
				OssUpload(authorizationResult, file, callBack);
			}, options);
		}
	}
	function jpg_pngOssUpload(sourceCode, file, callBack, options) {
		if (!file.name) {
			alert("there isn't a name attribute in file object, must sent a fileName to me");
			return;
		} else {
			if(!/jpg$|png$/.test(file.name)){
				alert("只支持jpg，png的图片格式");
				return;
			}
			OssAuthorization(sourceCode, file, function (authorizationResult) {
				OssUpload(authorizationResult, file, callBack);
			}, options);
		}
	}

	function OssAuthorizationV2(httpMethod, contentType,tailUrl,fileName,filePath, callBack) {

		var request = {
			httpMethod : httpMethod,
			contentType : contentType,
			tailUrl : tailUrl,
			filePath : filePath,
			fileName: fileName
		}

		$.ajax({
			type: 'POST',
			url: CONST_CONTENT_ROOT_URL + "/services/rs/oss/preUploadV3",
			data: request,
			headers : commonHeader,
			xhrFields: {
				withCredentials: true
			},
			contentType: "application/x-www-form-urlencoded",//contentType 为"application/x-www-form-urlencoded"时不会发送option请求
			success: function (result) {
				if (result.resultCode == STATUS_SUCCESS) {
					callBack(result)
				} else {
					alert(result.resultMessage);
				}
			},
			error: function (jqXHR, textStatus) {
				closeLoad();
				alert('会话过期');
				window.location.href = "";
			}
		});

	}

	/*使用前记得把MD5文件加载到文件内*/
	var AliMultiPartUpload = (function (_super) {
		cKit.__extends(AliMultiPartUpload, _super);
		var thiz;
		function AliMultiPartUpload (filePath, file, callBack) {
			thiz= null; //释放thiz值，当两次实例化这个对象事，thiz没有被释放，还指向上一个实例化对象
			thiz = this;
			this.ossMultipartUploadList = [];//用于存放partNumber和分片上传返回的eTag
			this.ossOptions = null;
			this.partNumberNow = 1;
			this.fileobj = file;
			this.filePath = filePath;
			thiz.callBack = callBack;

		}

		AliMultiPartUpload.prototype.startUpload = function() {
			var tailUrl = '?uploads';
			var fileName = thiz.fileobj.name;
			var filePath = thiz.filePath;
			if(fileName.substr(fileName.lastIndexOf('.'),fileName.length-1) == '.pdf'){
				var contentType = "application/pdf";
			}else{
				var contentType = "application/octet-stream";
			}
			OssAuthorizationV2("POST", contentType, tailUrl,fileName,filePath,function (authorizationResult) {
				thiz.initiateMultipartUpload(authorizationResult, thiz.fileobj, thiz.callBack);
			});

		};

		AliMultiPartUpload.prototype.initiateMultipartUpload = function(param, file, callBack) {
			if(file.name.substr(file.name.lastIndexOf('.'),file.name.length-1) == '.pdf'){
				$.ajax({
					url: param.url,
					processData: false,
					contentType: 'application/pdf',
					headers : {
						'x-oss-date' : param.gmtNow/*param.time*/,
						'Authorization' : param.authorization/* param.signature*/,
						'x-sdk-client' : ''
					},
					type: "POST",
					dataType : 'xml',
					success: function (xml, textStatus, request) {

						var initiateMultipartUploadResult = xml.getElementsByTagName("InitiateMultipartUploadResult")[0];
						var bucket = initiateMultipartUploadResult.getElementsByTagName("Bucket")[0].innerHTML;
						var uploadId = initiateMultipartUploadResult.getElementsByTagName("UploadId")[0].innerHTML;
						var key = initiateMultipartUploadResult.getElementsByTagName("Key")[0].innerHTML;
						thiz.ossOptions = {
							bucket : bucket,
							uploadId : uploadId,
							key : key
						};
						//从第一个开始上传
						this.partNumberNow = 1;
						thiz.uploadPart(param,file, callBack, thiz.ossOptions, this.partNumberNow);
					},
					error:function(){
						closeLoad();
						alert('上传失败，请重新上传');
					}
				});
			}else{
				$.ajax({
					url: param.url,
					processData: false,
					contentType: 'application/octet-stream',
					headers : {
						'x-oss-date' : param.gmtNow/*param.time*/,
						'Authorization' : param.authorization/* param.signature*/,
						'x-sdk-client' : ''
					},
					type: "POST",
					dataType : 'xml',
					success: function (xml, textStatus, request) {

						var initiateMultipartUploadResult = xml.getElementsByTagName("InitiateMultipartUploadResult")[0];
						var bucket = initiateMultipartUploadResult.getElementsByTagName("Bucket")[0].innerHTML;
						var uploadId = initiateMultipartUploadResult.getElementsByTagName("UploadId")[0].innerHTML;
						var key = initiateMultipartUploadResult.getElementsByTagName("Key")[0].innerHTML;
						thiz.ossOptions = {
							bucket : bucket,
							uploadId : uploadId,
							key : key
						};
						//从第一个开始上传
						this.partNumberNow = 1;
						thiz.uploadPart(param,file, callBack, thiz.ossOptions, this.partNumberNow);
					},
					error:function(){
						closeLoad();
						alert('上传失败，请重新上传');
					}
				});
			}


		};
		AliMultiPartUpload.prototype.uploadPart = function(param,fileobj, callBack, ossOptions, partNumber) {
			var SLICESIZE =  1024 * 1024;//每次切割的大小，这里是1MB
			var start = SLICESIZE*(partNumber-1);
			var end = SLICESIZE*partNumber;
			console.log(start, end + '<br>')
			var part = fileobj.slice(start, end);//对文件进行切割，两个参数
			//设置初始进度为0
			var process = new Process();
			process.update(parseInt(0),fileobj.name.substr(0, fileobj.name.lastIndexOf('.')));
			var fileReader = new FileReader();
			fileReader.readAsArrayBuffer(part);
			fileReader.onload = function(t) {
				if(part){
					thiz.frOnload(param,fileobj, callBack, ossOptions, partNumber, t.target.result);
				}

			}
		};

		//成功读取文件片段回调
		AliMultiPartUpload.prototype.frOnload =  function(param,fileobj, callBack, ossOptions, partNumber,filePart, totalpartNumber){
			var tail = '?partNumber=' + partNumber + '&uploadId=' + ossOptions.uploadId;
			OssAuthorizationV2("PUT", "application/octet-stream", tail,fileobj.name, thiz.filePath,function(result){
				$.ajax({
					url:param.url.substr(0,param.url.lastIndexOf("?")) + tail,
					processData: false,
					contentType: 'application/octet-stream',
					data : filePart,
					headers: {
						'x-oss-date': result.gmtNow/*param.time*/,
						'Authorization': result.authorization/* param.signature*/,
						'x-sdk-client': ''
					},
					type: "PUT",
					success: function (data, status, xhr) {
						var etag =  xhr.getResponseHeader("ETag");
						//	var partNumber = xhr.getResponseHeader("PartNumber");
						thiz.ossMultipartUploadList.push({
							etag : etag,
							partNumber : partNumber
						});
						var totalsize = fileobj.size;
						var SLICESIZE = 1024*1024;
						var totalpartNumber = Math.ceil(totalsize / SLICESIZE);
						//分片上传完毕
						if(partNumber == totalpartNumber){
							thiz.partNumberNow =  partNumber;
							thiz.frCompleteUpload()
						}else{
							thiz.uploadPart(param, fileobj, callBack, ossOptions, partNumber+1);
							//更新进度
							var process = new Process();
							process.update(parseInt(100/totalpartNumber*partNumber),fileobj.name.substr(0, fileobj.name.lastIndexOf('.')))
						}
					}

				});
			});

		};
		AliMultiPartUpload.prototype.fommatCompletePostData = function(){
			var eTagCompleteMultipartUpload = document.createElement("CompleteMultipartUpload");
			var str = "";
			for(var i =0 ; i < thiz.ossMultipartUploadList.length; i ++){
				str += "<Part>" +
					"<PartNumber>"+ thiz.ossMultipartUploadList[i].partNumber +"</PartNumber>" +
					"<ETag>"+ thiz.ossMultipartUploadList[i].etag +"</ETag>"+
					"</Part>"

			}
			return "<CompleteMultipartUpload>" + str + "</CompleteMultipartUpload>";

		};


		AliMultiPartUpload.prototype.frCompleteUpload = function(){
			var process = new Process();
			process.update(100)
			var tail = '?uploadId=' + thiz.ossOptions.uploadId;
			OssAuthorizationV2("POST", "application/xml", tail, thiz.fileobj.name , thiz.filePath, function(result){
				var postData = thiz.fommatCompletePostData();
				$.ajax({
					url: result.url,
					processData: false,
					contentType: 'application/xml',
					data : postData,
					headers: {
						'x-oss-date': result.gmtNow/*param.time*/,
						'Authorization': result.authorization/* param.signature*/,
						'x-sdk-client': ''
					},
					type: "POST",
					success: function (xml, status, xhr) {
						thiz.callBack(xml)
						alert('上传成功')
					},
					error: function () {
						var process = new Process();
						process.errorHandler();
						alert('上传失败，请重新上传');
					}

				});

			});


		}
		/*对阿里云上分片进行删除，如果是上传中调用该方法，会有并发问题，所以要多调用几次，可以使用如果输入的Upload Id不存在，OSS会返回404错误，错误码为：NoSuchUpload。*/
		AliMultiPartUpload.prototype.abortMultipartUpload  = function(){
			var tail = '?uploadId=' + thiz.ossOptions.uploadId;
			OssAuthorizationV2("DELETE", "application/octet-stream", tail, thiz.fileobj.name, thiz.filePath, function(result){
				$.ajax({
					url: result.url,
					processData: false,
					contentType: 'application/octet-stream',
					headers: {
						'x-oss-date': result.gmtNow/*param.time*/,
						'Authorization': result.authorization/* param.signature*/,
						'x-sdk-client': ''
					},
					type: "DELETE",
					success: function (data, status, xhr) {

					}/*,
					 error: function () {
					 closeLoad();
					 alert('上传失败，请重新上传');
					 }*/

				});
			})
		};



		return AliMultiPartUpload;
	}) (cKit.CoreObject);


	//进度条
	var Process = (function (_super) {
		cKit.__extends(Process, _super);
		var thiz;
		function Process () {
			thiz = this;

		}

		Process.prototype.update = function (processRate,name) {
			var html = '';
			html += '<div style="width: 100px; display: inline-block;">'
			html += '<div id="success" style="width: ' + processRate + '%;height: 10px; background-color: #5eb95e;"></div>'
			html += '</div>'
			html += '<span class="percent">' + processRate + '%</span>';


			$('#processForm_process').html(html);
			$('#processForm_name').html(name);
			$('#processForm_status').text('上传中');
		}
		Process.prototype.errorHandler = function () {
			$('#success').css('background-color','red');
			$('#processForm_status').text('上传失败');
		}

		return Process;
	}) (cKit.CoreObject);

	function isContentServerUrl(url) {
		if (url.indexOf("content") >= 0) {
			return true;
		}
		return false;
	}

	function showLoad(tipInfo) {
		if($('#thisIsLoading').length !== 0){
			$('#thisIsLoading').css('display','');
			return;
		}
		var eTip = document.createElement('div');
		eTip.setAttribute('id', 'thisIsLoading');
		eTip.style.position = 'fixed';
		eTip.style.display = 'none';
		eTip.style.backgroundColor = '#e6e6e6';
		eTip.style.top = '0%';
		eTip.style.right = '0px';
		eTip.style.width = '100%';
		eTip.style.height = '100%';
		eTip.style.opacity = 0.5 ;

		eTip.innerHTML = '<img src="'+ CONST_FRONTEND_ROOT_URL + globalAssetPath +'/images/common/loading.gif" style=\'position:absolute;top:50%;right:50%\' />&nbsp;&nbsp;';
		try {
			document.body.appendChild(eTip);
		} catch (e) { }
		$('#thisIsLoading').css('zIndex',9999);
		$('#thisIsLoading').css('display','');

	}

	function closeLoad() {
		$('#thisIsLoading').css('display','none');
	}

	var loadingImg = {
		showLoad : showLoad,
		closeLoad : closeLoad
	};

	// 获取功能抽象 END
	return {

		AbstractAjaxAction: AbstractAjaxAction,
		CommonAjaxAction: CommonAjaxAction,
		SimpleGetAction: SimpleGetAction,
		SimplePostAction: SimplePostAction,
		SimpleAsyncGetAction: SimpleAsyncGetAction,
		SimpleAsyncPostAction: SimpleAsyncPostAction,
		SyncGetAction: SyncGetAction,
		SyncGetHtmlAction: SyncGetHtmlAction,
		SyncPostAction: SyncPostAction,
		AsyncGetAction: AsyncGetAction,
		AsyncPostAction: AsyncPostAction,
		SimpleFormPost : SimpleFormPost,
		CrossDomainFormPost : CrossDomainFormPost,
		SyncCrossDomainFormPost: SyncCrossDomainFormPost,
		CrossDomainPost : CrossDomainPost,
		CrossDomainGet : CrossDomainGet,
		SyncCrossDomainPost: SyncCrossDomainPost,
		HeadAction: HeadAction,
		STATUS_CODE: STATUS_CODE,
		simpleOssUpload: simpleOssUpload,
		setOrigUrls: setOrigUrls,
		getBigPictureUrl: getBigPictureUrl,
		storeOrigUrls: storeOrigUrls,
		attachmentOssUpload: attachmentOssUpload,
		isContentServerUrl: isContentServerUrl,
		imgOssUpload: imgOssUpload,
		jpg_pngOssUpload: jpg_pngOssUpload,
		pic_excelUpload: pic_excelUpload,
		getAttamentUrl:getAttamentUrl,
		AliMultiPartUpload : AliMultiPartUpload,
		getUrl:getUrl,
		loadingImg:loadingImg,
		TableAction: TableAction
	};
});
