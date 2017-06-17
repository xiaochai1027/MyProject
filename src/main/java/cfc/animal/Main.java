package cfc.animal;

public class Main {

	public static void main(String [] args){
		Dog xx = new Dog();
		Dog yy = new Dog();
		xx.name = "spot";
		xx.says = "ruff";
		yy.name = "ruby";
		yy.says = "shasha";
		xx = yy;
		System.out.println(xx == yy);
		
	}
}
