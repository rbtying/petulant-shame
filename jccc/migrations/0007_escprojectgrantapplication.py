# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields


class Migration(migrations.Migration):
    dependencies = [
        ('jccc', '0006_cifapplication'),
    ]

    operations = [
        migrations.CreateModel(
            name='ESCProjectGrantApplication',
            fields=[
                ('fundingrequest_ptr',
                 models.OneToOneField(auto_created=True, primary_key=True, to_field='id',
                                      serialize=False, to='jccc.FundingRequest')),
                ('members', jsonfield.fields.JSONField(default=[])),
                ('description', models.TextField(blank=True)),
                ('materials', jsonfield.fields.JSONField(default=[])),
                ('tools', models.TextField(blank=True)),
                ('workload', models.TextField(blank=True)),
                ('fund_usage', models.TextField(blank=True)),
                ('schedule', models.TextField(blank=True)),
                ('safety', models.TextField(blank=True)),
                ('failure', models.TextField(blank=True)),
                ('feasibility', models.TextField(blank=True)),
                ('benefit', models.TextField(blank=True)),
                ('donation', models.TextField(blank=True)),
                ('additional', models.TextField(blank=True)),
                ('advisor', jsonfield.fields.JSONField(default=[])),
            ],
            options={
            },
            bases=('jccc.fundingrequest',),
        ),
    ]
