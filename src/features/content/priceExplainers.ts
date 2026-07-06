export interface PriceExplainer {
  title: string
  paragraphs: string[]
}

// Textos fijos por etiqueta de serie — las etiquetas deben coincidir con
// price_items.label tal como llegan de Supabase.
const EXPLAINERS: Record<string, PriceExplainer> = {
  'Azúcar crudo NY No.11': {
    title: '¿Qué es el azúcar crudo NY No.11?',
    paragraphs: [
      'Es el contrato de futuros de azúcar crudo de caña que se negocia en la bolsa ICE de Nueva York. Se considera la referencia mundial para el comercio de azúcar crudo y marca el precio base de las exportaciones centroamericanas al mercado internacional.',
      'Se cotiza en centavos de dólar por libra (¢/lb). Como referencia rápida: 1 ¢/lb equivale a unos 22.05 USD por tonelada métrica.',
    ],
  },
  'Azúcar refinada': {
    title: '¿Qué es el azúcar refinada (ICE No.5)?',
    paragraphs: [
      'Corresponde al contrato White Sugar No.5 de la bolsa ICE de Londres, la referencia mundial para el azúcar blanca refinada. Se cotiza en dólares por tonelada métrica (USD/t).',
      'La diferencia entre este precio y el del crudo No.11 se conoce como prima de refinación (white premium) e indica el margen que paga el mercado por refinar el azúcar.',
    ],
  },
}

export function getPriceExplainer(label: string): PriceExplainer | undefined {
  return EXPLAINERS[label]
}
