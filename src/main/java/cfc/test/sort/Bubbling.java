package cfc.test.sort;

import java.util.Arrays;

/**
 * Created by fangchen.chai on 2017/6/17.
 * 冒泡
 */
public class Bubbling {

    public static void main(String[] args) {
        int [] a = {5,4,3,2,1};
        sort(a);
        System.out.println(Arrays.toString(a));
    }

    public static void sort(int[] a) {
        boolean flag = true;
        for (int i = 1; i < a.length && flag; i++) {
            flag = false;
            for (int j = 0; j < a.length - i; j++) {
                if (a[j] > a[j + 1]) {
                    int temp = a[j];
                    a[j] = a[j + 1];
                    a[j + 1] = temp;
                    flag = true;
                }
            }
        }
    }
}
