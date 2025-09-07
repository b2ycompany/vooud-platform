from django.contrib.auth.models import BaseUserManager

# Este é o nosso Gerente de Usuários customizado.
# Ele herda de BaseUserManager para ter a base de gerenciamento de usuários do Django.
class VendedorManager(BaseUserManager):
    """
    Gerente customizado para o nosso modelo Vendedor,
    que utiliza email como principal identificador em vez de username.
    """

    # Esta função será usada para criar um usuário comum (não-admin).
    def create_user(self, email, password, **extra_fields):
        """
        Cria e salva um Vendedor com o email e senha fornecidos.
        """
        if not email:
            raise ValueError('O Email deve ser definido')
        
        # Normaliza o email (ex: converte o domínio para minúsculas)
        email = self.normalize_email(email)
        
        # Cria a instância do modelo Vendedor
        user = self.model(email=email, **extra_fields)
        
        # Define a senha de forma segura (fazendo o hash)
        user.set_password(password)
        
        # Salva o usuário no banco de dados
        user.save(using=self._db)
        return user

    # Esta função será usada pelo comando 'createsuperuser'.
    def create_superuser(self, email, password, **extra_fields):
        """
        Cria e salva um Superusuário (Vendedor com privilégios de admin).
        """
        # Garante que um superusuário tenha as permissões corretas
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superusuário deve ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superusuário deve ter is_superuser=True.')
        
        # Usa a função create_user que definimos acima para criar o usuário base
        return self.create_user(email, password, **extra_fields)