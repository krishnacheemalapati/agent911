from rest_framework import serializers
from .models import Call, CallTranscript

class CallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Call
        fields = ['id', 'start_time', 'caller_info']

class CallTranscriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallTranscript
        fields = ['id', 'call', 'timestamp', 'text', 'is_final']
