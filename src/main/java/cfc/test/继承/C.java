package cfc.test.继承;

public class C {

	public B b = new B();
	 C(){
		 System.out.println("init C" + this.hashCode());
	 }
}
