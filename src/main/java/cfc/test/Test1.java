package cfc.test;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by fangchen.chai on 2017/6/19.
 */
public class Test1 {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        String str = "1";
        list.add("a");
        operate(list, str);
        for (int i=0; i<list.size(); i++) {
            System.out.print(list.get(i));
        }
        System.out.println(str);
    }
    public static void operate(List<String> list, String str) {
        String str2 = str.replace("1", "2");
        list.add("b");
        list = new ArrayList<>();
        list.add("c");
    }
}
