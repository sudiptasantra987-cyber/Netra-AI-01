from fastapi import APIRouter
from app.services.chatbot_rag import generate_chat_response
from app.models.schema import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["AI Eye-Health Assistant"])

@router.post("", response_model=ChatResponse)
def chat_with_assistant(req: ChatRequest):
    return generate_chat_response(
        query=req.message,
        language=req.language,
        screening_context=req.screening_context,
        history=req.history
    )
