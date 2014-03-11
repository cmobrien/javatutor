from django.db import models
import json, os, re, subprocess


class ProblemManager(models.Manager):

	def build(self, name):
		with open("tutor/problems/" + name + "/python.py", 'r') as f:
			python = f.read()
		with open("tutor/problems/" + name + "/template.java", 'r') as f:
			template = f.read()
		with open("tutor/problems/" + name + "/tests.java", 'r') as f:
			tests = f.read()
		with open("tutor/problems/" + name + "/problem.txt", 'r') as f:
			problem = f.read()
		with open("tutor/problems/" + name + "/solution.java", 'r') as f:
			solution = f.read()
		return Problem(name = name, python = python, tests = tests, problem = problem, solution = solution, template = template)

	def get_names(self):
		problems = filter(lambda x: not x.startswith('.'), os.listdir('tutor/problems'))
		return filter(lambda x: self.check_problem(x), problems)

	def check_problem(self, name):
		needed = ['python.py', 'template.java', 'tests.java', 'problem.txt', 'solution.java']
		files = os.listdir('tutor/problems/' + name)
		for f in needed:
			if f not in files:
				return False
		return True

	def compile_code(self, name, code):
		code = squish(code)

		command = "java -cp tutor/java/bin Compile \"{\\\"" \
				+ name.capitalize() \
				+ "Class\\\":\\\"" \
				+ code \
				+ "\\\"}\""

		p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr = subprocess.PIPE, shell=True)
		(out, err) = p.communicate()

		errors = []
		for error in json.loads(err)['errors']:
			line = error['lineNumber']
			pre = sum([len(l) + 1 for l in code.split('\\n')[0:line - 1]])
			errors.append({
				'line': line,
				'start': error['startPosition'] - pre,
				'end': error['endPosition'] - pre,
				'message': re.sub(r'string:///.*Class.java:\d+: ', '', error['message'])
				})
		return errors

class Problem(models.Model):
  	name = models.CharField(max_length = 30)
  	problem = models.TextField()
  	python = models.TextField()
  	template = models.TextField()
  	solution = models.TextField()
  	tests = models.TextField()
  	objects = ProblemManager()

	def compile_tests(self):
		tests_text = squish(self.tests)

		command = "java -cp tutor/java/bin:/usr/share/java/junit.jar Compile \"{\\\"" \
				+ self.name.capitalize() \
				+ "Test\\\":\\\"" \
				+ tests_text \
				+ "\\\"}\""

		p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr = subprocess.PIPE, shell=True)
		(out, err) = p.communicate()
		return len(json.loads(err)['errors']) == 0

	def run_tests(self):
		command = "java -cp tutor/java/bin:/usr/share/java/junit.jar TestRunner " \
				+ self.name.capitalize() \
				+ "Test"
		p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr = subprocess.PIPE, shell=True)
		return p.communicate()

	def is_valid_code(self):
		errors = []
		valid = False
		# Check if solution compiles
		if len(Problem.objects.compile_code(self.name, self.solution)) == 0:
			# Check if tests compile
			if self.compile_tests():
				# Check if solution passes tests
				if json.loads(self.run_tests()[0])['result'] == [u'true']:
					valid = True
				else:
					errors.append('Solution did not pass test for ' + self.name)
			else:
				errors.append('Tests did not compile for ' + self.name)
		else:
			errors.append('Solution did not compile for ' + self.name)
		return valid, errors

	def update(self):
		changed = False

		with open("tutor/problems/" + self.name + "/python.py", 'r') as f:
			python = f.read()
		with open("tutor/problems/" + self.name + "/template.java", 'r') as f:
			template = f.read()
		with open("tutor/problems/" + self.name + "/tests.java", 'r') as f:
			tests = f.read()
		with open("tutor/problems/" + self.name + "/problem.txt", 'r') as f:
			problem = f.read()
		with open("tutor/problems/" + self.name + "/solution.java", 'r') as f:
			solution = f.read()

		if (python != self.python) or \
			(template != self.template) or \
			(tests != self.tests) or \
			(problem != self.problem) or \
			(solution != self.solution):
			changed = True

		self.python = python
		self.template = template
		self.tests = tests
		self.problem = problem
		self.solution = solution
		return changed

def squish(text):
	return str(text).encode('string-escape').replace('"', r'\\\"')

class Response(models.Model):
	code = models.TextField()
	problem = models.ForeignKey(Problem, related_name = "responses")
	compiled = models.BooleanField()

class CompileError(models.Model):
	line = models.IntegerField()
	start = models.IntegerField()
	end = models.IntegerField()
	message = models.TextField()
	response = models.ForeignKey(Response, related_name = "compile_errors")


