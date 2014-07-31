from rest_framework import viewsets, views
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import action, link
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import AnonymousUser
import django_filters

from serializers import *
from models import *
import permissions
import datetime
import dateutil.parser


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

    @link()
    def me(self, request, *args, **kwargs):
        if not request.user or isinstance(request.user, AnonymousUser):
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

        return Response({'user': UserSerializer(request.user).data})


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
    ordering = ('year', 'source__id', 'value', 'recipient__id')

    class AllocationFilter(django_filters.FilterSet):
        min_value = django_filters.NumberFilter(name='value', lookup_type='gte')
        max_value = django_filters.NumberFilter(name='value', lookup_type='lte')
        min_year = django_filters.NumberFilter(name='year', lookup_type='gte')
        max_year = django_filters.NumberFilter(name='year', lookup_type='lte')

        class Meta:
            model = Allocation
            fields = ('value', 'source__id', 'recipient__id', 'min_value', 'max_value', 'min_year',
                      'max_year', 'year')

    @action()
    def bulk_upload(selfself, request, pk=None):
        entries = request.DATA.get('entries')

        auth = False
        for g in request.user.groups.all():
            if g.groupprofile.group_type in (
                GroupProfile.COUNCIL_GROUP_TYPE, GroupProfile.GOV_BOARD_GROUP_TYPE):
                auth = True
                break

        if not auth:
            return Response({'error', 'unauthorized'}, status=403)

        for entry in entries:
            group_name = entry.get('group_name')
            alloc_value = entry.get('alloc_value')
            alloc_year = entry.get('alloc_year')
            sga_acct_number = entry.get('sga_acct_number')
            cu_acct_number = entry.get('cu_acct_number')
            cu_dept_number = entry.get('cu_dept_number')
            cu_project_number = entry.get('cu_project_number')
            contact = entry.get('contact')
            governing_board = entry.get('governing_board')
            mission = entry.get('mission')
            percent_cc = entry.get('percent_cc')
            percent_bc = entry.get('percent_bc')
            percent_seas = entry.get('percent_seas')
            percent_gs = entry.get('percent_gs')
            percent_grad = entry.get('percent_grad')

            try:
                g = StudentGroup.objects.get(name=group_name)
            except StudentGroup.DoesNotExist:
                g = StudentGroup(name=group_name)

            try:
                gb = Group.objects.get(name=governing_board)
            except Group.DoesNotExist:
                return Response({'error': 'invalid'}, status=400)

            g.governing_board = gb
            g.sga_acct_number = sga_acct_number
            g.cu_acct_number = cu_acct_number
            g.cu_dept_number = cu_dept_number
            g.cu_proj_number = cu_project_number
            if not contact in g.editors:
                g.editors.append(contact)
            g.mission = mission
            g.percent_cc = percent_cc
            g.percent_bc = percent_bc
            g.percent_seas = percent_seas
            g.percent_gs = percent_gs
            g.percent_grad = percent_grad

            g.save()

            try:
                a = Allocation.objects.get(recipient=g, year=alloc_year)
            except Allocation.DoesNotExist:
                a = Allocation(recipient=g, year=alloc_year)
            a.source = gb
            a.value = alloc_value
            a.save()

        return Response({'result': 'ok'})

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

    @action()
    def submit(self, request, pk=None, *args, **kwargs):
        pass

    @action()
    def schedule(self, request, pk=None, *args, **kwargs):
        pass

    @action()
    def approve(self, request, pk=None, *args, **kwargs):
        pass

    @action()
    def deny(self, request, pk=None, *args, **kwargs):
        pass

    filter_class = FundingFilter


