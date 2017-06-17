package cfc.test.design.mode.singleton;

/**
 * Created by fangchen.chai on 2017/6/17.
 */
public class SingletonHungry {
    private static SingletonHungry singletonHungry = new SingletonHungry();

    private SingletonHungry() {}

    public static SingletonHungry getSingletonHungry() {
        return singletonHungry;
    }
}
