"""
ASGI config for agent911_be project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agent911_be.settings')

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import re_path
# Import CallConsumer after Django apps are loaded
from api.consumers import CallConsumer

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter([
        re_path(r"^ws/calls/(?P<call_id>\d+)/$", CallConsumer.as_asgi()),
    ]),
})
