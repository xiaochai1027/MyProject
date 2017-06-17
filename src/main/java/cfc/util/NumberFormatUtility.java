package cfc.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;

public class NumberFormatUtility {
	
	private static final DecimalFormat ZERO_DECIMAL_PLACES_FORMATTER;
	private static final DecimalFormat TWO_DECIMAL_PLACES_FORMATTER; 
	private static final DecimalFormat ONE_DECIMAL_PLACES_FORMATTER; 
	private static final DecimalFormat THREE_DECIMAL_PLACES_FORMATTER;
	private static final DecimalFormat SIX_DECIMAL_PLACES_FORMATTER; 
	
	// 2位小数的千分位表示形式
	private static final DecimalFormat TWO_DECIMAL_PLACES_THOUSANDTH_FORMATTER;
	
	static {
		ZERO_DECIMAL_PLACES_FORMATTER = new DecimalFormat("#0");
		ONE_DECIMAL_PLACES_FORMATTER = new DecimalFormat("#0.0");
		TWO_DECIMAL_PLACES_FORMATTER = new DecimalFormat("#0.00");
		THREE_DECIMAL_PLACES_FORMATTER = new DecimalFormat("#0.000");
		SIX_DECIMAL_PLACES_FORMATTER = new DecimalFormat("#0.000000");
		TWO_DECIMAL_PLACES_THOUSANDTH_FORMATTER = new DecimalFormat("###,##0.00");
	}
	
	public static String formatMoneyMax1Digits(BigDecimal money) {
		if (money == null) {
            return new String("0");
        }
        
        String str = ONE_DECIMAL_PLACES_FORMATTER.format(money.doubleValue());
        if (str.endsWith(".0")) {
            str = str.substring(0, str.length() - ".0".length());
        }

        return str;
	}
	
	// 保留固定的2位小数
	public static String formatMoneyFix2Digits(BigDecimal money) {
	    return format2DecimalPlaces(money);
	}
	
	// 保留最多2位小数
	public static String formatMoneyMax2Digits(BigDecimal money) {
        if (money == null) {
            return new String("0");
        }
        
        String str = TWO_DECIMAL_PLACES_FORMATTER.format(money.doubleValue());
        if (str.endsWith(".00")) {
            str = str.substring(0, str.length() - ".00".length());
        }

        return str;
    }

	// 保留固定的6位小数
	public static String formatGeolocation(BigDecimal location) {
		return format6DecimalPlaces(location);
    }
	
	// 保留0位小数 - 整数
	public static String format0DecimalPlaces(BigDecimal number) {
        if (number == null) {
            return new String("0");
        }
        
        return ZERO_DECIMAL_PLACES_FORMATTER.format(number.doubleValue());
    }
	
	// 保留固定的2位小数
	public static String format2DecimalPlaces(BigDecimal number) {
        if (number == null) {
            return new String("0.00");
        }
        
        return TWO_DECIMAL_PLACES_FORMATTER.format(number.doubleValue());
    }
	
	// 保留固定的3位小数
	public static String format3DecimalPlaces(BigDecimal number) {
        if (number == null) {
            return new String("0.000");
        }
        
        return THREE_DECIMAL_PLACES_FORMATTER.format(number.doubleValue());
    }

	// 保留固定的6位小数
	public static String format6DecimalPlaces(BigDecimal number) {
        if (number == null) {
            return new String("0.000000");
        }
        
        return SIX_DECIMAL_PLACES_FORMATTER.format(number.doubleValue());
    }
	
	/**
	 * 千分位表示方法 2000 转换成  "2,000.00"
	 * @param number
	 * @return
	 */
	public static String format2DecimalPlacesThousandth(BigDecimal number) {
		if (number == null) {
            return new String("0.00");
        }
		
		return TWO_DECIMAL_PLACES_THOUSANDTH_FORMATTER.format(number.doubleValue());
	}
	
	/**
	 * "2,000.00"转换成数字2000
	 * @param money
	 * @return
	 */
	public static BigDecimal parse2DecimalPlacesThousandth(String money) {
		String numberString = money.replaceAll("[,，]", "");
		BigDecimal number = new BigDecimal(numberString);
		
		return number;
	}
	
	// 向上取证，返回整数
	public static BigDecimal roundup0DecimalPlace(BigDecimal number) {
        return number.setScale(0, BigDecimal.ROUND_UP);
    }
	
	/**
	 * @Description: 四舍五入金钱到分，主要用于修正通过double创建的BigDecimal精度丢失问题
	 * @param money
	 * @return
	 */
	public static BigDecimal roundToCent(BigDecimal money) {
		if (money == null) {
			return BigDecimal.ZERO;
		}
		return money.setScale(2, RoundingMode.HALF_UP);
	}
	
	public static void main(String argv[]) {
		BigDecimal test = new BigDecimal(0.03);
		System.out.println(test);
		System.out.println(roundToCent(test));
		test = new BigDecimal(0.02);
		System.out.println(test);
		System.out.println(roundToCent(test));	
		test = null;
		System.out.println(test);
		System.out.println(roundToCent(test));
		test = new BigDecimal(-0.02);
		System.out.println(test);
		System.out.println(roundToCent(test));	
		test = new BigDecimal(-0.03);
		System.out.println(test);
		System.out.println(roundToCent(test));
		
	}
	
}
