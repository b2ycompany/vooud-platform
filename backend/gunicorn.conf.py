# gunicorn.conf.py
# Configuração para o Gunicorn rodar em plataformas como o Render

# O Render nos informa qual o host e a porta através de variáveis de ambiente
# Gunicorn irá escutar em 0.0.0.0:10000 (ou outra porta que o Render designar)
bind = "0.0.0.0:10000"

# Diz ao Gunicorn para confiar nos cabeçalhos de proxy enviados pelo Render
# Isso é crucial para o Django saber o domínio correto da requisição
forwarded_allow_ips = "*"