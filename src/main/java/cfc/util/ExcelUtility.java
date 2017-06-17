package cfc.util;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.util.List;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang.StringUtils;
import org.apache.poi.hssf.usermodel.*;
import org.apache.poi.hssf.util.HSSFColor;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellRangeAddressList;

public class ExcelUtility {

	
	public static HSSFSheet createSheet(HSSFWorkbook workbook, String sheetName) {
        HSSFSheet sheet = workbook.getSheet(sheetName);
        if (null == sheet) {
            sheet = workbook.createSheet(sheetName);
            // sheet.protectSheet("");
        }
        return sheet;
    }
	
	public static CellStyle getCellStyle(HSSFWorkbook workbook, boolean isGrey) {
        CellStyle cs = workbook.createCellStyle();
        cs.setLocked(isGrey);
        cs.setVerticalAlignment(CellStyle.VERTICAL_CENTER);
        
        if (isGrey) {
            Font font = workbook.createFont();
            font.setColor(HSSFColor.GREY_50_PERCENT.index);
            cs.setFont(font);
        }
        return cs;
    }
	
	public static void createCell(HSSFSheet sheet, int rowNum, int cellNum, Object cellValue, CellStyle style) {
		createCell(sheet, rowNum, cellNum, 1, cellValue, style);
	}
	
	public static void createCell(HSSFSheet sheet, int rowNum, int cellNum, int rowSpan, Object cellValue, CellStyle style) {
		if (cellValue != null && cellValue.getClass().isPrimitive()) {
			createCell(sheet, rowNum, cellNum, rowSpan, cellValue.toString(), style);
		}else if (cellValue instanceof String) {
			createCell(sheet, rowNum, cellNum, rowSpan, cellValue.toString(), style);
		} else if (cellValue instanceof BigDecimal) {
			createCell(sheet, rowNum, cellNum, rowSpan, BigDecimal.valueOf(Double.valueOf(cellValue.toString())), style);
		} else if (cellValue instanceof Integer) {
			createCell(sheet, rowNum, cellNum, rowSpan, Integer.parseInt(cellValue.toString()), style);
		} else if (cellValue instanceof Long) {
			createCell(sheet, rowNum, cellNum, rowSpan, cellValue.toString(), style);
		} else if (cellValue instanceof Boolean) {
			createCell(sheet, rowNum, cellNum, rowSpan, ((Boolean)cellValue) ? "是" : "否", style);
		} else if (cellValue instanceof List) {
			@SuppressWarnings("unchecked")
			List<ExcelCell> cellValueList = (List<ExcelCell>)cellValue;
			for (ExcelCell subCell: cellValueList) {
				createCell(sheet, rowNum, cellNum++, subCell.getRowSpan(), subCell.getValue(), style);
			}
		}
    }
	
	public static void createCell(HSSFSheet sheet, int rowNum, int cellNum, int rowSpan, String cellValue, CellStyle style) {
        if (rowSpan > 1) {
        	CellRangeAddress cra = new CellRangeAddress(rowNum, rowNum + rowSpan - 1, cellNum, cellNum);
        	sheet.addMergedRegion(cra);
        }
        HSSFRow row = createRow(sheet, rowNum);
        HSSFCell cell = createCell(row, cellNum, style);
        cell.setCellValue(cellValue);
    }
	
	public static void createCell(HSSFSheet sheet, int rowNum, int cellNum, int rowSpan, BigDecimal cellValue, CellStyle style) {
    	if (rowSpan > 1) {
        	CellRangeAddress cra = new CellRangeAddress(rowNum, rowNum + rowSpan - 1, cellNum, cellNum);
        	sheet.addMergedRegion(cra);
        }
        HSSFRow row = createRow(sheet, rowNum);
        HSSFCell cell = createCell(row, cellNum, style);
        cell.setCellValue(cellValue.doubleValue());
    }
	
	public static void createCell(HSSFSheet sheet, int rowNum, int cellNum, int rowSpan, int cellValue, CellStyle style) {
    	if (rowSpan > 1) {
        	CellRangeAddress cra = new CellRangeAddress(rowNum, rowNum + rowSpan - 1, cellNum, cellNum);
        	sheet.addMergedRegion(cra);
        }
        HSSFRow row = createRow(sheet, rowNum);
        HSSFCell cell = createCell(row, cellNum, style);
        cell.setCellValue(cellValue);
    }
	
	public static HSSFRow createRow(HSSFSheet sheet, int rowNum) {
        HSSFRow row = sheet.getRow(rowNum);
        if (null == row) {
            row = sheet.createRow(rowNum);
        }
        return row;
    }
	
	public static HSSFCell createCell(HSSFRow row, int cellNum, CellStyle style) {
        HSSFCell cell = row.getCell(cellNum);
        if (null == cell) {
            cell = row.createCell(cellNum);
        }
        cell.setCellStyle(style);
        return cell;
    }
	
	public static void addValidationData(HSSFSheet sheet, String[] list, int firstRow, int lastRow, int firstCol, int lastCol) {
        CellRangeAddressList regions = new CellRangeAddressList(firstRow, lastRow, firstCol, lastCol);
        DVConstraint constraint = DVConstraint.createExplicitListConstraint(list);
        HSSFDataValidation dataValidation = new HSSFDataValidation(regions, constraint);
        sheet.addValidationData(dataValidation);
    }
	
	public static String encodeFileName(String fileName, HttpServletRequest request) {
    	String agent = request.getHeader("USER-AGENT");
    	return encodeFileName(fileName, agent);
    }
	
	public static String encodeFileName(String fileName, String agent) {        
        try {
            if ((agent != null) && (-1 != agent.indexOf("MSIE"))) {
                String newFileName = URLEncoder.encode(fileName, "UTF-8");
                newFileName = StringUtils.replace(newFileName, "+", "%20");
                if (newFileName.length() > 150) {
                    newFileName = new String(fileName.getBytes("GB2312"), "ISO8859-1");
                    newFileName = StringUtils.replace(newFileName, " ", "%20");
                }
                return newFileName;
            }
            if ((agent != null) && (-1 != agent.indexOf("Mozilla"))) {
                // return MimeUtility.encodeText(fileName, "UTF-8", "B");
                return URLEncoder.encode(fileName, "UTF-8");
            }
            return fileName;
        } catch (Exception ex) {
            return fileName;
        }
    }
	
	
	
	
	public static class ExcelCell {
		private Object value;
		private int sequence;
		private int rowSpan;
		
		public ExcelCell(Object value, int sequence) {
			super();
			this.value = value;
			this.sequence = sequence;
			this.rowSpan = 1;
		}

		public Object getValue() {
			return value;
		}

		public void setValue(Object value) {
			this.value = value;
		}

		public int getSequence() {
			return sequence;
		}

		public void setSequence(int sequence) {
			this.sequence = sequence;
		}

		public int getRowSpan() {
			return rowSpan;
		}

		public void setRowSpan(int rowSpan) {
			this.rowSpan = rowSpan;
		}
		
	}
}
