from django.db import models
import uuid

class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True, help_text="Ex: Anéis, Colares, Pulseiras")
    class Meta:
        verbose_name_plural = "Categorias"
    def __str__(self):
        return self.nome

class Joia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True, help_text="Código único de referência do produto (SKU)")
    descricao = models.TextField(blank=True, null=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name='joias')
    material = models.CharField(max_length=100, help_text="Ex: Ouro 18k, Prata 925 com Zircônias")
    preco_custo = models.DecimalField(max_digits=10, decimal_places=2)
    preco_venda = models.DecimalField(max_digits=10, decimal_places=2)
    
    # NOVO CAMPO DE COMISSÃO
    percentual_comissao = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00, help_text="Percentual de comissão para o vendedor (ex: 10.00 para 10%)"
    )
    
    imagem = models.ImageField(upload_to='joias_imagens/', blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Joias"
        ordering = ['nome']
    def __str__(self):
        return f"{self.nome} ({self.sku})"