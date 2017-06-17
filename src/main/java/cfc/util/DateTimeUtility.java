package cfc.util;

import java.io.File;
import java.math.BigDecimal;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.TimeUnit;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.time.DateUtils;

public class DateTimeUtility {
    
    private static ThreadLocal<Map<DateFormatType, DateFormat>> dateFormats = new ThreadLocal<Map<DateFormatType, DateFormat>>();   
    
    public static final long MINUTE = TimeUnit.MINUTES.toMillis(1);
    public static final long DAY = TimeUnit.DAYS.toMillis(1);
    
    static enum DateFormatType {
        
    	YYYYMMDDHHMMSS_NOSPACE("yyyyMMddHHmmss"),	// 20091227091010
        YYYYMMDDHHMMSS("yyyy-MM-dd HH:mm:ss"),
        YYYYMMDDHHMM("yyyy-MM-dd HH:mm"),
        YYYYMMDD("yyyy-MM-dd"),
        YYYYMMDD_NOSPACE("yyyyMMdd"),
        YYYYMM("yyyy年MM月"),
        YYYYMM_SEPARATOR("yyyy-MM"),
        DDHHMMSS("ddHHmmss"),
        MMDDHHMM("MM-dd HH:mm"),
        HHMMSS("HH:mm:ss"),
        HHMM("HH:mm");

        private String pattern;
        
        DateFormatType(String pattern) {
            this.pattern = pattern;
        }

        public String getPattern() {
            return pattern;
        }

        public void setPattern(String pattern) {
            this.pattern = pattern;
        }               
    }
    
    public static final long ONE_MINUTE = TimeUnit.MINUTES.toMillis(1);
    
    public static final Comparator<Date> DATE_COMPARATOR_ASC = new Comparator<Date>() {
		@Override
		public int compare(Date o1, Date o2) {
			return o1.compareTo(o2);
		}
    };
    
    public static final Comparator<Date> DATE_COMPARATOR_DESC = new Comparator<Date>() {
		@Override
		public int compare(Date o1, Date o2) {
			return o2.compareTo(o1);
		}
    };
    
    private static DateFormat getDateFormat(DateFormatType dateFormatType) {
        Map<DateFormatType, DateFormat> dateFormatMap = dateFormats.get();
        
        if (dateFormatMap == null) {
            dateFormatMap = new HashMap<DateFormatType, DateFormat>();
            dateFormats.set(dateFormatMap);
        }
        
        DateFormat dateFormat = dateFormatMap.get(dateFormatType);
        
        if (dateFormat == null) {
            dateFormat = new SimpleDateFormat(dateFormatType.getPattern());
            dateFormatMap.put(dateFormatType, dateFormat);
        }
        
        return dateFormat;
    }

    // 将时间按配置的格式转换为String
    public static String formatYYYYMMDDHHMMSS(Date date) {
        if (date == null) {
            return "";
        }
        
        return getDateFormat(DateFormatType.YYYYMMDDHHMMSS).format(date);
    }
    
    public static String formatYYYYMM(Date date) {
        if (date == null) {
            return "";
        }
        
        return getDateFormat(DateFormatType.YYYYMM).format(date);
    }
    
    public static String formatYYYYMM_SEPARATOR(Date date) {
        if (date == null) {
            return "";
        }
        
        return getDateFormat(DateFormatType.YYYYMM_SEPARATOR).format(date);
    }
    
    public static String formatNoSpaceYYYYMMDD(Date date){
        if (date == null) {
            return "";
        }
        
        return getDateFormat(DateFormatType.YYYYMMDD_NOSPACE).format(date);
    }
    
    public static String formatYYYYMMDDHHMMSS(Calendar cal) {
        if (cal == null) {
            return null;
        }

        return formatYYYYMMDDHHMMSS(cal.getTime());
    }
    
    public static String formatYYYYMMDDHHMM(Date date) {
        if (date == null) {
            return "";
        }
        
        return getDateFormat(DateFormatType.YYYYMMDDHHMM).format(date);
    }
    
    public static String formatYYYYMMDD(Date date) {
        if (date == null) {
            return "";
        }
        
        return getDateFormat(DateFormatType.YYYYMMDD).format(date);
    }
  
    public static String formatYYYYMMDD(Calendar cal) {
    	if (cal == null) {
            return "";
        }

        return formatYYYYMMDD(cal.getTime());
    }
    
    public static String formatDDHHMMSS(Date date) {
        if (date == null) {
            return "";
        }
        
        return getDateFormat(DateFormatType.DDHHMMSS).format(date);
    }
    
    public static String formatMMDDHHMM(Date date) {
        if (date == null) {
            return "";
        }
        
        return getDateFormat(DateFormatType.MMDDHHMM).format(date);
    }
    
    public static String formatHHMM(Date date) {
        if (date == null) {
            return "";
        }
        
        return getDateFormat(DateFormatType.HHMM).format(date);
    }
    
    public static String formatHHMMSS(Date date) {
    	if (date == null) {
    		return "";
    	}
    	
    	return getDateFormat(DateFormatType.HHMMSS).format(date);
    }
    
    public static String formatHHMM(Calendar cal) {
        if (cal == null) {
            return null;
        }

        return formatHHMM(cal.getTime());
    }

    /**
	 * 将描述转成 00:00:00字符串
	 * 
	 * @param second 秒
	 * @return
	 */
	public static String formatHHMMSS(long millisecond) {
		
		int second = (int) (millisecond / 1000);
		
		int hour = second / (60 * 60);
		// 剩余的分
		int minuteLeft = second - hour * 60 * 60;
		
		int minute = minuteLeft / 60;
		
		int secondTemp = minuteLeft % 60;
		
		String hourStr = String.valueOf(hour);
		if (hourStr.length() == 1) {
			hourStr = "0" + hourStr;
		}
		
		String minuteStr = String.valueOf(minute);
		if (minuteStr.length() == 1) {
			minuteStr = "0" + minuteStr;
		}
		
		String secondStr = String.valueOf(secondTemp);
		if (secondStr.length() == 1) {
			secondStr = "0" + secondStr;
		}
		
		return hourStr + ":" + minuteStr + ":" + secondStr;
	}
	
