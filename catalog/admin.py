from django.contrib import admin
from .models import Categoria, Joia

# Registra o modelo Categoria no site de administração
admin.site.register(Categoria)

# Customiza a exibição do modelo Joia no admin
@admin.register(Joia)
class JoiaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'sku', 'categoria', 'preco_venda', 'material')
    list_filter = ('categoria', 'material')
    search_fields = ('nome', 'sku', 'descricao')