package cfc.util;

import java.lang.management.ManagementFactory;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.Set;
import java.util.regex.Pattern;
import javax.management.MBeanServer;
import javax.management.MalformedObjectNameException;
import javax.management.ObjectName;
import javax.management.Query;

import cfc.log.Log;
import org.apache.commons.lang.StringUtils;

public class IPUtility {

	private static final Log LOG = Log.getLog(IPUtility.class);

	private static final Pattern IP_PATTERN;
	
	static {
		IP_PATTERN = Pattern.compile("^(([1-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5]))((\\.(\\d|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])){3})$");
	}
	
	
	public static boolean isIP(String ipStr) {
		
		if (StringUtils.isBlank(ipStr) || ipStr.length() < 7 || ipStr.length() > 15) {
			return false;
		}
		
		return IP_PATTERN.matcher(ipStr).matches();
	}
	
	
	public static String getTomcatHttpPort() {
		MBeanServer mbs = ManagementFactory.getPlatformMBeanServer();
		Set<ObjectName> objs = null;
		
		try {
			objs = mbs.queryNames(new ObjectName("*:type=Connector,*"),
					Query.match(Query.attr("protocol"), Query.value("HTTP/1.1")));
		} catch (MalformedObjectNameException e) {
			LOG.error("A MalformedObjectNameException is invoked.", e);
		} catch (NullPointerException e) {
			LOG.error("A NullPointerException is invoked.", e);
		}
		
		LOG.debug("Objs size : {}", objs.size());

		String port = null;
		for (Iterator<ObjectName> i = objs.iterator(); i.hasNext(); ) {
			ObjectName obj = i.next();
			port = obj.getKeyProperty("port");

			if (StringUtils.isNotBlank(port)) {
				return port;
			}
		}

		return port;
	}

	public static String getLocalAddress() {
		Enumeration<NetworkInterface> networkInterfaces = null;
		
		try {
			networkInterfaces = NetworkInterface.getNetworkInterfaces();
		} catch (SocketException e) {
			LOG.error("A SocketException is invoked.", e);
		}
		
		String tomcatIp = null;
		while (networkInterfaces.hasMoreElements()) {
			NetworkInterface networkInterface = (NetworkInterface) networkInterfaces.nextElement();
			Enumeration<InetAddress> inetAddresses = networkInterface.getInetAddresses();

			while (inetAddresses.hasMoreElements()) {
				InetAddress inetAddress = (InetAddress) inetAddresses.nextElement();

				if (inetAddress.isSiteLocalAddress()) {
					tomcatIp = inetAddress.getHostAddress();
					LOG.debug("Web server ip : {}.", tomcatIp);
					break;
				}
			}
		}

		return tomcatIp;
	}

}
