package cfc.util;

import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import cfc.log.Log;
import org.dom4j.Document;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.xml.sax.Attributes;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;
import org.xml.sax.helpers.DefaultHandler;
import org.xml.sax.helpers.XMLReaderFactory;

public class XmlUtility {
	
	protected final static Log LOG = Log.getLog(XmlUtility.class);
	
	private static final String CHARACTER_ENCODING = "UTF-8";
	/**
     * Get an instance of an XML reader from the XMLReaderFactory.
     *
     * @return the XMLReader.
     */
    public static XMLReader getXmlReader() {
        try {
            return XMLReaderFactory.createXMLReader();
        } catch (final SAXException e) {
            throw new RuntimeException("Unable to create XMLReader", e);
        }
    }
	
	public static String getTextForElement(final String xmlAsString,
            final String element) {
		final XMLReader reader = getXmlReader();
		final StringBuffer buffer = new StringBuffer();
		
		final DefaultHandler handler = new DefaultHandler() {
		
			private boolean foundElement = false;
			
			public void startElement(final String uri, final String localName,
			      final String qName, final Attributes attributes)
			    		  throws SAXException {
				if (localName.equals(element)) {
					this.foundElement = true;
				}
			}
			
			public void endElement(final String uri, final String localName,
			    final String qName) throws SAXException {
				if (localName.equals(element)) {
					this.foundElement = false;
				}
			}
			
			public void characters(char[] ch, int start, int length)
			throws SAXException {
				if (this.foundElement) {
					buffer.append(ch, start, length);
				}
			}
		};
		
		reader.setContentHandler(handler);
		reader.setErrorHandler(handler);
		
		try {
			reader.parse(new InputSource(new StringReader(xmlAsString)));
			
		} catch (final Exception e) {
			LOG.error("reader.parse(InputSource) error - {}", e);
			return null;
		}
		
		return buffer.toString();
	}
	
	public static Map<String, String> parseXML(String xml) throws Exception {
		Map<String, String> map = new HashMap<String, String>();
		// read String
		SAXReader saxreader = new SAXReader();
		Document document = saxreader.read(new ByteArrayInputStream(xml
				.getBytes(CHARACTER_ENCODING)));
		Element root = document.getRootElement();
		@SuppressWarnings("unchecked")
		List<Element> elementList = root.elements();
		for (Element e : elementList) {
			map.put(e.getName(), e.getText());
		}
		return map;
	}

}
