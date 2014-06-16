from rest_framework import permissions
from django.contrib.auth.models import Group, User, AnonymousUser
from models import *
import json

class ReadOnly(permissions.BasePermission):
	def has_permission(self, request, view):
		if request.method in permissions.SAFE_METHODS:
			return True
		return False

class CouncilAndReadOnly(permissions.BasePermission):
	def has_permission(self, request, view):
		if request.method in permissions.SAFE_METHODS:
			return True
		else:
			if isinstance(request.user, AnonymousUser):
				return False

			return request.user.on_council()

class GoverningBoardAndReadOnly(permissions.BasePermission):
	def has_permission(self, request, view):
		if request.method in permissions.SAFE_METHODS:
			return True
		else:
			if isinstance(request.user, AnonymousUser):
				return False

			groups = request.user.groups.all()
			for group in groups:
				if group.groupprofile.group_type == GroupProfile.GOV_BOARD_GROUP_TYPE:
					return True
			return False

class StudentGovernmentAndReadOnly(permissions.BasePermission):
	def has_permission(self, request, view):
		if request.method in permissions.SAFE_METHODS:
			return True
		else:
			if isinstance(request.user, AnonymousUser):
				return False

			if request.user.on_council():
				return True

			groups = request.user.groups.all()
			for group in groups:
				if group.groupprofile.group_type == GroupProfile.GOV_BOARD_GROUP_TYPE:
					return True
			return False

class GroupMember(permissions.BasePermission):
	def has_object_permission(self, request, view, obj):
		if isinstance(request.user, AnonymousUser):
			return False

		try:
			request.user.groups.get(pk=obj.pk)
			return True
		except Group.DoesNotExist:
			return False

		return False

class IsEditor(permissions.BasePermission):
	def has_permission(self, request, view):
		if request.method in permissions.SAFE_METHODS:
			return True

		if isinstance(request.user, AnonymousUser):
			return False

		if request.method == 'POST':
			return True

		if request.user.on_council():
			return True

		groups = request.user.groups.all()
		for group in groups:
			if group.groupprofile.group_type == GroupProfile.GOV_BOARD_GROUP_TYPE:
				return True

		return False

	def has_object_permissions(self, request, view, obj):
		if isinstance(request.user, AnonymousUser):
			return False
		try:
			editor_list = obj.editor
			if request.user.username in editor_list:
				return True
		except ValueError:
			return False
		return False
