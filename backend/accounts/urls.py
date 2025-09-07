from django.urls import path
from .views import RegisterView

urlpatterns = [
    # Quando a URL for 'register/', ela chamará a nossa RegisterView
    path('register/', RegisterView.as_view(), name='register'),
]