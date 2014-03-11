import java.util.HashMap;
import java.util.Map;

import org.junit.runner.Description;
import org.junit.runner.Result;
import org.junit.runner.notification.Failure;
import org.junit.runner.notification.RunListener;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONObject;
import org.json.JSONArray;

public class TestListener extends RunListener {

    JSONObject output;
    boolean failed = false;
    boolean pass = true;

    public String[] getTest(Description description) {
      String t = description.toString();
      String problem_name = t.substring(t.indexOf('(') + 1, t.indexOf("Test)")).toLowerCase();
      String test_name = t.substring(0, t.indexOf('('));
        
      String in = "";
      try {
        File file = new File("tutor/problems/" + problem_name + "/tests.java");
        FileInputStream fis = new FileInputStream(file);
        byte[] data = new byte[(int)file.length()];
        fis.read(data);
        fis.close();
        in = new String(data, "UTF-8");
      } catch (IOException e) {
        e.printStackTrace();
      }

      int start = in.indexOf("@Test\n  public void " + test_name) + 6;

      int l = 1;
      for (int i = 0; i < start; i++) {
        if (in.charAt(i) == '\n') {
          l += 1;
        }
      }
       
      int paren = 0;
      boolean started = false;
      int end = 0;
      for (int i = start; i < in.length(); i++) {
        if (paren == 0 && started) {
          end = i;
          break;
        }
        if (in.charAt(i) == '{') {
          paren += 1;
          started = true;
        } else if (in.charAt(i) == '}') {
          paren -= 1;
        }
      }
       
      String s = in.substring(start, end);
       
      String[] lines = s.split("\n");
      String res = "";
      for (String line: lines) {
        if (!line.trim().isEmpty()) {
          line = line.substring(2);
          res = res + line + "\n";
        }
      }

      return new String[] {res.substring(0, res.length() - 1), Integer.toString(l)};
    }
    
    @Override
    public void testRunStarted(Description description) {
      output = new JSONObject();
      output.put("tests", new JSONArray());
    }

    @Override
    public void testFailure(Failure failure) {
      failed = true;
      pass = false;
      JSONObject test = new JSONObject();
      test.put("name", failure.getDescription().toString());
      test.put("trace", failure.getTrace());
      test.put("exception", failure.getException());
      test.put("message", failure.getMessage());
      String[] t = getTest(failure.getDescription());
      test.put("test", t[0]);
      test.put("line", t[1]);
      output.append("tests", test);
    }
    
    @Override
    public void testFinished(Description description) {
        if (!failed) {
            JSONObject test = new JSONObject();
            test.put("name", description.toString());
            String[] t = getTest(description);
            test.put("test", t[0]);
            test.put("line", t[1]);
            output.append("tests", test);
        }
        failed = false;
    }

    @Override
    public void testRunFinished(Result result) {
      output.append("result", Boolean.toString(pass));
      System.out.println(output);
    }
}
