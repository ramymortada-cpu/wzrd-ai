"""
Message worker — Redis Streams consumer.

Reads from messages:{workspace_id} streams.
Uses StreamConsumer, MessageHandler, ResponseSender.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from workers.handlers.stream_consumer import StreamConsumer
from workers.handlers.message_handler import MessageHandler
from workers.handlers.response_sender import ResponseSender


def _create_worker():
    """إنشاء الـ handlers وتشغيل الـ consumer."""
    response_sender = ResponseSender()
    message_handler = MessageHandler(response_sender=response_sender)
    stream_consumer = StreamConsumer(message_handler=message_handler)
    return stream_consumer


async def run_worker():
    """تشغيل الـ worker — نفس السلوك الخارجي."""
    consumer = _create_worker()
    await consumer.run()


if __name__ == "__main__":
    asyncio.run(run_worker())
