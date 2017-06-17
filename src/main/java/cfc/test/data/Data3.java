package cfc.test.data;

public class Data3 {

	public static void main(String[] args) {
		// TODO Auto-generated method stub

		float exFloat = 1.39e-43f;
		System.out.println(exFloat);
		exFloat = 1.39E-43f;
		System.out.println(exFloat);
		
		double expDouble = 47e47d -1;
		System.out.println(expDouble);
		
		expDouble = 47e47;
		System.out.println(expDouble);
		
		
		float fMax = Float.MAX_VALUE;
		float fMin = Float.MIN_VALUE;
		double d4 = Double.MAX_VALUE;
		System.out.println(fMax);
		System.out.println(fMin);
	}

}
