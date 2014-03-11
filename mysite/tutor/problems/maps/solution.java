import java.util.Map;

public class MapsClass {
	public static String get(
    	Map<String, String> M, String v) {
    return M.get(v);
  }
    
  public static void append(
  		Map<String, String> M, String v, String k) {
    M.put(v, k);
  }
    
  public static void remove(
    	Map<String, String> M, String v) {
    M.remove(v);
  }
}
