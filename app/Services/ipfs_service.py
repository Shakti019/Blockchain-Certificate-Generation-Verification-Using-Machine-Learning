# In services/ipfs_service.py
import ipfshttpclient
from flask import current_app
import time

class IPFSService:
    def __init__(self, max_retries=3, retry_delay=2):
        self.client = None
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self._connect_with_retry()

    def _connect_with_retry(self):
        for attempt in range(self.max_retries):
            try:
                self.client = ipfshttpclient.connect(
                    '/ip4/127.0.0.1/tcp/5001/http'
                )
                current_app.logger.info("✅ Successfully connected to IPFS")
                return
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise
                current_app.logger.warning(f"⚠️ IPFS connection failed (attempt {attempt + 1}): {str(e)}")
                time.sleep(self.retry_delay)