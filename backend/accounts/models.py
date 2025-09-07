from django.db import models
from django.contrib.auth.models import AbstractUser

# 1. Importamos nosso gerente customizado
from .managers import VendedorManager


class Vendedor(AbstractUser):
    username = None
    email = models.EmailField('endereço de email', unique=True)

    telefone = models.CharField(max_length=20, blank=True, null=True)
    comissao_padrao = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.00
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    # 2. Conectamos o VendedorManager ao nosso modelo.
    #    Agora, sempre que o Django for criar um usuário através deste modelo,
    #    ele usará as regras que definimos no nosso gerente.
    objects = VendedorManager()

    def __str__(self):
        return self.email