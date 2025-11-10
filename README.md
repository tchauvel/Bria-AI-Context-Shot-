# 📸 ContextShot - Modern Tech Stack

**Smart Product Photography with AI-Generated Contextual Backgrounds**

A modern, scalable application built with React, FastAPI, and Tailwind CSS for professional e-commerce photography workflows.

## 🏗️ Architecture

### Frontend (React + Tailwind CSS)
- **React 18** with TypeScript for type safety
- **Tailwind CSS** with custom Bria-inspired design system
- **React Router** for navigation
- **React Query** for API state management
- **React Dropzone** for drag-and-drop file uploads
- **Framer Motion** for smooth animations
- **React Hot Toast** for notifications

### Backend (FastAPI)
- **FastAPI** for high-performance API
- **Pydantic** for data validation
- **Uvicorn** ASGI server
- **CORS** middleware for frontend integration
- **Background tasks** for batch processing

### AI Integration
- **Bria AI API v2** for background removal and generation
- **DeepSeek-OCR** for intelligent image compression
- **Custom context generation** algorithm

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Bria AI API token
- Anthropic/Claude API key (optional, for enhanced prompt generation)

### Backend Setup
```bash
cd contextshot-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export BRIA_API_TOKEN="your_bria_api_token_here"
export ANTHROPIC_API_KEY="your_claude_api_key_here"  # Optional but recommended

# Run the server
python main.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup
```bash
cd contextshot-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (Bria-inspired)
- **Secondary**: Gray scale for text and backgrounds
- **Accent**: Purple for highlights and CTAs
- **Success**: Green for positive actions
- **Warning**: Orange for alerts
- **Error**: Red for errors

### Components
- **Buttons**: Primary, secondary, success, danger variants
- **Cards**: Soft shadows with hover effects
- **Inputs**: Focused states with primary color
- **Gradients**: Primary, secondary, accent gradients
- **Animations**: Fade-in, slide-up, scale-in effects

## 📱 Features

### 🖼️ Multi-Image Upload
- Drag-and-drop interface
- Multiple file selection
- Image preview with removal
- File type validation
- Batch processing support

### 🎯 Smart Context Configuration
- **Product Type**: Shoes, Clothing, Electronics, etc.
- **Season**: Spring, Summer, Fall, Winter, Holiday
- **Demographic**: Gen Z, Millennials, Gen X, Luxury, Budget-Conscious
- **Region**: Urban, Suburban, Rural, Coastal, Mountain
- **Style**: Professional, Lifestyle, Minimalist, Luxury, Casual
- **Custom Prompts**: Additional context specification

### ⚡ Batch Processing
- Process multiple products simultaneously
- Real-time progress tracking
- Error handling and retry logic
- Results gallery with download options

### 📊 Business Analytics
- Processing statistics
- Cost savings calculations
- ROI metrics
- Success rate tracking
- Performance analytics

## 🔧 API Endpoints

### Core Endpoints
- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /upload/single` - Process single image
- `POST /upload/batch` - Process multiple images
- `GET /batch/{batch_id}/status` - Get batch status
- `GET /batch/{batch_id}/results` - Get batch results
- `GET /stats` - Get processing statistics
- `POST /stats/reset` - Reset statistics
- `GET /context/preview` - Preview context prompt

### Request/Response Examples

#### Single Image Upload
```bash
curl -X POST "http://localhost:8000/upload/single" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@product.jpg" \
  -F 'context_config={"product_type":"Shoes","season":"Summer","demographic":"Gen Z","region":"Urban","style":"lifestyle"}'
```

#### Batch Upload
```bash
curl -X POST "http://localhost:8000/upload/batch" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@product1.jpg" \
  -F "files=@product2.jpg" \
  -F 'context_config={"product_type":"Clothing","season":"Spring","demographic":"Millennials","region":"Suburban","style":"professional"}'
```

## 🎯 Context Generation Algorithm

The smart context matching combines multiple factors:

```javascript
function generateContextPrompt(product, season, demographic, region, style) {
  const seasonalElements = {
    'Spring': 'cherry blossoms, fresh flowers, pastel colors, morning light',
    'Summer': 'bright sunlight, vibrant colors, outdoor setting',
    'Fall': 'autumn leaves, warm tones, cozy atmosphere',
    'Winter': 'snow, warm lighting, cozy interior',
    'Holiday': 'festive decorations, warm lighting, celebratory mood'
  }
  
  const demographicStyles = {
    'Gen Z': 'trendy, colorful, urban, social media aesthetic',
    'Millennials': 'minimalist, authentic, lifestyle-focused',
    'Gen X': 'classic, professional, quality-focused',
    'Luxury': 'elegant, sophisticated, high-end materials',
    'Budget-Conscious': 'practical, relatable, everyday setting'
  }
  
  const regionalSettings = {
    'Urban': 'city backdrop, modern architecture, street scene',
    'Suburban': 'home interior, backyard, neighborhood setting',
    'Rural': 'natural landscape, countryside, open space',
    'Coastal': 'beach, ocean view, nautical elements',
    'Mountain': 'mountain backdrop, lodge interior, alpine setting'
  }
  
  return `${product} product photography, ${seasonalElements[season]}, ${demographicStyles[demographic]}, ${regionalSettings[region]}, ${style} photography, commercial quality, high resolution`
}
```

## 📊 Business Value

### Cost Savings
- **Traditional photoshoot**: $2,000-5,000 per session
- **ContextShot AI generation**: $5-10 per product
- **Savings**: 95%+ cost reduction

### Speed & Efficiency
- **Traditional**: Days to weeks
- **ContextShot**: Minutes to hours
- **Batch processing**: Handle 100+ products simultaneously

### Quality & Flexibility
- **Professional quality** background removal
- **Contextually appropriate** background generation
- **Easy A/B testing** of different contexts
- **Scalable processing** for large catalogs

## 🔮 Future Enhancements

### Phase 2: Advanced Features
- **Performance tracking**: Which contexts convert best
- **Brand consistency**: Style guide integration
- **Video thumbnails**: Moving image generation
- **Real-time collaboration**: Team workflows

### Phase 3: Enterprise Features
- **Custom models**: Brand-specific training
- **API access**: Developer integration
- **Analytics dashboard**: Business intelligence
- **White-label solution**: Custom branding

## 🛠️ Development

### Frontend Development
```bash
cd contextshot-frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd contextshot-backend
python main.py       # Start development server
# Server auto-reloads on file changes
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Tailwind CSS** for consistent styling

## 📈 Performance

### Frontend
- **Vite** for fast development and building
- **React Query** for efficient API state management
- **Code splitting** for optimal bundle sizes
- **Image optimization** for fast loading

### Backend
- **FastAPI** for high-performance API
- **Async/await** for non-blocking operations
- **Background tasks** for long-running processes
- **Efficient image processing** with DeepSeek-OCR

## 🔒 Security

- **CORS** configuration for frontend access
- **Input validation** with Pydantic
- **File type validation** for uploads
- **Error handling** without sensitive data exposure

## 📞 Support

For questions about ContextShot or to discuss integration opportunities, please contact the development team.

---

**ContextShot** - Transforming e-commerce photography with modern AI intelligence.
