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
  {
    id: 'azul',
    label: 'Azul',
    solid: '#2563eb',
    gradient: 'linear-gradient(140deg, #3b82f6 0%, #1e3a8a 100%)',
  },
  {
    id: 'azul-claro',
    label: 'Azul claro',
    solid: '#38bdf8',
    gradient: 'linear-gradient(140deg, #7dd3fc 0%, #2563eb 100%)',
  },
  {
    id: 'roxo',
    label: 'Roxo',
    solid: '#7c3aed',
    gradient: 'linear-gradient(140deg, #8b5cf6 0%, #4c1d95 100%)',
  },
  {
    id: 'violeta',
    label: 'Violeta',
    solid: '#a855f7',
    gradient: 'linear-gradient(140deg, #c084fc 0%, #86198f 100%)',
  },
  {
    id: 'vermelho',
    label: 'Vermelho',
    solid: '#dc2626',
    gradient: 'linear-gradient(140deg, #ef4444 0%, #7f1d1d 100%)',
  },
  {
    id: 'rosa',
    label: 'Rosa',
    solid: '#db2777',
    gradient: 'linear-gradient(140deg, #ec4899 0%, #831843 100%)',
  },
  {
    id: 'laranja-queimado',
    label: 'Laranja queimado',
    solid: '#e8491d',
    gradient: 'linear-gradient(140deg, #ff6b35 0%, #c23616 100%)',
  },
];

const DEFAULT_PRESET = ACCENT_PRESETS[0];

export function getAccentPreset(id: string): AccentPreset {
  return ACCENT_PRESETS.find((preset) => preset.id === id) ?? DEFAULT_PRESET;
}
