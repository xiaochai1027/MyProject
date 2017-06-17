package cfc.test.继承;

public class test {

	public static void main(String[] args) {
		// TODO Auto-generated method stub

		C c= new C();
		A a = new A();
		A a2 = new A();
		System.out.println(a);
		System.out.println(a2.getClass().getSuperclass());
	
	}

}
