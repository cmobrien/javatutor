import org.junit.runner.JUnitCore;
import org.junit.runner.Result;
import org.junit.runner.notification.Failure;

public class TestRunner {
   public static void main(String[] args) {
       JUnitCore core = new JUnitCore();
       core.addListener(new TestListener());
       try {
        core.run(Class.forName(args[0]));
      } catch (Exception e) {
        System.out.println("Could not find class");
      }
   }
}  