# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):
    dependencies = [
        ('jccc', '0002_studentgroup'),
        ('auth', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='Allocation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True,
                                        primary_key=True)),
                ('value', models.FloatField()),
                ('source', models.ForeignKey(to='auth.Group', to_field='id')),
                ('recipient', models.ForeignKey(to='jccc.StudentGroup', to_field='id')),
                ('year', models.IntegerField()),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
