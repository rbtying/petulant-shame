# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jccc', '0008_jcccapplication'),
    ]

    operations = [
        migrations.AddField(
            model_name='groupprofile',
            name='full_name',
            field=models.CharField(default=b'', max_length=128),
            preserve_default=True,
        ),
    ]
