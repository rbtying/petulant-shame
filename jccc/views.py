from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.models import User, Group
from django.template import TemplateDoesNotExist
from django.http import HttpResponse, HttpResponseRedirect
from django.views.generic.base import View
from social_auth.exceptions import AuthFailed, AuthCanceled
from social_auth.views import complete
from social_auth.decorators import dsa_view
from rest_framework import viewsets
from models import *

import os

 
class AuthComplete(View):
	def get(self, request, *args, **kwargs):
		backend = kwargs.pop('backend')
		try:
			return complete(request, backend, *args, **kwargs)
		except:
			messages.error(request, "Your Google Apps domain isn't authorized for this app")
			return HttpResponseRedirect(reverse('app') + '#/?loginerror')
 
class LoginError(View):
	def get(self, request, *args, **kwargs):
		return HttpResponse(status=401)

class Logout(View):
	def get(self, request, *args, **kwargs):
		logout(request)
		return HttpResponseRedirect(reverse('app') + '#/?logout')

class App(View):
	def get(self, request, *args, **kwargs):
		return render(request, 'index.html', {})

class Partial(View):
	def get(self, request, *args, **kwargs):
		partial = kwargs.get('partial')
		templatepath = os.path.join('partials', partial)

		print templatepath
		if not partial:
			return HttpResponse(status=404)
		try:
			return render(request, templatepath, {})
		except TemplateDoesNotExist:
			return HttpResponse(status=404)
