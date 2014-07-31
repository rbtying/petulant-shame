# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jccc', '0015_jcccapplication_other'),
    ]

    operations = [
        migrations.AddField(
            model_name='fundingrequest',
            name='projected_revenues',
            field=models.FloatField(null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='fundingrequest',
            name='actual_revenues',
            field=models.FloatField(null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='fundingrequest',
            name='transferred_amount',
            field=models.FloatField(null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='fundingrequest',
            name='actual_expenditures',
            field=models.FloatField(null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='fundingrequest',
            name='projected_expenditures',
            field=models.FloatField(null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='fundingrequest',
            name='status',
            field=models.CharField(default=b'PEND', max_length=4, choices=[(b'PEND', b'Pending'), (b'SUBM', b'Submitted'), (b'SCHD', b'Scheduled'), (b'APRV', b'Approved'), (b'DENY', b'Denied'), (b'FILE', b'Filed'), (b'COMP', b'Complete')]),
        ),
    ]
