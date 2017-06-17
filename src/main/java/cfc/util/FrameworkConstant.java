package cfc.util;

import java.math.BigDecimal;

public class FrameworkConstant {
    
	public static final String ROOT_LOCATION_CODE = "01";
    public static final String NONE_SELECT_CODE = "NONE";
    
    public static final String NONE_SELECT_ID = "0";
    
    public static final int NEGATIVE_SELECT_ID = -1;
    
    public static final String OAUTH_PARAM_TYPE = "oauthType";
    
    // 之前过长的loginSource字段，新的登陆路径已经不再使用了，只是为了兼容
    public static final String OAUTH_PARAM_LOGIN_SOURCE_LEGACY = "loginSource";
 	
    public static final String OAUTH_PARAM_LOGIN_SOURCE = "s";
    
    public static final String OAUTH_PARAM_OFFICIAL_ACCOUNT = "a";
    
    public static final String OAUTH_PARAM_TARGET = "t"; //"target"
    
    public static final String URL_PARAM_OFFICIAL_ACCOUNT = "officialAccount";
    
    public static final int HIGHLIGHT_BULLETIN_COUNT = 6;
    
    public static final int GAINED_POINT_SERVICE = 25;
    public static final int GAINED_POINT_STORE = 50;
    public static final int GAINED_POINT_PRODUCT = 2;
    
    public static final int DISPLAY_PRODUCT_NUMBER = 10;
    
    public static final int DEFAULT_MIN_DELIVER_PRICE = 10;
    
    public static final BigDecimal PHONE_ORDERING_FEE = BigDecimal.ZERO;
    
    public static final BigDecimal PHONE_ORDERING_FEE_FREE_THRESHOLD = new BigDecimal(200);
    
    public static final long GROUPON_EPAY_ORDER_EXPIRE_TIME = 3 * 24 * 60 * 60 * 1000; // 3days
    
    public static final int PAGE_NUMBER_FIRST = 1;
    
    public static final long TOKEN_EXPIRE_THRESHOLD_IN_MILLI_SECOND = 1200000; // 提前20分钟
    
    public static final String APPLICATION_SESSION_KEY = "SESSION_ID";
    
    public static final String SESSION_KEY_CAPTCHA_NAME = "KEY_CAPTCHA_NAME";
    
    public static final BigDecimal ROYALTY_PART_TIME_DELIVERY_STAFF = new BigDecimal(2);
    
    public static final String CHARSET_UTF_8 = "UTF-8";
    
    //==============订单预估时间定义开始====================
    /** 订单完成的最短时间，用于修正期望送达时间 */
    public static final int ORDER_MIN_COMPLETE_MINUTES = 45;
    public static final long ORDER_MIN_COMPLETE_MILLIS = 45 * DateTimeUtility.MINUTE;    
    /** 预估配送时间 */
    public static final int ESTIMATE_DELIVER_MINUTES = 10;
    /** 第三方平均配送时间浮动 */
    public static final int PARTNER_AVERAGE_DELIVER_MINUTES_COEFF = 10;
    /** 用户可以选择的配送时间间隔 */
    public static final int DELIVER_TIME_INTERVAL = 10;
    /** 普通订单进入下单状态的时间提前量 */
    public static final int GENERAL_ORDER_AHEAD_MINUTES = 15;
    /** 超时赔付订单的进入下单状态的时间提前量 */
    public static final int TIME_COMMITTED_ORDER_AHEAD_MINUTES = 20;
    /** 订单延长支付的时间 */
    public static final int ORDER_EXTENDED_PAY_MIN = 10;
    /** 自动分单最低配送时间，不少于20分钟 */
    public static final int AUTO_ASSIGN_MIN_DELIVERY_MINUTES_30 = 30;
    /** 自动分单最低配送时间，不少于30分钟 */
    public static final int AUTO_ASSIGN_MIN_DELIVERY_MINUTES_40 = 40;
    /** 取餐时间最低提前30分钟 */
    public static final int PICKING_UP_MIN_MINUTES = 30;
    //==============订单预估时间定义结束====================    
}
