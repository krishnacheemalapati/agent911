from django.db import models

class Call(models.Model):
    start_time = models.DateTimeField(auto_now_add=True)
    caller_info = models.CharField(max_length=255, blank=True, null=True)

class CallTranscript(models.Model):
    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name='transcripts')
    timestamp = models.DateTimeField(auto_now_add=True)
    text = models.TextField()
    is_final = models.BooleanField(default=False)
