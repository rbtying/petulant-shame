# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jccc', '0010_auto_20140728_1647'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='allocation',
            unique_together=set([(b'recipient', b'year')]),
        ),
    ]
