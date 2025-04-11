import asyncio
from stockPrice import start_websocket
from stockTimeline import app
import uvicorn

async def main():
    ws_task = asyncio.create_task(start_websocket())
    config = uvicorn.Config(app=app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())
    await asyncio.gather(ws_task, server_task)

if __name__ == "__main__":
    asyncio.run(main())
