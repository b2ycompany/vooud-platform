from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import VendaCreateSerializer, InventarioQuiosqueListSerializer
from .models import Quiosque

class VendaCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        request.data['vendedor'] = request.user.id
        serializer = VendaCreateSerializer(data=request.data)
        if serializer.is_valid():
            venda = serializer.save()
            return Response({"message": "Venda registrada com sucesso!", "venda_id": venda.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- NOVA VIEW PARA BUSCAR O INVENTÁRIO DO VENDEDOR LOGADO ---
class MeuQuiosqueInventarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendedor = request.user
        try:
            # Busca o quiosque associado ao vendedor que fez a requisição
            quiosque = Quiosque.objects.get(vendedor_responsavel=vendedor)
            # Pega todos os itens de inventário daquele quiosque que tenham quantidade > 0
            inventario = quiosque.inventario.filter(quantidade__gt=0)
            # Passa os dados pelo serializer para formatar a resposta
            serializer = InventarioQuiosqueListSerializer(inventario, many=True)
            # Retorna os dados do quiosque e seu inventário
            return Response({
                'quiosque_id': quiosque.id,
                'identificador': quiosque.identificador,
                'inventario': serializer.data
            })
        except Quiosque.DoesNotExist:
            return Response({"error": "Nenhum quiosque associado a este vendedor."}, status=status.HTTP_404_NOT_FOUND)