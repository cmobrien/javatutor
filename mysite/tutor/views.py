from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
from tutor.models import Problem, Response, ProblemManager
import re
import json

def compile(request):
	problem = Problem.objects.get(name = request.POST['name'])
	compiled = True
	if request.method == 'POST':
		code = request.POST['code']
		compile_errors = Problem.objects.compile_code(problem.name, code)
		if len(compile_errors) > 0:
			compiled = False
		try:
			response = problem.responses.get()
			response.code = code
			response.compiled = compiled
		except Response.DoesNotExist:
			response = Response(
				code = code,
				problem_id = problem.id,
				compiled = compiled)
		response.save()
	return HttpResponse(json.dumps(compile_errors))


def run(request):
	problem = Problem.objects.get(name = request.POST['name'])
	if request.method == 'POST':
		out, test_errors = problem.run_tests()

		if len(test_errors) > 0:
			result = "ERROR IN TESTS"
		else:
			result = out
		response = problem.responses.get()
		response.result = result
		response.save()

	return HttpResponse(json.dumps(result))


def index(request):
	created = []
	updated = []
	e = []
	names = Problem.objects.get_names()
	for name in names:
		try:
			p = Problem.objects.get(name = name)
			if p.update():
				updated.append(name)
		except Problem.DoesNotExist:
			p = Problem.objects.build(name)
			created.append(name)
		valid, errors = p.is_valid_code()
		if valid:
			p.save()
		e.extend(errors)
	current = Problem.objects.all()
  	return render(request, 'tutor/index.html',
  		{ 'created': created,
  		  'updated': updated,
  		  'errors': e,
  		  'current': current,
  		})


def show(request, problem_id):
	problem = Problem.objects.get(id = problem_id)
	try:
		response = problem.responses.get()
	except Response.DoesNotExist:
		response = Response(code = problem.template, problem_id = problem_id, compiled = False)
	
	name = problem.name.capitalize()
	return render(request, 'tutor/show.html',
		{ 'name': name,
		  'problem': problem,
		  'response': response,
		})

