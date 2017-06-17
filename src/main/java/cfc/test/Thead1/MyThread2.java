package cfc.test.Thead1;

public class MyThread2 extends Thread{

	private Service service;
	
	public MyThread2(Service service1) {
		service = service1;
	}
	
	@Override
	public void run() {
		//service.service1();
		service.method("b", 2);
		System.out.println(Thread.currentThread().getName() + " "+service.getNum()+" "+service.getStr1());
		
	}
}
