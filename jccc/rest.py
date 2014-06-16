from rest_framework import viewsets, views
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import django_filters

from serializers import *
from models import *
import permissions
import datetime


class FileUploadView(views.APIView):
    parser_classes = (MultiPartParser,)
    permission_classes = (IsAuthenticatedOrReadOnly,)

    def put(self, request, format=None):
        file_obj = request.FILES['file']
        req_id = request.DATA.get('request_id')
        name = request.DATA.get('name')

        if not id or not name:
            return Response(status=400)

        try:
            funding_request = FundingRequest.objects.get(id=req_id)
        except FundingRequest.DoesNotExist:
            return Response(status=404)

        if not request.user.email in funding_request.editors:
            return Response(status=403)

        attachment = AttachedFile(attachment=file_obj,
                                  request=funding_request,
                                  name=name,
                                  created_time=datetime.datetime.now())

        attachment.save()

        return Response(AttachedFileSerializer(attachment).data, status=204)


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = AttachedFile.objects.all()
    serializer_class = AttachedFileSerializer
    permission_classes = (permissions.ReadOnly,)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.CouncilAndReadOnly,)
    filter_fields = ('username', 'groups', 'email')

    @action()
    def update_groups(self, request, *args, **kwargs):
        if not request.user:
            return Response({'error': 'Not logged in'}, status=403)
        groups = Group.objects.all()
        user_groups = request.user.groups.all()
        dirty = False
        for group in groups:
            if group in user_groups:
                continue

            editor_list = group.groupprofile.editors
            if request.user.email in editor_list:
                request.user.groups.add(group)

                editor_list.remove(request.user.email)
                group.groupprofile.editors = editor_list
                group.groupprofile.save()
                dirty = True

        if dirty:
            request.user.save()

        return Response({'groups': GroupSerializer(request.user.groups.all()).data})


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    permission_classes = (permissions.GroupMember,)

    filter_fields = ('groupprofile__group_type', 'name', 'id')

    @action()
    def add_editor(self, request, pk=None):
        group = get_object_or_404(Group.objects.all(), pk=pk)
        name = request.DATA.get('name')

        try:
            user = User.objects.get(email=name)
            user.groups.add(group)
            user.save()
        except User.DoesNotExist:
            editor_list = group.groupprofile.editors
            if name and not name in editor_list:
                editor_list.append(name)
            group.groupprofile.editors = editor_list
            group.groupprofile.save()

        return Response(GroupSerializer(group).data)

    @action()
    def remove_editor(self, request, pk=None):
        group = get_object_or_404(Group.objects.all(), pk=pk)

        name = request.DATA.get('name')
        try:
            user = User.objects.get(email=name)
            user.groups.remove(group)
            user.save()
        except User.DoesNotExist:
            editor_list = group.groupprofile.editors
            if name and name in editor_list:
                editor_list.remove(name)
            group.groupprofile.editors = editor_list
            group.groupprofile.save()

        return Response(GroupSerializer(group).data)

    @action()
    def set_editors(self, request, pk=None):
        group = get_object_or_404(Group.objects.all(), pk=pk)

        members = set(request.DATA)
        existing_members = set(group.groupprofile.editors + [u.email for u in group.user_set.all()])
        new_members = members - existing_members
        removed_members = existing_members - members

        for m in new_members:
            try:
                user = User.objects.get(email=m)
                user.groups.add(group)
                user.save()
            except User.DoesNotExist:
                group.groupprofile.editors.append(m)
                group.groupprofile.save()
        for m in removed_members:
            try:
                user = User.objects.get(email=m)
                user.groups.remove(group)
                user.save()
            except User.DoesNotExist:
                group.groupprofile.editors.remove(m)
                group.groupprofile.save()

        return Response(GroupSerializer(group).data)

    @action()
    def set_full_name(self, request, pk=None):
        group = get_object_or_404(Group.objects.all(), pk=pk)

        name = request.DATA.get('name')
        if name:
            group.groupprofile.full_name = name
            group.groupprofile.save()

        return Response(GroupSerializer(group).data)


class GroupProfileViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.ReadOnly,)
    queryset = GroupProfile.objects.all()
    serializer_class = GroupProfileSerializer


class StudentGroupViewSet(viewsets.ModelViewSet):
    queryset = StudentGroup.objects.all()
    serializer_class = StudentGroupSerializer
    permission_classes = (permissions.IsEditorNoPost,)

    filter_fields = ('name', 'governing_board__name', 'governing_board__id')

    @action()
    def set_editors(self, request, pk=None):
        group = get_object_or_404(StudentGroup.objects.all(), pk=pk)

        group.editors = request.DATA
        if len(group.editors) == 0:
            group.editors.append(request.user.email)
        group.save()

        return Response(StudentGroupPublicSerializer(group).data)


class AllocationViewSet(viewsets.ModelViewSet):
    queryset = Allocation.objects.all()
    serializer_class = AllocationSerializer

    permission_classes = (permissions.StudentGovernmentAndReadOnly,)

    class AllocationFilter(django_filters.FilterSet):
        min_value = django_filters.NumberFilter(name='value', lookup_type='gte')
        max_value = django_filters.NumberFilter(name='value', lookup_type='lte')
        min_year = django_filters.NumberFilter(name='year', lookup_type='gte')
        max_year = django_filters.NumberFilter(name='year', lookup_type='lte')

        class Meta:
            model = Allocation
            fields = ('value', 'source__id', 'recipient__id', 'min_value', 'max_value', 'min_year',
                      'max_year')

    filter_class = AllocationFilter


class FundingRequestViewSet(viewsets.ModelViewSet):
    queryset = FundingRequest.objects.all()
    serializer_class = FundingRequestSerializer

    permission_classes = (permissions.ReadOnly,)

    class FundingFilter(django_filters.FilterSet):
        min_requested = django_filters.NumberFilter(name='requested_amount', lookup_type='gte')
        max_requested = django_filters.NumberFilter(name='requested_amount', lookup_type='lte')

        min_allocated = django_filters.NumberFilter(name='allocated_amount', lookup_type='gte')
        max_allocated = django_filters.NumberFilter(name='allocated_amount', lookup_type='lte')

        created_after = django_filters.DateFilter(name='created_time', lookup_type='gte')
        created_before = django_filters.DateFilter(name='created_time', lookup_type='lte')
        submitted_after = django_filters.DateFilter(name='submitted_time', lookup_type='gte')
        scheduled_before = django_filters.DateFilter(name='scheduled_time', lookup_type='lte')
        scheduled_after = django_filters.DateFilter(name='scheduled_time', lookup_type='gte')
        submitted_before = django_filters.DateFilter(name='submitted_time', lookup_type='lte')

        class Meta:
            model = FundingRequest
            fields = ('status', 'min_requested', 'max_requested', 'min_allocated', 'max_allocated',
                      'created_after', 'created_before', 'submitted_after', 'submitted_before',
                      'requester__id', 'funder__id')

    filter_class = FundingFilter


