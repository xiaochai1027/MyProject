package cfc.test.sort;

import java.util.Arrays;

/**
 * Created by fangchen.chai on 2017/6/19.
 */
public class QuickSort {

    public static void main(String[] args) {
        int[] a = {10, 9, 8, 7, 6, 5, 4, 3, 21};
        quickSort(a,0,a.length - 1);
        System.out.println(Arrays.toString(a));
    }


    public static void quickSort(int[] a, int l, int r) {
        if (l < r) {
            int index = adjust(a, l, r);
            quickSort(a, index + 1, r);
            quickSort(a, l, index - 1);
        }
    }

    public static int adjust(int[] a, int l, int r) {
        int i = l;
        int j = r;
        int x = a[i];

        while (i < j) {
            while (i < j && a[j] >= x) {
                j--;
            }
            if (i < j) {
                a[i] = a[j];
                i++;
            }
            while (i < j && a[i] < x) {
                i++;
            }
            if (i < j) {
                a[j] = a[i];
                j--;
            }
        }
        a[i] = x;
        return i;

    }
}
