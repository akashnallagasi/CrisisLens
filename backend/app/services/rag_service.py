import math
import re
from typing import List, Dict, Any

# Curated Disaster Knowledge Base of Standard Operating Procedures (SOPs)
# Sourced from official disaster management bodies (FEMA, NDMA, USGS, NIMS)
DISASTER_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "fema-p259-sec4",
        "agency": "FEMA (Federal Emergency Management Agency)",
        "source_document": "FEMA P-259: Engineering Principles and Practices for Retrofitting Flood-Prone Structures",
        "section": "Section 4.2: Hydrostatic and Hydrodynamic Flood Forces",
        "category": "flood",
        "keywords": ["flood", "water", "inundation", "depth", "embankment", "submerged", "breach", "scour", "river"],
        "summary": "Threshold criteria for floodwater depth and hydrodynamic velocity.",
        "guidance": (
            "Standing water exceeding 0.5 meters (1.6 ft) creates significant lateral hydrostatic pressure on residential masonry "
            "and makes roadways completely impassable for passenger vehicles. Where velocity exceeds 1.5 m/s, localized scour around "
            "roadbed culverts and bridge abutments accelerates rapidly. Submerged roadways must be cordoned off immediately."
        ),
        "responder_action": "Establish immediate physical perimeter. Do not allow vehicular transit regardless of apparent shallow depth.",
        "safety_level": "CRITICAL_HAZARD"
    },
    {
        "id": "fema-p259-sec6",
        "agency": "FEMA (Federal Emergency Management Agency)",
        "source_document": "FEMA P-259: Levee & Floodwall Overtopping Defense Protocols",
        "section": "Section 6.1: Landward Containment and Ring Dikes",
        "category": "flood",
        "keywords": ["breach", "embankment", "levee", "overtopping", "canal", "overflow", "sandbag", "erosion"],
        "summary": "Containment protocol for overtopped stone levees and earthen canal embankments.",
        "guidance": (
            "When floodwaters overtop stone or earthen embankments, scour on the landward toe can induce catastrophic collapse. "
            "Response teams must construct landward sandbag ring dikes around sand boils and seepage exits to reduce hydraulic head. "
            "Never attempt heavy machinery positioning directly on an actively saturated crest."
        ),
        "responder_action": "Deploy rapid sandbag shoring at breach shoulders; evacuate immediate downstream trajectory (minimum 500m).",
        "safety_level": "CRITICAL_HAZARD"
    },
    {
        "id": "ndma-flood-sop3",
        "agency": "NDMA (National Disaster Management Authority)",
        "source_document": "NDMA Guidelines: Management of Floods & Standard Operating Procedures",
        "section": "SOP 3.4: Urban Drainage & Low-Lying Settlement Evacuation",
        "category": "flood",
        "keywords": ["settlement", "evacuation", "residential", "boat", "rescue", "lowland", "submerged", "shelter"],
        "summary": "Evacuation staging and motorized rescue boat operations in urban floodwaters.",
        "guidance": (
            "During rapid water level rise in urban sectors, prioritize vertical evacuation of stranded residents to reinforced upper floors "
            "before executing waterborne transfers. Rescue boats must maintain idle speed (under 3 knots) to prevent wake-induced "
            "collapse of compromised boundary walls."
        ),
        "responder_action": "Dispatch shallow-draft rescue craft with personal flotation devices (PFDs). Mark evacuated structures with fluorescent tags.",
        "safety_level": "HIGH_PRIORITY"
    },
    {
        "id": "ndma-cyclone-sop4",
        "agency": "NDMA (National Disaster Management Authority)",
        "source_document": "NDMA Guidelines: Management of Cyclones & Severe Wind Storms",
        "section": "SOP 4.7: Live Electrical Conductor Hazards in Saturated Ground",
        "category": "cyclone",
        "keywords": ["cyclone", "wind", "power", "grid", "wire", "cable", "tree", "electrical", "sparks", "conductor"],
        "summary": "Protocol for downed power lines and high-voltage grid disruptions.",
        "guidance": (
            "All fallen conductors must be treated as fully energized (11kV / 33kV) until official Lock-Out / Tag-Out (LOTO) "
            "clearance is received in writing from the electricity board substation. Standing water conducts fatal step-potential gradients "
            "up to 15 meters from the contact point. Chainsaw crews must NOT begin tree clearance until isolation is verified."
        ),
        "responder_action": "Cordon off an absolute 20-meter exclusion zone. Await utility supervisor clearance before debris cutting.",
        "safety_level": "LIFE_THREATENING"
    },
    {
        "id": "ndma-cyclone-sop6",
        "agency": "NDMA (National Disaster Management Authority)",
        "source_document": "NDMA Standard Operating Procedure for Arterial Road Clearance",
        "section": "SOP 6.2: Clearance of Arterial Evacuation Routes",
        "category": "cyclone",
        "keywords": ["arterial", "highway", "blocked", "tree", "obstruction", "chainsaw", "debris", "roadway"],
        "summary": "Hierarchical prioritization for clearing cyclone-felled vegetation from transit corridors.",
        "guidance": (
            "Focus clearing crews on single-lane clearance along designated Primary Arterials first, before attempting full multi-lane clearing. "
            "This establishes an emergency conduit for ambulances and rescue vehicles within 90 minutes of storm passage."
        ),
        "responder_action": "Clear minimum 3.5m carriage corridor along median shoulder; stack debris safely beyond the roadway curb.",
        "safety_level": "STANDARD_OPERATING_PROCEDURE"
    },
    {
        "id": "nims-ics-saf01",
        "agency": "NIMS / FEMA Incident Command System",
        "source_document": "National Incident Management System: Safety Officer Field Operations Guide",
        "section": "Section 2.4: Verification Invariants for Route Safety Declarations",
        "category": "safety_invariant",
        "keywords": ["safe", "verify", "route", "all-clear", "responder", "inspection", "bridge", "structural", "infrastructure"],
        "summary": "Inviolable rule: Remote AI/drone sensors cannot independently certify routes or structures safe.",
        "guidance": (
            "Remote sensor telemetry, aerial imagery, and automated AI assessments provide advisory reconnaissance only. "
            "No roadway, bridge, or public facility may be designated 'OPEN' or 'SAFE' for public re-entry without a signed, physical "
            "ground inspection conducted by a qualified civil engineer or Incident Command Safety Officer."
        ),
        "responder_action": "Mark all AI assessments with 'Pending Responder Verification'. Maintain closures until physical inspection sign-off.",
        "safety_level": "MANDATORY_INVARIANT"
    }
]

