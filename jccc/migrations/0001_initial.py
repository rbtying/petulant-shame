# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='GroupProfile',
            fields=[
                ('group', models.OneToOneField(primary_key=True, to_field='id', serialize=False, to='auth.Group')),
                ('group_type', models.CharField(default=b'NONE', max_length=4, choices=[(b'NONE', b'None'), (b'CNCL', b'Student Council'), (b'GBRD', b'Governing Board')])),
                ('editors', jsonfield.fields.JSONField(default=[])),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
