package cfc.util;

public class NumberConvertUtility {

	/**
	 * 把整数转换成字节数组
	 * 字节数字是低位优先的（即为小端的字节序）
	 * 
	 * @param number
	 * @return
	 */
	public static byte[] int2Byte(int number) {
		byte[] targets = new byte[4];

		targets[0] = (byte) (number & 0xff);// 最低位
		targets[1] = (byte) ((number >> 8) & 0xff);// 次低位
		targets[2] = (byte) ((number >> 16) & 0xff);// 次高位
		targets[3] = (byte) (number >>> 24);// 最高位,无符号右移。
		return targets;
	}
	
	/**
	 * 把整数转换成字节数组
	 * 字节数字是低位优先的（即为小端的字节序）
	 * 
	 * @param number
	 * @return
	 */
	public static byte[] long2Byte(long number) {
		long temp = number;
		byte[] b = new byte[8];

		//for (int i = b.length - 1; i > -1; i--) {
		for (int i = 0; i < b.length; i++) {

			b[i] = new Long(temp & 0xff).byteValue();

			temp = temp >> 8;
		}

		return b;
	}
	
	
	/**
	 * 把字节数字转换成整数
	 * 参数byteArr数组是低位优先的（即为小端的字节序）
	 * 
	 * @param byteArr 字节数组 (字节数组是低位优先的即低位数据在数组前面高位数据在数组后面)
	 * @return
	 */
	public static int byte2Int(byte[] byteArr) {
		
	    int iOutcome = 0;
	    byte bLoop;

	    for (int i = 0; i < byteArr.length; i++) {
	        bLoop = byteArr[i];
	        iOutcome += (bLoop & 0xFF) << (8 * i);
	    }
	    return iOutcome;
	}
	
	/**
	 * 把字节数字转换成无符号整数，数据范围为0~4294967295 (0xFFFFFFFF即DWORD)
	 * 参数byteArr数组是低位优先的（即为小端的字节序）
	 * 
	 * @param byteArr 字节数组 (字节数组是低位优先的即低位数据在数组前面高位数据在数组后面)
	 * @return
	 */
	public static long byte2UnsignedInt(byte[] byteArr) {
		return int2UnsignedInt(byte2Int(byteArr));
	}
	
	/**
	 * 将有符号int数据转换无符号int，数据范围为0~4294967295 (0xFFFFFFFF即DWORD)
	 * 
	 * 将java的有符号int转换成VC++语言的无符号整数即DWORD
	 * 
	 * @param number 有符号的整形数据
	 * @return
	 */
	public static long int2UnsignedInt(int number) {
	    return number & 0x0FFFFFFFFl;
	}
	
	/**
	 * 把字节数组装换成16进制形式的字符串
	 * @param byteArr
	 * @return
	 */
	public static String byte2HexString(byte[] byteArr) {
		
		StringBuilder stringBuilder = new StringBuilder("");
		if (byteArr == null || byteArr.length <= 0) {
			return null;
		}
		
		for (int i = 0; i < byteArr.length; i++) {
			int v = byteArr[i] & 0xFF;
			String hv = Integer.toHexString(v);
			if (hv.length() < 2) {
				stringBuilder.append(0);
			}
			stringBuilder.append(hv);
		}
		return stringBuilder.toString();
	}
	
	/**
	 * 将16进制字符串转换成字节数组
	 * @param hexString
	 * @return
	 */
	public static byte[] hexString2byte(String hexString) {
		if (hexString == null || hexString.equals("")) {
			return null;
		}
		hexString = hexString.toUpperCase();
		int length = hexString.length() / 2;
		char[] hexChars = hexString.toCharArray();
		byte[] d = new byte[length];
		for (int i = 0; i < length; i++) {
			int pos = i * 2;
			d[i] = (byte) (char2Byte(hexChars[pos]) << 4 | char2Byte(hexChars[pos + 1]));
		}
		return d;
	}
	
	private static byte char2Byte(char c) {
		return (byte) "0123456789ABCDEF".indexOf(c);
	}
	
}
