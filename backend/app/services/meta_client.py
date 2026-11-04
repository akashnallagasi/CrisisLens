import json
import logging
import httpx
from app.core.config import settings
from app.schemas.analysis import AIAnalysisResultValidated
from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)

# Inviolable safety declarations that an AI model must NEVER independently declare
PROHIBITED_DECLARATIONS = [
    "road is safe",
    "route is safe",
    "completely safe",
    "100% safe",
    "safe to cross",
    "safe to enter",
    "safe to travel",
    "declared safe",
    "structure is safe",
    "evacuation order canceled",
    "official all-clear",
    "no danger present"
]

class MetaModelClient:
    """
    Client for Meta Model API (Meta Muse Spark / Llama / SAM 3.1).
    Adheres strictly to the Meta Global AI Developer Hackathon guidelines:
    - Never exposes API keys to client code
    - Validates all AI outputs against disaster safety invariants
    - Integrates evidence-aware RAG disaster protocols (FEMA/NDMA)
    - Transparently reports whether running against live Meta API or local demonstration mode
    """

    def __init__(self):
        self.api_key = settings.META_API_KEY
        self.base_url = settings.META_API_BASE_URL.rstrip("/")
        self.model_id = settings.META_MODEL_ID
        self.is_live = bool(self.api_key and self.api_key.strip() and not self.api_key.startswith("your_"))

    def validate_safety_invariants(self, text: str) -> tuple[bool, str]:
        """
        Ensures that AI generated text never attempts to independently issue
        authoritative emergency instructions or declare roadways/structures 100% safe.
        """
        lower = text.lower()
        for forbidden in PROHIBITED_DECLARATIONS:
            if forbidden in lower:
                return False, f"Safety invariant violation: Model attempted to declare an unverified safety status ('{forbidden}'). Invariant enforced: Physical responder verification is mandatory."
        return True, "Safety invariant checks passed."

    async def analyze_incident(
        self,
        incident_title: str,
        incident_description: str,
        disaster_type: str,
        evidence_descriptions: list[str],
        has_images: bool = False
    ) -> AIAnalysisResultValidated:
        """
        Executes multimodal analysis for an incident with Meta Muse Spark.
        Extracts:
        a) Primary Hazard & Damage Type
        b) Visible Structural/Flood Evidence
        c) AI Uncertainty & Confidence Rating
        d) Matched FEMA/NDMA official response guidelines via RAG
        """
        # Retrieve official disaster guidelines from knowledge base via RAG
        rag_query = f"{disaster_type} {incident_title} {' '.join(evidence_descriptions[:3])}"
        guidelines = rag_service.search_guidelines(
            query=rag_query,
            category=disaster_type,
            top_k=3
        )

        # Default hazard & damage type classifications
        if disaster_type == "cyclone":
            default_hazard = "High-Wind Cyclonic Shearing & Electrical Grid Hazard"
            default_damage = "Downed Transmission Conductors & Roadway Tree Occlusion"
            default_features = [
                "Severed overhead 11kV electrical distribution cable",
                "Felled mature tree occluding multiple vehicular carriageways",
                "Dangerous step-potential gradient hazard in saturated asphalt",
                "Absence of utility de-energization confirmation"
            ]
            default_uncertainty = (
                "Uncertainty Score: 0.38 (Moderate). Critical unknown: Grid energization state remains unconfirmed. "
                "Cordon perimeter must be maintained until electrical board LOTO clearance."
            )
            confidence = 0.76
        else:
            default_hazard = "Hydrological Surge & Rapid Embankment Overwash"
            default_damage = "Culvert Scour & Arterial Roadway Submergence"
            default_features = [
                "Water depth approx 0.6m to 1.1m overtopping stone embankment",
                "High turbidity brown current indicating active levee erosion",
                "Submerged passenger vehicles at downstream intersection",
                "Hydrodynamic scour threat along bridge approach abutment"
            ]
            default_uncertainty = (
                "Uncertainty Score: 0.22 (Low). Corroborated across citizen visual ground capture, "
                "automated river gauge telemetry, and aerial drone orthomosaic."
            )
            confidence = 0.86

        if self.is_live:
            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    payload = {
                        "model": self.model_id,
                        "messages": [
                            {
                                "role": "system",
                                "content": (
                                    "You are Meta Muse Spark, an AI disaster intelligence engine. "
                                    "Analyze multi-source disaster evidence objectively. "
                                    "CRITICAL SAFETY INVARIANT: NEVER declare roads, bridges, or structures safe or clear. "
                                    "Separate observed facts from inferences. "
                                    "Return a valid JSON object with keys: "
                                    "primary_hazard (string), damage_type (string), "
                                    "multimodal_summary (string), hazard_assessment (string), "
                                    "detected_features (list of strings representing visible structural/flood evidence), "
                                    "uncertainty_evaluation (string), confidence_score (float 0-1)."
                                )
                            },
                            {
                                "role": "user",
                                "content": (
                                    f"Incident: {incident_title}\n"
                                    f"Disaster Type: {disaster_type}\n"
                                    f"Context: {incident_description}\n"
                                    f"Evidence Items ({len(evidence_descriptions)}):\n"
                                    + "\n".join(f"- {d}" for d in evidence_descriptions)
                                )
                            }
                        ],
                        "response_format": {"type": "json_object"}
                    }
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                    resp = await client.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_content = data["choices"][0]["message"]["content"]
                        parsed = json.loads(raw_content)

                        # Validate safety invariants
                        is_safe, reason = self.validate_safety_invariants(raw_content)
                        hazard_text = parsed.get("hazard_assessment", "")
                        if not is_safe:
                            logger.warning(f"AI response intercepted by safety invariant: {reason}")
                            hazard_text += f"\n\n[SAFETY INVARIANT ENFORCED]: {reason}"

                        return AIAnalysisResultValidated(
                            model_id=self.model_id,
                            is_simulated=False,
                            status="completed",
                            primary_hazard=parsed.get("primary_hazard", default_hazard),
                            damage_type=parsed.get("damage_type", default_damage),
                            multimodal_summary=parsed.get("multimodal_summary", "Multimodal evidence synthesis completed."),
                            hazard_assessment=hazard_text,
                            detected_features=parsed.get("detected_features", default_features),
                            uncertainty_evaluation=parsed.get("uncertainty_evaluation", default_uncertainty),
                            confidence_score=float(parsed.get("confidence_score", confidence)),
                            rag_guidelines=guidelines,
                            disclaimer=settings.SAFETY_DISCLAIMER,
                            prohibited_actions_checked=True
                        )
                    else:
                        logger.error(f"Meta Model API returned HTTP {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"Error calling Meta Model API: {e}. Falling back to demonstration engine.")

        # Demonstration Mode (Transparently reported as simulated, never pretended as live)
        summary = (
            f"Meta Muse Spark synthesized {len(evidence_descriptions)} heterogeneous evidence item(s) for '{incident_title}'. "
            f"Observation metadata demonstrates advancing ground impact. Visible structural and flood evidence "
            f"confirms severe hydrological and infrastructural exposure."
        )

        hazard = (
            f"HIGH THREAT PRIORITY: Active {default_damage.lower()} detected. "
            f"Water depths and physical forces threaten structural integrity. "
            f"RESTRICTION: Transit corridors must remain cordoned. "
            f"AI cannot declare routes safe without physical first-responder verification."
        )

        return AIAnalysisResultValidated(
            model_id=f"{self.model_id} (Demonstration Engine)",
            is_simulated=True,
            status="completed",
            primary_hazard=default_hazard,
            damage_type=default_damage,
            multimodal_summary=summary,
            hazard_assessment=hazard,
            detected_features=default_features,
            uncertainty_evaluation=default_uncertainty,
            confidence_score=confidence,
            rag_guidelines=guidelines,
            disclaimer=settings.SAFETY_DISCLAIMER,
            prohibited_actions_checked=True
        )

meta_client = MetaModelClient()
