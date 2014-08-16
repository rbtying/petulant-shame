# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('jccc', '0016_auto_20140731_1313'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='allocation',
            options={'ordering': [b'-year']},
        ),
        migrations.AlterField(
            model_name='cifapplication',
            name='best_case_budget',
            field=jsonfield.fields.JSONField(default={}),
        ),
        migrations.AlterField(
            model_name='cifapplication',
            name='moderate_case_budget',
            field=jsonfield.fields.JSONField(default={}),
        ),
        migrations.AlterField(
            model_name='cifapplication',
            name='worst_case_budget',
            field=jsonfield.fields.JSONField(default={}),
        ),
    ]
