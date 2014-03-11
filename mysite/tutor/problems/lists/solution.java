import java.util.List;

public class ListsClass {
  public static String get(List<String> L, int i) {
    return L.get(i);
  }
    
  public static void append(List<String> L, String s) {
    L.add(s);
  }
    
  public static void remove(List<String> L, String s) {
    L.remove(s);
  }
}
