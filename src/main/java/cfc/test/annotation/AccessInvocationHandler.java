package cfc.test.annotation;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.security.AccessControlException;
import java.util.Arrays;

public class AccessInvocationHandler<T> implements InvocationHandler {
    final T accessObj;
    public AccessInvocationHandler(T accessObj) {
        this.accessObj = accessObj;
    }
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        RequiredRoles annotation = method.getAnnotation(RequiredRoles.class); //通过反射API获取注解
        if (annotation != null) {
            String[] roles = annotation.value();
            String role = "当前用用户角色";
            if (!Arrays.asList(roles).contains(role)) {
                throw new AccessControlException("The user is not allowed to invoke this method.");
            }
        }
        return method.invoke(accessObj, args);
    }
}
