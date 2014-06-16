# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields


class Migration(migrations.Migration):
    dependencies = [
        ('jccc', '0001_initial'),
        ('auth', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentGroup',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True,
                                        primary_key=True)),
                ('name', models.CharField(max_length=256)),
                ('governing_board', models.ForeignKey(to='auth.Group', to_field='id', null=True)),
                ('proportion_cc', models.FloatField(default=0.0)),
                ('proportion_seas', models.FloatField(default=0.0)),
                ('proportion_bc', models.FloatField(default=0.0)),
                ('proportion_gs', models.FloatField(default=0.0)),
                ('proportion_grad', models.FloatField(default=0.0)),
                ('mission', models.TextField(blank=True)),
                ('sga_acct_number', models.CharField(default=b'N/A', max_length=24, blank=True)),
                ('cu_acct_number', models.CharField(default=b'N/A', max_length=24, blank=True)),
                ('cu_dept_number', models.CharField(default=b'N/A', max_length=24, blank=True)),
                ('cu_proj_number', models.CharField(default=b'N/A', max_length=24, blank=True)),
                ('editors', jsonfield.fields.JSONField(default=[])),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
