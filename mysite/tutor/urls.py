from django.conf.urls import patterns, url
from django.conf import settings
from django.conf.urls.static import static

from tutor import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^compile$', views.compile, name='compile'),
    url(r'^run$', views.run, name='run'),
    url(r'^(?P<problem_id>\d+)/$', views.show, name='show')
) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
