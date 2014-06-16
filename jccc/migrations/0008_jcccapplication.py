# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):
    dependencies = [
        ('jccc', '0007_escprojectgrantapplication'),
    ]

    operations = [
        migrations.CreateModel(
            name='JCCCApplication',
            fields=[
                ('fundingrequest_ptr',
                 models.OneToOneField(auto_created=True, primary_key=True, to_field='id',
                                      serialize=False, to='jccc.FundingRequest')),
                ('description', models.TextField(blank=True)),
                ('event_name', models.CharField(max_length=128)),
                ('event_time', models.DateTimeField()),
                ('event_location', models.CharField(max_length=128, blank=True)),
                ('event_attendance', models.IntegerField(blank=True)),
                ('event_recurring', models.BooleanField(default=False)),
                ('event_description', models.TextField(blank=True)),
                ('event_advertisement', models.TextField(blank=True)),
                ('event_audience', models.TextField(blank=True)),
                ('current_balance', models.FloatField(default=0.0)),
                ('alternate_funding', models.TextField(blank=True)),
                ('alternate_plans', models.TextField(blank=True)),
                ('advisor_advice', models.TextField(blank=True)),
                ('endorsement', models.TextField(blank=True)),
            ],
            options={
            },
            bases=('jccc.fundingrequest',),
        ),
    ]
