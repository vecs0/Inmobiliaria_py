-- InmobiliariaPY - Seed de datos iniciales
-- Ejecutar después del schema.sql

-- ============================================
-- AGENTS
-- ============================================
INSERT INTO agents (id, name, phone, whatsapp, email, photo, title) VALUES
  (
    '1',
    'Lic. Carolina Mendez',
    '+595 981 123 456',
    '595981123456',
    'carolina@inmobiliariapy.com',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    'Gerente de Propiedades'
  ),
  (
    '2',
    'Dr. Rodrigo Villalba',
    '+595 982 234 567',
    '595982234567',
    'rodrigo@inmobiliariapy.com',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    'Asesor Senior'
  ),
  (
    '3',
    'Arq. Valentina Torres',
    '+595 983 345 678',
    '595983345678',
    'valentina@inmobiliariapy.com',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    'Directora Comercial'
  );

-- ============================================
-- PROPERTIES
-- ============================================
INSERT INTO properties (
  id, title, location, neighborhood, city, price, currency, type,
  bedrooms, bathrooms, sqm, parking, featured, tag, image, images,
  description, amenities, agent_id, yearBuilt, floor
) VALUES
  (
    '1',
    'Penthouse Ícono en Torre Patrimonio',
    'Av. Santa Teresa, Asunción',
    'Villa Morra',
    'Asunción',
    850000,
    'USD',
    'Penthouse',
    4, 5, 480, 3,
    true,
    'Exclusivo',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=600&fit=crop'
    ],
    'Majestuoso penthouse de doble planta con vistas panorámicas a 360° de Asunción. Techos de doble altura, materiales de importación y acabados únicos que definen el máximo estándar de lujo en Paraguay. Incluye terraza privada con jacuzzi climatizado y jardín vertical.',
    ARRAY['Piscina privada', 'Gimnasio', 'Concierge 24/7', 'Terraza con jacuzzi', 'Smart home', 'Bodega de vinos', 'Sala de cine', 'Cancha de paddle'],
    '1',
    2023,
    42
  ),
  (
    '2',
    'Casa Colonial Moderna en Ñu Guazú',
    'Calle Cerro Corá 1500, Luque',
    'Ñu Guazú',
    'Luque',
    420000,
    'USD',
    'Casa',
    5, 4, 650, 4,
    true,
    'Nueva',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop'
    ],
    'Espectacular residencia de estilo colonial moderno en uno de los barrios más exclusivos de Luque. Rodeada de naturaleza exuberante, con amplios espacios interiores y exteriores diseñados para el entretenimiento y la privacidad total.',
    ARRAY['Piscina olímpica', 'Quincho de lujo', 'Cancha de tenis', 'Jardín paisajístico', 'Garage para 4 vehículos', 'Generador propio', 'Seguridad 24/7'],
    '2',
    2022,
    NULL
  ),
  (
    '3',
    'Apartamento de Diseño en Mburucuyá',
    'Av. España 2000, Asunción',
    'Mburucuyá',
    'Asunción',
    285000,
    'USD',
    'Apartamento',
    3, 3, 220, 2,
    true,
    'Vista al río',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop'
    ],
    'Apartamento contemporáneo con vistas privilegiadas al río Paraguay. Diseño minimalista de autor con cocina integrada, living de doble altura y terraza privada. Edificio con amenities de primer nivel.',
    ARRAY['Rooftop pool', 'Coworking', 'Pet friendly', 'Bike storage', 'Delivery room', 'Sala de eventos'],
    '3',
    2024,
    18
  ),
  (
    '4',
    'Chalet Alpino en Lago Ypacaraí',
    'Ruta 1 km 35, San Bernardino',
    'Lago Ypacaraí',
    'San Bernardino',
    550000,
    'USD',
    'Casa',
    6, 5, 800, 5,
    false,
    NULL,
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop'
    ],
    'Residencia vacacional de lujo con acceso privado al lago. Estilo alpino contemporáneo con materiales naturales premium y vistas únicas al lago Ypacaraí.',
    ARRAY['Acceso privado al lago', 'Muelle propio', 'Piscina temperada', 'Sauna', 'Helipad'],
    '1',
    NULL,
    NULL
  ),
  (
    '5',
    'Oficinas Premium en World Trade Center',
    'Av. Aviadores del Chaco, Asunción',
    'Aviadores',
    'Asunción',
    1200000,
    'USD',
    'Oficina',
    0, 6, 1200, 12,
    false,
    NULL,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop'
    ],
    'Planta entera en el reconocido World Trade Center Asunción. Distribución flexible de primer nivel con vistas panorámicas y tecnología de vanguardia.',
    ARRAY['Sky lobby privado', 'Sala de directorio', 'Server room', 'Cafetería', 'Estacionamiento VIP'],
    '2',
    2021,
    22
  ),
  (
    '6',
    'Terreno Premium en Lambaré',
    'Barrio Ycuá Bolaños, Lambaré',
    'Ycuá Bolaños',
    'Lambaré',
    180000,
    'USD',
    'Terreno',
    0, 0, 2500, 0,
    false,
    NULL,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    ARRAY[
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop'
    ],
    'Terreno plano con todos los servicios en urbanización cerrada de alta gama. Ideal para construcción de residencia de lujo o desarrollo inmobiliario.',
    ARRAY['Urbanización privada', 'Agua y luz', 'Internet fibra', 'Seguridad 24/7'],
    '3',
    NULL,
    NULL
  );
