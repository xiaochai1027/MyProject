package cfc.test.collection;

import java.util.LinkedList;

import org.apache.poi.ss.formula.functions.T;

/**
 * Created by fangchen.chai on 2017/6/17.
 */
public class MyLinkedList {
    Node<T> first;
    Node<T> last;
    int size;

    private static class Node<T> {
        Node<T> prev;
        T item;
        Node<T> next;
        Node(Node<T> prev, T item, Node<T> next){
            this.prev = prev;
            this.item = item;
            this.next = next;
        }


    }
    void linkLast(T t) {
        final Node<T> l = last;
        Node<T> nowNode = new Node(l, t, null);
        if (l == null) {
            first = nowNode;
        } else {
            l.next = nowNode;
        }
    }

    public T removeFirst() {
        final Node<T> f = first;

        return (f == null) ? null : unlinkFirst(f);
    }

    public T removeLast() {
        final Node<T> l = last;
        return (l == null) ? null : unlinkLast(l);
    }

    public boolean add(T t) {

        linkLast(t);
        return true;
    }

    private T unlinkFirst(Node<T> f) {
        final T item = f.item;
        final Node<T> next = f.next;
        f.item = null;
        f.next = null;
        first = next;
        if (next == null) {
            last = null;
        } else {
            next.prev = null;
        }
        size--;
        return item;
    }

    private T unlinkLast(Node<T> l) {
        final T item = l.item;
        final Node<T> prev = l.prev;
        l.item = null;
        l.prev = null;
        if (prev == null) {
            first = null;
        } else {
            prev.next = null;
        }
        size--;
        return item;
    }

    Node<T> node(int index){

        if (index < (size >> 1)) {
            Node<T> n = first;
            for (int i = 0; i < index; i++) {
                n = first.next;
            }
            return n;
        } else {
            Node<T> n = last;
            for (int i = size - 1; i > index; i--) {
                n = last.prev;
            }
            return n;
        }
    }

    void linkBefore(T t, Node<T> n){
        Node<T> pred = n.prev;
        Node<T> newNode = new Node<>(pred, t, n);
        n.prev = newNode;
        if (pred == null) {
            first = newNode;
        } else {
            pred.next = newNode;
        }

    }

    public void add(int index, T t) {
        if (index == size) {
            linkLast(t);
        } else {
            linkBefore(t, node(index));
        }
    }

    public static void main(String[] args) {
        LinkedList<String> linkedList = new LinkedList();
        linkedList.add("1");
        linkedList.add("2");
        linkedList.add("3");
        linkedList.add("4");
        System.out.println(linkedList);
    }
}
