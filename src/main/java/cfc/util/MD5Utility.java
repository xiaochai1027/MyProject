package cfc.util;

import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import cfc.log.Log;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang.StringUtils;

public class MD5Utility {
    private static final Log LOG = Log.getLog(MD5Utility.class);

    public final static String digest(String data) {
        char hexDigits[] = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };

        try {
            byte[] input = data.getBytes();

            MessageDigest md5 = MessageDigest.getInstance("MD5");

            md5.update(input);

            byte[] digest = md5.digest();

            int length = digest.length;
            char result[] = new char[length * 2];

            int j = 0;
            for (int i = 0; i < length; i++) {
                byte byte0 = digest[i];

                result[j++] = hexDigits[byte0 >>> 4 & 0xf];
                result[j++] = hexDigits[byte0 & 0xf];
            }

            return new String(result);
        } catch (Exception e) {
            LOG.error("Catch an Exception!", e);
        }

        return null;
    }
    
    public static String sign(String text, String charset) {
        return DigestUtils.md5Hex(getContentBytes(text, charset));
    }
    
    public static String sign(String text) {
        return DigestUtils.md5Hex(getContentBytes(text, "utf-8"));
    }
    
    public static boolean verify(String text, String sign, String charset) {
    	String mysign = DigestUtils.md5Hex(getContentBytes(text, charset));
    	if(mysign.equals(sign)) {
    		return true;
    	}
    	else {
    		return false;
    	}
    }
    /**
	 * 排序后的参数+sourceKey 进行md5加密
	 * @param sourceKey
	 * @param parms
	 * @return
	 */
    public static boolean verify(String sourceKey, String sign, Map<String, String> parms) {
    	boolean result = false;
		TreeMap<String, String> sortedParms = new TreeMap<String, String>(parms); 
		
		StringBuilder sb = new StringBuilder();
		
		Set<String> keys = sortedParms.keySet();
		for (String key : keys) {
			sb.append(key).append("=").append(sortedParms.get(key)).append("&");
		}
		
		String parmsString = sb.append("sk=").append(sourceKey).toString();
		String md5Info = DigestUtils.md5Hex(parmsString).toLowerCase();
		
		LOG.debug("generateSignature parmsString={}", parmsString);
		System.out.println("parmsString:" + parmsString);
		System.out.println("MD5:" + md5Info);
		if(StringUtils.isNotBlank(sign) && sign.equals(md5Info)) {
			result = true;
		}
		
		return result;
    }
    
    /**
     * sorted parameter string + sourceKey, encrypt by md5
     * @param sourceKey
     * @param parms
     * @param signStrLowerCase
     * @return
     */
    public static String produceSign(
    		String sourceKey,
    		Map<String, String> parms,
    		boolean signStrLowerCase) {
		TreeMap<String, String> sortedParms = new TreeMap<String, String>(parms); 
		
		StringBuilder sb = new StringBuilder();
		
		Set<String> keys = sortedParms.keySet();
		for (String key : keys) {
			sb.append(key).append("=").append(sortedParms.get(key)).append("&");
		}
		
		String parmsString = sb.append(sourceKey).toString();
		
		String sign = "";
		if (signStrLowerCase) {
			sign = DigestUtils.md5Hex(parmsString).toLowerCase();
		} else {
			sign = DigestUtils.md5Hex(parmsString).toUpperCase();
		}
		
		return sign;
    }

    private static byte[] getContentBytes(String content, String charset) {
        if (charset == null || "".equals(charset)) {
            return content.getBytes();
        }
        try {
            return content.getBytes(charset);
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }
    
    public final static String digest(InputStream is) throws IOException {
    	return DigestUtils.md5Hex(is);
    }
    
    public static void main(String[] args) {
    	String sourceKey = "05b20e21c0bae111d5de76b03bce85cd";
    	Map<String, String> parms = new HashMap<String, String>();
    	parms.put("mobile", "13900000000");
		parms.put("random", "1234");
    	boolean bl = verify(sourceKey, "1234", parms);
    	System.out.println(bl);
	}
    
}