	/**
	 * parse unix timestamp to the format like 00:00:00
	 * @param seconds
	 * @return
	 */
	public static String parseUnixTimeStampToHHMMSSFromat(int seconds) {
		return formatHHMMSS(seconds * 1000L);
	}
	
    // 将时间String转换为Date对象
    public static Date parseNoSpaceYYYYMMDDHHMMSS(String date) throws ParseException {
        if (date == null) {
            return null;
        }
        
        return getDateFormat(DateFormatType.YYYYMMDDHHMMSS_NOSPACE).parse(date);
    }
    
    public static Date parseYYYYMMDDHHMMSS(String date) throws ParseException {
        if (date == null || StringUtils.isBlank(date)) {
            return null;
        }
        
        return getDateFormat(DateFormatType.YYYYMMDDHHMMSS).parse(date);
    }
    
    public static Date parseYYYYMMDDHHMM(String date) throws ParseException {
        if (date == null) {
            return null;
        }
        
        return getDateFormat(DateFormatType.YYYYMMDDHHMM).parse(date);
    }
        
    public static Date parseYYYYMMDD(String date) throws ParseException {
        if (date == null) {
            return null;
        }
        
        return getDateFormat(DateFormatType.YYYYMMDD).parse(date);
    }
    
    public static Date parseYYYYMM_SEPARATOR(String date) throws ParseException{
    	if(date == null){
    		return null;
    	}
    	
    	return getDateFormat(DateFormatType.YYYYMM_SEPARATOR).parse(date);
    }
    
    public static Date parseHHMM(String date) throws ParseException {
    	if (date == null) {
            return null;
        }
        
        return getDateFormat(DateFormatType.HHMM).parse(date);
    }
    
    public static Date parseHHMMSS(String date) throws ParseException {
    	if (date == null) {
            return null;
        }
        
        return getDateFormat(DateFormatType.HHMMSS).parse(date);
    }
    
    /**
     * @param time - 传入一个时间
     * @return - 将传入时间的日期改为今天后返回
     */
    public static Calendar getTodayTime(Date time) {
    	Calendar cal = Calendar.getInstance();
		cal.setTime(time);
		
		Calendar today = Calendar.getInstance();
		
		today.set(Calendar.HOUR_OF_DAY, cal.get(Calendar.HOUR_OF_DAY));
		today.set(Calendar.MINUTE, cal.get(Calendar.MINUTE));
		
		return today;
    }
    
    public static Date getDateFromYYYYMMDD(Date date) throws ParseException {
    	String resStr = getDateFormat(DateFormatType.YYYYMMDD).format(date);
    	return parseYYYYMMDD(resStr);
    }
    
    public static Date getYesterDayFromYYYYMMDD(Date date) throws ParseException {
    	Date yesterDate = addDays(date, -1);
    	return getDateFromYYYYMMDD(yesterDate);
    }
    
    public static Date getTomorrowFromYYYYMMDD(Date date) throws ParseException {
    	Date tommorwDate = addDays(date, 1);
    	return getDateFromYYYYMMDD(tommorwDate);
    }
    
    public static Calendar getDateTime(Date date, Date time) {
    	Calendar cal = Calendar.getInstance();
		cal.setTime(time);
		
		Calendar day = Calendar.getInstance();
		day.setTime(date);
		
		day.set(Calendar.HOUR_OF_DAY, cal.get(Calendar.HOUR_OF_DAY));
		day.set(Calendar.MINUTE, cal.get(Calendar.MINUTE));
		
		return day;
    }
    
    /**
     * @param time - 传入一个时间
     * @return - 将传入时间的日期改为今天后返回
     */
    public static Calendar getTodayTime(Calendar time) {        
        Calendar today = Calendar.getInstance();
        
        today.set(Calendar.HOUR_OF_DAY, time.get(Calendar.HOUR_OF_DAY));
        today.set(Calendar.MINUTE, time.get(Calendar.MINUTE));
        
        return today;
    }
    
    /**
     * 获取参数time加上days天之后的日期
     * 参数days可以为负数
     * @param time 
     * @param days 正数为给参数time加days,负数为给参数time减days
     * @return
     */
    public static Date getDayTime(Date time, int days) {
    	Calendar day = Calendar.getInstance();
    	day.setTime(time);
		
    	day.add(Calendar.DAY_OF_YEAR, days);
		
		return day.getTime();
    }
    
    /**
     * 返回明天的日期
     * @return
     */
    public static Date getTomorrowDate() {
    	return getDayTime(new Date(), 1);
    }
    
    /**
     * 获取所在时间的下一个月
     */
    public static Date getNextMonth(Date now) {
    	return getNextMonth(now, 1);
    }
    
    public static Date getNextMonth(Date now, int n) {
    	Calendar c = Calendar.getInstance();
    	c.setTime(now);
    	c.add(Calendar.MONTH, n);
    	return c.getTime();
    }
    
    /**
     * @param time - 传入一个时间
     * @return - 将传入时间的日期改为明天后返回
     */
    public static Calendar getTomorrowTime(Date date) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        
        Calendar tomorrow = Calendar.getInstance();
        
        tomorrow.add(Calendar.DAY_OF_YEAR, 1);
        tomorrow.set(Calendar.HOUR_OF_DAY, cal.get(Calendar.HOUR_OF_DAY));
        tomorrow.set(Calendar.MINUTE, cal.get(Calendar.MINUTE));
        
