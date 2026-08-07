import { VALIDATION_ERROR } from '../../shared/errors'
import type { AppError } from '../../shared/types'

/** Map HTTP status / transport failures to Spanish UI errors (no raw API body). */
export function mapAuthHttpError(
  status: number | null,
  kind: 'login' | 'config' | 'newPassword'
): AppError {
  if ((status === 400 || status === 401) && kind === 'newPassword') {
    return VALIDATION_ERROR(
      'La contrasena no cumple la politica: minimo 8 caracteres, mayuscula, minuscula y numero. No puede ser igual a la temporal. Si el problema continua, vuelve a iniciar sesion.'
    )
  }
  if (status === 401 && kind === 'login') {
    return VALIDATION_ERROR('Credenciales invalidas. Verifica usuario y contrasena.')
  }
  if (status === 401 || status === 403) {
    return VALIDATION_ERROR('La sesion no es valida. Inicia sesion de nuevo.')
  }
  if (status === 404 && kind === 'config') {
    return VALIDATION_ERROR(
      'No se pudo cargar la configuracion. Contacta al administrador.'
    )
  }
  if (status === 429) {
    return VALIDATION_ERROR('Demasiados intentos. Espera un momento e intenta de nuevo.')
  }
  if (status !== null && status >= 500) {
    return VALIDATION_ERROR('Error del servicio de autenticacion. Intenta de nuevo.')
  }
  if (status === null) {
    return VALIDATION_ERROR(
      'No hay conexion con el servicio de autenticacion. Intenta de nuevo.'
    )
  }
  return VALIDATION_ERROR('No se pudo completar la autenticacion. Intenta de nuevo.')
}

export function sessionAlreadyActiveError(): AppError {
  return VALIDATION_ERROR('Cierra sesion antes de iniciar otra.')
}

export function missingApiUrlError(): AppError {
  return VALIDATION_ERROR(
    'Falta AIDLC_CONFIG_API_URL. Configurala en .env y reinicia la aplicacion.'
  )
}
