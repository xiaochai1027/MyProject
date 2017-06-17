require.config(I360R.REQUIRE_CONFIG)
require(['jquery', 'underscore', 'uiKit3', 'networkKit', 'coreKit', 'dataTableSelect'], function ($, _, uiKit, netKit, cKit, dataTableSelect) {
    $(function () {
        $(".fa_li>a").click(function () {

            $(this).css("background", "#1481b3").parent().siblings("li").find(".floor").css("background", "#065c85")
//
            $(this).parent().find(".jia").toggleClass("sub", "add");

            $(this).parent().find("ul").toggle().parent().siblings("li").find("ul").hide();
        })

        $(".fa_li ul li").on("mouseover click", function () {
            $(this).css({"background": "#fff"}).find("a").css({"color": "red"}).parent().siblings("li").css({"background": "#efefef"}).find("a").css({"color": "#666"})

        })
        $(".zhou_2_ul>li").on("click", function () {

            var num = $(this).index();
            console.log(num)
            $(this).addClass("on").siblings().removeClass("on")
            $(".zhou_2_floor>div").eq(num).addClass("dis").siblings("").removeClass("dis")

        })
        $(".form_datetime").datetimepicker({
            format: "yyyy-mm-dd hh:ii"
        });
    })
    $.ajax({
        type: 'get',
        async: false,
        url: '/resource/data',
        success: function (data) {
            activitieOptions = data.activities
            hireTypeOptions = data.hireTypes
            productStatuOptions = data.productStatus
            productTypeOptions = data.productTypes
            storeTypeOptions = data.storeTypes
            employeeStatuOptions = data.employeeStatus
            groupOptions = data.groups
            positionOptions = data.positions
            employeeOptions = data.employees
        },
        error: function () {
            alert('请求失败')
        }
    });
    $.ajax({
        type: 'get',
        async: false,
        url: '/employee/currentEmployee',
        success: function (data) {
            if (data.employee != null && data.employee.fullName != null) {
                $("#userName").text(data.employee.fullName);
                var positionId = data.employee.positionId;
                if(positionId == 4
                    && positionId == 5){
                    $("#showCreate").hide();
                }
                if (positionId != 1) {
                    $("#showEmployee").hide();
                }
            }
        }
    });
    var ValueUtils = cKit.ValueUtils;

    var booLeans = '';
    var booVoucher = '';
    var booSubmit = '';

    var files = '';

    var activeOption = [{label: '普通活动', value: 1}, {label: '预告商品', value: 4}, {label: '淘抢购', value: 2}, {
        label: '聚划算',
        value: 3
    }]

    var CurrentPage = (function (_super) {
        cKit.__extends(CurrentPage, _super);

        var thiz;

        function CurrentPage() {
            _super.call(this);
            thiz = this;
            this.searchParams = {};
            this.init();
            $('#productCopy').click(function () {
                var e = document.getElementById('detailForm_url');
                e.select();
                document.execCommand('Copy')
            })
            $('#couponCopy').click(function () {
                var e = document.getElementById('detailForm_couponUrl');
                e.select();
                document.execCommand('Copy')
            })
            $('#fileUpload1').change(function (e) {
                var file = e.target.files[0]
                files = file
            })
            //$('#fileUpload2').change(function (e) {
            //    var file = e.target.files[0]
            //    files.push(file)
            //})
            var req = cKit.UrlUtils.getRequest();
            if(req.bill == 'bill'){
                $('.zhou_2_ul>li').eq(0).click()
            }
        }

        CurrentPage.prototype.init = function () {
            var req = cKit.UrlUtils.getRequest();
            var url = "/product/detail?id=" + req.id;
            var successHandler = function (self, result) {
                if (result.pictures.length > 0) {
                    if (result.pictures[0]) {
                        result.pictureUrl1 = result.pictures[0]
                    }
                    if (result.pictures[1]) {
                        result.pictureUrl2 = result.pictures[1]
                    }
                    if (result.pictures[2]) {
                        result.pictureUrl3 = result.pictures[2]
                    }
                    if (result.pictures[3]) {
                        result.pictureUrl4 = result.pictures[3]
                    }
                    if (result.pictures[4]) {
                        result.pictureUrl5 = result.pictures[4]
                    }
                    if (result.pictures[5]) {
                        result.pictureUrl6 = result.pictures[5]
                    }
                    if (result.pictures[6]) {
                        result.pictureUrl7 = result.pictures[6]
                    }
                    if (result.pictures[7]) {
                        result.pictureUrl8 = result.pictures[7]
                    }
                }
                if (result.showEdit == false) {
                    booLeans = true;
                    $('#submitBill').hide();
                    $('#ppp').hide();
                } else {
                    booLeans = false;
                    $('.readonly').hide()
                }

                if (result.showVoucher == false) {
                    $('#showVoucher').hide();
                } else {
                    $('#showVoucher').eq(1).show()
                }

                booSubmit = result.voucher.showSubmit

                if(booSubmit){
                    $('#approveSubmit').show();
                    $('.readonly').show()

                    $('#submitBill').hide();
                    $('#ppp').hide();
                }else{
                    $('#approveSubmit').hide();
                    $('.readonly').hide();
                }
                thiz.initDetailForm(result)
                var html = '';
                for (var i = 0; i < result.approveStatus.length; i++) {
                    var id = result.approveStatus[i].value;
                    var label = result.approveStatus[i].label;
                    html += '<input data-id=\'' + id + '\' value=\'' + label + '\' style="margin-right: 20px;" type="button">'
                }
                $('#approve').html(html)
                $('#approve input').on('click', function () {
                    var request = {};
                    request.productId = thiz.detailForm.viewModel.id();
                    request.productStatusId = $(this).attr('data-id')
                    var url = "/product/approve/check";

                    var successHandler = function (self, result) {
                        alert('成功')
                        window.open('/frontend/commodity.html');
                    };
                    var errorHandler = function (self, result) {
                        window.open('/frontend/commodity.html');
                    };
                    var action = new netKit.SimpleAsyncPostAction(this, url, request, successHandler, errorHandler);
                    action.submit()
                })

                if (result.voucher.pictures.length > 0) {
                    if (result.voucher.pictures[0]) {
                        result.voucher.pictureUrl1 = result.voucher.pictures[0]
                    }
                    if (result.voucher.pictures[1]) {
                        result.voucher.pictureUrl2 = result.voucher.pictures[1]
                    }
                    if (result.voucher.pictures[2]) {
                        result.voucher.pictureUrl3 = result.voucher.pictures[2]
                    }
                    if (result.voucher.pictures[3]) {
                        result.voucher.pictureUrl4 = result.voucher.pictures[3]
                    }
                    if (result.voucher.pictures[4]) {
                        result.voucher.pictureUrl5 = result.voucher.pictures[4]
                    }
                    if (result.voucher.pictures[5]) {
                        result.voucher.pictureUrl6 = result.voucher.pictures[5]
                    }
                    if (result.voucher.pictures[6]) {
                        result.voucher.pictureUrl7 = result.voucher.pictures[6]
                    }
                    if (result.voucher.pictures[7]) {
                        result.voucher.pictureUrl8 = result.voucher.pictures[7]
                    }
                }

                thiz.initCreateForm(result.voucher, result.id)
            };
            var errorHandler = function (self, result) {
                alert('请求失败');
            };
            var action = new netKit.SimpleGetAction(this, url, successHandler, errorHandler);
            action.submit();
        }

        CurrentPage.prototype.initDetailForm = function (model) {
            this.detailForm = new uiKit.FormController({
                id: 'detailForm',
                model: model || {},
                submit: function (data) {

                },
                fields: uiKit.FormUtils.generateFields('detailForm', [{
                    uid: 'activityName',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'activityTime',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'url',
                    type: uiKit.Controller.TEXT_AREA
                }, {
                    uid: 'couponUrl',
                    type: uiKit.Controller.TEXT_AREA
                }, {
                    uid: 'productId',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'storeDiscriptionScore',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'serviceScore',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'speedScore',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'storeTypeName',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'reservePrice',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'couponUseNumber',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'couponSurplusNumber',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'couponAmount',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'condition',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'pictureUrl1',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl2',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl3',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl4',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl5',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl6',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl7',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl8',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureSize',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'supplementPictureUrl',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'productTypeName',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'name',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'reservePrice',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'sales',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'immediatelyStr',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'couponBeginTime',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'couponEndTime',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'disCountPrice',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'ratio',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'hireTypeName',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'planUrl',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'features',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'description',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'qq',
                    type: uiKit.Controller.LABEL
                }, {
                    uid: 'chargePrice',
                    type: uiKit.Controller.LABEL
                }]),
                reset: false
            });
        };


        CurrentPage.prototype.initCreateForm = function (model, id) {
            this.createForm = new uiKit.FormController({
                id: 'createForm',
                model: model || {},
                submit: function (data) {
                    if(booSubmit){
                        var url = '/product/approve/check';
                        var request = {}
                        request.productId = thiz.createForm.viewModel.id();
                        request.payTime = $('#createForm_payTime').val();
                        if(data.approveStatus == "true"){
                            request.productStatusId = 12
                        }else if(data.approveStatus == "false"){
                            request.productStatusId = 11
                        }
                        var successHandler = function(self, result) {
                            alert('成功')
                        };
                        var errorHandler = function(self, result) {
                            alert('失败');
                        };
                        var action = new netKit.SimplePostAction(this, url, request, successHandler, errorHandler);
                        action.submit();
                    }else{
                        var request = new FormData();
                        request.append('id', id);
                        request.append('couponReceiveNumber', data.couponReceiveNumber);
                        request.append('payAmount', data.payAmount);
                        request.append('couponUseNumber', data.couponUseNumber);
                        request.append('shouldChargeAmount', data.shouldChargeAmount);
                        request.append('actualChargeAmount', data.actualChargeAmount);
                        request.append('conversionRate', data.conversionRate);
                        request.append('withoutRate', data.withoutRate);

                        if(files.length == 0){
                        }else{
                            request.append('files', files);
                        }
                        $.ajax({

                            type: 'POST',

                            url: '/product/voucher/create',

                            data: request,

                            contentType: false,

                            processData: false,

                            success: function (data) {


                            }, //success end
                            error: function (data) {

                            }
                        }) //ajax end
                    }
                },
                fields: uiKit.FormUtils.generateFields('createForm', [{
                    uid: 'couponReceiveNumber',
                    node: 'couponReceiveNumber',
                    type: uiKit.Controller.EDIT,
                    readOnly: booLeans,
                    validators: [uiKit.Validator.NONEMPTY]
                }, {
                    uid: 'payAmount',
                    node: 'payAmount',
                    type: uiKit.Controller.EDIT,
                    readOnly: booLeans,
                    validators: [uiKit.Validator.NONEMPTY]
                }, {
                    uid: 'couponUseNumber',
                    node: 'couponUseNumber',
                    type: uiKit.Controller.EDIT,
                    readOnly: booLeans,
                    validators: [uiKit.Validator.NONEMPTY]
                }, {
                    uid: 'shouldChargeAmount',
                    node: 'shouldChargeAmount',
                    type: uiKit.Controller.EDIT,
                    readOnly: booLeans,
                    validators: [uiKit.Validator.NONEMPTY]
                }, {
                    uid: 'actualChargeAmount',
                    node: 'actualChargeAmount',
                    type: uiKit.Controller.EDIT,
                    readOnly: booLeans,
                    validators: [uiKit.Validator.NONEMPTY]
                }, {
                    uid: 'conversionRate',
                    node: 'conversionRate',
                    type: uiKit.Controller.EDIT,
                    readOnly: booLeans,
                    validators: [uiKit.Validator.NONEMPTY]
                }, {
                    uid: 'withoutRate',
                    node: 'withoutRate',
                    type: uiKit.Controller.EDIT
                    //,
                    //readOnly: booLeans
                    //,
                    //validators : [uiKit.Validator.NONEMPTY]
                }, {
                    uid: 'payTime',
                    node: 'payTime',
                    type: uiKit.Controller.EDIT,
                    visible: function (value) {

                        if (booSubmit) {
                            return true
                        }
                        return false;
                    }
                }, {
                    uid: 'approveStatus',
                    node: 'approveStatus',
                    type: uiKit.Controller.RADIO_GROUP,
                    options: [{label: '拒绝付款', value: false}, {label: '付款', value: true}],
                    visible: function () {
                        if (booSubmit) {
                            return true
                        }
                        return false
                    }
                }, {
                    uid: 'pictureUrl1',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl2',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl3',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl4',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl5',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl6',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl7',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }, {
                    uid: 'pictureUrl8',
                    type: uiKit.Controller.IMAGE,
                    visible: function (data) {
                        if (ValueUtils.isEmpty(data)) {
                            return false;
                        }
                        return true;
                    }
                }]),
                reset: false
            })
        }

        return CurrentPage;
    })(cKit.CoreObject);
    var pageController = new uiKit.PageController({});
    var currentPage = null;
    $(document).ready(function () {
        currentPage = new CurrentPage();
    });


})