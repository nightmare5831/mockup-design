import torch
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from diffusers import StableDiffusionInpaintPipeline
import cv2
from typing import Tuple, Optional
import logging
import os

class AILogoInpainting:
    """AI-powered inpainting system for seamless logo integration"""
    
    def __init__(self, model_id: str = "stabilityai/stable-diffusion-2-inpainting", device: str = None):
        """
        Initialize the AI inpainting system
        
        Args:
            model_id: HuggingFace model ID for inpainting
            device: Device to use ('cuda', 'mps', or 'cpu'). Auto-detects if None.
        """
        # Auto-detect best available device
        if device is None:
            if torch.cuda.is_available():
                self.device = "cuda"
            elif torch.backends.mps.is_available():
                self.device = "mps"
            else:
                self.device = "cpu"
        else:
            self.device = device
            
        logging.info(f"Using device: {self.device}")
        
        # Set appropriate dtype based on device
        self.dtype = torch.float16 if self.device != "cpu" else torch.float32
        
        try:
            logging.info(f"Loading inpainting model: {model_id}")
            self.pipe = StableDiffusionInpaintPipeline.from_pretrained(
                model_id,
                torch_dtype=self.dtype,
                safety_checker=None,
                requires_safety_checker=False,
                variant="fp16" if self.dtype == torch.float16 else None,
                use_safetensors=True
            )
            
            # Move to device
            self.pipe = self.pipe.to(self.device)
            
            # Enable optimizations
            if self.device == "cuda":
                self.pipe.enable_xformers_memory_efficient_attention()
                self.pipe.enable_vae_slicing()
            elif self.device == "cpu":
                self.pipe.enable_attention_slicing(1)
                
            logging.info("Inpainting pipeline loaded successfully")
            
        except Exception as e:
            logging.error(f"Failed to load inpainting model: {e}")
            raise
    
    def prepare_logo(self, logo_path: str, max_size: int = 200, 
                     opacity: float = 1.0) -> Image.Image:
        """
        Prepare logo for inpainting
        
        Args:
            logo_path: Path to logo image
            max_size: Maximum dimension for logo
            opacity: Logo opacity (0-1)
            
        Returns:
            Processed logo image with alpha channel
        """
        logo = Image.open(logo_path).convert("RGBA")
        
        # Resize logo while maintaining aspect ratio
        logo.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Adjust opacity if needed
        if opacity < 1.0:
            alpha = logo.split()[3]
            alpha = alpha.point(lambda p: int(p * opacity))
            logo.putalpha(alpha)
        
        return logo
    
    def create_inpainting_mask(self, image_size: Tuple[int, int], 
                               logo_position: Tuple[int, int], 
                               logo_size: Tuple[int, int],
                               feather_radius: int = 10) -> Image.Image:
        """
        Create a mask for inpainting with feathered edges
        
        Args:
            image_size: Size of the product image (width, height)
            logo_position: Position to place logo (x, y)
            logo_size: Size of the logo (width, height)
            feather_radius: Radius for edge feathering
            
        Returns:
            Mask image
        """
        mask = Image.new('L', image_size, 0)
        draw = ImageDraw.Draw(mask)
        
        # Draw white rectangle for logo area
        x, y = logo_position
        w, h = logo_size
        draw.rectangle([x, y, x + w, y + h], fill=255)
        
        # Apply Gaussian blur for feathered edges
        if feather_radius > 0:
            mask = mask.filter(ImageFilter.GaussianBlur(radius=feather_radius))
        
        return mask
    
    def find_optimal_position(self, image: Image.Image, logo_size: Tuple[int, int]) -> Tuple[int, int]:
        """
        Find optimal position for logo using edge detection
        
        Args:
            image: Product image
            logo_size: Size of logo (width, height)
            
        Returns:
            Optimal position (x, y)
        """
        # Convert to numpy array
        img_array = np.array(image.convert('RGB'))
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Calculate gradient magnitude (edge strength)
        sobelx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
        gradient = np.sqrt(sobelx**2 + sobely**2)
        
        # Create a sliding window to find the area with least edges
        h, w = image.size[1], image.size[0]
        logo_w, logo_h = logo_size
        
        min_edge_sum = float('inf')
        best_position = (w - logo_w - 20, h - logo_h - 20)  # Default to bottom-right
        
        # Sample positions (avoid edges)
        step = 50
        margin = 20
        
        for y in range(margin, h - logo_h - margin, step):
            for x in range(margin, w - logo_w - margin, step):
                # Calculate sum of edges in this region
                region = gradient[y:y+logo_h, x:x+logo_w]
                edge_sum = np.sum(region)
                
                if edge_sum < min_edge_sum:
                    min_edge_sum = edge_sum
                    best_position = (x, y)
        
        return best_position
    
    def inpaint_logo(self, 
                     product_image_path: str, 
                     logo_path: str,
                     position: Optional[Tuple[int, int]] = None,
                     prompt: str = "product with seamlessly integrated company logo, professional photography",
                     negative_prompt: str = "blurry, distorted, low quality, artificial, fake",
                     num_inference_steps: int = 50,
                     guidance_scale: float = 7.5,
                     strength: float = 0.99,
                     seed: int = None) -> Image.Image:
        """
        Place logo on product image using AI inpainting
        
        Args:
            product_image_path: Path to product image
            logo_path: Path to logo image
            position: Manual position override (x, y), auto-detects if None
            prompt: Text prompt for inpainting
            negative_prompt: Negative prompt
            num_inference_steps: Number of denoising steps
            guidance_scale: Guidance scale for diffusion
            strength: Denoising strength (0-1)
            seed: Random seed for reproducibility
            
        Returns:
            Image with logo seamlessly integrated
        """
        # Load images
        product_image = Image.open(product_image_path).convert("RGB")
        logo = self.prepare_logo(logo_path)
        
        # Ensure dimensions are divisible by 8 for Stable Diffusion
        width, height = product_image.size
        new_width = (width // 8) * 8
        new_height = (height // 8) * 8
        
        if new_width != width or new_height != height:
            product_image = product_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            logging.info(f"Resized image to {new_width}x{new_height}")
        
        # Find optimal position if not provided
        if position is None:
            position = self.find_optimal_position(product_image, logo.size)
            logging.info(f"Auto-detected position: {position}")
        
        # Create composite image
        composite = product_image.copy()
        if logo.mode == 'RGBA':
            composite.paste(logo, position, logo)
        else:
            composite.paste(logo, position)
        
        # Create inpainting mask
        mask = self.create_inpainting_mask(
            product_image.size, 
            position, 
            logo.size,
            feather_radius=15
        )
        
        # Set random seed if provided
        generator = None
        if seed is not None:
            generator = torch.Generator(device=self.device).manual_seed(seed)
        
        # Perform inpainting
        with torch.no_grad():
            result = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=composite,
                mask_image=mask,
                height=product_image.height,
                width=product_image.width,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                strength=strength,
                generator=generator
            ).images[0]
        
        return result
    
    def batch_inpaint(self, 
                      image_logo_pairs: list,
                      output_dir: str = "output",
                      **kwargs) -> list:
        """
        Batch process multiple images
        
        Args:
            image_logo_pairs: List of tuples (product_image_path, logo_path)
            output_dir: Output directory
            **kwargs: Additional arguments for inpaint_logo method
            
        Returns:
            List of output paths
        """
        os.makedirs(output_dir, exist_ok=True)
        output_paths = []
        
        for i, (product_path, logo_path) in enumerate(image_logo_pairs):
            try:
                logging.info(f"Processing {i+1}/{len(image_logo_pairs)}: {product_path}")
                
                result = self.inpaint_logo(product_path, logo_path, **kwargs)
                
                # Generate output filename
                filename = os.path.basename(product_path)
                name, ext = os.path.splitext(filename)
                output_path = os.path.join(output_dir, f"{name}_logo_inpainted.png")
                
                result.save(output_path, quality=95)
                output_paths.append(output_path)
                
                logging.info(f"Saved to: {output_path}")
                
            except Exception as e:
                logging.error(f"Error processing {product_path}: {str(e)}")
                
        return output_paths


# Example usage
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Initialize the AI inpainting system
    inpainter = AILogoInpainting()
    
    # Example 1: Single image with auto-positioning
    try:
        result = inpainter.inpaint_logo(
            product_image_path="product.jpg",
            logo_path="logo.png",
            prompt="product photograph with elegantly integrated brand logo, professional studio lighting",
            negative_prompt="amateur, poorly edited, obvious overlay, fake looking",
            num_inference_steps=50,
            guidance_scale=8.0,
            strength=0.95,
            seed=42  # For reproducible results
        )
        
        result.save("product_with_logo_ai.png", quality=95)
        print("Logo integrated successfully!")
        
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Example 2: Manual positioning
    try:
        result = inpainter.inpaint_logo(
            product_image_path="product.jpg",
            logo_path="logo.png",
            position=(100, 100),  # Manual position
            prompt="seamless logo integration on product surface",
            num_inference_steps=30,  # Faster processing
            guidance_scale=7.5
        )
        
        result.save("product_manual_position.png", quality=95)
        
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Example 3: Batch processing
    image_logo_pairs = [
        ("product.png", "logo.png"),
        ("product.png", "logo.png"),
        ("product.png", "logo.png")
    ]
    
    output_paths = inpainter.batch_inpaint(
        image_logo_pairs=image_logo_pairs,
        output_dir="./",
        prompt="professional product photo with integrated company branding",
        num_inference_steps=40,
        guidance_scale=7.5,
        strength=0.9
    )
    
    print(f"Batch processed {len(output_paths)} images")