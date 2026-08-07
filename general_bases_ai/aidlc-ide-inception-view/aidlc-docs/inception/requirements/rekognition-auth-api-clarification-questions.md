# Aclaracion — Auth API: Cognito (no Rekognition)

Detecte contradicciones / cambio de alcance en tus respuestas:

- **Q6, Q7, Q8, Q12, Q16**: indicaste `X` — *“me equivoque de servicio es AWS Cognito”*.
- El documento original asumia **Amazon Rekognition** (rostro/camara).
- **Q14 = C** (authorizer Cognito / JWT) es coherente con Cognito, no con Rekognition.

Por favor responde estas aclaraciones. El resto de respuestas (Q1–Q5, Q9–Q11, Q13, Q15, Q17) se mantienen salvo que digas lo contrario.

---

## Aclaracion 1
¿Confirmas que el servicio de autenticacion es **Amazon Cognito** (no Rekognition / no biometria facial)?

A) Si — Cognito User Pool (usuarios/contraseña o flujos Cognito estandar)

B) Si — Cognito Identity Pool (credenciales temporales AWS) ademas o en lugar de User Pool (describe en X si hace falta)

C) Ambos: User Pool para login + Identity Pool si hace falta

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: X A con MAF

---

## Aclaracion 2
¿Como inicia sesion el usuario en la app Electron?

A) Usuario + contraseña contra Cognito (UI propia en Electron; `InitiateAuth` / SDK)

B) Cognito Hosted UI / pantalla web embebida (OAuth / Authorization Code)

C) SSO corporativo federado en Cognito (SAML/OIDC; IdP externo)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Aclaracion 3
Tras login Cognito exitoso, ¿la API SAM que devuelve el Secret `.env` se protege como?

A) API Gateway con **JWT authorizer** de Cognito (access/id token); Lambda lee Secrets Manager y responde el JSON del `.env`

B) La propia Lambda valida el token Cognito (sin authorizer de API Gateway)

C) Cognito solo autentica en la app; la API usa otro esquema (API Key) — describe en X si aplica

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Aclaracion 4
¿Cuando debe ejecutarse el login Cognito en Electron? (reemplaza Q12)

A) Siempre al arrancar, **antes** de nombre/apellido y de cualquier recoleccion de datos

B) Solo cuando `AIDLC_DEV_MODE=false` (en `true` seguir con env/.env local sin llamar a la API)

C) Siempre al arrancar, pero en `AIDLC_DEV_MODE=true` permitir bypass documentado

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Aclaracion 5
¿Como se crean / gestionan los usuarios Cognito?

A) Fuera de esta app (consola AWS / admin / script); la app solo hace login

B) Incluir registro (sign-up) en la app Electron en este trabajo

C) Un unico usuario compartido (service account) para todos los que usen el escritorio

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Aclaracion 6
Las preguntas de camara / umbral facial (Q8, Q16) y enrolamiento facial (Q7) quedan **fuera de alcance**. ¿Confirmas?

A) Si — no hay captura de rostro ni Rekognition en este delta

B) No — quiero biometria ademas de Cognito (describe en X)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Aclaracion 7
Tras Cognito + API, ¿Q13=A sigue valido? (eliminar formulario Access Key/Secret y `aws-credentials.json`; todo viene del Secret via API)

A) Si — eliminar ese formulario; credenciales solo en memoria tras API

B) No — mantener fallback local (describe en X)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A
