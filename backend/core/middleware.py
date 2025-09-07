from django.http import HttpResponse

class CorsPreflightMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Se a requisição for do tipo OPTIONS (preflight), nós a interceptamos.
        if request.method == "OPTIONS":
            # Criamos uma resposta vazia de sucesso.
            response = HttpResponse(status=200)
            # Adicionamos manualmente todos os cabeçalhos que o navegador precisa.
            response["Access-Control-Allow-Origin"] = "*" # Permite qualquer origem
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-CSRFToken"
            response["Access-Control-Max-Age"] = "86400" # Quanto tempo o navegador pode cachear esta resposta
            return response

        # Se não for uma requisição OPTIONS, a vida segue normal.
        return self.get_response(request)