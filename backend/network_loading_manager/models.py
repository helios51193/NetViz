from django.db import models
from django.utils import timezone
import uuid

class GraphSession(models.Model):
    session_id = session_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    session_name = models.CharField(max_length=255, unique=True, blank=False)
    session_description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    data = models.JSONField(default=dict)

    class Meta:
        db_table = 'graph_session'

    def __str__(self):
        return self.session_name + ' ' + str(self.session_id)
# Create your models here.
