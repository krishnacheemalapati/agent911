from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CallViewSet

router = DefaultRouter()
router.register(r'calls', CallViewSet, basename='call')

# Get the router-generated URL patterns
router_urls = router.urls

# Add custom action URL pattern
call_transcribe = CallViewSet.as_view({'post': 'transcribe'})

urlpatterns = [
    path('', include(router_urls)),
    path('calls/<int:pk>/transcribe/', call_transcribe, name='call-transcribe'),
]
