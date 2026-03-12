"""
chat/engine.py

Core AI processing pipeline:
  1. Load Agent from MySQL
  2. Load conversation memory for this session
  3. Restrict tools to this agent's domain
  4. Call Gemini with system prompt + history + tools
  5. If Gemini makes a tool call → execute → feed result back
  6. Return final response with reasoning trace
"""

import json
from google import genai
from google.genai import types
from django.conf import settings

from agents.models import Agent
from chat.memory import get_memory, save_memory
from chat.tool_registry import get_tools_for_domain
from tools import get_tool_function


def _get_client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def process_chat(agent_id: int, message: str, session_id: str) -> dict:
    """
    Main chat processing entry point.

    Args:
        agent_id:   ID of the Agent record in MySQL
        message:    User's natural language message
        session_id: Client-provided session identifier for memory

    Returns:
        {
            "message":      str,   # final human-readable answer
            "data":         list,  # rows returned by the tool (if any)
            "reasoning":    str,   # explanation of what the AI did
            "action_taken": str,   # which tool was called (if any)
            "agent_name":   str,
        }
    """
    # ── 1. Load Agent ────────────────────────────────────────────────────────
    try:
        agent = Agent.objects.get(pk=agent_id)
    except Agent.DoesNotExist:
        return _error(f"Agent with id={agent_id} not found.")

    # ── 2. Load memory ───────────────────────────────────────────────────────
    history = get_memory(session_id)

    # ── 3. Build tool list ───────────────────────────────────────────────────
    client = _get_client()
    domain_tools = get_tools_for_domain(agent.domain)

    if not domain_tools:
        return _error(f"No tools configured for domain '{agent.domain}'.")

    # In google.genai, we use types.Tool
    gemini_tools = [types.Tool(function_declarations=domain_tools)]

    # ── 4. Call Gemini ───────────────────────────────────────────────────────
    
    # Map memory dicts to google.genai Content objects
    mapped_history = []
    for m in history:
        mapped_history.append(
            types.Content(
                role=m["role"],
                parts=[types.Part.from_text(text=p) for p in m["parts"]]
            )
        )

    chat = client.chats.create(
        model='gemini-2.5-flash',
        config=types.GenerateContentConfig(
            system_instruction=agent.system_prompt,
            tools=gemini_tools,
        ),
        history=mapped_history
    )

    try:
        response = chat.send_message(message)
    except Exception as e:
        return _error(f"Gemini API error: {str(e)}")

    # ── 5. Handle tool call ──────────────────────────────────────────────────
    action_taken = None
    tool_result  = None
    data         = []

    # Check if Gemini decided to call a function
    if response.function_calls:
        fn_call = response.function_calls[0]
        fn_name = fn_call.name
        fn_args = dict(fn_call.args) if fn_call.args else {}

        action_taken = fn_name

        # Execute the tool
        tool_fn = get_tool_function(fn_name)
        if tool_fn is None:
            tool_result = {"error": f"Tool '{fn_name}' is not registered."}
        else:
            try:
                # Execute mapped function
                tool_result = tool_fn(**fn_args)
            except Exception as e:
                tool_result = {"error": f"Tool execution failed: {str(e)}"}

        # Return tool result back to Gemini for a natural language summary
        try:
            # We send back the function response
            part = types.Part.from_function_response(
                name=fn_name,
                response={"result": json.dumps(tool_result, default=str)}
            )
            follow_up = chat.send_message([part])
            final_text = _extract_text(follow_up)
        except Exception as e:
            final_text = f"Tool executed. Result: {json.dumps(tool_result, default=str)}"

        # Normalise data list
        if isinstance(tool_result, list):
            data = tool_result
        elif isinstance(tool_result, dict) and 'records' in tool_result:
            data = tool_result['records']
        else:
            data = [tool_result] if tool_result else []

        reasoning = (
            f"I identified that your request requires the '{fn_name}' action. "
            f"I called it with arguments: {json.dumps(fn_args, default=str)}. "
            f"The operation returned {len(data)} record(s)."
        )

        # Save to memory
        save_memory(session_id, message, final_text)

        return {
            "message":      final_text,
            "data":         data,
            "reasoning":    reasoning,
            "action_taken": action_taken,
            "agent_name":   agent.name,
        }

    # ── 6. No tool call — plain text response (e.g. refusal or greeting) ────
    final_text = _extract_text(response)
    save_memory(session_id, message, final_text)

    return {
        "message":      final_text,
        "data":         [],
        "reasoning":    "No tool call was needed. The query was answered through conversation.",
        "action_taken": None,
        "agent_name":   agent.name,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_text(response) -> str:
    """Pull the first text part from a Gemini response."""
    try:
        # In google.genai, response.text gets the primary joined text from parts
        if response.text:
            return response.text.strip()
    except Exception:
        pass
    return "I'm sorry, I couldn't generate a response."


def _error(message: str) -> dict:
    return {
        "message":      message,
        "data":         [],
        "reasoning":    message,
        "action_taken": None,
        "agent_name":   "Unknown",
    }
