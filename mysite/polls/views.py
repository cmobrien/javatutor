from django.shortcuts import render
from django.http import HttpResponse

def index(request):
  return HttpResponse("what Hello, world. You're at the poll index.")
