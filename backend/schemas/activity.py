from pydantic import BaseModel, Field
from typing import List

# Skema ini mendefinisikan data yang dibutuhkan untuk membuat sebuah polling.
class PollCreate(BaseModel):
    question: str = Field(..., min_length=1, max_length=255)
    options: List[str] = Field(..., min_items=2, max_items=8)

# Contoh data yang akan dikirim frontend:
# {
#   "question": "Apa ibukota Indonesia?",
#   "options": ["Jakarta", "Bandung", "Surabaya"]
# }