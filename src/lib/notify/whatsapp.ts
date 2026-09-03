import { env } from '@/config/env';

// Envio via API REST do Twilio (Basic Auth + form-encoded) com fetch puro —
// sem instalar o SDK oficial pra uma única chamada. `to` já deve estar em
// E.164 (ver src/lib/utils/phone.ts). Nunca lança: falha de notificação não
// pode derrubar um pedido de acesso já salvo no banco.
export async function sendWhatsApp(input: {
  to: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_FROM) {
    return {
      ok: false,
      error: 'TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM não configurados',
    };
  }

  try {
    const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString(
      'base64',
    );
    const params = new URLSearchParams({
      From: `whatsapp:${env.TWILIO_WHATSAPP_FROM}`,
      To: `whatsapp:${input.to}`,
      Body: input.body,
    });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      },
    );
    if (!response.ok) return { ok: false, error: `Twilio respondeu ${response.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Falha ao enviar WhatsApp' };
  }
}
