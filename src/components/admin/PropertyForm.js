import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Building2, MapPin, DollarSign, TrendingUp, Hash, Plus, Trash2, Settings, Edit, Upload } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SimpleMap from './SimpleMap';
import { adminAPI, uploadAPI, propertiesAPI } from '../../services/api';
import { supabaseUpload } from '../../services/supabaseUpload';

// Ensure we're using Supabase, not the old API
console.log('✅ PropertyForm: Using Supabase for image and document uploads');

const PropertyForm = ({ property, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    // Required fields for backend validation
    organizationId: '', // Required: organization ID
    type: 'residential', // Required: property type
    status: 'active', // Required: one of the allowed values
    totalValueUSDT: 0, // Required: number
    totalTokens: 1000, // Required: number
    expectedROI: 0, // Required: number (calculated based on construction progress)
    fullROI: 0, // Base/full ROI when construction is 100%
    
    // Other fields
    title: '',
    slug: '',
    description: '',
    short_description: '',
    location_address: '',
    location_city: 'Karachi',
    location_state: 'Sindh',
    location_country: 'Pakistan',
    location_latitude: '',
    location_longitude: '',
    property_type: 'residential',
    project_type: '',
    floors: '',
    total_units: '',
    construction_progress: 0,
    start_date: '',
    expected_completion: '',
    handover_date: '',
    pricing_total_value: '',
    pricing_market_value: '',
    pricing_appreciation: '',
    pricing_expected_roi: '',
    pricing_min_investment: '',
    tokenization_total_tokens: 1000,
    tokenization_available_tokens: 1000,
    tokenization_price_per_token: '',
    tokenization_token_price: '',
    unit_types: [],
    features: [],
    images: [], // Array of image URLs
    seo: {},
    investment_stats: {
      totalInvestors: 0,
      totalInvestment: 0,
      averageInvestment: 0
    },
    is_active: true,
    is_featured: false,
    sort_order: 0,
    bedrooms: 2,
    bathrooms: 2,
    area_sqm: 100.00,
    is_rented: false,
    appreciation_percentage: 20.00,
    amenities: [],
    documents: [],
    property_features: [],
    listing_price_formatted: '$0'
  });

  const [newUnitType, setNewUnitType] = useState({ type: '', size: '', count: '' });
  const [editingUnitIndex, setEditingUnitIndex] = useState(null);
  const [editingUnit, setEditingUnit] = useState({ type: '', size: '', count: '' });
  const [newFeature, setNewFeature] = useState('');
  const [newAmenity, setNewAmenity] = useState('');
  const [newDocument, setNewDocument] = useState({ name: '', url: '', type: '' });
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const documentFileInputRef = useRef(null);
  const [newPropertyFeature, setNewPropertyFeature] = useState('');
  const [newImage, setNewImage] = useState({ url: '', alt: '', type: 'main' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageFileInputRef = useRef(null);
  const [seoData, setSeoData] = useState({ title: '', description: '', keywords: '' });
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [fullPropertyData, setFullPropertyData] = useState(null);

  // Fetch full property data from backend when editing
  useEffect(() => {
    const fetchFullProperty = async () => {
      if (property && (property.id || property.displayCode)) {
        const propertyId = property.id || property.displayCode;
        try {
          console.log('📥 PropertyForm: Fetching full property data from backend:', propertyId);
          const response = await propertiesAPI.getById(propertyId);
          const fullData = response?.data?.data || response?.data || response;
          console.log('✅ PropertyForm: Received full property data:', fullData);
          setFullPropertyData(fullData);
        } catch (error) {
          console.error('❌ PropertyForm: Failed to fetch property data:', error);
          setFullPropertyData(property); // Use provided property as fallback
        }
      } else {
        setFullPropertyData(null);
      }
    };
    
    fetchFullProperty();
  }, [property?.id, property?.displayCode]);

  // Fetch organizations from database
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true);
      try {
        const response = await adminAPI.getOrganizations({ limit: 100 });
        const orgs = response?.data?.data?.organizations || response?.data?.organizations || response?.data || [];
        setOrganizations(orgs);
        console.log('📋 Loaded organizations:', orgs);
        
        // Auto-select first organization if available and no org is selected
        if (orgs.length > 0 && !formData.organizationId) {
          setFormData(prev => ({
            ...prev,
            organizationId: orgs[0].displayCode || orgs[0].id
          }));
        }
      } catch (error) {
        console.error('Failed to load organizations:', error);
        // If API fails, user can still manually enter org ID
      } finally {
        setLoadingOrgs(false);
      }
    };
    
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Use fullPropertyData if available (from backend), otherwise use property prop
    const propertyToLoad = fullPropertyData || property;
    
    if (propertyToLoad) {
      console.log('📥 Loading property data for editing:', propertyToLoad);
      
      // Handle images - can be JSON string or array
      let imagesArray = [];
      if (propertyToLoad.images) {
        if (typeof propertyToLoad.images === 'string') {
          try {
            imagesArray = JSON.parse(propertyToLoad.images);
          } catch (e) {
            console.warn('Failed to parse images JSON:', e);
            imagesArray = [];
          }
        } else if (Array.isArray(propertyToLoad.images)) {
          imagesArray = propertyToLoad.images;
        } else if (typeof propertyToLoad.images === 'object') {
          // Handle old format: { main: { url: '...' }, gallery: { url: '...' } }
          imagesArray = Object.values(propertyToLoad.images)
            .map(img => (typeof img === 'object' && img.url ? img.url : img))
            .filter(Boolean);
        }
      }
      
      // Extract amenities and unit_types from features object (if nested)
      let amenities = [];
      let unit_types = [];
      
      if (propertyToLoad.features) {
        if (typeof propertyToLoad.features === 'object' && !Array.isArray(propertyToLoad.features)) {
          // Features is an object: { amenities: [...], unit_types: [...] }
          amenities = Array.isArray(propertyToLoad.features.amenities) ? propertyToLoad.features.amenities : [];
          unit_types = Array.isArray(propertyToLoad.features.unit_types) ? propertyToLoad.features.unit_types : [];
        } else if (Array.isArray(propertyToLoad.features)) {
          // Features is an array (old format)
          amenities = propertyToLoad.features;
        }
      }
      
      // If amenities/unit_types exist at top level, use those instead
      if (Array.isArray(propertyToLoad.amenities) && propertyToLoad.amenities.length > 0) {
        amenities = propertyToLoad.amenities;
      }
      if (Array.isArray(propertyToLoad.unit_types) && propertyToLoad.unit_types.length > 0) {
        unit_types = propertyToLoad.unit_types;
      }
      
      // Map location fields (database might have city/state/country or location_city/location_state/location_country)
      // Check multiple possible field names from backend
      const location_city = propertyToLoad.location_city || 
                           propertyToLoad.city || 
                           propertyToLoad.location?.city ||
                           (propertyToLoad.location && typeof propertyToLoad.location === 'string' ? propertyToLoad.location.split(',')[0] : null) ||
                           'Karachi';
      const location_state = propertyToLoad.location_state || 
                            propertyToLoad.state || 
                            propertyToLoad.location?.state ||
                            (propertyToLoad.location && typeof propertyToLoad.location === 'string' ? propertyToLoad.location.split(',')[1]?.trim() : null) ||
                            'Sindh';
      const location_country = propertyToLoad.location_country || 
                              propertyToLoad.country || 
                              propertyToLoad.location?.country ||
                              'Pakistan';
      const location_address = propertyToLoad.location_address || 
                              propertyToLoad.address || 
                              propertyToLoad.location?.address ||
                              '';
      const location_latitude = propertyToLoad.location_latitude || 
                               propertyToLoad.latitude || 
                               propertyToLoad.location?.latitude ||
                               '';
      const location_longitude = propertyToLoad.location_longitude || 
                                propertyToLoad.longitude || 
                                propertyToLoad.location?.longitude ||
                                '';
      
      // Map organizationId (could be organizationId or organization_id)
      const organizationId = propertyToLoad.organizationId || propertyToLoad.organization_id || '';
      
      // Load all form data from property
      setFormData({
        // Required backend fields
        organizationId: organizationId,
        type: propertyToLoad.type || 'residential',
        status: propertyToLoad.status || 'active',
        totalValueUSDT: propertyToLoad.totalValueUSDT || propertyToLoad.total_value_usdt || 0,
        totalTokens: propertyToLoad.totalTokens || propertyToLoad.total_tokens || 1000,
        expectedROI: propertyToLoad.expectedROI || propertyToLoad.expected_roi || 0,
        // Calculate full ROI: if construction is 100%, full ROI = expected ROI
        // Otherwise, full ROI = expected ROI / (construction progress / 100)
        fullROI: (() => {
          const constructionProgress = propertyToLoad.construction_progress || 0;
          const expectedROI = propertyToLoad.expectedROI || propertyToLoad.expected_roi || 0;
          if (constructionProgress === 100) {
            return expectedROI;
          } else if (constructionProgress > 0 && expectedROI > 0) {
            return (expectedROI / (constructionProgress / 100));
          }
          return expectedROI || 0; // Default to expected ROI if construction is 0
        })(),
        
        // Basic information
        title: propertyToLoad.title || propertyToLoad.name || '',
        slug: propertyToLoad.slug || '',
        description: propertyToLoad.description || '',
        short_description: propertyToLoad.short_description || propertyToLoad.shortDescription || '',
        
        // Location - map from database format to form format
        location_address: location_address,
        location_city: location_city,
        location_state: location_state,
        location_country: location_country,
        location_latitude: location_latitude ? String(location_latitude) : '',
        location_longitude: location_longitude ? String(location_longitude) : '',
        
        // Property details
        property_type: propertyToLoad.property_type || propertyToLoad.type || 'residential',
        project_type: propertyToLoad.project_type || '',
        floors: propertyToLoad.floors ? String(propertyToLoad.floors) : '',
        total_units: propertyToLoad.total_units ? String(propertyToLoad.total_units) : '',
        construction_progress: propertyToLoad.construction_progress || 0,
        start_date: propertyToLoad.start_date || '',
        expected_completion: propertyToLoad.expected_completion || '',
        handover_date: propertyToLoad.handover_date || '',
        
        // Pricing
        pricing_total_value: propertyToLoad.pricing_total_value ? String(propertyToLoad.pricing_total_value) : '',
        pricing_market_value: propertyToLoad.pricing_market_value ? String(propertyToLoad.pricing_market_value) : '',
        pricing_appreciation: propertyToLoad.pricing_appreciation ? String(propertyToLoad.pricing_appreciation) : '',
        pricing_expected_roi: propertyToLoad.pricing_expected_roi ? String(propertyToLoad.pricing_expected_roi) : '',
        pricing_min_investment: propertyToLoad.pricing_min_investment ? String(propertyToLoad.pricing_min_investment) : '',
        
        // Tokenization
        tokenization_total_tokens: propertyToLoad.tokenization_total_tokens || propertyToLoad.totalTokens || 1000,
        tokenization_available_tokens: propertyToLoad.tokenization_available_tokens || propertyToLoad.availableTokens || 1000,
        tokenization_price_per_token: propertyToLoad.tokenization_price_per_token ? String(propertyToLoad.tokenization_price_per_token) : '',
        tokenization_token_price: propertyToLoad.tokenization_token_price ? String(propertyToLoad.tokenization_token_price) : '',
        
        // Specifications
        bedrooms: propertyToLoad.bedrooms || 2,
        bathrooms: propertyToLoad.bathrooms || 2,
        area_sqm: propertyToLoad.area_sqm || propertyToLoad.area || 100.00,
        is_rented: propertyToLoad.is_rented || false,
        appreciation_percentage: propertyToLoad.appreciation_percentage || 20.00,
        
        // Features and amenities (extracted from nested structure)
        features: Array.isArray(propertyToLoad.features) ? propertyToLoad.features : [],
        amenities: amenities,
        unit_types: unit_types,
        
        // Documents
        documents: Array.isArray(propertyToLoad.documents) ? propertyToLoad.documents : [],
        
        // Property features
        property_features: Array.isArray(propertyToLoad.property_features) ? propertyToLoad.property_features : [],
        
        // Images (parsed from JSON string)
        images: imagesArray,
        
        // Status
        is_active: propertyToLoad.is_active !== undefined ? propertyToLoad.is_active : (propertyToLoad.status === 'active'),
        is_featured: propertyToLoad.is_featured || false,
        sort_order: propertyToLoad.sort_order || 0,
        
        // Not sent to backend but kept for form state
        investment_stats: propertyToLoad.investment_stats || {
          totalInvestors: 0,
          totalInvestment: 0,
          averageInvestment: 0
        },
        listing_price_formatted: propertyToLoad.listing_price_formatted || '$0'
      });
      
      // Load SEO data
      if (propertyToLoad.seo) {
        setSeoData({
          title: propertyToLoad.seo.title || '',
          description: propertyToLoad.seo.description || '',
          keywords: propertyToLoad.seo.keywords || ''
        });
      } else {
        setSeoData({ title: '', description: '', keywords: '' });
      }
      
      console.log('✅ Property data loaded into form');
    } else {
      // Reset form when no property (creating new)
      setFormData({
        organizationId: '',
        type: 'residential',
        status: 'active',
        totalValueUSDT: 0,
        totalTokens: 1000,
        expectedROI: 0,
        fullROI: 0,
        title: '',
        slug: '',
        description: '',
        short_description: '',
        location_address: '',
        location_city: 'Karachi',
        location_state: 'Sindh',
        location_country: 'Pakistan',
        location_latitude: '',
        location_longitude: '',
        property_type: 'residential',
        project_type: '',
        floors: '',
        total_units: '',
        construction_progress: 0,
        start_date: '',
        expected_completion: '',
        handover_date: '',
        pricing_total_value: '',
        pricing_market_value: '',
        pricing_appreciation: '',
        pricing_expected_roi: '',
        pricing_min_investment: '',
        tokenization_total_tokens: 1000,
        tokenization_available_tokens: 1000,
        tokenization_price_per_token: '',
        tokenization_token_price: '',
        unit_types: [],
        features: [],
        images: [],
        amenities: [],
        documents: [],
        property_features: [],
        is_active: true,
        is_featured: false,
        sort_order: 0,
        bedrooms: 2,
        bathrooms: 2,
        area_sqm: 100.00,
        is_rented: false,
        appreciation_percentage: 20.00,
        investment_stats: {
          totalInvestors: 0,
          totalInvestment: 0,
          averageInvestment: 0
        },
        listing_price_formatted: '$0'
      });
      setSeoData({ title: '', description: '', keywords: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property, fullPropertyData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto-sync pricing_total_value from totalValueUSDT
      if (name === 'totalValueUSDT' && value) {
        const totalValue = parseFloat(value);
        if (!isNaN(totalValue)) {
          newData.pricing_total_value = totalValue.toString();
        }
      }
      
      // Auto-sync tokenization_total_tokens from totalTokens
      if (name === 'totalTokens' && value) {
        const totalTokens = parseFloat(value);
        if (!isNaN(totalTokens)) {
          newData.tokenization_total_tokens = totalTokens;
          // If Available Tokens exceeds new Total Tokens, cap it at Total Tokens
          const currentAvailable = parseFloat(prev.tokenization_available_tokens) || 0;
          if (currentAvailable > totalTokens) {
            newData.tokenization_available_tokens = totalTokens;
          }
        }
      }
      
      // Validate Available Tokens doesn't exceed Total Tokens
      if (name === 'tokenization_available_tokens' && value) {
        const availableTokens = parseFloat(value);
        const totalTokens = parseFloat(prev.totalTokens) || parseFloat(prev.tokenization_total_tokens) || 0;
        if (!isNaN(availableTokens) && !isNaN(totalTokens)) {
          if (availableTokens > totalTokens) {
            // Cap at Total Tokens
            newData.tokenization_available_tokens = totalTokens;
          } else if (availableTokens < 0) {
            // Don't allow negative values
            newData.tokenization_available_tokens = 0;
          }
        }
      }
      
      // Auto-calculate Expected ROI based on Construction Progress
      if (name === 'construction_progress' && value !== undefined) {
        const constructionProgress = parseFloat(value);
        const fullROI = parseFloat(prev.fullROI) || parseFloat(prev.expectedROI) || 0;
        if (!isNaN(constructionProgress) && !isNaN(fullROI) && fullROI > 0) {
          // Calculate ROI as percentage of construction progress
          const calculatedROI = (constructionProgress / 100) * fullROI;
          newData.expectedROI = parseFloat(calculatedROI.toFixed(2));
          newData.pricing_expected_roi = calculatedROI.toFixed(2).toString();
        } else if (constructionProgress === 100 && fullROI > 0) {
          // At 100%, ROI equals full ROI
          newData.expectedROI = fullROI;
          newData.pricing_expected_roi = fullROI.toString();
        }
      }
      
      // When full ROI is set, recalculate expected ROI based on construction progress
      if (name === 'fullROI' && value) {
        const fullROI = parseFloat(value);
        const constructionProgress = parseFloat(prev.construction_progress) || 0;
        if (!isNaN(fullROI) && !isNaN(constructionProgress)) {
          const calculatedROI = (constructionProgress / 100) * fullROI;
          newData.expectedROI = parseFloat(calculatedROI.toFixed(2));
          newData.pricing_expected_roi = calculatedROI.toFixed(2).toString();
        }
      }
      
      // Auto-sync pricing_expected_roi from expectedROI (for manual edits)
      if (name === 'expectedROI' && value) {
        const expectedROI = parseFloat(value);
        if (!isNaN(expectedROI)) {
          newData.pricing_expected_roi = expectedROI.toString();
          // If construction is 100%, update full ROI
          const constructionProgress = parseFloat(prev.construction_progress) || 0;
          if (constructionProgress === 100) {
            newData.fullROI = expectedROI;
          }
        }
      }
      
      // Auto-calculate Expected ROI when Total Value changes
      if (name === 'pricing_total_value' && value) {
        const totalValue = parseFloat(value);
        if (totalValue > 0) {
          // Calculate ROI based on total value (higher value = higher ROI)
          const calculatedROI = Math.min(25, Math.max(5, (totalValue / 1000000000) * 2 + 8)).toFixed(1);
          newData.pricing_expected_roi = calculatedROI;
        }
      }

      // Auto-calculate Price Per Token when Total Tokens changes
      if (name === 'totalTokens' && value && prev.totalValueUSDT) {
        const totalTokens = parseFloat(value);
        const totalValue = parseFloat(prev.totalValueUSDT);
        if (totalTokens > 0 && totalValue > 0) {
          const pricePerToken = (totalValue / totalTokens).toFixed(2);
          newData.tokenization_price_per_token = pricePerToken;
          newData.tokenization_token_price = pricePerToken;
        }
      }
      
      // Auto-calculate Price Per Token when Total Value changes (if Total Tokens is set)
      if (name === 'totalValueUSDT' && value && prev.totalTokens) {
        const totalValue = parseFloat(value);
        const totalTokens = parseFloat(prev.totalTokens);
        if (totalValue > 0 && totalTokens > 0) {
          const pricePerToken = (totalValue / totalTokens).toFixed(2);
          newData.tokenization_price_per_token = pricePerToken;
          newData.tokenization_token_price = pricePerToken;
        }
      }
      
      // Auto-calculate Price Per Token when pricing_total_value changes (if tokenization_total_tokens is set)
      if (name === 'pricing_total_value' && value && prev.tokenization_total_tokens) {
        const totalValue = parseFloat(value);
        const totalTokens = parseFloat(prev.tokenization_total_tokens);
        if (totalValue > 0 && totalTokens > 0) {
          const pricePerToken = (totalValue / totalTokens).toFixed(2);
          newData.tokenization_price_per_token = pricePerToken;
          newData.tokenization_token_price = pricePerToken;
        }
      }
      
      // Auto-calculate Price Per Token when tokenization_total_tokens changes (if pricing_total_value is set)
      if (name === 'tokenization_total_tokens' && value && prev.pricing_total_value) {
        const totalTokens = parseFloat(value);
        const totalValue = parseFloat(prev.pricing_total_value);
        if (totalTokens > 0 && totalValue > 0) {
          const pricePerToken = (totalValue / totalTokens).toFixed(2);
          newData.tokenization_price_per_token = pricePerToken;
          newData.tokenization_token_price = pricePerToken;
        }
      }

      // Auto-generate Unit Types when Total Units changes
      if (name === 'total_units' && value) {
        const totalUnits = parseInt(value);
        if (totalUnits > 0 && totalUnits <= 10) {
          const generatedUnitTypes = [];
          for (let i = 1; i <= totalUnits; i++) {
            generatedUnitTypes.push({
              type: `${i} Bedroom`,
              size: `${800 + (i * 400)} sq ft`,
              count: `${i}`
            });
          }
          newData.unit_types = generatedUnitTypes;
        }
      }

      return newData;
    });
  };

  const handleLocationChange = (latitude, longitude) => {
    setFormData(prev => ({
      ...prev,
      location_latitude: latitude.toFixed(6),
      location_longitude: longitude.toFixed(6)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (formData.documents.length === 0) {
      alert('Please add at least one document before saving the property.');
      return;
    }
    
    // Format data to match backend structure
    const finalData = {
      // Required backend fields (ensure they are numbers, not strings)
      organizationId: formData.organizationId,
      type: formData.type,
      status: formData.status,
      totalValueUSDT: parseFloat(formData.totalValueUSDT) || 0,
      totalTokens: parseInt(formData.totalTokens) || 1000,
      expectedROI: parseFloat(formData.expectedROI) || 0,
      
      // Basic information
      title: formData.title || '',
      slug: formData.slug || '',
      description: formData.description || '',
      short_description: formData.short_description || '',
      
      // Location - convert location_* to backend expected format
      address: formData.location_address || '',
      city: formData.location_city || 'Karachi',
      state: formData.location_state || 'Sindh',
      country: formData.location_country || 'Pakistan',
      latitude: formData.location_latitude ? parseFloat(formData.location_latitude) : null,
      longitude: formData.location_longitude ? parseFloat(formData.location_longitude) : null,
      
      // Property details
      property_type: formData.property_type || 'residential',
      project_type: formData.project_type || '',
      floors: formData.floors || '',
      total_units: formData.total_units || '',
      construction_progress: parseInt(formData.construction_progress) || 0,
      start_date: formData.start_date || '',
      expected_completion: formData.expected_completion || '',
      handover_date: formData.handover_date || '',
      
      // Pricing
      pricing_total_value: formData.pricing_total_value || '',
      pricing_market_value: formData.pricing_market_value || '',
      pricing_appreciation: formData.pricing_appreciation || '',
      pricing_expected_roi: formData.pricing_expected_roi || '',
      pricing_min_investment: formData.pricing_min_investment || '',
      
      // Tokenization
      tokenization_total_tokens: parseInt(formData.tokenization_total_tokens) || 1000,
      tokenization_available_tokens: Math.min(
        parseInt(formData.tokenization_available_tokens) || 1000,
        parseInt(formData.totalTokens) || 1000
      ),
      tokenization_price_per_token: formData.tokenization_price_per_token || '',
      tokenization_token_price: formData.tokenization_token_price || '',
      
      // Specifications
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      area_sqm: parseFloat(formData.area_sqm) || 0,
      is_rented: formData.is_rented || false,
      appreciation_percentage: parseFloat(formData.appreciation_percentage) || 0,
      
      // Features - backend expects object with amenities array
      features: {
        amenities: formData.amenities || [],
        unit_types: formData.unit_types || []
      },
      
      // Images - backend expects array, not JSON string
      images: Array.isArray(formData.images) ? formData.images : [],
      
      // Documents - ensure it's an array and properly formatted
      documents: Array.isArray(formData.documents) ? formData.documents : [],
      
      // Property features
      property_features: formData.property_features || [],
      
      // SEO
      seo: seoData || {},
      
      // Status
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      is_featured: formData.is_featured || false,
      sort_order: parseInt(formData.sort_order) || 0
    };
    
    // Remove location_* fields since we've converted them
    delete finalData.location_address;
    delete finalData.location_city;
    delete finalData.location_state;
    delete finalData.location_country;
    delete finalData.location_latitude;
    delete finalData.location_longitude;
    
    // Remove top-level amenities and unit_types since they're in features
    delete finalData.amenities;
    delete finalData.unit_types;
    
    // Remove fields that shouldn't be sent to backend
    delete finalData.investment_stats;
    delete finalData.listing_price_formatted;
    
    // Log documents specifically to verify they're being sent
    console.log('📤 Submitting property data:', JSON.stringify(finalData, null, 2));
    console.log('📄 Documents being sent:', JSON.stringify(finalData.documents, null, 2));
    console.log('📄 Documents count:', finalData.documents?.length || 0);
    console.log('📄 Documents type check:', {
      isArray: Array.isArray(finalData.documents),
      type: typeof finalData.documents,
      value: finalData.documents
    });
    
    // Verify documents format for JSONB compatibility
    if (finalData.documents && finalData.documents.length > 0) {
      const isValidFormat = finalData.documents.every(doc => 
        doc && typeof doc === 'object' && doc.name && doc.url && doc.type
      );
      console.log('✅ Documents format valid for JSONB:', isValidFormat);
      if (!isValidFormat) {
        console.error('❌ Invalid document format! Each document must have: name, url, type');
      }
    }
    
    onSave(finalData);
  };

  const fillRandomValues = () => {
    const randomTitles = [
      'Luxury Heights Residency',
      'Golden Gate Apartments',
      'Skyline Towers',
      'Emerald Gardens',
      'Royal Plaza Complex',
      'Diamond Heights',
      'Crystal Residences',
      'Pearl Towers',
      'Sapphire Gardens',
      'Platinum Heights'
    ];
    
    const randomDescriptions = [
      'A premium residential complex offering modern amenities and luxury living in the heart of the city.',
      'State-of-the-art residential development with world-class facilities and breathtaking views.',
      'Exclusive residential project featuring contemporary design and premium lifestyle amenities.',
      'Luxury residential complex with modern architecture and comprehensive lifestyle facilities.',
      'Premium residential development offering sophisticated living with world-class amenities.'
    ];
    
    const randomAddresses = [
      'DHA Phase 8, Karachi',
      'Clifton Block 2, Karachi',
      'Gulshan-e-Iqbal Block 13D, Karachi',
      'North Nazimabad Block H, Karachi',
      'PECHS Block 6, Karachi',
      'Defence Phase 5, Karachi',
      'Malir Cantt, Karachi',
      'Korangi Industrial Area, Karachi'
    ];
    
    const randomPropertyTypes = ['residential', 'commercial'];
    const randomStatuses = ['active'];
    
    const randomTitle = randomTitles[Math.floor(Math.random() * randomTitles.length)];
    const randomDescription = randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)];
    const randomAddress = randomAddresses[Math.floor(Math.random() * randomAddresses.length)];
    const randomPropertyType = randomPropertyTypes[Math.floor(Math.random() * randomPropertyTypes.length)];
    const randomStatus = randomStatuses[Math.floor(Math.random() * randomStatuses.length)];
    
    // Get random organization from loaded organizations
    const randomOrg = organizations.length > 0 
      ? organizations[Math.floor(Math.random() * organizations.length)]
      : null;
    const orgId = randomOrg ? (randomOrg.displayCode || randomOrg.id) : 'ORG-000001';
    
    // Generate random pricing values
    const totalValueUSDT = Math.floor(Math.random() * 70000000) + 3500000; // 3.5M to 70M USD
    const totalValue = totalValueUSDT; // Already in USD
    const minInvestment = Math.floor(Math.random() * 1000000) + 100000; // 100K to 1M
    const roi = (Math.random() * 15 + 5).toFixed(1); // 5% to 20%
    const totalTokens = Math.floor(Math.random() * 200000) + 10000; // 10K to 200K
    const availableTokens = Math.floor(totalTokens * (Math.random() * 0.8 + 0.2)); // 20% to 100% of total
    
    // Generate random dates
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + Math.floor(Math.random() * 12));
    const completionDate = new Date(startDate);
    completionDate.setMonth(completionDate.getMonth() + Math.floor(Math.random() * 24) + 12);
    
    setFormData({
      // Required backend fields
      organizationId: orgId,
      type: randomPropertyType,
      status: randomStatus,
      totalValueUSDT: totalValueUSDT,
      totalTokens: totalTokens,
      expectedROI: parseFloat(roi),
      
      // Other fields
      title: randomTitle,
      slug: generateSlug(randomTitle),
      description: randomDescription,
      short_description: `Premium ${randomPropertyType} development in ${randomAddress.split(',')[0]}`,
      location_address: randomAddress,
      location_city: 'Karachi',
      location_state: 'Sindh',
      location_country: 'Pakistan',
      location_latitude: (24.8 + Math.random() * 0.2).toFixed(6),
      location_longitude: (67.0 + Math.random() * 0.2).toFixed(6),
      property_type: randomPropertyType,
      project_type: ['residential', 'commercial', 'mixed-use', 'residential-commercial', 'retail', 'office'][Math.floor(Math.random() * 6)],
      floors: Math.floor(Math.random() * 20) + 5,
      total_units: Math.floor(Math.random() * 10) + 1,
      construction_progress: [0, 25, 50, 75, 100][Math.floor(Math.random() * 5)],
      start_date: startDate.toISOString().split('T')[0],
      expected_completion: completionDate.toISOString().split('T')[0],
      handover_date: new Date(completionDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pricing_total_value: totalValue.toString(),
      pricing_market_value: Math.floor(totalValue * 0.9).toString(),
      pricing_appreciation: (Math.random() * 20 + 10).toFixed(1),
      pricing_expected_roi: roi,
      pricing_min_investment: minInvestment.toString(),
      tokenization_total_tokens: totalTokens,
      tokenization_available_tokens: availableTokens,
      tokenization_price_per_token: (totalValue / totalTokens).toFixed(2),
      tokenization_token_price: (totalValue / totalTokens).toFixed(2),
      unit_types: [
        { type: '1 Bedroom', size: '800 sq ft', count: '1' },
        { type: '2 Bedroom', size: '1200 sq ft', count: '2' },
        { type: '3 Bedroom', size: '1800 sq ft', count: '3' }
      ],
      features: [
        'Swimming Pool',
        'Gymnasium',
        'Parking',
        'Security',
        'Garden',
        'Elevator',
        'Power Backup',
        'Water Treatment'
      ],
      images: [], // Don't autofill images - user must upload them
      seo: {
        title: `${randomTitle} - Premium Real Estate Investment`,
        description: `Invest in ${randomTitle}, a premium ${randomPropertyType} development offering ${roi}% ROI.`,
        keywords: `${randomPropertyType}, real estate, investment, Karachi, premium`
      },
      investment_stats: {
        totalInvestors: Math.floor(Math.random() * 100),
        totalInvestment: Math.floor(totalValue * 0.1),
        averageInvestment: Math.floor(minInvestment * 1.2)
      },
      is_active: true,
      is_featured: Math.random() > 0.5,
      sort_order: Math.floor(Math.random() * 100),
      bedrooms: Math.floor(Math.random() * 4) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      area_sqm: Math.floor(Math.random() * 200) + 100,
      is_rented: Math.random() > 0.7,
      appreciation_percentage: (Math.random() * 30 + 10).toFixed(2),
      amenities: [
        'Swimming Pool',
        'Gymnasium',
        'Parking',
        '24/7 Security',
        'Garden',
        'Elevator',
        'Power Backup',
        'Water Treatment',
        'Club House',
        'Playground'
      ],
      documents: [], // Don't autofill documents - user must upload them
      property_features: [
        'Modern Architecture',
        'Energy Efficient',
        'Smart Home Features',
        'Premium Finishes',
        'High Ceilings',
        'Balcony Access'
      ],
      listing_price_formatted: `$${(totalValueUSDT / 1000000).toFixed(1)}M`
    });
    
    setSeoData({
      title: `${randomTitle} - Premium Real Estate Investment`,
      description: `Invest in ${randomTitle}, a premium ${randomPropertyType} development offering ${roi}% ROI.`,
      keywords: `${randomPropertyType}, real estate, investment, Karachi, premium`
    });
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  // Unit Types Management
  const addUnitType = () => {
    if (newUnitType.type && newUnitType.size && newUnitType.count) {
      setFormData(prev => ({
        ...prev,
        unit_types: [...prev.unit_types, { ...newUnitType }]
      }));
      setNewUnitType({ type: '', size: '', count: '' });
    }
  };

  const removeUnitType = (index) => {
    setFormData(prev => ({
      ...prev,
      unit_types: prev.unit_types.filter((_, i) => i !== index)
    }));
  };

  const editUnitType = (index) => {
    const unit = formData.unit_types[index];
    setEditingUnitIndex(index);
    setEditingUnit({ ...unit });
  };

  const saveUnitType = () => {
    if (editingUnitIndex !== null) {
      setFormData(prev => ({
        ...prev,
        unit_types: prev.unit_types.map((unit, index) => 
          index === editingUnitIndex ? editingUnit : unit
        )
      }));
      setEditingUnitIndex(null);
      setEditingUnit({ type: '', size: '', price: '' });
    }
  };

  const cancelEditUnitType = () => {
    setEditingUnitIndex(null);
    setEditingUnit({ type: '', size: '', price: '' });
  };

  // Features Management
  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Amenities Management
  const addAmenity = () => {
    if (newAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (index) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  // Documents Management
  const addDocument = () => {
    if (newDocument.name && newDocument.url && newDocument.type) {
      const documentToAdd = {
        name: newDocument.name.trim(),
        url: newDocument.url.trim(),
        type: newDocument.type
      };
      
      console.log('➕ Adding document to formData:', documentToAdd);
      
      setFormData(prev => {
        const updatedDocuments = [...prev.documents, documentToAdd];
        console.log('📄 Updated documents array:', updatedDocuments);
        return {
          ...prev,
          documents: updatedDocuments
        };
      });
      
      setNewDocument({ name: '', url: '', type: '' });
      console.log('✅ Document added successfully. Total documents:', formData.documents.length + 1);
    } else {
      const missingFields = [];
      if (!newDocument.name) missingFields.push('Name');
      if (!newDocument.url) missingFields.push('URL');
      if (!newDocument.type) missingFields.push('Type');
      alert(`Please fill in all document fields:\n- ${missingFields.join('\n- ')}`);
    }
  };

  const handleDocumentFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      alert('Invalid file type. Please upload PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, or PPTX files.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    // Auto-fill document name from filename
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setNewDocument(prev => ({ ...prev, name: fileNameWithoutExt }));

    setUploadingDocument(true);
    try {
      console.log('🚀 handleDocumentFileUpload called - Using Supabase!');
      
      // Get property ID for folder organization
      const propertyId = property?.id || property?.displayCode || 'temp';
      
      console.log('📄 Uploading document to Supabase...', { fileName: file.name, propertyId, fileSize: file.size });
      
      // IMPORTANT: Using Supabase, NOT the old uploadAPI
      // Upload to Supabase
      const result = await supabaseUpload.uploadDocument(file, 'properties', propertyId);
      
      console.log('✅ Document uploaded successfully:', result);
      
      // Set the uploaded file URL
      setNewDocument(prev => ({ 
        ...prev, 
        url: result.url // This is the Supabase public URL
      }));
      
      console.log('📄 Document URL set in form:', result.url);
      console.log('📄 Current newDocument state:', { ...newDocument, url: result.url });
      
      alert('✅ Document uploaded successfully! Please select a document type and click "Add Document" to include it.');
    } catch (error) {
      console.error('❌ Document upload error:', error);
      let errorMessage = 'Failed to upload document. Please try again.';
      
      if (error.message?.includes('Bucket not found')) {
        errorMessage += '\n\n💡 Solution: Make sure the bucket "property-documents" exists in your Supabase dashboard.';
      } else if (error.message?.includes('policy') || error.message?.includes('row-level security')) {
        errorMessage += '\n\n💡 Solution: Check your Supabase storage policies. You need an INSERT policy that allows uploads.';
      } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        errorMessage += '\n\n💡 Solution: Check your Supabase API keys in the .env file.';
      }
      
      alert(errorMessage);
    } finally {
      setUploadingDocument(false);
      // Reset file input
      if (documentFileInputRef.current) {
        documentFileInputRef.current.value = '';
      }
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Property Features Management
  const addPropertyFeature = () => {
    if (newPropertyFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        property_features: [...prev.property_features, newPropertyFeature.trim()]
      }));
      setNewPropertyFeature('');
    }
  };

  const removePropertyFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      property_features: prev.property_features.filter((_, i) => i !== index)
    }));
  };

  // Images Management
  const addImage = () => {
    if (newImage.url) {
      // Add URL to images array
      setFormData(prev => {
        // Ensure images is always an array
        const currentImages = Array.isArray(prev.images) 
          ? prev.images 
          : (typeof prev.images === 'string' 
              ? (() => {
                  try {
                    const parsed = JSON.parse(prev.images);
                    return Array.isArray(parsed) ? parsed : [];
                  } catch {
                    return [];
                  }
                })()
              : []);
        
        return {
          ...prev,
          images: [...currentImages, newImage.url]
        };
      });
      setNewImage({ url: '', alt: '', type: 'main' });
      alert('Image added successfully!');
    } else {
      alert('Please upload an image first.');
    }
  };

  const handleImageFileUpload = async (event) => {
    console.log('🚀 handleImageFileUpload called - Using Supabase!');
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, GIF, or WEBP images.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    // Auto-fill alt text from filename
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setNewImage(prev => ({ ...prev, alt: fileNameWithoutExt }));

    setUploadingImage(true);
    try {
      // Get property ID if editing
      const propertyId = property?.id || property?.displayCode || null;
      
      console.log('🖼️ Uploading image to Supabase...', { fileName: file.name, propertyId, fileSize: file.size });
      console.log('📦 supabaseUpload object:', supabaseUpload);
      
      // IMPORTANT: Using Supabase, NOT the old uploadAPI
      // Upload to Supabase
      const result = await supabaseUpload.uploadImage(file, 'properties', propertyId);
      
      console.log('✅ Upload result:', result);
      
      // Set the uploaded file URL
      setNewImage(prev => ({ 
        ...prev, 
        url: result.url // This is the Supabase public URL
      }));
      
      alert('Image uploaded successfully! Click "Add Image" to add it to the property.');
    } catch (error) {
      console.error('❌ Image upload error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Show detailed error message with troubleshooting tips
      let errorMessage = error.message || 'Unknown error occurred.';
      
      if (error.message?.includes('Bucket not found')) {
        errorMessage += '\n\n💡 Solution: Make sure the bucket "property-images" exists in your Supabase dashboard.';
      } else if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        errorMessage += '\n\n💡 Solution: Check your Supabase storage policies. You need an INSERT policy that allows uploads.';
      } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        errorMessage += '\n\n💡 Solution: Check your Supabase API keys in the .env file.';
      }
      
      errorMessage += '\n\nCheck browser console (F12) for more details.';
      
      alert(`Failed to upload image:\n\n${errorMessage}`);
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index) => {
    setFormData(prev => {
      // Ensure images is always an array
      const currentImages = Array.isArray(prev.images) ? prev.images : [];
      return {
        ...prev,
        images: currentImages.filter((_, i) => i !== index)
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="relative my-4 mx-auto border w-11/12 max-w-7xl shadow-lg rounded-md bg-card max-h-[95vh] flex flex-col">
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4 flex justify-between items-center rounded-t-md shadow-sm">
          <h3 className="text-2xl font-bold text-card-foreground">
            {property ? 'Edit Property' : 'Add New Property'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-5 py-5">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required Backend Fields */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Organization ID * {loadingOrgs && <span className="text-xs text-muted-foreground">(Loading...)</span>}
                </label>
                {organizations.length > 0 ? (
                  <select
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.displayCode || org.id}>
                        {org.displayCode || org.id} - {org.name || 'Organization'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleChange}
                    required
                    placeholder="ORG-000001"
                    className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Property Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="residential">🏠 Residential</option>
                  <option value="commercial">🏢 Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Total Value (USDT) *
                </label>
                <input
                  type="number"
                  name="totalValueUSDT"
                  value={formData.totalValueUSDT}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Total Tokens *
                </label>
                <input
                  type="number"
                  name="totalTokens"
                  value={formData.totalTokens}
                  onChange={handleChange}
                  required
                  min="1"
                  step="1"
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total token supply for this property (e.g., 20000)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Construction Progress (%) *
                </label>
                <div className="space-y-3">
                  {/* Quick Progress Buttons */}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleChange({ target: { name: 'construction_progress', value: '25' } })}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        formData.construction_progress === 25
                          ? 'bg-accent0 text-white border-blue-500'
                          : 'bg-card text-foreground border-input hover:bg-accent'
                      }`}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange({ target: { name: 'construction_progress', value: '50' } })}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        formData.construction_progress === 50
                          ? 'bg-accent0 text-white border-blue-500'
                          : 'bg-card text-foreground border-input hover:bg-accent'
                      }`}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange({ target: { name: 'construction_progress', value: '75' } })}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        formData.construction_progress === 75
                          ? 'bg-accent0 text-white border-blue-500'
                          : 'bg-card text-foreground border-input hover:bg-accent'
                      }`}
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange({ target: { name: 'construction_progress', value: '100' } })}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        formData.construction_progress === 100
                          ? 'bg-accent0 text-white border-blue-500'
                          : 'bg-card text-foreground border-input hover:bg-accent'
                      }`}
                    >
                      100%
                    </button>
                  </div>
                  
                  {/* Manual Input Field */}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="construction_progress"
                    value={formData.construction_progress}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                    placeholder="Enter custom progress (0-100)"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Used to calculate Expected ROI below
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Full ROI (%) *
                  <span className="text-xs text-muted-foreground ml-2">
                    (ROI at 100% completion)
                  </span>
                </label>
                <input
                  type="number"
                  name="fullROI"
                  value={formData.fullROI}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  placeholder="Enter full ROI (e.g., 11.5)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Expected ROI (%) *
                  <span className="text-xs text-primary ml-2">
                    (Auto-calculated: {formData.construction_progress || 0}% of Full ROI)
                  </span>
                </label>
                <input
                  type="number"
                  name="expectedROI"
                  value={formData.expectedROI}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  readOnly
                  className="w-full px-3 py-2 border border-input bg-accent text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated as: ({formData.construction_progress || 0}% construction) × ({formData.fullROI || 0}% full ROI) = {formData.expectedROI || 0}%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="active">✅ Active</option>
                </select>
              </div>
              
              {/* Optional Display Fields */}
              <div className="md:col-span-2 border-t pt-4 mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-4">Optional Display Information</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Property Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Short Description *
                </label>
                <textarea
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>
          </Card>

          {/* Location Information */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Address *
                </label>
                <textarea
                  name="location_address"
                  value={formData.location_address}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="location_city"
                  value={formData.location_city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="location_state"
                  value={formData.location_state}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  name="location_country"
                  value={formData.location_country}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="location_latitude"
                  value={formData.location_latitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="location_longitude"
                  value={formData.location_longitude}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>
            
            {/* Location Map */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Property Location Map
              </label>
              <p className="text-sm text-muted-foreground mb-3">
                Enter coordinates manually or use the map links to verify location. The latitude and longitude will be updated automatically.
              </p>
              <SimpleMap
                latitude={formData.location_latitude}
                longitude={formData.location_longitude}
                onLocationChange={handleLocationChange}
                height="400px"
              />
            </div>
          </Card>

          {/* Property Details */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Property Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Property Type *
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="mixed-use">Mixed Use</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Project Type *
                </label>
                <select
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Select Project Type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="mixed-use">Mixed Use</option>
                  <option value="residential-commercial">Residential-Commercial</option>
                  <option value="retail">Retail</option>
                  <option value="office">Office</option>
                  <option value="industrial">Industrial</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="educational">Educational</option>
                  <option value="recreational">Recreational</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="active">✅ Active</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Floors *
                </label>
                <input
                  type="text"
                  name="floors"
                  value={formData.floors}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Total Units *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  name="total_units"
                  value={formData.total_units}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  placeholder="Enter number of units (1-10)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unit types will be automatically generated based on this number
                </p>
              </div>
              {/* Date fields - only show when construction is below 100% */}
              {formData.construction_progress < 100 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Expected Completion
                    </label>
                    <input
                      type="date"
                      name="expected_completion"
                      value={formData.expected_completion}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Handover Date
                    </label>
                    <input
                      type="date"
                      name="handover_date"
                      value={formData.handover_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Pricing Information */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Pricing Information
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              💡 Note: Total Value and Expected ROI are set in Basic Information above and will auto-sync here.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Market Value (USD) *
                </label>
                <input
                  type="text"
                  name="pricing_market_value"
                  value={formData.pricing_market_value}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 12000000000"
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Appreciation (%)
                </label>
                <input
                  type="text"
                  name="pricing_appreciation"
                  value={formData.pricing_appreciation}
                  onChange={handleChange}
                  placeholder="e.g., 20"
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Min Investment (USD) *
                </label>
                <input
                  type="text"
                  name="pricing_min_investment"
                  value={formData.pricing_min_investment}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 400000"
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Listing Price Formatted
                </label>
                <input
                  type="text"
                  name="listing_price_formatted"
                  value={formData.listing_price_formatted}
                  onChange={handleChange}
                  placeholder="e.g., $12B"
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>
          </Card>

          {/* Tokenization Information */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <Hash className="w-5 h-5 mr-2" />
              Tokenization Information
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              💡 Note: Total Tokens is set in Basic Information above. Available Tokens cannot exceed Total Tokens. You can increase Available Tokens over time (up to Total Tokens limit). Price Per Token is auto-calculated.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Available Tokens *
                  {formData.totalTokens && formData.tokenization_available_tokens && (
                    <span className={`ml-2 text-xs ${parseFloat(formData.tokenization_available_tokens) > parseFloat(formData.totalTokens) ? 'text-red-500' : 'text-green-500'}`}>
                      ({formData.tokenization_available_tokens} / {formData.totalTokens})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  name="tokenization_available_tokens"
                  value={formData.tokenization_available_tokens}
                  onChange={handleChange}
                  required
                  min="0"
                  max={formData.totalTokens || undefined}
                  step="1"
                  className={`w-full px-3 py-2 border ${
                    formData.totalTokens && formData.tokenization_available_tokens && 
                    parseFloat(formData.tokenization_available_tokens) > parseFloat(formData.totalTokens)
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-input focus:ring-ring'
                  } bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:border-ring`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tokens available to the public (cannot exceed {formData.totalTokens || 'Total Tokens'})
                </p>
                {formData.totalTokens && formData.tokenization_available_tokens && 
                 parseFloat(formData.tokenization_available_tokens) > parseFloat(formData.totalTokens) && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ Available Tokens cannot exceed Total Tokens. It will be automatically capped.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Price Per Token (USD) * 
                  <span className="text-xs text-primary ml-1">(Auto-calculated)</span>
                </label>
                <input
                  type="text"
                  name="tokenization_price_per_token"
                  value={formData.tokenization_price_per_token}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 100000"
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Token Price (USD) * 
                  <span className="text-xs text-primary ml-1">(Auto-calculated)</span>
                </label>
                <input
                  type="text"
                  name="tokenization_token_price"
                  value={formData.tokenization_token_price}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 100000"
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-accent"
                />
              </div>
            </div>
          </Card>

          {/* Property Specifications */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Property Specifications
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Area (sqm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="area_sqm"
                  value={formData.area_sqm}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Appreciation Percentage
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="appreciation_percentage"
                  value={formData.appreciation_percentage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_rented"
                    checked={formData.is_rented}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                  />
                  <span className="ml-2 text-sm text-foreground">Is Rented</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Unit Types */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-card-foreground">Unit Types</h4>
              <p className="text-sm text-muted-foreground">
                {formData.unit_types.length > 0 ? `${formData.unit_types.length} units generated` : 'Enter Total Units above to auto-generate'}
              </p>
            </div>
            {formData.unit_types.length > 0 && (
              <p className="text-xs text-muted-foreground mb-4">
                💡 Click the edit button to modify any unit type. You can change the type, size, or count.
              </p>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Unit Type (e.g., 2 Bedroom)"
                  value={newUnitType.type}
                  onChange={(e) => setNewUnitType(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <input
                  type="text"
                  placeholder="Size (e.g., 1200 sq ft)"
                  value={newUnitType.size}
                  onChange={(e) => setNewUnitType(prev => ({ ...prev, size: e.target.value }))}
                  className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <input
                  type="text"
                  placeholder="Count (e.g., 1)"
                  value={newUnitType.count}
                  onChange={(e) => setNewUnitType(prev => ({ ...prev, count: e.target.value }))}
                  className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <Button type="button" onClick={addUnitType} className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </Button>
              </div>
              {Array.isArray(formData.unit_types) && formData.unit_types.map((unit, index) => (
                <div key={index} className="p-3 bg-accent rounded-lg">
                  {editingUnitIndex === index ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Unit Type (e.g., 2 Bedroom)"
                          value={editingUnit.type}
                          onChange={(e) => setEditingUnit(prev => ({ ...prev, type: e.target.value }))}
                          className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                        />
                        <input
                          type="text"
                          placeholder="Size (e.g., 1200 sq ft)"
                          value={editingUnit.size}
                          onChange={(e) => setEditingUnit(prev => ({ ...prev, size: e.target.value }))}
                          className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                        />
                        <input
                          type="text"
                          placeholder="Count (e.g., 1)"
                          value={editingUnit.count}
                          onChange={(e) => setEditingUnit(prev => ({ ...prev, count: e.target.value }))}
                          className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          onClick={saveUnitType}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditUnitType}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        <span className="font-medium">{unit.type}</span>
                        <span className="text-muted-foreground">{unit.size}</span>
                        <span className="text-primary">Count: {unit.count}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editUnitType(index)}
                          className="text-primary hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeUnitType(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Features */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4">Features (optional)</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add property features like modern architecture, energy efficiency, smart home features, etc. This field is optional.
            </p>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <Button type="button" onClick={addFeature} className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(formData.features) && formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-primary hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Amenities */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4">Amenities (optional)</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add property amenities like swimming pool, gym, parking, security, etc. This field is optional.
            </p>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add an amenity"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <Button type="button" onClick={addAmenity} className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(formData.amenities) && formData.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <span>{amenity}</span>
                    <button
                      type="button"
                      onClick={() => removeAmenity(index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Documents */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-card-foreground">Documents *</h4>
              <span className="text-sm text-muted-foreground">
                {formData.documents.length} document{formData.documents.length !== 1 ? 's' : ''} added
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Add important property documents like approval letters, floor plans, legal documents, etc.
            </p>
            {formData.documents.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ At least one document is required to save the property.
                </p>
              </div>
            )}
            <div className="space-y-4">
              {/* File Upload Option */}
              <div className="mb-4 p-4 bg-accent rounded-lg border border-border">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Document File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={documentFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                    onChange={handleDocumentFileUpload}
                    className="hidden"
                    id="document-file-upload"
                    disabled={uploadingDocument}
                  />
                  <label
                    htmlFor="document-file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-primary bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingDocument ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading to Supabase...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File (Supabase)
                      </>
                    )}
                  </label>
                  <span className="text-sm text-muted-foreground">
                    Supported: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX (Max 10MB) - Stored in Supabase
                  </span>
                </div>
              </div>

              {/* Manual URL Entry */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Document Name"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <input
                  type="url"
                  placeholder="Document URL (or upload file above)"
                  value={newDocument.url}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, url: e.target.value }))}
                  className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <select
                  value={newDocument.type}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Select Type</option>
                  <option value="brochure">Brochure</option>
                  <option value="floor-plan">Floor Plan</option>
                  <option value="legal">Legal Document</option>
                  <option value="other">Other</option>
                </select>
                <Button 
                  type="button" 
                  onClick={addDocument} 
                  className="flex items-center justify-center space-x-2"
                  disabled={uploadingDocument}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </Button>
              </div>
              {Array.isArray(formData.documents) && formData.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex space-x-4">
                    <span className="font-medium">{doc.name}</span>
                    <span className="text-muted-foreground">{doc.type}</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-blue-800">
                      View Document
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDocument(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Property Features */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4">Property Features (optional)</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add specific property features like premium finishes, high ceilings, balcony access, etc. This field is optional.
            </p>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a property feature"
                  value={newPropertyFeature}
                  onChange={(e) => setNewPropertyFeature(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <Button type="button" onClick={addPropertyFeature} className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(formData.property_features) && formData.property_features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => removePropertyFeature(index)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4">Images</h4>
            <div className="space-y-4">
              {/* File Upload Option */}
              <div className="mb-4 p-4 bg-accent rounded-lg border border-border">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Image File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                    id="image-file-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image-file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-primary bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </>
                    )}
                  </label>
                  <span className="text-sm text-muted-foreground">
                    Supported: JPG, PNG, GIF, WEBP, SVG (Max 10MB)
                  </span>
                </div>
              </div>

              {/* Manual URL Entry or Upload Result */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="url"
                  placeholder="Image URL (auto-filled after upload or enter manually)"
                  value={newImage.url}
                  onChange={(e) => setNewImage(prev => ({ ...prev, url: e.target.value }))}
                  className="px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring md:col-span-2"
                />
                <Button 
                  type="button" 
                  onClick={addImage} 
                  className="flex items-center justify-center space-x-2"
                  disabled={uploadingImage || !newImage.url}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Image</span>
                </Button>
              </div>
              {newImage.url && (
                <p className="text-sm text-muted-foreground">
                  ✅ Image URL ready. Click "Add Image" to add it to the property.
                </p>
              )}
              {formData.images && formData.images.length > 0 ? (
                formData.images.map((imageUrl, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex space-x-4 items-center">
                      <span className="font-medium text-sm">Image {index + 1}</span>
                      <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:text-blue-800 text-sm truncate max-w-md"
                      >
                        {imageUrl}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No images added yet. Upload images above.</p>
              )}
            </div>
          </Card>

          {/* SEO Information */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4">SEO Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={seoData.title}
                  onChange={(e) => setSeoData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  SEO Keywords
                </label>
                <input
                  type="text"
                  value={seoData.keywords}
                  onChange={(e) => setSeoData(prev => ({ ...prev, keywords: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  SEO Description
                </label>
                <textarea
                  value={seoData.description}
                  onChange={(e) => setSeoData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>
          </Card>

          {/* Status and Visibility */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Status and Visibility
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-card text-card-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                    />
                    <span className="ml-2 text-sm text-foreground">Active Property</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                    />
                    <span className="ml-2 text-sm text-foreground">Featured Property</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-between pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={fillRandomValues}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Fill Random Values</span>
              </Button>
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : (property ? 'Update Property' : 'Create Property')}</span>
              </Button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default PropertyForm;
