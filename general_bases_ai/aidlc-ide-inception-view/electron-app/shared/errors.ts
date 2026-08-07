import type { AppError } from './types'

export function appError(code: string, title: string, message: string): AppError {
  return { code, title, message }
}

export const LOGIN_FAILED = (): AppError =>
  appError(
    'login_failed',
    'Error de inicio de sesion',
    'No se pudo iniciar sesion. En GitLab suele hacer falta un Personal Access Token (PAT) en el campo de clave (Preferencias > Access Tokens), no la contrasena de la web. Revisa usuario, token y conexion.'
  )

export const BRANCH_MISSING = (): AppError =>
  appError(
    'branch_missing',
    'Rama no encontrada',
    'La rama dev no existe en este repositorio.'
  )

export const NETWORK_ERROR = (): AppError =>
  appError(
    'network_error',
    'Error de red',
    'No se pudo contactar el servidor. Intenta de nuevo.'
  )

/** Intentional abort (superseded request / unmount) — UI must ignore. */
export const REQUEST_CANCELLED = (): AppError =>
  appError(
    'request_cancelled',
    'Solicitud cancelada',
    'La solicitud fue reemplazada por otra mas reciente.'
  )

export function isRequestCancelled(error: AppError | null | undefined): boolean {
  return error?.code === 'request_cancelled'
}

export const VALIDATION_ERROR = (message: string): AppError =>
  appError('validation_error', 'Datos invalidos', message)

export const INCEPTION_MISSING = (): AppError =>
  appError(
    'inception_missing',
    'Documentacion no encontrada',
    'aidlc-docs/ no encontrado en este repositorio (rama dev).'
  )

export const FILE_NOT_PREVIEWABLE = (): AppError =>
  appError(
    'file_not_previewable',
    'Archivo no previsualizable',
    'Este tipo de archivo no se puede previsualizar.'
  )

export const DIFF_UNAVAILABLE = (): AppError =>
  appError(
    'diff_unavailable',
    'Sin cambios recientes',
    'No se pudo obtener el historial o el diff de este archivo en la rama dev.'
  )

export const DRAFT_ERROR = (): AppError =>
  appError(
    'draft_error',
    'Error de borrador',
    'No se pudo guardar o eliminar el borrador local.'
  )

export const AI_ERROR = (message?: string): AppError =>
  appError(
    'ai_error',
    'Error de IA (Amazon Nova)',
    message ||
      'No se pudo completar la solicitud a Amazon Bedrock. Revisa AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, region us-east-1 y acceso a Nova.'
  )

/** @deprecated use AI_ERROR */
export const GEMINI_ERROR = AI_ERROR

export const PUBLISH_ERROR = (message?: string): AppError =>
  appError(
    'publish_error',
    'Error al solicitar cambios',
    message || 'No se pudo crear el commit o el Merge Request hacia dev.'
  )
