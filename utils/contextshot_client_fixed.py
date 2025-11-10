import requests
import base64
import logging
import time
from datetime import datetime
from typing import Optional, Dict
from PIL import Image
import io

class ContextShotClient:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://engine.prod.bria-api.com/v2"
        self.processing_stats = {
            'total_processed': 0,
            'successful_generations': 0,
            'processing_time': 0
        }
        
        # Validate API token
        if not api_token:
            raise ValueError("API token is required")
        
        logging.info(f"✅ ContextShotClient initialized with API token: {api_token[:8]}...")
    
    def _log_request(self, method: str, url: str, headers: dict, json: dict = None):
        """Log API request details"""
        logging.info(f"API Request | {method} {url} | headers={headers} | payload={{'json': {json}}}")
    
    def _log_response(self, url: str, response):
        """Log API response details"""
        logging.info(f"API Response | {response.request.method} {url} | status={response.status_code} | body={response.text[:100]}...")
    
    def _convert_file_to_base64(self, image_file) -> str:
        """Convert image file to base64 string"""
        try:
            # Handle different file object types
            if hasattr(image_file, 'read'):
                file_content = image_file.read()
            else:
                file_content = image_file
            
            base64_string = base64.b64encode(file_content).decode('utf-8')
            logging.info(f"🔍 Debug: Image converted to base64, length: {len(base64_string)}")
            return base64_string
        except Exception as e:
            logging.error(f"❌ Error converting file to base64: {str(e)}")
            raise Exception(f"Error converting file to base64: {str(e)}")
    
    def remove_product_background(self, image_file) -> Optional[str]:
        """Remove background from product image using Bria API v2"""
        try:
            start_time = datetime.now()
            base64_string = self._convert_file_to_base64(image_file)
            
            headers = {'api_token': self.api_token, 'Content-Type': 'application/json'}
            data = {'image': base64_string, 'sync': True}
            url = f"{self.base_url}/image/edit/remove_background"
            
            logging.info(f"🛍️ Removing product background: {len(base64_string)/1024/1024:.1f}MB")
            
            self._log_request('POST', url, headers, json=data)
            response = requests.post(url, json=data, headers=headers)
            self._log_response(url, response)
            
            logging.info(f"🔍 Response status: {response.status_code}")
            logging.info(f"🔍 Response headers: {dict(response.headers)}")
            logging.info(f"🔍 Response text: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                image_url = result.get('result', {}).get('image_url')
                if image_url:
                    processing_time = (datetime.now() - start_time).total_seconds()
                    self.processing_stats['processing_time'] += processing_time
                    logging.info(f"✅ Product background removed successfully in {processing_time:.1f}s")
                    return image_url
                else:
                    raise Exception("No image_url in response")
            else:
                logging.error(f"❌ API returned status {response.status_code}: {response.text}")
                raise Exception(f"API returned status {response.status_code}: {response.text}")
            
        except Exception as e:
            logging.error(f"❌ Error removing product background: {str(e)}")
            raise Exception(f"Error removing product background: {str(e)}")
    
    def replace_product_background_enhanced(self, image_base64: str, background_prompt: str) -> Optional[str]:
        """Replace product background using Bria AI v2 replace_background endpoint with enhanced parameters for maximum quality"""
        try:
            start_time = datetime.now()
            
            headers = {'api_token': self.api_token, 'Content-Type': 'application/json'}
            
            # Enhanced parameters for maximum quality based on Bria AI documentation
            data = {
                'image': image_base64,
                'prompt': background_prompt,
                'force_rmbg': False,  # Don't force background removal - use original image
                'placement_type': 'automatic',  # Let AI automatically place the product optimally
                'shot_size': [1200, 1200],  # High resolution output (1200x1200)
                'sync': True,  # Synchronous processing for immediate results
                'preserve_alpha': True,  # Preserve alpha channel if present
                'original_quality': True,  # Retain original resolution for maximum quality
                'visual_input_content_moderation': True,  # Content moderation on input
                'visual_output_content_moderation': True,  # Content moderation on output
                'mask_type': 'automatic',  # Use automatic mask generation for better product detection
                'padding': 20  # Add padding around the product for better composition
            }
            
            url = f"{self.base_url}/image/edit/replace_background"
            
            logging.info(f"🎭 Replacing product background with enhanced parameters")
            logging.info(f"🎭 Prompt: '{background_prompt[:100]}...'")
            self._log_request('POST', url, headers, json=data)
            
            response = requests.post(url, json=data, headers=headers)
            self._log_response(url, response)
            
            if response.status_code == 200:
                result = response.json()
                processing_time = (datetime.now() - start_time).total_seconds()
                
                # Extract image URL from result
                image_url = result.get('result', {}).get('image_url')
                
                if image_url:
                    logging.info(f"✅ Product background replaced successfully in {processing_time:.1f}s")
                    return image_url
                else:
                    logging.error(f"❌ No image URL in response: {result}")
                    return None
            elif response.status_code == 202:
                # Asynchronous response - poll for completion
                result = response.json()
                request_id = result.get('request_id')
                status_url = result.get('status_url')
                
                if not request_id or not status_url:
                    raise Exception("Missing request_id or status_url in response")
                
                logging.info(f"🔄 Polling status for request {request_id}...")
                
                # Poll the status URL until completion
                max_attempts = 30
                poll_interval = 3
                
                for attempt in range(max_attempts):
                    try:
                        status_response = requests.get(status_url, headers={'api_token': self.api_token})
                        
                        if status_response.status_code == 200:
                            status_result = status_response.json()
                            status = status_result.get('status')
                            
                            if status == 'completed' or status == 'COMPLETED':
                                image_url = status_result.get('result', {}).get('image_url')
                                if image_url:
                                    processing_time = (datetime.now() - start_time).total_seconds()
                                    logging.info(f"✅ Product background replaced successfully in {processing_time:.1f}s")
                                    return image_url
                                else:
                                    raise Exception("No image_url in completed response")
                            elif status == 'failed':
                                error_msg = status_result.get('error', 'Unknown error')
                                raise Exception(f"Background replacement failed: {error_msg}")
                            elif status in ['pending', 'processing', 'IN_PROGRESS']:
                                logging.info(f"⏳ Status: {status}, waiting... (attempt {attempt + 1}/{max_attempts})")
                                time.sleep(poll_interval)
                                continue
                            else:
                                logging.error(f"❌ Unknown status: {status}, response: {status_result}")
                                raise Exception(f"Unknown status: {status}")
                        else:
                            logging.error(f"❌ Status check failed: {status_response.status_code} - {status_response.text}")
                            raise Exception(f"Status check failed: {status_response.status_code}")
                    except requests.exceptions.RequestException as e:
                        logging.warning(f"⚠️ Network error during status check: {e}, retrying...")
                        time.sleep(poll_interval)
                        continue
                
                raise Exception("Timeout waiting for background replacement to complete")
            else:
                logging.error(f"❌ API returned status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logging.error(f"❌ Error replacing product background: {str(e)}")
            return None
