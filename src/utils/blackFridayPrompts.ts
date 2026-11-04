/**
 * blackFridayPrompts.ts
 * Prompts mestres de Inteligência Artificial para gerar imagens publicitárias
 * no estilo oficial da campanha "Black das Blacks Consórcio Magalu" 2026.
 * 
 * Regra de Segmentação de Veículos:
 * - De 18 mil a 39 mil: Moto
 * - De 70 mil a 179 mil: Carro / SUV
 * - Acima de 180 mil: Caminhonete / Picape 4x4
 * 
 * Compatível com: Midjourney v6.1, Flux.1 Pro, DALL-E 3, Stable Diffusion XL.
 */

export interface BlackFridayPromptItem {
  id: string;
  categoria: string;
  faixaSugerida?: string;
  titulo: string;
  promptIngles: string;
  promptPortugues: string;
  negativePrompt: string;
  parametrosRecomendados: {
    aspectRatioStory: string;
    aspectRatioFeed: string;
    version: string;
    stylize: string;
  };
  paletaCores: string[];
  detalhesTecnicos: string;
}

export const BLACK_FRIDAY_PROMPTS: Record<string, BlackFridayPromptItem> = {
  moto: {
    id: "moto",
    categoria: "moto",
    faixaSugerida: "R$ 18.000 a R$ 39.000 (até R$ 69k)",
    titulo: "🏍️ Moto (18 a 39 Mil) - Sportbike Wireframe",
    promptIngles: "Commercial advertising key visual for Consórcio Magalu Black Friday campaign 'Black das Blacks'. A high-performance black naked sport motorcycle angled dynamically on dark reflective wet ground. The engine, frame, and rear section are enveloped in glowing 3D holographic wireframe laser lines in radiant magma orange (#ff6a00) and electric cyan (#00f0ff), with neon smoke trails and dynamic embers. Dark industrial studio background with volumetric rim lighting, ultra-sharp detail, 8k photography --ar 9:16 --v 6.1 --stylize 250",
    promptPortugues: "Imagem publicitária para a Black das Blacks Consórcio Magalu. Uma moto esportiva naked preta posicionada dinamicamente no chão molhado refletivo. Motor, chassi e cauda envolvidos por malhas 3D de laser holográfico néon laranja magma e ciano elétrico, com fumaça e brasas. Fundo de estúdio escuro, nitidez máxima 8k.",
    negativePrompt: "text, watermark, deformed bike, extra wheels, missing parts, blur, painting, low quality",
    parametrosRecomendados: {
      aspectRatioStory: "--ar 9:16",
      aspectRatioFeed: "--ar 1:1",
      version: "--v 6.1",
      stylize: "--stylize 250",
    },
    paletaCores: ["#020617 (Studio Black)", "#FF6A00 (Magma Ember)", "#00F0FF (Electric Cyan)", "#475569 (Gunmetal Grey)"],
    detalhesTecnicos: "Enquadramento dinâmico com iluminação de aro (rim light) destacando a agilidade e a facilidade de conquista."
  },

  veiculo: {
    id: "veiculo",
    categoria: "veiculo",
    faixaSugerida: "R$ 70.000 a R$ 179.000",
    titulo: "🚗 Carro / SUV (70 a 179 Mil) - Cybernetic SUV",
    promptIngles: "Commercial advertising key visual for Consórcio Magalu Black Friday campaign 'Black das Blacks'. A sleek modern compact SUV parked on a dark wet asphalt road at night. The rear half and wheels of the car transform into a glowing holographic cybernetic wireframe mesh with intense neon orange (#ff5500) and electric cyan (#00e5ff) laser lines, surrounded by sparks and floating digital embers. Dramatic volumetric headlights cutting through mist, cinematic studio low-angle shot, 8k resolution, Unreal Engine 5 render --ar 9:16 --v 6.1 --stylize 250",
    promptPortugues: "Imagem publicitária da campanha Black das Blacks Consórcio Magalu. Um SUV moderno compacto sobre asfalto escuro e molhado à noite. A metade traseira e as rodas se transformam em uma malha de arame 3D cibernética com linhas de laser laranja néon e azul ciano, com faíscas e partículas digitais. Faróis volumétricos, ângulo baixo cinematográfico, render 8k.",
    negativePrompt: "text, watermark, logo, deformed car, bad wheels, oversaturated, blur, sketch, low quality",
    parametrosRecomendados: {
      aspectRatioStory: "--ar 9:16",
      aspectRatioFeed: "--ar 1:1",
      version: "--v 6.1",
      stylize: "--stylize 250",
    },
    paletaCores: ["#030712 (Dark Night)", "#FF5500 (Neon Orange)", "#00E5FF (Cyan Laser)", "#F8FAFC (Headlight White)"],
    detalhesTecnicos: "Foco nos reflexos molhados do asfalto e na transição gradual da lataria sólida para a estrutura holográfica de engenharia 3D."
  },

  caminhonete: {
    id: "caminhonete",
    categoria: "caminhonete",
    faixaSugerida: "Acima de R$ 180.000",
    titulo: "🛻 Caminhonete 4x4 (Acima de 180 Mil) - Rugged Pickup",
    promptIngles: "Commercial advertising key visual for Consórcio Magalu Black Friday campaign 'Black das Blacks'. A rugged luxury modern 4x4 pickup truck parked on dark wet asphalt at night. The rear cabin and bed of the truck dissolve into an intricate 3D holographic laser wireframe grid glowing in vibrant magma orange (#ff5e00) and electric cyan (#00e5ff), with volumetric LED headlights cutting through nocturnal mist, digital embers and sharp ray-traced reflections, 8k commercial photography --ar 9:16 --v 6.1 --stylize 250",
    promptPortugues: "Imagem publicitária da Black das Blacks Consórcio Magalu. Uma caminhonete 4x4 imponente e moderna estacionada em asfalto molhado à noite. A caçamba e parte traseira se desintegram em uma grade de arame 3D holográfica com lasers néon laranja magma e ciano elétrico, reflexos na pista e luzes de LED, 8k.",
    negativePrompt: "text, watermark, deformed truck, crooked wheels, low resolution, toy vehicle, blur",
    parametrosRecomendados: {
      aspectRatioStory: "--ar 9:16",
      aspectRatioFeed: "--ar 1:1",
      version: "--v 6.1",
      stylize: "--stylize 250",
    },
    paletaCores: ["#030712 (Deep Night)", "#FF5E00 (Magma Orange)", "#00E5FF (Electric Cyan)", "#64748B (Slate Steel)"],
    detalhesTecnicos: "Estética agressiva e premium que atende clientes do agronegócio, frotistas e famílias que buscam picapes de médio/grande porte."
  },

  imovel: {
    id: "imovel",
    categoria: "imovel",
    faixaSugerida: "R$ 360.000 a R$ 700.000+",
    titulo: "🏠 Imóvel & Arquitetura - Luxury House Blueprint",
    promptIngles: "Commercial advertising key visual for Consórcio Magalu Black Friday campaign, titled 'Black das Blacks'. A luxurious modern architectural two-story villa with an infinity pool and illuminated glass facade at dusk. The right half of the house transitions seamlessly into a glowing holographic 3D laser wireframe blueprint, featuring sharp glowing cyan (#00d2ff) and magma orange (#ff6600) structural polyhedral lines. Tropical palm trees in dark silhouette, wet driveway reflecting neon light trails. Dark obsidian nocturnal sky with atmospheric mist. Photorealistic, 8k, ray-traced, octane render, architectural photography --ar 9:16 --v 6.1 --stylize 250",
    promptPortugues: "Imagem publicitária oficial da campanha Black das Blacks Consórcio Magalu. Uma mansão moderna com piscina de borda infinita e fachada de vidro ao entardecer. Metade da casa se transforma em uma malha 3D de wireframe holográfico luminoso com lasers ciano e laranja magma brilhantes. Pista molhada refletindo néon, céu noturno escuro, iluminação cinematográfica 8k.",
    negativePrompt: "lowres, text, watermark, bad architecture, deformed, blurry, cartoon, oversaturated, amateur photography",
    parametrosRecomendados: {
      aspectRatioStory: "--ar 9:16",
      aspectRatioFeed: "--ar 1:1",
      version: "--v 6.1",
      stylize: "--stylize 250",
    },
    paletaCores: ["#020617 (Obsidian Dark)", "#00D2FF (Electric Cyan)", "#FF6600 (Magma Orange)", "#FFFFFF (Pure Glow)"],
    detalhesTecnicos: "O contraste entre a fotografia fotorrealista e o wireframe 3D acentua o conceito de 'planejamento e realização'."
  },

  pesados: {
    id: "pesados",
    categoria: "pesados",
    faixaSugerida: "Frotas e Pesados",
    titulo: "🚛 Caminhões & Frotas - Semi-Truck Grid",
    promptIngles: "Commercial advertising key visual for Consórcio Magalu Black Friday campaign 'Black das Blacks'. A modern aerodynamic heavy-duty semi-truck on a wet highway under starry nocturnal sky. The trailer and cabin section morph into an intricate holographic 3D neon wireframe glowing in cyan (#00e5ff) and amber (#ff7a00) laser grids with digital particles. Cinematic wide low-angle, commercial vehicle photography, 8k, photorealistic --ar 9:16 --v 6.1 --stylize 250",
    promptPortugues: "Imagem de anúncio Black das Blacks Consórcio Magalu. Caminhão pesado aerodinâmico moderno em rodovia molhada sob céu estrelado. Carreta e cabine se transformando em malha tridimensional holográfica de néon ciano e âmbar, ângulo baixo heroico, 8k.",
    negativePrompt: "text, watermark, deformed cabin, crooked lines, blurry, toy truck, low quality",
    parametrosRecomendados: {
      aspectRatioStory: "--ar 9:16",
      aspectRatioFeed: "--ar 1:1",
      version: "--v 6.1",
      stylize: "--stylize 250",
    },
    paletaCores: ["#040B16 (Midnight Blue)", "#00E5FF (Cyan Grid)", "#FF7A00 (Amber Glow)", "#CBD5E1 (Chrome)"],
    detalhesTecnicos: "Enquadramento baixo transmitindo solidez e imponência para frotistas e transportadores autônomos."
  },

  agro: {
    id: "agro",
    categoria: "agro",
    faixaSugerida: "Maquinário Agrícola",
    titulo: "🌾 Agro & Colheitadeira - Combine Blueprint",
    promptIngles: "Commercial advertising key visual for Consórcio Magalu Black Friday campaign 'Black das Blacks'. A giant modern high-tech grain combine harvester in an agricultural landscape at night. Half of the combine harvester dissolves into glowing 3D cyan and orange neon blueprint wireframes, illuminating the ground with light trails. Dramatic epic atmosphere, cinematic commercial lighting, 8k --ar 9:16 --v 6.1 --stylize 250",
    promptPortugues: "Colheitadeira moderna de alta tecnologia no campo à noite para a campanha Black das Blacks Consórcio Magalu. Metade da máquina se dissolvendo em wireframes de blueprint 3D neon ciano e laranja, iluminação épica e comercial 8k.",
    negativePrompt: "text, watermark, distorted harvester, bad proportions, blur, painting",
    parametrosRecomendados: {
      aspectRatioStory: "--ar 9:16",
      aspectRatioFeed: "--ar 1:1",
      version: "--v 6.1",
      stylize: "--stylize 250",
    },
    paletaCores: ["#020617 (Night Field)", "#10B981 (Agro Green)", "#00E5FF (Laser Cyan)", "#FF6600 (Neon Orange)"],
    detalhesTecnicos: "Combina a potência da tecnologia do agronegócio com o conceito de inovação financeira."
  },

  master: {
    id: "master",
    categoria: "geral",
    faixaSugerida: "Campanha Completa",
    titulo: "⭐ Master Multi-Segmento - Black das Blacks",
    promptIngles: "Epic advertising master visual for Consórcio Magalu Black Friday campaign 'Black das Blacks'. A modern luxury illuminated house, sleek electric car, private jet taking off in background, sports motorcycle, washing machine, and refrigerator all gathered on wet reflective asphalt with neon light streaks. Majestic starry cosmic night sky, intense 3D glowing neon cyan and magenta backlights, dramatic commercial cinema lighting, photorealistic 8k --ar 9:16 --v 6.1 --stylize 300",
    promptPortugues: "Key visual master oficial da Black das Blacks Consórcio Magalu. Casa moderna de luxo, carro elétrico, avião decolando, moto esportiva e eletrodomésticos reunidos em piso asfáltico molhado com reflexos e raios de néon ciano e magenta. Céu cósmico estrelado, fotografia comercial cinematográfica 8k.",
    negativePrompt: "ugly, text, blurry, watermark, bad lighting, low resolution, amateur",
    parametrosRecomendados: {
      aspectRatioStory: "--ar 9:16",
      aspectRatioFeed: "--ar 1:1",
      version: "--v 6.1",
      stylize: "--stylize 300",
    },
    paletaCores: ["#050814 (Cosmic Deep)", "#00E5FF (Neon Cyan)", "#EC4899 (Neon Pink)", "#EAB308 (Warm Light)"],
    detalhesTecnicos: "O cartaz principal que sintetiza todas as modalidades de consórcio em uma única visão grandiosa."
  }
};
