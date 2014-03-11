$(document).ready(function(){
    setUpCodeMirror();
    configureButtons();
    $(document).tooltip();
});

// Convert the Python and Java code textareas to CodeMirror
// Creates global variable java_codemirror so that CodeMirror object
// can be accessed from other functions
var setUpCodeMirror = function() {
    var python_textarea = $('#id_python')[0];
    CodeMirror.fromTextArea(python_textarea,
        { mode: 'text/x-python',
          lineNumbers: true,
          theme: 'eclipse',
          tabSize: 2,
          readOnly: true,
          lineWrapping: true
        }
    );

    var java_textarea = $('#id_response_code')[0];
    java_codemirror = CodeMirror.fromTextArea(java_textarea,
        { mode:'text/x-java',
          lineNumbers: true,
          theme: 'eclipse',
          tabSize: 2,
          gutters: ["error-gutter", "CodeMirror-linenumbers"],
          lineWrapping: true
        }
    );
}

// Configure the compile and run buttons. Ensures that a change to the code will
// disable the run button and enable the compile button
var configureButtons = function() {
    var compile_button = $('#compile');
    if (compile_button != null) {
        compile_button.on('click', function(event) {
            event.preventDefault();
            compileCode();
        }) 
    }
    var run_button = $('#run');
    if (run_button != null) {
        run_button.on('click', function(event) {
            event.preventDefault();
            runCode();
        })
    }
    java_codemirror.on("change", function(e) {
        if (compile_button.attr('disabled')) {
            compile_button.removeAttr('disabled');
            run_button.attr('disabled', true);
        }
    })
}


// Underline an error in java_codemirror. The error will be underlined on
// line_number, in [start, end). Message will appear as a tooltip.
var underlineError = function(line_number, start, end, message) {
    var index = 0;
    var line = $('.java .code_container .CodeMirror-code pre')[line_number - 1];
    var s = java_codemirror.getLine(line_number - 1);
    var spans = $(line).children('span');
    spans.each(function(i, span) {
        var word = $(span).html();
        // need to update s
        //s = s.substring(index, s.length);
        index = s.indexOf(word);
        if (index >= start && index + word.length - 1 <= end) {
            $(span).addClass('underline-error');
            $(span).attr('title', message);
        }
    });
}

// Add an error marker in the gutter of java_codemirror on line_number.
// Message will appear as a tooltip.
var addError = function(line_number, message) {
    var error_icon = $('<img>');
    error_icon.attr('src', 'http://localhost:8000/tutor/static/tutor/error.png');
    error_icon.attr('title', message)
    error_icon.tooltip({"tooltipClass": "ui-tooltip"});
    java_codemirror.setGutterMarker(line_number - 1, "error-gutter", error_icon[0]);
}


// Compile the Java code currently in java_codemirror. This will
// 1. Display the waiting cursor
// 2. Send ajax request to server to compile code
// 3. Parse JSON results of code compilation
// 4. Either display 'Compilation Succeeded' message or
//    'Fix Errors' message along with gutter markers and underlines
var compileCode = function() {
    // Display waiting cursor
    $('#overlay').show();
    document.body.style.cursor = "wait";

    // Read code from java_codemirror
    var code = java_codemirror.getValue();

    // Send ajax reuqest to compile code
    if (code != null){
        $.post("/tutor/compile",
            { code:code,
              csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken')[0].value,
              name: $('h1').html().toLowerCase()
            },
        parseCompileResult);
    }
}

// Handle the compilation results passed back from the server
// as a string of JSON
var parseCompileResult = function(result) {
    // Parse JSON result
    var result = $.parseJSON(result);

    // Update display
    $('#test_results').empty();
    $('#compilation_status').empty();
    $('#compile').attr('disabled', 'true');
    displayCompilationStatus(result);
    displayCompilationErrors(result);

    // Done compiling. Switch back to normal cursor
    $('#overlay').hide();
    document.body.style.cursor = "auto";
}

// Display the compilation status (succeeded or failed) below the
// java_codemirror box
var displayCompilationStatus = function(result) {
    var status = $('<div>');
    // Compilation succeeded
    if (result.length == 0) {
        $('#run').removeAttr('disabled');
        status.html("Compilation Succeeded!")
        status.addClass("pass");
    // Compilation failed
    } else {
        $('#run').attr('disabled', 'true');
        status.html("Compilation Failed. Please fix errors marked above.");
        status.addClass("error");
    }
    $('#compilation_status').append(status);
}

