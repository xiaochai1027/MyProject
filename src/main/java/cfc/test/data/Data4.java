package cfc.test.data;

public class Data4 {

	public static void main(String [] args){
		System.out.println("1 & 1 ="+(1 & 1));
		System.out.println("1 | 1 ="+(1 | 1));
		System.out.println("1 ^ 1 ="+(1 ^ 1));
		System.out.println("~ 1   ="+(~1));
		System.out.println(Integer.toBinaryString(-2));
		System.out.println("true & true = "+(true & true));
		System.out.println("true | true = "+(true | true));
		System.out.println("true ^ true = "+(true ^ true));
		System.out.println("~~~~~~~~~~~~~~~~~~~~~~~~~");
		System.out.println("1 & 0 ="+(1 & 0));
		System.out.println("1 | 0 ="+(1 | 0));
		System.out.println("1 ^ 0 ="+(1 ^ 0));
		System.out.println("~ 0   ="+(~0));
		System.out.println(Integer.toBinaryString(-1));
		System.out.println("true & false = "+(true & false));
		System.out.println("true | false = "+(true | false));
		System.out.println("true ^ false = "+(true ^ false));
		System.out.println("~~~~~~~~~~~~~~~~~~~~~~~~~");
		System.out.println("0 & 0 ="+(0 & 0));
		System.out.println("0 | 0 ="+(0 | 0));
		System.out.println("0 ^ 0 ="+(0 ^ 0));
		System.out.println("~ 0   ="+(~0));
		System.out.println(Integer.toBinaryString(0));
		System.out.println("false & false = "+(false & false));
		System.out.println("false | false = "+(false | false));
		System.out.println("false ^ false = "+(false ^ false));
		System.out.println("----------------------------");
	}
}
