# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jccc', '0014_auto_20140729_2301'),
    ]

    operations = [
        migrations.AddField(
            model_name='jcccapplication',
            name='other',
            field=models.TextField(default='', blank=True),
            preserve_default=False,
        ),
    ]
