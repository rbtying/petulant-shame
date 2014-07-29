# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jccc', '0012_auto_20140728_1750'),
    ]

    operations = [
        migrations.AlterField(
            model_name='jcccapplication',
            name='event_time',
            field=models.DateTimeField(null=True),
        ),
    ]
