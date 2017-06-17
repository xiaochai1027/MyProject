package cfc.test.design.mode.singleton;

/**
 * Created by fangchen.chai on 2017/6/17.
 */
public class SingletonFast {

    private SingletonFast(){}

    private static class HolderClass{
        private static SingletonFast singleton = new SingletonFast();
    }
    public static SingletonFast getInstance(){
        return HolderClass.singleton;
    }
}
