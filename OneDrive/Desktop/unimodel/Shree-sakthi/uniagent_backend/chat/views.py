import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .engine import process_chat


class ChatView(APIView):
    """
    POST /api/chat/
    Body: { agent_id, message, session_id (optional) }
    """

    def post(self, request):
        agent_id   = request.data.get('agent_id')
        message    = request.data.get('message', '').strip()
        session_id = request.data.get('session_id') or str(uuid.uuid4())

        # Validation
        if not agent_id:
            return Response(
                {'error': 'agent_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not message:
            return Response(
                {'error': 'message cannot be empty.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            agent_id = int(agent_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'agent_id must be an integer.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = process_chat(agent_id, message, session_id)

        return Response({
            **result,
            "session_id": session_id,
        }, status=status.HTTP_200_OK)
