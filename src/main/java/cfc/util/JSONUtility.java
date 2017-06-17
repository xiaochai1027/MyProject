package cfc.util;

import java.util.Map;

import com.alibaba.fastjson.JSON;

public class JSONUtility {
	public static Map<String, Object> jsonToMap(String json) {
		return JSON.parseObject(json);
	}
	
	public static String mapToJson(Map<String, Object> map) {
		return JSON.toJSONString(map);
	}
}