// Display the compilation errors by adding the error icons to the
// java_codemirror gutter and underlining errors
displayCompilationErrors = function(result) {
    java_codemirror.clearGutter("error-gutter");
    var errorLines = [];
    for (var i in result) {
        var error = result[i];
        // Only display one error per line
        if ($.inArray(line, errorLines) == -1) {
            var line = error['line'];
            var message = error['message'];
            var start = error['start'];
            var end = error['end'];
            addError(line, message);
            underlineError(line, start, end, message);
            errorLines.push(line);
        }
    }
}

// Run the Java test cases with the compiled code. This will
// 1. Display the waiting cursor and disable run button
// 2. Send ajax request to server to run tests
// 3. Parse JSON results of test results
// 4. Display test results
var runCode = function() {
    // Display waiting cursor and disable run button
    $('#overlay').show();
    document.body.style.cursor = "wait";
    $('#run').attr('disabled', 'true');

    // Send ajax request to run code
    $.post("/tutor/run",
        { csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken')[0].value,
        name: $('h1').html().toLowerCase()
        },
        parseRunResult
    );
}

var parseRunResult = function(result) {
    // hmm... this breaks if I take one of these away? No idea why
    var res = $.parseJSON(result);
    var res = $.parseJSON(res);
    var tests = res['tests'];

    // Clear previous results
    $('#test_results').empty();
    $('#test_summary').empty();
    $('#compilation_status').empty();

    // Count test runs, failures, and errors
    var run = 0;
    var fail = 0;
    var error = 0;

    // Display test results, counting failures, errors, and runs
    for (var i in tests) {
        var test = tests[i];
        var outcome = displayTestResult(test);
        if (outcome == 'fail') {
            fail += 1;
        } else if (outcome == 'error') {
            error += 1;
        }
        run += 1;
    }

    // Display test result summary
    displayTestResultSummary(run, fail, error, getFileName(test));

    $('#overlay').hide();
    document.body.style.cursor = "auto"; 
}

// Expand the test result panel to show the test code as well as the message
// (in the case of a failure or error)
var showTestResultDetails = function(test_result) {
    var code_container = test_result.find('.code_container').show();
    code_container.find('.CodeMirror')[0].CodeMirror.refresh();
    test_result.find('.message').show();
    var arrow = test_result.find('.toggler');
    arrow.attr('src', 'http://localhost:8000/tutor/static/tutor/down.png');
}

// Toggle the visibility of the test result details (meaning the code as well
// as the message)
var toggleTestResultVisibility = function(test_result) {
    var code_container = test_result.find('.code_container').toggle();
    code_container.find('.CodeMirror')[0].CodeMirror.refresh();
    test_result.find('.message').toggle();
    var arrow = test_result.find('.toggler');
    if (arrow.attr('src') == 'http://localhost:8000/tutor/static/tutor/right.png') {
        arrow.attr('src', 'http://localhost:8000/tutor/static/tutor/down.png');
    } else {
        arrow.attr('src', 'http://localhost:8000/tutor/static/tutor/right.png');
    }
}

// Display a single test result. The first test failure will initially be expanded,
// and all other test result details will be hidden.
var displayTestResult = function(test) {
    var test_result = $("<div>");

    // Add button to show test result details
    var left = buildLeftTestResultPanel();
    test_result.append($(left));
    test_result.on('click', function(event) {
        showTestResultDetails($(this));
    });

    // Display test result details
    var right = buildRightTestResultPanel(test);
    test_result.append($(right));

    test_result.addClass("test" + run);
    test_result.addClass(getTestName(test));

    // If the test failed, check if it was a failure or error
    if (test['trace']) {
        message = $('<div>');
        message.addClass('message');
        message.hide();
        right.append(message);
        
        // Test failed
        if (isFailure(test)) {
            message.html(getErrorMessage(test));
            test_result.addClass('fail');
            var outcome = 'fail';
        
        // There was an error
        } else {
            message.html(getTraceSegment(test));
            test_result.addClass('error');
            var outcome = 'error';
        }
    } else {
        test_result.addClass('pass');
        var outcome = 'pass';
    }
    $('#test_results').append(test_result);
    return outcome;
}

// Create the left panel of the test result box
// Contains the arrow to toggle visibility
var buildLeftTestResultPanel = function() {
    var left = $("<div>");
    left.addClass("test_result_left");

    // Create right pointing arrow which, on click, shows test details
    var arrow = $('<img>');
    arrow.attr('src', 'http://localhost:8000/tutor/static/tutor/right.png');
    arrow.addClass('toggler');
    arrow.width(10);

    left.append(arrow);

    arrow.on('click', function(event) {
        event.stopPropagation();
        var tr = $(this).parent().parent();
        toggleTestResultVisibility(tr);
    });
    return left;
}

