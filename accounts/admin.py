from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Vendedor

# Classe para customizar como o modelo Vendedor é exibido no painel de admin.
# Herdamos de UserAdmin para já ter um layout otimizado para usuários.
class VendedorAdmin(UserAdmin):
    # Campos que serão exibidos na lista de vendedores
    list_display = ('email', 'first_name', 'is_staff', 'is_active')
    
    # Campos que podem ser usados para buscar um vendedor
    search_fields = ('email', 'first_name')
    
    # Campos que podem ser usados para filtrar
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    
    # Organização dos campos na tela de edição do vendedor
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações Pessoais', {'fields': ('first_name', 'last_name', 'telefone', 'comissao_padrao')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Campos que serão exibidos na tela de criação de um novo vendedor
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password', 'password2'),
        }),
    )
    
    # Campo usado para ordenar a lista
    ordering = ('email',)

# Esta é a linha mais importante: ela registra nosso modelo Vendedor
# com a classe de customização VendedorAdmin no site de administração.
admin.site.register(Vendedor, VendedorAdmin)