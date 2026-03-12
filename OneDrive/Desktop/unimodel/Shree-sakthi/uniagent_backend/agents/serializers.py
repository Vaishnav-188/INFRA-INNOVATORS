from rest_framework import serializers
from .models import Agent


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Agent
        fields = ['id', 'name', 'description', 'domain', 'system_prompt', 'created_at']
        read_only_fields = ['id', 'created_at']


class AgentCreateRequestSerializer(serializers.Serializer):
    """Validates the body for POST /api/agents/create/"""
    purpose = serializers.CharField(
        max_length=500,
        help_text="Natural language description of what the agent should do."
    )
