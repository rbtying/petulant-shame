"""
Django settings for fundingapp project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
from django.conf import global_settings
BASE_DIR = os.path.dirname(os.path.dirname(__file__))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY = 'jih!8om_4#99fip-!37*&is3h0qf3=8l&46fg5g6qu_#wbewz7'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

TEMPLATE_DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
	'social_auth',
	'rest_framework',
	'django_extensions',
	'jccc',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
	'social_auth.middleware.SocialAuthExceptionMiddleware',
)

TEMPLATE_CONTEXT_PROCESSORS = global_settings.TEMPLATE_CONTEXT_PROCESSORS + (
	'social_auth.context_processors.social_auth_by_type_backends',
	'social_auth.context_processors.social_auth_login_redirect'
)

ROOT_URLCONF = 'fundingapp.urls'

WSGI_APPLICATION = 'fundingapp.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

AUTHENTICATION_BACKENDS = (
	'social_auth.backends.google.GoogleOAuth2Backend',
    'django.contrib.auth.backends.ModelBackend',
)

GOOGLE_OAUTH2_CLIENT_ID      = ''
GOOGLE_OAUTH2_CLIENT_SECRET  = ''

GOOGLE_OAUTH2_AUTH_EXTRA_ARGUMENTS = {
	'access_type': 'offline'
}

GOOGLE_WHITE_LISTED_DOMAINS = ['columbia.edu', 'barnard.edu']
SOCIAL_AUTH_USER_MODEL = 'auth.User'

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'
LOGIN_ERROR_URL = '/login-error'

SESSION_SERIALIZER = 'django.contrib.sessions.serializers.PickleSerializer'

REST_FRAMEWORK = {
	'DEFAULT_MODEL_SERIALIZER_CLASS': 'rest_framework.serializers.HyperlinkedModelSerializer',
	'DEFAULT_PERMISSION_CLASSES': ['jccc.permissions.ReadOnly'],
	'DEFAULT_FILTER_BACKENDS': ('rest_framework.filters.DjangoFilterBackend',),
	'DEFAULT_AUTHENTICATION_CLASSES': (	'rest_framework.authentication.SessionAuthentication',),
	'PAGINATE_BY': 1000,
	'PAGINATE_BY_PARAM': 'page_size',
	'MAX_PAGINATE_BY': 10000
}

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'

DEBUG = False
TEMPLATE_DEBUG = DEBUG

try:
	from local_settings import *
except ImportError:
	pass