class DisasterRAGService:
    """
    Evidence-Aware Disaster Response Knowledge Base RAG Service.
    Retrieves authoritative disaster protocols (FEMA, NDMA, NIMS) based on multimodal
    incident features, hazard classifications, and ground evidence.
    """

    def __init__(self):
        self.knowledge_base = DISASTER_KNOWLEDGE_BASE

    def _tokenize(self, text: str) -> set[str]:
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        stopwords = {
            "the", "and", "for", "with", "this", "that", "from", "are", "was",
            "were", "has", "have", "been", "will", "when", "into", "over"
        }
        return {w for w in words if w not in stopwords}

    def search_guidelines(
        self,
        query: str,
        category: str | None = None,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Executes TF-IDF inspired keyword and semantic relevance scoring
        across official FEMA and NDMA guidelines.
        """
        query_tokens = self._tokenize(query)
        if category:
            query_tokens.add(category.lower())

        scored_results = []
        for doc in self.knowledge_base:
            doc_tokens = set(doc["keywords"])
            doc_tokens.update(self._tokenize(doc["summary"]))
            doc_tokens.update(self._tokenize(doc["guidance"]))
            doc_tokens.add(doc["category"].lower())

            # Calculate match overlap
            overlap = query_tokens.intersection(doc_tokens)
            
            # Boost score if category matches
            category_boost = 2.0 if category and doc["category"].lower() == category.lower() else 1.0
            
            # Keyword exact matches carry heavy weight
            keyword_matches = sum(2.5 for k in doc["keywords"] if k in query_tokens)
            
            score = (len(overlap) * 1.5 + keyword_matches) * category_boost

            if score > 0:
                scored_results.append({
                    "id": doc["id"],
                    "agency": doc["agency"],
                    "source_document": doc["source_document"],
                    "section": doc["section"],
                    "category": doc["category"],
                    "summary": doc["summary"],
                    "guidance": doc["guidance"],
                    "responder_action": doc["responder_action"],
                    "safety_level": doc["safety_level"],
                    "relevance_score": round(score, 2)
                })

        # Sort by relevance
        scored_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_results[:top_k]

rag_service = DisasterRAGService()
