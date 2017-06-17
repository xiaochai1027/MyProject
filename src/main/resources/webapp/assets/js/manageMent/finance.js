require.config(I360R.REQUIRE_CONFIG)
require(['jquery','underscore', 'uiKit3', 'networkKit', 'coreKit'], function ($,_,uiKit,netKit,cKit) {
    $(function () {
        $(".fa_li>a").click(function () {

            $(this).css("background", "#1481b3").parent().siblings("li").find(".floor").css("background", "#065c85")
            $(this).parent().find(".jia").toggleClass("sub");
            $(this).parent().find("ul").toggle().parent().siblings("li").find("ul").hide()
        })

        $(".fa_li ul li").on("mouseover click", function () {
            $(this).css({"background": "#fff"}).find("a").css({"color": "red"}).parent().siblings("li").css({"background": "#efefef"}).find("a").css({"color": "#666"})

//      var text=$(this).find("a").text();
//            if(text=="��Ʒ�б�"){
//                $(".bottom_right_son").eq(0).show().siblings().hide();
//            }
//            if(text=="�������Ʒ"){
//                $(".bottom_right_son").eq(1).show().siblings().hide();
//            }
//            if(text=="�������"){
//                $(".bottom_right_son").eq(2).show().siblings().hide();
//            }
//            if(text=="��Ʒ����"){
//                $(".bottom_right_son").eq(3).show().siblings().hide();
//            }
            $(".form_datetime").datetimepicker({
                format: "yyyy-mm-dd hh:ii"
            });
        })
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
                if(positionId != 1){
                    $("#showEmployee").hide();
                }
            }
        }
    });
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
    })


    var CurrentPage = (function (_super) {
        cKit.__extends(CurrentPage, _super);

        var thiz;

        function CurrentPage() {
            _super.call(this);
            thiz = this;
            this.searchParams = {};
            this.initSearchForm();
            $('#export').click(function () {
                if($('#searchForm_orderByAsc option:selected').text() == '排序'){
                    orderByAsc = null
                }else if($('#searchForm_orderByAsc option:selected').text() == '正序'){
                    orderByAsc = true
                }else{
                    orderByAsc = false
                }
                $.ajax({
                    type: 'get',
                    url: "/finance/search?excel=true" + "&groupId=" + $('#searchForm_groupId').val() + "&employeeId=" + $('#searchForm_employeeId').val() + "&statusId=" + $("#searchForm_statusId").val() + "&orderByAsc=" + orderByAsc,
                    success: function () {
                        alert('成功')
                    },
                    error: function () {
                        alert('失败')
                    }
                })
            })
        }

        CurrentPage.prototype.initPageGrid = function () {
            this.pageGrid = $('#list').dataTable({
                "columns": [{
                    "data": "ranking"
                }, {
                    "data": "employeeName"
                }, {
                    "data": "submitNumber"
                }, {
                    "data": "averageDaily"
                }, {
                    "data": "refuseRate"
                }, {
                    "data": "refuseNumber"
                }, {
                    "data": "twoAuditNumber"
                }, {
                    "data": "promoteNumber"
                }, {
                    "data": "endApproachNumber"
                }, {
                    "data": "endNumber"
                }, {
                    "data": "payWaitNumber"
                }, {
                    "data": "payRunNumber"
                }, {
                    "data": "payTrailerNumber"
                }, {
                    "data": "payEndNumber"
                }, {
                    "data": "settlementNumber"
                },{
                    "data": "guestUnitPrice"
                }, {
                    "data": "actualChargeAmount"
                }, {
                    "data": "shouldChargeAmount"
                }],
                ajax: function (data,callBack,setting) {
                    netKit.TableAction(data,callBack,setting,{
                        url: "/finance/search",
                        postData: thiz.searchParams,
                        root: "finances",
                        actionCallback: function (result) {

                        }
                    })
                }
            }).api()
        }

        CurrentPage.prototype.initSearchForm = function () {
            this.searchForm = new uiKit.FormController({
                id: 'searchForm',
                model: {},
                submit: function(data) {
                    thiz.searchParams= data
                    thiz.searchParams.createBeginTime = $('#searchForm_createBeginTime').val()
                    thiz.searchParams.createEndTime = $('#searchForm_createEndTime').val()
                    thiz.searchParams.beginFromTime = $('#searchForm_beginFromTime').val()
                    thiz.searchParams.beginToTime = $('#searchForm_beginToTime').val()
                    thiz.searchParams.endFromTime = $('#searchForm_endFromTime').val()
                    thiz.searchParams.endToTime = $('#searchForm_endToTime').val()
                    if(!thiz.pageGrid){
                        thiz.initPageGrid()
                    }else{
                        thiz.pageGrid.draw()
                    }
                },
                fields: uiKit.FormUtils.generateFields('searchForm', [{
                    uid : 'groupId',
                    type : uiKit.Controller.SELECT,
                    options: groupOptions
                },{
                    uid : 'employeeId',
                    type : uiKit.Controller.SELECT,
                    options: employeeOptions
                },{
                    uid : 'statusId',
                    type : uiKit.Controller.SELECT,
                    options: employeeStatuOptions
                },{
                    uid : 'orderByAsc',
                    type : uiKit.Controller.SELECT,
                    options: [{label: '排序',value: null},{label: '正序',value: true},{label: '倒序',value: false}]
                }]),
                reset: false
            });
        };

        return CurrentPage;
    })(cKit.CoreObject);
    var pageController = new uiKit.PageController({


        onViewClick: function (businessAreaCode ) {
            var url = '/services/frontend/rs/deliveryStaffPerformance/firstConfig/detail?businessAreaCode=' + businessAreaCode;

            var successHandler = function (self, result) {
                if (!currentPage.detailDialog) {
                    currentPage.detailDialog = new DetailDialog('detailDialog', {});
                }
                currentPage.detailDialog.show();
                $('#setBusinessAreaName').text(result.businessAreaName)
                currentPage.detailDialog.update(result);
            };

            var errorHandler = function (self, result) {
                alert(result.resultMessage);
            };

            var action = new netKit.SimpleGetAction(this, url, successHandler, errorHandler);
            action.submit();

        }

    });
    var currentPage = null;
    $(document).ready(function() {
        currentPage = new CurrentPage();
    });


})