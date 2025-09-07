from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from operations.views import ApiRootView

urlpatterns = [
    # A URL raiz não deve ter 'api/' aqui, pois já estamos no contexto da API.
    path('', ApiRootView.as_view(), name='api-root'), 

    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]