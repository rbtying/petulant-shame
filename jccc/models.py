from datetime import datetime
import os

from django.db import models
from django.contrib.auth.models import User, Group
from jsonfield import JSONField
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver


# Create your models here.

# adding types to groups
class GroupProfile(models.Model):
    group = models.OneToOneField(Group, primary_key=True)
    full_name = models.CharField(max_length=128, default='')

    NONE_GROUP_TYPE = 'NONE'
    COUNCIL_GROUP_TYPE = 'CNCL'
    GOV_BOARD_GROUP_TYPE = 'GBRD'
    GROUP_TYPES = (
        (NONE_GROUP_TYPE, 'None'),
        (COUNCIL_GROUP_TYPE, 'Student Council'),
        (GOV_BOARD_GROUP_TYPE, 'Governing Board'),
    )

    group_type = models.CharField(
        max_length=4,
        null=False,
        blank=False,
        choices=GROUP_TYPES,
        default=NONE_GROUP_TYPE
    )

    editors = JSONField(default=[])

    def __str__(self):
        return '%s profile' % str(self.group)


def create_group_profile(sender, instance, created, **kwargs):
    if created:
        GroupProfile.objects.create(group=instance, full_name=instance.name)
    else:
        instance.groupprofile.save()


post_save.connect(create_group_profile, sender=Group)


def group_type(self):
    """
    Returns a given group's type
    """
    try:
        return self.groupprofile.group_type
    except:
        return GroupProfile.NONE_GROUP_TYPE


setattr(Group, 'group_type', group_type)


def on_council(self):
    """
    Checks if the user is on council or not
    """
    groups = self.groups(manager='objects').all()
    for group in groups:
        if group.group_type() == GroupProfile.COUNCIL_GROUP_TYPE:
            return True
    return False

def on_governing_board(self):
    """
    Checks if the user is on a governing board or not
    """
    groups = self.groups(manager='objects').all()
    for group in groups:
        if group.group_type() == GroupProfile.GOV_BOARD_GROUP_TYPE:
            return True
    return False


setattr(User, 'on_council', on_council)
setattr(User, 'on_governing_board', on_governing_board)


class StudentGroup(models.Model):
    name = models.CharField(max_length=256, blank=False)
    governing_board = models.ForeignKey(Group, null=True, blank=False)

    proportion_cc = models.FloatField(default=0.0)
    proportion_seas = models.FloatField(default=0.0)
    proportion_bc = models.FloatField(default=0.0)
    proportion_gs = models.FloatField(default=0.0)
    proportion_grad = models.FloatField(default=0.0)

    mission = models.TextField(blank=True)

    # transfer details
    sga_acct_number = models.CharField(max_length=24, blank=True, default='N/A')
    cu_acct_number = models.CharField(max_length=24, blank=True, default='N/A')
    cu_dept_number = models.CharField(max_length=24, blank=True, default='N/A')
    cu_proj_number = models.CharField(max_length=24, blank=True, default='N/A')

    editors = JSONField(default=[])

    def __str__(self):
        return self.name

    def allocation(self):
        try:
            return self.allocation_set.first()
        except Allocation.DoesNotExist:
            return None

class Allocation(models.Model):
    value = models.FloatField()
    source = models.ForeignKey(Group)
    recipient = models.ForeignKey(StudentGroup)
    year = models.IntegerField()

    class Meta:
        unique_together = ('recipient', 'year')
        ordering = ['-year']

    def __str__(self):
        return '%d:[$%.02f] %s -> %s' % (
        self.year, self.value, str(self.source), str(self.recipient))


