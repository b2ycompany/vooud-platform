from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import VendedorManager

class Vendedor(AbstractUser):
    # Desabilitamos o campo username padrão
    username = None
    
    # Definimos email como o campo único e de login
    email = models.EmailField('endereço de email', unique=True)

    # Nossos campos customizados
    telefone = models.CharField(max_length=20, blank=True, null=True)
    comissao_padrao = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # --- CORREÇÃO CRÍTICA ---
    # O campo 'email' será usado para login
    USERNAME_FIELD = 'email'
    # Como não usamos 'username', a lista de campos obrigatórios para o comando
    # 'createsuperuser' deve estar vazia.
    REQUIRED_FIELDS = []

    # Conectamos nosso gerente customizado
    objects = VendedorManager()

    def __str__(self):
        return self.email