-- =====================================================================
-- AI CRM Backend - Limpieza OAuth Google Users (LOCAL/DEV)
-- MySQL Workbench compatible
-- ---------------------------------------------------------------------
-- IMPORTANTE:
-- - NO ejecutar en produccion.
-- - NO usa TRUNCATE.
-- - NO borra tablas ni migraciones.
-- - Ejecutar por bloques y revisar SELECT antes de DELETE.
-- =====================================================================

-- #####################################################################
-- 0) PARAMETROS Y TABLAS AUXILIARES
-- #####################################################################

DROP TEMPORARY TABLE IF EXISTS tmp_target_emails;
CREATE TEMPORARY TABLE tmp_target_emails (
  email varchar(255) NOT NULL PRIMARY KEY
);

INSERT INTO tmp_target_emails (email) VALUES
  ('diliawg367@gmail.com'),
  ('walterpruebasl123@gmail.com');

DROP TEMPORARY TABLE IF EXISTS tmp_target_users;
CREATE TEMPORARY TABLE tmp_target_users (
  id char(36) NOT NULL PRIMARY KEY,
  companyId char(36) NOT NULL,
  email varchar(255) NOT NULL
);

DROP TEMPORARY TABLE IF EXISTS tmp_target_provider_user_ids;
CREATE TEMPORARY TABLE tmp_target_provider_user_ids (
  provider_user_id varchar(255) NOT NULL PRIMARY KEY
);

DROP TEMPORARY TABLE IF EXISTS tmp_target_companies;
CREATE TEMPORARY TABLE tmp_target_companies (
  id char(36) NOT NULL PRIMARY KEY
);

DROP TEMPORARY TABLE IF EXISTS tmp_target_customers;
CREATE TEMPORARY TABLE tmp_target_customers (
  id char(36) NOT NULL PRIMARY KEY
);

-- Cargar users target por email
INSERT IGNORE INTO tmp_target_users (id, companyId, email)
SELECT u.id, u.companyId, u.email
FROM users u
JOIN tmp_target_emails te ON te.email = u.email;

-- Cargar provider_user_id relacionados (desde sessions)
INSERT IGNORE INTO tmp_target_provider_user_ids (provider_user_id)
SELECT ors.provider_user_id
FROM oauth_registration_sessions ors
JOIN tmp_target_emails te ON te.email = ors.email
WHERE ors.provider = 'google'
  AND ors.provider_user_id IS NOT NULL
  AND TRIM(ors.provider_user_id) <> '';

-- Cargar provider_user_id relacionados (desde oauth_identities)
INSERT IGNORE INTO tmp_target_provider_user_ids (provider_user_id)
SELECT oi.provider_user_id
FROM oauth_identities oi
JOIN tmp_target_emails te ON te.email = oi.email
WHERE oi.provider = 'google'
  AND oi.provider_user_id IS NOT NULL
  AND TRIM(oi.provider_user_id) <> '';

-- Cargar companies target desde users target
INSERT IGNORE INTO tmp_target_companies (id)
SELECT DISTINCT tu.companyId
FROM tmp_target_users tu;

-- Cargar customers target por company
INSERT IGNORE INTO tmp_target_customers (id)
SELECT c.id
FROM customers c
JOIN tmp_target_companies tc ON tc.id = c.companyId;

-- #####################################################################
-- 1) DIAGNOSTICO (NO BORRA NADA)
-- #####################################################################

-- 1.1 Users duplicados por email
SELECT u.email, COUNT(*) AS total
FROM users u
GROUP BY u.email
HAVING COUNT(*) > 1;

-- 1.2 OAuth identities duplicadas por provider_user_id (Google)
SELECT oi.provider, oi.provider_user_id, COUNT(*) AS total
FROM oauth_identities oi
WHERE oi.provider = 'google'
GROUP BY oi.provider, oi.provider_user_id
HAVING COUNT(*) > 1;

-- 1.3 Sesiones pending antiguas (> 30 min)
SELECT ors.*
FROM oauth_registration_sessions ors
WHERE ors.provider = 'google'
  AND ors.status = 'pending'
  AND ors.created_at < (NOW() - INTERVAL 30 MINUTE)
