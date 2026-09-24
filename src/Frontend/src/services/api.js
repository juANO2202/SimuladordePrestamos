// Configuración de API Gateway e integración REST con microservicios .NET
const GATEWAY_URL = 'http://localhost:5000/api';
const AUTH_DIRECT_URL = 'http://localhost:5001/api/auth';
const SIMULATOR_DIRECT_URL = 'http://localhost:5002/api/simulator';

export const getAuthToken = () => localStorage.getItem('simulator_token');
export const setAuthToken = (token) => localStorage.setItem('simulator_token', token);
export const removeAuthToken = () => localStorage.removeItem('simulator_token');

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
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.warn(`Gateway deshabilitado o no disponible en ${url}. Conmutando a microservicio directo...`, err);

    // Fallback a endpoints directos si el Gateway no está respondiendo
    if (endpoint.startsWith('/auth')) {
      url = `${AUTH_DIRECT_URL}${endpoint.replace('/auth', '')}`;
    } else if (endpoint.startsWith('/simulator')) {
      url = `${SIMULATOR_DIRECT_URL}${endpoint.replace('/simulator', '')}`;
    }

    try {
      const fallbackResponse = await fetch(url, {
        ...options,
        headers
      });

      const data = await fallbackResponse.json();
      return data;
    } catch (fallbackErr) {
      console.warn(`No se pudo conectar al servicio directo en ${url}.`, fallbackErr);
      return {
        success: false,
        message: 'No se pudo establecer conexión con los servicios backend. Verifica que los servicios estén activos.'
      };
    }
  }
};
