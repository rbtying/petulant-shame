# encoding: utf8
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):
    dependencies = [
        ('jccc', '0004_fundingrequest'),
    ]

    operations = [
        migrations.CreateModel(
            name='AttachedFile',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True,
                                        primary_key=True)),
                ('request', models.ForeignKey(to='jccc.FundingRequest', to_field='id')),
                ('name', models.CharField(max_length=384)),
                ('attachment', models.FileField(upload_to=b'/%Y/%m/')),
                ('created_time', models.DateTimeField(auto_now_add=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
