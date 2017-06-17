package cfc.test.throwss;

/**
 * Created by fangchen.chai on 2017/6/17.
 */
public class Test {
    public static void main(String[] args) {
        System.out.println(method());
    }
    public static int method (){
        int ret = 0;
        try{
            throw new Exception();
        }
        catch(Exception e){
            ret = 1;
            return ret;
        }
        finally{
            ret = 2;
//            return ret;
        }
    }
}
