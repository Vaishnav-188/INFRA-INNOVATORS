"""
chat/memory.py

Simple in-process conversation memory keyed by session_id.
Stores the last MAX_PAIRS (user, model) pairs per session.
Returned in Gemini's multi-turn history format.
"""

MAX_PAIRS = 10   # keep last 10 exchanges (20 messages)

_memory_store: dict[str, list[dict]] = {}


def get_memory(session_id: str) -> list[dict]:
    """
    Returns the conversation history for the given session as a list of
    Gemini content dicts:
        [{"role": "user", "parts": ["..."]}, {"role": "model", "parts": ["..."]}]
    """
    return _memory_store.get(session_id, [])


def save_memory(session_id: str, user_msg: str, ai_msg: str) -> None:
    """
    Append a user+model pair to this session's history.
    Trims to the last MAX_PAIRS pairs automatically.
    """
    history = _memory_store.setdefault(session_id, [])
    history.append({"role": "user",  "parts": [user_msg]})
    history.append({"role": "model", "parts": [ai_msg]})

    # Keep only the last MAX_PAIRS pairs (2 * MAX_PAIRS messages)
    if len(history) > MAX_PAIRS * 2:
        _memory_store[session_id] = history[-(MAX_PAIRS * 2):]


def clear_memory(session_id: str) -> None:
    """Clear all history for a session (useful for testing)."""
    _memory_store.pop(session_id, None)
