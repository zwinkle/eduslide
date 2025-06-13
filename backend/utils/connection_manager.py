from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Struktur: { "session_code": [WebSocket, WebSocket, ...] }
        self.active_connections: Dict[str, List[WebSocket]] = {}