package cfc.test.string;

import java.util.Calendar;

/**
 * Created by fangchen.chai on 2017/6/17.
 */
public class String1 {

    public static void main(String[] args) {
        String s1 = "Programming";
        String s2 = new String("Programming");
        String s3 = "Program" + "ming";
        System.out.println(s1 == s2);
        System.out.println(s1 == s3);
        System.out.println(s1 == s1.intern());

        System.out.println(reverse("123456789"));


    }

    public static String reverse(String originStr) {
        if(originStr == null || originStr.length() <= 1)
        return originStr;
        String str1 = originStr.substring(1);
        char str2 = originStr.charAt(0);
        String str3 = reverse(str1) + str2;
        return str3;
        }
}
