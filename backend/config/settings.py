import os
import shutil
import tempfile
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-change-me')
DEBUG = os.environ.get('DEBUG', 'True').lower() in {'1', 'true', 'yes', 'on'}
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

INSTALLED_APPS = [
    'django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes',
    'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles',
    'rest_framework', 'corsheaders', 'core'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

WSGI_APPLICATION = 'config.wsgi.application'


def _sqlite_db_name():
    sqlite_path = os.environ.get('SQLITE_PATH')
    if sqlite_path:
        return sqlite_path

    default_db = BASE_DIR / 'db.sqlite3'
    if os.environ.get('VERCEL') == '1':
        writable_db = Path(tempfile.gettempdir()) / 'db.sqlite3'
        if default_db.exists() and not writable_db.exists():
            shutil.copy2(default_db, writable_db)
        return writable_db

    return default_db


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': _sqlite_db_name(),
    }
}

AUTH_USER_MODEL = 'core.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework_simplejwt.authentication.JWTAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
}

SIMPLE_JWT = {'ACCESS_TOKEN_LIFETIME': timedelta(hours=8)}


def _csv_env(name, default=''):
    return [value.strip() for value in os.environ.get(name, default).split(',') if value.strip()]


CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'True').lower() in {'1', 'true', 'yes', 'on'}
CORS_ALLOWED_ORIGINS = _csv_env('CORS_ALLOWED_ORIGINS')
CORS_ALLOWED_ORIGIN_REGEXES = _csv_env(
    'CORS_ALLOWED_ORIGIN_REGEXES',
    r'^https://.*\.vercel\.app$,^http://localhost:5173$,^http://127\.0\.0\.1:5173$'
)
CSRF_TRUSTED_ORIGINS = _csv_env(
    'CSRF_TRUSTED_ORIGINS',
    'https://*.vercel.app,http://localhost:5173,http://127.0.0.1:5173'
)

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
