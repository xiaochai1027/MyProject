package cfc.test.sort;

import java.util.Arrays;
import java.util.Random;

/**
 * Created by fangchen.chai on 2017/6/20.
 */
public class Heap {
    public static void main(String[] args) {
        int[] a = new int[10];
        System.out.println(Arrays.toString(a));
        Random random = new Random(48);
        for (int i = 0; i < a.length; i++) {
            int num = random.nextInt(10) + 1;
            minHeapAddNum(a, i, num);
        }

        System.out.println(Arrays.toString(a));

        //排序
        heapSort(a, a.length);

        System.out.println(Arrays.toString(a));

//        //把一个无序数组构建成堆
//        for (int i = 0; i < a.length; i++) {
//            int num = random.nextInt(10) + 1;
//            a[i] = num;
//        }
//        System.out.println(Arrays.toString(a));
//        makeHeap(a, a.length);
//        System.out.println(Arrays.toString(a));
    }

    public static void minHeapFixUp(int[] a, int i) {
        int temp = a[i];
        int j = (i - 1) / 2;
        while (j >=  0 && i != 0) {
            if (a[j] <= temp) {
                break;
            }
            a[i] = a[j];
            i = j;
            j = (i - 1) / 2;
        }
        a[i] = temp;
    }

    public static void minHeapAddNum(int[] a, int n, int num) {
        a[n] = num;
        minHeapFixUp(a, n);
    }

    public static void minHeapFixDown(int[] a, int n, int i) {
        int temp = a[i];
        int j = 2 * i + 1;
        while (j < n) {
            if (j + 1 < n && a[j + 1] < a[j]) {
                j++;
            }
            if (a[j] >= temp) {
                break;
            }
            a[i] = a[j];
            i = j;
            j = 2 * i + 1;

        }
        a[i] = temp;
    }

    public static void minHeapDelete(int[] a, int n) {
        int temp = a[0];
        a[0] = a[n - 1];
        a[n - 1] = temp;
        minHeapFixDown(a, n - 1, 0);

    }

    public static void makeHeap(int[] a, int n) {
        for (int i = n / 2 -1; i >=0; i--) {
            minHeapFixDown(a, n,i);
        }
    }

    public static void heapSort(int[] a, int n) {
        for (int i = n - 1; i > 0; i-- ) {
            int temp = a[0];
            a[0] = a[i];
            a[i] = temp;
            minHeapFixDown(a, i, 0);
        }
    }
}
