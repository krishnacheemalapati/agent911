from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Call, CallTranscript
from .serializers import CallSerializer, CallTranscriptSerializer

import requests
from rest_framework import status
from django.conf import settings

class CallViewSet(viewsets.ModelViewSet):
    queryset = Call.objects.all().order_by('-start_time')
    serializer_class = CallSerializer

    @action(detail=True, methods=['get'])
    def transcripts(self, request, pk=None):
        call = self.get_object()
        transcripts = call.transcripts.all().order_by('timestamp')
        serializer = CallTranscriptSerializer(transcripts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='transcribe', url_name='transcribe')
    def transcribe(self, request, pk=None):
        call = self.get_object()
        audio_file = request.FILES.get('file')
        if not audio_file:
            return Response({'error': 'No audio file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        CARTESIA_API_URL = "https://api.cartesia.ai/stt"
        CARTESIA_API_KEY = settings.CARTESIA_API_KEY
        headers = {
            "Authorization": f"Bearer {CARTESIA_API_KEY}",
            "Cartesia-Version": "2025-04-16"
        }
        files = {
            "file": (audio_file.name, audio_file, audio_file.content_type),
        }
        data = {
            "model": "ink-whisper",
            "language": "en"
        }
        try:
            resp = requests.post(CARTESIA_API_URL, headers=headers, files=files, data=data)
            resp.raise_for_status()
            result = resp.json()
            transcript = CallTranscript.objects.create(
                call=call,
                timestamp=call.start_time,
                text=result.get('text', ''),
                is_final=True
            )
            return Response({
                'timestamp': transcript.timestamp.isoformat(),
                'text': transcript.text,
                'is_final': transcript.is_final
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
