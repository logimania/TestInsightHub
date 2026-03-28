import os
from pathlib import Path
import json
from collections import defaultdict

def greet(name):
    return f"Hello, {name}"

async def fetch_data(url):
    response = await client.get(url)
    if response.status == 200:
        return response.json()
    return None

def process(items):
    for item in items:
        if item > 0:
            yield item
