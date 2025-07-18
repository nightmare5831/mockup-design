import requests
import json
from PIL import Image
from typing import Optional, Tuple
import io
import os
import logging
from app.config.settings import settings
from app.services.image_service import apply_logo_to_product, image_to_bytes
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered mockup generation using piapi.ai API"""
    
    def __init__(self):
        self.api_url = "https://api.piapi.ai/v1/chat/completions"
        self.api_key = getattr(settings, 'PIAPI_API_KEY', None)
        self.storage_service = StorageService()
        
    async def initialize_models(self):
        """Initialize AI service (no local models needed)"""
        try:
            if not self.api_key:
                logger.warning("PIAPI_API_KEY not set in settings")
            
            logger.info("AI service initialized for piapi.ai")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI service: {e}")
            raise
    
    async def download_image(self, url: str) -> Image.Image:
        """Download image from URL"""
        try:
            # Handle relative URLs by converting to absolute file paths
            if url.startswith('/'):
                # Convert relative URL to absolute file path
                # Remove leading slash and handle uploads prefix
                if url.startswith('/uploads/'):
                    path = url[1:]  # Remove leading slash: /uploads/... -> uploads/...
                else:
                    path = url[1:]  # Remove leading slash
                
                # Convert to absolute path
                absolute_path = os.path.abspath(path)
                logger.info(f"Loading local image from: {absolute_path}")
                return Image.open(absolute_path).convert('RGB')
            else:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                return Image.open(io.BytesIO(response.content)).convert('RGB')
        except Exception as e:
            logger.error(f"Failed to download image from {url}: {e}")
            raise
    
    def get_absolute_url(self, url: str) -> str:
        """Convert relative URL to absolute URL for API"""
        if url.startswith('/'):
            # For local development, use localhost
            base_url = getattr(settings, 'BASE_URL', 'http://localhost:5371')
            return f"{base_url}{url}"
        return url
    
    def get_technique_prompt(self, technique: str) -> str:
        """Get prompt enhancement based on marking technique with fitting emphasis"""
        technique_prompts = {
            "SERIGRAFIA": "screen printed logo perfectly fitted and conforming to product surface, vibrant colors, smooth finish, logo follows product contours naturally",
            "BORDADO": "embroidered logo seamlessly integrated into fabric, raised threads conforming to material texture, logo perfectly aligned with product surface",
            "GRABADO_LASER": "laser engraved logo precisely fitted to product surface, following natural curves and contours, etched depth matches material characteristics",
            "IMPRESION_DIGITAL": "digitally printed logo perfectly mapped to product geometry, high resolution fitting exactly to surface curvature, no distortion",
            "TRANSFER_DIGITAL": "heat transfer logo conforming perfectly to product shape, smooth application following surface topology, exact fit",
            "DOMING": "3D domed logo fitted precisely to marking area, dimensional effect matching product surface, perfect alignment",
            "TAMPOGRAFIA": "pad printed logo conforming to product surface irregularities, precise fitting to curved surfaces, even coverage following contours",
            "SUBLIMACION": "sublimated logo integrated seamlessly into material, colors perfectly matched to surface, following natural product lines",
            "TERMOGRABADO": "heat embossed logo fitted to product topology, raised surface conforming to base material, metallic finish following curves",
            "VINILO_TEXTIL": "vinyl cut logo applied with perfect conformity to fabric weave and texture, clean edges following surface contours",
            "TRANSFER_SERIGRAFICO": "screen print transfer perfectly fitted to product curvature, vibrant colors conforming to surface geometry",
            "ETIQUETA_DIGITAL": "digital label conforming exactly to product surface, high quality print fitted to marking zone precisely",
            "VINILO_ADHESIVO": "adhesive vinyl logo fitted perfectly to surface texture, weather resistant application following product contours",
            "TRANSFER_CERAMICO": "ceramic transfer conforming to product surface curvature, heat resistant application fitted precisely",
            "MOLDE_3D": "3D molded logo fitted exactly to product geometry, raised surface matching base topology perfectly",
            "GRABADO_FUEGO": "fire engraved logo following natural wood grain and surface texture, charred effect fitted to material characteristics",
            "GRABADO_UV": "UV engraved logo precisely fitted to material surface, clean lines following product contours exactly",
            "GRABADO_RELIEVE": "relief engraved logo conforming to product surface topology, raised texture fitted perfectly to marking area",
            "SERIGRAFIA_CIRCULAR": "circular screen print fitted perfectly to curved surfaces, seamless application following product geometry"
        }
        
        return technique_prompts.get(technique, "logo perfectly fitted and conforming to product surface, seamlessly integrated with natural surface topology")
    
    async def generate_mockup(
        self,
        product_image_url: str,
        logo_image_url: str,
        marking_zone: Tuple[float, float, float, float],  # x, y, width, height
        marking_technique: str,
        logo_scale: float = 1.0,
        logo_rotation: float = 0.0,
        logo_color: Optional[str] = None,
        use_ai: bool = True,
        user_id: Optional[str] = None
    ) -> str:
        """Generate mockup with logo applied to product using piapi.ai"""
        try:
            if use_ai and self.api_key:
                # Use AI-powered generation via piapi.ai
                result_image = await self._generate_with_piapi(
                    product_image_url, logo_image_url, marking_zone, 
                    marking_technique, logo_scale, logo_rotation, logo_color
                )
            
            # Upload result to storage
            result_bytes = image_to_bytes(result_image, 'PNG')
            
            # Generate unique filename with user folder structure
            import uuid
            if user_id:
                result_filename = f"mockups/{user_id}/{uuid.uuid4()}.png"
            else:
                result_filename = f"mockups/{uuid.uuid4()}.png"
            result_url = await self.storage_service.upload_from_bytes(
                result_bytes, result_filename, 'image/png'
            )
            
            return result_url
            
        except Exception as e:
            logger.error(f"Error generating mockup: {e}")
            raise
    
    async def _generate_with_piapi(
        self,
        product_image_url: str,
        logo_image_url: str,
        marking_zone: Tuple[float, float, float, float],
        technique: str,
        logo_scale: float,
        logo_rotation: float,
        logo_color: Optional[str]
    ) -> Image.Image:
        """Generate mockup using piapi.ai API"""
        try:
            # Get technique-specific prompt
            technique_prompt = self.get_technique_prompt(technique)
            
            # Convert relative URLs to absolute URLs
            product_absolute_url = self.get_absolute_url(product_image_url)
            logo_absolute_url = self.get_absolute_url(logo_image_url)
            
            logger.info(f"Using product image URL: {product_absolute_url}")
            logger.info(f"Using logo image URL: {logo_absolute_url}")
            
            # Calculate position and transform values from marking zone and parameters
            x_pos = int(marking_zone[0])  # Assuming base image size for calculation
            y_pos = int(marking_zone[1])
            scale_percent = int(logo_scale * 100)
            rotation_degrees = int(logo_rotation)
            opacity_percent = 100 if logo_color != 'transparent' else 100
            # Create the prompt for logo overlay
            prompt_text = f"""Overlay the second image (a logo) onto the first image (a product photo) using the following visual guidance:

                • Position the logo approximately {x_pos}px from the left and {y_pos}px from the top of the product image (top-left origin).

                • Scale the logo to about {scale_percent}% of its original size to fit proportionally.

                • Rotate the logo by approximately {rotation_degrees} degrees around its center.

                • Apply a realistic {technique_prompt} effect (like embossing, screen print, or reflection) to make the logo feel physically embedded into the product surface.

                • Maintain 100% opacity unless transparency is requested.

                Ensure the final result looks natural and cohesive, accounting for lighting, surface texture, and material. Only return the final image — no text, code, or explanation.
                """

            # Prepare the request payload
            payload = {
                "model": "gpt-4o-image",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": product_absolute_url
                                }
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": logo_absolute_url
                                }
                            },
                            {
                                "type": "text",
                                "text": prompt_text
                            }
                        ]
                    }
                ],
                "stream": True
            }
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.api_key}'
            }
            response = requests.post(
                self.api_url,
                headers=headers,
                data=json.dumps(payload),
                stream=True,
                timeout=300
            )
            
            response.raise_for_status()
            
            # Process the streaming response
            result_data = ""
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    logger.info(f"Received line: {line_str}")
                    if line_str.startswith('data: '):
                        data_str = line_str[6:]  # Remove 'data: ' prefix
                        if data_str.strip() == '[DONE]':
                            logger.info("Received [DONE] marker")
                            break
                        try:
                            data = json.loads(data_str)
                            logger.info(f"Parsed JSON data: {data}")
                            if 'choices' in data and len(data['choices']) > 0:
                                delta = data['choices'][0].get('delta', {})
                                if 'content' in delta:
                                    content = delta['content']
                                    logger.info(f"Received content: {content}")
                                    result_data += content
                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse JSON: {data_str}, error: {e}")
                            continue
            
            logger.info(f"Complete result_data: {result_data}")
            
            # Check if the response contains an image URL in markdown format
            import re
            image_url_pattern = r'!\[.*?\]\((https://[^)]+\.png)\)'
            image_match = re.search(image_url_pattern, result_data)
            
            if image_match:
                image_url = image_match.group(1)
                logger.info(f"Found generated image URL: {image_url}")
                
                try:
                    # Download the generated image from piapi.ai
                    generated_image = await self.download_image(image_url)
                    logger.info("Successfully downloaded generated image from piapi.ai")
                    return generated_image
                except Exception as e:
                    logger.error(f"Failed to download generated image: {e}")
                    # Fall back to traditional method if download fails
            else:
                logger.warning("No image URL found in piapi.ai response, falling back to traditional method")
            
        except Exception as e:
            logger.error(f"Error in piapi.ai generation: {e}")
            
        # Fall back to traditional image processing if AI fails
        logger.info("Falling back to traditional image processing")
        return await self._generate_traditional(
            product_image_url, logo_image_url, marking_zone, 
            technique, logo_scale, logo_rotation, logo_color
        )
    
    async def _generate_traditional(
        self,
        product_image_url: str,
        logo_image_url: str,
        marking_zone: Tuple[float, float, float, float],
        technique: str,
        logo_scale: float,
        logo_rotation: float,
        logo_color: Optional[str]
    ) -> Image.Image:
        """Generate mockup using traditional image processing as fallback"""
        try:
            # Download images
            product_image = await self.download_image(product_image_url)
            logo_image = await self.download_image(logo_image_url)
            
            # Apply logo to product using traditional method
            result_image = apply_logo_to_product(
                product_image=product_image,
                logo_image=logo_image,
                position=marking_zone,
                scale=logo_scale,
                rotation=logo_rotation,
                color_overlay=logo_color,
                texture_type=technique
            )
            
            return result_image
            
        except Exception as e:
            logger.error(f"Error in traditional image processing: {e}")
            raise

    def estimate_processing_time(self, use_ai: bool = True) -> int:
        """Estimate processing time in seconds"""
        if use_ai and self.api_key:
            return 30  # API processing time
        else:
            return 5  # Traditional image processing is much faster
    
    async def cleanup_models(self):
        """Clean up resources (no local models to clean)"""
        logger.info("AI service cleanup completed")


# Global AI service instance
ai_service = AIService()