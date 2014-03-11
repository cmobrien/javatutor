import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

public class ListsTest {

  @Test
  public void getTest() {
    List<String> L = new ArrayList<String>();
    L.add("Test");
    assertEquals("Test", ListsClass.get(L, 0));
  }
    
  @Test
  public void appendTest() {
    List<String> L = new ArrayList<String>();
    ListsClass.append(L, "Test");
    assertEquals("Test", L.get(0));
  }
    
  @Test
  public void removeTest() {
    List<String> L = new ArrayList<String>();
    L.add("Test");
    ListsClass.remove(L, "Test");
    assertEquals(0, L.size());
  }
  
}
