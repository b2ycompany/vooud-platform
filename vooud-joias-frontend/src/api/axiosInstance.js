import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// A baseURL agora usa a variável de ambiente em produção,
// ou o endereço local em desenvolvimento.
const baseURL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: { 'Content-Type': 'application/json' }
});

axiosInstance.interceptors.request.use(async req => {
    const authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;
    if (!authTokens) {
        return req;
    }

    const user = jwtDecode(authTokens.access);
    const isExpired = new Date(user.exp * 1000) < new Date();

    if (!isExpired) {
        req.headers.Authorization = `Bearer ${authTokens.access}`;
        return req;
    }

    try {
        const response = await axios.post(`${baseURL}/api/token/refresh/`, {
            refresh: authTokens.refresh
        });
        localStorage.setItem('authTokens', JSON.stringify(response.data));
        req.headers.Authorization = `Bearer ${response.data.access}`;
        return req;
    } catch (error) {
        localStorage.removeItem('authTokens');
        console.error("Erro ao atualizar o token, usuário deslogado.", error);
        return Promise.reject(error);
    }
});

export default axiosInstance;