ORDER BY ors.created_at ASC;

-- 1.4 OAuth identities huerfanas (user inexistente)
SELECT oi.*
FROM oauth_identities oi
LEFT JOIN users u ON u.id = oi.user_id
WHERE u.id IS NULL;

-- 1.5 Users sin company
SELECT u.*
FROM users u
LEFT JOIN companies c ON c.id = u.companyId
WHERE c.id IS NULL;

-- 1.6 Companies huerfanas (sin users)
SELECT c.*
FROM companies c
LEFT JOIN users u ON u.companyId = c.id
WHERE u.id IS NULL;

-- 1.7 Inconsistencia users legacy Google
SELECT u.*
FROM users u
WHERE u.identificationType = 'GOOGLE'
   OR u.identificationNumber LIKE 'GOOGLE-%';

-- 1.8 Preview de impacto para estos emails
SELECT 'target_emails' AS entity, COUNT(*) AS total FROM tmp_target_emails
UNION ALL
SELECT 'target_users', COUNT(*) FROM tmp_target_users
UNION ALL
SELECT 'target_provider_user_ids', COUNT(*) FROM tmp_target_provider_user_ids
UNION ALL
SELECT 'target_companies', COUNT(*) FROM tmp_target_companies
UNION ALL
SELECT 'target_customers', COUNT(*) FROM tmp_target_customers;

-- Conteo de registros a borrar (limpieza minima)
SELECT 'oauth_registration_sessions' AS table_name, COUNT(*) AS rows_to_delete
FROM oauth_registration_sessions ors
JOIN tmp_target_emails te ON te.email = ors.email
UNION ALL
SELECT 'oauth_identities_by_email', COUNT(*)
FROM oauth_identities oi
JOIN tmp_target_emails te ON te.email = oi.email
WHERE oi.provider = 'google'
UNION ALL
SELECT 'oauth_identities_by_user', COUNT(*)
FROM oauth_identities oi
JOIN tmp_target_users tu ON tu.id = oi.user_id
WHERE oi.provider = 'google'
UNION ALL
SELECT 'users', COUNT(*)
FROM users u
JOIN tmp_target_users tu ON tu.id = u.id;

-- #####################################################################
-- 2) LIMPIEZA MINIMA RECOMENDADA (COPY/PASTE)
-- ---------------------------------------------------------------------
-- Objetivo: reprobar OAuth desde cero con los mismos emails.
-- Orden:
--   1) oauth_registration_sessions
--   2) oauth_identities
--   3) users
-- #####################################################################

-- START TRANSACTION;

-- 2.1 Borrar sesiones OAuth por email
DELETE ors
FROM oauth_registration_sessions ors
JOIN tmp_target_emails te ON te.email = ors.email;

-- 2.2 Borrar identities OAuth por user target
DELETE oi
FROM oauth_identities oi
JOIN tmp_target_users tu ON tu.id = oi.user_id
WHERE oi.provider = 'google';

-- 2.3 Borrar identities OAuth por email target (seguridad extra)
DELETE oi
FROM oauth_identities oi
JOIN tmp_target_emails te ON te.email = oi.email
WHERE oi.provider = 'google';

-- 2.4 Borrar users target
DELETE u
FROM users u
JOIN tmp_target_users tu ON tu.id = u.id;

-- COMMIT;
-- ROLLBACK;

-- #####################################################################
-- 3) BLOQUE EXTENDIDO OPCIONAL (SI HAY FK ERROR AL BORRAR USERS)
-- ---------------------------------------------------------------------
-- Ejecutar solo si las companies target son de pruebas.
-- Limpia dependencias por company y luego users/companies.
-- #####################################################################

-- Verificar si hay users no target dentro de companies target
SELECT tc.id AS company_id, COUNT(u.id) AS non_target_users
FROM tmp_target_companies tc
LEFT JOIN users u
  ON u.companyId = tc.id
 AND u.id NOT IN (SELECT id FROM tmp_target_users)
GROUP BY tc.id
HAVING COUNT(u.id) > 0;

-- START TRANSACTION;

