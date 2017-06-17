package cfc.util;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import cfc.log.Log;
import org.apache.commons.lang.StringUtils;

public class StringUtility {
	private final static Log LOG = Log.getLog(StringUtility.class);
	
	public static final String COMMA = ",";
	
	private static final Pattern SPELL_PATTERN = Pattern.compile("^[a-zA-Z]+$"); 
	private static final Pattern EMOJI_EMOTION = Pattern.compile("[\ud83c\udc00-\ud83c\udfff]|[\ud83d\udc00-\ud83d\udfff]|[\u2600-\u27ff]",Pattern.UNICODE_CASE | Pattern.CASE_INSENSITIVE);

	private static final String STANDARD_FORMAT_AMOUNT = "#,###.00";
	
	private static DecimalFormat formatStandardAmount = new DecimalFormat(STANDARD_FORMAT_AMOUNT);
	
	private static final String FORMAT_AMOUNT = "#.00";
	
	private static DecimalFormat formatAmount = new DecimalFormat(FORMAT_AMOUNT);
	
	public static boolean isSpellString(String str){
		if(StringUtils.isBlank(str))
			return false;
		
		return SPELL_PATTERN.matcher(str).matches();
	}
	
	
    /** MAXIMUM_INTEGER -> MAXIMUM_INT...
     * 
     * @param text
     * @param maxSize
     * @return
     */
    public static String chopText(String text, int maxSize) {
        
        if(null != text && (text.length() > maxSize)) {
            text = text.substring(0, maxSize - 3);
            text = text + "...";
        }
        
        return text;
    }
    
    /**
     * wrap with "<![CDATA[" and "]" if necessary 
     * @param src
     * @return
     */
    public static String toXmlString(String src) {
//      Pattern p = Pattern.compile("[<&]");
        if(src.contains("<") || src.contains("&")) {
            return "<![CDATA[" + src + "]]>";
        } else {
            return src;
        }
    }
    
    /**
     * TRUE -> "yes"
     * FALSE -> "no"
     * @param b
     * @return
     */
    public static String boolean2YesNo(boolean b) {
        if(!b) {
            return "no";
        } else {
            return "yes";
        }
    }
    
    public static String filterIllegalChars(String text) {
        text = StringUtils.trim(text);
        
        if (StringUtils.isNotBlank(text)) {
            text = text.replaceAll("[\\n|\\r]", "");
        }
        
        return text;
    }
    
    public static String replacePlusSign(String srcStr) {
        if (StringUtils.isBlank(srcStr)) {
            return "";
        }
        //srcStr = srcStr.replace("+", " ");
        srcStr = srcStr.replaceAll("\\+", "\\\\+");
        
        return srcStr;
    }

	public static String deleteEscapeChar(String srcStr) {
	    if (StringUtils.isBlank(srcStr)) {
	        return "";
	    }
	    srcStr = srcStr.replace("\n", "");
	    srcStr = srcStr.replace("\r", "");
	    srcStr = srcStr.replace("\f", "");
	    srcStr = srcStr.replace("\t", "");
	    srcStr = srcStr.replace("\b", "");
	    return srcStr;
	}
	
	public static String replaceEnter(String srcStr) {
	    if (StringUtils.isBlank(srcStr)) {
	        return "";
	    }
	    srcStr = srcStr.replace("\n", " ");
	    srcStr = srcStr.replace("\r", " ");
	    return srcStr;
	}
	
	public static String replaceQuotationMark(String srcStr) {
		if (StringUtils.isBlank(srcStr)) {
	        return "";
	    }
		srcStr = srcStr.replace("\"", " ");
	    srcStr = srcStr.replace("'", " ");
	    return srcStr;
	}

	public static String getSubstringBeforeBracket(String srcStr) {
	    if (StringUtils.isBlank(srcStr)) {
	        return "";
	    }
	    srcStr = deleteEscapeChar(srcStr);
	    srcStr = srcStr.replace("（", "(");
	    if (srcStr.contains("(")) {
	        srcStr = srcStr.split("\\(")[0];
	    }
	    return srcStr;
	}

