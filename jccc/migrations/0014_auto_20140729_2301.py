# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jccc', '0013_auto_20140728_1754'),
    ]

    operations = [
        migrations.AlterField(
            model_name='attachedfile',
            name='attachment',
            field=models.FileField(upload_to=b'%Y/%m/'),
        ),
    ]