class FundingRequest(models.Model):
    STATUS_PENDING = 'PEND'
    STATUS_SUBMITTED = 'SUBM'
    STATUS_SCHEDULED = 'SCHD'
    STATUS_APPROVED = 'APRV'
    STATUS_DENIED = 'DENY'
    STATUS_FILED = 'FILE'
    STATUS_COMPLETE = 'COMP'
    STATUS_TYPES = (
        (STATUS_PENDING, 'Pending'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_DENIED, 'Denied'),
        (STATUS_FILED, 'Filed'),
        (STATUS_COMPLETE, 'Complete')
    )

    # request basics
    title = models.CharField(max_length=384, blank=False)
    requested_amount = models.FloatField(default=0.0)
    approved_amount = models.FloatField(null=True, default=0.0)
    status = models.CharField(max_length=4, choices=STATUS_TYPES, default=STATUS_PENDING)
    notes = models.TextField(blank=True)

    # dates
    created_time = models.DateTimeField(auto_now_add=True)
    updated_time = models.DateTimeField(auto_now=True)
    submitted_time = models.DateTimeField(null=True)
    scheduled_time = models.DateTimeField(null=True)

    projected_expenditures = models.FloatField(null=True)
    projected_revenues = models.FloatField(null=True)
    actual_expenditures = models.FloatField(null=True)
    actual_revenues = models.FloatField(null=True)

    transferred_amount = models.FloatField(null=True)

    # group details
    requester = models.ForeignKey(StudentGroup, null=True)
    funder = models.ManyToManyField(Group, null=False)

    # user details
    contact = models.ForeignKey(User)
    contact_phone = models.CharField(max_length=16, blank=True)
    contact_position = models.CharField(max_length=32, blank=True)

    # unregistered user proxy
    editors = JSONField(default=[])

    def __str__(self):
        return self.title


@receiver(pre_save)
def check_stuff(sender, instance, **kwargs):
    if not isinstance(instance, FundingRequest):
        return False

    if instance.status == FundingRequest.STATUS_SUBMITTED:
        instance.submitted_time = datetime.utcnow()

    if not instance.contact.email in instance.editors:
        instance.editors.append(instance.contact.email)


class JCCCApplication(FundingRequest):
    description = models.TextField(blank=True)

    event_name = models.CharField(max_length=128)

    event_time = models.DateTimeField(null=True)
    event_location = models.CharField(max_length=128, blank=True)
    event_attendance = models.IntegerField(blank=True)
    event_recurring = models.BooleanField(default=False)
    event_description = models.TextField(blank=True)

    event_advertisement = models.TextField(blank=True)
    event_audience = models.TextField(blank=True)

    current_balance = models.FloatField(default=0.0)

    alternate_funding = models.TextField(blank=True)
    alternate_plans = models.TextField(blank=True)
    advisor_advice = models.TextField(blank=True)

    endorsement = models.TextField(blank=True)

    other = models.TextField(blank=True)


class CIFApplication(FundingRequest):
    description = models.TextField(blank=True)

    financial_history = models.TextField(blank=True)

    roadblock = models.TextField(blank=True)

    best_case_description = models.TextField(blank=True)
    best_case_budget = JSONField(default={})

    moderate_case_description = models.TextField(blank=True)
    moderate_case_budget = JSONField(default={})

    worst_case_description = models.TextField(blank=True)
    worst_case_budget = JSONField(default={})

    endorsement = models.TextField(blank=True)


class ESCProjectGrantApplication(FundingRequest):
    members = JSONField(default=[])
    description = models.TextField(blank=True)
    materials = JSONField(default=[])
    tools = models.TextField(blank=True)
    workload = models.TextField(blank=True)
    fund_usage = models.TextField(blank=True)
    schedule = models.TextField(blank=True)
    safety = models.TextField(blank=True)
    failure = models.TextField(blank=True)
    feasibility = models.TextField(blank=True)
    benefit = models.TextField(blank=True)
    donation = models.TextField(blank=True)
    additional = models.TextField(blank=True)

    advisor = JSONField(default=[])


class AttachedFile(models.Model):
    request = models.ForeignKey(FundingRequest)
    name = models.CharField(max_length=384)

    attachment = models.FileField(upload_to='%Y/%m/')
    created_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '%s: %s' % (str(self.request), self.name)


@receiver(post_delete, sender=AttachedFile)
def delete_file_on_delete(sender, instance, **kwrags):
    if instance.attachment:
        if os.path.isfile(instance.attachment.path):
            os.remove(instance.attachment.path)


@receiver(pre_save, sender=AttachedFile)
def delete_file_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return False
    try:
        old_file = AttachedFile.objects.get(pk=instance.pk).attachment
    except AttachedFile.DoesNotExist:
        return False
    new_file = instance.attachment

    if not old_file == new_file:
        if os.path.isfile(old_file.path):
            os.remove(old_file.path)

