import {
  Anton,
  Archivo_Black,
  Bebas_Neue,
  Fraunces,
  Playfair_Display,
  Space_Grotesk,
} from 'next/font/google';
import localFont from 'next/font/local';

// Coleção fixa de fontes de exibição pro título/eyebrow da página pública do
// evento — cada uma carregada uma única vez aqui (next/font exige import
// estático em build time, não dá pra carregar por string dinamicamente).
// A página do evento aplica todas as variáveis no wrapper e só ativa a
// escolhida via --font-display, então trocar no admin não pede novo import.
//
// Amagro é a fonte de marca real do Réveillon Carneiros — arquivo trazido
// de mobile-carneiros/src/assets/fonts/Amagro.ttf (Fabio Servolo & Raphael
// Alegbeleye, 2021), não do Google Fonts. Fraunces era só uma aproximação
// escolhida no port pro app-carneiros; agora que a fonte real está
// disponível, ela entra como preset e é o default do álbum do Réveillon.
const amagro = localFont({
  src: './fonts/Amagro.ttf',
  variable: '--font-opt-amagro',
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-opt-fraunces',
  display: 'swap',
});
const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-opt-anton',
  display: 'swap',
});
const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-opt-bebas',
  display: 'swap',
});
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-opt-playfair',
  display: 'swap',
});
const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-opt-archivo',
  display: 'swap',
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-opt-space',
  display: 'swap',
});

export type FontPreset = {
  id: string;
  label: string;
  variable: string;
  cssVar: string;
};

export const FONT_PRESETS: FontPreset[] = [
  { id: 'fraunces', label: 'Fraunces', variable: fraunces.variable, cssVar: '--font-opt-fraunces' },
  {
    id: 'amagro',
    label: 'Amagro',
    variable: amagro.variable,
    cssVar: '--font-opt-amagro',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    variable: playfairDisplay.variable,
    cssVar: '--font-opt-playfair',
  },
  { id: 'anton', label: 'Anton', variable: anton.variable, cssVar: '--font-opt-anton' },
  { id: 'bebas', label: 'Bebas Neue', variable: bebasNeue.variable, cssVar: '--font-opt-bebas' },
  {
    id: 'archivo',
    label: 'Archivo Black',
    variable: archivoBlack.variable,
    cssVar: '--font-opt-archivo',
  },
  {
    id: 'space',
    label: 'Space Grotesk',
    variable: spaceGrotesk.variable,
    cssVar: '--font-opt-space',
  },
];

// Fraunces é o default genérico (Google Fonts, sem restrição de licença) —
// Amagro é exclusiva da marca Réveillon Carneiros, não faz sentido como
// fallback pra álbuns de outros eventos.
const DEFAULT_FONT = FONT_PRESETS[0];

export function getFontPreset(id: string): FontPreset {
  return FONT_PRESETS.find((font) => font.id === id) ?? DEFAULT_FONT;
}

// Todas as variáveis juntas, pra aplicar no wrapper (evento e admin, pro
// preview no formulário) — só define os --font-opt-*, não ativa nenhuma.
export const ALL_FONT_VARIABLES = FONT_PRESETS.map((font) => font.variable).join(' ');
