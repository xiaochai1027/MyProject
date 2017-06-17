package cfc.test.stack;

import java.util.Arrays;
import java.util.EmptyStackException;

/**
 * Created by fangchen.chai on 2017/6/17.
 */
public class MyStack<T> {
    private T[] elements;
    private int size = 0;

    private static final int INIT_CAPACITY = 1;

    public MyStack() {
        elements = (T[]) new Object[INIT_CAPACITY];
    }

    public void push(T elem) {
        ensureCapacity();
        elements[size++] = elem;
    }

    public T pop() {
        if(size == 0)
            throw new EmptyStackException();
        T t = elements[--size];
        elements[size] = null;
        return t;
//        return elements[--size];
    }

    private void ensureCapacity() {
        if(elements.length == size) {
            elements = Arrays.copyOf(elements, 2 * size + 1);
        }
    }

    @Override
    public String toString() {
        return "MyStack{" +
                "elements=" + Arrays.toString(elements) +
                ", size=" + size +
                '}';
    }

    public static void main(String[] args) {
        MyStack<String> myStack = new MyStack<>();
        myStack.push("1");
        myStack.push("2");
        System.out.println(myStack);
        System.out.println(myStack.pop());
        myStack.push("3");
        System.out.println(myStack);

    }
}
