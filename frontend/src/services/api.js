// Configuración de API Gateway e integración REST con microservicios .NET
// Configurable con VITE_API_URL (ver frontend/.env.example); por defecto el Gateway local
const GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_DIRECT_URL = 'http://localhost:5001/api/auth';
const SIMULATOR_DIRECT_URL = 'http://localhost:5002/api/simulator';

export const getAuthToken = () => localStorage.getItem('simulator_token');
export const setAuthToken = (token) => localStorage.setItem('simulator_token', token);
export const removeAuthToken = () => localStorage.removeItem('simulator_token');

// Lee la respuesta como JSON; si el cuerpo viene vacío (p. ej. un 401) devuelve un objeto de error legible.
const parseResponse = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // cuerpo vacío o no JSON
  }

  if (response.status === 401) {
    return { success: false, status: 401, message: 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.' };
  }

  return body ?? { success: false, status: response.status, message: `Error ${response.status} del servidor.` };
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  // Intentar la solicitud a través del API Gateway
  let url = `${GATEWAY_URL}${endpoint}`;

  try {
    const response = await fetch(url, { ...options, headers });
    return await parseResponse(response);
  } catch (err) {
    console.warn(`Gateway no disponible en ${url}. Conmutando a microservicio directo...`, err);

    // Fallback a endpoints directos si el Gateway no está respondiendo
    if (endpoint.startsWith('/auth')) {
      url = `${AUTH_DIRECT_URL}${endpoint.replace('/auth', '')}`;
    } else if (endpoint.startsWith('/simulator')) {
      url = `${SIMULATOR_DIRECT_URL}${endpoint.replace('/simulator', '')}`;
    }

    try {
      const fallbackResponse = await fetch(url, { ...options, headers });
      return await parseResponse(fallbackResponse);
    } catch (fallbackErr) {
      console.warn(`No se pudo conectar al servicio directo en ${url}.`, fallbackErr);
      return {
        success: false,
        networkError: true,
        message: 'No se pudo establecer conexión con los servicios backend. Verifica que los servicios estén activos.'
      };
    }
  }
};