// Create the right panel of the test result box
// Contains the test name, test code, and message
var buildRightTestResultPanel = function(test) {
    var right = $("<div>");
    right.addClass("test_result_right");
    right.html(test['name']);

    // Create textarea to display test code
    test_box = $("<div>")
    test_box.addClass("code_container")
    test_box.addClass("spacing_above")
    textarea = $("<textarea>");
    textarea.text(test['test']);

    test_box.append(textarea);
    right.append(test_box);

    // Convert textarea to CodeMirror
    c = CodeMirror.fromTextArea(textarea[0],
        { mode:'text/x-java',
          theme: 'eclipse',
          tabSize: 2,
          lineWrapping: true,
          lineNumbers:true,
          readOnly: true
        }
    );
    c.setSize(null, 100);

    test_box.hide();
    return right;
}

// Display the test result summary, which includes the filename of the tests,
// the number of tests ran, the number of failures, and the number of errors
var displayTestResultSummary = function(run, fail, error, filename) {
    var summary = $("<div>");
    if (run == 0) {
        summary.html("No tests detected");
    } else {
        summary.html("Test Result Summary");

        summary.append(buildTestFilenameSummary(filename));
        summary.append(buildTestRunSummary(run));
        summary.append(buildTestFailSummary(run, fail));
        summary.append(buildTestErrorSummary(run, error));
    }

    summary.addClass('summary');
    $('#test_summary').append(summary);
}

// Return a div displaying the filename
var buildTestFilenameSummary = function(filename) {
    var file = $('<div>');
    file.addClass('summary_result');
    file.html('Test File: ' + filename);
    return file;
}

// Return a div displaying the number of runs
var buildTestRunSummary = function(run) {
    var runs = $("<div>");
    runs.addClass('summary_result');
    runs.html("Runs: ");
    var runs_count = $("<span>");
    runs_count.html(run + "/" + run);
    runs_count.addClass('run_count');
    runs.append(runs_count);
    return runs;
}

// Build a div displaying the number of failures
var buildTestFailSummary = function(run, fail) {
    var failures = $("<div>");
    failures.addClass('summary_result')
    failures.html("Failures: ");
    var failures_count = $("<span>");
    failures_count.html(fail + "/" + run);
    failures_count.addClass('fail_count');
    failures.append(failures_count);
    return failures;
}

// Build a div diaplaying the number of errors
var buildTestErrorSummary = function(run, error) {
    var errors = $("<div>");
    errors.addClass('summary_result')
    errors.html("Errors: ");
    var errors_count = $("<span>");
    errors_count.html(error + "/" + run);
    errors_count.addClass('error_count');
    errors.append(errors_count);
    return errors;
}

// Returns true if a test is a JUnit test failure and false otherwise
var isFailure = function(test) {
    exception = test['exception']
    if (exception) {
        return /^org.junit./.test(exception);
    } else {
        return false;
    }
}

// Get the filename of a particular test
var getFileName = function(test) {
    var name = test['name'];
    return name.match('\\((.*)\\)')[1];
}

// Get the name of a particular test
var getTestName = function(test) {
    var name = test['name'];
    return name.match('(.*)\\(')[1];
}

// Get the error message for a test failure. The format will be:
// Line x: xxx.Exception: message
getErrorMessage = function(test) {
    var trace = test['trace'];
    var error = "";
    if (trace) {
        var line = trace.match(/JavaSourceString:(\d+)/g)[0].match(/\d+/)[0];
        var new_line = 'Line ' + (line - parseInt(test['line']) + 1) + ": ";
        var message = test['exception'].replace(/</g, '&lt;').replace(/>/g, '&gt;');
        error += new_line + message;
    }
    return error;
}


// Get a shortened, more readable version of the trace.
// In particular, get rid of 'from JavaSourceString' and parse out
// the lines which are relevant to these files
var getTraceSegment = function(test) {
    var trace = test['trace']
    var name = $('h1').html();

    // Get rid of 'from JavaSourceString' and update line numbers in tests
    var r = new RegExp(name + 'Test.java from JavaSourceString:(\\d+)', 'g');
    trace.match(r).map(function(m) {
        var line = m.match(/\d+/)[0];
        var old = name + 'Test.java from JavaSourceString:' + line;
        var n = name + 'Test.java:' + (parseInt(line) - test['line'] + 1);
        trace = trace.replace(old, n);
    });
    trace = trace.replace(name + 'Class.java from JavaSourceString:', name + 'Class.java:');

    // Parse out the lines which contain relevant information, replace the rest with '...'
    var lines = trace.split('\n');
    var last = 0
    var trace_segment = lines[0] + '<br>';
    for (var i = 1; i < lines.length; i++) {
        if (lines[i].search(name) >= 0) {
            trace_segment += lines[i].replace(/\t/g, "  ") + '<br>';
            last = i;
        } else {
            if (i == last + 1) {
                trace_segment += '  ...<br>'
            }
        }
    }
    return trace_segment;
}