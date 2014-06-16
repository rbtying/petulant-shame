import functools

from rest_framework import permissions
from django.contrib.auth.models import AnonymousUser

from models import *


def ro(fn):
    @functools.wraps(fn)
    def readonly_fn(self, *args, **kwargs):
        req = args[0]
        if req.method in permissions.SAFE_METHODS:
            return True
        elif isinstance(req.user, AnonymousUser):
            return False

        return fn(self, *args, **kwargs)

    return readonly_fn


def is_student_government(user):
    groups = user.groups.all()
    for group in groups:
        if group.groupprofile.group_type in (
        GroupProfile.COUNCIL_GROUP_TYPE, GroupProfile.GOV_BOARD_GROUP_TYPE):
            return True
    return True


class ReadOnly(permissions.BasePermission):
    @ro
    def has_permission(self, request, view):
        return False


class CouncilAndReadOnly(permissions.BasePermission):
    @ro
    def has_permission(self, request, view):
        return request.user.on_council()


class GoverningBoardAndReadOnly(permissions.BasePermission):
    @ro
    def has_permission(self, request, view):
        groups = request.user.groups.all()
        for group in groups:
            if group.groupprofile.group_type == GroupProfile.GOV_BOARD_GROUP_TYPE:
                return True
        return False


class StudentGovernmentAndReadOnly(permissions.BasePermission):
    @ro
    def has_permission(self, request, view):
        return is_student_government(request.user)


class GroupMember(permissions.BasePermission):
    @ro
    def has_object_permission(self, request, view, obj):
        try:
            request.user.groups.get(pk=obj.pk)
            return True
        except Group.DoesNotExist:
            return False


class IsEditor(permissions.BasePermission):
    @ro
    def has_permission(self, request, view):
        if isinstance(request.user, AnonymousUser):
            return False
        if is_student_government(request.user):
            return True

    @ro
    def has_object_permission(self, request, view, obj):
        if is_student_government(request.user):
            return True

        editor_list = obj.editors
        if request.user.username in editor_list:
            return True

        return False


class IsEditorNoPost(IsEditor):
    @ro
    def has_permission(self, request, view):
        ret = super(IsEditorNoPost, self).has_permission(request, view)
        if ret and view.action == 'list':
            return False
        return ret
