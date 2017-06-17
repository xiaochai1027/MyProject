package cfc.util;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 
 * @author jzj
 * 
 * universal set is consist of set A and set B
 * 
 */
public class SetUtility {
	
	public static <T> List<T> obtainIntersectionSet(List<T> listA, List<T> listB) {
		Set<T> setA = new HashSet<>(listA);
		Set<T> setB = new HashSet<>(listB);
		
		Set<T> resultSet = obtainIntersectionSet(setA, setB);
		List<T> resultList = new ArrayList<>(resultSet);
		
		return resultList;
	}
	
	public static <T> Set<T> obtainIntersectionSet(Set<T> setA, Set<T> setB) {
		Set<T> intersectionSet = new HashSet<T>();
		
		for (T aElement : setA) {
			for (T bElement : setB) {
				if (aElement.equals(bElement)) {
					intersectionSet.add(aElement);
				}
			}
		}
		
		return intersectionSet;
	}
	
	public static <T> List<T> obtainUnionSet(List<T> listA, List<T> listB) {
		Set<T> setA = new HashSet<>(listA);
		Set<T> setB = new HashSet<>(listB);
		
		Set<T> resultSet = obtainUnionSet(setA, setB);
		List<T> resultList = new ArrayList<>(resultSet);
		
		return resultList;
	}
	
	public static <T> Set<T> obtainUnionSet(Set<T> setA, Set<T> setB) {
		Set<T> unionSet = new HashSet<T>();
		unionSet.addAll(setA);
		unionSet.addAll(setB);
		
		return unionSet;
	}
	
	public static <T> List<T> obtainComplementSetOfSetA(List<T> listA, List<T> listB) {
		Set<T> setA = new HashSet<>(listA);
		Set<T> setB = new HashSet<>(listB);
		
		Set<T> resultSet = obtainComplementSetOfSetA(setA, setB);
		List<T> resultList = new ArrayList<>(resultSet);
		
		return resultList;
	}
	
	public static <T> Set<T> obtainComplementSetOfSetA(Set<T> setA, Set<T> setB) {
		Set<T> complementSetOfSetA = new HashSet<T>();
		
		if(setA == null || setA.isEmpty()) {
			complementSetOfSetA.addAll(setB);
		}
		
		for (T bElement : setB) {
			boolean isComplementSetElementOfSetA = true;
			
			for (T aElement : setA) {
				if (bElement.equals(aElement)) {
					isComplementSetElementOfSetA = false;
				}
			}
			
			if(isComplementSetElementOfSetA) {
				complementSetOfSetA.add(bElement);
			}
		}
		
		return complementSetOfSetA;
	}
}
