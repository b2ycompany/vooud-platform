from django.contrib import admin
from .models import Loja, Quiosque, InventarioQuiosque, Venda, ItemVenda

class InventarioQuiosqueInline(admin.TabularInline):
    model = InventarioQuiosque
    extra = 1
    autocomplete_fields = ['joia']

@admin.register(Loja)
class LojaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'endereco', 'data_criacao')
    search_fields = ('nome', 'endereco')

@admin.register(Quiosque)
class QuiosqueAdmin(admin.ModelAdmin):
    list_display = ('identificador', 'loja', 'vendedor_responsavel', 'capacidade_joias')
    list_filter = ('loja',)
    search_fields = ('identificador', 'vendedor_responsavel__email')
    autocomplete_fields = ('loja', 'vendedor_responsavel')
    inlines = [InventarioQuiosqueInline]

# --- NOVAS CONFIGURAÇÕES DE ADMIN PARA VENDAS ---

class ItemVendaInline(admin.TabularInline):
    model = ItemVenda
    extra = 0 # Não mostrar linhas extras por padrão em vendas existentes
    readonly_fields = ('preco_venda_unitario_momento', 'preco_custo_unitario_momento')
    autocomplete_fields = ['joia']

@admin.register(Venda)
class VendaAdmin(admin.ModelAdmin):
    list_display = ('id', 'vendedor', 'quiosque', 'data_venda', 'total_venda')
    list_filter = ('quiosque', 'vendedor')
    date_hierarchy = 'data_venda'
    # Os totais devem ser calculados pela API, então são apenas leitura no admin
    readonly_fields = ('total_venda', 'total_custo')
    inlines = [ItemVendaInline]