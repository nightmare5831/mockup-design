# Marking Techniques API Usage

This document explains how to use the `getAvailableTechniques` functionality in the FastLeopard Mockups application.

## Backend Endpoint

**Endpoint:** `GET /api/v1/mockups/techniques`  
**Authentication:** Not required (public endpoint)  
**Response:** Array of `MockupTechniqueInfo` objects

### Response Format

```typescript
interface MockupTechniqueInfo {
  name: string;                    // Technique identifier (e.g., "SERIGRAFIA")
  display_name: string;           // Human-readable name (e.g., "Serigrafía")
  description: string;            // Description of the technique
  texture_preview_url?: string;   // Optional preview image URL
  premium_only: boolean;          // Whether technique requires premium subscription
}
```

### Available Techniques

The endpoint returns 10 marking techniques:

| Name | Display Name | Type | Description |
|------|-------------|------|-------------|
| `SERIGRAFIA` | Serigrafía | Free | Screen printing technique for vibrant colors |
| `BORDADO` | Bordado | Premium | Embroidery technique for textured designs |
| `GRABADO_LASER` | Grabado Láser | Premium | Laser engraving for precise details |
| `IMPRESION_DIGITAL` | Impresión Digital | Free | Digital printing for complex designs |
| `TRANSFER_DIGITAL` | Transfer Digital | Free | Digital transfer for smooth finishes |
| `VINILO_TEXTIL` | Vinilo Textil | Free | Textile vinyl for durable applications |
| `DOMING` | Doming | Premium | 3D resin coating for premium look |
| `TAMPOGRAFIA` | Tampografía | Premium | Pad printing for irregular surfaces |
| `SUBLIMACION` | Sublimación | Free | Sublimation for fabric applications |
| `TERMOGRABADO` | Termograbado | Premium | Heat engraving technique |

## Frontend Implementation

### 1. Direct API Usage

```typescript
import { mockupsApi } from '@/service/api';
import { MockupTechniqueInfo } from '@/types/api';

// Fetch techniques directly
const fetchTechniques = async () => {
  try {
    const techniques: MockupTechniqueInfo[] = await mockupsApi.getMarkingTechniques();
    console.log('Available techniques:', techniques);
    return techniques;
  } catch (error) {
    console.error('Failed to fetch techniques:', error);
    throw error;
  }
};
```

### 2. Using the Custom Hook

```typescript
import { useTechniques } from '@/hooks/useTechniques';

const MyComponent = () => {
  const { techniques, loading, error, refetch } = useTechniques();

  if (loading) return <div>Loading techniques...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Available Techniques ({techniques.length})</h3>
      {techniques.map(technique => (
        <div key={technique.name}>
          <h4>{technique.display_name}</h4>
          <p>{technique.description}</p>
          {technique.premium_only && <span>Premium Required</span>}
        </div>
      ))}
    </div>
  );
};
```

### 3. Using the TechniqueSelector Component

```typescript
import { TechniqueSelector } from '@/components/Mockup/TechniqueSelector';
import { MockupTechniqueInfo } from '@/types/api';

const MyMockupEditor = () => {
  const [selectedTechnique, setSelectedTechnique] = useState<string>();

  const handleTechniqueSelect = (technique: MockupTechniqueInfo) => {
    setSelectedTechnique(technique.name);
    console.log('Selected technique:', technique);
  };

  return (
    <TechniqueSelector
      selectedTechnique={selectedTechnique}
      onTechniqueSelect={handleTechniqueSelect}
      showPremiumOnly={true} // Show premium techniques
    />
  );
};
```

## Components Available

### 1. `useTechniques` Hook
- **File:** `src/hooks/useTechniques.ts`
- **Purpose:** React hook for fetching and managing technique state
- **Returns:** `{ techniques, loading, error, refetch }`

### 2. `TechniqueSelector` Component
- **File:** `src/components/Mockup/TechniqueSelector.tsx`
- **Purpose:** Interactive UI for selecting marking techniques
- **Features:** 
  - Grid layout with technique cards
  - Premium badge display
  - Click to select functionality
  - Loading and error states
  - Filter premium techniques option

### 3. `TechniqueExample` Component
- **File:** `src/components/Mockup/TechniqueExample.tsx`
- **Purpose:** Example component showing direct API usage
- **Features:**
  - Manual fetch button
  - Technique statistics
  - Error handling demonstration

## Example Page

Visit `/techniques` to see a complete example implementation that demonstrates:
- Fetching techniques with the custom hook
- Interactive technique selection
- Premium/free filtering
- Direct API usage example
- Complete error handling

## Error Handling

The API calls include proper error handling:

```typescript
try {
  const techniques = await mockupsApi.getMarkingTechniques();
  // Success handling
} catch (error: any) {
  // Error will be of type ApiError from BaseAPI
  console.error('Error message:', error.message);
  console.error('Status code:', error.status);
  console.error('Error code:', error.code);
}
```

## Integration with BaseAPI

The `mockupsApi.getMarkingTechniques()` method extends the `BaseAPI` class, which provides:
- Automatic JWT token inclusion
- Token refresh on 401 errors
- Consistent error handling
- Request/response interceptors

## Notes

- No authentication required for this endpoint
- Techniques are hardcoded in the backend (not from database)
- Premium techniques require subscription validation elsewhere in the app
- Texture preview URLs are currently not populated but the structure supports them
- The endpoint is tested and documented in the backend API docs