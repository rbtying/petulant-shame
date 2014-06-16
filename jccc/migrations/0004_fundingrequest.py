# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings
import jsonfield.fields


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('auth', '__first__'),
        ('jccc', '0003_allocation'),
    ]

    operations = [
        migrations.CreateModel(
            name='FundingRequest',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True,
                                        primary_key=True)),
                ('title', models.CharField(max_length=384)),
                ('requested_amount', models.FloatField(default=0.0)),
                ('approved_amount', models.FloatField(default=0.0, null=True)),
                ('status', models.CharField(default=b'PEND', max_length=4,
                                            choices=[(b'PEND', b'Pending'), (b'SUBM', b'Submitted'),
                                                     (b'SCHD', b'Scheduled'),
                                                     (b'APRV', b'Approved'),
                                                     (b'DENY', b'Denied')])),
                ('notes', models.TextField(blank=True)),
                ('created_time', models.DateTimeField(auto_now_add=True)),
                ('updated_time', models.DateTimeField(auto_now=True)),
                ('submitted_time', models.DateTimeField(null=True)),
                ('scheduled_time', models.DateTimeField(null=True)),
                ('requester', models.ForeignKey(to='jccc.StudentGroup', to_field='id', null=True)),
                ('contact', models.ForeignKey(to=settings.AUTH_USER_MODEL, to_field='id')),
                ('contact_phone', models.CharField(max_length=16, blank=True)),
                ('contact_position', models.CharField(max_length=32, blank=True)),
                ('editors', jsonfield.fields.JSONField(default=[])),
                ('funder', models.ManyToManyField(to='auth.Group')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
