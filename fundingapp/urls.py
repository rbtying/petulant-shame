from django.conf.urls import patterns, include, url

from django.contrib import admin
from django.contrib.auth.models import User, Group
from jccc.views import AuthComplete, LoginError, Logout, App, Partial
from jccc.rest import UserViewSet, GroupViewSet, GroupProfileViewSet, StudentGroupViewSet, AllocationViewSet, FundingRequestViewSet, JCCCApplicationViewSet, CIFApplicationViewSet, ESCProjectGrantApplicationViewSet
from rest_framework import viewsets, routers

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'student_groups', StudentGroupViewSet)
router.register(r'allocations', AllocationViewSet)
router.register(r'funding_requests', FundingRequestViewSet)
router.register(r'jccc_applications', JCCCApplicationViewSet)
router.register(r'cif_applications', CIFApplicationViewSet)
router.register(r'esc_project_grants', ESCProjectGrantApplicationViewSet)

admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'fundingapp.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
	url(r'^partials/(?P<partial>.*)$', Partial.as_view()),
	url(r'^complete/(?P<backend>[^/]+)/$', AuthComplete.as_view()),
	url(r'^login-error/$', LoginError.as_view(), name='login_error'),
	url(r'^logout/$', Logout.as_view(), name="logout"),
    url(r'^admin/', include(admin.site.urls)),
	url(r'^api/', include(router.urls)),
	url(r'', include('social_auth.urls')),
	url(r'^$', App.as_view(), name='app'),
)
