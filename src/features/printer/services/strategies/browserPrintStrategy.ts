import { Ticket } from "@/features/queue/types";
import { formatTime } from "@/utils/dateFormatter";
import { IPrinterService } from "../../types";

export class BrowserPrintStrategy implements IPrinterService {
  public async printTicket(ticket: Ticket): Promise<boolean> {
    return new Promise((resolve) => {
      // Cria um iframe invisível no DOM
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "-1000px";
      iframe.style.bottom = "-1000px";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        document.body.removeChild(iframe);
        resolve(false);
        return;
      }

      let config = { paperSize: "58mm", printBarcode: true, soundAlert: true };
      try {
        const stored = localStorage.getItem("printerConfig");
        if (stored) {
          config = { ...config, ...JSON.parse(stored) };
        }
      } catch (e) {
        console.error("Erro ao ler configurações da impressora", e);
      }

      const dateStr = new Date(ticket.createdAt).toLocaleDateString();
      const timeStr = formatTime(ticket.createdAt);
      const priorityLabel = ticket.priority === "Prioritário" ? "PRIORITÁRIO" : "GERAL";
      
      const is80mm = config.paperSize === "80mm";

      // Layout otimizado para bobinas térmicas de 58/80mm
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Impressão Senha</title>
          <style>
            @media print {
              @page {
                margin: 0;
                size: auto;
              }
              body {
                margin: 0;
                padding: 10px;
                font-family: 'Courier New', Courier, monospace;
                text-align: center;
                color: #000;
                width: 100%;
                box-sizing: border-box;
              }
              .header { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
              .header h1 { font-size: ${is80mm ? "18px" : "14px"}; margin: 0; text-transform: uppercase; }
              .header h2 { font-size: ${is80mm ? "14px" : "12px"}; margin: 2px 0; }
              .header p { font-size: ${is80mm ? "12px" : "10px"}; margin: 0; }
              
              .ticket-info { margin: 15px 0; }
              .category { font-size: ${is80mm ? "22px" : "18px"}; font-weight: bold; margin: 0; text-transform: uppercase; }
              .priority { font-size: ${is80mm ? "14px" : "12px"}; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;}
              .ticket-number { font-size: ${is80mm ? "54px" : "42px"}; font-weight: bold; margin: 5px 0; letter-spacing: -2px; }
              
              .details { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 15px 0; text-align: left; font-size: ${is80mm ? "13px" : "11px"}; font-weight: bold; }
              .details div { display: flex; justify-content: space-between; margin-bottom: 4px; }
              
              .footer { font-size: ${is80mm ? "12px" : "10px"}; font-weight: bold; }
              .footer p { margin: 2px 0; }
              .security-code { border: 1px dashed #000; padding: 5px; margin: 10px auto; width: 80%; }
              .security-code p { margin: 0; font-size: ${is80mm ? "11px" : "9px"}; text-transform: uppercase; letter-spacing: 1px; }
              .security-code h3 { margin: 2px 0 0 0; font-size: ${is80mm ? "22px" : "18px"}; letter-spacing: 4px; }
              
              .barcode-text { font-size: ${is80mm ? "11px" : "9px"}; letter-spacing: 3px; margin-top: 10px; display: ${config.printBarcode ? 'block' : 'none'}; }
            }
            body { font-family: 'Courier New', Courier, monospace; } /* Fallback for viewing */
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Município de Caruaru</h1>
            <h2>Secretaria da Fazenda Municipal</h2>
            <p>CNPJ: 10.091.536/0001-13</p>
          </div>
          
          <div class="ticket-info">
            <p class="category">${ticket.categoryName}</p>
            <p class="priority">${priorityLabel}</p>
            <p class="ticket-number">${ticket.ticketNumber}</p>
          </div>
          
          <div class="details">
            <div><span>DATA:</span> <span>${dateStr}</span></div>
            <div><span>HORA:</span> <span>${timeStr}</span></div>
            <div><span>POSTO:</span> <span>TRIAGEM CENTRAL</span></div>
          </div>
          
          <div class="footer">
            <p>AGUARDE SER CHAMADO NO PAINEL PRINCIPAL</p>
            <p>TEMPO MÉDIO DE ESPERA: 15 MIN</p>
            
            <div class="security-code">
              <p>CÓDIGO DE INICIALIZAÇÃO</p>
              <h3>${ticket.securityCode || "0000"}</h3>
            </div>
            
            ${config.printBarcode ? `<p class="barcode-text">*${ticket.ticketNumber}2024SFM*</p>` : ''}
          </div>
        </body>
        </html>
      `;

      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Aguarda o render da página no iframe antes de chamar a impressão
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Failed to print via browser:", e);
        } finally {
          // Remove o iframe do DOM após a execução do print 
          // Um pequeno delay garante que o print dialog não seja abortado no Firefox/Safari
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve(true);
          }, 1000);
        }
      }, 500);
    });
  }
}
