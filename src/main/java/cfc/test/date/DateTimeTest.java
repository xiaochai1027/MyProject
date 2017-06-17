package cfc.test.date;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

/**
 * Created by fangchen.chai on 2017/6/17.
 */
public class DateTimeTest {
    public static void main(String[] args) {
        // 取得年月日、小时分钟秒
        Calendar cal = Calendar.getInstance();
        System.out.println(cal.get(Calendar.YEAR));
        System.out.println(cal.get(Calendar.MONTH));    // 0 - 11
        System.out.println(cal.get(Calendar.DATE));
        System.out.println(cal.get(Calendar.HOUR_OF_DAY));
        System.out.println(cal.get(Calendar.MINUTE));
        System.out.println(cal.get(Calendar.SECOND));

        // Java 8
//        LocalDateTime dt = LocalDateTime.now();
//        System.out.println(dt.getYear());
//        System.out.println(dt.getMonthValue());     // 1 - 12
//        System.out.println(dt.getDayOfMonth());
//        System.out.println(dt.getHour());
//        System.out.println(dt.getMinute());
//        System.out.println(dt.getSecond());

        // 从1970年1月1日0时0分0秒到现在的毫秒数
        Calendar.getInstance().getTimeInMillis();
        System.out.println(System.currentTimeMillis());
//        Clock.systemDefaultZone().millis(); // Java 8

        //取得某月的最后一天
        Calendar time = Calendar.getInstance();
        int day = time.getActualMaximum(Calendar.DAY_OF_MONTH);
        System.out.println(day);

        //格式化日期
        SimpleDateFormat oldFormatter = new SimpleDateFormat("yyyy/MM/dd");
        Date date1 = new Date();
        System.out.println(oldFormatter.format(date1));

        // Java 8
//        DateTimeFormatter newFormatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
//        LocalDate date2 = LocalDate.now();
//        System.out.println(date2.format(newFormatter));

        // 打印昨天当前时刻
        Calendar cal3 = Calendar.getInstance();
        cal3.add(Calendar.DATE, -1);
        System.out.println(cal3.getTime());
        try{

        }finally {

        }

    }
}
