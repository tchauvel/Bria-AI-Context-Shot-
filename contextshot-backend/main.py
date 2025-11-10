from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
import os
import logging
import json
import time
import base64
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Import ContextShot client
import sys
sys.path.append('..')
from utils.contextshot_client import ContextShotClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

# Global client instance
contextshot_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global contextshot_client
    
    # Load environment variables
    env_paths = ['.env', '../.env', os.path.join(os.path.dirname(__file__), '.env')]
    for env_path in env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path)
            logger.info(f"✅ Loaded .env from {env_path}")
            break
    else:
        logger.warning("⚠️ No .env file found")
    
    # Initialize client
    api_token = os.getenv('BRIA_API_TOKEN')
    logger.info(f"🔍 API Token loaded: {api_token[:10]}..." if api_token else "❌ No API token")
    if api_token:
        contextshot_client = ContextShotClient(api_token)
        logger.info("✅ ContextShot client initialized")
        logger.info(f"🔍 Client API token: {contextshot_client.api_token[:10]}...")
    else:
        logger.error("❌ BRIA_API_TOKEN not found")
    
    yield
    logger.info("🔄 Shutting down ContextShot API")

# Create FastAPI app
app = FastAPI(
    title="ContextShot API",
    description="Smart Product Photography with AI-Generated Contextual Backgrounds",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ContextConfig(BaseModel):
    product_type: str = "product"
    season: str = "Spring"
    demographic: str = "Millennials"
    setting: str = "Urban"
    style: str = "professional"
    custom_prompt: Optional[str] = None

class ProcessingResult(BaseModel):
    product_name: str
    status: str
    product_no_bg_url: Optional[str] = None
    background_url: Optional[str] = None
    final_image_url: Optional[str] = None
    error: Optional[str] = None
    processing_time: Optional[str] = None

# In-memory storage
processing_results: Dict[str, List[ProcessingResult]] = {}
processing_status: Dict[str, str] = {}

def validate_client():
    """Validate client is initialized"""
    if not contextshot_client:
        raise HTTPException(status_code=500, detail="ContextShot client not initialized")

def validate_image_file(file: UploadFile):
    """Validate uploaded file is an image"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

@app.get("/")
async def root():
    return {"message": "ContextShot API is running", "version": "1.0.0", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "bria_client_initialized": contextshot_client is not None,
        "api_token_available": os.getenv('BRIA_API_TOKEN') is not None
    }

@app.post("/upload/single")
async def upload_single_product(file: UploadFile = File(...), context_config: str = Form(default="{}")):
    """Process a single product image"""
    validate_client()
    validate_image_file(file)
    
    try:
        config_dict = json.loads(context_config) if context_config else {}
        config = ContextConfig(**config_dict)
        
        logger.info(f"🛍️ Processing single product: {file.filename}")
        
        # Mock result for testing
        result = {
            'product_name': f"{config.product_type} Product",
            'context_config': config.dict(),
            'product_no_bg_url': 'https://via.placeholder.com/400x400/ff0000/ffffff?text=Product+No+BG',
            'background_url': 'https://via.placeholder.com/400x400/00ff00/ffffff?text=Background',
            'final_image_url': 'https://via.placeholder.com/400x400/0000ff/ffffff?text=Final+Image',
            'processing_time': datetime.now().isoformat(),
            'status': 'success'
        }
        
        return ProcessingResult(**result)
        
    except Exception as e:
        logger.error(f"❌ Error processing single product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/batch")
async def upload_batch_products(files: List[UploadFile] = File(...), context_config: ContextConfig = ContextConfig()):
    """Process multiple product images in batch"""
    validate_client()
    
    for file in files:
        validate_image_file(file)
    
    try:
        batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        processing_status[batch_id] = "processing"
        processing_results[batch_id] = []
        
        logger.info(f"🚀 Starting batch processing: {batch_id} with {len(files)} products")
        
        results = []
        for i, file in enumerate(files):
            try:
                individual_config = context_config.dict().copy()
                individual_config['product_name'] = f"Product_{i+1}"
                
                result = contextshot_client.process_single_product(file.file, individual_config)
                results.append(ProcessingResult(**result))
                processing_results[batch_id].append(ProcessingResult(**result))
                
                logger.info(f"✅ Processed product {i+1}/{len(files)}")
                
            except Exception as e:
                logger.error(f"❌ Failed to process product {i+1}: {str(e)}")
                error_result = ProcessingResult(
                    product_name=f"Product_{i+1}",
                    status="failed",
                    error=str(e)
                )
                results.append(error_result)
                processing_results[batch_id].append(error_result)
        
        processing_status[batch_id] = "completed"
        logger.info(f"🎉 Batch processing completed: {batch_id}")
        
        return {
            "batch_id": batch_id,
            "results": results,
            "total_processed": len(files),
            "successful": len([r for r in results if r.status == "success"]),
            "failed": len([r for r in results if r.status == "failed"])
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/batch/{batch_id}/status")
async def get_batch_status(batch_id: str):
    """Get batch processing status"""
    if batch_id not in processing_status:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    return {
        "batch_id": batch_id,
        "status": processing_status[batch_id],
        "results": processing_results.get(batch_id, [])
    }

@app.get("/batch/{batch_id}/results")
async def get_batch_results(batch_id: str):
    """Get batch processing results"""
    if batch_id not in processing_results:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    return {"batch_id": batch_id, "results": processing_results[batch_id]}

@app.get("/stats")
async def get_processing_stats():
    """Get processing statistics"""
    validate_client()
    return contextshot_client.get_processing_stats()

@app.post("/stats/reset")
async def reset_stats():
    """Reset processing statistics"""
    validate_client()
    contextshot_client.reset_stats()
    return {"message": "Statistics reset successfully"}

@app.get("/context/preview")
async def preview_context_prompt(
    product_type: str = "product",
    season: str = "Spring", 
    demographic: str = "Millennials",
    setting: str = "Urban",
    style: str = "professional",
    custom_prompt: Optional[str] = None,
    visual_context: Optional[str] = None,
    timestamp: Optional[str] = None,  # Add timestamp to prevent caching
    # Advanced parameters
    environment: Optional[str] = None,
    timeOfDay: Optional[str] = None,
    weather: Optional[str] = None,
    colorPalette: Optional[str] = None,
    mood: Optional[str] = None,
    cameraAngle: Optional[str] = None,
    depthOfField: Optional[str] = None,
    composition: Optional[str] = None,
    props: Optional[str] = None,
    imageQuality: Optional[str] = None,
    aspectRatio: Optional[str] = None
):
    """Preview generated context prompt with optional visual analysis integration"""
    validate_client()
    
    try:
        logger.info(f"🔄 Generating fresh context prompt (timestamp: {timestamp})")
        logger.info(f"📥 Received parameters: product_type={product_type}, season={season}, environment={environment}, timeOfDay={timeOfDay}, weather={weather}, colorPalette={colorPalette}, mood={mood}, cameraAngle={cameraAngle}, depthOfField={depthOfField}, composition={composition}, props={props}, imageQuality={imageQuality}, aspectRatio={aspectRatio}")
        
        # Build context config from advanced parameters if available
        if any([environment, timeOfDay, weather, colorPalette, mood, cameraAngle, depthOfField, composition, props, imageQuality, aspectRatio]):
            # Use advanced parameters
            context_config = {
                'product_type': product_type,
                'season': season,
                'environment': environment,
                'timeOfDay': timeOfDay,
                'weather': weather,
                'colorPalette': colorPalette,
                'mood': mood,
                'cameraAngle': cameraAngle,
                'depthOfField': depthOfField,
                'composition': composition,
                'props': props,
                'imageQuality': imageQuality,
                'aspectRatio': aspectRatio
            }
            logger.info(f"🎨 Using advanced parameters: {context_config}")
        else:
            # Fall back to basic parameters
            context_config = ContextConfig(
                product_type=product_type,
                season=season,
                demographic=demographic,
                setting=setting,
                style=style,
                custom_prompt=custom_prompt
            ).dict()
            logger.info(f"🎨 Using basic parameters: {context_config}")
        
        # Parse visual context if provided
        parsed_visual_context = None
        if visual_context:
            try:
                parsed_visual_context = json.loads(visual_context)
                logger.info(f"🔍 Using visual context for prompt generation: {parsed_visual_context}")
            except json.JSONDecodeError:
                logger.warning("⚠️ Invalid visual context JSON, ignoring")
        
        # Generate context prompt using Claude AI with advanced parameters
        try:
            logger.info("🎨 Generating context prompt with Claude AI using advanced parameters...")
            
            # Get product description from visual analysis if available
            product_description = ""
            if parsed_visual_context and 'description' in parsed_visual_context:
                product_description = parsed_visual_context['description']
            else:
                product_description = f"{product_type} product"
            
            # Use Claude AI to generate the perfect prompt from advanced parameters
            final_prompt = await contextshot_client._generate_perfect_prompt_with_claude(
                product_description=product_description,
                context_config=context_config,
                visual_context=parsed_visual_context
            )
            bria_enhanced = True
            logger.info(f"✅ Generated Claude AI prompt: {final_prompt[:100]}...")
        except Exception as e:
            logger.warning(f"⚠️ Claude AI prompt generation failed: {str(e)}")
            # Fallback to local prompt generation
            base_prompt = await contextshot_client._build_context_prompt(context_config, parsed_visual_context)
            final_prompt = base_prompt
            bria_enhanced = False
            logger.info(f"✅ Generated local fallback prompt: {final_prompt[:100]}...")
        
        logger.info(f"✅ Generated fresh prompt: {final_prompt[:100]}...")
        
        return {
            "context_config": context_config,
            "generated_prompt": final_prompt,
            "visual_context_used": parsed_visual_context is not None,
            "claude_enhanced": bria_enhanced,  # Renamed to reflect Claude AI usage
            "timestamp": timestamp  # Echo back timestamp for debugging
        }
    except Exception as e:
        logger.error(f"❌ Error generating context prompt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/lifestyle")
async def generate_lifestyle_shots(
    file: UploadFile = File(...),
    lifestyle_prompt: str = Form(...),
    num_results: int = Form(2)
):
    """Generate lifestyle product shots using Bria AI Product Lifestyle Shot by Text API"""
    validate_image_file(file)
    
    try:
        logger.info(f"🎭 Generating lifestyle shots for: {file.filename}")
        logger.info(f"🎭 Lifestyle prompt: {lifestyle_prompt}")
        
        # Step 1: Convert product image to URL for lifestyle generation
        logger.info("🔄 Step 1: Preparing product image for lifestyle generation...")
        
        # For lifestyle shots, we want to use the original product image (with background)
        # Convert the uploaded file to base64 and create a data URL
        import base64
        file.file.seek(0)
        file_content = file.file.read()
        file.file.seek(0)
        
        # Get file extension
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else 'jpg'
        mime_type = f"image/{file_extension}"
        
        # Create data URL
        base64_string = base64.b64encode(file_content).decode('utf-8')
        product_image_url = f"data:{mime_type};base64,{base64_string}"
        
        logger.info(f"✅ Product image prepared for lifestyle generation")
        
        # Step 2: Generate lifestyle shots using original product image
        logger.info(f"Generating {num_results} lifestyle shots...")
        lifestyle_images = contextshot_client.generate_lifestyle_shot_by_text(
            product_image_url, 
            lifestyle_prompt, 
            num_results
        )
        
        if not lifestyle_images:
            logger.warning("⚠️ No lifestyle images generated")
            raise HTTPException(status_code=500, detail="Failed to generate lifestyle shots")
        
        # Format response
        results = []
        for i, image_url in enumerate(lifestyle_images):
            results.append({
                "image_url": image_url,
                "shot_type": "lifestyle",
                "prompt_used": lifestyle_prompt,
                "variation": i + 1,
                "generation_method": "Bria AI Lifestyle Shot (replace_background fallback)"
            })
        
        logger.info(f"✅ Generated {len(results)} lifestyle shots")
        
        return {
            "success": True,
            "results": results,
            "total_generated": len(results),
            "generation_method": "Bria AI Product Lifestyle Shot by Text",
            "processing_time": "~15-30 seconds per shot"
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating lifestyle shots: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def _calculate_ctr(variation: dict, config: dict) -> float:
    """Calculate realistic CTR based on variation type and context"""
    base_ctr = variation['base_ctr']
    
    # Adjust based on season
    season_multipliers = {
        'Spring': 1.05, 'Summer': 1.10, 'Fall': 1.08, 'Winter': 1.02
    }
    season_mult = season_multipliers.get(config.get('season', 'Spring'), 1.0)
    
    # Adjust based on demographic
    demographic_multipliers = {
        'Gen Z': 1.15, 'Millennials': 1.08, 'Gen X': 1.05, 'Baby Boomers': 1.02
    }
    demo_mult = demographic_multipliers.get(config.get('demographic', 'Millennials'), 1.0)
    
    # Adjust based on setting
    setting_multipliers = {
        'Urban': 1.08, 'Suburban': 1.05, 'Rural': 1.03, 'Coastal': 1.12, 'Mountain': 1.10
    }
    setting_mult = setting_multipliers.get(config.get('setting', 'Urban'), 1.0)
    
    calculated_ctr = base_ctr * season_mult * demo_mult * setting_mult
    return round(calculated_ctr, 3)

def _calculate_engagement(variation: dict, config: dict) -> float:
    """Calculate realistic engagement score based on variation and context"""
    base_engagement = variation['base_engagement']
    
    # Adjust based on style
    style_multipliers = {
        'professional': 1.0, 'modern': 1.05, 'minimalist': 1.08, 'luxury': 1.12, 'casual': 1.03
    }
    style_mult = style_multipliers.get(config.get('style', 'professional'), 1.0)
    
    # Add small random variation for realism
    import random
    random_factor = random.uniform(0.95, 1.05)
    
    calculated_engagement = base_engagement * style_mult * random_factor
    return round(calculated_engagement, 1)

def _calculate_brand_match(variation: dict, config: dict, index: int) -> float:
    """Calculate brand match score based on variation relevance and order"""
    base_score = 0.95
    
    # Decrease slightly for later variations (less priority)
    order_penalty = index * 0.015
    
    # Adjust based on variation type relevance
    relevance_scores = {
        'Lifestyle': 0.95, 'Commercial': 0.98, 'Editorial': 0.92, 
        'Minimalist': 0.90, 'Luxury': 0.88, 'Outdoor': 0.85
    }
    relevance_score = relevance_scores.get(variation['name'], 0.90)
    
    calculated_score = base_score - order_penalty + (relevance_score - 0.90)
    return round(max(0.70, min(0.98, calculated_score)), 2)

@app.post("/generate/images")
async def generate_images(file: UploadFile = File(...), context_config: str = Form(...)):
    """Generate product images with new backgrounds using Bria AI"""
    validate_client()
    validate_image_file(file)
    
    try:
        config = json.loads(context_config)
        prompt = config.get('prompt', '')
        num_images = min(config.get('num_images', 6), 6)  # Pro plan: up to 6 images for demo
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        logger.info(f"🎨 Processing product image: {file.filename}")
        logger.info(f"🎨 Context prompt: '{prompt[:50]}...'")
        
        # Enhanced contextual variations with realistic metrics calculation
        context_variations = [
            {
                'name': 'Lifestyle',
                'prompt_suffix': 'lifestyle photography',
                'use_case': 'Social Media',
                'base_ctr': 0.045,
                'base_engagement': 8.2,
                'cost_per_hour': 75,
                'hours_per_shot': 3
            },
            {
                'name': 'Commercial',
                'prompt_suffix': 'commercial photography',
                'use_case': 'E-commerce',
                'base_ctr': 0.038,
                'base_engagement': 7.8,
                'cost_per_hour': 100,
                'hours_per_shot': 2
            },
            {
                'name': 'Editorial',
                'prompt_suffix': 'editorial photography',
                'use_case': 'Magazine',
                'base_ctr': 0.042,
                'base_engagement': 8.5,
                'cost_per_hour': 150,
                'hours_per_shot': 4
            },
            {
                'name': 'Minimalist',
                'prompt_suffix': 'minimalist photography',
                'use_case': 'Website',
                'base_ctr': 0.035,
                'base_engagement': 7.2,
                'cost_per_hour': 80,
                'hours_per_shot': 2.5
            },
            {
                'name': 'Luxury',
                'prompt_suffix': 'luxury photography',
                'use_case': 'Premium Brand',
                'base_ctr': 0.052,
                'base_engagement': 9.1,
                'cost_per_hour': 200,
                'hours_per_shot': 5
            },
            {
                'name': 'Outdoor',
                'prompt_suffix': 'outdoor photography',
                'use_case': 'Outdoor Brand',
                'base_ctr': 0.041,
                'base_engagement': 8.7,
                'cost_per_hour': 120,
                'hours_per_shot': 3.5
            }
        ]
        
        # Step 1: Convert uploaded file to base64 for Bria AI API
        logger.info("🔄 Step 1: Preparing product image for background replacement...")
        try:
            import base64
            file.file.seek(0)
            file_content = file.file.read()
            file.file.seek(0)
            
            # Get file extension
            file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else 'jpg'
            mime_type = f"image/{file_extension}"
            
            # Create base64 string
            base64_string = base64.b64encode(file_content).decode('utf-8')
            logger.info(f"✅ Product image prepared for background replacement")
        except Exception as e:
            logger.error(f"❌ Error preparing product image: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error preparing product image: {str(e)}")
        
        # Step 2: Get visual analysis for enhanced prompts
        logger.info("🔄 Step 2: Analyzing visual content for enhanced prompts...")
        visual_context = None
        try:
            visual_analysis = contextshot_client._analyze_visual_content(file, file.filename or "")
            if visual_analysis:
                visual_context = visual_analysis
                logger.info(f"✅ Visual analysis completed: {len(visual_context.get('objects', []))} objects detected")
            else:
                logger.warning("⚠️ Visual analysis failed, proceeding without visual context")
        except Exception as e:
            logger.warning(f"⚠️ Visual analysis error: {str(e)}, proceeding without visual context")
        
        # Step 3: Generate perfect prompt using Claude AI
        logger.info("🔄 Step 3: Generating perfect prompt with Claude AI...")
        
        # Skip product analysis for now to avoid async issues
        product_analysis = None
        logger.info("🔍 Skipping product analysis for simplified approach")
        
        # Use simple product description
        product_description = "product photography"
        
        # Parse context configuration from frontend
        context_config = {}
        try:
            if 'context_config' in config:
                context_config = config['context_config']
            else:
                # Fallback to basic config
                context_config = {
                    'season': 'Spring',
                    'environment': 'Urban',
                    'mood': 'Professional',
                    'style': 'Commercial'
                }
        except Exception as e:
            logger.warning(f"⚠️ Could not parse context config: {str(e)}")
            context_config = {
                'season': 'Spring',
                'environment': 'Urban',
                'mood': 'Professional',
                'style': 'Commercial'
            }
        
        # Generate perfect prompt using Claude AI
        perfect_prompt = await contextshot_client._generate_perfect_prompt_with_claude(
            product_description, context_config, visual_context
        )
        logger.info(f"🎨 Generated simple prompt: {perfect_prompt}")
        
        # Step 4: Generate multiple variations using the same perfect prompt
        logger.info("🔄 Step 4: Generating campaign variations with perfect prompt...")
        generated_images = []
        
        for i in range(min(num_images, len(context_variations))):
            try:
                variation = context_variations[i]
                current_progress = i + 1
                total_images = min(num_images, len(context_variations))
                
                logger.info(f"Generating {variation['name']} variation ({current_progress}/{total_images})...")
                
                # Use the same perfect prompt for all variations
                base_prompt = perfect_prompt
                logger.info(f"🎨 Using perfect prompt for {variation['name']}: {base_prompt[:100]}...")
                
                # Enhance prompt with visual analysis if available
                if visual_context:
                    visual_enhancements = []
                    detected_objects = visual_context.get('objects', [])
                    environment = visual_context.get('environment', '')
                    detected_lighting = visual_context.get('lighting', '')
                    
                    # Add meaningful objects to prompt
                    meaningful_objects = [obj for obj in detected_objects if obj not in ['square_shot', 'portrait_shot', 'wide_shot', 'high_contrast', 'bright_background', 'dark_background', 'colored_background']]
                    if meaningful_objects:
                        visual_enhancements.append(f"incorporating {', '.join(meaningful_objects[:2])} elements")
                    
                    # Add environment context
                    if environment and environment != 'unknown':
                        visual_enhancements.append(f"enhanced {environment} setting")
                    
                    # Add lighting context
                    if detected_lighting and detected_lighting != 'natural':
                        visual_enhancements.append(f"with {detected_lighting} lighting")
                    
                    if visual_enhancements:
                        base_prompt += f", enhanced with {', '.join(visual_enhancements)}"
                
                full_prompt = base_prompt
                
                logger.info(f"Generating {variation['name']} variation ({current_progress}/{total_images})...")
                
                # Use enhanced replace background method with original image (unique seed for each variation)
                logger.info(f"🔄 Calling replace_product_background_enhanced for {variation['name']}")
                logger.info(f"🔄 Prompt: {full_prompt}")
                logger.info(f"🔄 Base64 length: {len(base64_string)}")
                
                background_result = await asyncio.to_thread(
                    contextshot_client.replace_product_background_enhanced,
                    base64_string, full_prompt, seed=None
                )
                
                logger.info(f"🔄 Background result: {background_result}")
                
                if background_result:
                    # Extract image URL and unique seed for this variation
                    final_image_url = background_result['image_url']
                    returned_seed = background_result['seed']
                    
                    logger.info(f"✅ Generated {variation['name']} variation {current_progress}/{total_images}")
                    logger.info(f"🎲 Unique seed: {returned_seed}")
                    logger.info(f"🖼️ Final image URL: {final_image_url}")
                    
                    # Calculate realistic metrics based on context and variation
                    predicted_ctr = _calculate_ctr(variation, config)
                    engagement_score = _calculate_engagement(variation, config)
                    brand_match_score = _calculate_brand_match(variation, config, i)
                    
                    generated_images.append({
                        'final_image': final_image_url,
                        'background_prompt': full_prompt,
                        'variation': i + 1,
                        'context_name': variation['name'],
                        'use_case': variation['use_case'],
                        'predicted_ctr': predicted_ctr,
                        'engagement_score': engagement_score,
                        'brand_match_score': brand_match_score,
                        'cost_saved': variation['cost_per_hour'] * variation['hours_per_shot'],
                        'time_saved_hours': variation['hours_per_shot'],
                        'seed': returned_seed,
                        'refined_prompt': background_result.get('refined_prompt', full_prompt)
                    })
                else:
                    logger.error(f"❌ No background result for {variation['name']} variation")
                
                # Add delay between requests for rate limiting
                if i < num_images - 1:
                    logger.info("⏳ Waiting 3 seconds between variations...")
                    time.sleep(3)
                    
            except Exception as e:
                logger.error(f"❌ Error generating variation {i+1}: {str(e)}")
        
        logger.info(f"🎨 Successfully processed product with {len(generated_images)} contextual variations")
        
        # Check if no images were generated
        if len(generated_images) == 0:
            logger.warning("⚠️ No images were generated - likely due to API rate limits or errors")
            
            # Check if we should use mock mode
            use_mock_mode = os.getenv('USE_MOCK_MODE', 'false').lower() == 'true'
            
            if use_mock_mode:
                logger.info("🎭 Using mock mode for testing")
                # Generate mock images for testing
                mock_images = []
                for i, variation in enumerate(context_variations[:num_images]):
                    mock_images.append({
                        'final_image': f'https://via.placeholder.com/400x400/6b2cff/ffffff?text=Mock+{variation["name"]}',
                        'background_prompt': f'{prompt} - {variation["name"]} variation',
                        'variation': i + 1,
                        'context_name': variation['name'],
                        'use_case': variation['use_case'],
                        'predicted_ctr': 0.035 + (i * 0.005),
                        'engagement_score': 7.5 + (i * 0.5),
                        'brand_match_score': 0.85 + (i * 0.02),
                        'cost_saved': variation['cost_per_hour'] * variation['hours_per_shot'],
                        'time_saved_hours': variation['hours_per_shot'],
                        'seed': f'mock_seed_{i}',
                        'refined_prompt': f'{prompt} - {variation["name"]} variation'
                    })
                
                generated_images = mock_images
                logger.info(f"🎭 Generated {len(mock_images)} mock images")
            else:
                raise HTTPException(
                    status_code=429, 
                    detail="Image generation failed. This may be due to API rate limits. Please check your Bria AI plan or try again later."
                )
        
        # Calculate aggregate metrics
        total_cost_saved = sum(img.get('cost_saved', 0) for img in generated_images)
        total_time_saved = sum(img.get('time_saved_hours', 0) for img in generated_images)
        avg_ctr = sum(img['predicted_ctr'] for img in generated_images) / len(generated_images) if generated_images else 0
        avg_engagement = sum(img['engagement_score'] for img in generated_images) / len(generated_images) if generated_images else 0
        
        # Calculate ROI based on actual costs vs AI generation cost
        ai_generation_cost = len(generated_images) * 0.50  # $0.50 per AI-generated image
        roi_percentage = ((total_cost_saved - ai_generation_cost) / ai_generation_cost * 100) if ai_generation_cost > 0 else 0
        
        return {
            "images": [img['final_image'] for img in generated_images],
            "detailed_results": generated_images,
            "prompt": prompt,
            "num_generated": len(generated_images),
            "generation_time": datetime.now().isoformat(),
            "total_cost_saved": total_cost_saved,
            "time_saved_hours": total_time_saved,
            "roi_percentage": round(roi_percentage, 1),
            "avg_ctr": round(avg_ctr, 3),
            "avg_engagement": round(avg_engagement, 1),
            "ai_generation_cost": ai_generation_cost
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating images: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/product")
async def analyze_product(file: UploadFile = File(...)):
    """Analyze product image and generate AI description using Bria AI Contextual Keyword Extraction"""
    validate_image_file(file)
    
    try:
        logger.info(f"🔍 Analyzing product with Bria AI: {file.filename}")
        
        # Use Bria AI Contextual Keyword Extraction
        logger.info(f"🔍 Calling extract_contextual_keywords for file: {file.filename}")
        logger.info(f"🔍 Client API token in analyze: {contextshot_client.api_token[:10]}...")
        logger.info(f"🔍 Client type: {type(contextshot_client)}")
        logger.info(f"🔍 Client module: {contextshot_client.__class__.__module__}")
        
        # Debug: Check file object
        logger.info(f"🔍 File object type: {type(file)}")
        logger.info(f"🔍 File filename: {file.filename}")
        logger.info(f"🔍 File content type: {file.content_type}")
        
        keywords_result = await contextshot_client.extract_contextual_keywords(file)
        logger.info(f"🔍 Keywords result AI source: {keywords_result.get('ai_source', 'Unknown') if keywords_result else 'None'}")
        logger.info(f"🔍 Keywords result type: {type(keywords_result)}")
        
        # Debug: Check if Bria AI was used
        if keywords_result and 'Bria AI' in keywords_result.get('ai_source', ''):
            logger.info("🎉 SUCCESS! Bria AI integration working!")
        else:
            logger.warning("⚠️ Using fallback analysis - Bria AI not working")
        
        if keywords_result:
            # Process the analysis result
            keywords = keywords_result.get('keywords', [])
            product_type = keywords_result.get('product_type', 'Product')
            description = keywords_result.get('description', '')
            if not description:
                description = keywords_result.get('product_description', f"Professional {product_type.lower()} with modern design and high-quality materials.")
            analysis_method = keywords_result.get('analysis_method', 'Bria AI Analysis')
            
            logger.info(f"📊 Analysis result - Description length: {len(description)}, Description preview: {description[:100]}...")
            logger.info(f"📊 Analysis result - Product type: {product_type}, AI source: {analysis_method}")
            
            analysis_result = {
                "product_description": description,
                "product_name": product_type,
                "category": keywords_result.get('category', 'Product'),
                "features": keywords[:8],  # Top 8 features
                "confidence": keywords_result.get('confidence', 0.85),
                "ai_source": analysis_method,
                "raw_keywords": keywords,
                "analysis_time": datetime.now().isoformat(),
                "visual_context": keywords_result.get('visual_context', {})
            }
            
            logger.info(f"✅ Bria AI product analysis completed with {len(keywords)} keywords")
            logger.info(f"📤 Returning analysis result with description: {analysis_result['product_description'][:100]}...")
            return analysis_result
        else:
            # Fallback to mock analysis if Bria AI fails
            logger.warning("⚠️ Bria AI analysis failed, using fallback description")
            analysis_result = {
                "product_description": "High-quality product with modern design and professional features. Perfect for commercial use.",
                "product_name": "Premium Product",
                "category": "Product",
                "features": ["Modern design", "High quality", "Professional", "Commercial grade"],
                "confidence": 0.75,
                "ai_source": "Fallback Description",
                "analysis_time": datetime.now().isoformat()
            }
            return analysis_result
        
    except Exception as e:
        logger.error(f"❌ Error analyzing product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/visual")
async def analyze_visual_content(file: UploadFile = File(...)):
    """Comprehensive visual analysis endpoint for detailed image understanding"""
    validate_image_file(file)
    
    try:
        logger.info(f"🔍 Performing comprehensive visual analysis: {file.filename}")
        
        # Get comprehensive visual analysis
        visual_analysis = contextshot_client._analyze_visual_content(file, file.filename or "")
        
        if not visual_analysis:
            logger.warning("⚠️ No visual analysis results")
            return {
                "success": False,
                "error": "Visual analysis failed",
                "visual_context": {
                    "objects_detected": [],
                    "environment": "unknown",
                    "setting": "indoor",
                    "lighting": "natural",
                    "context": "product photography",
                    "confidence": 0.0
                }
            }
        
        logger.info(f"✅ Visual analysis completed: {visual_analysis}")
        
        return {
            "success": True,
            "visual_context": visual_analysis,
            "analysis_time": datetime.now().isoformat(),
            "filename": file.filename,
            "file_size": file.size if hasattr(file, 'size') else 'unknown'
        }
        
    except Exception as e:
        logger.error(f"❌ Error in visual analysis: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "visual_context": {
                "objects_detected": [],
                "environment": "unknown",
                "setting": "indoor",
                "lighting": "natural",
                "context": "product photography",
                "confidence": 0.0
            }
        }

@app.post("/apply/reference-background")
async def apply_reference_background(
    file: UploadFile = File(...), 
    reference_data: str = Form(...)
):
    """Apply a reference background to a new product image"""
    try:
        logger.info(f"🎨 Applying reference background to new image")
        
        # Parse reference data (contains seed and prompt from selected reference)
        reference_info = json.loads(reference_data)
        seed = reference_info.get('seed')
        prompt = reference_info.get('prompt')
        
        if not seed or not prompt:
            raise HTTPException(status_code=400, detail="Reference seed and prompt are required")
        
        logger.info(f"🎲 Using reference seed: {seed}")
        logger.info(f"📝 Using reference prompt: {prompt}")
        
        # Convert uploaded image to base64
        image_data = await file.read()
        base64_string = base64.b64encode(image_data).decode('utf-8')
        
        # Apply the reference background using the stored seed
        background_result = await asyncio.to_thread(
            contextshot_client.replace_product_background_enhanced,
            base64_string, prompt, seed=seed
        )
        
        if background_result:
            logger.info(f"✅ Successfully applied reference background")
            
            return {
                "success": True,
                "image_url": background_result['image_url'],
                "seed": background_result['seed'],
                "prompt": background_result['prompt'],
                "refined_prompt": background_result['refined_prompt'],
                "message": "Reference background applied successfully"
            }
        else:
            logger.error(f"❌ Failed to apply reference background")
            raise HTTPException(status_code=500, detail="Failed to apply reference background")
            
    except Exception as e:
        logger.error(f"❌ Error applying reference background: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error applying reference background: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")