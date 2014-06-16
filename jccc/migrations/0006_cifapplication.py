# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields


class Migration(migrations.Migration):
    dependencies = [
        ('jccc', '0005_attachedfile'),
    ]

    operations = [
        migrations.CreateModel(
            name='CIFApplication',
            fields=[
                ('fundingrequest_ptr',
                 models.OneToOneField(auto_created=True, primary_key=True, to_field='id',
                                      serialize=False, to='jccc.FundingRequest')),
                ('description', models.TextField(blank=True)),
                ('financial_history', models.TextField(blank=True)),
                ('roadblock', models.TextField(blank=True)),
                ('best_case_description', models.TextField(blank=True)),
                ('best_case_budget', jsonfield.fields.JSONField(default=[])),
                ('moderate_case_description', models.TextField(blank=True)),
                ('moderate_case_budget', jsonfield.fields.JSONField(default=[])),
                ('worst_case_description', models.TextField(blank=True)),
                ('worst_case_budget', jsonfield.fields.JSONField(default=[])),
                ('endorsement', models.TextField(blank=True)),
            ],
            options={
            },
            bases=('jccc.fundingrequest',),
        ),
    ]
