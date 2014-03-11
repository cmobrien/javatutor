import static org.junit.Assert.*;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class PrintingTest {

  private final ByteArrayOutputStream outContent = new ByteArrayOutputStream();
  private final ByteArrayOutputStream errContent = new ByteArrayOutputStream();

  @Before
  public void setUpStreams() {
    System.setOut(new PrintStream(outContent));
    System.setErr(new PrintStream(errContent));
  }
    
  @Test
  public void out() {
    PrintingClass.main(new String[] {});
    assertEquals("Hello World!\n", outContent.toString());
  }

  @After
  public void cleanUpStreams() {
    System.setOut(null);
    System.setErr(null);
  }  
}