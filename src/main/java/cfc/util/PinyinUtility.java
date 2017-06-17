package cfc.util;

import java.math.BigDecimal;

import net.sourceforge.pinyin4j.PinyinHelper;
import net.sourceforge.pinyin4j.format.HanyuPinyinCaseType;
import net.sourceforge.pinyin4j.format.HanyuPinyinOutputFormat;
import net.sourceforge.pinyin4j.format.HanyuPinyinToneType;
import net.sourceforge.pinyin4j.format.exception.BadHanyuPinyinOutputFormatCombination;
import org.apache.commons.lang.StringUtils;

public class PinyinUtility {
	private static final HanyuPinyinOutputFormat DEFAULT_FORMAT;
	
	static {
		DEFAULT_FORMAT = new HanyuPinyinOutputFormat();
		DEFAULT_FORMAT.setCaseType(HanyuPinyinCaseType.UPPERCASE);
		DEFAULT_FORMAT.setToneType(HanyuPinyinToneType.WITHOUT_TONE);
	}
	
	public static void main(String[] args)
			throws BadHanyuPinyinOutputFormatCombination {
		System.out.println(PinyinUtility.getCapital("（猪肉三鲜(2两)+南瓜粥/皮蛋瘦肉粥/紫米粥/绿豆粥+酸辣瓜条"));
		System.out.println(PinyinUtility.getPinyin("猪肉三鲜(2两)+南瓜粥/皮蛋瘦肉粥/紫米粥/绿豆粥+酸辣瓜条"));
		System.out.println(PinyinUtility.getCapitalOfEachWord("猪肉三鲜(2两)+南瓜粥/皮蛋瘦肉粥/紫米粥/绿豆粥+酸辣瓜条"));
		
		BigDecimal cellValue = new BigDecimal(23.323230);
		BigDecimal cellValue2 = new BigDecimal(23.32323);
    	System.out.println(cellValue.doubleValue());
    	System.out.println(cellValue.equals(cellValue2));
	}

	/*
	 * 取得汉字首字母（大写）
	 */
	public static String getCapital(String chineseWords) throws BadHanyuPinyinOutputFormatCombination {
		char[] ch = chineseWords.toCharArray();
		
		if (ch[0] > 128) {
			String[] pinyin = PinyinHelper.toHanyuPinyinStringArray(ch[0], DEFAULT_FORMAT);
			if (pinyin == null) {
				return ("" + ch[0]).toUpperCase();
			} else {
				return pinyin[0].substring(0, 1);	
			}			
		} else {
			return ("" + ch[0]).toUpperCase();
		}
	}

	/*
	 * 取得每位汉字首字母（大写）
	 */
	public static String getCapitalOfEachWord(String chineseWords) throws BadHanyuPinyinOutputFormatCombination {
	    if (StringUtils.isBlank(chineseWords)) {
            return "";
        }
	    
		char[] ch = chineseWords.toCharArray();
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < ch.length; i++) {
			if (ch[i] > 128) {
				if (PinyinHelper.toHanyuPinyinStringArray(ch[i], DEFAULT_FORMAT) != null)
					sb.append((PinyinHelper.toHanyuPinyinStringArray(ch[i], DEFAULT_FORMAT)[0]).substring(0, 1));
			} else {
				sb.append(ch[i]);
			}
		}
		
		return sb.toString();
	}

	/*
	 * 取得汉字全拼（大写）
	 */
	public static String getPinyin(String chineseWords) throws BadHanyuPinyinOutputFormatCombination {
	    if (StringUtils.isBlank(chineseWords)) {
            return "";
        }
	    
		char[] ch = chineseWords.toCharArray();
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < ch.length; i++) {
			try {
				if (ch[i] > 128) {
					if (PinyinHelper.toHanyuPinyinStringArray(ch[i], DEFAULT_FORMAT) != null)
						sb.append(PinyinHelper.toHanyuPinyinStringArray(ch[i], DEFAULT_FORMAT)[0]);
				} else {
					sb.append(ch[i]);
				}
			} catch (Exception ex) {
				ex.printStackTrace();
			}
		}

		return sb.toString();
	}
}