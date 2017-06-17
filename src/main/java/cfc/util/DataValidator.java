package cfc.util;

import java.io.UnsupportedEncodingException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import org.apache.commons.lang.StringUtils;

public class DataValidator {

    private static final Pattern CUSTOMER_LOGIN_NAME_PATTERN;
    private static final Pattern CUSTOMER_PASSWORD_PATTERN;
    private static final Pattern EMPLOYEE_LOGIN_NAME_PATTERN;
    private static final Pattern EMPLOYEE_PASSWORD_PATTERN;
    private static final Pattern EMAIL_PATTERN;
    private static final Pattern MOBILE_PATTERN;
    private static final Pattern NO_EXTENSION_PATTERN;
    private static final Pattern EXTENSION_PATTERN;
    private static final Pattern LONGITUDE_PATTERN;
    private static final Pattern LATITUDE_PATTERN;
    private static final Pattern ZIP_CODE_PATTERN;
    private static final Pattern SPELL_PATTERN;
    private static final Pattern INTEGER_PATTERN;
    private static final Pattern FLOAT_PATTERN;
    private static final Pattern IDENTITY_CARD_NUMBER_PATTERN;
    private static final Pattern STORE_ACCOUNT_LOGIN_NAME_PATTERN;
    private static final Pattern STORE_ACCOUNT_PASSWORD_PATTERN;

    private static final Pattern AVAILABLE_DAY_PATTERN;

    private static final  Pattern PRICE_PATTERN;
    private static final  Pattern LABOR_HOUR_PATTERN;
    private static final  Pattern WEIXINID_PATTERN;
    
    private static final PhoneNumberUtil PHONE_NUMBER_UTIL;
    
