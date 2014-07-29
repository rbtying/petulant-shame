# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jccc', '0009_groupprofile_full_name'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='allocation',
            unique_together=set([(b'source', b'recipient', b'year')]),
        ),
    ]
