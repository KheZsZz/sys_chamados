import { NotificationType } from '@/schemas/enum.schema';

export interface EmailTemplateData {
  userName?: string | null;
  ticketTitle: string;
  oldStatus?: string;
  newStatus?: string;
}

interface EmailContent {
  subject: string;
  html: string;
}

export function buildEmailContent(type: NotificationType, data: EmailTemplateData): EmailContent {
  const greeting = `Olá${data.userName ? `, ${data.userName}` : ''}`;

  switch (type) {
    case 'TICKET_CREATED':
      return {
        subject: `Chamado aberto: ${data.ticketTitle}`,
        html: `<p>${greeting},</p><p>Seu chamado <strong>${data.ticketTitle}</strong> foi aberto com sucesso e está aguardando atendimento.</p>`,
      };

    case 'TICKET_ASSIGNED':
      return {
        subject: `Novo chamado atribuído a você: ${data.ticketTitle}`,
        html: `<p>${greeting},</p><p>O chamado <strong>${data.ticketTitle}</strong> foi atribuído a você. Acesse a plataforma para mais detalhes.</p>`,
      };

    case 'TICKET_STATUS_CHANGED':
      return {
        subject: `Status atualizado: ${data.ticketTitle}`,
        html: `<p>${greeting},</p><p>O status do seu chamado <strong>${data.ticketTitle}</strong> mudou${
          data.oldStatus && data.newStatus
            ? ` de <strong>${data.oldStatus}</strong> para <strong>${data.newStatus}</strong>`
            : ''
        }.</p>`,
      };

    case 'NEW_COMMENT':
      return {
        subject: `Novo comentário: ${data.ticketTitle}`,
        html: `<p>${greeting},</p><p>Há um novo comentário no seu chamado <strong>${data.ticketTitle}</strong>.</p>`,
      };

    case 'SLA_BREACHED':
      return {
        subject: `⚠️ SLA estourado: ${data.ticketTitle}`,
        html: `<p>${greeting},</p><p>O prazo de SLA do chamado <strong>${data.ticketTitle}</strong> foi ultrapassado. Uma ação é necessária.</p>`,
      };

    default:
      return {
        subject: `Atualização no chamado: ${data.ticketTitle}`,
        html: `<p>${greeting},</p><p>Há uma atualização no chamado <strong>${data.ticketTitle}</strong>.</p>`,
      };
  }
}
