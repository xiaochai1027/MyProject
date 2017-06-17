package cfc.data;

public class Data2 {

	public static void main(String[] args) {
		// TODO Auto-generated method stub

		int data1 = 0170000000;
		int octal = 010;
		int maxInt = -Integer.MAX_VALUE +(-2147483647);
		long dataL = 9223372036854775807L;
		Long maxLong = (Long.MAX_VALUE+1)+(Long.MAX_VALUE+1);
		System.out.println(Integer.toBinaryString(data1));
		System.out.println(data1);
		System.out.println(dataL);
		System.out.println(Long.toBinaryString(dataL).length());
		System.out.println(Long.toBinaryString(maxLong).length());
		System.out.println(Integer.toOctalString(16));
		System.out.println(octal == 8);
		System.out.println(maxLong);
		
		System.out.println("maxInt :"+maxInt);
	}

}