class JCCCApplicationViewSet(viewsets.ModelViewSet):
    queryset = JCCCApplication.objects.all()
    serializer_class = JCCCApplicationSerializer
    permission_classes = (permissions.IsEditor,)

    class JCCCApplicationFilter(django_filters.FilterSet):
        min_requested = django_filters.NumberFilter(name='requested_amount', lookup_type='gte')
        max_requested = django_filters.NumberFilter(name='requested_amount', lookup_type='lte')

        min_allocated = django_filters.NumberFilter(name='allocated_amount', lookup_type='gte')
        max_allocated = django_filters.NumberFilter(name='allocated_amount', lookup_type='lte')

        created_after = django_filters.DateFilter(name='created_time', lookup_type='gte')
        created_before = django_filters.DateFilter(name='created_time', lookup_type='lte')
        submitted_after = django_filters.DateFilter(name='submitted_time', lookup_type='gte')
        scheduled_before = django_filters.DateFilter(name='scheduled_time', lookup_type='lte')
        scheduled_after = django_filters.DateFilter(name='scheduled_time', lookup_type='gte')
        submitted_before = django_filters.DateFilter(name='submitted_time', lookup_type='lte')

        class Meta:
            model = JCCCApplication
            fields = ('status', 'min_requested', 'max_requested', 'min_allocated', 'max_allocated',
                      'created_after', 'created_before', 'submitted_after', 'submitted_before',
                      'requester__id', 'funder__id', 'contact__id')

    filter_class = JCCCApplicationFilter


class CIFApplicationViewSet(viewsets.ModelViewSet):
    queryset = CIFApplication.objects.all()
    serializer_class = CIFApplicationSerializer
    permission_classes = (permissions.IsEditor,)

    class CIFApplicationFilter(django_filters.FilterSet):
        min_requested = django_filters.NumberFilter(name='requested_amount', lookup_type='gte')
        max_requested = django_filters.NumberFilter(name='requested_amount', lookup_type='lte')

        min_allocated = django_filters.NumberFilter(name='allocated_amount', lookup_type='gte')
        max_allocated = django_filters.NumberFilter(name='allocated_amount', lookup_type='lte')

        created_after = django_filters.DateFilter(name='created_time', lookup_type='gte')
        created_before = django_filters.DateFilter(name='created_time', lookup_type='lte')
        submitted_after = django_filters.DateFilter(name='submitted_time', lookup_type='gte')
        scheduled_before = django_filters.DateFilter(name='scheduled_time', lookup_type='lte')
        scheduled_after = django_filters.DateFilter(name='scheduled_time', lookup_type='gte')
        submitted_before = django_filters.DateFilter(name='submitted_time', lookup_type='lte')

        class Meta:
            model = CIFApplication
            fields = ('status', 'min_requested', 'max_requested', 'min_allocated', 'max_allocated',
                      'created_after', 'created_before', 'submitted_after', 'submitted_before',
                      'requester__id', 'funder__id', 'contact__id')

    filter_class = CIFApplicationFilter


class ESCProjectGrantApplicationViewSet(viewsets.ModelViewSet):
    queryset = ESCProjectGrantApplication.objects.all()
    serializer_class = ESCProjectGrantApplicationSerializer

    permission_classes = (permissions.IsEditor,)

    class ESCProjectGrantApplicationFilter(django_filters.FilterSet):
        min_requested = django_filters.NumberFilter(name='requested_amount', lookup_type='gte')
        max_requested = django_filters.NumberFilter(name='requested_amount', lookup_type='lte')

        min_allocated = django_filters.NumberFilter(name='allocated_amount', lookup_type='gte')
        max_allocated = django_filters.NumberFilter(name='allocated_amount', lookup_type='lte')

        created_after = django_filters.DateFilter(name='created_time', lookup_type='gte')
        created_before = django_filters.DateFilter(name='created_time', lookup_type='lte')
        submitted_after = django_filters.DateFilter(name='submitted_time', lookup_type='gte')
        scheduled_before = django_filters.DateFilter(name='scheduled_time', lookup_type='lte')
        scheduled_after = django_filters.DateFilter(name='scheduled_time', lookup_type='gte')
        submitted_before = django_filters.DateFilter(name='submitted_time', lookup_type='lte')

        class Meta:
            model = ESCProjectGrantApplication
            fields = ('status', 'min_requested', 'max_requested', 'min_allocated', 'max_allocated',
                      'created_after', 'created_before', 'submitted_after', 'submitted_before',
                      'requester__id', 'funder__id', 'contact__id')

    filter_class = ESCProjectGrantApplicationFilter
