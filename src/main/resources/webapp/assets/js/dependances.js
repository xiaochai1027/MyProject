
var I360R = (function () {
    var EXPORT_NONE = null;
    var REQUIRE_CONFIG = {
        baseUrl: '/assets',
        paths:{
            // ����Ǵ�磬һ����Ҫ��
            'require': 'lib/requre/js/require',

            // ������jquery�����Ĳ����
            'jquery': 'lib/jquery/js/jquery-1.9.1.min',
            'jquery-json': 'lib/jquery/jquery-json/jquery.json-2.3',
            'jquery-ui': 'lib/jquery/jquery-ui/jquery-ui-1.10.3.custom.min',
            'jquery-ui-bootstrap': 'lib/jquery/jquery-ui-bootstrap/js/jquery-ui-1.9.2.custom',
            'jquery-ui-i18n': 'lib/jquery/jquery-ui/jquery.ui.datepicker-zh-CN',
            'jqgrid': 'lib/jquery/jqgrid/js/jquery.jqGrid.src',
            'jqgrid-i18n': 'lib/jquery/jqgrid/js/grid.locale-cn',
            'jquery-placeholder': 'lib/jquery/jquery-placeholder/jquery.placeholder.min',
            'jquery-cookie': 'lib/jquery/jquery-cookie/jquery.cookie',
            'jquery-base64': 'lib/jquery/jquery-base64/jquery.base64',
            'datejs':  'lib/extension/js/date',
            'xheditor': 'lib/jquery/xheditor/xheditor-1.1.14-zh-cn',
            'dragsort': 'lib/jquery/dragsort/jquery.dragsort-0.5.2.min',
            'imagePreview' : 'lib/jquery/imagePreview/jquery.imagePreview.1.0',
            'dataTable':  'lib/jquery/datatable/jquery.dataTables',
            'dataTableSelect' :  'lib/jquery/datatable/dataTables.select.min',
            'DTbootstrap' :  'js/common/them/DT_bootstrap',

            'bootstrap': 'lib/bootstrap/js/bootstrap-2.3.0.min',
            'bootstrap-autocomplete': 'lib/bootstrap/autocomplete/js/bootstrap.autocomplete-MOD',
            'bootstrap-fileinput': 'lib/bootstrap/fileinput/js/fileinput',
            'bootstrap-modal': 'lib/bootstrap/modal/js/bootstrap-modal',
            'bootstrap-modalmanager': 'lib/bootstrap/modal/js/bootstrap-modalmanager',

            // MVVM�ܹ���knockout, debugģʽ�� lib/knockout/knockout-2.3.0.debug
            'knockout': 'lib/knockout/knockout-2.3.0',
            'knockout-mapping-helper': 'lib/knockout/knockout.mapping.helper',
            'knockout-mapping': 'lib/knockout/knockout.mapping-2.4.1',

            // qunit
            'qunit': 'lib/qunit/js/qunit',

            // bootstrap����չ������ǣ�������bootstrap�����Բ���������
            'daterangepicker': 'lib/bootstrap/daterangepicker/js/bootstrap-daterangepicker',
            'datetimepicker': 'lib/bootstrap/datetimepicker/js/bootstrap-datetimepicker-MOD',
            'iCheck-master': 'lib/bootstrap/iCheck-master/jquery.icheck',

            // underscore
            'underscore': 'lib/underscore/underscore-1.5.1-min',

            // i360r ģ����, ����ģ�鶼Ӧ���Ѿ�д��������ϵ��
            'coreKit': 'js/base/coreKit',
            'uiKit': 'js/base/uiKit',
            'permissionKit': 'js/base/permissionKit',
            'uiKit3': 'js/base/uiKit3',
            'multimediaKit': 'js/base/multimediaKit',
            'networkKit': 'js/base/networkKit',
            'l10n': 'js/common/l10n'

        },

        /** ����������Ҫ��д������AMDģ�黯�淶��ģ����������ϵ
         *
         */
        shim: {
            'jquery': {
                exports: 'jQuery'
            },

            'underscore': {
                exports: '_'
            },


            'datejs': {
                exports: EXPORT_NONE
            },

            'jquery-json': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'jquery-ui': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'jquery-placeholder': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'jqgrid-i18n': {
                deps: ['jquery-ui'],
                exports: EXPORT_NONE
            },

            'jqgrid': {
                deps: ['jquery-ui', 'jqgrid-i18n'],
                exports: EXPORT_NONE
            },

            'jquery-ui-i18n': {
                deps: ['jquery-ui-bootstrap'],
                exports: EXPORT_NONE
            },

            'jquery-base64': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },
            'dataTable': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'xheditor': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'knockout-mapping': {
                deps: ['knockout-mapping-helper'],
                exports: EXPORT_NONE
            },

            'bootstrap-modalmanager': {
                deps: ['bootstrap'],
                exports: EXPORT_NONE
            },

            'bootstrap-modal': {
                deps: ['bootstrap', 'bootstrap-modalmanager'],
                exports: EXPORT_NONE
            },

            'bootstrap': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'zclip': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'daterangepicker': {
                deps: ['bootstrap', 'datejs'],
                exports: EXPORT_NONE
            },

            'datetimepicker': {
                deps: ['jquery', 'bootstrap'],
                exports: EXPORT_NONE
            },

            'iCheck-master': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'bootstrap-autocomplete': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'bootstrap-fileinput': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },


            'dragsort': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            },

            'imagePreview': {
                deps: ['jquery'],
                exports: EXPORT_NONE
            }

        },

        waitSeconds: 60
    };
    return {
        EXPORT_NONE: EXPORT_NONE,
        REQUIRE_CONFIG: REQUIRE_CONFIG
    };
}());

