package cfc.log;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Log {
    private Logger logger = LoggerFactory.getLogger(Log.class);

    public static Log getLog(String name) {
        Logger log = LoggerFactory.getLogger(name);

        return new Log(log);
    }

    public static Log getLog(Class<?> clazz) {
        Logger log = LoggerFactory.getLogger(clazz);

        return new Log(log);
    }

    private Log(Logger log) {
        logger = log;
    }

    public boolean isTraceEnabled() {
        return logger.isTraceEnabled();
    }

    public void trace(String format, Object... args) {
        logger.trace(format, args);
    }

    public boolean isDebugEnabled() {
        return logger.isDebugEnabled();
    }

    public void debug(String format, Object... args) {
        logger.debug(format, args);
    }

    public boolean isInfoEnabled() {
        return logger.isInfoEnabled();
    }

    public void info(String format, Object... args) {
        logger.info(format, args);
    }

    public boolean isWarnEnabled() {
        return logger.isWarnEnabled();
    }

    public void warn(String format, Object... args) {
        logger.warn(format, args);
    }

    public boolean isErrorEnabled() {
        return logger.isErrorEnabled();
    }

    public void error(String format, Object... args) {
        logger.error(format, args);
    }

    public void error(String message, Throwable t) {
        logger.error(message, t);
    }
}
