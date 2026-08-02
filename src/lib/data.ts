// src/lib/data.ts
// Property data for InmobiliariaPY

export interface Property {
  id: string;
  title: string;
  location: string;
  neighborhood: string;
  city: string;
  price: number;
  currency: "USD" | "PYG";
  type: "Casa" | "Apartamento" | "Penthouse" | "Terreno" | "Oficina";
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
  agent: Agent;
  yearBuilt?: number;
  floor?: number;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  photo: string;
  title: string;
}

export const agents: Agent[] = [
  {
    id: "1",
    name: "Lic. Carolina Mendez",
    phone: "+595 981 123 456",
    whatsapp: "595981123456",
    email: "carolina@inmobiliariapy.com",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    title: "Gerente de Propiedades",
  },
  {
    id: "2",
    name: "Dr. Rodrigo Villalba",
    phone: "+595 982 234 567",
    whatsapp: "595982234567",
    email: "rodrigo@inmobiliariapy.com",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    title: "Asesor Senior",
  },
  {
    id: "3",
    name: "Arq. Valentina Torres",
    phone: "+595 983 345 678",
    whatsapp: "595983345678",
    email: "valentina@inmobiliariapy.com",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    title: "Directora Comercial",
  },
];

export const properties: Property[] = [
  {
    id: "1",
    title: "Penthouse Ícono en Torre Patrimonio",
    location: "Av. Santa Teresa, Asunción",
    neighborhood: "Villa Morra",
    city: "Asunción",
    price: 850000,
    currency: "USD",
    type: "Penthouse",
    bedrooms: 4,
    bathrooms: 5,
    sqm: 480,
    parking: 3,
    featured: true,
    tag: "Exclusivo",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=600&fit=crop",
    ],
    description: "Majestuoso penthouse de doble planta con vistas panorámicas a 360° de Asunción. Techos de doble altura, materiales de importación y acabados únicos que definen el máximo estándar de lujo en Paraguay. Incluye terraza privada con jacuzzi climatizado y jardín vertical.",
    amenities: ["Piscina privada", "Gimnasio", "Concierge 24/7", "Terraza con jacuzzi", "Smart home", "Bodega de vinos", "Sala de cine", "Cancha de paddle"],
    agent: agents[0],
    yearBuilt: 2023,
    floor: 42,
  },
  {
    id: "2",
    title: "Casa Colonial Moderna en Ñu Guazú",
    location: "Calle Cerro Corá 1500, Luque",
    neighborhood: "Ñu Guazú",
    city: "Luque",
    price: 420000,
    currency: "USD",
    type: "Casa",
    bedrooms: 5,
    bathrooms: 4,
    sqm: 650,
    parking: 4,
    featured: true,
    tag: "Nueva",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop",
    ],
    description: "Espectacular residencia de estilo colonial moderno en uno de los barrios más exclusivos de Luque. Rodeada de naturaleza exuberante, con amplios espacios interiores y exteriores diseñados para el entretenimiento y la privacidad total.",
    amenities: ["Piscina olímpica", "Quincho de lujo", "Cancha de tenis", "Jardín paisajístico", "Garage para 4 vehículos", "Generador propio", "Seguridad 24/7"],
    agent: agents[1],
    yearBuilt: 2022,
  },
  {
    id: "3",
    title: "Apartamento de Diseño en Mburucuyá",
    location: "Av. España 2000, Asunción",
    neighborhood: "Mburucuyá",
    city: "Asunción",
    price: 285000,
    currency: "USD",
    type: "Apartamento",
    bedrooms: 3,
    bathrooms: 3,
    sqm: 220,
    parking: 2,
    featured: true,
    tag: "Vista al río",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    ],
    description: "Apartamento contemporáneo con vistas privilegiadas al río Paraguay. Diseño minimalista de autor con cocina integrada, living de doble altura y terraza privada. Edificio con amenities de primer nivel.",
    amenities: ["Rooftop pool", "Coworking", "Pet friendly", "Bike storage", "Delivery room", "Sala de eventos"],
    agent: agents[2],
    yearBuilt: 2024,
    floor: 18,
  },
  {
    id: "4",
    title: "Chalet Alpino en Lago Ypacaraí",
    location: "Ruta 1 km 35, San Bernardino",
    neighborhood: "Lago Ypacaraí",
    city: "San Bernardino",
    price: 550000,
    currency: "USD",
    type: "Casa",
    bedrooms: 6,
    bathrooms: 5,
    sqm: 800,
    parking: 5,
    featured: false,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
    ],
    description: "Residencia vacacional de lujo con acceso privado al lago. Estilo alpino contemporáneo con materiales naturales premium y vistas únicas al lago Ypacaraí.",
    amenities: ["Acceso privado al lago", "Muelle propio", "Piscina temperada", "Sauna", "Helipad"],
    agent: agents[0],
  },
  {
    id: "5",
    title: "Oficinas Premium en World Trade Center",
    location: "Av. Aviadores del Chaco, Asunción",
    neighborhood: "Aviadores",
    city: "Asunción",
    price: 1200000,
    currency: "USD",
    type: "Oficina",
    bedrooms: 0,
    bathrooms: 6,
    sqm: 1200,
    parking: 12,
    featured: false,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
    ],
    description: "Planta entera en el reconocido World Trade Center Asunción. Distribución flexible de primer nivel con vistas panorámicas y tecnología de vanguardia.",
    amenities: ["Sky lobby privado", "Sala de directorio", "Server room", "Cafetería", "Estacionamiento VIP"],
    agent: agents[1],
    yearBuilt: 2021,
    floor: 22,
  },
  {
    id: "6",
    title: "Terreno Premium en Lambaré",
    location: "Barrio Ycuá Bolaños, Lambaré",
    neighborhood: "Ycuá Bolaños",
    city: "Lambaré",
    price: 180000,
    currency: "USD",
    type: "Terreno",
    bedrooms: 0,
    bathrooms: 0,
    sqm: 2500,
    parking: 0,
    featured: false,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop",
    ],
    description: "Terreno plano con todos los servicios en urbanización cerrada de alta gama. Ideal para construcción de residencia de lujo o desarrollo inmobiliario.",
    amenities: ["Urbanización privada", "Agua y luz", "Internet fibra", "Seguridad 24/7"],
    agent: agents[2],
  },
];

export const formatPrice = (price: number, currency: "USD" | "PYG" = "USD"): string => {
  if (currency === "USD") {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  }
  return new Intl.NumberFormat("es-PY").format(price) + " Gs.";
};

export const propertyTypes = ["Casa", "Apartamento", "Penthouse", "Terreno", "Oficina"] as const;
export const cities = ["Asunción", "Luque", "San Bernardino", "Lambaré"] as const;
