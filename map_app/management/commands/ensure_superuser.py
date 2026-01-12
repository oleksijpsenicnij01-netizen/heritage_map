from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decouple import config

class Command(BaseCommand):
    help = "Create superuser if it doesn't exist (for Render deploy)"

    def handle(self, *args, **options):
        username = config('DJANGO_SUPERUSER_USERNAME', default=None)
        email = config('DJANGO_SUPERUSER_EMAIL', default='')
        password = config('DJANGO_SUPERUSER_PASSWORD', default=None)

        if not username or not password:
            self.stdout.write("Superuser env vars not set, skipping.")
            return

        User = get_user_model()
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write("Superuser created.")
        else:
            self.stdout.write("Superuser already exists.")
