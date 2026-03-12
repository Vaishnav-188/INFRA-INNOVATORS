import json
import re
from google import genai
from google.genai import types
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Agent
from .serializers import AgentSerializer, AgentCreateRequestSerializer


def _get_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


class AgentListView(APIView):
    """GET /api/agents/ — list all agents."""

    def get(self, request):
        agents = Agent.objects.all()
        serializer = AgentSerializer(agents, many=True)
        return Response(serializer.data)


class AgentCreateView(APIView):
    """POST /api/agents/create/ — auto-generate an agent from a purpose string."""

    def post(self, request):
        req_ser = AgentCreateRequestSerializer(data=request.data)
        if not req_ser.is_valid():
            return Response(req_ser.errors, status=status.HTTP_400_BAD_REQUEST)

        purpose = req_ser.validated_data['purpose']

        # --- Ask Gemini to generate the agent definition ---
        client = _get_client()

        prompt = f"""You are helping configure an AI agent for a university management system.

Purpose: {purpose}

Return ONLY a valid JSON object (no markdown, no code fences, no extra text) with exactly these keys:
{{
  "name": "short agent name (3-5 words)",
  "description": "one line description of what this agent does",
  "domain": "one of: student | faculty | attendance | exam | course | analytics",
  "system_prompt": "detailed system instructions (3-5 sentences) telling the agent to stay strictly within its domain and not answer off-topic questions"
}}
"""

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            raw = response.text.strip()

            # Strip markdown fences if Gemini adds them anyway
            raw = re.sub(r'^```json\s*', '', raw)
            raw = re.sub(r'^```\s*', '', raw)
            raw = re.sub(r'\s*```$', '', raw)

            data = json.loads(raw)
        except json.JSONDecodeError as e:
            return Response(
                {'error': 'Gemini returned invalid JSON', 'raw': raw, 'detail': str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        # Validate domain is one of the allowed values
        valid_domains = [d[0] for d in Agent.DOMAIN_CHOICES]
        if data.get('domain') not in valid_domains:
            data['domain'] = 'student'  # safe fallback

        agent = Agent.objects.create(
            name=data.get('name', 'Unnamed Agent'),
            description=data.get('description', ''),
            domain=data['domain'],
            system_prompt=data.get('system_prompt', ''),
        )

        return Response(AgentSerializer(agent).data, status=status.HTTP_201_CREATED)


class AgentDeleteView(APIView):
    """DELETE /api/agents/{id}/ — remove an agent."""

    def delete(self, request, pk):
        try:
            agent = Agent.objects.get(pk=pk)
        except Agent.DoesNotExist:
            return Response({'error': 'Agent not found'}, status=status.HTTP_404_NOT_FOUND)

        agent.delete()
        return Response({'message': f'Agent {pk} deleted successfully.'}, status=status.HTTP_200_OK)
