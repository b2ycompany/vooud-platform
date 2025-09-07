import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

Vendedor = get_user_model()

class Command(BaseCommand):
    """
    Comando Django para criar um superusuário de forma não-interativa.
    Lê as credenciais de variáveis de ambiente.
    """
    help = 'Cria um superusuário para o ambiente de produção.'

    def handle(self, *args, **options):
        email = os.environ.get('SUPERUSER_EMAIL')
        password = os.environ.get('SUPERUSER_PASSWORD')

        if not email or not password:
            self.stdout.write(self.style.ERROR('As variáveis de ambiente SUPERUSER_EMAIL e SUPERUSER_PASSWORD devem ser definidas.'))
            return

        if Vendedor.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(f'Superusuário com o email {email} já existe.'))
        else:
            Vendedor.objects.create_superuser(email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superusuário {email} criado com sucesso!'))