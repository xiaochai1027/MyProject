package cfc.test.Thead1;

public class Service {

	private  String str1= "1";
	
	private int num = 0;
	
	synchronized public void service1(){
		System.out.println("this is service1");
		service2();
		
	}
	
	synchronized public void service2(){
		System.out.println("this is service2");
		service3();
	}
	
	synchronized public void service3(){
		System.out.println("this is service3");
	}
	
	public void  method(String str, int num) {
		this.str1 = str;
		this.num = num;
	}

	public String getStr1() {
		return str1;
	}

	public void setStr1(String str1) {
		this.str1 = str1;
	}

	public int getNum(){

		return num;
	}

	public void setNum(int num) {
		this.num = num;
	}
	
	
}
