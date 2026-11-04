# Re-export from app.services.rag_service for direct accessibility
from app.services.rag_service import rag_service, DisasterRAGService, DISASTER_KNOWLEDGE_BASE

__all__ = ["rag_service", "DisasterRAGService", "DISASTER_KNOWLEDGE_BASE"]
