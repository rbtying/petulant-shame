from models import *
from rest_framework import serializers


def check_json_list(attrs, source):
    ed = attrs[source]
    if not isinstance(ed, list):
        raise serializers.ValidationError('Value is not a list')
    return attrs


class UserSerializer(serializers.ModelSerializer):
    on_council = serializers.Field(source='on_council')

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'groups', 'on_council')


class GroupProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupProfile


class GroupSerializer(serializers.ModelSerializer):
    groupprofile = GroupProfileSerializer()

    class Meta:
        model = Group
        fields = ('id', 'name', 'user_set', 'groupprofile', 'studentgroup_set')


class StudentGroupPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentGroup
        fields = ('id', 'name', 'governing_board', 'mission', 'proportion_cc', 'proportion_bc',
                  'proportion_seas', 'proportion_gs', 'proportion_grad')


class AllocationSerializer(serializers.ModelSerializer):
    def validate_year(self, attrs, source):
        if attrs[source] < 0:
            raise serializers.ValidationError('Year must be positive')
        return attrs

    class Meta:
        model = Allocation
        fields = ('id', 'value', 'source', 'recipient', 'year')


class StudentGroupSerializer(serializers.ModelSerializer):
    allocation = AllocationSerializer(source='allocation', read_only=True)

    @staticmethod
    def check_float_range(value):
        if value < 0 or value > 1.0:
            raise serializers.ValidationError('Value must be between 0.0 and 1.0')

    def validate_proportion_cc(self, attrs, source):
        value = attrs[source]
        self.check_float_range(value)
        return attrs

    def validate_proportion_bc(self, attrs, source):
        value = attrs[source]
        self.check_float_range(value)
        return attrs

    def validate_proportion_seas(self, attrs, source):
        value = attrs[source]
        self.check_float_range(value)
        return attrs

    def validate_proportion_gs(self, attrs, source):
        value = attrs[source]
        self.check_float_range(value)
        return attrs

    def validate_proportion_grad(self, attrs, source):
        value = attrs[source]
        self.check_float_range(value)
        return attrs

    def validate_editors(self, attrs, source):
        return check_json_list(attrs, source)

    def validate(self, attrs):
        total_membership = attrs['proportion_bc'] + attrs['proportion_gs'] + attrs[
            'proportion_cc'] + attrs['proportion_grad'] + attrs['proportion_seas']
        if total_membership < 0 or total_membership > 1.0:
            raise serializers.ValidationError('Sum of proportions must be between 0.0 and 1.0')

        return attrs

    class Meta:
        model = StudentGroup
        fields = (
        'id', 'name', 'editors', 'governing_board', 'mission', 'proportion_cc', 'proportion_bc',
        'proportion_seas', 'proportion_gs', 'proportion_grad', 'sga_acct_number', 'cu_acct_number',
        'cu_dept_number', 'cu_proj_number', 'allocation')



def validate_attrs(attrs):
    if attrs['status'] != FundingRequest.STATUS_PENDING:
        if attrs['requested_amount'] < 0:
            raise serializers.ValidationError('Must request positive amount')
        if not attrs['funder']:
            raise serializers.ValidationError('Must request from at least one funder')
        if not attrs['contact'] or not attrs['contact_phone'] or not attrs['contact_position']:
            raise serializers.ValidationError('Must provide contact information')

    return attrs


class AttachedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttachedFile


class FundingRequestSerializer(serializers.ModelSerializer):
    attachments = AttachedFileSerializer(source='attachedfile_set')

    def validate_editors(self, attrs, source):
        return check_json_list(attrs, source)

    def validate(self, attrs):
        return validate_attrs(attrs)

    class Meta:
        model = FundingRequest
        fields = (
        'id', 'title', 'requested_amount', 'approved_amount', 'status', 'notes', 'created_time',
        'updated_time', 'submitted_time', 'scheduled_time', 'requester', 'funder', 'contact',
        'contact_phone', 'contact_position', 'editors', 'attachments')


