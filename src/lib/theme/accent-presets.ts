// Coleção fixa de cores de destaque — porta o padrão do GradientPicker do
// bkcuradoria (apps/web/src/components/admin/GradientPicker.tsx). O admin
// escolhe um preset por id, nunca digita hex: cada preset já define a cor
// sólida (botões, texto, foco) E o degradê pronto (capa sem foto), na mesma
// família de tons do template editorial (clay/oliva/dourado/tinta).
export type AccentPreset = {
  id: string;
  label: string;
  solid: string;
  gradient: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'clay',
    label: 'Clay',
    solid: '#c0714a',
    gradient: 'linear-gradient(140deg, #c0714a 0%, #8e4a35 100%)',
  },
  {
    id: 'clay-suave',
    label: 'Clay suave',
    solid: '#d88068',
    gradient: 'linear-gradient(140deg, #d88068 0%, #c0714a 100%)',
  },
  {
    id: 'dourado',
    label: 'Dourado',
    solid: '#c9a063',
    gradient: 'linear-gradient(140deg, #c9a063 0%, #9c7943 100%)',
  },
  {
    id: 'oliva',
    label: 'Oliva',
    solid: '#6a7256',
    gradient: 'linear-gradient(140deg, #6a7256 0%, #2c3119 100%)',
  },
  {
    id: 'oliva-claro',
    label: 'Oliva claro',
    solid: '#8a9476',
    gradient: 'linear-gradient(140deg, #8a9476 0%, #4f5841 100%)',
  },
  {
    id: 'ink',
    label: 'Tinta',
    solid: '#2a2620',
    gradient: 'linear-gradient(140deg, #3d3530 0%, #14120e 100%)',
  },
  {
    id: 'sunset',
    label: 'Pôr do sol',
    solid: '#c0714a',
    gradient: 'linear-gradient(140deg, #c0714a 0%, #c9a063 100%)',
  },
  {
    id: 'noite',
    label: 'Noite',
    solid: '#2c3119',
    gradient: 'linear-gradient(140deg, #2c3119 0%, #14120e 100%)',
  },
];

const DEFAULT_PRESET = ACCENT_PRESETS[0];

export function getAccentPreset(id: string): AccentPreset {
  return ACCENT_PRESETS.find((preset) => preset.id === id) ?? DEFAULT_PRESET;
}
