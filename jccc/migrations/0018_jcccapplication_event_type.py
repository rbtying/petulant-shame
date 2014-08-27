# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jccc', '0017_auto_20140815_2222'),
    ]

    operations = [
        migrations.AddField(
            model_name='jcccapplication',
            name='event_type',
            field=models.CharField(default='Emergency Funding', max_length=32),
            preserve_default=False,
        ),
    ]
