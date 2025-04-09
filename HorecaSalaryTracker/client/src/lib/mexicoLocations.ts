// Mexico Governorates and their cities
export const mexicoGovernorates = [
  { value: "mexico_city", label: "Mexico City" },
  { value: "monterrey", label: "Monterrey" },
  { value: "guadalajara", label: "Guadalajara" },
  { value: "puebla", label: "Puebla" },
  { value: "queretaro", label: "Querétaro" },
  { value: "cancun", label: "Cancún" },
  { value: "tijuana", label: "Tijuana" },
  { value: "leon", label: "León" },
  { value: "merida", label: "Mérida" }
];

// Cities by governorate
export const citiesByGovernorate: Record<string, Array<{ value: string, label: string }>> = {
  mexico_city: [
    { value: "roma", label: "Roma" },
    { value: "condesa", label: "Condesa" },
    { value: "polanco", label: "Polanco" },
    { value: "santa_fe", label: "Santa Fe" },
    { value: "reforma", label: "Reforma" },
    { value: "coyoacan", label: "Coyoacán" },
    { value: "centro_historico", label: "Centro Histórico" }
  ],
  monterrey: [
    { value: "san_pedro", label: "San Pedro Garza García" },
    { value: "centro", label: "Centro" },
    { value: "valle_oriente", label: "Valle Oriente" },
    { value: "contry", label: "Contry" },
    { value: "cumbres", label: "Cumbres" }
  ],
  guadalajara: [
    { value: "zapopan", label: "Zapopan" },
    { value: "tlaquepaque", label: "Tlaquepaque" },
    { value: "chapultepec", label: "Chapultepec" },
    { value: "centro", label: "Centro" },
    { value: "providencia", label: "Providencia" }
  ],
  puebla: [
    { value: "angelopolis", label: "Angelópolis" },
    { value: "centro", label: "Centro" },
    { value: "cholula", label: "Cholula" },
    { value: "recta", label: "La Recta" }
  ],
  queretaro: [
    { value: "centro", label: "Centro" },
    { value: "jurica", label: "Jurica" },
    { value: "juriquilla", label: "Juriquilla" },
    { value: "alamos", label: "Álamos" }
  ],
  cancun: [
    { value: "zona_hotelera", label: "Zona Hotelera" },
    { value: "centro", label: "Centro" },
    { value: "puerto_morelos", label: "Puerto Morelos" },
    { value: "playa_del_carmen", label: "Playa del Carmen" }
  ],
  tijuana: [
    { value: "zona_rio", label: "Zona Río" },
    { value: "centro", label: "Centro" },
    { value: "playas", label: "Playas de Tijuana" },
    { value: "chapultepec", label: "Chapultepec" }
  ],
  leon: [
    { value: "centro", label: "Centro" },
    { value: "campestre", label: "Campestre" },
    { value: "industrial", label: "Zona Industrial" }
  ],
  merida: [
    { value: "centro", label: "Centro" },
    { value: "montejo", label: "Paseo de Montejo" },
    { value: "norte", label: "Norte" },
    { value: "cholul", label: "Cholul" }
  ]
};