	public static String getOrderProductNames(String orderSummary, String prefix, int num) {
	    if (!DataValidator.isNotEmptyData(orderSummary)) {
	        return "";
	    }
	
	    String productNames = "";
	    String productIdAndNames[] = orderSummary.split(";");
	    for (int i = 0; i < productIdAndNames.length; i++) {
	        String products[] = productIdAndNames[i].split(",");
	        String name = products[1].split("=")[1];
	        if (i < num) {
	            productNames += prefix + name;
	        }
	        if (i == num) {
	            productNames += prefix + "...";
	        }
	    }
	
	    if (productNames.startsWith(prefix)) {
	        productNames = productNames.replaceFirst(prefix, "");
	    }
	
	    return productNames;
	}
	
	public static int getOrderProductNum(String orderSummary) {
	    if (!DataValidator.isNotEmptyData(orderSummary)) {
	        return 0;
	    }
	
	    String productIdAndNames[] = orderSummary.split(";");

	    return productIdAndNames.length;
	}
	
	public static <T> String listToString(List<T> list, String split){
		String str = "";
		for (T t : list) {
			str += split + t;
		}
		if (str.startsWith(split)) {
			str = str.replaceFirst(split, "");
		}
		return str;
	}
	
	public static String getSensitiveWord(Set<String> sensitiveWords, String str){
		for (String sensitiveWord : sensitiveWords) {
			if (str.contains(sensitiveWord)) {
				return sensitiveWord;
			}
		}
		return null;
	}
	
	public static String getFileExtension(String fileName){
		if(StringUtils.isBlank(fileName)) {
			return null;
		}
		int indexOfPoint = fileName.lastIndexOf(".");
        String extension = fileName.substring(++indexOfPoint);
		return extension;
	}
	
	//获取餐品名称
	public static String getLibraryName(String pcitureName) {
		if(StringUtils.isBlank(pcitureName)) {
			return null;
		}
		int indexOfPoint = pcitureName.lastIndexOf(".");
        String name = pcitureName.substring(0,indexOfPoint); 
        
        while(name.endsWith(".")) {
        	name = name.substring(0, name.length() - 1);
		}
		return name;
	}
	
