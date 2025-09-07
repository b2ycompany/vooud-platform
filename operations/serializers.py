from rest_framework import serializers
from django.db import transaction
from .models import Cliente, Venda, ItemVenda, Quiosque, InventarioQuiosque
from catalog.models import Joia

# --- SERIALIZERS DE VENDA (JÁ EXISTENTES) ---

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['nome', 'email', 'whatsapp']

class ItemVendaInputSerializer(serializers.Serializer):
    joia_id = serializers.UUIDField()
    quantidade = serializers.IntegerField(min_value=1)

class VendaCreateSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer()
    itens = ItemVendaInputSerializer(many=True)

    class Meta:
        model = Venda
        fields = ['quiosque', 'vendedor', 'cliente', 'metodo_pagamento', 'desconto', 'itens']

    def create(self, validated_data):
        with transaction.atomic():
            cliente_data = validated_data.pop('cliente')
            itens_data = validated_data.pop('itens')
            cliente, created = Cliente.objects.get_or_create(email=cliente_data['email'], defaults=cliente_data)
            venda = Venda.objects.create(cliente=cliente, **validated_data)
            
            total_venda_bruto = 0
            total_custo = 0
            total_comissao = 0

            for item_data in itens_data:
                joia = Joia.objects.get(id=item_data['joia_id'])
                quantidade = item_data['quantidade']
                
                estoque_item = InventarioQuiosque.objects.get(quiosque=venda.quiosque, joia=joia)
                if estoque_item.quantidade < quantidade:
                    raise serializers.ValidationError(f"Estoque insuficiente para a joia {joia.nome}. Disponível: {estoque_item.quantidade}")
                
                estoque_item.quantidade -= quantidade
                estoque_item.save()

                preco_venda_item = joia.preco_venda * quantidade
                comissao_item = preco_venda_item * (joia.percentual_comissao / 100)
                
                ItemVenda.objects.create(
                    venda=venda, joia=joia, quantidade=quantidade,
                    preco_venda_unitario_momento=joia.preco_venda,
                    preco_custo_unitario_momento=joia.preco_custo,
                    comissao_calculada=comissao_item
                )
                
                total_venda_bruto += preco_venda_item
                total_custo += joia.preco_custo * quantidade
                total_comissao += comissao_item

            venda.total_venda = total_venda_bruto - venda.desconto
            venda.total_custo = total_custo
            venda.total_comissao = total_comissao
            venda.save()
            return venda

# --- NOVOS SERIALIZERS PARA LISTAR O INVENTÁRIO ---

class JoiaInventarioSerializer(serializers.ModelSerializer):
    """ Serializer simplificado para a Joia dentro do inventário """
    class Meta:
        model = Joia
        fields = ['id', 'nome', 'sku', 'preco_venda']

class InventarioQuiosqueListSerializer(serializers.ModelSerializer):
    """ Serializer para cada item do inventário, com detalhes da joia aninhados """
    joia = JoiaInventarioSerializer(read_only=True)
    class Meta:
        model = InventarioQuiosque
        fields = ['id', 'joia', 'quantidade']