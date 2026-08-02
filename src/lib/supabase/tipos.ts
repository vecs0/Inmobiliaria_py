import { properties, agents, cities as dataCities, propertyTypes as dataPropertyTypes } from '../data';

export type PropertyType = typeof dataPropertyTypes[number];
export type City = typeof dataCities[number];
export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'rented';

export interface Property {
  id: string;
  title: string;
  location: string;
  neighborhood: string;
  city: string;
  price: number;
  currency: "USD" | "PYG";
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  parking: number;
  featured: boolean;
  tag?: string;
  image: string;
  images: string[];
  description: string;
  amenities: string[];
  agentId: string;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
  yearBuilt?: number;
  floor?: number;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'agent' | 'user';
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Agent {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  photo: string;
  title: string;
  isActive: boolean;
}

export interface DashboardMetrics {
  totalProperties: number;
  totalUsers: number;
  totalAgents: number;
  pendingProperties: number;
  featuredProperties: number;
  soldPropertiesMonth: number;
  rentedPropertiesMonth: number;
  revenueMonth: number;
}
