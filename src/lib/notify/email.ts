import { env } from '@/config/env';

// Envio via API REST do Resend com fetch puro — sem instalar o SDK oficial
// pra uma única chamada. Nunca lança: falha de notificação não pode
// derrubar um pedido de acesso já salvo no banco.
export async function sendEmail(input: {
  to: string[];
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return { ok: false, error: 'RESEND_API_KEY/RESEND_FROM_EMAIL não configurados' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!response.ok) return { ok: false, error: `Resend respondeu ${response.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Falha ao enviar e-mail' };
  }
}
