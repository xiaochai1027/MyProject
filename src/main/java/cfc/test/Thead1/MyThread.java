package cfc.test.Thead1;

public class MyThread extends Thread{

	private Service service;
	
	public MyThread(Service service1) {
		service = service1;
	}
	
	@Override
	public void run() {
		//service.service1();
		try {
			Thread.sleep(100);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
//		service.method("a", 1);
		System.out.println(Thread.currentThread().getName() + " "+service.getNum()+" "+service.getStr1());
	}
}
