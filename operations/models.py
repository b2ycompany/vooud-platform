from django.db import models
from django.conf import settings
import uuid
from catalog.models import Joia

class Cliente(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True, blank=True, null=True)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name_plural = "Clientes"
        ordering = ['nome']
    def __str__(self):
        return self.nome

class Loja(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=200, help_text="Ex: Shopping Morumbi, Galeria do Rock")
    endereco = models.CharField(max_length=255, blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name_plural = "Lojas"
        ordering = ['nome']
    def __str__(self):
        return self.nome

class Quiosque(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identificador = models.CharField(max_length=100, unique=True, help_text="Um código único para o quiosque. Ex: QUIOSQUE-SP-01")
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='quiosques')
    vendedor_responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='quiosques_gerenciados'
    )
    capacidade_joias = models.PositiveIntegerField(default=50, help_text="Quantidade máxima de joias que o quiosque pode ter.")
    data_criacao = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name_plural = "Quiosques"
        ordering = ['identificador']
    def __str__(self):
        return f"{self.identificador} ({self.loja.nome})"

class InventarioQuiosque(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiosque = models.ForeignKey(Quiosque, on_delete=models.CASCADE, related_name='inventario')
    joia = models.ForeignKey(Joia, on_delete=models.CASCADE, related_name='estoque_em_quiosques')
    quantidade = models.PositiveIntegerField(default=0)
    data_atualizacao = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name_plural = "Itens de Inventário"
        constraints = [
            models.UniqueConstraint(fields=['quiosque', 'joia'], name='inventario_unico_por_joia_quiosque')
        ]
    def __str__(self):
        return f"{self.quantidade}x {self.joia.nome} no {self.quiosque.identificador}"

class Venda(models.Model):
    METODOS_PAGAMENTO = [
        ('PIX', 'Pix'),
        ('CC', 'Cartão de Crédito'),
        ('CD', 'Cartão de Débito'),
        ('DIN', 'Dinheiro'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiosque = models.ForeignKey(Quiosque, on_delete=models.PROTECT)
    vendedor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True)
    data_venda = models.DateTimeField(auto_now_add=True)
    
    # Adicionamos o 'default' aqui. 'PIX' será o valor padrão.
    metodo_pagamento = models.CharField(max_length=3, choices=METODOS_PAGAMENTO, default='PIX')
    
    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_venda = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_custo = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_comissao = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    class Meta:
        verbose_name_plural = "Vendas"
        ordering = ['-data_venda']
    def __str__(self):
        return f"Venda {self.id} por {self.vendedor.email}"

class ItemVenda(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    venda = models.ForeignKey(Venda, on_delete=models.CASCADE, related_name='itens')
    joia = models.ForeignKey(Joia, on_delete=models.PROTECT)
    quantidade = models.PositiveIntegerField(default=1)
    preco_venda_unitario_momento = models.DecimalField(max_digits=10, decimal_places=2)
    preco_custo_unitario_momento = models.DecimalField(max_digits=10, decimal_places=2)
    comissao_calculada = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        verbose_name_plural = "Itens da Venda"
    def __str__(self):
        return f"{self.quantidade}x {self.joia.nome} na Venda {self.venda.id}"