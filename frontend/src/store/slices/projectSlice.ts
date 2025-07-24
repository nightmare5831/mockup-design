import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { mockupsApi } from '@/service/api';
import { MockupResponse, MockupCreate, MockupStatus } from '@/types';
import { Project, ProjectState } from '@/types';

const initialState: ProjectState = {
  currentProject: null,
  projects: [],
  availableTechniques: [],
  mockupTechniques: [],
  loading: false,
  error: null,
};

// Fixed async thunk for uploading images
export const uploadMockupImages = createAsyncThunk(
  'project/uploadMockupImages',
  async ({ mockupId, image, type }: { mockupId: string; image: File; type: string }, { rejectWithValue }) => {
    try {
      const response = await mockupsApi.uploadMockupImages(mockupId, image, type);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to upload image');
    }
  }
);

// Create project thunk
export const createMockup = createAsyncThunk(
  'project/createMockup',
  async ({ name, technique }: { name: string, technique: string }, { rejectWithValue }) => {
    try {
      const response = await mockupsApi.createMockup(name, technique);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create project');
    }
  }
);

// Generate mockup thunk
export const generateMockup = createAsyncThunk(
  'project/generateMockup',
  async (projectData: {
    name: string;
    technique: string;
  }, { rejectWithValue }) => {
    try {
      const response = await mockupsApi.createMockup(projectData.name, projectData.technique);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to generate mockup');
    }
  }
);

// Regenerate mockup thunk
export const regenerateMockup = createAsyncThunk(
  'project/regenerateMockup',
  async ({ id, data }: { id: string; data: Partial<MockupCreate> }, { rejectWithValue }) => {
    try {
      const response = await mockupsApi.regenerateMockup(id, data);
      console.log(response);
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to regenerate mockup');
    }
  }
);

// Update mockup thunk
export const updateMockup = createAsyncThunk(
  'project/updateMockup',
  async ({ id, data }: { id: string; data: Partial<MockupCreate> }, { rejectWithValue }) => {
    try {
      const response = await mockupsApi.updateMockup(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update mockup');
    }
  }
);

// Fetch marking techniques thunk
export const fetchMarkingTechniques = createAsyncThunk(
  'project/fetchMarkingTechniques',
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockupsApi.getMarkingTechniques();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch techniques');
    }
  }
);

// Fetch user mockups thunk
export const fetchUserMockups = createAsyncThunk(
  'project/fetchUserMockups',
  async (params: { page?: number; per_page?: number; status?: MockupStatus } = {}, { rejectWithValue }) => {
    try {
      const response = await mockupsApi.getMockups(params.page, params.per_page, params.status);
      return response.mockups;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch mockups');
    }
  }
);
// Delete mockup thunk
export const deleteMockup = createAsyncThunk(
  'project/DeleteMockup',
  async ( id : string, { rejectWithValue }) => {
    try {
      await mockupsApi.deleteMockup(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch mockups');
    }
  }
);

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setCurrentMockup: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    updateProject: (state, action: PayloadAction<Partial<Project>>) => {
      if (state.currentProject) {
        state.currentProject = { ...state.currentProject, ...action.payload };
        const index = state.projects.findIndex(p => p.id === state.currentProject!.id);
        if (index !== -1) {
          state.projects[index] = state.currentProject;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Upload images
    builder
      .addCase(uploadMockupImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadMockupImages.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.type == "products") {
          state.currentProject.product_image_url = action.payload.image_url;
          // Clear temporary data after successful upload
          state.currentProject.productImage = undefined;
        } else {
          state.currentProject.logo_image_url = action.payload.image_url;
          // Clear temporary data after successful upload
          state.currentProject.logoImage = undefined;
        }
      })
      .addCase(uploadMockupImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create project
    builder
      .addCase(createMockup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMockup.fulfilled, (state, action) => {
        state.loading = false;
        const project = action.payload as Project;
        state.currentProject = project;
        state.projects.unshift(project);
      })
      .addCase(createMockup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Regenerate mockup
    builder
      .addCase(regenerateMockup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(regenerateMockup.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentProject) {
          const updatedProject = action.payload as Project;
          
          // Console log the new image URL from backend
          console.log('🎨 NEW MOCKUP RESULT URL:', updatedProject.result_image_url);
          console.log('📦 FULL BACKEND RESPONSE:', updatedProject);
          
          state.currentProject = updatedProject;
          
          // Update in projects array
          const index = state.projects.findIndex(p => p.id === updatedProject.id);
          if (index !== -1) {
            state.projects[index] = updatedProject;
          }
        }
      })
      .addCase(regenerateMockup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Generate mockup
    builder
      .addCase(generateMockup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateMockup.fulfilled, (state, action) => {
        state.loading = false;
        const mockupResponse = action.payload as MockupResponse;
        
        // Console log the new mockup creation result
        console.log('✨ NEW MOCKUP CREATED - RESULT URL:', mockupResponse.result_image_url);
        console.log('🆕 MOCKUP CREATION RESPONSE:', mockupResponse);
        
        if (state.currentProject) {
          state.currentProject = {
            ...state.currentProject,
            id: mockupResponse.id,
            result_image_url: mockupResponse.result_image_url,
            status: mockupResponse.status,
          };
          
          const index = state.projects.findIndex(p => p.id === state.currentProject!.id);
          if (index !== -1) {
            state.projects[index] = state.currentProject;
          }
        }
      })
      .addCase(generateMockup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update mockup
    builder
      .addCase(updateMockup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMockup.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentProject && action.payload.id === state.currentProject.id) {
          const updatedProject = action.payload as Project;
          state.currentProject = updatedProject;
          
          // Update in projects array
          const index = state.projects.findIndex(p => p.id === updatedProject.id);
          if (index !== -1) {
            state.projects[index] = updatedProject;
          }
        }
      })
      .addCase(updateMockup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Delete mockup
    builder
      .addCase(deleteMockup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMockup.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteMockup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch marking techniques
    builder
      .addCase(fetchMarkingTechniques.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMarkingTechniques.fulfilled, (state, action) => {
        state.loading = false;
        state.mockupTechniques = action.payload;
      })
      .addCase(fetchMarkingTechniques.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch user mockups
    builder
      .addCase(fetchUserMockups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserMockups.fulfilled, (state, action) => {
        state.loading = false;
        const mockups = action.payload as Project[];
        state.projects = mockups;
      })
      .addCase(fetchUserMockups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCurrentMockup, 
  updateProject,
  clearError 
} = projectSlice.actions;

export default projectSlice.reducer;