    static {
        // 可由中文、英文、数字组成，不能全部为数字
        CUSTOMER_LOGIN_NAME_PATTERN = Pattern.compile("^(?=.*[a-zA-Z\u4E00-\u9FA5].*)([a-zA-Z\u4E00-\u9FA50-9]{1,20})$");

        // 密码由长度为6-16位的字母和数字组成，至少包含一个字母
        CUSTOMER_PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-zA-Z].*)([a-zA-Z0-9]{6,16})$");

        // 4-20位字符，可由英文、数字组成，不能全部为数字
        EMPLOYEE_LOGIN_NAME_PATTERN = Pattern.compile("^(?=.*[a-zA-Z].*)([a-zA-Z0-9]{4,20})$");

        // 密码由长度为6-16位的字母和数字组成，至少包含一个字母
        EMPLOYEE_PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-zA-Z].*)([a-zA-Z0-9]{6,16})$");
        
        EMAIL_PATTERN = 
        	Pattern.compile("^[_A-Za-z0-9-]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$");

        MOBILE_PATTERN = Pattern.compile("^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(16[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\\d{8})$");

        PHONE_NUMBER_UTIL = PhoneNumberUtil.getInstance();
        
        NO_EXTENSION_PATTERN = 
        	Pattern.compile("(^((0[1,2]{1}\\d{1}-?\\d{8})|(0[3-9]{1}\\d{2}-?\\d{7,8}))$)|(^0?(13[0-9]|15[0-35-9]|18[0236789]|14[57])[0-9]{8}$)");

        EXTENSION_PATTERN = Pattern.compile("^\\d{1,6}$");
        
        LONGITUDE_PATTERN = Pattern.compile("^[1-9]{1}[0-9]{1,2}\\.[0-9]{0,6}$");
        
        LATITUDE_PATTERN = Pattern.compile("^[1-9]{1}[0-9]{1,2}\\.[0-9]{0,6}$");
        
        ZIP_CODE_PATTERN = Pattern.compile("^\\d{6}$");
        
        SPELL_PATTERN = Pattern.compile("^[A-Za-z]+$");
        
        INTEGER_PATTERN = Pattern.compile("^[0-9]+$");
        
        FLOAT_PATTERN = Pattern.compile("^[-+]?[0-9]+(\\.[0-9]+)?$");
        
        IDENTITY_CARD_NUMBER_PATTERN = Pattern.compile("^\\d{17}(\\d{1}|x|X)$");
        
        STORE_ACCOUNT_LOGIN_NAME_PATTERN = Pattern.compile("^(?=.*[a-zA-Z].*)([a-zA-Z0-9_]{4,20})$");
        
        STORE_ACCOUNT_PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-zA-Z].*)([a-zA-Z0-9]{6,16})$");
        
        AVAILABLE_DAY_PATTERN = Pattern.compile("^[YN]{7}$");
        
        PRICE_PATTERN = Pattern.compile("^(([1-9]{1}\\d*)|([0]{1}))(\\.(\\d){0,2})?$");
        
        LABOR_HOUR_PATTERN = Pattern.compile("^[1-8]");
        
        WEIXINID_PATTERN = Pattern.compile("^[a-zA-Z][a-zA-Z0-9_-]{5,19}$");
    }
    
    public static boolean isValidCustomerIdentifier(String identifier) {
        return isValidMobile(identifier) 
        	|| isValidEmail(identifier) 
        	|| isValidCustomerLoginName(identifier);
    }

    public static boolean isValidCustomerLoginName(String loginName) {
        if (StringUtils.isBlank(loginName)) {
            return false;
        }
        
		try {
			// GBK编码中中文为两个字符
			// 4-20位字符
			int length = loginName.getBytes("GBK").length;
			if (length < 4 || length > 20) {
	        	return false;
	        }
		} catch (UnsupportedEncodingException e) {
//			LOG.error("Catch an Exception!", e);
			
			return false;
		}
        
        Matcher loginNameMatcher = CUSTOMER_LOGIN_NAME_PATTERN.matcher(loginName);

        return loginNameMatcher.matches();
    }

    public static boolean isValidCustomerPassword(String password) {
        if (StringUtils.isBlank(password)) {
            return false;
        }

        Matcher passwordMatcher = CUSTOMER_PASSWORD_PATTERN.matcher(password);

        return passwordMatcher.matches();
    }

    public static boolean isValidEmployeeLoginName(String loginName) {
    	if (StringUtils.isBlank(loginName)) {
            return false;
        }
        
        Matcher loginNameMatcher = EMPLOYEE_LOGIN_NAME_PATTERN.matcher(loginName);

        return loginNameMatcher.matches();
    }

    public static boolean isValidStoreAccountPassword(String password) {
    	if (StringUtils.isBlank(password)) {
            return false;
        }

        Matcher passwordMatcher = STORE_ACCOUNT_PASSWORD_PATTERN.matcher(password);

        return passwordMatcher.matches();
    }
    
    public static boolean isValidStoreAccountLoginName(String loginName) {
    	if (StringUtils.isBlank(loginName)) {
            return false;
        }
        
        Matcher loginNameMatcher = STORE_ACCOUNT_LOGIN_NAME_PATTERN.matcher(loginName);

        return loginNameMatcher.matches();
    }
    
    public static boolean isValidEmployeePassword(String password) {
    	if (StringUtils.isBlank(password)) {
            return false;
        }

        Matcher passwordMatcher = EMPLOYEE_PASSWORD_PATTERN.matcher(password);

        return passwordMatcher.matches();
    }
    
    public static boolean isValidDeliveryStaffPassword(String password) {
    	if (StringUtils.isBlank(password)) {
            return false;
        }

        Matcher passwordMatcher = EMPLOYEE_PASSWORD_PATTERN.matcher(password);

        return passwordMatcher.matches();
    }
    
    public static boolean isValidStorePassword(String password) {
        return isValidEmployeePassword(password);
    }

    public static boolean isValidEmail(String email) {
        if (StringUtils.isBlank(email)) {
            return false;
        }

        Matcher emailMatcher = EMAIL_PATTERN.matcher(email);

        return emailMatcher.matches();
    }

    public static boolean isValidMobile(String mobile) {
        if (StringUtils.isBlank(mobile)) {
            return false;
        }

        Matcher mobileMatcher = MOBILE_PATTERN.matcher(mobile);

        return mobileMatcher.matches();
    }
    
    /**
     * 6—20个字母、数字、下划线和减号,必须以字母开头（不区分大小写）,不支持中文
     * 
     * @param weixinId
     * @return
     */
    public static boolean isValidWeixinId(String weixinId) {
    	if (StringUtils.isBlank(weixinId)) {
    		return false;
    	}
    	return WEIXINID_PATTERN.matcher(weixinId).matches();
    }
    
    public static boolean isValidMobileStrict(String mobile) {
        try {
            PhoneNumber number = PHONE_NUMBER_UTIL.parse(mobile, "CN");
            PhoneNumberUtil.PhoneNumberType type = PHONE_NUMBER_UTIL.getNumberType(number);

            if (type.equals(PhoneNumberUtil.PhoneNumberType.MOBILE)) {
                return true;
            } else {
                return false;
            }
        } catch (NumberParseException e) {

            return false;
        }
    }
    
    public static boolean isValidFixedLine(String regionCode, String phoneNumber, String extension) {
        String noExtension = regionCode + "-" + phoneNumber;

        Matcher noExtensionMatcher = NO_EXTENSION_PATTERN.matcher(noExtension);

        if (noExtensionMatcher.matches()) {
            if (StringUtils.isNotBlank(extension)) {
                Matcher extensionMatcher = EXTENSION_PATTERN.matcher(extension);

                return extensionMatcher.matches();
            }

            return true;
        }

        return false;
    }
    
    public static boolean isValidLongitude(String longitude) {
        if (StringUtils.isBlank(longitude)) {
            return false;
        }

        Matcher longitudeMatcher = LONGITUDE_PATTERN.matcher(longitude);

        return longitudeMatcher.matches();
    }
    
    public static boolean isValidLatitude(String latitude) {
        if (StringUtils.isBlank(latitude)) {
            return false;
        }

        Matcher latitudeMatcher = LATITUDE_PATTERN.matcher(latitude);

        return latitudeMatcher.matches();
    }

    public static boolean isValidZipCode(String zipCode) {
    	if (StringUtils.isBlank(zipCode)) {
            return false;
        }
    	
    	Matcher zipCodeMatcher = ZIP_CODE_PATTERN.matcher(zipCode);

        return zipCodeMatcher.matches();
    }
    
    // 如果输入是空字符串，"null"字符串和"NONE"字符串返回false，否则返回true
    public static boolean isNotEmptyData(String str) {
        if (StringUtils.isBlank(str)) {
            return false;
        }
        
        if ("null".equalsIgnoreCase(str) 
        	|| FrameworkConstant.NONE_SELECT_CODE.equalsIgnoreCase(str) 
        	|| "undefined".equalsIgnoreCase(str)) {
        	
            return false;
        }
        
        return true;
    }
    
    // 如果输入是空字符串，"null"字符串和"NONE"字符串返回true，否则返回false
    public static boolean isEmptyData(String str) {
        return !isNotEmptyData(str);
    }
    
    public static boolean isValidSpell(String str) {
        if (StringUtils.isBlank(str)) {
            return false;
        }

        Matcher spellMatcher = SPELL_PATTERN.matcher(str);

        return spellMatcher.matches();
    }
    
    public static boolean isValidInteger(String str) {
        if (StringUtils.isBlank(str)) {
            return false;
        }

        Matcher integerMatcher = INTEGER_PATTERN.matcher(str);

        return integerMatcher.matches();
    }
    
    public static boolean isValidFloat(String str) {
        if (StringUtils.isBlank(str)) {
            return false;
        }

        Matcher floatMatcher = FLOAT_PATTERN.matcher(str);

        return floatMatcher.matches();
    }
    
    public static boolean isValidBool(String str) {
        if ("Y".equalsIgnoreCase(str) || "N".equalsIgnoreCase(str)) {
            return true;
        } else {
            return false;
        }
    }
    
    public static boolean isValidIdentityCardNumber(String str) {
        if (StringUtils.isBlank(str)) {
            return false;
        }

        Matcher identityCardNumberMatcher = IDENTITY_CARD_NUMBER_PATTERN.matcher(str);

        return identityCardNumberMatcher.matches();
    }
    
    public static boolean isValidAvailableDay(String availableDay) {
    	if (StringUtils.isBlank(availableDay)) {
            return false;
        }

        Matcher availableDayMatcher = AVAILABLE_DAY_PATTERN.matcher(availableDay);

        return availableDayMatcher.matches();
    }
    
    public static boolean isValidPrice(String price) {
    	if (StringUtils.isBlank(price)) {
    		return false;
    	}
    	
    	Matcher validPriceMatcher = PRICE_PATTERN.matcher(price);
    	
    	return validPriceMatcher.matches();
    }

    /**
     * 工时只能为1-8之间的数字
     * 
     * @param laborHour
     * @return
     */
    public static boolean isValidLaborHour(Integer laborHour) {
        return LABOR_HOUR_PATTERN.matcher(String.valueOf(laborHour)).matches();
    }
    
}
