FROM nginx:alpine

# Instala o openssl para gerar o certificado autoassinado
RUN apk add --no-cache openssl

# Copia as configurações do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o script de entrypoint e dá permissão de execução
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Configura o entrypoint
ENTRYPOINT ["/entrypoint.sh"]
