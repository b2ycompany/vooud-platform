from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import VendedorSerializer

# Esta é a nossa View para o registro. Ela só aceitará requisições do tipo POST.
class RegisterView(APIView):
    def post(self, request):
        # Passamos os dados recebidos do frontend (request.data) para o nosso serializer
        serializer = VendedorSerializer(data=request.data)
        
        # O serializer agora valida os dados
        if serializer.is_valid():
            # Se os dados forem válidos, chamamos o método .save() que customizamos
            serializer.save()
            # Retornamos uma resposta de sucesso
            return Response({"message": "Vendedor cadastrado com sucesso!"}, status=status.HTTP_201_CREATED)
        
        # Se os dados não forem válidos, retornamos os erros que o serializer identificou
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)