define(['underscore', 'jquery', 'coreKit', 'jquery-cookie', 'jquery-base64'], 
	
	function(_, $, cKit) {
	
	'use strict';
	
	var PermissionManager = (function (_super) {
		cKit.__extends(PermissionManager, _super);
		
		function PermissionManager() {
			var permissions = [];

			var permissionsLength = $.cookie('I360R_PERMISSION_COUNT') || 2;
			var permissionCookie, permissionsString="";
			for(var i = 1;i <= permissionsLength;i++){
				permissionCookie = $.cookie('I360R_PERMISSION_'+i);
				if (!permissionCookie){
					permissionsString = '';
					break;
				}

				try{
					$.base64.atob;
				}catch(e){
					location.reload();
				}

				var permissionsStr = $.base64.atob(permissionCookie, true);
				if(i != 1){
					permissionsString += ':';
				}
				permissionsString += permissionsStr;
			}
			permissions = permissionsString.split(':') || [];

			window.addEventListener('message',function(e){
				if(e.data.indexOf("permission") >= 0){
					var permission = e.data.split(',');
					if(permissions.indexOf(permission[1]) >= 0){
						window.frames[0].postMessage("permission,true",'*');
					}else{
						window.frames[0].postMessage("permission,false",'*');
					}

				}
            },false);


			this.permissions = permissions;

		}

		PermissionManager.prototype.hasPermission = function (permission) {
			return this.permissions.indexOf(permission) >= 0;
		};

		return PermissionManager;
	}) (cKit.CoreObject);

	var permissionManager = new PermissionManager();
	
	var has = function (permission) {
		return permissionManager.hasPermission(permission);
	};
	
	var require = function(permission, config) {
		if(permissionManager.hasPermission(permission)) {
			return config;
		}

		return null;
	};

	var PERMISSION = {
		TEST_1 : 'TEST_1',
		AGENT_WRITE: 'callcenter.agent.write',
		ATTENDANCE_WORKING_SHIFT_WRITE:'working.shift.write',
		ATTENDANCE_ROW_DATA_EFFECTIVITY:'attendance.raw.data.effectivity',
		ATTENDANCE_ROW_DATA_STATIONMANAGER_EFFECTIVITY:'attendance.raw.data.stationmanager.effectivity',
		ATTENDANCE_ROW_DATA_DELETE:'attendance.raw.data.delete',
		ATTENDANCE_ROW_DATA_WRITE:'attendance.raw.data.write',
		ATTENDANCE_ROW_DATA_PICTURE_READ:'attendance.raw.data.picture.read',
		
		BIZAREA_MGMT: 'bizarea.mgmt',
		BIZAREA_DISTRIBUTION_DELAY: 'bizarea.distribution.delay',
		BIZAREA_STATION_MGMT : 'bizarea.station.mgmt',

		
		
		
		BUSINESS_AREA_FUND_LOAN_APPLY:'businessareafund.loan.apply',
		BUSINESS_AREA_FUND_LOAN_REFUND:'businessareafund.loan.refund',
		BUSINESS_AREA_FUND_FINANCE_UPDATE:'businessareafund.finance.update',
		BUSINESS_AREA_WORKING_SHIFT_WRITE: 'business.area.working.shift.write',
		BUSINESSAREA_MAP_DRAW:'businessarea.map.draw',
		BUSINESSAREA_CREATE:'businessarea.create',
		BUSINESSAREA_ENABLED:'businessarea.enabled',
		BUSINESSAREA_MAP_DRAW:'businessarea.map.draw',
		BUSINESSAREA_CENTER_MODIFY:'businessarea.center.modify',
		BUSINESSAREA_SERVICE_TIME_MODIFY:'businessarea.service.time.modify',
		BUSINESSAREA_READ:'businessarea.read',
		BIZAREA_BUSINESS_CONFIG:'bizarea.business.config',
		BIZAREA_SCOPE_READ:'bizarea.scope.read',

		COMMISSAR: 'commissar',

		CC_DISTRIBUTION: 'cc.distribution',
		CC_CUSTOMER_SERVICE:'cc.customer.service',
		CC_AGENT_CALL: 'cc.agent.call',

		CLASS1_VENDOR_CATEGORY_WRITE: 'class1.vendor.category.write',
		CLASS1_VENDOR_WRITE: 'class1.vendor.write',
		CLASS1_STORE_WRITE: 'class1.store.write',
		CLASS1_STORE_SUSPEND: 'class1.store.suspend',
		CLASS1_STORE_BIND: 'class1.store.bind',
		CLASS1_PRODUCT_CATEGORY_WRITE: 'class1.product.category.write',
		CLASS1_PRODUCT_WRITE: 'class1.product.write',
		CLASS1_STORE_PRODUCT_WRITE: 'class1.store.product.write',
		CLASS1_INVENTORY_WRITE: 'class1.inventory.write',
		CLASS1_STORE_PRODUCT_CHECK: 'class1.store.product.check',
		CLASS1_STORE_PRODUCT_LOSS: 'class1.store.product.loss',


		CITY_CREATE: 'city.create',
		CITY_ENABLED: 'city.enabled',
		CITY_CENTER_MODIFY: 'city.center.modify',
		CITY_READ:'city.read',

		
		CLIENT_SOFTWARE_DOWNLOAD: 'client.software.download',
		CLIENT_SOFTWARE_UPLOAD: 'client.software.upload',
		COUPON_GROUP_UPDATE : 'coupon.group.update',
		CUSTOMER_ADDRESS_MAP_MGMT: 'customer.address.map.mgmt',
		DINGDING_CHAT_READ:'dingding.chat.read',
		DINGDING_CHAT_WRITE:'dingding.chat.write',
		DINGDING_CHAT_EMPLOYEE_READ:'dingding.chat.employee.read',
		DINGDING_CHAT_EMPLOYEE_WRITE:'dingding.chat.employee.write',
		DELIVERY_STAFF_CREATE: 'delivery.staff.create',
		DELIVERY_STAFF_WRITE: 'delivery.staff.write',
		DELIVERY_STAFF_PASSWORD_UPDATE: 'delivery.staff.password.update',
		DELIVERY_STAFF_BIZAREA: 'delivery.staff.bizarea.adjust',
		DELIVERY_STAFF_JOB_TRANSFER: 'delivery.staff.job.transfer',
		DELIVERY_STAFF_AVATAR_UPLOAD: 'delivery.staff.avatar.upload',
		DELIVERY_STAFF_MOBILE_IMEI_UNBIND : 'delivery.staff.mobile.imei.unbind',
		
		DELIVERY_STAFF_BASICSALARY_WRITE : 'delivery.staff.basicsalary.write',

		DELIVERONLY_STORE_WRITE:'deliveronly.store.write',
		DELIVERONLY_STORE_READ:'deliveronly.store.read',
		DELIVERONLY_STORE_SUSPEND:'deliveronly.store.out.of.service',
		DELIVERONLY_STORE_BIND:'deliveronly.store.bind',
		DELIVERONLY_STORE_ACCOUNT_RECHARGE : 'deliveronly.store.account.recharge',
		DELIVERONLY_STORE_ACCOUNT_PASSWORD_RESET_WRITE:'deliveronly.store.account.password.reset.write',
		DELIVERONLY_STORE_ACCOUNT_STATUS_CHANGE_WRITE:'deliveronly.store.account.status.change.write',
		DELIVERONLY_STORE_ACCOUNT_RECHARGE_CONFIG_WRITE:'deliveronly.store.account.recharge.config.write',
		DELIVERONLY_STORE_ACCOUNT_DETAIL_READ : 'deliveronly.store.account.detail.read',
		DELIVERONLY_STORE_ACCOUNT_MODIFY_MOBILE_WRITE : 'deliveronly.store.account.modify.mobile.write',
		DELIVERONLY_STORE_ACCOUNT_WALLET_RECHARGE_WRITE : 'deliveronly.store.account.wallet.recharge.write',
		DELIVERONLY_STORE_ACCOUNT_WALLET_WITHDRAW_WRITE : 'deliveronly.store.account.wallet.withdraw.write',
		DELIVERONLY_STORE_ACCOUNT_WALLET_STATISTIC : 'deliveronly.store.account.wallet.statistic',
		DELIVERONLY_STORE_BUSINESS_CONFIG_WRITE : 'deliveronly.store.business.config.write',
		DELIVERONLY_ORDER_READ : 'deliveronly.order.read',
		DELIVERONLY_ORDER_HISTORY_READ : 'deliveronly.order.history.read',
		DELIVERONLY_ORDER_DELETE : ' deliveronly.order.delete',
		DELIVERY_STAFF_ADJUST_LEAVE:'delivery.staff.adjust.leave',
		DELIVERY_STAFF_WRITE_BASICINFO: 'delivery.staff.write.basicinfo',
		DELIVERY_STAFF_WRITE_COMPENSATIONINFO: 'delivery.staff.write.compensationinfo',
		DELIVERY_STAFF_BUSINESSAREA_MODIFY: 'delivery.staff.businessarea.modify',
		DELIVERY_STAFF_CONTRACT_CLASSIFICATION:'delivery.staff.contract.classification',
		DELIVERY_STAFF_FEEDBACK_WRITE:'delivery.staff.feedback.write',
		DELIVERY_STAFF_WRITE_ENTRYINFO:'delivery.staff.write.entryinfo',
		DELIVERY_STAFF_INTERVIEW_READ:'delivery.staff.interview.read',
		DELIVERY_STAFF_INTERVIEW_WRITE:'delivery.staff.interview.write',
		DELIVERY_STAFF_SALARY_ITEM_WRITE:'deliverystaff.salary.item.write',
		DELIVERY_STAFF_SALARY_TEMPLATE_WRITE:'deliverystaff.salary.template.write',
		DELIVERYSTAFF_SALARY_DETAIL_READ : 'deliverystaff.salary.detail.read',
		DELIVERYSTAFF_SALARY_DETAIL_WRITE : 'deliverystaff.salary.detail.write',
		DELIVERYSTAFF_SALARY_DETAIL_WRITE_OTHER: 'deliverystaff.salary.detail.write.other',
		DELIVERYSTAFF_SALARY_DETAIL_WRITE_MANUAL_NOTE : 'deliverystaff.salary.detail.write.manual.note',
		DELIVERYSTAFF_SALARY_NUMBER_READ: 'deliverystaff.salary.number.read',
		DELIVERY_STAFF_DIRECT_DIMISSION: 'delivery.staff.direct.dimission',
		DELIVERY_STAFF_ENTRY_DIMISSION_DATE_MODIFY : 'delivery.staff.entry.dimission.date.modify',
		
		DELIVERONLY_STORE_ACCOUNT_RECHARGE_RECORD_READ:'deliveronly.store.account.recharge.record.read',
		ELEME_GRID_READ: 'eleme.grid.read',
		
		ELEME_PASSPORT_PWD_RESET: 'employee.passport.password.reset',
		ELEME_PASSPORT_PWD_UPDATE: 'employee.passport.password.update',
		ELEME_TEAM_STAFF_READ :'eleme.team.staff.read',
		ELEME_TEAM_STAFF_WRITE: 'eleme.team.staff.write',
		ELEME_TEAM_WRITE: 'eleme.team.write',
		ELEME_STAFF_WRITE: 'eleme.staff.write',
		ELEME_GRID_UPLOAD: 'eleme.grid.upload',
		EMPLOYEE_WRITE: 'employee.write',
		EMPLOYEE_READ : 'employee.read',
		EMPLOYEE_CREATE : 'employee.create',
		EMPLOYEE_UPDATE_RECRUIT : 'employee.update.recruit',
		EMPLOYEE_UPDATE_BANKCARD : 'employee.update.bankcard',
		EMPLOYEE_UPDATE_BASICINFO : 'employee.update.basicinfo',
		EMPLOYEE_UPDATE_OTHER : 'employee.update.other',
		EMPLOYEE_DISMISS : 'employee.dismiss',
		EMPLOYEE_DISMISS_READ : 'employee.dismiss.read',
		EMPLOYEE_RECUME_JOB : 'employee.recume.job',
		EMPLOYEE_MOBILE_IMEI_UNBIND : 'employee.mobile.imei.unbind',
		EMPLOYEE_INSURANCE_WRITE :'employee.insurance.write',
		EMPLOYEE_CITY_SALARY_WRITE: 'employee.city.salary.write',
		EMPLOYEE_CITY_SALARY_AUDIT: 'employee.city.salary.audit',
		EMPLOYEE_GLOBAL_SALARY_WRITE: 'employee.global.salary.write',
		ELEME_GLOBAL_SALARY_SCRAP: 'employee.global.salary.scrap',
		EMPLOYEE_GLOBAL_SALARY_AUDIT: 'employee.global.salary.audit',
		EMPLOYEE_POSITION_MASTER_CREATE : 'employee.position.master.create',
		EMPLOYEE_POSITION_PARTTIME_CREATE : 'employee.position.parttime.create',
		EMPLOYEE_POSITION_MGMT :'employee.position.mgmt',
		EMPLOYEE_POSITION_MODIFY :'employee.position.modify',
		EMPLOYEE_POSITION_TRANSFER :'employee.position.transfer',
		EMPLOYEE_POSITION_DISMISS : 'employee.position.dismiss',
		EMPLOYEE_POSITION_UPDATE : 'employee.position.update',
		EMPLOYEE_POSITION_GRADE_READ : 'employee.position.grade.read',
		EMPLOYEE_POSITION_DETAIL_READ : 'employee.position.detail.read',
		EMPLOYEE_POSITION_UPDATE_LOCATION : 'employee.position.update.location',
		EMPLOYEE_POSITION_UPDATE_HEALTHYCARD : 'employee.position.update.healthycard',
		EMPLOYEE_POSITION_UPDATE_BASICSALARY : 'employee.position.update.basicsalary',
		EMPLOYEE_POSITION_UPDATE_WORKINGSHIFT : 'employee.position.update.workingshift',
		EMPLOYEE_POSITION_UPDATE_VEHICLES : 'employee.position.update.vehicles',
		EMPLOYEE_POSITION_CHANGE_LOCATION : 'employee.position.change.location',
		EMPLOYEE_DINGDING_SYNC:'employee.dingding.sync',
		EMPLOYEE_CITY_SALARY_CONFIG_WRITE:'employee.city.salary.config.write',
		DEPARTMENT_SYNC:'department.sync',
		FINANCE_ORDER_REFUND: 'finance.order.refund',
		
	
		FIXED_ASSET_DISTRIBUTE : 'fixed.asset.distribute',
		HELP_MGMT : 'help.mgmt',
		HOUSE_CONTRACT_DETAIL:'house.contract.detail',
		HOUSE_CONTRACT_MODIFY:'house.contract.modify',
		HOUSE_CONTRACT_ADMIN_MODIFY:'house.contract.admin.modify',
		HOUSE_CONTRACT_BILL:'house.contract.bill',
		HOUSE_DEPOSIT_VIEW:'house.deposit.view',
		HOUSE_CONTRACT_VIEW:'house.contract.view',

		NATIONAL_INVENTORY_PURCHASE: 'national.inventory.purchase',
		NATIONAL_INVENTORY_DISTRIBUTION: 'national.inventory.distribution',
		CITY_INVENTORY_TRANSFER_OUT: 'city.inventory.transfer.out',
		CITY_INVENTORY_DISTRIBUTION: 'city.inventory.distribution',
		NATIONAL_INVENTORY_MODIFY: 'national.inventory.modify',
		CITY_INVENTORY_MODIFY: 'city.inventory.modify',
		BUSINESS_AREA_INVENTORY_MODIFY: 'business.area.inventory.modify',

		BUSINESS_AREA_INVENTORY_DISTRIBUTION: 'business.area.inventory.distribute',
		BUSINESS_AREA_INVENTORY_TRANSFER_OUT: 'business.area.inventory.transfer.out',
		BUSINESS_AREA_INVENTORY_SCRAP: 'business.area.inventory.scrap',
		BUSINESS_AREA_INVENTORY_RECOVER: 'business.area.inventory.recover',

		OFFICIAL_ACCOUNT_UPDATE: 'official.account.update',
		ORDER_TIMEOUT_UNBOUND: 'order.timeout.unbound',
		PARTNER_WRITE: 'partner.write',
		PARTNER_READ : 'partner.read',
		PARTNER_DETAIL_READ : 'partner.detail.read',
		PARTNER_RECHARGE_WRITE : 'partner.recharge.write',
		PARTNER_STATUS_WRITE : 'partner.status.write',
		PARTNER_WITHDRAW_WRITE : 'partner.withdraw.write',
		PARTNER_SERVICE_MGMT: 'partner.service.mgmt',
		PROVINCE_CREATE:'province.create',
		PROVINCE_READ:'province.read',
		RETURN_VISIT_SEARCH: 'return.visit.search',
		PERFORMANCE_DELIVERYSTAFFPARTTIME_CONFIG_MODIFY: 'performance.deliverystaffparttime.config.modify',

		QRCODE_WRITE:'qrcode.write',
		SECONDARY_POSITION_CREATE :'secondary.position.create',
		SECONDARY_POSITION_DELETE :'secondary.position.delete',
		STANDARD_ADDRESS_READ: 'standard.address.read',
		STANDARD_ADDRESS_MERGE: 'standard.address.merge',
		STANDARD_ADDRESS_WRITE: 'standard.address.write',
		TASK_CURRENT_TASK_WRITE: 'bpm.task.current.task.write',
		CHANNEL_MANAGEMENT:'channel.management',
		STATISTICS_DELIVERY_FIVE_ITEMS_DATA_FULL_RANK_READ: 'statistics.delivery.five.items.data.full.rank.read',
		TAKEAWAY_PROMOTION_MGMT: 'takeaway.promotion.mgmt',

		


		WORKORDER_BUSINESS_SEARCH: 'workorder.business.search',
		WORKORDER_OPERATION_SEARCH: 'workorder.operation.search',
		WORKORDER_STATION_SEARCH: 'workorder.station.search',
		WORKORDER_HANDLING_SEARCH:'workorder.handling.search',
		SUPPLIER_PRODUCT_WRITE: 'supplier.product.write',
		SUPPLIER_PRODUCT_READ: 'supplier.product.read',

		

		CALLCENTER_ORDER_DELETE : 'callcenter.order.delete',
		INVENTORY_RECORD_SEARCH: 'inventory.record.search',
		EMPLOYEE_PERSON_SALARY_WRITE:'employee.person.salary.write',

		INNER_MESSAGE_RECEIVE :'inner.message.receive',
		HOUSE_OFFICE_FEE_APPLY:'house.office.fee.apply',
		HOUSE_STATION_FEE_APPLY:'house.station.fee.apply',
		DELIVERY_STAFF_LEAVE_RECORD_WRITE:'delivery.staff.leave.record.write',
		DELIVERY_STAFF_LEAVE_RECORD_READ:'delivery.staff.leave.record.read',
		ELEME_STORE_BIND_PROCESSING_READ:'eleme.store.bind.processing.read',
		ELEME_STORE_BIND_PROCESS:'eleme.store.bind.process',
		ELEME_STORE_PROCESS_READ:'eleme.store.processed.read',
		COURSE_CATEGORY_WRITE:'course.category.write',
		NATION_COURSE_WRITE:'nation.course.write',
		NATION_COURSE_READ:'nation.course.read',
		CITY_COURSE_WRITE:'city.course.write',
		CITY_COURSE_READ:'city.course.read',
		STUDY_PLAN_NATION_READ:'study.plan.nation.read',
		STUDY_PLAN_NATION_WRITE:'study.plan.nation.write',
		STUDY_PLAN_CITY_READ:'study.plan.city.read',
		STUDY_PLAN_CITY_WRITE:'study.plan.city.write',
		EMPLOYEE_CREDIT_READ:'employee.credit.read',
		VENDOR_BILL_MANAGEMENT_READ:'vendor.bill.management.read',
		VENDOR_BILL_MANAGEMENT_WRITE:'vendor.bill.management.write',
		DELEVERYSTAFF_WORKING_SHIFT_WRITE:'deliverystaff.working.shift.write',
		APOLLO_ORDER_HISTORY_CREATE:'apollo.order.history.create',


		GLOBAL_CONFIG_WRITE:'global.config.write'
	};
	
	// 获取功能抽象 END
	return {
		has : has,
		require: require,
		PERMISSION: PERMISSION
	};
});