	/**
	 * 获取指定长度的随机字符串
	 * @param length
	 * @return
	 */
	public static String createNoncestr(int length) {
		String chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

		Random rd = new Random();
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < length; i++) {
			sb.append(chars.charAt(rd.nextInt(chars.length() - 1)));
		}
		return sb.toString();
	}

	/**
	 * 获取16为的随机字符串
	 * @return
	 */
	public static String createNoncestr() {
		return createNoncestr(16);
	}
	
	/**
	 * 过滤掉字符串中的emoji表情
	 * @return
	 */
	public static String filterEmojiEmotionString(String nickName) {
    	if (StringUtils.isBlank(nickName)) {
    		return "";
    	}
    	
    	Matcher emojiEmotionMatcher = EMOJI_EMOTION.matcher(nickName);
    	if (emojiEmotionMatcher.find()) {
    		return emojiEmotionMatcher.replaceAll("").trim();
    	}
    	
    	return nickName;
    }
	
	/**
	 * 得到简单异常信息
	 * @param e
	 * @return
	 */
	public static String getSimpleStackTrace(Exception e) {
		String stackTraceInfo = "";
		
		StackTraceElement[] st = e.getStackTrace();
		if (st.length > 0) {
			StackTraceElement stackTraceElement = st[0];
			String exclass = stackTraceElement.getClassName();
			String fileName = stackTraceElement.getFileName();
			String method = stackTraceElement.getMethodName();
			stackTraceInfo = " at " + exclass + "." + method + " (" + fileName + ":" + stackTraceElement.getLineNumber() + ")";
		}
		
		return stackTraceInfo;
	}
	
	public static String getConcatStringForCustomerRemarkVO(String split, Object... objects) {
		if (objects == null) {
			return "null";
		}
		
		StringBuilder sb = new StringBuilder();
		int j = 0;
		for (int i = 0; i < objects.length; i++) {
			String objStr = (String) objects[i];
			if (objStr != null && !StringUtils.isBlank(objStr)) {
				if (j == 0) {
					sb.append(objects[i]);
					j++;
				} else {
					sb.append(split).append(objects[i]);
				}
			}
		}
		
		if (j == 0) return null;
		
		return sb.toString();
	}
	
	public static String getConcatString(String split, Object... objects) {
		if (objects == null) {
			return "null";
		}
		
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < objects.length; i++) {
			if (i == 0) {
				sb.append(objects[i]);
			} else {
				sb.append(split).append(objects[i]);
			}
		}
		
		return sb.toString();
	}
	
	public static String getLimitLengthString(String s, int maxLength) {
		if (s != null && s.length() > maxLength) {
			return s.substring(0, maxLength);
		}
		return s;
	}
	
	public static String hidePartMobile(String phone) {
	   char [] mobile = phone.toCharArray();
	    for (int i = 3; i < mobile.length-4; i++) {
	    	mobile[i] ='*';
		    }
	   return mobile.toString();
	}

	public static String toPercentage(BigDecimal value) {
		return value.multiply(new BigDecimal(100)).setScale(2, BigDecimal.ROUND_HALF_UP) + "%";
	}
	
	public static String getStackTraceString(Exception e) {
		return getStackTraceString(e, true);
	}
	
	public static String getStackTraceString(Exception e, boolean autoFlush) {
		StringWriter sw = new StringWriter();
		e.printStackTrace(new PrintWriter(sw, autoFlush));
		return sw.toString();
	}
	
	public static Integer toInteger(String value) {
		if (StringUtils.isBlank(value)) {
			return null;
		}
		return Integer.parseInt(value);
	}
	
	public static int toInt(String value, int defaultValue) {
		if (StringUtils.isBlank(value)) {
			return defaultValue;
		}
		try {
			return Integer.parseInt(value);
		} catch (Exception e) {
			LOG.error("error parse int : " + value, e);
		}
		return defaultValue;
	}
	
	public static String getNotBlankString(String s) {
		if (StringUtils.isBlank(s)) {
			return null;
		}
		return s;
	}
	
	public static String formatStandardAmount(Object amount) {
    	if (amount == null) {
    		return "";
    	}
    	
    	String result = "";
		try {
			result = formatStandardAmount.format(amount);
		} catch (Exception e) {
			String cause = "Param amount format is not correct! amount=" + amount; 
			LOG.error(cause, e);
		}
    	
    	return result;
    }
	
	public static String formatAmount(Object amount) {
		if (amount == null) {
			return "";
		}
		
		String result = "";
		try {
			result = formatAmount.format(amount);
		} catch (Exception e) {
			String cause = "Param amount format is not correct! amount=" + amount; 
			LOG.error(cause, e);
		}
		
		return result;
	}
	
	public static void main(String[] args) {
//		System.out.println(StringUtility.getConcatStringForCustomerRemarkVO(";", 
//        		" ", "  ", "  "));
//		System.out.println(getConcatString(";", 
//        		null,null, null));
//		Integer s = null;
//		System.out.println(s);
//		System.out.println(toPercentage(new BigDecimal(0.23446)));
//		System.out.println(toInteger(null));
//		System.out.println(toInteger(""));
//		System.out.println(toInteger("12"));
		System.out.println(formatAmount(new BigDecimal(2000.00)));
	}
	
	public static boolean equals(Object obj1,Object obj2){
		if (obj1 == null) {
			if (obj2 == null ) {
				return true;
			}else {
				return false;
			}
		}else {
			if (obj2 == null ) {
				return false;
			}else {
				return obj1.equals(obj2);
			}
		}
	}
	
}
