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

    var genderOptions = [{label: '男',value: 'M'},{label: '女',value: 'F'}]
    var CurrentPage = (function (_super) {
        cKit.__extends(CurrentPage, _super);

        var thiz;

        function CurrentPage() {
            _super.call(this);
            thiz = this;
            this.searchParams = {};
            this.initSearchForm();

        }

        CurrentPage.prototype.initPageGrid = function () {
            this.pageGrid = $('#employeeGrid').dataTable({
                "columns": [{
                    "data": "fullName"
                }, {
                    "data": "genderName"
                }, {
                    "data": "mobile"
                }, {
                    "data": "groupName"
                }, {
                    "data": "positionName"
                }, {
                    "data": "statusName"
                },{
                    render: function (data,type,rowObject,meta) {
                        var employeeId = rowObject.id;
                        var groupId = rowObject.groupId;
                        var positionId = rowObject.positionId;
                        var businessPerson = rowObject.businessPerson;
                        var statusCode = rowObject.statusCode;
                        var html = '';

                        if (positionId == 2){
                            html += '<a style="margin-right: 10px;" onclick="currentPage().onGroupClick(\'' + employeeId + '\',\'' + positionId + '\')">分组</a>'
                        }
                        if(businessPerson){
                            html += '<a style="margin-right: 10px;" onclick="currentPage().onUpgradeClick(\'' + employeeId + '\',\'' + positionId + '\',\'' + groupId + '\')">升级</a>'
                        }
                        if(statusCode == "IN_POSITION") {
                            html += '<a style="margin-right: 10px;" onclick="currentPage().onQuitClick(\'' + employeeId + '\',\'' + true + '\')">离职</a>'
                        }
                        return html;
                    }
                }],
                ajax: function (data,callBack,setting) {
                    netKit.TableAction(data,callBack,setting,{
                        url: '/employee/search',
                        postData: thiz.searchParams,
                        root: "employees",
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
                    if(!thiz.pageGrid){
                        thiz.initPageGrid()
                    }else{
                        thiz.pageGrid.draw()
                    }
                },
                fields: uiKit.FormUtils.generateFields('searchForm', [{
                    uid : 'employeeName',
                    type : uiKit.Controller.EDIT
                },{
                    uid : 'groupId',
                    type : uiKit.Controller.SELECT,
                    options: groupOptions
                },{
                    uid : 'positionId',
                    type : uiKit.Controller.SELECT,
                    options: positionOptions
                }]),
                reset: false
            });
        };

        return CurrentPage;
    })(cKit.CoreObject);


    var AddDialog = (function (_super) {
        cKit.__extends(AddDialog, _super);

        var thiz;

        function AddDialog(id, config) {
            _super.call(this, id, config);

            thiz = this;
            this.onRefresh = config.onRefresh;
            this.initAddForm();
        }

        AddDialog.prototype.initAddForm = function () {

            this.addDialog = new uiKit.FormController({
                id: 'addForm',
                model: {},
                submit: function (data) {
                    var url = '/employee/create';
                    var request = data;
                    var successHandler = function (self, result) {
                        if(result.resultMessage != null){
                            alert(result.resultMessage);
                        }else {
                            alert('成功');
                            thiz.hide();
                            currentPage.pageGrid.draw()
                        }
                    };
                    var errorHandler = function (self, result) {
                        alert('失败')
                    };
                    var action = new netKit.SimplePostAction(thiz, url, request, successHandler, errorHandler);
                    action.submit();

                    return true;
                },
                fields: uiKit.FormUtils.generateFields('addDialog', [{
                    uid: 'fullName',
                    type: uiKit.Controller.EDIT,
                    validators: [uiKit.Validator.NONEMPTY]
                }, {
                    uid: 'genderCode',
                    type: uiKit.Controller.SELECT,
                    options: genderOptions,
                    validators: [uiKit.Validator.NONEMPTY]
                }, {
                    uid: 'mobile',
                    type: uiKit.Controller.EDIT,
                    validators: [uiKit.Validator.NONEMPTY]
                },{
                    uid : 'password',
                    type : uiKit.Controller.EDIT,
                    validators: [uiKit.Validator.PASSWORD]
                },{
                    uid: 'groupId',
                    type: uiKit.Controller.SELECT,
                    options: groupOptions,
                    validators: [uiKit.Validator.DEFINE('这里不可以不填哦！', function (value) {
                        var positionId = this.getContainerForm().getViewModel().positionId();
                        if(positionId  !== 2 && positionId !== 3){
                            return true
                        }else{
                            if(value == 'NONE'){
                                return false
                            }
                            return true
                        }
                    })],
                    visible: function () {
                        var positionId = this.getContainerForm().getViewModel().positionId();
                        if(positionId == 2 || positionId == 3){
                            return true
                        }
                        return false
                    }
                },{
                    uid: 'positionId',
                    type: uiKit.Controller.SELECT,
                    options: positionOptions,
                    validators: [uiKit.Validator.NONEMPTY]
                }])
            });
        };

        AddDialog.prototype.onHide = function () {
            thiz.addDialog.reset();
        }

        return AddDialog;
    })(uiKit.Dialog);

    var AddGroupDialog = (function (_super) {
        cKit.__extends(AddGroupDialog, _super);

        var thiz;

        function AddGroupDialog(id, config) {
            _super.call(this, id, config);

            thiz = this;
            this.onRefresh = config.onRefresh;
            this.initAddGroupForm();
        }

        AddGroupDialog.prototype.initAddGroupForm = function () {

            this.addGroupDialog = new uiKit.FormController({
                id: 'addGroupForm',
                model: {},
                submit: function (data) {
                    var url = '/employee/group/create';
                    var request = data;
                    var successHandler = function (self, result) {
                        if(result.resultMessage != null){
                            alert(result.resultMessage);
                        }else {
                            alert('成功');
                            thiz.hide()
                            currentPage.pageGrid.draw()
                        }
                    };
                    var errorHandler = function (self, result) {
                        alert('失败')
                    };
                    var action = new netKit.SimplePostAction(thiz, url, request, successHandler, errorHandler);
                    action.submit();

                    return true;
                },
                fields: uiKit.FormUtils.generateFields('addGroupDialog', [{
                    uid: 'name',
                    type: uiKit.Controller.EDIT,
                    validators: [uiKit.Validator.NONEMPTY]
                }])
            });
        };


        return AddGroupDialog;
    })(uiKit.Dialog);


    var DistributionDialog = (function (_super) {
        cKit.__extends(DistributionDialog, _super);

        var thiz;

        function DistributionDialog(id, config) {
            _super.call(this, id, config);

            thiz = this;
            this.onRefresh = config.onRefresh;
            this.initDistributionForm();
        }
        DistributionDialog.prototype.initDistributionForm = function () {

            this.distributionForm = new uiKit.FormController({
                id: 'distributionForm',
                model: {},
                submit: function (data) {
                    var url ="/employee/modify";
                    request = data
                    var successHandler = function(self, result) {
                        alert('成功')
                        thiz.hide()
                    };
                    var errorHandler = function(self, result) {
                        alert('请求失败');
                    };
                    var action = new netKit.SimplePostAction(this,url,request ,successHandler, errorHandler);
                    action.submit();
                    return false;
                },
                fields: uiKit.FormUtils.generateFields('distributionDialog', [{
                    uid: 'groupId',
                    type: uiKit.Controller.SELECT,
                    options: groupOptions,
                    validators: [uiKit.Validator.NONEMPTY]
                }])
            });
        };

        DistributionDialog.prototype.update = function (model) {
            this.distributionForm.update(model)
        }

        return DistributionDialog;
    })(uiKit.Dialog);


    var pageController = new uiKit.PageController({


        onGroupClick: function (employeeId,positionId) {
            if (!currentPage.distributionDialog) {
                currentPage.distributionDialog = new DistributionDialog('distributionDialog', {});
            }
            currentPage.distributionDialog.distributionForm.update({
                employeeId: employeeId
            })

            currentPage.distributionDialog.show();

        },
        onUpgradeClick: function (employeeId,positionId,groupId) {
            var url ="/employee/group/verify?groupId=" + groupId;
            if (groupId == "null"){
                alert("该员工暂无小组不能升级");
                return false;
            }
            var successHandler = function(self, result) {
                if (!window.confirm("确认为组长？")){
                    return false;
                }
                if (result && !window.confirm("确认覆盖现有组长？")){
                    return false;
                }
                var url1 ="/employee/modify";
                var request = {
                    employeeId: employeeId,
                    positionId: positionId
                };
                var successHandler = function(self, result) {
                    if(result.resultMessage != null){
                        alert(result.resultMessage);
                    }else {
                        alert('成功');
                    }
                };
                var errorHandler = function(self, result) {
                    alert('请求失败');
                };
                var action = new netKit.SimplePostAction(this, url1, request,successHandler, errorHandler);
                action.submit();
            };
            var errorHandler = function(self, result) {
                alert('请求失败');
            };
            var action = new netKit.SimpleGetAction(this, url,successHandler, errorHandler);
            action.submit();
        },
        onQuitClick: function (employeeId,dismission) {
            var url ="/employee/modify";
            var request = {
                employeeId: employeeId,
                dismission: dismission
            };
            if (!window.confirm("确认离职改员工？")){
                return false;
            }
            var successHandler = function(self, result) {
                alert('成功')
            };
            var errorHandler = function(self, result) {
                alert('请求失败');
            };
            var action = new netKit.SimplePostAction(this,url , request,successHandler, errorHandler);
            action.submit();
        },
        onAddClick: function () {
            if (!currentPage.addDialog) {
                currentPage.addDialog = new AddDialog('addDialog', {});
            }

            currentPage.addDialog.show();
        },
        onAddGroupClick: function () {
            if (!currentPage.addGroupDialog) {
                currentPage.addGroupDialog = new AddGroupDialog('addGroupDialog', {});
            }

            currentPage.addGroupDialog.show();
        }

    });
    var currentPage = null;
    $(document).ready(function() {
        currentPage = new CurrentPage();
    });


})