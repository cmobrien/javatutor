import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.Test;

public class MapsTest {

  @Test
  public void getTest() {
    Map<String, String> M = new HashMap<String, String>();
    M.put("hello", "there");
    assertEquals("there", MapsClass.get(M, "hello"));
  }
    
  @Test
  public void appendTest() {
    Map<String, String> M = new HashMap<String, String>();
    MapsClass.append(M, "hello", "there");
    assertEquals("there", M.get("hello"));
  }
    
  @Test
  public void removeTest() {
    Map<String, String> M = new HashMap<String, String>();
    M.put("hello", "there");
    MapsClass.remove(M, "hello");
    assertEquals(0, M.size());
  }
}
