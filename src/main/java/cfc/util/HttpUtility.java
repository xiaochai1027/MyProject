package cfc.util;

import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;

import org.apache.commons.lang.StringUtils;

public class HttpUtility {

	/**
	 * 从url获取二级域名，如果url中没有域名，则返回空
	 * 
	 * 举例：
	 * http://www.test.com/path/subpath 返回 test.com
	 * http://192.168.1.1/path/subpath 返回空
	 * http://localhost/path/subpath 返回空
	 * 
	 * @param url
	 * @return
	 */
	public static String getSecondLevelDomain(String url) {
		
		String domain = "";
		
		if (StringUtils.isNotBlank(url)) {
			
			try {
				domain = new URL(url).getHost();
			} catch (MalformedURLException e) {
				e.printStackTrace();
				return domain;
			}
			
			if (!IPUtility.isIP(domain) && StringUtils.contains(domain, ".")) {
				int lastDotIndex = StringUtils.lastIndexOf(domain, ".");
				int secondLastDotIndex = StringUtils.lastIndexOf(domain, ".", lastDotIndex - 1);
				domain = StringUtils.substring(domain, secondLastDotIndex + 1);
			} else {
				domain = "";
			}
		}
		return domain;
	}
	
	/**
	 * 返回baseurl
	 * 
	 * 举例：
	 * http://www.test.com/path/subpath 返回 http://www.test.com
	 * http://192.168.1.1:8080/path/subpath 返回 http://192.168.1.1:8080
	 * http://localhost/path/subpath 返回 http://localhost
	 * 
	 * @param url
	 * @return
	 */
	public static String getServerBaseUrl(String url) {
		
		StringBuilder baseUrl = new StringBuilder();
		
		if (StringUtils.isNotBlank(url)) {
			URL urlObject = null;
			try {
				urlObject = new URL(url);
			} catch (MalformedURLException e) {
				e.printStackTrace();
				return baseUrl.toString();
			}
			
			baseUrl.append(urlObject.getProtocol()).append("://").append(urlObject.getHost());
			
			if (urlObject.getPort() > 0) {
				baseUrl.append(":").append(urlObject.getPort());
			}			
		}
		return baseUrl.toString();
	}
	
	public static String getPath(String uri) {
		if (!StringUtils.isEmpty(uri)) {
			try {
				return new URI(uri).getPath();
			} catch (URISyntaxException e) {
			}
		}
		return uri;
	}
}
