from django.urls import path
from .views import VendaCreateView, MeuQuiosqueInventarioView

urlpatterns = [
    path('vendas/', VendaCreateView.as_view(), name='create-venda'),
    path('meu-quiosque/inventario/', MeuQuiosqueInventarioView.as_view(), name='meu-quiosque-inventario'),
]