class JCCCApplicationSerializer(serializers.ModelSerializer):
    def get_fields(self, *args, **kwargs):
        fields = super(JCCCApplicationSerializer, self).get_fields(*args, **kwargs)
        request = self.context.get('request', None)
        view = self.context.get('view', None)
        if request and view and getattr(view, 'object', None):
			fields['status'].read_only = True
			fields['notes'].read_only = True
			fields['approved_amount'].read_only = True
			fields['endorsement'].read_only = True

        return fields

    def validate_editors(self, attrs, source):
        return check_json_list(attrs, source)

    class Meta:
        model = JCCCApplication
        fields = (
        'id', 'title', 'requested_amount', 'approved_amount', 'status', 'notes', 'created_time',
        'updated_time', 'submitted_time', 'scheduled_time', 'requester', 'funder', 'contact',
        'contact_phone', 'contact_position', 'editors', 'description', 'event_name', 'event_time',
        'event_location', 'event_attendance', 'event_recurring', 'event_description',
        'event_advertisement', 'event_audience', 'current_balance', 'alternate_funding',
        'alternate_plans', 'advisor_advice', 'endorsement')
        depth = 0


class CIFApplicationSerializer(serializers.ModelSerializer):
    attachments = AttachedFileSerializer(source='attachedfile_set')

    def get_fields(self, *args, **kwargs):
        fields = super(CIFApplicationSerializer, self).get_fields(*args, **kwargs)
        request = self.context.get('request', None)
        view = self.context.get('view', None)
        if request and view and getattr(view, 'object', None):
            if not request.user.on_council():
                fields['status'].read_only = True
                fields['notes'].read_only = True
                fields['approved_amount'].read_only = True
        return fields

    def validate_editors(self, attrs, source):
        return check_json_list(attrs, source)

    def validate_best_case_budget(self, attrs, source):
        return check_json_list(attrs, source)

    def validate_moderate_case_budget(self, attrs, source):
        return check_json_list(attrs, source)

    def validate_worst_case_budget(self, attrs, source):
        return check_json_list(attrs, source)

    def validate(self, attrs):
        if attrs['status'] != FundingRequest.STATUS_PENDING:
            tocheck = ('description', 'financial_history', 'roadblock', 'best_case_description',
                       'moderate_case_description', 'worst_case_description')
            for c in tocheck:
                if not attrs[c]:
                    raise serializers.ValidationError('Must have a %s' % c)
        return validate_attrs(attrs)

    class Meta:
        model = CIFApplication
        fields = (
        'id', 'title', 'requested_amount', 'approved_amount', 'status', 'notes', 'created_time',
        'updated_time', 'submitted_time', 'scheduled_time', 'requester', 'funder', 'contact',
        'contact_phone', 'contact_position', 'editors', 'description', 'financial_history',
        'roadblock', 'best_case_description', 'moderate_case_description', 'worst_case_description',
        'endorsement', 'attachments')


class ESCProjectGrantApplicationSerializer(serializers.ModelSerializer):
    attachments = AttachedFileSerializer(source='attachedfile_set')

    def get_fields(self, *args, **kwargs):
        fields = super(ESCProjectGrantApplicationSerializer, self).get_fields(*args, **kwargs)
        request = self.context.get('request', None)
        view = self.context.get('view', None)
        if request and view and getattr(view, 'object', None):
            if not request.user.on_council():
                fields['status'].read_only = True
                fields['notes'].read_only = True
                fields['approved_amount'].read_only = True
        return fields

    def validate_editors(self, attrs, source):
        return check_json_list(attrs, source)

    def validate_members(self, attrs, source):
        return check_json_list(attrs, source)

    def validate_materials(self, attrs, source):
        return check_json_list(attrs, source)

    def validate_advisor(self, attrs, source):
        return check_json_list(attrs, source)

    def validate(self, attrs):
        if attrs['status'] != FundingRequest.STATUS_PENDING:
            tocheck = (
            'description', 'tools', 'workload', 'fund_usage', 'schedule', 'safety', 'failure',
            'feasibility', 'benefit', 'donation', 'advisor')
            for c in tocheck:
                if not attrs[c]:
                    raise serializers.ValidationError('Must have a %s' % c)
        return validate_attrs(attrs)

    class Meta:
        model = ESCProjectGrantApplication
        fields = (
        'id', 'title', 'requested_amount', 'approved_amount', 'status', 'notes', 'created_time',
        'updated_time', 'submitted_time', 'scheduled_time', 'funder', 'contact', 'contact_phone',
        'contact_position', 'editors', 'members', 'description', 'materials', 'tools', 'workload',
        'fund_usage', 'schedule', 'safety', 'failure', 'feasibility', 'benefit', 'donation',
        'additional', 'advisor', 'attachments')
