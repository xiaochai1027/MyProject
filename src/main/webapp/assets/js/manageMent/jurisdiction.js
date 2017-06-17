require.config(I360R.REQUIRE_CONFIG)
require(['jquery','underscore', 'uiKit3', 'networkKit', 'coreKit','dataTableSelect'], function ($,_,uiKit,netKit,cKit,dataTableSelect) {
    $(function () {
        $(".fa_li>a").click(function () {

            $(this).css("background", "#1481b3").parent().siblings("li").find(".floor").css("background", "#065c85")
            $(this).parent().find(".jia").toggleClass("sub");
            $(this).parent().find("ul").toggle().parent().siblings("li").find("ul").hide()
        })
    });
    $.ajax({
        type: 'get',
        async: false,
        url: '/employee/currentEmployee',
        success: function (data) {
            if (data.employee != null && data.employee.fullName != null) {
                $("#userName").text(data.employee.fullName);
                return;
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
            thiz.result = [];
            this.searchParams = {};
            this.init();
            this.initModifyForm();
        }

        CurrentPage.prototype.init = function () {

            var url ="/position/permission/allPermission";
            var successHandler = function(self, result) {
                thiz.result = result;
                var html = ''
                for (var i = 0; i < result.permissions.length; i++){
                    html += '<span style="margin: 20px 20px 0 0px;">' + '<input style="margin-top:-3px" type="checkbox" name="quan" value=\'' + result.permissions[i].id + '\'/>' + '<span>' + result.permissions[i].name + '</span>' + '</span>'
                }
                $('#id').html(html)
            };
            var errorHandler = function(self, result) {
                alert('请求失败');
            };
            var action = new netKit.SimpleGetAction(this, url,successHandler, errorHandler);
            action.submit();

        }


        CurrentPage.prototype.initModifyForm = function () {
            this.modifyForm = new uiKit.FormController({
                id: 'modifyForm',
                model: {},
                submit: function(data) {
                    var quanObj = document.getElementsByName("quan");
                    var quanArray = [];
                    for(k in quanObj){
                        if(quanObj[k].checked)
                            quanArray.push(quanObj[k].value);
                    }
                    var url ="/position/permission/modify";
                    var request = {
                        positionId: data.positionId,
                        permissionIds: quanArray
                    };
                    var successHandler = function(self, result) {
                        alert('成功')
                        window.location.reload()
                    };
                    var errorHandler = function(self, result) {
                        alert('请求失败');
                    };
                    var action = new netKit.SimplePostAction(this,url, request,successHandler, errorHandler);
                    action.submit();
                },
                fields: uiKit.FormUtils.generateFields('modifyForm', [{
                    uid : 'positionId',
                    type : uiKit.Controller.SELECT,
                    options: positionOptions,
                    change: function (value) {
                        if(value){
                            var inputArray = $("input[name='quan']")
                            for(var i = 0; i < inputArray.length; i++){
                                inputArray[i].checked = false
                            }
                            var url ="/position/permission/byPositionId?positionId=" + value;
                            var successHandler = function(self, result) {
                                var arr1 = result.permissions;
                                var arr2 = thiz.result.permissions;
                                var long = arr1.length<arr2.length?arr2:arr1;
                                var short = arr1.length<arr2.length?arr1:arr2;
                                var str = ","+long.toString()+",";
                                var sameArray=[];
                                for(var i in short){
                                    if(str.indexOf(","+short[i]+",")>=0){
                                        sameArray.push(short[i]);
                                    }
                                }
                                for(var i = 0; i < inputArray.length; i++){
                                    for(var j = 0; j < sameArray.length; j++){
                                        if(inputArray[i].value == sameArray[j].id){
                                            inputArray[i].checked = true
                                        }
                                    }
                                }
                            };
                            var errorHandler = function(self, result) {
                                alert('请求失败');
                            };
                            var action = new netKit.SimpleGetAction(this,url,successHandler, errorHandler);
                            action.submit();
                        }


                    }
                }]),
                reset: false
            });
        };

        return CurrentPage;
    })(cKit.CoreObject);
    var pageController = new uiKit.PageController({




    });
    var currentPage = null;
    $(document).ready(function() {
        currentPage = new CurrentPage();
    });


})