import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('map_app', '0005_monument_monumentsuggestion'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ContactMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, default='', max_length=120)),
                ('contact', models.CharField(blank=True, default='', max_length=200)),
                ('message', models.TextField()),
                ('status', models.CharField(choices=[('new', 'Нове'), ('read', 'Прочитано')], default='new', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='contact_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='contactmessage',
            index=models.Index(fields=['status', 'created_at'], name='map_app_con_status_0e2bb0_idx'),
        ),
        migrations.AddIndex(
            model_name='contactmessage',
            index=models.Index(fields=['created_at'], name='map_app_con_created_0b9d46_idx'),
        ),
    ]
