# Custom Image Editor

A powerful, lightweight image editor built specifically for MockupAI that allows users to combine background images with logos and manipulate them with precision.

## Features

### ✅ **Core Functionality**
- **Background Image Loading**: Upload and display background images with proper aspect ratio handling
- **Logo Image Loading**: Upload and overlay logo images with full manipulation support
- **Canvas-based Rendering**: High-performance HTML5 canvas rendering for smooth interactions
- **Real-time Preview**: Live preview of all changes as you make them

### ✅ **Logo Manipulation**
- **Drag & Drop**: Click and drag logos to move them around the canvas
- **Scaling**: Resize logos from 10% to 300% with slider or keyboard shortcuts
- **Rotation**: Rotate logos from -180° to +180° with precise degree control
- **Opacity**: Adjust logo transparency from 0% to 100%
- **Position Control**: Fine-tune X/Y positioning with numeric inputs

### ✅ **User Experience**
- **Keyboard Shortcuts**: Arrow keys for movement, +/- for scaling, Ctrl+R for reset
- **Visual Feedback**: Hover states and cursor changes for better interaction
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful handling of image loading errors
- **Toast Notifications**: User feedback for all actions

### ✅ **Export Options**
- **Download**: Direct download as PNG file
- **Save Integration**: Callback support for saving to backend systems
- **High Quality**: Full resolution output without quality loss

## Usage

### Basic Implementation

```tsx
import CustomImageEditor from '@/components/ImageEditor/CustomImageEditor';

function MyComponent() {
  return (
    <CustomImageEditor
      backgroundImage="https://example.com/background.jpg"
      logoImage="https://example.com/logo.png"
      onBackgroundUpload={(file) => {
        // Handle background image upload
        console.log('Background uploaded:', file);
      }}
      onLogoUpload={(file) => {
        // Handle logo image upload
        console.log('Logo uploaded:', file);
      }}
      onSave={(canvas) => {
        // Handle save action
        canvas.toBlob((blob) => {
          // Upload blob or convert to file
        });
      }}
      initialTransform={{
        x: 400,
        y: 300,
        scale: 1.2,
        rotation: 15,
        opacity: 0.9
      }}
      canvasWidth={800}
      canvasHeight={600}
    />
  );
}
```

### Props Interface

```tsx
interface CustomImageEditorProps {
  // Image URLs
  backgroundImage?: string;          // URL of background image
  logoImage?: string;               // URL of logo image
  
  // Upload Handlers
  onBackgroundUpload?: (file: File) => void;
  onLogoUpload?: (file: File) => void;
  onSave?: (canvas: HTMLCanvasElement) => void;
  
  // Initial Logo Transform
  initialTransform?: {
    x?: number;        // Initial X position (default: center)
    y?: number;        // Initial Y position (default: center)  
    scale?: number;    // Initial scale (default: 1)
    rotation?: number; // Initial rotation in degrees (default: 0)
    opacity?: number;  // Initial opacity 0-1 (default: 1)
  };
  
  // Canvas Dimensions
  canvasWidth?: number;   // Canvas width in pixels (default: 800)
  canvasHeight?: number;  // Canvas height in pixels (default: 600)
}
```

## Keyboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Move Logo | `Arrow Keys` | Move logo 1 pixel in any direction |
| Fast Move | `Shift + Arrow Keys` | Move logo 10 pixels in any direction |
| Scale Up | `+` or `=` | Increase logo size by 0.1x |
| Scale Down | `-` | Decrease logo size by 0.1x |
| Reset Logo | `Ctrl/⌘ + R` | Reset logo to center position with default settings |

## Features Detail

### Background Image Handling
- Automatic aspect ratio preservation
- Smart fitting within canvas bounds
- Support for all common image formats (JPEG, PNG, WebP, etc.)
- Fallback placeholder when no background is loaded

### Logo Manipulation
- **Visual Dragging**: Click and drag logos with visual feedback
- **Precision Controls**: Numeric inputs for exact positioning
- **Smooth Scaling**: Slider-based scaling with visual preview
- **Rotation Control**: Degree-based rotation with quick 15° buttons
- **Opacity Blending**: Smooth opacity transitions for overlay effects

