// Coleção fixa de fundos pro "corpo" da página (tudo abaixo do hero) —
// mesmo espírito do accent-presets.ts: sem campo de cor livre, só presets.
// "Automático" (background: null) preserva o comportamento atual de
// dia/noite (.event-day/.event-night definem --event-bg pelo horário); os
// demais presets sobrescrevem isso com um fundo fixo (sólido ou degradê),
// não sensível a hora do dia.
export type BodyPreset = {
  id: string;
  label: string;
  swatch: string;
  background: string | null;
  // Só importa quando background != null — decide se o texto/linhas usam o
  // conjunto claro (.event-day, texto tinta) ou escuro (.event-night, texto
  // creme) por cima desse fundo. Sem isso um fundo escuro custom herdaria
  // texto escuro do modo dia e ficaria ilegível.
  mode: 'day' | 'night';
};

export const BODY_PRESETS: BodyPreset[] = [
  {
    id: 'auto',
    label: 'Automático (dia/noite)',
    swatch: 'linear-gradient(90deg, #f1ece3 50%, #2c3119 50%)',
    background: null,
    mode: 'day',
  },
  { id: 'creme', label: 'Creme', swatch: '#f1ece3', background: '#f1ece3', mode: 'day' },
  { id: 'areia', label: 'Areia', swatch: '#eae2d5', background: '#eae2d5', mode: 'day' },
  {
    id: 'oliva-escura',
    label: 'Oliva escura',
    swatch: '#2c3119',
    background: '#2c3119',
    mode: 'night',
  },
  { id: 'tinta', label: 'Tinta', swatch: '#14120e', background: '#14120e', mode: 'night' },
  {
    id: 'gradiente-por-do-sol',
    label: 'Pôr do sol',
    swatch: 'linear-gradient(180deg, #2c3119 0%, #1a1006 100%)',
    background: 'linear-gradient(180deg, #2c3119 0%, #1a1006 100%)',
    mode: 'night',
  },
  {
    id: 'gradiente-noite-azulada',
    label: 'Noite azulada',
    swatch: 'linear-gradient(180deg, #10131c 0%, #04050a 100%)',
    background: 'linear-gradient(180deg, #10131c 0%, #04050a 100%)',
    mode: 'night',
  },
  {
    id: 'gradiente-vinho',
    label: 'Vinho',
    swatch: 'linear-gradient(180deg, #2a1018 0%, #120609 100%)',
    background: 'linear-gradient(180deg, #2a1018 0%, #120609 100%)',
    mode: 'night',
  },
  { id: 'branco', label: 'Branco', swatch: '#ffffff', background: '#ffffff', mode: 'day' },
  {
    id: 'rosa-quartzo',
    label: 'Rosa quartzo',
    swatch: '#f7e2dc',
    background: '#f7e2dc',
    mode: 'day',
  },
  {
    id: 'verde-salvia',
    label: 'Verde sálvia',
    swatch: '#dfe6d5',
    background: '#dfe6d5',
    mode: 'day',
  },
  { id: 'azul-po', label: 'Azul pó', swatch: '#dde7ec', background: '#dde7ec', mode: 'day' },
  { id: 'lavanda', label: 'Lavanda', swatch: '#e8e1f0', background: '#e8e1f0', mode: 'day' },
  { id: 'preto', label: 'Preto', swatch: '#0d0d0d', background: '#0d0d0d', mode: 'night' },
  {
    id: 'azul-marinho',
    label: 'Azul marinho',
    swatch: '#0f1c3a',
    background: '#0f1c3a',
    mode: 'night',
  },
  {
    id: 'esmeralda',
    label: 'Esmeralda',
    swatch: 'linear-gradient(180deg, #0b3d2e 0%, #041a13 100%)',
    background: 'linear-gradient(180deg, #0b3d2e 0%, #041a13 100%)',
    mode: 'night',
  },
];

const DEFAULT_BODY = BODY_PRESETS[0];

export function getBodyPreset(id: string): BodyPreset {
  return BODY_PRESETS.find((preset) => preset.id === id) ?? DEFAULT_BODY;
}
