from rest_framework import serializers
from django.contrib.auth import get_user_model

# Boa prática: obter o modelo de usuário através da função do Django
Vendedor = get_user_model()

class VendedorSerializer(serializers.ModelSerializer):
    # Declaramos 'nome_completo' explicitamente. Ele será usado para escrita (write_only).
    # O React vai nos enviar 'nome_completo'.
    nome_completo = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = Vendedor
        # Definimos os campos que o Django usará para criar o usuário.
        # Note que 'first_name' está aqui, mas 'nome_completo' não, pois ele não
        # existe diretamente no modelo, nós o usaremos apenas para preencher 'first_name'.
        fields = ['email', 'password', 'password2', 'nome_completo', 'first_name']
        extra_kwargs = {
            'password': {'write_only': True},
            # Tornamos 'first_name' opcional na validação, pois vamos preenchê-lo manualmente.
            'first_name': {'required': False} 
        }

    # Usaremos o método validate para verificar as senhas antes de qualquer outra coisa.
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs

    # Sobrescrevemos o método 'create' que é mais apropriado para criar objetos.
    def create(self, validated_data):
        # Removemos os campos que não fazem parte do modelo Vendedor
        nome_completo = validated_data.pop('nome_completo')
        validated_data.pop('password2')
        
        # Atribuímos o valor de 'nome_completo' para 'first_name'
        validated_data['first_name'] = nome_completo
        
        # Usamos o método create_user do nosso VendedorManager, que já lida com o hash da senha
        vendedor = Vendedor.objects.create_user(**validated_data)
        return vendedor