        return tomorrow;
    }
    
    /**
     * @param date - 传入一个时间
     * @return - 返回将传入时间日期加一天的时间
     */
    public static Calendar getNextDayTime(Date date) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        cal.add(Calendar.DAY_OF_YEAR, 1);
        return cal;
    }
    
    public static Date minusMinutes(Date date, int minutes) {
    	Calendar cal = Calendar.getInstance();
    	cal.setTime(date);
    	cal.add(Calendar.MINUTE, -minutes);
    	
    	return cal.getTime();
    }
    
    /**
     * @Description: 计算提前一定分钟数的时间
     * @param date	基础时间
     * @param minutes	提前分钟数
     * @param notEarlierThan	结果不早于该时间，如果为null则不限制
     * @return
     */
    public static Date minusMinutesNotEarlierThan(Date date, int minutes, Date notEarlierThan) {
    	Date result = minusMinutes(date, minutes);
    	
    	if (notEarlierThan != null && result.before(notEarlierThan)) {
    		return notEarlierThan;
    	}
    	
    	return result;
    }
    
    public static Date minusMinutesNotLaterThan(Date date, int minutes, Date notLaterThan) {
    	Date result = minusMinutes(date, minutes);
    	
    	if (notLaterThan != null && result.after(notLaterThan)) {
    		return notLaterThan;
    	}
    	
    	return result;
    }
    
    /**
     * @param date 传入一个时间
     * @param days 在date时间基础上进行增加or减少的天数
     * @return
     */
    public static Date addDays(Date date, int days) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        cal.add(Calendar.DATE, days);
        
        return cal.getTime();
    }
    
    /**
     * @param date 传入一个时间
     * @param months 在date时间基础上进行增加or减少的月份
     * @return
     */
    public static Date addMonths(Date date, int months) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        cal.add(Calendar.MONTH, months);
        
        return cal.getTime();
    }
    
    /**
     * @param date - 传入一个时间
     * @param hours - 传入分钟数，可以为负数
     * @return - 返回 date + hours 的新时间
     */
    public static Date addHours(Date date, int hours) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        cal.add(Calendar.HOUR, hours);
        
        return cal.getTime();
    }
    
    /**
     * @param date - 传入一个时间
     * @param minutes - 传入分钟数，可以为负数
     * @return - 返回 date + minutes的新时间
     */
    public static Date addMinutes(Date date, int minutes) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        cal.add(Calendar.MINUTE, minutes);
        
        return cal.getTime();
    }
    
    /**
     * 在传入时间的基础上添加秒
     * 
     * @param date 时间
     * @param seconds 秒
     * @return
     */
    public static Date addSeconds(Date date, int seconds) {
    	Calendar cal = Calendar.getInstance();
    	cal.setTime(date);
    	cal.add(Calendar.SECOND, seconds);
    	
    	return cal.getTime();
    }
    
    /**
	 * 将cal增加increasement分钟，但是不超过cal所代表的日期
	 * @param cal
	 * @param increasement
	 */
	public static void addMinutesWithinTheDay(Calendar cal, int increasement) {
	    int hour = cal.get(Calendar.HOUR_OF_DAY);
        int minute = cal.get(Calendar.MINUTE);
        
        if ((hour  * 60 + minute + increasement) >= (24 * 60)) {
            // Set to the max time of the day
            cal.set(Calendar.HOUR_OF_DAY, 23);
            cal.set(Calendar.MINUTE, 59);
        } else {
            cal.add(Calendar.MINUTE, increasement);
        }
    }
	
	private static Date getMinTimeOfHour(Date date) {
		if (date == null) {
			return null;
		}
		
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(date);
		calendar.set(Calendar.MINUTE, calendar.getActualMinimum(Calendar.MINUTE));
		calendar.set(Calendar.SECOND, calendar.getActualMinimum(Calendar.SECOND));
		calendar.set(Calendar.MILLISECOND, calendar.getActualMinimum(Calendar.MILLISECOND));
		
		return calendar.getTime();
	}
	
	/**
	 * @param date - 传入一个时间
	 * @return - 返回这个时间所在日期的最小时间
	 */
	public static Date getMinTimeOfDay(Date date) {
		if (date == null) {
			return null;
		}
		
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(getMinTimeOfHour(date));
		calendar.set(Calendar.HOUR_OF_DAY, calendar.getActualMinimum(Calendar.HOUR_OF_DAY));
		
		return calendar.getTime();
	}
	
	private static Date getMaxTimeOfHour(Date date) {
        if (date == null) {
            return null;
        }
        
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.MINUTE, calendar.getActualMaximum(Calendar.MINUTE));
        calendar.set(Calendar.SECOND, calendar.getActualMaximum(Calendar.SECOND));
        calendar.set(Calendar.MILLISECOND, calendar.getActualMaximum(Calendar.MILLISECOND));
        
        return calendar.getTime();
    }
    
	/**
	 * @param date - 传入一个时间
	 * @return - 返回这个时间所在日期的最大时间
	 */
    public static Date getMaxTimeOfDay(Date date) {
        if (date == null) {
            return null;
        }
        
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.HOUR_OF_DAY, calendar.getActualMaximum(Calendar.HOUR_OF_DAY));
        calendar.setTime(getMaxTimeOfHour(calendar.getTime()));
        
        return calendar.getTime();
    }

    /**
	 * @return - 返回昨天的最小时间
	 */
	public static Date getMinTimeOfYesterday() {
		Date date = new Date();
		
		date = DateUtils.addDays(date, -1);	
		
		return getMinTimeOfDay(date);
	}
	
	/**
     * @return - 返回今天是一周的第几天，周一是第1天，周日是第7天
     */
    public static int getDayOfWeek() {
    	Calendar cal = Calendar.getInstance();
    	
    	int day = cal.get(Calendar.DAY_OF_WEEK) - 1;
    	
    	if (day == 0) {
    		day = 7;
    	}
    	
    	return day;
    }
    
    /**
     * @return - 返回昨天是一周的第几天，周一是第1天，周日是第7天
     */
    public static int getYesterdayOfWeek() {
        Calendar cal = Calendar.getInstance();
        
        // Get yesterday
        cal.add(Calendar.DAY_OF_WEEK, -1);
        
        int day = cal.get(Calendar.DAY_OF_WEEK) - 1;
        
        if (day == 0) {
            day = 7;
        }
        
        return day;
    }
    
    /**
     * @return - 返明天是一周的第几天，周一是第1天，周日是第7天
     */
    public static int getTomorrowOfWeek() {
        Calendar cal = Calendar.getInstance();
        
        // Get Tomorrow
        cal.add(Calendar.DAY_OF_WEEK, 1);
        
        int day = cal.get(Calendar.DAY_OF_WEEK) - 1;
        
        if (day == 0) {
            day = 7;
        }
        
        return day;
    }


    /**
     * 判断今天是否是周末
     * @return
     */
    public static boolean isWeekendDay() {
    	
    	Calendar cal = Calendar.getInstance();
        int day = cal.get(Calendar.DAY_OF_WEEK);
        
        if (day == Calendar.SATURDAY || day == Calendar.SUNDAY) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 判断今天是否是周六
     * @return
     */
    public static boolean isSaturday() {
    	
    	Calendar cal = Calendar.getInstance();
        int day = cal.get(Calendar.DAY_OF_WEEK);
        
        if (day == Calendar.SATURDAY) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 判断今天是否是周日
     * @return
     */
    public static boolean isSunday() {
    	
    	Calendar cal = Calendar.getInstance();
        int day = cal.get(Calendar.DAY_OF_WEEK);
        
        if (day == Calendar.SUNDAY) {
            return true;
        }
        
        return false;
    }
    /**
     * 判断日期是否是当月的第一天
     * @param date
     * @return
     */
    
    public static boolean isTheFirstDayOfMonth(Date date) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(date);
		int day = cal.get(Calendar.DAY_OF_MONTH);
		return (day == 1);
	}
    
    /**
     * 判断今天是每月的五号
     * @return
     */
    public static boolean isTheFifthDayOfMonth() {
    	
    	Calendar cal = Calendar.getInstance();
        int day = cal.get(Calendar.DAY_OF_MONTH);
        
        if (day == 5) {
            return true;
        }
        
        return false;
    }

    /**
     * 判断今天是否是周五
     * @return
     */
    public static boolean isFriday() {
    	
    	Calendar cal = Calendar.getInstance();
        int day = cal.get(Calendar.DAY_OF_WEEK);
        
        if (day == Calendar.FRIDAY) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 判断今天是否是周一
     * @return
     */
    public static boolean isMonday() {
    	Calendar cal = Calendar.getInstance();
        int day = cal.get(Calendar.DAY_OF_WEEK);
        return day == Calendar.MONDAY;
    }
    /**
     * 判断日期是否是上个考勤周期
     */
    public static boolean isLastAttendance(Date date) {
		Calendar calendar = Calendar.getInstance();
		Date currentTime = calendar.getTime();
		int dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH);
		
		Date firstDayOfThisMonth = DateTimeUtility.getFirstDayOfMonth(currentTime);
		int attendanceEndDayOfMonth = 5;
		//5号之后（包括5号），上个月之前（包括上个月）的销假或请假不生效
		if (dayOfMonth >= attendanceEndDayOfMonth
				&& date.before(firstDayOfThisMonth)) {
			return true;
		}
		return false;
    }
    
    /**
     * 判断两个Date是否同月
     * @return
     */
    public static boolean isTheSameMonth(Date month1, Date month2) {
    	
    	if(month1 == null || month2 == null) {
    		return false;
    	}
    	
    	String monthStr1 = formatYYYYMM(month1);
    	String monthStr2 = formatYYYYMM(month2);
        return monthStr1.equals(monthStr2);
    }
    
    /**
     * @param calendar
     * @return - 返回calendar所在周的周一
     */
    public static Date getMondayOfWeek(Calendar calendar) {
		Calendar calendarNew = Calendar.getInstance();
		calendarNew.setTime(calendar.getTime());
		
		int curDay = calendarNew.get(Calendar.DAY_OF_WEEK);				
		
		if (curDay == Calendar.SUNDAY) {
			calendarNew.add(Calendar.DATE, -6);
		} else {
			calendarNew.add(Calendar.DATE, 2 - curDay);
		}
		
		return calendarNew.getTime();
	}
    
    
	/**
	 *  返回下周一的日期
	 * @return
	 */
	public static Date getMondayOfNextWeek() {
		
		Calendar calendar = Calendar.getInstance();
		
		int dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK);				
		
		if (dayOfWeek == Calendar.SUNDAY) {
			calendar.add(Calendar.DATE, 1);
		} else {
			calendar.add(Calendar.DATE, 9 - dayOfWeek);
		}
		
		return calendar.getTime();
		
	}

	
	/**
	 * @param date 需要设置的时间
	 * @return 将传入时间的日期改为下周一后返回
	 */
	public static Date getMondayOfNextWeek(Date date) {
		
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(date);
		
		Calendar mondayOfNextWeek = Calendar.getInstance();
		mondayOfNextWeek.setTime(getMondayOfNextWeek());
		 
		mondayOfNextWeek.set(Calendar.HOUR_OF_DAY, calendar.get(Calendar.HOUR_OF_DAY));
		mondayOfNextWeek.set(Calendar.MINUTE, calendar.get(Calendar.MINUTE));
		
		return mondayOfNextWeek.getTime();
	}
	
    /**
     * @param calendar
     * @return - 返回calendar所在周的周日
     */
	public static Date getSundayOfWeek(Calendar calendar) {
		Calendar calendarNew = Calendar.getInstance();
		calendarNew.setTime(calendar.getTime());
		
		int curDay = calendarNew.get(Calendar.DAY_OF_WEEK);
		
		if (curDay != Calendar.SUNDAY) {
			calendarNew.add(Calendar.DATE, 8 - curDay);
		} 		
		
		return calendarNew.getTime();
	}

	/**
     * @param calendar
     * @return - 返回calendar所在月的第一天
     */
	public static Calendar getFirstDayOfMonth(Calendar calendar) {
		Calendar calendarNew = Calendar.getInstance();
		calendarNew.setTime(calendar.getTime());
		calendarNew.set(Calendar.DAY_OF_MONTH, calendarNew.getActualMinimum(Calendar.DAY_OF_MONTH));     
		return calendarNew;
	}

	/**
     * @param calendar
     * @return - 返回calendar所在月的最后一天
     */
	public static Calendar getLastDayOfMonth(Calendar calendar) {
		Calendar calendarNew = Calendar.getInstance();
		calendarNew.setTime(calendar.getTime());
		calendarNew.set(Calendar.DAY_OF_MONTH, calendarNew.getActualMaximum(Calendar.DAY_OF_MONTH)); 
		return calendarNew;
	}
    /**
     * 返回某天距离当月月末的天数
     */
	public static int getDaysToMonthEnd(Date date) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(date);
		long time1 = calendar.getTimeInMillis();
		calendar.set(Calendar.DAY_OF_MONTH, calendar.getActualMaximum(Calendar.DAY_OF_MONTH));
		long time2 = calendar.getTimeInMillis();
		int betweenDays = (int) ((time2 - time1)/(1000 * 3600 * 24));
		return betweenDays + 1;
	}
	
	 /**
     * 返回某天距离当月月初的天数
     */
	public static int getDaysToMonthBegin(Date date) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(date);
		long time1 = calendar.getTimeInMillis();
		calendar.set(Calendar.DAY_OF_MONTH, calendar.getActualMinimum(Calendar.DAY_OF_MONTH));
		long time2 = calendar.getTimeInMillis();
		int betweenDays = (int) ((time1 - time2)/(1000 * 3600 * 24));
		return betweenDays + 1;
	}
	
	/**
	 * @param availableDays - "YYYYNNN"，分别表示周一到周日
	 * @return - 如果今日为'Y'就返回true，否则返回false
	 */
    public static boolean isTodayAvailableDay(String availableDays) {
    	int day = getDayOfWeek();
    	String available = availableDays.substring(day - 1, day);
    	if ("N".equals(available.toUpperCase())) {
    		return false;
    	}

        return true;
    }
	
    
	/**
	 * @param availableDays - "YYYYNNN"，分别表示周一到周日
	 * @return - 如果今日为'Y'就返回true，否则返回false
	 */
    public static boolean isTomorrowAvailableDay(String availableDays) {
    	int tomorrow = getTomorrowOfWeek();
    	String available = availableDays.substring(tomorrow - 1, tomorrow);
    	if ("N".equals(available.toUpperCase())) {
    		return false;
    	}

        return true;
    }
    
    private static int hourMinuteToInt(Calendar calendar) {
    	return calendar.get(Calendar.HOUR_OF_DAY) * 100 + calendar.get(Calendar.MINUTE);
    }
    
    private static int hourMinuteToInt(Date date) {
    	Calendar calendar = Calendar.getInstance();
    	calendar.setTime(date);
    	
    	return hourMinuteToInt(calendar);
    }
    
    /**
     * @param first
     * @param second
     * @return - 只比较小时和分钟，不比较其他字段
     */
	public static boolean hourMinuteBefore(Calendar first, Calendar second) {
		return hourMinuteToInt(first) < hourMinuteToInt(second);
	}
	
	/**
     * @param first
     * @param second
     * @return - 只比较小时和分钟，不比较其他字段
     */
	public static boolean hourMinuteBefore(Date first, Date second) {
		return hourMinuteToInt(first) < hourMinuteToInt(second);        
    }
	
	public static boolean hourMinuteNotAfter(Date first, Date second) {
		return hourMinuteToInt(first) <= hourMinuteToInt(second);        
    }
	
	/**
     * @param first
     * @param second
     * @return - 只比较小时和分钟，不比较其他字段
     */
	public static boolean hourMinuteAfter(Calendar first, Calendar second) {
		return !hourMinuteBefore(first, second);
	}
	
	/**
     * @param first
     * @param second
     * @return - 只比较小时和分钟，不比较其他字段
     */
	public static boolean hourMinuteAfter(Date first, Date second) {
		return !hourMinuteBefore(first, second);
	}
	
	/**
     * @param first
     * @param second
     * @return - 只比较小时和分钟，不比较其他字段
     */
	public static boolean hourMinuteEqual(Calendar first, Calendar second) {
		return hourMinuteToInt(first) == hourMinuteToInt(second);
	}
	
	/**
	 * @param time
	 * @param from
	 * @param to
	 * @return - 只比较小时和分钟，不比较其他字段
	 */
	public static boolean hourMinuteBetween(String time, Calendar from, Calendar to) {
		Calendar cal = getTodayFromHHMM(time);
		if (cal == null) {
			return false;
		}
		
		return hourMinuteBetween(cal, from, to);
	}

	/**
	 * @param time
	 * @param from
	 * @param to
	 * @return - 只比较小时和分钟，不比较其他字段
	 */
	public static boolean hourMinuteBetween(Calendar date, Calendar from, Calendar to) {
		return hourMinuteBetween(date.getTime(), from.getTime(), to.getTime());
	}
	
	/**
	 * date的小时分钟段是否在 [from, to] 范围内
	 * 
	 * @param time
	 * @param from
	 * @param to
	 * @return - 只比较小时和分钟，不比较其他字段
	 */
	public static boolean hourMinuteBetween(Date date, Date from, Date to) {
		if (date == null || from == null || to == null) {
			return false;
		}
		int iDate = hourMinuteToInt(date);
		int iFrom = hourMinuteToInt(from);
		int iTo = hourMinuteToInt(to);
		
		return iDate >= iFrom && iDate <= iTo;
    }
	
	/**
	 * date的小时分钟段是否在 [from, to) 范围内
	 * 
	 * @param date
	 * @param from
	 * @param to
	 * @return
	 */
	public static boolean hourMinuteBetweenNotIncludeRight(Date date, Date from, Date to) {
		if (date == null || from == null || to == null) {
			return false;
		}
		int iDate = hourMinuteToInt(date);
		int iFrom = hourMinuteToInt(from);
		int iTo = hourMinuteToInt(to);
		
		return iDate >= iFrom && iDate < iTo;		
	}
	
	/**
	 * @param time
	 * @return - 将"HH:MM"转换为今日的时间
	 */
	public static Calendar getTodayFromHHMM(String time) {
		if (StringUtils.isBlank(time) || !time.matches("^(([01][0-9])|(2[0-3]))\\:([0-5][0-9])$")) {
			return null;
		}
		
		String[] subs = time.split(":");
		
		Calendar cal = Calendar.getInstance();
		
		cal.set(Calendar.HOUR_OF_DAY, Integer.valueOf(subs[0]));
		cal.set(Calendar.MINUTE, Integer.valueOf(subs[1]));
		
		return cal;
	}
	
	/**
	 * @param time
	 * @return - 将"HH:MM"转换为今日的时间
	 */
	public static Calendar getTodayMinFromHHMM(String time) {

		Calendar cal = getTodayFromHHMM(time);
		cal.set(Calendar.SECOND, cal.getActualMinimum(Calendar.SECOND));
		cal.set(Calendar.MILLISECOND, cal.getActualMinimum(Calendar.MILLISECOND));
		
		return cal;
	}
	
	/**
	 * @param hour
	 * @param minute
	 * @return - 将小时和分钟转换为"HH:MM"格式的字符串
	 */
	public static String getHHMMFromHourMinute(int hour, int minute) {
		String hourStr = String.valueOf(hour);
		if (hourStr.length() == 1) {
			hourStr = "0" + hourStr;
		}
		
		String minuteStr = String.valueOf(minute);
		if (minuteStr.length() == 1) {
			minuteStr = "0" + minuteStr;
		}

		return hourStr + ":" + minuteStr;
	}
	
	/**
	 * @param time
	 * @return - 判断time的年月日是不是今天
	 */
	public static boolean isTodayTime(Date time) {
	    Date now = new Date();
	    
	    return DateUtils.isSameDay(time, now);
	}
	
	/**
	 * @param from
	 * @param to
	 * @return - 判断今天的日期（不包括时，分，秒）是不是在from和to之间
	 */
	public static boolean isTodayBetweenRange(Date from, Date to) {
		// 获取今天的日期，不包括含时，分，秒
		Date today = DateUtils.round(new Date(), Calendar.DAY_OF_MONTH);
		Date fromDay = DateUtils.round(from, Calendar.DAY_OF_MONTH);
		Date toDay = DateUtils.round(to, Calendar.DAY_OF_MONTH);
		
		if (fromDay.getTime() <= today.getTime() && today.getTime() <= toDay.getTime()) {
			return true;
		} else {
			return false;
		}
	}
	
	/**
	 * 计算两个时间相差的秒数，精确到秒
	 * @param from
	 * @param to
	 * @return
	 */
	public static int secondBetween(Date from, Date to) {
		long fm = from.getTime() / 1000;
		long tm = to.getTime() / 1000;
		return (int)(tm - fm);
	}
	
	/**
	 * 计算两个时间相差的分钟数，精确到分
	 * @param from
	 * @param to
	 * @return
	 */
	public static int minuteBetween(Date from, Date to) {
		long fm = from.getTime() / 60000;
		long tm = to.getTime() / 60000;
		return (int)(tm - fm);
	}
	
	/**  
     * 计算两个日期之间相差的天数  
     * @param smdate 较小的时间 
     * @param bdate  较大的时间 
     * @return 相差天数 
     * @throws ParseException  
     */    
	public static int daysBetween(Date smdate, Date bdate) {

		try {

			DateFormat sdf = getDateFormat(DateFormatType.YYYYMMDD);
			smdate = sdf.parse(sdf.format(smdate));
			bdate = sdf.parse(sdf.format(bdate));

			Calendar cal = Calendar.getInstance();
			cal.setTime(smdate);
			long time1 = cal.getTimeInMillis();
			cal.setTime(bdate);
			long time2 = cal.getTimeInMillis();
			long between_days = (time2 - time1) / (1000 * 3600 * 24);

			return Integer.parseInt(String.valueOf(between_days));

		} catch (ParseException e) {

		}

		return -1;
		
	} 
	
	/**
	 * 计算两个日期之间相差的月份
	 * 	例如：endDate:2016-03-10 和startDate:2016-02-06
	 *			参数dayBased为true,则值为2；参数dayBased为false,则值为1；
	 * 		endDate:2016-03-10 和startDate:2016-03-06
	 *			参数dayBased为true,则值为1；参数dayBased为false,则值为0；
	 * @param start 开始日期
	 * @param end 结束日期
	 * @param dayBased true表示基于同时基于月份和天计算相差的月份，false表示只根据月份计算
	 * @return
	 */
	public static int monthsBetween(Date start, Date end, boolean dayBased) {
        if (start.after(end)) {
            Date t = start;
            start = end;
            end = t;
        }
        
        Calendar startCalendar = Calendar.getInstance();
        startCalendar.setTime(start);
        
        Calendar endCalendar = Calendar.getInstance();
        endCalendar.setTime(end);
        
        int startYear = startCalendar.get(Calendar.YEAR);
        int startMonth = startCalendar.get(Calendar.MONTH);
        
        int endYear = endCalendar.get(Calendar.YEAR);
        int endMonth = endCalendar.get(Calendar.MONTH);

        int monthOfDay = ((endYear - startYear) * 12 + (endMonth - startMonth));

        if (dayBased) { // 是否基于天的
        	
            int startDay = startCalendar.get(Calendar.DATE);
            int endDay = endCalendar.get(Calendar.DATE);
            
        	if (startDay < endDay) {
            	monthOfDay = monthOfDay + 1;
            }
        }
        
        return monthOfDay;
    }
	
	
	public static int getDailyVersion() {
		return getDailyVersion(new Date());
	}
	
	public static int getDailyVersion(Date date) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(date);
		return calendar.get(Calendar.YEAR) * 10000 
				+ calendar.get(Calendar.MONTH) * 100 
				+ calendar.get(Calendar.DAY_OF_MONTH); 
	}
	
	public static String getDate(String dateTime) {
		try {
			return dateTime == null ? null : formatYYYYMMDD(parseYYYYMMDD(dateTime));
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return dateTime;
	}
	
	public static Date getDate(Date dateTime) {
		try {
			return dateTime == null ? null : parseYYYYMMDD(formatYYYYMMDD(dateTime));
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return dateTime;
	}
	
	/**
	 * @Description: 把一个时间段转为这种格式：*天*小时*分*秒
	 * @param seconds
	 * @return
	 */
	public static String getIntervalDesc(long seconds) {
		StringBuilder sb = new StringBuilder();
		long days = seconds/TimeUnit.DAYS.toSeconds(1);
		if (days > 0) {
			seconds = (int)(seconds%TimeUnit.DAYS.toSeconds(1));
			sb.append(days);
			sb.append("天");			
		}
		long hours = seconds/TimeUnit.HOURS.toSeconds(1);
		if (hours > 0) {
			seconds = (int)(seconds%TimeUnit.HOURS.toSeconds(1));
			sb.append(hours);
			sb.append("小时");			
		}
		long minutes = seconds/TimeUnit.MINUTES.toSeconds(1);
		if (minutes > 0) {
			seconds = (int)(seconds%TimeUnit.MINUTES.toSeconds(1));
			sb.append(minutes);
			sb.append("分");			
		}
		if (seconds > 0) {
			sb.append(seconds);
			sb.append("秒");			
		}
		
		return sb.toString();
	}
	
	/**
	 * 计算from到to的秒数，如果from在to之后，返回0
	 * 
	 * @param from
	 * @param to
	 * @return
	 */
	public static int getIntervalSeconds(Date from, Date to) {
		int seconds = (int)((to.getTime() - from.getTime())/1000);
		return seconds < 0 ? 0 : seconds;
	}
	
	public static int getIntervalMinutes(Date from, Date to) {
		return getIntervalSeconds(from, to) / 60;
	}
	
	public static int getIntervalHours(Date from, Date to) {
		return getIntervalMinutes(from, to) / 60;
	}
	
	//两个date之间的时间差，以半天为单位
	public static BigDecimal getIntervalDays(Date from, Date to) {
		int hours = getIntervalHours(from, to);
		double num = Math.ceil(hours / 24.0 * 2)/2;
		return new BigDecimal(num);
	}
	
	/*
	 * e.g 2015年10月1日 到 2015年10月3日 是三天
	 */
	public static BigDecimal getDays(Date from, Date to) {
		return getIntervalDays(from, to).add(BigDecimal.ONE);
	}
	
	/*
	 *  获取某月的天数
	 *  
	 */
	public static BigDecimal getMaxDaysOfMonth(Date month) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(month);
		return BigDecimal.valueOf(cal.getActualMaximum(Calendar.DAY_OF_MONTH));
	}
	
	public static Date getBeforeDate(Date date1, Date date2) {
		if (date1.before(date2)) {
			return date1;
		}
		return date2;
	}
	
	public static Date getAfterDate(Date date1, Date date2) {
		if (date1.after(date2)) {
			return date1;
		}
		return date2;
	}
	
	public static int getSpanDays(Date from, Date to) {
		Date spanFrom = getMinTimeOfDay(from);
		Date spanTo = getMinTimeOfDay(to);
		return (int)((spanTo.getTime() - spanFrom.getTime())/DAY);
	}
	
	public static Date getFirstDayOfMonth(Date time) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		calendar.set(Calendar.DAY_OF_MONTH, 1); 
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		calendar.set(Calendar.MINUTE, 0);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		return calendar.getTime();
	}
	
	public static Date getFirstDayOfLastMonth(Date time) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		calendar.add(Calendar.MONTH, -1);
		calendar.set(Calendar.DAY_OF_MONTH, 1); 
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		calendar.set(Calendar.MINUTE, 0);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		return calendar.getTime();
	}
	/**
	 *  获取月份的第一天
	 * @param time
	 * @param months
	 * @return
	 */
	public static Date getFirstDayOfMonth(Date time, int months) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		calendar.add(Calendar.MONTH, months);
		calendar.set(Calendar.DAY_OF_MONTH, 1); 
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		calendar.set(Calendar.MINUTE, 0);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		return calendar.getTime();
	}
	
	/***
	 * 获取某一月份最后一天日期
	 * @param time 日期
	 * @return 该月份最后一天日期
	 */
	public static Date getLastDayOfMonth(Date time){
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		int lastDay = calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
		calendar.set(calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), lastDay);
		
		return calendar.getTime();
	}
	/**
	 * 获取月份的最后一天
	 * @param time
	 * @param months
	 * @return
	 */
	public static Date getLastDayOfMonth(Date time, int months) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		calendar.add(Calendar.MONTH, months);
		int lastDay = calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
		calendar.set(Calendar.DAY_OF_MONTH, lastDay); 
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		calendar.set(Calendar.MINUTE, 0);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		return calendar.getTime();
	}
	
	/***
	 * 计算某一月份天数
	 * @param time 日期
	 * @return 该月天数
	 */
	public static int getDayOfMonth(Date time){
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		int dayOfMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
		
		return dayOfMonth;
	}
	
	/**
	 * 计算传入日期天数
	 * @param time 日期
	 * @return 日期天数
	 */
	public static int getDayOfDate(Date time){
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		return calendar.get(Calendar.DATE);
	}
	
	/***
	 * 计算传入日期月份
	 * @param time 日期
	 * @return 日期月份
	 */
	public static int getMonthOfDate(Date time){
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		return calendar.get(Calendar.MONTH) + 1;
	}
	
	/***
	 * 计算传入日期年份
	 * @param time 日期
	 * @return 日期年份
	 */
	public static int getYearOfDate(Date time){
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		return calendar.get(Calendar.YEAR);
	}
	
	public static String getDateTimeBasedPath(Date date) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);

        StringBuilder path = new StringBuilder();
        path.append(File.separator).append(cal.get(Calendar.YEAR)).append(File.separator).
        	append(cal.get(Calendar.MONTH) + 1).append(File.separator).append(cal.get(Calendar.DAY_OF_MONTH));

        return path.toString();
    }
	
	/**
	 * 得到某年某月的最后一天
	 * 
	 * @param year
	 * @param month
	 * @return
	 */

	public static String getFirstDayOfMonth(int year, int month) {

		Calendar cal = Calendar.getInstance();
		cal.set(Calendar.YEAR, year);
		cal.set(Calendar.MONTH, month - 1);
		cal.set(Calendar.DAY_OF_MONTH, cal.getMinimum(Calendar.DATE));
		return new SimpleDateFormat("yyyy-MM-dd").format(cal.getTime());
	}

	/**
	 * 得到某年某月的最后一天
	 * 
	 * @param year
	 * @param month
	 * @return
	 */
	public static String getLastDayOfMonth(int year, int month) {

		Calendar cal = Calendar.getInstance();
		cal.set(Calendar.YEAR, year);
		cal.set(Calendar.MONTH, month - 1);
		cal.set(Calendar.DAY_OF_MONTH, 1);
		int value = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
		cal.set(Calendar.DAY_OF_MONTH, value);
		return new SimpleDateFormat("yyyy-MM-dd").format(cal.getTime());

	}
	
	public static String formatMMSS(Date date){
		if (date == null ) {
			 return "";
		}
		return new SimpleDateFormat("mm:ss").format(date);
	}
	
	public static String formatMMSS(Calendar cal){
		if (cal == null) {
            return "";
        }

        return formatMMSS(cal.getTime());
	}

	public static Date getMinTimeOfTomorrow(Date date) {
		if (date == null) {
			return null;
		}
		date = DateUtils.addDays(date, 1);
		date = getMinTimeOfDay(date);
		
		return date;
	}
	
	public static Date getLastDayOfLastMonth(Date time) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(time);
		calendar.add(Calendar.MONTH, -1);
		calendar.set(Calendar.DAY_OF_MONTH, calendar.getActualMaximum(Calendar.DAY_OF_MONTH)); 
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		calendar.set(Calendar.MINUTE, 0);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MILLISECOND, 0);
		return calendar.getTime();
	}
	
	public static Calendar getLastDayOfLastMonth(Calendar time) {
		Calendar calendarNew = Calendar.getInstance();
		calendarNew.setTime(time.getTime());
		calendarNew.add(Calendar.MONTH, -1);
		calendarNew.set(Calendar.DAY_OF_MONTH, calendarNew.getActualMaximum(Calendar.DAY_OF_MONTH)); 
		calendarNew.set(Calendar.HOUR_OF_DAY, 0);
		calendarNew.set(Calendar.MINUTE, 0);
		calendarNew.set(Calendar.SECOND, 0);
		calendarNew.set(Calendar.MILLISECOND, 0);
		return calendarNew;
	}
	
	/**
     * @param calendar
     * @return - 返回calendar所在周的上周周一
     */
    public static Date getMondayOfLastWeek(Calendar calendar) {
		Calendar calendarNew = Calendar.getInstance();
		calendarNew.setTime(calendar.getTime());

		calendarNew.setFirstDayOfWeek(Calendar.MONDAY);
		
		calendarNew.add(Calendar.WEEK_OF_YEAR, -1);
		
		calendarNew.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
		
		return calendarNew.getTime();
	}
    
    /**
     * @param calendar
     * @return - 返回calendar所在周的上周周日
     */
	public static Date getSundayOfLastWeek(Calendar calendar) {
		Calendar calendarNew = Calendar.getInstance();
		calendarNew.setTime(calendar.getTime());
		
		calendarNew.setFirstDayOfWeek(Calendar.MONDAY);
		
		calendarNew.add(Calendar.WEEK_OF_YEAR, -1);
		
		calendarNew.set(Calendar.DAY_OF_WEEK, Calendar.SUNDAY);
		
		return calendarNew.getTime();
	}
	
	/**
	 * 判断是否所有时间分钟段不相交
	 * 
	 * @param dateRanges
	 * @return
	 */
	public static boolean isValidDisjointHourMinuteRanges(List<TimeRange> dateRanges) {
		
		int[][] intRanges = new int[dateRanges.size()][];
		for (int i = 0; i < dateRanges.size(); i++) {
			TimeRange dateRange = dateRanges.get(i);
			
			intRanges[i] = new int[] { hourMinuteToInt(dateRange.getFrom()), hourMinuteToInt(dateRange.getTo())};
			if (intRanges[i][0] >= intRanges[i][1]) {
				return false;
			}
		}
		
		for (int i = 0; i < intRanges.length; i++) {
			for (int j = i + 1; j < intRanges.length; j++) {
				if (intRanges[i][1] > intRanges[j][0] && intRanges[j][1] > intRanges[i][0]) {
					return false;
				}
			}
		}
		return true;
	}
	
	/*
	 * parse date to unix-timestamp 
	 */
	public static int parseDateToUnixTimestamp(Date date) {
		return (int) (date.getTime() / 1000L);
	}
	
	public static boolean before (String earlyStr, String lateStr) {
		
		Date early = null;
		Date late = null;
		try {
			early = DateTimeUtility.parseYYYYMMDD(earlyStr);
			late = DateTimeUtility.parseYYYYMMDD(lateStr);
		} catch (ParseException e) {
			
		}
		
		return early.before(late);
		
	}
	
}	
