package cfc.util;

import java.util.Enumeration;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringUtils;

public class CookieUtility {
	
	private static String DELIMITER = ":";
	
	public static final int DEFAULT_MAX_AGE = 2 * 3600;
	
	public static final String DEFAULT_PATH = "/";
	
    /**
     * 设置cookie
     * 
     * @param name 
     * @param value cookie值。如果是中文，则使用EscapeUtils.escape方法编码
     * @param age
     * @param request
     * @param response
     */
	public static void setBase64Cookie(HttpServletRequest request, HttpServletResponse response, 
			String domain, int age, String name, String ... value) {
		String cookieString = encodeCookie(value);
        setCookie(name, cookieString, domain, age, getCookiePath(request), request, response);
    }
	
	/**
     * 设置cookie
     * 
     * @param name 
     * @param value 
     * @param age
     * @param request
     * @param response
     */
	public static void setCookie(HttpServletRequest request, HttpServletResponse response, 
			String domain, int age, String name, String value) {
        setCookie(name, value, domain, age, getCookiePath(request), request, response);
    }
	
	/**
	 * 删除cookie
	 * 
	 * @param request
	 * @param response
	 * @param cookieName
	 */
	public static void deleteCookie(HttpServletRequest request,
			HttpServletResponse response, String domain, String cookieName) {
        setCookie(request, response, domain, 0, cookieName, null);
    }
	
    // Tomcat6/7会将带有equals =, parentheses (), colon : 等特殊字符的cookie截短
    // 所以需要通过header拿到最原始的cookie值
    public static String getRawCookie(HttpServletRequest request, String name) {
        if (request == null || StringUtils.isBlank(name)) {
            return null;
        }
        
        Enumeration<?> cookieHeaders = request.getHeaders("Cookie");
        while (cookieHeaders.hasMoreElements()) {
            String cookieHeader = (String)cookieHeaders.nextElement();
            String[] cookieValues = cookieHeader.split(";");
            
            if (cookieValues != null) {
                for (String cookieValue : cookieValues) {
                    cookieValue = cookieValue.trim();
                    String[] cookie = cookieValue.split("=");
                    
                    if (cookie != null && cookie.length == 2) {
                        String key = cookie[0];
                        String value = cookie[1];
                        
                        if (name.equals(key)) {
                            return value;
                        }
                    }
                }
            }
        }
        
        return null;
    }
	
	/**
	 * 获取cookie值
	 * 
	 * @param request
	 * @param name
	 * @return
	 */
	public static Cookie getCookie(HttpServletRequest request, String name) {
		Cookie[] cookies = request.getCookies();

		if ((cookies == null) || (cookies.length == 0)) {
			return null;
		}

		for (Cookie cookie : cookies) {
			if (name.equals(cookie.getName())) {
				return cookie;
			}
		}
		return null;
	}
    
	private static void setCookie(String name, String value, String domain,
			int age, String path, HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = new Cookie(name, value);
        cookie.setMaxAge(age);
        cookie.setPath(path);
        if(StringUtils.isNotBlank(domain)) {
        	cookie.setDomain(domain);
        }
        response.addCookie(cookie);
    }
     
    private static String getCookiePath(HttpServletRequest request) {
        String contextPath = request.getContextPath();
        return contextPath.length() > 0 ? contextPath : "/";
    }
    
    /**
     * Decodes the cookie and splits it into a set of token strings using the ":" delimiter.
     *
     * @param cookieValue the value obtained from the submitted cookie
     * @return the array of tokens.
     */
    @SuppressWarnings("unused")
	private static String[] decodeCookie(String cookieValue){
        for (int j = 0; j < cookieValue.length() % 4; j++) {
            cookieValue = cookieValue + "=";
        }

        if (!Base64Utility.isBase64(cookieValue.getBytes())) {
            throw new RuntimeException( "Cookie token was not Base64 encoded; value was '" + cookieValue + "'");
        }

        String cookieAsPlainText = new String(Base64Utility.decode(cookieValue.getBytes()));

        String[] tokens = org.springframework.util.StringUtils.delimitedListToStringArray(cookieAsPlainText, DELIMITER);

        if ((tokens[0].equalsIgnoreCase("http") || tokens[0].equalsIgnoreCase("https")) && tokens[1].startsWith("//")) {
            // Assume we've accidentally split a URL (OpenID identifier)
            String[] newTokens = new String[tokens.length - 1];
            newTokens[0] = tokens[0] + ":" + tokens[1];
            System.arraycopy(tokens, 2, newTokens, 1, newTokens.length - 1);
            tokens = newTokens;
        }

        return tokens;
    }

    /**
     * Inverse operation of decodeCookie.
     *
     * @param cookieTokens the tokens to be encoded.
     * @return base64 encoding of the tokens concatenated with the ":" delimiter.
     */
    private static String encodeCookie(String[] cookieTokens) {
        StringBuilder sb = new StringBuilder();
        for(int i=0; i < cookieTokens.length; i++) {
            sb.append(cookieTokens[i]);

            if (i < cookieTokens.length - 1) {
                sb.append(DELIMITER);
            }
        }

        String value = sb.toString();

        sb = new StringBuilder(new String(Base64Utility.encode(value.getBytes())));

        while (sb.charAt(sb.length() - 1) == '=') {
            sb.deleteCharAt(sb.length() - 1);
        }

        return sb.toString();
    }
}