-- 3.1 payment_transactions
DELETE pt
FROM payment_transactions pt
JOIN tmp_target_companies tc ON tc.id = pt.company_id;

-- 3.2 order_items -> orders
DELETE oi
FROM order_items oi
JOIN orders o ON o.id = oi.orderId
JOIN tmp_target_companies tc ON tc.id = o.companyId;

-- 3.3 orders
DELETE o
FROM orders o
JOIN tmp_target_companies tc ON tc.id = o.companyId;

-- 3.4 cart_items -> cart_sessions
DELETE ci
FROM cart_items ci
JOIN cart_sessions cs ON cs.id = ci.cart_session_id
JOIN tmp_target_companies tc ON tc.id = cs.company_id;

-- 3.5 cart_sessions
DELETE cs
FROM cart_sessions cs
JOIN tmp_target_companies tc ON tc.id = cs.company_id;

-- 3.6 messages -> conversations
DELETE m
FROM messages m
JOIN conversations cv ON cv.id = m.conversationId
JOIN tmp_target_companies tc ON tc.id = cv.companyId;

-- 3.7 conversation_states -> conversations
DELETE cst
FROM conversation_states cst
JOIN conversations cv ON cv.id = cst.conversation_id
JOIN tmp_target_companies tc ON tc.id = cv.companyId;

-- 3.8 conversations
DELETE cv
FROM conversations cv
JOIN tmp_target_companies tc ON tc.id = cv.companyId;

-- 3.9 external_identities -> customers
DELETE ei
FROM external_identities ei
JOIN customers c ON c.id = ei.customer_id
JOIN tmp_target_companies tc ON tc.id = c.companyId;

-- 3.10 customers
DELETE c
FROM customers c
JOIN tmp_target_companies tc ON tc.id = c.companyId;

-- 3.11 oauth_registration_sessions por email target
DELETE ors
FROM oauth_registration_sessions ors
JOIN tmp_target_emails te ON te.email = ors.email;

-- 3.12 oauth_identities por user/email target
DELETE oi
FROM oauth_identities oi
JOIN tmp_target_users tu ON tu.id = oi.user_id
WHERE oi.provider = 'google';

DELETE oi
FROM oauth_identities oi
JOIN tmp_target_emails te ON te.email = oi.email
WHERE oi.provider = 'google';

-- 3.13 users target
DELETE u
FROM users u
JOIN tmp_target_users tu ON tu.id = u.id;

-- 3.14 companies huérfanas target
DELETE c
FROM companies c
JOIN tmp_target_companies tc ON tc.id = c.id
LEFT JOIN users u ON u.companyId = c.id
WHERE u.id IS NULL;

-- COMMIT;
-- ROLLBACK;

-- #####################################################################
-- 4) VALIDACIONES POST-LIMPIEZA
-- #####################################################################

-- 4.1 Emails target en users/oauth/sessions
SELECT 'users_remaining' AS check_name, COUNT(*) AS total
FROM users u
JOIN tmp_target_emails te ON te.email = u.email
UNION ALL
SELECT 'oauth_identities_remaining_by_email', COUNT(*)
FROM oauth_identities oi
JOIN tmp_target_emails te ON te.email = oi.email
WHERE oi.provider = 'google'
UNION ALL
SELECT 'oauth_registration_sessions_remaining', COUNT(*)
FROM oauth_registration_sessions ors
JOIN tmp_target_emails te ON te.email = ors.email;

-- 4.2 Pending Google sessions
SELECT COUNT(*) AS pending_google_sessions
FROM oauth_registration_sessions
WHERE provider = 'google'
  AND status = 'pending';

-- 4.3 Integridad básica
SELECT COUNT(*) AS orphan_oauth_identities
FROM oauth_identities oi
LEFT JOIN users u ON u.id = oi.user_id
WHERE u.id IS NULL;

SELECT COUNT(*) AS orphan_users_without_company
FROM users u
LEFT JOIN companies c ON c.id = u.companyId
WHERE c.id IS NULL;

SELECT COUNT(*) AS orphan_companies_without_users
FROM companies c
LEFT JOIN users u ON u.companyId = c.id
WHERE u.id IS NULL;

-- =====================================================================
-- FIN
-- =====================================================================

