// src/js/api.js
// ==========================================
// SUPABASE API LAYER (DATA ACCESS)
// ==========================================

import { getSupabase } from './supabase.js';

const sb = getSupabase();

// Helper to handle Supabase errors consistently
const handleResponse = (response) => {
  if (response.error) {
    console.error('Supabase Error:', response.error.message);
    throw new Error(response.error.message);
  }
  return response.data;
};

// ==========================================
// 1. CORE DATA (Categories, Cities)
// ==========================================

export const getCategories = async () => {
  const { data, error } = await sb
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  return handleResponse({ data, error });
};

export const getCities = async () => {
  const { data, error } = await sb
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  return handleResponse({ data, error });
};

// ==========================================
// 2. DOCTORS & CHAMBERS
// ==========================================

export const getDoctors = async ({ 
  specialty, 
  city, 
  limit = 20, 
  offset = 0, 
  featured = false } = {}) => {
  let query = sb
    .from('doctors')
    .select('*, categories(name_bn, slug)')
    .eq('verification_status', 'verified')
    .eq('is_available', true);

  if (specialty) query = query.eq('specialty', specialty);
  if (city) {
    // Note: Filtering by city requires joining chambers or storing city in doctors.
    // For performance, we assume doctors have a primary city or we filter post-fetch.
    // In this schema, we'll rely on the search_keywords or a direct city column if added.
    // Let's use a generic text search on city for now, or rely on chambers.
  }
  if (featured) query = query.eq('is_featured', true).order('featured_priority', { ascending: false });
  else query = query.order('rating_avg', { ascending: false });

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  return handleResponse({ data, error });
};

export const getDoctorBySlug = async (slug) => {
  const { data, error } = await sb
    .from('doctors')
    .select('*, categories(name_bn, name_en, slug)')
    .eq('slug', slug)
    .eq('verification_status', 'verified')
    .single();
  
  if (error && error.code === 'PGRST116') return null; // Not found
  return handleResponse({ data, error });
};

export const getChambersByDoctor = async (doctorId) => {
  const { data, error } = await sb
    .from('chambers')
    .select('*, cities(name_bn)')
    .eq('doctor_id', doctorId)
    .order('is_primary', { ascending: false })
    .order('display_order', { ascending: true });
  return handleResponse({ data, error });
};

// ==========================================
// 3. HOSPITALS
// ==========================================

export const getHospitals = async ({ city, type, limit = 20, offset = 0 } = {}) => {  let query = sb
    .from('hospitals')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('rating_avg', { ascending: false });

  if (city) query = query.eq('city', city);
  if (type) query = query.eq('type', type);

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  return handleResponse({ data, error });
};

export const getHospitalBySlug = async (slug) => {
  const { data, error } = await sb
    .from('hospitals')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error && error.code === 'PGRST116') return null;
  return handleResponse({ data, error });
};

// ==========================================
// 4. SYMPTOMS
// ==========================================

export const getSymptoms = async () => {
  const { data, error } = await sb
    .from('symptoms')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  return handleResponse({ data, error });
};

export const getSymptomBySlug = async (slug) => {
  const { data, error } = await sb
    .from('symptoms')
    .select('*, symptom_specialty_mapping(specialty, priority, categories(name_bn, slug))')
    .eq('slug', slug)
    .single();
  
  if (error && error.code === 'PGRST116') return null;
  return handleResponse({ data, error });
};
// ==========================================
// 5. REVIEWS
// ==========================================

export const getReviewsByDoctor = async (doctorId) => {
  const { data, error } = await sb
    .from('reviews')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  return handleResponse({ data, error });
};

export const submitReview = async (reviewData) => {
  const { data, error } = await sb
    .from('reviews')
    .insert([{ ...reviewData, status: 'pending' }])
    .select();
  return handleResponse({ data, error });
};

// ==========================================
// 6. ADS & EMERGENCY
// ==========================================

export const getAds = async (placement) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await sb
    .from('ads')
    .select('*')
    .eq('placement', placement)
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('priority', { ascending: false });
  return handleResponse({ data, error });
};

export const getEmergencyContacts = async (city = null) => {
  let query = sb
    .from('emergency_contacts')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (city) {
    query = query.or(`city.eq.${city},city.is.null`);
  }
  const { data, error } = await query;
  return handleResponse({ data, error });
};

// ==========================================
// 7. ANALYTICS (Fire and forget)
// ==========================================

export const logEvent = async (eventType, entityType, entityId, extra = {}) => {
  try {
    await sb.from('analytics_events').insert([{
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      ...extra
    }]);
  } catch (e) {
    // Silently fail analytics to not block UI
    console.warn('Analytics log failed', e);
  }
};
