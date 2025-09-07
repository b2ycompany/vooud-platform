import logging

# Configura um logger para imprimir no console do Render
logger = logging.getLogger(__name__)

class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log detalhado da requisição que está chegando
        log_data = {
            "method": request.method,
            "path": request.path,
            "headers": dict(request.headers),
        }
        logger.info("--- INCOMING REQUEST ---\n%s", log_data)

        # Deixa a requisição continuar seu fluxo normal
        response = self.get_response(request)

        # Log detalhado da resposta que está saindo
        log_data_response = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
        }
        logger.info("--- OUTGOING RESPONSE ---\n%s", log_data_response)

        return response