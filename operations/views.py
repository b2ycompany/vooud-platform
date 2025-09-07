from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import VendaCreateSerializer, InventarioQuiosqueListSerializer
from .models import Quiosque

# View para a raiz da API (ESSA PARTE ESTAVA FALTANDO)
class ApiRootView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "api_status": "online",
            "message": "Bem-vindo à API da VOOUD Joias!",
            "endpoints": {
                "admin": "/admin/",
                "register": "/api/accounts/register/",
                "login": "/api/token/",
                "token_refresh": "/api/token/refresh/",
                "vendas": "/api/operations/vendas/",
                "meu_inventario": "/api/operations/meu-quiosque/inventario/"
            }
        })

# View para criar vendas
class VendaCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.data['vendedor'] = request.user.id
        serializer = VendaCreateSerializer(data=request.data)
        if serializer.is_valid():
            venda = serializer.save()
            return Response({"message": "Venda registrada com sucesso!", "venda_id": venda.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# View para buscar o inventário do vendedor logado
class MeuQuiosqueInventarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendedor = request.user
        try:
            quiosque = Quiosque.objects.get(vendedor_responsavel=vendedor)
            inventario = quiosque.inventario.filter(quantidade__gt=0)
            serializer = InventarioQuiosqueListSerializer(inventario, many=True)
            return Response({
                'quiosque_id': quiosque.id,
                'identificador': quiosque.identificador,
                'inventario': serializer.data
            })
        except Quiosque.DoesNotExist:
            return Response({"error": "Nenhum quiosque associado a este vendedor."}, status=status.HTTP_404_NOT_FOUND)