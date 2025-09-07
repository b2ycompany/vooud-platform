import os
from django.core.wsgi import get_wsgi_application

# Importamos o WhiteNoise
from whitenoise import WhiteNoise

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vooud_backend.settings')

# Pegamos a aplicação Django padrão
application = get_wsgi_application()

# "Envolvemos" a aplicação Django com o WhiteNoise.
# Agora o WhiteNoise irá interceptar requisições por arquivos estáticos e servi-los.
application = WhiteNoise(application)