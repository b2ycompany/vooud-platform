import logging

# Configura um logger para imprimir no console do Render
logger = logging.getLogger(__name__)

class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log detalhado da requisição que está chegando
        logger.info("--- INCOMING REQUEST ---")
        logger.info(f"METHOD: {request.method}")
        logger.info(f"PATH: {request.path}")
        logger.info("HEADERS:")
        for header, value in request.headers.items():
            logger.info(f"  {header}: {value}")
        
        # Deixa a requisição continuar seu fluxo normal
        response = self.get_response(request)
        
        # Log detalhado da resposta que está saindo
        logger.info("--- OUTGOING RESPONSE ---")
        logger.info(f"STATUS_CODE: {response.status_code}")
        logger.info("HEADERS:")
        for header, value in response.headers.items():
            logger.info(f"  {header}: {value}")

        return response