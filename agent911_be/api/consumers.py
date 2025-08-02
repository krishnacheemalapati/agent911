from channels.generic.websocket import AsyncWebsocketConsumer
import json
import websockets
import asyncio
from .models import Call, CallTranscript
from django.utils import timezone


import logging

logger = logging.getLogger("agent911.cartesia")

"""
No longer used: WebSocket consumer for Cartesia STT. See views.py for batch endpoint.
"""
