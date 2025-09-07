import os
import dj_database_url
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

def get_list_from_env(name):
    value = os.environ.get(name, "")
    return [v.strip() for v in value.split(",") if v.strip()]

ALLOWED_HOSTS = get_list_from_env("ALLOWED_HOSTS")

INSTALLED_APPS = [
    'django.contrib.admin', 
    'django.contrib.auth', 
    'django.contrib.contenttypes',
    'django.contrib.sessions', 
    'django.contrib.messages', 
    'django.contrib.staticfiles',
    'rest_framework', 
    'corsheaders', 
    'rest_framework_simplejwt',
    'accounts.apps.AccountsConfig', 
    'catalog.apps.CatalogConfig', 
    'operations.apps.OperationsConfig',
    'core.apps.CoreConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',   # ✅ posição correta para lidar com preflight
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Configurações de CORS e CSRF
CORS_ALLOWED_ORIGINS = get_list_from_env("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = get_list_from_env("CSRF_TRUSTED_ORIGINS")

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

ROOT_URLCONF = 'vooud_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates', 
        'DIRS': [], 
        'APP_DIRS': True, 
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug', 
                'django.template.context_processors.request', 
                'django.contrib.auth.context_processors.auth', 
                'django.contrib.messages.context_processors.messages'
            ]
        }
    }
]

WSGI_APPLICATION = 'vooud_backend.wsgi.application'

DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        ssl_require=True,
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}'
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'}, 
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'}, 
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'}, 
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'}
]

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'accounts.Vendedor'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60), 
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1)
}
