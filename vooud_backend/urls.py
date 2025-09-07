from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from operations.views import ApiRootView # Importar a view raiz

urlpatterns = [
    # URL para a raiz da API (ESSA PARTE ESTAVA FALTANDO)
    path('api/', ApiRootView.as_view(), name='api-root'),
    
    # Outras URLs
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]