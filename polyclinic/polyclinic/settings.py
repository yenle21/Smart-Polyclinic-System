"""
Django settings for ecourseapisv2 project.
"""

from pathlib import Path
import cloudinary.api
import pymysql
from environ import environ

# 1. Khởi tạo BASE_DIR và nạp file .env NGAY TỪ ĐẦU FILE
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

# 2. Cấu hình các biến cơ bản
MEDIA_ROOT = '%s/courses/static/' % BASE_DIR
SECRET_KEY = 'django-insecure-#94i$&s-kcg$&d$vq3)3ilfz5dnmcg2w=&bviicnn79j$068p#'
DEBUG = True
ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'accounts',
    'appointments',
    'billing',
    'dashboard',
    'pharmacy',
    'ckeditor',
    'ckeditor_uploader',
    'rest_framework',
    'drf_yasg',
    'oauth2_provider',
    'cloudinary',
]

AUTH_USER_MODEL = 'accounts.User'

OAUTH2_PROVIDER = {
    'ALLOWED_GRANT_TYPES': [
        'password',
        'refresh_token',
    ],
    'ACCESS_TOKEN_EXPIRE_SECONDS': 3600,
}
CKEDITOR_UPLOAD_PATH = "images/ckeditors/"

# Cloudinary Config
cloudinary.config(
    cloud_name="drpqwrhug",
    api_key="628461533634161",
    api_secret="Ey8QCCvW7rEKlKLFjb3kKcIhssQ"
)

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'oauth2_provider.contrib.rest_framework.OAuth2Authentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True

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
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'polyclinic.wsgi.application'
ROOT_URLCONF = 'polyclinic.urls'

# 3. Cấu hình cơ sở dữ liệu MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'polyclinicdb',
        'USER': 'root',
        'PASSWORD': 'admin@123',
        'HOST': '127.0.0.1',  # Đổi thành 127.0.0.1 rõ ràng thay vì để trống
        'PORT': '3306',
    }
}

pymysql.install_as_MySQLdb()

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
import os
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 4. Đọc các biến môi trường từ file .env (Không khởi tạo lại BASE_DIR ở đây)
VNPAY_TMN_CODE    = env("VNPAY_TMN_CODE")
VNPAY_HASH_SECRET = env("VNPAY_HASH_SECRET")
VNPAY_RETURN_URL  = env("VNPAY_RETURN_URL")
VNPAY_PAYMENT_URL = env("VNPAY_PAYMENT_URL")
APP_PAYMENT_RETURN_URL = env("APP_PAYMENT_RETURN_URL")

MOMO_REDIRECT_URL = env("MOMO_REDIRECT_URL")
MOMO_IPN_URL      = env("MOMO_IPN_URL")

CLIENT_ID_NHU = 'n7aGTsfMDLTLWp32Hm9YU6OQGbSDnmHaY77CoWhL'
CLIENT_SECRET_NHU = 'bK8au064hR1Mlj77UWiFJNTkBUgmL9PzGv7kWWdi9NFI31RRSF1hA7B3o8Cstu5bIpMO44dfrx5iG7p13PJWNttp81xEltStjRe5y6XtKpH30AqlXxb6cPnllFYkVpmX'

CLIENT_ID_YEN = 'Qo0xwsPc00Wama0YySwi81z1jfnjPbUxi6xYc5H1'
CLIENT_SECRET_YEN = 'SIN6g29BplhvAY0IfUin8OVGnOzAuvbfy9WXbO8FWIitHgzlRYYDYtixGFOQXbpil0DwAOhx5PdVfGjbOOlZaZo2GzVW6WzqsR4kXa927OTC3qxqUtmFRjqauSvebbfS'