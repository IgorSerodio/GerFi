#!/bin/sh

# Diretório para os certificados
CERT_DIR="/etc/nginx/ssl"
CERT_FILE="$CERT_DIR/nginx.crt"
KEY_FILE="$CERT_DIR/nginx.key"

# Se o certificado não existir, nós o criamos
if [ ! -f "$CERT_FILE" ]; then
  echo ">>> Certificado SSL não encontrado. Gerando certificado autoassinado..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=BR/ST=State/L=City/O=GerFi/CN=localhost"
  echo ">>> Certificado gerado com sucesso."
else
  echo ">>> Certificado SSL já existe."
fi

# Inicia o Nginx em foreground
echo ">>> Iniciando Nginx..."
exec nginx -g "daemon off;"
