package cfc.test.forer;

import static java.lang.System.out;

public class LabelFor {

	public static void main(String[] args) {
		String str = "st";
		char s = 11112 ;
		System.out.println("s = " +s);
		int i = 0;
		outer:
			for (; true ;){
				inner:
					for (; i < 10 ; i++){
						out.println("i = " + i);
						if (i == 2){
							out.println("continue");
							continue;
						}
						if (i == 3){
							out.println("break");
							i++;
							break;
						}
						if (i == 7){
							out.println("continue outer");
							i++;
							continue outer;
						}
						if (i == 8){
							out.println("break outer");
							break outer;
						}
						for (int k = 0; k < 5 ; k++){
							if(k == 3){
								out.println("continue inner");
								continue inner;
							}
						}
					}
			}
		
		switch (s){
		case 's':
			System.out.println("str");
			break;
		default :
			System.out.println("default");
		
		}
	}
	
	
	

}
