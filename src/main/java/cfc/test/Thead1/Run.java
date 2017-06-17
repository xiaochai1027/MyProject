package cfc.test.Thead1;

import cfc.test.data.Data1;

public class Run {

	public static void main(String[] args) {
		Service service = new Service();
		Service service2 = new Service();
		MyThread myThread = new MyThread(service);
		MyThread2 myThread2 = new MyThread2(service2);
		myThread.start();
		myThread2.start();
		Data1 data = new Data1();
		data.method(1,2);

	}

}
