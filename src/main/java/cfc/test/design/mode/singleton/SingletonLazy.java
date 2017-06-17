package cfc.test.design.mode.singleton;

/**
 * Created by fangchen.chai on 2017/6/17.
 */
public class SingletonLazy {
    private static SingletonLazy singletonLazy = null;

    private SingletonLazy(){}

    public static SingletonLazy getSingletonLazy() {
        if (singletonLazy == null) {
            synchronized (SingletonLazy.class) {
                if (singletonLazy == null) {
                    singletonLazy = new SingletonLazy();
                }
            }
        }
        return singletonLazy;
    }
}