class JCCCApplicationViewSet(viewsets.ModelViewSet):
    queryset = JCCCApplication.objects.all()
    serializer_class = JCCCApplicationSerializer
    permission_classes = (permissions.IsEditorAndState,)

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

    @action()
    def upload_file(self, request, pk=None, *args, **kwargs):
        jccc_app = get_object_or_404(JCCCApplication.objects.all(), pk=pk)
        uploaded_files = []
        if request.user.email in jccc_app.editors or request.user.on_council():
            print request.DATA, request.FILES
            files = request.FILES.getlist('file')
            for f in files:
                af = AttachedFile(request=jccc_app, name=f.name)
                af.attachment.save(f.name, f, save=True)
                af.save()
                uploaded_files.append(af.id)

            print uploaded_files

            return Response({'result': uploaded_files})
        else:
            return Response({'error': 'not authorized'}, status=403)

    @action()
    def delete_file(self, request, pk=None, *args, **kwargs):
        jccc_app = get_object_or_404(JCCCApplication.objects.all(), pk=pk)
        if request.user.email in jccc_app.editors or request.user.on_council():
            fid = request.DATA.get('file')
            af = get_object_or_404(AttachedFile.objects.all(), pk=fid)
            af.delete()
            return Response({'result': 'ok'})
        else:
            return Response({'error': 'not authorized'}, status=403)

    @action()
    def endorse(self, request, pk=None, *args, **kwargs):
        jccc_app = get_object_or_404(JCCCApplication.objects.all(), pk=pk)
        if not 'endorsement' in request.DATA:
            return Response({'error': 'bad request'}, status=400)

        groups = request.user.groups.all()
        for group in groups:
            if group.groupprofile.group_type == GroupProfile.GOV_BOARD_GROUP_TYPE:
                jccc_app.endorsement = request.DATA.get('endorsement')
                jccc_app.save()
                return Response({'result': 'ok'})

        return Response({'error': 'not authorized'}, status=403)

    @action()
    def submit(self, request, pk=None, *args, **kwargs):
        jccc_app = get_object_or_404(JCCCApplication.objects.all(), pk=pk)
        if request.user.email in jccc_app.editors and jccc_app.status == JCCCApplication.STATUS_PENDING:
            required_fields = (
            'title', 'requester', 'requested_amount', 'current_balance', 'funder', 'contact',
            'contact_phone', 'contact_position', 'event_audience', 'event_description',
            'event_advertisement', 'alternate_funding', 'alternate_plans', 'advisor_advice',
            'endorsement')

            missing_fields = []

            for f in required_fields:
                if not getattr(jccc_app, f):
                    missing_fields.append(f)

            if not missing_fields:
                jccc_app.status = JCCCApplication.STATUS_SUBMITTED
                jccc_app.save()
                return Response({'result': 'ok'})
            else:
                return Response({'error': 'missing fields', 'fields': missing_fields}, status=400)
        else:
            return Response({'error': 'bad request'}, status=400)

    @action()
    def schedule(self, request, pk=None, *args, **kwargs):
        jccc_app = get_object_or_404(JCCCApplication.objects.all(), pk=pk)
        if request.user.on_council():
            dt = dateutil.parser.parse(request.DATA.get('date'))
            jccc_app.scheduled_time = dt
            jccc_app.status = JCCCApplication.STATUS_SCHEDULED
            jccc_app.save()
            return Response({'result': 'ok'})
        else:
            return Response({'error': 'bad request'}, status=400)

    @action()
    def approve(self, request, pk=None, *args, **kwargs):
        jccc_app = get_object_or_404(JCCCApplication.objects.all(), pk=pk)
        amt = request.DATA.get('amt')
        notes = request.DATA.get('notes')
        if request.user.on_council() and amt and notes:
            jccc_app.status = JCCCApplication.STATUS_APPROVED
            jccc_app.approved_amount = amt
            jccc_app.notes = notes
            jccc_app.save()
            return Response({'result': 'ok'})
        else:
            return Response({'error': 'bad request'}, status=400)

    @action()
    def file(self, request, pk=None, *args, **kwargs):
        jccc_app = get_object_or_404(JCCCApplication.objects.all(), pk=pk)
        rev = request.DATA.get('revenue')
        exp = request.DATA.get('expenditures')

        if request.user.email in jccc_app.editors or request.user.on_council():
            jccc_app.actual_revenues = rev
            jccc_app.actual_expenditures = exp
            jccc_app.status = JCCCApplication.STATUS_FILED
            jccc_app.save()
            return Response({'result', 'ok'})
        else:
            return Response({'error': 'not authorized'}, status=403)

    @action()
    def complete(self, request, pk=None, *args, **kwargs):
        jccc_app = get_object_or_404(JCCCApplication.objects.all(), pk=pk)
        amt = request.DATA.get('amt')

        if request.user.on_council():
            jccc_app.transferred_amount = amt
            jccc_app.status = JCCCApplication.STATUS_COMPLETE
            jccc_app.save()
            return Response({'result', 'ok'})
        else:
            return Response({'error': 'not authorized'}, status=403)


    @action()
    def deny(self, request, pk=None, *args, **kwargs):
        jccc_app = get_object_or_404(JCCCApplication.objects.all(), pk=pk)
        notes = request.DATA.get('notes')
        if request.user.on_council() and notes:
            jccc_app.status = JCCCApplication.STATUS_DENIED
            jccc_app.notes = notes
            jccc_app.save()
            return Response({'result': 'ok'})
        else:
            return Response({'error': 'bad request'}, status=400)


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