### Performance Optimizations
- Efficient canvas rendering with proper cleanup
- Minimal re-renders using React hooks optimization
- Memory management for image loading
- Debounced input handling for smooth interactions

### Error Handling
- Image loading error detection and user notification
- File type validation for uploads
- File size validation (configurable limits)
- Graceful fallbacks for network issues

## Integration Examples

### With Redux Store

```tsx
// ProjectEditor integration example
<CustomImageEditor
  backgroundImage={currentProject.productImage}
  logoImage={currentProject.logoImage}
  onBackgroundUpload={(file) => 
    dispatch(uploadMockupImages({ 
      mockupId: currentProject.id,
      image: file, 
      type: 'products' 
    }))
  }
  onLogoUpload={(file) => 
    dispatch(uploadMockupImages({ 
      mockupId: currentProject.id,
      image: file, 
      type: 'logos' 
    }))
  }
  onSave={(canvas) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'design.png', { type: 'image/png' });
        handleImageSave(canvas.toDataURL(), 'product');
      }
    });
  }}
  initialTransform={{
    x: currentProject.logoSettings?.position?.x || 400,
    y: currentProject.logoSettings?.position?.y || 300,
    scale: currentProject.logoSettings?.scale || 1,
    rotation: currentProject.logoSettings?.rotation || 0,
  }}
/>
```

### Standalone Usage

```tsx
function StandaloneEditor() {
  const [design, setDesign] = useState(null);
  
  return (
    <CustomImageEditor
      onSave={(canvas) => {
        const dataURL = canvas.toDataURL('image/png');
        setDesign(dataURL);
      }}
      canvasWidth={1200}
      canvasHeight={800}
    />
  );
}
```

## Comparison with Previous Solution

| Feature | Old ImageEditor | New CustomImageEditor |
|---------|----------------|----------------------|
| Bundle Size | ~40MB+ | Minimal (< 5KB) |
| Dependencies | Heavy external library | Pure React + Canvas |
| Customization | Limited theming options | Full control over UI/UX |
| Performance | Slower, memory intensive | Fast, optimized rendering |
| Mobile Support | Limited touch support | Responsive, touch-friendly |
| Integration | Complex API | Simple props interface |
| Maintenance | External dependency risk | Full control over codebase |

## Browser Support

- **Modern Browsers**: Full support for Chrome, Firefox, Safari, Edge
- **Canvas API**: Requires HTML5 canvas support (IE9+)
- **File API**: File upload requires modern File API support
- **Touch Events**: Touch device support for mobile editing

## Future Enhancements

Potential features for future versions:

- **Layer Management**: Multiple logo layers with z-index control
- **Undo/Redo**: History stack for action reversal
- **Filters**: Apply effects like blur, brightness, contrast
- **Crop Tool**: Background image cropping functionality
- **Grid/Snap**: Alignment guides and snap-to-grid
- **Text Tool**: Add text overlays with font customization
- **Shape Tools**: Basic shapes (rectangles, circles, arrows)
- **Color Picker**: Change logo colors dynamically

## Troubleshooting

### Common Issues

**Images not loading:**
- Check CORS headers for external images
- Verify image URLs are accessible
- Ensure proper image format support

**Performance issues:**
- Reduce canvas size for better performance
- Optimize image sizes before upload
- Check for memory leaks in image loading

**Touch/Mobile issues:**
- Ensure proper touch event handling
- Test on actual devices for touch responsiveness
- Consider viewport meta tag settings

### Debug Mode

Enable console logging for debugging:

```tsx
<CustomImageEditor
  // ... other props
  debug={true} // Add this for debug logging
/>
```

## Contributing

When contributing to the image editor:

1. Follow React best practices
2. Maintain TypeScript type safety
3. Add proper error handling
4. Include user feedback (toasts)
5. Test on multiple devices/browsers
6. Update documentation for new features