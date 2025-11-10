import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Sparkles, Calendar, MapPin, Users, X, Download, BarChart3, Zap, Target, Palette
} from 'lucide-react';

// Type definitions for AI-generated image data
interface GeneratedImage {
  final_image: string;
  context_name?: string;
  use_case?: string;
  predicted_ctr: number;
  engagement_score: number;
  brand_match_score: number;
  background_prompt: string;
  seed?: number;
  refined_prompt?: string;
}

interface LifestyleImage {
  image_url: string;
  prompt_used: string;
  generation_method: string;
  variation?: number;
}

const ContextShot = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productFeatures, setProductFeatures] = useState<string[]>([]);
  const [visualContext, setVisualContext] = useState<any>(null);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiSource, setAiSource] = useState('');
  const [environment, setEnvironment] = useState('');
  const [setting, setSetting] = useState('');
  const [lighting, setLighting] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [previewPrompt, setPreviewPrompt] = useState('');
  const [editablePrompt, setEditablePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [lifestyleImages, setLifestyleImages] = useState<LifestyleImage[]>([]);
  const [lifestyleLoading, setLifestyleLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [appLoaded, setAppLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [originalImageExpanded, setOriginalImageExpanded] = useState(false);
  const [selectedReference, setSelectedReference] = useState<GeneratedImage | null>(null);
  const [referenceMode, setReferenceMode] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [appliedImages, setAppliedImages] = useState<string[]>([]);

  // Context Configuration State
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [advancedParams, setAdvancedParams] = useState<any>({});
  const [activeTab, setActiveTab] = useState('templates');
  const [applyingBackground, setApplyingBackground] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const environments = ['indoor', 'outdoor', 'studio', 'natural'];
  const settings = ['Urban', 'Suburban', 'Rural', 'Coastal', 'Mountain'];
  const lightings = ['natural', 'studio', 'soft', 'dramatic', 'evening'];

  // Template Library Data
  const templates = [
    {
      id: "urban-lifestyle",
      name: "Urban Lifestyle",
      description: "Street, city vibes",
      previewGradient: "from-blue-200 to-purple-300",
      targetDemographic: "Gen Z",
      predictedCTR: 4.2,
      category: "lifestyle",
      advancedParams: {
        season: "summer",
        environment: "urban-city",
        timeOfDay: "golden-hour",
        weather: "clear-sunny",
        colorPalette: "vibrant-saturated",
        mood: "energetic-dynamic",
        cameraAngle: "eye-level",
        depthOfField: "shallow",
        composition: "rule-of-thirds",
        props: "minimal"
      }
    },
    {
      id: "outdoor-adventure",
      name: "Active Lifestyle",
      description: "Nature, hiking",
      previewGradient: "from-green-200 to-yellow-300",
      targetDemographic: "Millennials",
      predictedCTR: 3.8,
      advancedParams: {
        season: "fall",
        environment: "mountain-alpine",
        timeOfDay: "morning-light",
        weather: "clear-sunny",
        colorPalette: "earth-tones",
        mood: "energetic-dynamic",
        cameraAngle: "low-angle",
        depthOfField: "deep",
        composition: "leading-lines",
        props: "natural-elements"
      }
    },
    {
      id: "cozy-indoor",
      name: "Home Comfort",
      description: "Warm, relaxed",
      previewGradient: "from-orange-200 to-pink-300",
      targetDemographic: "All ages",
      predictedCTR: 3.5,
      advancedParams: {
        season: "winter",
        environment: "home-interior",
        timeOfDay: "afternoon",
        weather: "overcast-moody",
        colorPalette: "warm-tones",
        mood: "cozy-warm",
        cameraAngle: "eye-level",
        depthOfField: "shallow",
        composition: "centered-symmetrical",
        props: "lifestyle-props"
      }
    },
    {
      id: "luxury-premium",
      name: "Luxury Premium",
      description: "Elegant, sophisticated",
      previewGradient: "from-gray-200 to-blue-300",
      targetDemographic: "Gen X",
      predictedCTR: 4.5,
      advancedParams: {
        season: "holiday",
        environment: "indoor-studio",
        timeOfDay: "golden-hour",
        weather: "clear-sunny",
        colorPalette: "cool-tones",
        mood: "elegant-sophisticated",
        cameraAngle: "low-angle",
        depthOfField: "shallow",
        composition: "rule-of-thirds",
        props: "minimal"
      }
    },
    {
      id: "beach-vacation",
      name: "Beach Vacation",
      description: "Tropical, sunny",
      previewGradient: "from-cyan-200 to-orange-300",
      targetDemographic: "Millennials",
      predictedCTR: 4.0,
      advancedParams: {
        season: "summer",
        environment: "beach-coastal",
        timeOfDay: "golden-hour",
        weather: "clear-sunny",
        colorPalette: "vibrant-saturated",
        mood: "playful-fun",
        cameraAngle: "eye-level",
        depthOfField: "medium",
        composition: "rule-of-thirds",
        props: "natural-elements"
      }
    },
    {
      id: "professional-office",
      name: "Professional Office",
      description: "Business, corporate",
      previewGradient: "from-slate-200 to-indigo-300",
      targetDemographic: "Gen X",
      predictedCTR: 3.2,
      advancedParams: {
        season: "back-to-school",
        environment: "office-workspace",
        timeOfDay: "morning-light",
        weather: "clear-sunny",
        colorPalette: "cool-tones",
        mood: "bold-confident",
        cameraAngle: "eye-level",
        depthOfField: "deep",
        composition: "centered-symmetrical",
        props: "minimal"
      }
    },
    {
      id: "cafe-social",
      name: "Cafe Social",
      description: "Social, community",
      previewGradient: "from-amber-200 to-red-300",
      targetDemographic: "Gen Z",
      predictedCTR: 3.7,
      advancedParams: {
        season: "fall",
        environment: "cafe-restaurant",
        timeOfDay: "afternoon",
        weather: "partly-cloudy",
        colorPalette: "warm-tones",
        mood: "cozy-warm",
        cameraAngle: "eye-level",
        depthOfField: "shallow",
        composition: "rule-of-thirds",
        props: "lifestyle-props"
      }
    },
    {
      id: "fitness-active",
      name: "Fitness Active",
      description: "Athletic, energetic",
      previewGradient: "from-green-200 to-blue-300",
      targetDemographic: "Gen Z",
      predictedCTR: 4.1,
      advancedParams: {
        season: "summer",
        environment: "gym-fitness",
        timeOfDay: "morning-light",
        weather: "clear-sunny",
        colorPalette: "vibrant-saturated",
        mood: "energetic-dynamic",
        cameraAngle: "low-angle",
        depthOfField: "medium",
        composition: "leading-lines",
        props: "minimal"
      }
    }
  ];

  // Advanced Parameters Options
  const seasonOptions = [
    {
      value: "spring",
      label: "Spring (March-May)",
      prompt: "spring season, blooming flowers, fresh green foliage, cherry blossoms, pastel colors, renewal atmosphere",
      colors: ["#FFB6C1", "#98FB98", "#FFFACD"],
      suggestedEnvironments: ["park-garden", "suburban", "outdoor"]
    },
    {
      value: "summer",
      label: "Summer (June-August)",
      prompt: "summer season, bright sunshine, vibrant colors, lush greenery, warm weather, beach vibes",
      colors: ["#FFD700", "#00CED1", "#32CD32"],
      suggestedEnvironments: ["beach-coastal", "outdoor", "park-garden"]
    },
    {
      value: "fall",
      label: "Fall/Autumn (September-November)",
      prompt: "autumn season, falling leaves, warm orange red tones, harvest atmosphere, cozy vibes",
      colors: ["#FF8C00", "#DC143C", "#B8860B"],
      suggestedEnvironments: ["forest-woods", "park-garden", "home-interior"]
    },
    {
      value: "winter",
      label: "Winter (December-February)",
      prompt: "winter season, snow, cold atmosphere, icy blue tones, minimal foliage, crisp air",
      colors: ["#FFFFFF", "#B0E0E6", "#4682B4"],
      suggestedEnvironments: ["mountain-alpine", "home-interior", "urban-city"]
    },
    {
      value: "holiday",
      label: "Holiday Season (November-December)",
      prompt: "holiday season, festive decorations, warm lights, celebratory mood, gift atmosphere",
      colors: ["#DC143C", "#228B22", "#FFD700"],
      suggestedEnvironments: ["home-interior", "urban-city", "cafe-restaurant"]
    },
    {
      value: "back-to-school",
      label: "Back to School (August-September)",
      prompt: "back to school season, academic setting, fresh start energy, study atmosphere",
      colors: ["#4169E1", "#FFD700", "#FF6347"],
      suggestedEnvironments: ["office-workspace", "cafe-restaurant", "urban-city"]
    }
  ];

  const environmentOptions = [
    {
      value: "urban-city",
      label: "Urban City (Street, Buildings)",
      prompt: "urban city environment, street scene, modern buildings, city skyline, concrete jungle, metropolitan atmosphere",
      bestFor: ["Gen Z", "Millennials"],
      lighting: "natural + artificial mix"
    },
    {
      value: "suburban",
      label: "Suburban (Residential, Neighborhood)",
      prompt: "suburban environment, residential neighborhood, houses, tree-lined streets, family-friendly atmosphere",
      bestFor: ["Millennials", "Gen X"],
      lighting: "natural daylight"
    },
    {
      value: "rural-countryside",
      label: "Rural Countryside (Fields, Farms)",
      prompt: "rural countryside, open fields, farms, agricultural land, peaceful natural setting",
      bestFor: ["All ages"],
      lighting: "natural outdoor"
    },
    {
      value: "beach-coastal",
      label: "Beach/Coastal (Ocean, Sand)",
      prompt: "beach coastal environment, ocean waves, sandy shore, tropical atmosphere, vacation vibes",
      bestFor: ["Millennials", "Gen Z"],
      lighting: "bright natural"
    },
    {
      value: "mountain-alpine",
      label: "Mountain/Alpine (Peaks, Trails)",
      prompt: "mountain alpine environment, peaks, hiking trails, elevated terrain, adventure setting",
      bestFor: ["Millennials", "Active"],
      lighting: "high altitude bright"
    },
    {
      value: "forest-woods",
      label: "Forest/Woods (Trees, Nature)",
      prompt: "forest woods environment, trees, natural foliage, woodland setting, organic atmosphere",
      bestFor: ["All ages"],
      lighting: "dappled natural"
    },
    {
      value: "desert",
      label: "Desert (Sand, Minimal vegetation)",
      prompt: "desert environment, sand dunes, minimal vegetation, arid landscape, stark beauty",
      bestFor: ["Luxury", "Editorial"],
      lighting: "harsh bright"
    },
    {
      value: "indoor-studio",
      label: "Indoor Studio (Professional, Clean)",
      prompt: "indoor studio environment, professional lighting setup, clean background, controlled setting",
      bestFor: ["Commercial", "Luxury"],
      lighting: "professional studio"
    },
    {
      value: "home-interior",
      label: "Home Interior (Living room, Kitchen)",
      prompt: "home interior environment, living room or kitchen setting, residential comfort, everyday lifestyle",
      bestFor: ["All ages"],
      lighting: "warm indoor"
    },
    {
      value: "office-workspace",
      label: "Office/Workspace (Desk, Modern)",
      prompt: "office workspace environment, desk setting, modern professional space, productivity atmosphere",
      bestFor: ["Millennials", "Gen X"],
      lighting: "bright office"
    },
    {
      value: "gym-fitness",
      label: "Gym/Fitness Center (Equipment, Active)",
      prompt: "gym fitness center environment, workout equipment, active athletic setting, energetic atmosphere",
      bestFor: ["Gen Z", "Active"],
      lighting: "bright energetic"
    },
    {
      value: "cafe-restaurant",
      label: "Cafe/Restaurant (Social, Food)",
      prompt: "cafe restaurant environment, social dining setting, food service atmosphere, community gathering",
      bestFor: ["Gen Z", "Millennials"],
      lighting: "warm ambient"
    },
    {
      value: "park-garden",
      label: "Park/Garden (Green, Outdoors)",
      prompt: "park garden environment, green outdoor space, landscaped setting, recreational atmosphere",
      bestFor: ["All ages"],
      lighting: "natural outdoor"
    }
  ];

  const timeOfDayOptions = [
    {
      value: "golden-hour",
      label: "Golden Hour (Sunrise/Sunset)",
      prompt: "golden hour lighting, warm soft sunlight, long shadows, magical atmosphere",
      kelvinTemp: "3000-4000K",
      bestFor: "emotional, romantic shots"
    },
    {
      value: "morning-light",
      label: "Morning Light (6-10 AM)",
      prompt: "bright morning sunlight, fresh daylight, energetic atmosphere, new day energy",
      kelvinTemp: "5000-6000K",
      bestFor: "active, fresh products"
    },
    {
      value: "midday-bright",
      label: "Midday Bright (11 AM-2 PM)",
      prompt: "midday sun, harsh bright lighting, high contrast, intense illumination",
      kelvinTemp: "5500-6500K",
      bestFor: "clear product details"
    },
    {
      value: "afternoon",
      label: "Afternoon (3-5 PM)",
      prompt: "afternoon lighting, warm balanced daylight, comfortable atmosphere",
      kelvinTemp: "4500-5500K",
      bestFor: "lifestyle, casual shots"
    },
    {
      value: "blue-hour",
      label: "Blue Hour (Dusk)",
      prompt: "blue hour twilight, soft ambient light, dreamy atmosphere, gentle transition",
      kelvinTemp: "8000-12000K",
      bestFor: "moody, atmospheric shots"
    },
    {
      value: "night-evening",
      label: "Night/Evening",
      prompt: "evening ambient lighting, artificial lights, nighttime atmosphere, dramatic mood",
      kelvinTemp: "2700-3500K",
      bestFor: "dramatic, urban shots"
    }
  ];

  const weatherOptions = [
    { value: "clear-sunny", label: "Clear & Sunny", prompt: "clear blue sky, bright sunshine, crisp atmosphere" },
    { value: "partly-cloudy", label: "Partly Cloudy", prompt: "soft clouds, diffused natural light, gentle atmosphere" },
    { value: "overcast-moody", label: "Overcast/Moody", prompt: "overcast sky, moody atmosphere, dramatic lighting, cloudy" },
    { value: "rainy", label: "Rainy", prompt: "rainy weather, wet surfaces, dramatic mood, water droplets" },
    { value: "foggy-misty", label: "Foggy/Misty", prompt: "fog atmosphere, misty environment, ethereal mood, soft visibility" },
    { value: "snowy", label: "Snowy", prompt: "snow falling, winter atmosphere, cold aesthetic, white landscape" }
  ];

  const colorPaletteOptions = [
    { value: "vibrant-saturated", label: "Vibrant & Saturated", prompt: "vibrant saturated colors, bold color palette, high saturation" },
    { value: "warm-tones", label: "Warm Tones (Red, Orange, Yellow)", prompt: "warm color palette, orange yellow red tones, cozy feel" },
    { value: "cool-tones", label: "Cool Tones (Blue, Green, Purple)", prompt: "cool color palette, blue green purple tones, calm feel" },
    { value: "muted-pastel", label: "Muted & Pastel", prompt: "muted pastel colors, soft color palette, gentle tones" },
    { value: "monochrome", label: "Monochrome (B&W)", prompt: "monochromatic color scheme, black and white tones, grayscale" },
    { value: "earth-tones", label: "Earth Tones (Brown, Green, Tan)", prompt: "earth tone palette, natural browns greens tans" }
  ];

  const moodOptions = [
    { value: "energetic-dynamic", label: "Energetic & Dynamic", prompt: "energetic dynamic mood, active vibrant atmosphere" },
    { value: "calm-peaceful", label: "Calm & Peaceful", prompt: "calm peaceful mood, serene tranquil atmosphere" },
    { value: "cozy-warm", label: "Cozy & Warm", prompt: "cozy warm mood, comfortable inviting atmosphere" },
    { value: "bold-confident", label: "Bold & Confident", prompt: "bold confident mood, strong powerful aesthetic" },
    { value: "playful-fun", label: "Playful & Fun", prompt: "playful fun mood, lighthearted joyful atmosphere" },
    { value: "elegant-sophisticated", label: "Elegant & Sophisticated", prompt: "elegant sophisticated mood, refined luxurious aesthetic" }
  ];

  const cameraAngleOptions = [
    { value: "eye-level", label: "Eye Level", prompt: "eye level camera angle, straight on view, neutral perspective" },
    { value: "low-angle", label: "Low Angle (Hero Shot)", prompt: "low angle shot, looking up perspective, hero angle, empowering" },
    { value: "high-angle", label: "High Angle (Flatlay)", prompt: "high angle overhead shot, flat lay perspective, birds eye view" },
    { value: "dutch-angle", label: "Dutch Angle (Dynamic)", prompt: "dutch angle, tilted dynamic perspective, energetic composition" },
    { value: "close-up", label: "Close-up Detail", prompt: "close up macro shot, detail focus, intimate perspective" }
  ];

  const depthOfFieldOptions = [
    { value: "shallow", label: "Shallow (Blurred Background)", prompt: "shallow depth of field, bokeh blurred background, isolated subject" },
    { value: "medium", label: "Medium (Balanced)", prompt: "medium depth of field, balanced focus, contextual clarity" },
    { value: "deep", label: "Deep (All in Focus)", prompt: "deep depth of field, everything in sharp focus, comprehensive view" }
  ];

  const compositionOptions = [
    { value: "rule-of-thirds", label: "Rule of Thirds", prompt: "rule of thirds composition, balanced layout, professional framing" },
    { value: "centered-symmetrical", label: "Centered/Symmetrical", prompt: "centered symmetrical composition, balanced harmony" },
    { value: "leading-lines", label: "Leading Lines", prompt: "leading lines composition, directional flow, guided perspective" },
    { value: "frame-within-frame", label: "Frame within Frame", prompt: "frame within frame composition, layered depth, focus" },
    { value: "negative-space", label: "Negative Space", prompt: "negative space composition, minimalist layout, breathing room" }
  ];

  const propsOptions = [
    { value: "minimal", label: "Minimal (Product Focus)", prompt: "minimal props, product focused, clean simple, no distractions" },
    { value: "lifestyle-props", label: "Lifestyle Props", prompt: "lifestyle props, coffee cup books magazine, everyday objects, relatable" },
    { value: "seasonal-elements", label: "Seasonal Elements", prompt: "seasonal decorative elements, contextual props, time-appropriate" },
    { value: "brand-accessories", label: "Brand Accessories", prompt: "brand specific accessories, complementary products, cohesive ecosystem" },
    { value: "natural-elements", label: "Natural Elements", prompt: "natural elements, plants wood stone, organic textures, earthy" }
  ];

  const imageQualityOptions = [
    { value: "standard", label: "Standard (Fast)", apiParams: { quality: 0.7, steps: 20, time: "~30s" } },
    { value: "high", label: "High Quality", apiParams: { quality: 0.85, steps: 35, time: "~60s" } },
    { value: "ultra", label: "Ultra HD (Slow)", apiParams: { quality: 1.0, steps: 50, time: "~120s" } }
  ];

  const aspectRatioOptions = [
    { value: "1:1", label: "1:1 (Square)", dimensions: { width: 1024, height: 1024 }, platform: "Instagram Post" },
    { value: "4:5", label: "4:5 (Portrait)", dimensions: { width: 1080, height: 1350 }, platform: "Instagram Portrait" },
    { value: "16:9", label: "16:9 (Landscape)", dimensions: { width: 1920, height: 1080 }, platform: "YouTube/Desktop" },
    { value: "9:16", label: "9:16 (Vertical)", dimensions: { width: 1080, height: 1920 }, platform: "Stories/Reels" },
    { value: "4:3", label: "4:3 (Standard)", dimensions: { width: 1600, height: 1200 }, platform: "Print" }
  ];

  // Template selection handler
  const handleTemplateSelect = (template: any) => {
    console.log('🎯 Template selected:', template.id);
    console.log('🎯 Template advancedParams:', template.advancedParams);
    
    if (selectedTemplates.includes(template.id)) {
      setSelectedTemplates(prev => prev.filter(id => id !== template.id));
      console.log('❌ Template deselected');
    } else {
      setSelectedTemplates(prev => [...prev, template.id]);
      // Always set advanced params when selecting a template
      setAdvancedParams(template.advancedParams);
      console.log('✅ Template selected, advancedParams set:', template.advancedParams);
    }
  };

  // Advanced parameter handler
  const handleAdvancedParamChange = (param: string, value: string) => {
    console.log(`🔧 Advanced param changed: ${param} = ${value}`);
    setAdvancedParams((prev: any) => {
      const newParams = {
        ...prev,
        [param]: value
      };
      console.log('🔧 New advancedParams:', newParams);
      return newParams;
    });
  };

  // Helper function to convert Tailwind gradient classes to CSS gradients
  const getGradientStyle = (gradientClass: string) => {
    const gradientMap: { [key: string]: string } = {
      'from-blue-200 to-purple-300': 'linear-gradient(135deg, #bfdbfe 0%, #c4b5fd 100%)',
      'from-green-200 to-yellow-300': 'linear-gradient(135deg, #bbf7d0 0%, #fde68a 100%)',
      'from-orange-200 to-pink-300': 'linear-gradient(135deg, #fed7aa 0%, #f9a8d4 100%)',
      'from-gray-200 to-blue-300': 'linear-gradient(135deg, #e5e7eb 0%, #93c5fd 100%)',
      'from-cyan-200 to-orange-300': 'linear-gradient(135deg, #a7f3d0 0%, #fdba74 100%)',
      'from-slate-200 to-indigo-300': 'linear-gradient(135deg, #e2e8f0 0%, #a5b4fc 100%)',
      'from-amber-200 to-red-300': 'linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)',
      'from-green-200 to-blue-300': 'linear-gradient(135deg, #bbf7d0 0%, #93c5fd 100%)'
    };
    
    return gradientMap[gradientClass] || 'linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)';
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoaded(true);
      console.log('✅ ContextShot Pro app fully loaded');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        const maxSize = 1920;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressed);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const generateProductDescription = useCallback(async (file: File) => {
    setAnalyzing(true);
    console.log('🔍 Starting product analysis for file:', file.name);
    
    try {
      // Add a small delay to ensure UI state is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const formData = new FormData();
      formData.append('file', file);
      console.log('🔍 Sending API request to analyze product...');
      
      // Add timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const res = await fetch('http://localhost:8000/analyze/product', { 
        method: 'POST', 
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('🔍 API response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      
      const data = await res.json();
      console.log('🔍 API response data:', data);
      console.log('🔍 Product description from API:', data.product_description);
      console.log('🔍 Product description length:', data.product_description?.length || 0);

      // Add a small delay before updating UI to ensure smooth transition
      await new Promise(resolve => setTimeout(resolve, 100));

      const description = data.product_description || '';
      console.log('🔍 Setting product description:', description.substring(0, 100));
      
      setProductName(data.product_name || 'Product');
      setProductDescription(description);
      setProductCategory(data.category || 'Product');
      setProductFeatures(data.features || []);
      setVisualContext(data.visual_context || null);
      setAiConfidence(data.confidence || 0);
      setAiSource(data.ai_source || 'AI Analysis');
      
      console.log('✅ Product analysis completed successfully');
      console.log('🔍 State updated - productDescription should be:', description.substring(0, 100));
    } catch (err) {
      console.error('❌ Failed product analysis:', err);
      setProductName('Product');
      setProductDescription('High-quality product with modern design');
      setProductCategory('Product');
      setProductFeatures(['Modern design', 'High quality']);
      setAiConfidence(0.5);
      setAiSource('Fallback');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('🧹 Clearing all cached data for new image upload...');
    
    // Reset the input value to allow selecting the same file again
    e.target.value = '';

    // Clear ALL cached data immediately
    setProductName('');
    setProductDescription('');
    setProductCategory('');
    setProductFeatures([]);
    setVisualContext(null);
    setAiConfidence(0);
    setAiSource('');
    setPreviewPrompt('');
    setEditablePrompt('');
    setGeneratedImages([]);
    setLifestyleImages([]);
    setAnalyzing(false);
    
    // Clear any browser cache for this session
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 Browser cache cleared');
      } catch (error) {
        console.log('⚠️ Could not clear browser cache:', error);
      }
    }

    const compressed = await compressImage(file);
    setImageFile(compressed);

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(compressed);

    // Add a small delay to ensure UI updates before API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate product description with additional wait
    await generateProductDescription(compressed);
    setCurrentStep(2);
  }, [compressImage, generateProductDescription]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    console.log('🧹 Clearing all cached data for new image drop...');
    
    // Clear ALL cached data immediately
    setProductName('');
    setProductDescription('');
    setProductCategory('');
    setProductFeatures([]);
    setVisualContext(null);
    setAiConfidence(0);
    setAiSource('');
    setPreviewPrompt('');
    setEditablePrompt('');
    setGeneratedImages([]);
    setLifestyleImages([]);
    setAnalyzing(false);
    
    // Clear any browser cache for this session
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 Browser cache cleared');
    } catch (error) {
        console.log('⚠️ Could not clear browser cache:', error);
      }
    }

    const compressed = await compressImage(file);
    setImageFile(compressed);

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(compressed);

    // Add a small delay to ensure UI updates before API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate product description with additional wait
    await generateProductDescription(compressed);
    setCurrentStep(2);
  }, [compressImage, generateProductDescription]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => e.preventDefault(), []);

  const previewContextPrompt = useCallback(async () => {
    // Use advanced parameters if available, otherwise fall back to old parameters
    const params = new URLSearchParams();
    
    console.log('🔍 Current advancedParams:', advancedParams);
    console.log('🔍 AdvancedParams keys:', Object.keys(advancedParams));
    console.log('🔍 AdvancedParams length:', Object.keys(advancedParams).length);
    
    if (Object.keys(advancedParams).length > 0) {
      // Use new advanced parameters
      console.log('✅ Using advanced parameters');
      Object.entries(advancedParams).forEach(([key, value]) => {
        if (value) {
          console.log(`📝 Adding parameter: ${key} = ${value}`);
          params.append(key, value as string);
        }
      });
      params.append('product_type', productName || 'product');
    } else {
      // Fall back to old parameters
      console.log('⚠️ No advanced parameters, using fallback');
      if (!environment || !setting || !lighting) {
        alert('Please select environment, setting, and lighting');
        return;
      }
      params.append('product_type', productName || 'product');
      params.append('season', environment);
      params.append('demographic', setting);
      params.append('setting', lighting);
      params.append('style', 'professional');
    }

    // Add timestamp to force regeneration and prevent caching
    params.append('timestamp', Date.now().toString());
    
    console.log('📤 Final URL params:', params.toString());
    
    setLoading(true);
    setPreviewPrompt(''); // Clear previous prompt to show regeneration
    try {
      console.log('🔄 Regenerating context prompt with fresh API call...');
      const response = await fetch(`http://localhost:8000/context/preview?${params}`, {
        method: 'GET',
        cache: 'no-cache', // Prevent browser caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fresh prompt generated:', data.generated_prompt);
        console.log('📊 Backend received config:', data.context_config);
        console.log('🤖 Claude AI enhanced:', data.claude_enhanced);
        setPreviewPrompt(data.generated_prompt);
        setEditablePrompt(data.generated_prompt);
        setCurrentStep(3);
      } else {
        alert('Failed to generate context prompt');
      }
    } catch (error) {
      console.error('Error generating context prompt:', error);
      alert('Error generating context prompt');
    } finally {
      setLoading(false);
    }
  }, [productName, advancedParams, environment, setting, lighting]);

  const generateLifestyleShots = useCallback(async () => {
    if (!imageFile || !editablePrompt.trim()) {
      alert('Please upload an image and generate a context prompt first');
      return;
    }

    setLifestyleLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('prompt', editablePrompt);

      const response = await fetch('http://localhost:8000/generate/lifestyle', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setLifestyleImages(data.lifestyle_images || []);
        setCurrentStep(3);
      } else {
        alert('Failed to generate lifestyle shots');
      }
    } catch (error) {
      console.error('Error generating lifestyle shots:', error);
      alert('Error generating lifestyle shots');
    } finally {
      setLifestyleLoading(false);
    }
  }, [imageFile, editablePrompt]);

  const generateImages = useCallback(async () => {
    const promptToUse = editablePrompt || previewPrompt;
    
    if (!promptToUse) {
      alert('Please generate a context prompt first');
      return;
    }

    if (!imageFile) {
      alert('Please upload a product image first');
      return;
    }

    setLoading(true);
    setProcessingStatus('Processing product with Bria AI...');

    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('context_config', JSON.stringify({
        prompt: promptToUse,
        num_images: 4,
        style: 'professional',
        context_config: advancedParams  // Include all advanced parameters
      }));

      // Show progress updates
      const progressSteps = [
        'Generating Lifestyle variation...',
        'Generating Commercial variation...',
        'Generating Editorial variation...',
        'Generating Minimalist variation...'
      ];

      // Simulate progress updates
      for (let i = 0; i < progressSteps.length; i++) {
        setProcessingStatus(progressSteps[i]);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing time
      }

      const response = await fetch('http://localhost:8000/generate/images', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🎨 Full API response:', data);
        console.log('🎨 Detailed results:', data.detailed_results);
        console.log('🎨 Number of images:', data.detailed_results?.length || 0);
        
        if (data.detailed_results && data.detailed_results.length > 0) {
          console.log('🎨 First image data:', data.detailed_results[0]);
          setGeneratedImages(data.detailed_results);
          setProcessingStatus('Campaign-ready assets generated successfully');
        } else {
          console.log('⚠️ No images in detailed_results');
          setProcessingStatus('No images generated');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        
        if (response.status === 429) {
          setProcessingStatus('API rate limit exceeded. Please upgrade your Bria AI plan or try again later.');
        } else {
          setProcessingStatus('Failed to generate images');
        }
      }
    } catch (error) {
      console.error('Error generating images:', error);
      setProcessingStatus('Error generating images');
    } finally {
      setLoading(false);
    }
  }, [editablePrompt, previewPrompt, imageFile]);

  const downloadAllImages = useCallback(async () => {
    for (let i = 0; i < generatedImages.length; i++) {
      const img = generatedImages[i];
      const link = document.createElement('a');
      link.href = img.final_image;
      link.download = `${productName || 'product'}_${img.context_name || `variation_${i + 1}`}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (i < generatedImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [generatedImages, productName]);

  const applyReferenceBackground = useCallback(async () => {
    if (!selectedReference || !newImageFiles.length) {
      alert('Please select a reference image and upload new product images');
      return;
    }

    setApplyingBackground(true);
    setProcessingStatus(`Applying reference background to ${newImageFiles.length} images...`);

    try {
      const appliedImages: string[] = [];
      
      // Process each image
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i];
        setProcessingStatus(`Applying reference background to image ${i + 1}/${newImageFiles.length}...`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('reference_data', JSON.stringify({
          seed: selectedReference.seed,
          prompt: selectedReference.refined_prompt || selectedReference.background_prompt
        }));

        const response = await fetch('http://localhost:8000/apply/reference-background', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          appliedImages.push(data.image_url);
        } else {
          console.error(`Failed to apply background to image ${i + 1}`);
        }
      }

      if (appliedImages.length > 0) {
        setAppliedImages(appliedImages);
        setProcessingStatus(`Reference background applied to ${appliedImages.length} images successfully`);
      } else {
        setProcessingStatus('Failed to apply reference background');
      }
    } catch (error) {
      console.error('Error applying reference background:', error);
      setProcessingStatus('Error applying reference background');
    } finally {
      setApplyingBackground(false);
    }
  }, [selectedReference, newImageFiles]);

  const downloadAllLifestyleImages = useCallback(async () => {
    for (let i = 0; i < lifestyleImages.length; i++) {
      const img = lifestyleImages[i];
      const link = document.createElement('a');
      link.href = img.image_url;
      link.download = `${productName || 'product'}_lifestyle_${img.variation || i + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (i < lifestyleImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [lifestyleImages, productName]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
        {/* Header */}
      <div style={{ 
        backgroundColor: 'white',
        color: '#6b2cff',
        padding: '2rem 0',
        textAlign: 'center',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <img 
              src="https://docs.bria.ai/assets/logo.4aab4827f8ef484ab0149a267109951af9b35a6e5d7ddacfc52a0cb2bf07aec6.9c1bb791.png" 
              alt="Bria AI" 
              style={{ height: '40px', width: 'auto' }}
            />
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              marginBottom: '0.5rem',
              color: '#6b2cff'
            }}>
              ContextShot Pro
            </h1>
          </div>
          <p style={{ fontSize: '1.2rem', opacity: 0.8, color: '#6b2cff' }}>
            AI-Powered Product Photography & Marketing Asset Generation
          </p>
        </div>
        </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Upload Section */}
          <div style={{ 
            backgroundColor: 'white', 
          borderRadius: '12px', 
            padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
            Upload Product Image
          </h2>
          
          {!imagePreview ? (
            <div
                  onDrop={handleDrop}
              onDragOver={handleDragOver}
                  style={{
                    border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '3rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} style={{ color: '#6b7280', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Drag and drop your product image here
              </p>
              <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                or click to browse files
                  </p>
                </div>
              ) : (
                    <div>
              {/* Image Display */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img
                  src={imagePreview}
                  alt="Product preview"
                  style={{
                    maxWidth: '400px',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#f9fafb'
                  }}
                />
                <div style={{ marginTop: '1rem' }}>
                    <button
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                      setProductName('');
                      setProductDescription('');
                      setProductCategory('');
                      setProductFeatures([]);
                      setVisualContext(null);
                      setGeneratedImages([]);
                      setLifestyleImages([]);
                      setCurrentStep(1);
                    }}
                      style={{
                      padding: '0.5rem 1rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                      borderRadius: '6px',
                        cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                      }}
                    >
                    Remove Image
                    </button>
                  </div>
              </div>
              
              {/* Analysis Results - BELOW the image */}
              {(productDescription || analyzing) && (
                <div style={{ 
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                    AI Analysis Results
                  </h3>
                  {analyzing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #e5e7eb',
                        borderTop: '2px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        Analyzing product image...
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          Description
                        </h4>
                        <p style={{ color: '#6b7280', lineHeight: '1.5', marginBottom: '1rem' }}>
                          {productDescription}
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          Category
                        </h4>
                        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                          {productCategory}
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          Key Features
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {productFeatures.map((feature, index) => (
                            <span
                              key={index}
                              style={{
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem'
                              }}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
            onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
        </div>
              
        {/* Context Configuration */}
        {productDescription && (
                <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '2rem', 
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Context Configuration
            </h2>
            
            {/* Tab Navigation */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid #e5e7eb', 
              marginBottom: '2rem' 
            }}>
              <button
                onClick={() => setActiveTab('templates')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  backgroundColor: activeTab === 'templates' ? '#6b2cff' : 'transparent',
                  color: activeTab === 'templates' ? 'white' : '#6b7280',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  marginRight: '0.5rem'
                }}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  backgroundColor: activeTab === 'advanced' ? '#6b2cff' : 'transparent',
                  color: activeTab === 'advanced' ? 'white' : '#6b7280',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Advanced
              </button>
            </div>

            {/* Template Library Section */}
            {activeTab === 'templates' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                  Template Library
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      style={{
                        border: selectedTemplates.includes(template.id) ? '3px solid #6b2cff' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white',
                        height: '180px',
                        position: 'relative',
                        transform: selectedTemplates.includes(template.id) ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: selectedTemplates.includes(template.id) ? '0 8px 25px -5px rgba(0, 0, 0, 0.1)' : '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {/* Checkmark for selected */}
                      {selectedTemplates.includes(template.id) && (
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          width: '24px',
                          height: '24px',
                          backgroundColor: '#6b2cff',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          ✓
                </div>
              )}
                      
                      {/* Preview Gradient */}
                      <div style={{
                        height: '60px',
                        background: getGradientStyle(template.previewGradient),
                        borderRadius: '6px',
                        marginBottom: '0.75rem'
                      }} />
                      
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: '#1f2937' }}>
                        {template.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        {template.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {template.targetDemographic}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981' }}>
                          {template.predictedCTR}% CTR
                        </span>
            </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Parameters Section */}
            {activeTab === 'advanced' && (
            <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                  Advanced Parameters
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                  {/* Left Column */}
                  <div>
                    {/* Season */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Season ⭐
              </label>
                      <select
                        value={advancedParams.season || ''}
                        onChange={(e) => handleAdvancedParamChange('season', e.target.value)}
                style={{
                  width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Season</option>
                        {seasonOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Environment */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Environment/Location ⭐
                      </label>
                      <select
                        value={advancedParams.environment || ''}
                        onChange={(e) => handleAdvancedParamChange('environment', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Environment</option>
                        {environmentOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Time of Day */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Time of Day
                      </label>
                      <select
                        value={advancedParams.timeOfDay || ''}
                        onChange={(e) => handleAdvancedParamChange('timeOfDay', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Time of Day</option>
                        {timeOfDayOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
            </div>

                    {/* Weather */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Weather/Atmosphere
                      </label>
                      <select
                        value={advancedParams.weather || ''}
                        onChange={(e) => handleAdvancedParamChange('weather', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Weather</option>
                        {weatherOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Color Palette */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Color Palette
                </label>
                <select
                        value={advancedParams.colorPalette || ''}
                        onChange={(e) => handleAdvancedParamChange('colorPalette', e.target.value)}
                  style={{
                    width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                    backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Color Palette</option>
                        {colorPaletteOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Mood */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Mood/Emotion
                      </label>
                      <select
                        value={advancedParams.mood || ''}
                        onChange={(e) => handleAdvancedParamChange('mood', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Mood</option>
                        {moodOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                    </div>
              </div>

                  {/* Right Column */}
              <div>
                    {/* Camera Angle */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Camera Angle
                </label>
                <select
                        value={advancedParams.cameraAngle || ''}
                        onChange={(e) => handleAdvancedParamChange('cameraAngle', e.target.value)}
                  style={{
                    width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                    backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Camera Angle</option>
                        {cameraAngleOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Depth of Field */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Depth of Field
                      </label>
                      <select
                        value={advancedParams.depthOfField || ''}
                        onChange={(e) => handleAdvancedParamChange('depthOfField', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Depth of Field</option>
                        {depthOfFieldOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Composition */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Composition Style
                      </label>
                      <select
                        value={advancedParams.composition || ''}
                        onChange={(e) => handleAdvancedParamChange('composition', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Composition</option>
                        {compositionOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

                    {/* Props */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Props/Elements
                </label>
                <select
                        value={advancedParams.props || ''}
                        onChange={(e) => handleAdvancedParamChange('props', e.target.value)}
                  style={{
                    width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                    backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Props</option>
                        {propsOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Image Quality */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Image Quality
                      </label>
                      <select
                        value={advancedParams.imageQuality || ''}
                        onChange={(e) => handleAdvancedParamChange('imageQuality', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Quality</option>
                        {imageQualityOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Aspect Ratio */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Aspect Ratio
                      </label>
                      <select
                        value={advancedParams.aspectRatio || ''}
                        onChange={(e) => handleAdvancedParamChange('aspectRatio', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select Aspect Ratio</option>
                        {aspectRatioOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
                onClick={previewContextPrompt}
                disabled={loading}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                {loading ? 'Regenerating Prompt...' : 'Preview Prompt'}
              </button>
            </div>
          </div>
        )}

        {/* Generated Prompt */}
        {previewPrompt && (
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '2rem', 
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Generated Context Prompt
              </h2>
              <span style={{ 
                backgroundColor: '#6b2cff', 
                color: 'white', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '12px', 
                fontSize: '0.75rem', 
                fontWeight: '500' 
              }}>
                🤖 Claude AI Enhanced
              </span>
            </div>
            <textarea
              value={editablePrompt}
              onChange={(e) => setEditablePrompt(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                lineHeight: '1.5',
                resize: 'vertical'
              }}
              placeholder="Generated prompt will appear here..."
            />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={generateImages}
                disabled={!editablePrompt || loading}
                style={{
                  backgroundColor: editablePrompt ? '#10b981' : '#9ca3af',
                color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: editablePrompt ? 'pointer' : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Generate Campaign Assets
              </button>
              <button
                onClick={generateLifestyleShots}
                disabled={!editablePrompt || lifestyleLoading}
                style={{
                  backgroundColor: editablePrompt ? '#8b5cf6' : '#9ca3af',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: editablePrompt ? 'pointer' : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Generate Lifestyle Shots
              </button>
              </div>
            </div>
        )}

        {/* Processing Status */}
        {processingStatus && (
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: '8px', 
                padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#0369a1', fontWeight: '500' }}>
              {processingStatus}
            </p>
          </div>
        )}

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '2rem', 
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                Generated Campaign Assets
              </h2>
            <button
                onClick={downloadAllImages}
              style={{
                  backgroundColor: '#3b82f6',
                color: 'white',
                  padding: '0.5rem 1rem',
                border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              >
                <Download size={16} />
                Download All
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {generatedImages.map((img, index) => (
                <div key={index} style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  backgroundColor: selectedReference === img ? '#f0f9ff' : 'white'
                }}>
                  <img
                    src={img.final_image}
                    alt={`Generated image ${index + 1}`}
                    style={{ maxWidth: '400px', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f9fafb' }}
                  />
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                      {img.context_name || `Variation ${index + 1}`}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        CTR: {img.predicted_ctr}%
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Engagement: {img.engagement_score}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = img.final_image;
                          link.download = `contextshot-${index + 1}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '0.5rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReference(img);
                          setReferenceMode(true);
                        }}
                        style={{
                          backgroundColor: selectedReference === img ? '#10b981' : '#6b7280',
                          color: 'white',
                          padding: '0.5rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          flex: 1
                        }}
                      >
                        {selectedReference === img ? 'Selected' : 'Select as Reference'}
            </button>
          </div>
                </div>
                </div>
              ))}
                </div>
                </div>
        )}

        {/* Reference Background Application */}
        {referenceMode && selectedReference && (
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '2rem', 
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Apply Reference Background
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Upload new product images to apply the selected background
            </p>
            
            {newImageFiles.length === 0 ? (
              <div
                style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                    cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => document.getElementById('reference-file-input')?.click()}
              >
                <Upload size={32} style={{ color: '#6b7280', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '1rem', color: '#6b7280' }}>
                  Upload New Products (Max 5)
                </p>
                    </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
                        src={preview}
                        alt={`New product ${index + 1}`}
                        style={{
                      width: '100%', 
                          height: '300px',
                          maxWidth: '400px',
                          maxHeight: '400px',
                          objectFit: 'contain',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px'
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => {
                      setNewImageFiles([]);
                      setNewImagePreviews([]);
                    }}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white', 
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove All
                  </button>
                  <button
                    onClick={applyReferenceBackground}
                    disabled={applyingBackground}
                    style={{
                      backgroundColor: applyingBackground ? '#9ca3af' : '#10b981',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: applyingBackground ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {applyingBackground ? 'Applying...' : 'Apply Reference Background'}
                    </button>
                    </div>
              </div>
            )}

            <input
              id="reference-file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = e.target.files;
                if (!files) return;

                try {
                  const fileArray = Array.from(files).slice(0, 5);
                  console.log(`Processing ${fileArray.length} files (max 5 allowed)`);
                  const compressedFiles: File[] = [];
                  const previews: string[] = [];

                  for (const file of fileArray) {
                    const compressed = await compressImage(file);
                    compressedFiles.push(compressed);
                    
                    // Create preview synchronously
                    const reader = new FileReader();
                    const preview = await new Promise<string>((resolve) => {
                      reader.onload = (ev) => {
                        resolve(ev.target?.result as string);
                      };
                      reader.readAsDataURL(compressed);
                    });
                    previews.push(preview);
                  }

                  setNewImageFiles(compressedFiles);
                  setNewImagePreviews(previews);
                  console.log(`Successfully processed ${compressedFiles.length} files and ${previews.length} previews`);
                  
                  // Reset the file input to allow uploading the same files again
                  e.target.value = '';
                } catch (error) {
                  console.error('Error processing files:', error);
                  // Reset the file input even on error
                  e.target.value = '';
                }
              }}
              style={{ display: 'none' }}
            />
            </div>
        )}

        {/* Campaign Results */}
        {(appliedImages.length > 0 || selectedReference) && (
                    <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
              padding: '2rem', 
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                Campaign Results
              </h2>
              <button
                onClick={() => {
                  const allImages = [];
                  
                  // Add selected reference if exists
                  if (selectedReference) {
                    allImages.push({
                      url: selectedReference.final_image,
                      name: `reference-${selectedReference.context_name || 'selected'}.jpg`
                    });
                  }
                  
                  // Add applied background images
                  appliedImages.forEach((imageUrl, index) => {
                    allImages.push({
                      url: imageUrl,
                      name: `applied-background-${index + 1}.jpg`
                    });
                  });
                  
                  // Download all with staggered timing
                  allImages.forEach((img, index) => {
                    setTimeout(() => {
                      const link = document.createElement('a');
                      link.href = img.url;
                      link.download = img.name;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }, index * 200);
                  });
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                      display: 'flex', 
                      alignItems: 'center', 
                  gap: '0.5rem'
                }}
              >
                <Download size={16} />
                Download All
              </button>
                    </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {/* Selected Reference Image */}
              {selectedReference && (
                <div style={{ 
                  border: '2px solid #10b981', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  backgroundColor: '#f0f9ff',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    zIndex: 1
                  }}>
                    REFERENCE
                    </div>
                  <img
                    src={selectedReference.final_image}
                    alt="Selected reference"
                    style={{ maxWidth: '400px', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f9fafb' }}
                  />
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                      {selectedReference.context_name || 'Selected Reference'}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        CTR: {selectedReference.predicted_ctr}%
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Engagement: {selectedReference.engagement_score}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedReference.final_image;
                          link.download = `reference-${selectedReference.context_name || 'selected'}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        style={{
                          backgroundColor: '#3b82f6',
                      color: 'white', 
                      padding: '0.5rem', 
                      border: 'none',
                          borderRadius: '4px',
                      cursor: 'pointer',
                          fontSize: '0.875rem',
                          flex: 1
                        }}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Applied Background Images */}
              {appliedImages.map((imageUrl, index) => (
                <div key={`applied-${index}`} style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  <img
                    src={imageUrl}
                    alt={`Applied background ${index + 1}`}
                    style={{ maxWidth: '400px', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f9fafb' }}
                  />
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                      Applied Background #{index + 1}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Applied
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Background
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = imageUrl;
                          link.download = `applied-background-${index + 1}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '0.5rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          flex: 1
                        }}
                      >
                        <Download size={14} />
                    </button>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            
            {appliedImages.length === 0 && !selectedReference && (
              <p style={{ color: '#6b7280', fontSize: '1rem', textAlign: 'center', padding: '2rem' }}>
                No campaign results yet. Generate campaign assets and apply reference backgrounds to see results.
              </p>
            )}
            </div>
        )}

        {/* Lifestyle Images */}
        {lifestyleImages.length > 0 && (
            <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
              padding: '2rem', 
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Lifestyle Shots
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {lifestyleImages.map((img, index) => (
                <div key={index} style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden'
                }}>
                  <img
                    src={img.image_url}
                    alt={`Lifestyle shot ${index + 1}`}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                      {img.generation_method}
                    </h3>
                <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = img.image_url;
                        link.download = `lifestyle-${index + 1}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                  style={{
                        backgroundColor: '#8b5cf6',
                  color: 'white',
                        padding: '0.5rem',
                    border: 'none',
                        borderRadius: '4px',
                    cursor: 'pointer',
                        fontSize: '0.875rem',
                        width: '100%'
                      }}
                    >
                      <Download size={14} style={{ marginRight: '0.5rem' }} />
                      Download
                </button>
              </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextShot;