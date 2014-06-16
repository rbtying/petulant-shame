from rest_framework import viewsets
from models import *
from serializers import *
from rest_framework import permissions
from rest_any_permissions.permissions import AnyPermissions
from rest_framework.decorators import action, link
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import django_filters
import permissions
import json

class UserViewSet(viewsets.ModelViewSet):
	queryset = User.objects.all()
	serializer_class = UserSerializer
	filter_fields = ('username', 'groups', 'email')

class GroupViewSet(viewsets.ModelViewSet):
	queryset = Group.objects.all()
	serializer_class = GroupSerializer

	permission_classes = [AnyPermissions]
	any_permission_classes = [[permissions.GroupMember], [permissions.ReadOnly]]

	filter_fields = ('groupprofile__group_type', 'name', 'id')

	@action(permission_classes=[permissions.GroupMember])
	def update_groups(self, request, *args, **kwargs):
		if not request.user:
			return Response({'error': 'Not logged in'})
		groups = Group.objects.all()
		user_groups = request.user.groups.all()
		dirty = False
		for group in groups:
			if group in user_groups:
				continue

			try:
				editor_list = group.groupprofile.editors
				print editor_list
				if request.user.username in editor_list:
					request.user.groups.add(group)

					editor_list.remove(request.user.username)
					group.groupprofile.editors = editor_list
					group.groupprofile.save()
					dirty = True
			except ValueError:
				print 'JSON parse failure'
				pass
		if dirty:
			request.user.save()

		return Response({'groups': GroupSerializer(request.user.groups.all()).data})

	@action(permission_classes=[permissions.GroupMember])
	def add_editor(self, request, pk=None):
		group = get_object_or_404(Group.objects.all(), pk=pk)
		try:
			editor_list = group.groupprofile.editors
			name = request.DATA.get('name')

			if name and not name in editor_list:
				editor_list.append(name)

			group.groupprofile.editors = editor_list
			group.groupprofile.save()
		except ValueError:
			return Response({'error': 'JSON error'})

		return Response(GroupSerializer(group).data)

class GroupProfileViewSet(viewsets.ModelViewSet):
	queryset = GroupProfile.objects.all()
	serializer_class = GroupProfileSerializer

class StudentGroupViewSet(viewsets.ModelViewSet):
	queryset = StudentGroup.objects.all()
	serializer_class = StudentGroupSerializer
	permission_classes = [AnyPermissions]
	any_permission_classes = [
		[permissions.IsEditor],
		[permissions.StudentGovernmentAndReadOnly]
	]

	filter_fields = ('name', 'governing_board__name', 'governing_board__id')

class AllocationViewSet(viewsets.ModelViewSet):
	queryset = Allocation.objects.all()
	serializer_class = AllocationSerializer

	permission_classes = [permissions.StudentGovernmentAndReadOnly]

	class AllocationFilter(django_filters.FilterSet):
		min_value = django_filters.NumberFilter(name='value', lookup_type='gte')
		max_value = django_filters.NumberFilter(name='value', lookup_type='lte')
		min_year = django_filters.NumberFilter(name='year', lookup_type='gte')
		max_year = django_filters.NumberFilter(name='year', lookup_type='lte')
		class Meta:
			model = Allocation
			fields = ('value', 'source__id', 'recipient__id', 'min_value', 'max_value', 'min_year', 'max_year')

	filter_class = AllocationFilter

	

class FundingRequestViewSet(viewsets.ModelViewSet):
	queryset = FundingRequest.objects.all()
	serializer_class = FundingRequestSerializer

	permission_classes = [permissions.ReadOnly]

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
			fields = ('status', 'min_requested', 'max_requested', 'min_allocated', 'max_allocated', 'created_after', 'created_before', 'submitted_after', 'submitted_before', 'requester__id', 'funder__id')

	filter_class = FundingFilter

class JCCCApplicationViewSet(viewsets.ModelViewSet):
	queryset = JCCCApplication.objects.all()
	serializer_class = JCCCApplicationSerializer
	permission_classes = [permissions.IsEditor]

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
			fields = ('status', 'min_requested', 'max_requested', 'min_allocated', 'max_allocated', 'created_after', 'created_before', 'submitted_after', 'submitted_before', 'requester__id', 'funder__id', 'contact__id')

	filter_class = JCCCApplicationFilter

class CIFApplicationViewSet(viewsets.ModelViewSet):
	queryset = CIFApplication.objects.all()
	serializer_class = CIFApplicationSerializer
	permission_classes = [permissions.IsEditor]

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
			fields = ('status', 'min_requested', 'max_requested', 'min_allocated', 'max_allocated', 'created_after', 'created_before', 'submitted_after', 'submitted_before', 'requester__id', 'funder__id', 'contact__id')

	filter_class = CIFApplicationFilter
	

class ESCProjectGrantApplicationViewSet(viewsets.ModelViewSet):
	queryset = ESCProjectGrantApplication.objects.all()
	serializer_class = ESCProjectGrantApplicationSerializer

	permission_classes = [permissions.IsEditor]

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
			fields = ('status', 'min_requested', 'max_requested', 'min_allocated', 'max_allocated', 'created_after', 'created_before', 'submitted_after', 'submitted_before', 'requester__id', 'funder__id', 'contact__id')

	filter_class = ESCProjectGrantApplicationFilter
