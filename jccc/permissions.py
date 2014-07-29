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
        if request.user.email in obj.editors:
            return True
        try:
            request.user.groups.get(pk=obj.pk)
            return True
        except Group.DoesNotExist:
            return False


class IsEditor(permissions.BasePermission):
    @ro
    def has_permission(self, request, view):
        return True

    @ro
    def has_object_permission(self, request, view, obj):
        if is_student_government(request.user):
            return True

        if request.user.email in obj.editors:
            return True

        return False


class IsEditorAndState(IsEditor):

    @ro
    def has_object_permission(self, request, view, obj):
        if is_student_government(request.user):
            return True

        MUTABLE_STATES = (JCCCApplication.STATUS_PENDING, JCCCApplication.STATUS_SUBMITTED,
                          JCCCApplication.STATUS_SCHEDULED)

        if request.user.email in obj.editors and obj.status in MUTABLE_STATES:
            return True

        return False


class IsEditorNoPost(IsEditor):
    @ro
    def has_permission(self, request, view):
        ret = super(IsEditorNoPost, self).has_permission(request, view)
        if ret and view.action == 'create':
            return False
        return ret
